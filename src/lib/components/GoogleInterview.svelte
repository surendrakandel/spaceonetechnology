<script lang="ts">
	import { Button } from '@usecase-ui/svelte';
	import { invalidateAll } from '$app/navigation';
	import { api } from '$lib/client';
	let {
		id,
		link,
		connected
	}: {
		id: string;
		connected: boolean;
		link?: {
			meet_url: string;
			google_url: string;
			last_error: string;
			last_synced_at: string | null;
		};
	} = $props();
	let busy = $state(false),
		error = $state('');
	async function sync(create_meet = false, resolution?: 'portal' | 'google') {
		busy = true;
		error = '';
		try {
			await api(`calendar/interviews/${id}`, 'POST', { create_meet, resolution });
			await invalidateAll();
		} catch (e) {
			error = (e as Error).message;
			await invalidateAll();
		} finally {
			busy = false;
		}
	}
</script>

<div class="flex flex-wrap gap-3 items-center mt-3 text-sm">
	{#if link?.meet_url}<a class="inline-link" href={link.meet_url} target="_blank" rel="noreferrer"
			>Join Google Meet ↗</a
		>{/if}
	{#if link?.google_url}<a
			class="inline-link"
			href={link.google_url}
			target="_blank"
			rel="noreferrer">Open in Google Calendar ↗</a
		>{/if}
	{#if connected}<Button
			variant="ghost"
			type="button"
			size="sm"
			class="text-button"
			disabled={busy}
			onclick={() => sync()}
			>{busy ? 'Syncing…' : link ? 'Sync with Google' : 'Add to Google Calendar'}</Button
		>{#if !link?.meet_url}<Button
				variant="ghost"
				type="button"
				size="sm"
				class="text-button"
				disabled={busy}
				onclick={() => sync(true)}>Create Google Meet</Button
			>{/if}{/if}
	{#if error || link?.last_error}<div class="alert error w-full" role="alert">
			<p>{error || link?.last_error}</p>
			{#if link}<p class="text-sm">
					If both calendars changed, choose which interview time to keep.
				</p>
				<Button
					variant="ghost"
					type="button"
					size="sm"
					class="text-button mr-4"
					disabled={busy}
					onclick={() => sync(false, 'google')}>Use Google version</Button
				><Button
					variant="ghost"
					type="button"
					size="sm"
					class="text-button"
					disabled={busy}
					onclick={() => sync(false, 'portal')}>Use portal version</Button
				>{/if}
		</div>{/if}
</div>
