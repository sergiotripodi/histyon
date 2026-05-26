import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    environment: 'node',
    setupFiles:  ['./tests/setup.ts'],
    include:     ['tests/unit/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include:  ['lib/**/*.ts', 'app/api/**/*.ts'],
      exclude:  ['lib/supabase/**', '**/*.d.ts'],
    },
  },
})
