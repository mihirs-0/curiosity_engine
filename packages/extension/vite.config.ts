import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';

export default defineConfig({
  plugins: [preact()],
  build: {
    rollupOptions: {
      input: {
        sidepanel: 'src/sidepanel/index.html',
        popup: 'src/popup/index.html',
        content: 'src/content-script.ts'
      }
    },
    outDir: 'dist',
    emptyOutDir: true
  }
}); 