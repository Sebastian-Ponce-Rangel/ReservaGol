import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

const rutaSrc = fileURLToPath(new URL('./src', import.meta.url));
const rutaData = fileURLToPath(new URL('./data', import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: /^@data\//, replacement: `${rutaData}/` },
      { find: /^@\//, replacement: `${rutaSrc}/` },
    ],
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
});
