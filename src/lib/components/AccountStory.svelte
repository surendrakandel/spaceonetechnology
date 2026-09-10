<script lang="ts">
	import { media } from '$lib/public/assets';
</script>

<section
	class="flex flex-col bg-sage px-6 py-7 text-ink sm:px-10 lg:min-h-screen lg:px-[clamp(32px,4vw,72px)] lg:py-10"
>
	<a href="/" aria-label="Space One Technology home" class="w-fit"
		><img
			src="/images/spaceonetechnology-logo.png"
			alt="Space One Technology"
			class="h-10 w-auto"
		/></a
	>
	<div class="my-auto py-8 lg:py-14">
		<p class="mb-5 text-[10px] font-semibold uppercase tracking-[.18em] text-forest">
			Your Space One workspace
		</p>
		<h1
			class="mb-5 text-[clamp(2.3rem,4.7vw,4.5rem)] font-medium leading-[1.08] tracking-[-.055em]"
		>
			Every application.<br /><span class="editorial text-forest">A clearer next step.</span>
		</h1>
		<p class="max-w-sm text-sm leading-7 text-muted">
			Keep your jobs, resumes, and interview plans together. Pick up where you left off.
		</p>
		<div class="relative mt-10 hidden lg:block">
			<img
				src={media.collaboration}
				alt="Hands working at a laptop on a shared table"
				class="aspect-[1.55] w-full rounded-tl-[60px] rounded-br-[60px] object-cover"
				width="1024"
				height="645"
			/>
			<div
				class="absolute -bottom-5 right-5 rounded-md border border-line bg-paper px-5 py-4 text-xs text-forest"
			>
				A little more clarity. At every stage.
			</div>
		</div>
	</div>
	<a
		href="/contact"
		class="hidden w-fit border-b border-forest/30 pb-1 text-xs text-forest lg:block"
		>Need a hand? Talk to our team ↗</a
	>
</section>

<style>
	.editorial {
		font-family: Georgia, 'Times New Roman', serif;
		font-style: italic;
		font-weight: 400;
	}
</style>
