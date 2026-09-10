import { defineConfig } from 'vitest/config';
import swc from 'unplugin-swc';

export default defineConfig({
  plugins: [swc.vite()],
  test: {
    pool: 'threads',
    coverage: {
      provider: 'v8',
      reporter: ['html'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.module.ts', 'src/**/*.types.ts'],
      thresholds: { 100: true },
    },
    projects: [
      {
        test: {
          name: 'e2e',
          include: ['test/e2e/**/*.test.ts'],
        },
      },
      {
        test: {
          name: 'integration',
          include: ['test/integration/**/*.test.ts'],
        },
      },
      {
        test: {
          name: 'unit',
          include: ['test/unit/**/*.test.ts'],
        },
      },
    ],
  },
});
