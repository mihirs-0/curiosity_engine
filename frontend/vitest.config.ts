/// <reference types="vitest" />
/// <reference types="vite/client" />

import { defineConfig, mergeConfig } from 'vite'
import { defineConfig as defineVitestConfig } from 'vitest/config'
import react from '@vitejs/plugin-react-swc'

declare module '@vitejs/plugin-react-swc'

const viteConfig = defineConfig({
  plugins: [react()]
})

const vitestConfig = defineVitestConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/setup.ts',
      ],
    },
  },
})

export default mergeConfig(viteConfig, vitestConfig) 