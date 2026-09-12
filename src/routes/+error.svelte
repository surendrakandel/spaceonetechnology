<script lang="ts">
	import { Button } from '@usecase-ui/svelte';

	import { page } from '$app/state';
</script>

<main class="standalone">
	<a class="brand text-2xl flex items-center gap-2" href="/" aria-label="Space One Technology home">
		<img
			src="/images/spaceonetechnology-logo.png"
			alt="Space One Technology"
			class="h-auto max-w-[175px] w-auto"
		/>

		<span class="sr-only">
			spaceonetechnology<span class="brand-dot">.</span>
		</span>
	</a>
	<p class="eyebrow">{page.status}</p>
	<h1>{page.error?.message || 'Something went wrong'}</h1>
	<p class="muted">Try again, or return to your workspace.</p>
	<Button variant="default" class="button primary" href="/">Back to Space One →</Button>
</main>
