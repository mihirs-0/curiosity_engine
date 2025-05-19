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
        entryFileNames: '[name].js',             // popup.js, sidepanel.js, content-script.js, background.js
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]'
      }
    },
    outDir: 'dist',
    emptyOutDir: true,
    copyPublicDir: true,
    assetsDir: 'assets'
  },
  publicDir: 'public'
});