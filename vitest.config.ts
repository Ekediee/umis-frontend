import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import path from 'path'

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  resolve: {
    alias: {
      // Shim Next.js's "server-only" guard — it's a no-op in tests
      'server-only': path.resolve(__dirname, './test-utils/server-only-shim.ts'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    // Run test files sequentially to avoid OOM when Docker is also running
    fileParallelism: false,
  },
})
