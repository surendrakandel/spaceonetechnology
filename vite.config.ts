import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	// Keep packaged components on the application's Svelte runtime in development.
	optimizeDeps: { exclude: ['@usecase-ui/svelte'] }
});
