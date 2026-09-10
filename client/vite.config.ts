import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());
  return {
    server: {
      host: env.VITE_HOST,
      port: parseInt(env.VITE_PORT),
      strictPort: true,
    },
    plugins: [react()],
    test: {
      pool: 'threads',
      include: ['test/**/*.test.ts'],
      coverage: {
        provider: 'v8',
        reporter: ['html'],
        include: ['src/**/*.ts'],
        thresholds: { 100: true },
      },
    },
  };
});
