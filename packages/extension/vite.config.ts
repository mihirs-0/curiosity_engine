
import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import { resolve } from 'path';
import { access, rename, rm } from 'fs/promises';

export default defineConfig({
  plugins: [
    preact(),
    // ← this plugin runs *after* the build is finished
    {
      name: 'flatten-html',
      apply: 'build',
      async writeBundle() {
        const root = resolve(__dirname, 'dist');
        for (const [from, to] of [
          ['src/popup/index.html', 'popup.html'],
          ['src/sidepanel/index.html', 'sidepanel.html']
        ] as const) {
          const src = resolve(root, from);
          const dst = resolve(root, to);
          try {
            await access(src);
            await rename(src, dst);
          } catch {
            /* skip missing */
          }
        }
        // remove the now-empty tree
        await rm(resolve(root, 'src'), { recursive: true, force: true });
      }
    }
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    copyPublicDir: true,
    assetsDir: 'assets',
    sourcemap: true,

    rollupOptions: {
      input: {
        popup     : resolve(__dirname, 'src/popup/index.html'),
        sidepanel : resolve(__dirname, 'src/sidepanel/index.html'),
        background: resolve(__dirname, 'src/background/index.ts'),
        content   : resolve(__dirname, 'src/content-script/index.ts'),
      },
      output: {
        /** deterministic names for the two files referenced from manifest */
        entryFileNames(chunk) {
          if (chunk.name === 'background') return 'background/index.js';
          if (chunk.name === 'content')    return 'content-script/index.js';
          return 'assets/[name]-[hash].js';
        },
        chunkFileNames : 'assets/[name]-[hash].js',

        /** FLATTEN html:  src/popup/index.html -> popup.html
         *  leave icons untouched, everything else hashed in assets/         */
        assetFileNames(assetInfo) {
          const file = assetInfo.name || '';

          // flatten the two HTML entry pages
          if (file.endsWith('.html')) return file.split('/').pop()!;

          // keep icons at dist/icons/…
          if (file.startsWith('icons/'))   return file;

          // everything else -> dist/assets/…
          return 'assets/[name]-[hash][extname]';
        }
      }
    }
  },

  resolve: {
    alias: { '@': resolve(__dirname, 'src') },
    extensions: ['.tsx', '.ts', '.jsx', '.js', '.json']
  }
});