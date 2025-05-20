import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import { resolve } from 'path';

export default defineConfig({
  plugins: [preact()],
  build: {
    rollupOptions: {
      // The keys here become your filenames:
      input: {
        popup:      resolve(__dirname, 'src/popup/index.html'),       // → dist/popup.html
        sidepanel:  resolve(__dirname, 'src/sidepanel/index.html'),   // → dist/sidepanel.html
        'content-script': resolve(__dirname, 'src/content-script.ts'),// → dist/content-script.js
        background: resolve(__dirname, 'src/background.ts')           // → dist/background.js
      },
      output: {
        entryFileNames: (chunkInfo) => {
          return chunkInfo.name === 'content-script' || chunkInfo.name === 'background'
            ? '[name].js'
            : 'assets/[name]-[hash].js';
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]'
      }
    },
    outDir: 'dist',
    emptyOutDir: true,
    copyPublicDir: true,
    assetsDir: 'assets',
    sourcemap: true,
    modulePreload: {
      polyfill: true,
      resolveDependencies: (filename, deps, { hostId, hostType }) => {
        return deps;
      }
    }
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.jsx', '.js', '.json'],
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  publicDir: 'public'
});