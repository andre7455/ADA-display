import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  root: '.',
  cacheDir: 'node_modules/.vite-test',
  plugins: [svelte({ configFile: 'tooling/svelte.config.js' })],
  resolve: {
    conditions: ['browser'],
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tooling/tests/setup.js'],
    include: ['tooling/tests/**/*.test.js'],
  },
});
