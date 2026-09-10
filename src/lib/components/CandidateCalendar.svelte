<script lang="ts">
	import { onMount } from 'svelte';
	import { invalidateAll } from '$app/navigation';
	import { CalendarDays, ChevronLeft, ChevronRight, RefreshCw, Plus, Trash2 } from '@lucide/svelte';
	import { api, date } from '$lib/client';
	let {
		calendar,
		candidate,
		own = false,
		jobId,
		timezone,
		meetings = []
	}: {
		calendar: {
			available: boolean;
			setup_message: string;
			configured: boolean;
			connected: boolean;
			connection: { last_synced_at: string | null; last_error: string } | null;
			slots: {
				id: string;
				job_id: string | null;
				starts_at: string;
				ends_at: string;
				note: string;
			}[];
		};
		candidate: string;
		own?: boolean;
		jobId?: string;
		timezone: string;
		meetings?: {
			id: string;
			starts_at: string;
			ends_at: string;
			title: string;
			state: string;
			job_id?: string;
		}[];
	} = $props();
	let start = $state(new Date().toISOString().slice(0, 10));
	let busy = $state(false),
		message = $state(''),
		error = $state(''),
		adding = $state(false),
		disconnecting = $state(false);
	let blocks = $state<{ start: string; end: string }[]>([]);
	let fetchedAt = $state('');
	let days = $derived(
		Array.from({ length: 7 }, (_, i) =>
			new Date(Date.parse(start + 'T12:00:00Z') + i * 86400000).toISOString().slice(0, 10)
		)
	);
	const dayOf = (s: string) =>
		new Intl.DateTimeFormat('en-CA', {
			timeZone: timezone,
			year: 'numeric',
			month: '2-digit',
			day: '2-digit'
		}).format(new Date(s));
	const time = (s: string) =>
		new Intl.DateTimeFormat('en-US', {
			timeZone: timezone,
			hour: 'numeric',
			minute: '2-digit'
		}).format(new Date(s));
	const overlaps = (a: string, b: string, c: string, d: string) =>
		Date.parse(a) < Date.parse(d) && Date.parse(b) > Date.parse(c);
	const onDay = (a: string, b: string, day: string) =>
		dayOf(a) <= day && dayOf(new Date(Date.parse(b) - 1).toISOString()) >= day;
	async function run(fn: () => Promise<void>) {
		busy = true;
		error = '';
		message = '';
		try {
			await fn();
		} catch (e) {
			error = (e as Error).message;
		} finally {
			busy = false;
		}
	}
	async function refresh() {
		await run(async () => {
			blocks = [];
			fetchedAt = '';
			const r = await api<{ busy: typeof blocks; synced_at: string; conflicts: number }>(
				`calendar/refresh?candidate=${candidate}`,
				'POST',
				{
					from: new Date(Date.parse(start + 'T00:00:00Z') - 86400000).toISOString(),
					to: new Date(Date.parse(start + 'T00:00:00Z') + 8 * 86400000).toISOString()
				}
			);
			blocks = r.busy;
			fetchedAt = r.synced_at;
			await invalidateAll();
			message = r.conflicts
				? `${r.conflicts} interview changes need attention. Resolve them in the job page before retrying sync.`
				: 'Calendar refreshed.';
		});
	}
	async function connect() {
		await run(async () => {
			const r = await api<{ url: string }>('calendar/google/connect', 'POST', {});
			window.location.assign(r.url);
		});
	}
	async function disconnect() {
		await run(async () => {
			await api('calendar/google', 'DELETE');
			blocks = [];
			fetchedAt = '';
			disconnecting = false;
			await invalidateAll();
			message = 'Google disconnected. Existing Google events remain in your calendar.';
		});
	}
	async function add(e: SubmitEvent) {
		e.preventDefault();
		const form = e.currentTarget as HTMLFormElement;
		await run(async () => {
			const f = new FormData(form);
			await api('calendar/availability', 'POST', {
				job_id: jobId || null,
				starts_at: new Date(String(f.get('start'))).toISOString(),
				ends_at: new Date(String(f.get('end'))).toISOString(),
				note: String(f.get('note') || '')
			});
			await invalidateAll();
			adding = false;
			message = 'Availability shared with your team.';
		});
	}
	function move(n: number) {
		start = new Date(Date.parse(start + 'T12:00:00Z') + n * 86400000).toISOString().slice(0, 10);
		blocks = [];
		fetchedAt = '';
	}
	onMount(() => {
		start = dayOf(new Date().toISOString());
	});
</script>

<section class="panel mt-6 @container" aria-label="Calendar and availability">
	<div class="section-heading flex-wrap gap-3">
		<div>
			<p class="eyebrow">PLAN THE CONVERSATION</p>
			<h2>
				{jobId
					? 'Availability for this job'
					: own
						? 'Your calendar & availability'
						: 'Candidate calendar & availability'}
			</h2>
		</div>
		<CalendarDays size={24} />
	</div>
	<p class="text-sm text-muted">
		{own
			? 'Share times that work for you. Your team sees interview details and busy times, while unrelated Google event details stay private.'
			: 'Review interviews and the times this candidate has shared. Other Google events appear only as busy time.'}
		All times in {timezone}.
	</p>
	{#if !calendar.available}<p class="alert" role="status">{calendar.setup_message}</p>{/if}
	<div class="flex flex-wrap gap-3 items-center my-5">
		{#if calendar.connected}<span class="neutral-badge">Google connected</span><button
				class="button secondary"
				disabled={busy}
				onclick={refresh}
				><RefreshCw size={15} />{busy ? 'Working…' : 'Refresh Google calendar'}</button
			>
			{#if own}<button
					class="text-button"
					disabled={busy}
					onclick={() => (disconnecting = !disconnecting)}>Disconnect</button
				>{/if}
		{:else if own}<button
				class="button secondary"
				disabled={busy || !calendar.configured}
				onclick={connect}>Connect Google Calendar</button
			><small class="text-muted"
				>{calendar.configured
					? 'Connect your primary calendar to sync interviews and create Meet links.'
					: 'Google connection will be available after your team completes setup.'}</small
			>
		{:else}<span class="text-sm text-muted"
				>Google Calendar is not connected. Interview records and shared availability are shown
				below.</span
			>{/if}
		{#if own}<button
				class="text-button"
				disabled={busy || !calendar.available}
				onclick={() => (adding = !adding)}><Plus size={16} />Share availability</button
			>{/if}
	</div>
	{#if disconnecting}<div class="alert">
			Disconnecting removes shared busy-time access and event links. Existing Google events stay in
			Google. <button class="text-button" disabled={busy} onclick={disconnect}
				>Confirm disconnect</button
			>
		</div>{/if}
	{#if error || calendar.connection?.last_error}<p class="alert error" role="alert">
			{error || calendar.connection?.last_error}
		</p>{/if}
	{#if message}<p class="alert success" role="status">{message}</p>{/if}
	{#if adding}<form class="rounded-lg border border-line p-4 mb-5" onsubmit={add}>
			<p class="text-sm text-muted">
				Enter times in your device timezone. {jobId
					? 'This window applies to this job.'
					: 'This window is available for any job.'}
			</p>
			<div class="form-grid">
				<label>Available from<input name="start" type="datetime-local" required /></label><label
					>Until<input name="end" type="datetime-local" required /></label
				>
			</div>
			<label
				>Note <input
					name="note"
					maxlength="300"
					placeholder="Optional, e.g. video calls preferred"
				/></label
			><button class="button primary" disabled={busy}>Save availability</button>
		</form>{/if}
	<div class="flex flex-wrap gap-3 items-center justify-between mb-4">
		<div class="flex gap-2 items-center">
			<button
				class="icon-button"
				aria-label="Previous week"
				disabled={busy}
				onclick={() => move(-7)}><ChevronLeft size={18} /></button
			><strong class="text-sm">{date(days[0])} – {date(days[6])}</strong><button
				class="icon-button"
				aria-label="Next week"
				disabled={busy}
				onclick={() => move(7)}><ChevronRight size={18} /></button
			>
		</div>
		<small class="text-muted"
			>{fetchedAt
				? `Google checked ${date(fetchedAt, timezone, true)}`
				: 'Google busy times have not been checked for this week.'}</small
		>
	</div>
	<div class="grid grid-cols-1 @min-[420px]:grid-cols-2 @min-[760px]:grid-cols-7 gap-2">
		{#each days as day}<div class="rounded-lg border border-line p-3 min-h-36">
				<h3 class="text-sm mb-3">
					{new Intl.DateTimeFormat('en-US', {
						weekday: 'short',
						day: 'numeric',
						timeZone: 'UTC'
					}).format(new Date(day + 'T12:00:00Z'))}
				</h3>
				{#each meetings.filter((m) => m.state !== 'cancelled' && onDay(m.starts_at, m.ends_at, day)) as m}<a
						href={m.job_id
							? `/jobs/${m.job_id}${own ? '' : '?candidate=' + candidate}#interview-${m.id}`
							: `#interview-${m.id}`}
						class="block rounded bg-forest text-white p-2 mb-2 text-xs"
						><strong>{m.title}</strong><span class="block mt-1"
							>{time(m.starts_at)} – {time(m.ends_at)}</span
						><span class="block">{m.state}</span></a
					>{/each}
				{#each calendar.slots.filter((s) => onDay(s.starts_at, s.ends_at, day)) as slot}<div
						class="rounded bg-canvas border border-line p-2 mb-2 text-xs"
					>
						<strong>Available</strong><span class="block"
							>{time(slot.starts_at)} – {time(slot.ends_at)}</span
						><span class="block text-muted">{slot.job_id ? 'Job-specific' : 'Any job'}</span
						>{#if slot.note}<p class="mb-0 mt-1">
								{slot.note}
							</p>{/if}{#if blocks.some( (b) => overlaps(slot.starts_at, slot.ends_at, b.start, b.end) ) || meetings.some((m) => m.state === 'scheduled' && overlaps(slot.starts_at, slot.ends_at, m.starts_at, m.ends_at))}<span
								class="block mt-1 text-rust">Conflicts with a booking</span
							>{/if}{#if own}<button
								class="text-button mt-2"
								aria-label="Remove availability"
								disabled={busy}
								onclick={() =>
									run(async () => {
										await api(`calendar/availability/${slot.id}`, 'DELETE');
										await invalidateAll();
									})}><Trash2 size={12} />Remove</button
							>{/if}
					</div>{/each}
				{#each blocks.filter((b) => onDay(b.start, b.end, day)) as block}<div
						class="rounded bg-stone-100 text-stone-600 p-2 mb-2 text-xs"
					>
						Busy<span class="block">{time(block.start)} – {time(block.end)}</span>
					</div>{/each}
			</div>{/each}
	</div>
	<p class="text-xs text-muted mt-4 mb-0">
		Availability is a proposed time, not a booking. Refresh Google before scheduling. Interview
		completion is recorded here; a past Google event is not automatically marked completed.
	</p>
</section>
