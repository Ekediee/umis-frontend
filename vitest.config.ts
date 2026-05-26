import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  resolve: {
    alias: {
      // Shim Next.js's "server-only" guard — it's a no-op in tests
      'server-only': new URL('./test-utils/server-only-shim.ts', import.meta.url).pathname,
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
