<script lang="ts">
	import CandidateCalendar from '$lib/components/CandidateCalendar.svelte';
	import { CalendarDays, ArrowUpRight, Download, Clock3 } from '@lucide/svelte';
	import { invalidateAll } from '$app/navigation';
	import { api, date } from '$lib/client';
	let { data } = $props();
	let interviewFilter = $state('scheduled');
	let busy = $state('');
	let error = $state('');
	async function complete(id: string) {
		busy = id;
		error = '';
		try {
			await api(`interviews/${id}`, 'PATCH', { state: 'completed' });
			await invalidateAll();
		} catch (e) {
			error = (e as Error).message;
		} finally {
			busy = '';
		}
	}
	let filtered = $derived(
		data.interviews
			.filter((i) => interviewFilter === 'all' || i.state === interviewFilter)
			.sort((a, b) =>
				interviewFilter === 'scheduled'
					? a.starts_at.localeCompare(b.starts_at)
					: b.starts_at.localeCompare(a.starts_at)
			)
	);
</script>

<svelte:head><title>Interviews · Space One</title></svelte:head>
<div class="page-heading">
	<div>
		<p class="eyebrow">MAKE A CONNECTION</p>
		<h1>
			{data.user.role === 'client' ? 'Your interviews' : 'Candidate interviews'}<span
				class="heading-dot">.</span
			>
		</h1>
		<p class="muted">A little preparation goes a long way. All times in {data.user.timezone}.</p>
	</div>
	<CalendarDays size={31} strokeWidth={1.3} />
</div>
{#if data.user.role === 'client'}<CandidateCalendar
		calendar={data.calendar}
		candidate={data.user.id}
		own={true}
		timezone={data.user.timezone}
		meetings={data.interviews}
	/>{:else}<p class="text-sm text-muted">
		Open a <a class="inline-link" href="/candidates">candidate’s calendar</a> to review their shared availability
		and Google busy times.
	</p>{/if}
<div class="status-tabs standalone-tabs">
	{#each ['scheduled', 'completed', 'cancelled', 'all'] as tab}<button
			class:active={interviewFilter === tab}
			onclick={() => (interviewFilter = tab)}
			>{tab === 'all' ? 'All interviews' : tab[0].toUpperCase() + tab.slice(1)}</button
		>{/each}
</div>
{#if error}<p class="alert error" role="alert">{error}</p>{/if}
<section class="panel interview-agenda">
	{#each filtered as interview}<article class="agenda-full-row">
			<div class="calendar-square">
				<span
					>{new Intl.DateTimeFormat('en-US', {
						month: 'short',
						timeZone: data.user.timezone
					}).format(new Date(interview.starts_at))}</span
				><strong
					>{new Intl.DateTimeFormat('en-US', {
						day: '2-digit',
						timeZone: data.user.timezone
					}).format(new Date(interview.starts_at))}</strong
				>
			</div>
			<div class="agenda-full-info">
				<a
					class="job-title"
					href={`/jobs/${interview.job_id}${data.user.role === 'client' ? '' : '?candidate=' + interview.user_id}`}
					>{interview.title}</a
				>
				<p>
					{interview.company} · {interview.job_title}{data.user.role !== 'client'
						? ' · ' + interview.candidate_name
						: ''}
				</p>
				<small
					><Clock3 size={13} />{date(interview.starts_at, data.user.timezone, true)} · {interview.state}{interview.state ===
						'scheduled' && new Date(interview.ends_at) < new Date()
						? ' · Past due for an update'
						: ''}</small
				>{#if interview.notes}<p class="interview-notes">{interview.notes}</p>{/if}
			</div>
			{#if interview.state === 'scheduled'}<button
					class="button secondary"
					disabled={!!busy}
					onclick={() => complete(interview.id)}
					>{busy === interview.id ? 'Saving…' : 'Mark completed'}</button
				>{/if}
			<a class="button secondary" href={`/api/interviews/${interview.id}/calendar`}
				><Download size={16} /><span>Calendar</span></a
			><a
				class="icon-button"
				href={`/jobs/${interview.job_id}${data.user.role === 'client' ? '' : '?candidate=' + interview.user_id}`}
				aria-label="View interview details"><ArrowUpRight size={20} /></a
			>
		</article>{:else}<div class="empty-state">
			<CalendarDays size={35} strokeWidth={1.3} />
			<h3>
				{interviewFilter === 'scheduled'
					? 'Your next conversation belongs here'
					: 'No interviews in this view'}
			</h3>
			<p>
				Add interviews from a job’s page, then keep your schedule and preparation notes together.
			</p>
			<a class="button primary" href="/jobs">Explore opportunities <ArrowUpRight size={16} /></a>
		</div>{/each}
</section>
