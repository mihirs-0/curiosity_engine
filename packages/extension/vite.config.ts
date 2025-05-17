import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import { crx } from 'vite-plugin-chrome-extension';

export default defineConfig({
  plugins: [preact(), crx({ manifest: './manifest.json' })],
}); 