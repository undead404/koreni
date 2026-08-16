import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    css: {
      modules: {
        classNameStrategy: 'non-scoped',
      },
    },
    environment: 'jsdom',
    setupFiles: ['vitest.setup.ts'],
    exclude: ['node_modules', 'src/server', 'src/daily-report', '.opencode'],
  },
});
