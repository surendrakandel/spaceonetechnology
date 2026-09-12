<script lang="ts">
	import { Button, Input, Textarea } from '@usecase-ui/svelte';

	import { api } from '$lib/client';
	import { ArrowUpRight, Check } from '@lucide/svelte';
	let { topic = '' }: { topic?: string } = $props();
	const topics = [
		'Technology project',
		'Hiring & staffing',
		'Career opportunities',
		'Workspace support',
		'Something else'
	];
	let interest = $state('');
	$effect(() => {
		interest = topics.includes(topic) ? topic : '';
	});
	let busy = $state(false),
		error = $state(''),
		sent = $state(false);
	async function submit(e: SubmitEvent) {
		e.preventDefault();
		busy = true;
		error = '';
		try {
			await api(
				'contact',
				'POST',
				Object.fromEntries(new FormData(e.currentTarget as HTMLFormElement))
			);
			sent = true;
		} catch (e) {
			error = (e as Error).message;
		} finally {
			busy = false;
		}
	}
</script>

<section class="public-form bg-card border border-border rounded-lg p-6 sm:p-8 lg:p-10">
	{#if sent}<div class="py-12" role="status">
			<Check size={32} class="text-primary mb-5" />
			<h2 class="text-3xl tracking-tight">Your message is with our team.</h2>
			<p class="text-muted-foreground leading-8">
				We’ll review the details and reply to the email address you provided. There’s no need to
				submit the form again.
			</p>
			<Button
				variant="outline"
				type="button"
				class="button secondary mt-4"
				onclick={() => (sent = false)}>Send another message</Button
			>
		</div>{:else}<p class="site-kicker">Tell us what you need</p>
		<h2 class="section-title mb-3">Start with the essentials.</h2>
		<p class="mb-7 text-sm leading-7 text-muted-foreground">
			What needs to change, and what would a good result look like?
		</p>
		{#if error}<p class="alert error" role="alert">{error}</p>{/if}
		<form onsubmit={submit}>
			<div class="grid sm:grid-cols-2 gap-5">
				<label class="field-label"
					>Your name<Input
						name="name"
						autocomplete="name"
						required
						minlength={2}
						maxlength={100}
					/></label
				><label class="field-label"
					>Email address<Input
						name="email"
						type="email"
						autocomplete="email"
						required
						maxlength={254}
					/></label
				>
			</div>
			<label class="field-label"
				>Company <span class="text-muted-foreground font-normal">(optional)</span><Input
					name="company"
					autocomplete="organization"
					maxlength={160}
				/></label
			><label class="field-label"
				>How can we help?<select class="du-select" name="interest" bind:value={interest} required
					><option value="">Choose a topic</option><option>Technology project</option><option
						>Hiring & staffing</option
					><option>Career opportunities</option><option>Workspace support</option><option
						>Something else</option
					></select
				></label
			><label class="field-label"
				>What should we know?<Textarea
					name="message"
					rows={5}
					required
					minlength={20}
					maxlength={5000}
					placeholder="Describe the project, hiring need, or question. Include your timeline if you have one."
				></Textarea></label
			>
			<div class="hidden" aria-hidden="true">
				<label class="field-label"
					>Website<Input name="website" tabindex={-1} autocomplete="off" /></label
				>
			</div>
			<p class="text-xs text-muted-foreground leading-6">
				We’ll use these details to respond to your inquiry. Please don’t include confidential
				documents or sensitive personal information. <a class="underline" href="/privacy"
					>Privacy information</a
				>.
			</p>
			<Button
				variant="default"
				type="submit"
				class="site-button mt-3 w-w-full bg-primary text-primary-content hover:bg-foreground sm:w-auto"
				disabled={busy}>{busy ? 'Sending…' : 'Send your message'}<ArrowUpRight size={17} /></Button
			>
		</form>{/if}
</section>
