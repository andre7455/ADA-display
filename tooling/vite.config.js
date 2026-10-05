import tailwindcss from '@tailwindcss/vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  cacheDir: 'node_modules/.vite',
  plugins: [tailwindcss(), svelte({ configFile: 'tooling/svelte.config.js' })],
});
