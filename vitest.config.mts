import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
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
