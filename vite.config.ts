/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { mockApiPlugin } from './mock-api/vitePlugin.ts'

export default defineConfig({
  plugins: [react(), tailwindcss(), mockApiPlugin()],
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
})
