<script lang="ts">
	import { Button, Card, Input, MetricCard } from '@usecase-ui/svelte';

	import { page } from '$app/state';
	import { goto, invalidateAll } from '$app/navigation';
	import {
		Search,
		SlidersHorizontal,
		ArrowUpRight,
		ArrowDownUp,
		Bookmark,
		MapPin,
		ArrowRight,
		CalendarDays,
		BriefcaseBusiness,
		Check,
		Clock3,
		X
	} from '@lucide/svelte';
	import { api, date, initials, tags } from '$lib/client';
	import { statuses, statusLabel, type Job } from '$lib/types';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	let { data } = $props();
	let operator = $derived(data.user.role !== 'client');
	const statusRank = (job: Job) =>
		operator
			? Math.min(
					...tags(job.application_statuses)
						.map((s) => statuses.indexOf(s as (typeof statuses)[number]))
						.filter((n) => n >= 0),
					statuses.length
				)
			: statuses.indexOf(job.status);
	let query = $state(page.url.searchParams.get('q') || '');
	let status = $state(page.url.searchParams.get('status') || 'all');
	let sort = $state(page.url.searchParams.get('sort') || 'newest');
	let workplace = $state('all');
	let interviewFilter = $state('all');
	let savedOnly = $state(false);
	let publication = $state('all');
	let filters = $state(false);
	let error = $state('');
	let busy = $state('');
	let limit = $state(15);
	const interviewOrder = (value: string | null) =>
		value ? ['scheduled', 'completed', 'cancelled'].indexOf(value) : 3;
	const tabs = ['all', 'to_apply', 'applied', 'processing', 'interview', 'offer'];
	let results = $derived(
		data.jobs
			.filter(
				(j) =>
					(!query ||
						`${j.title} ${j.company} ${j.location} ${j.tags}`
							.toLowerCase()
							.includes(query.toLowerCase())) &&
					(status === 'all' ||
						(operator
							? status === 'to_apply'
								? j.application_count === 0
								: status === 'applied'
									? j.application_count > 0
									: tags(j.application_statuses).includes(status)
							: j.status === status)) &&
					(workplace === 'all' || j.workplace === workplace) &&
					(interviewFilter === 'all' ||
						(operator
							? tags(j.interview_states).includes(interviewFilter)
							: j.interview_state === interviewFilter)) &&
					(!savedOnly || !!j.saved) &&
					(publication === 'all' ||
						(publication === 'live'
							? j.active && j.quality_state === 'ready'
							: publication === 'review'
								? j.quality_state === 'needs_review'
								: !j.active))
			)
			.sort((a, b) =>
				sort === 'most_applied'
					? b.application_count - a.application_count
					: sort === 'least_applied'
						? a.application_count - b.application_count
						: sort === 'oldest'
							? a.created_at.localeCompare(b.created_at)
							: sort === 'posted'
								? (b.posted_at || '').localeCompare(a.posted_at || '')
								: sort === 'interview_state'
									? interviewOrder(a.interview_state) - interviewOrder(b.interview_state)
									: sort === 'status'
										? statusRank(a) - statusRank(b)
										: sort === 'company'
											? a.company.localeCompare(b.company)
											: sort === 'interview'
												? (a.next_interview || '9999').localeCompare(b.next_interview || '9999')
												: sort === 'follow_up'
													? (a.follow_up || '9999').localeCompare(b.follow_up || '9999')
													: sort === 'deadline'
														? (a.deadline || '9999').localeCompare(b.deadline || '9999')
														: b.created_at.localeCompare(a.created_at)
			)
	);
	let upcoming = $derived(
		data.interviews
			.filter((i) => i.state === 'scheduled' && new Date(i.ends_at) > new Date())
			.slice(0, 3)
	);
	let applied = $derived(data.metrics.applied);
	let due = $derived(
		data.jobs.filter(
			(j) =>
				j.follow_up &&
				j.follow_up <=
					new Intl.DateTimeFormat('en-CA', {
						timeZone: data.user.timezone,
						year: 'numeric',
						month: '2-digit',
						day: '2-digit'
					}).format(new Date()) &&
				!['rejected', 'withdrawn', 'offer'].includes(j.status)
		)
	);
	async function save(job: Job) {
		busy = job.id;
		try {
			await api(`jobs/${job.id}/application`, 'PATCH', { version: job.version, saved: !job.saved });
			await invalidateAll();
		} catch (e) {
			error = (e as Error).message;
		} finally {
			busy = '';
		}
	}
	function persist() {
		limit = 15;
		const p = new URLSearchParams();
		if (query) p.set('q', query);
		if (status !== 'all') p.set('status', status);
		if (sort !== 'newest') p.set('sort', sort);
		void goto(`/jobs${p.size ? '?' + p : ''}`, {
			replaceState: true,
			noScroll: true,
			keepFocus: true
		});
	}
</script>

<svelte:head><title>My opportunities · Space One</title></svelte:head>
<div class="page-heading">
	<div>
		<p class="eyebrow">YOUR NEXT CHAPTER</p>
		<h1>
			{data.user.role === 'client' ? 'My opportunities' : 'Job opportunities'}<span
				class="heading-dot">.</span
			>
		</h1>
		<p class="muted">A new role starts with a little momentum. Let’s keep yours going.</p>
	</div>
	<div class="date-chip">
		<CalendarDays size={16} />{new Intl.DateTimeFormat('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
			timeZone: data.user.timezone
		}).format(new Date())}
	</div>
</div>
<div class="stats-grid">
	<MetricCard
		label="Total opportunities"
		value={String(data.jobs.length)}
		description="Selected for your next move"
	/>
	<MetricCard
		label="Applications sent"
		value={String(applied)}
		description={data.user.role === 'client'
			? 'Your recorded submissions'
			: 'Across all client applications'}
	/>
	<MetricCard
		label="Upcoming interviews"
		value={String(data.metrics.upcoming)}
		description={upcoming[0]
			? `Next: ${date(upcoming[0].starts_at, data.user.timezone, true)}`
			: 'Room for your next conversation'}
	/>
	<MetricCard
		label="Offers received"
		value={String(data.metrics.offers)}
		description="Good things are taking shape"
	/>
</div>
{#if error}<p class="alert error" role="alert">{error}</p>{/if}
<div class="board-layout">
	<section class="jobs-board">
		<div class="section-heading">
			<h2>
				{data.user.role === 'client' ? 'Your job board' : 'All workspace jobs'}
				<span class="count">{data.jobs.length}</span>
			</h2>
			<button
				class:chosen={savedOnly}
				class="du-btn du-btn-ghost text-button"
				onclick={() => {
					savedOnly = !savedOnly;
					limit = 15;
				}}><Bookmark size={15} />{operator ? 'Saved by clients' : 'Saved jobs'}</button
			>
		</div>
		<div class="status-tabs" role="group" aria-label="Application status">
			{#each tabs as tab}<button
					class="du-btn du-btn-ghost"
					class:active={status === tab}
					onclick={() => {
						status = tab;
						persist();
					}}
					>{tab === 'all'
						? 'All jobs'
						: operator && tab === 'to_apply'
							? 'No applications'
							: statusLabel[tab as keyof typeof statusLabel]}{#if tab === 'all'}<span
							>{data.jobs.length}</span
						>{/if}</button
				>{/each}
		</div>
		{#if operator}<p class="text-xs text-muted-foreground mt-3">
				Status filters match activity from any client. A job can appear in more than one stage.
			</p>{/if}
		<div class="board-toolbar">
			<div class="search-input">
				<Search size={17} /><Input
					aria-label="Search jobs"
					placeholder="Search role, company, or keyword…"
					bind:value={query}
					oninput={() => {
						limit = 15;
					}}
					onblur={persist}
				/>{#if query}<Button
						variant="ghost"
						type="button"
						size="icon"
						class="icon-button"
						aria-label="Clear search"
						onclick={() => {
							query = '';
							persist();
						}}><X size={15} /></Button
					>{/if}
			</div>
			<button
				class:chosen={filters}
				class="du-btn du-btn-outline button secondary filter-button"
				onclick={() => (filters = !filters)}><SlidersHorizontal size={16} />Filters</button
			>
			<div class="sort-select">
				<ArrowDownUp size={15} /><select
					class="du-select"
					aria-label="Sort jobs"
					bind:value={sort}
					onchange={persist}
					><option value="newest">Recently added</option><option value="posted"
						>Recently posted</option
					><option value="oldest">Oldest first</option><option value="most_applied"
						>Most applied</option
					><option value="least_applied">Least applied / unapplied</option><option value="status"
						>Application status</option
					><option value="interview">Interview date</option><option value="interview_state"
						>Interview state</option
					><option value="follow_up">Follow-up date</option><option value="deadline"
						>Deadline</option
					><option value="company">Company A–Z</option></select
				>
			</div>
		</div>
		{#if filters}<Card class="filter-panel">
				{#if data.user.role !== 'client'}<label class="field-label"
						>Publication<select class="du-select" bind:value={publication}
							><option value="all">All listings</option><option value="live">Live</option><option
								value="review">Needs review</option
							><option value="closed">Closed / draft</option></select
						></label
					>{/if}
				<label class="field-label"
					>Status<select class="du-select" bind:value={status} onchange={persist}
						><option value="all">All statuses</option>{#each statuses as value}<option {value}
								>{statusLabel[value]}</option
							>{/each}</select
					></label
				><label class="field-label"
					>Workplace<select class="du-select" bind:value={workplace}
						><option value="all">Any workplace</option><option>Remote</option><option>Hybrid</option
						><option>On-site</option></select
					></label
				><label class="field-label"
					>Interview state<select class="du-select" bind:value={interviewFilter}
						><option value="all">Any state</option><option value="scheduled">Scheduled</option
						><option value="completed">Completed</option><option value="cancelled">Cancelled</option
						></select
					></label
				>
			</Card>{/if}
		<div class="list-caption">
			<span
				>{results.length}
				{results.length === 1 ? 'opportunity' : 'opportunities'}{query
					? ' matching your search'
					: ''}</span
			><span>{operator ? 'CLIENT ACTIVITY' : 'YOUR PROGRESS'}</span>
		</div>
		<div class="job-list">
			{#each results.slice(0, limit) as job, index}<article class="job-row">
					<div class="company-mark tone-{index % 5}">{initials(job.company)}</div>
					<div class="job-summary">
						<a class="job-title" href={`/jobs/${job.id}`}>{job.title}</a>
						<div class="job-company">
							{job.company}<span>·</span><span>{job.employment_type}</span>
						</div>
						<div class="job-meta">
							<span><MapPin size={12} />{job.location}</span><span class="workplace"
								>{job.workplace}</span
							>{#if job.salary}<span>{job.salary}</span>{/if}
						</div>
						<div class="job-tags">
							{#each tags(job.tags).slice(0, 3) as tag}<span>{tag}</span
								>{/each}{#if !job.active}<span>Listing closed</span>{/if}
						</div>
					</div>
					<div class="job-progress">
						{#if data.user.role !== 'client'}<span class="text-sm font-semibold"
								>{job.application_count} applications</span
							><small
								>{job.quality_state === 'needs_review'
									? 'Needs review'
									: job.active
										? 'Published'
										: 'Closed'}</small
							>{:else}<StatusBadge status={job.status} />{/if}<small
							>{job.next_interview
								? date(job.next_interview, data.user.timezone, true)
								: job.follow_up
									? `Follow up ${date(job.follow_up)}`
									: `Added ${date(job.created_at)}`}</small
						>
						<div class="job-actions">
							{#if data.user.role === 'client'}<button
									class:saved={!!job.saved}
									class="du-btn du-btn-ghost icon-button"
									disabled={busy === job.id}
									aria-label={job.saved ? 'Unsave job' : 'Save job'}
									aria-pressed={!!job.saved}
									onclick={() => save(job)}
									><Bookmark size={17} fill={job.saved ? 'currentColor' : 'none'} /></button
								>{/if}<a class="job-open" href={`/jobs/${job.id}`} aria-label={`Open ${job.title}`}
								><ArrowUpRight size={18} /></a
							>
						</div>
					</div>
				</article>{:else}<div class="empty-state">
					<BriefcaseBusiness size={32} strokeWidth={1.3} />
					<h3>
						{data.jobs.length ? 'No matching opportunities' : 'Your next chapter starts here'}
					</h3>
					<p>
						{data.jobs.length
							? 'Try a different search or clear your filters.'
							: 'Your team will share jobs here. Each one will have a place for your resume, updates, and interviews.'}
					</p>
					{#if data.jobs.length}<Button
							variant="outline"
							type="button"
							class="button secondary"
							onclick={() => {
								query = '';
								status = 'all';
								workplace = 'all';
								interviewFilter = 'all';
								savedOnly = false;
								publication = 'all';
								persist();
							}}>Clear filters</Button
						>{:else if data.user.role !== 'client'}<Button
							variant="default"
							class="button primary"
							href="/admin">Add your first job <ArrowRight size={16} /></Button
						>{/if}
				</div>{/each}
		</div>
		{#if results.length > limit}<Button
				variant="outline"
				type="button"
				class="button secondary w-full load-more"
				onclick={() => (limit += 15)}>Show more opportunities</Button
			>{/if}
	</section>
	<aside class="board-aside">
		<section class="agenda-card">
			<div class="section-heading">
				<h3>Coming up</h3>
				<CalendarDays size={17} />
			</div>
			{#each upcoming as interview}<a
					class="agenda-item"
					href={`/jobs/${interview.job_id}${data.user.role === 'client' ? '' : '?candidate=' + interview.user_id}`}
					><div class="calendar-square">
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
					<div>
						<strong>{interview.title}</strong>
						<p>
							{interview.company}{data.user.role !== 'client'
								? ' · ' + interview.candidate_name
								: ''}
						</p>
						<small>{date(interview.starts_at, data.user.timezone, true)}</small>
					</div></a
				>{:else}<div class="small-empty">
					<Clock3 size={22} />
					<p>No interviews scheduled yet.</p>
					<small>Add a time from any job page when an invitation arrives.</small>
				</div>{/each}<a class="aside-link" href="/interviews"
				>View all interviews <ArrowRight size={15} /></a
			>
		</section>
		<section class="momentum-card">
			<span class="eyebrow">A SMALL REMINDER</span>
			<h3>Progress is a<br />practice.</h3>
			<p>Tailor your resume. Make the connection. Keep showing up.</p>
			<div class="momentum-art" aria-hidden="true">
				<span></span><span></span><span></span><ArrowUpRight size={34} strokeWidth={1.4} />
			</div>
		</section>
		{#if due.length}<section class="followup-card">
				<h3>Time to follow up <span class="count">{due.length}</span></h3>
				{#each due.slice(0, 4) as job}<a href={`/jobs/${job.id}`}
						><span>{job.company}<small>{date(job.follow_up)}</small></span><ArrowUpRight
							size={15}
						/></a
					>{/each}
			</section>{/if}
		<p class="aside-footnote">
			Your application details are shared<br />with your Space One support team.
		</p>
	</aside>
</div>
