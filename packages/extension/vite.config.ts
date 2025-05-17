import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';

export default defineConfig({
  plugins: [preact()],
  build: {
    rollupOptions: {
      input: {
        sidepanel: 'src/sidepanel.html',
        popup: 'popup.html'
      }
    },
    outDir: 'dist',
    emptyOutDir: true
  }
}); 