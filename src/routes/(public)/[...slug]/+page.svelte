<script lang="ts">
	import { ArticleCard, Button } from '@usecase-ui/svelte';

	import { media } from '$lib/public/assets';
	import {
		ArrowUpRight,
		ArrowRight,
		ArrowLeft,
		Phone,
		Check,
		Asterisk,
		FileText,
		CalendarDays,
		MessageCircle
	} from '@lucide/svelte';
	import { services, projectIdeas, articles } from '$lib/public/content';
	import { page } from '$app/state';
	import ContactForm from '$lib/components/ContactForm.svelte';
	let { data } = $props();
	let p = $derived(data.content);
	let isService = $derived(p.slug.startsWith('services/'));
	let legal = $derived(['privacy', 'terms', 'image-credits'].includes(p.slug));
	let accent = $derived(p.accent && p.title.endsWith(p.accent) ? p.accent : '');
	let titleLead = $derived(accent ? p.title.slice(0, -accent.length) : p.title);
	let serviceIndex = $derived(services.findIndex((s) => `services/${s.slug}` === p.slug));
	let articleIndex = $derived(articles.findIndex((a) => `insights/${a.slug}` === p.slug));
	let projectIndex = $derived(projectIdeas.findIndex((a) => `projects/${a.slug}` === p.slug));
	let readingTime = $derived(
		Math.max(1, Math.ceil(p.sections.reduce((n, s) => n + s.body.split(/\s+/).length, 0) / 200))
	);
	let parent = $derived(
		isService
			? ['/services', 'Services']
			: p.kind === 'article'
				? ['/insights', 'Field notes']
				: p.kind === 'project'
					? ['/projects', 'Product concepts']
					: ['/', 'Space One']
	);
	const serviceApproaches = [
		['Understand the role.', 'Find the experience.'],
		['Define the product.', 'Build for its users.'],
		['Connect the systems.', 'Support the team.'],
		['Test what matters.', 'Know what ships.'],
		['Remove repeat work.', 'Keep people in control.'],
		['Agree on the numbers.', 'Find the next decision.'],
		['Repeatable releases.', 'Visible operations.'],
		['Useful questions.', 'Tested answers.'],
		['Clear ownership.', 'Dependable support.']
	];
	let approach = $derived(serviceApproaches[serviceIndex] || serviceApproaches[1]);
	let pads = $derived(
		serviceIndex === 0
			? ['The role & responsibilities', 'Relevant skills & experience', 'The hiring process']
			: ['Requirements & priorities', 'An agreed scope', 'A clear next step']
	);
	const candidateFeatures = [
		{
			icon: FileText,
			title: 'Your application, in context',
			body: 'Keep the job details, submitted resume, and proof of application together.'
		},
		{
			icon: CalendarDays,
			title: 'A calendar you can plan around',
			body: 'Record interview times, connect Google Calendar, and share your availability.'
		},
		{
			icon: MessageCircle,
			title: 'The conversation stays connected',
			body: 'Ask your coordinator a question on the job page. Keep the answer with the application.'
		}
	];
</script>

<svelte:head>
	<title>{p.title} · Space One Technology</title>
	<meta name="description" content={p.intro} />
	<link rel="canonical" href={`${data.origin}/${p.slug}`} />
	<meta property="og:title" content={p.title} /><meta property="og:description" content={p.intro} />
	<meta property="og:url" content={`${data.origin}/${p.slug}`} /><meta
		property="og:image"
		content={media.collaboration}
	/>
</svelte:head>

<div class="overflow-clip">
	<header class="site-width pb-12 pt-9 lg:pb-16 lg:pt-12">
		<a
			class="mb-10 inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-accent lg:mb-14"
			href={parent[0]}><ArrowLeft size={13} />{parent[1]}</a
		>
		<div
			class={`grid items-end gap-9 ${['services', 'careers'].includes(p.kind) || p.slug === 'about' ? 'lg:grid-cols-[1.35fr_.65fr]' : ''}`}
		>
			<div>
				<p class="site-kicker">{p.eyebrow}</p>
				<h1 class="site-title">
					{titleLead}{#if accent}<span class="site-serif text-primary">{accent}</span>{/if}
				</h1>
				<p class="mb-0 max-w-[730px] text-base leading-8 text-muted-foreground sm:text-lg">
					{p.intro}
				</p>
				{#if isService}<Button
						variant="default"
						class="site-button mt-8 bg-primary text-primary-content hover:bg-foreground"
						href={`/contact?topic=${encodeURIComponent(serviceIndex === 0 ? 'Hiring & staffing' : 'Technology project')}`}
						>Discuss your {serviceIndex === 0 ? 'hiring needs' : 'project'}
						<ArrowUpRight size={18} /></Button
					>{/if}
				{#if p.kind === 'careers'}<div class="mt-8 flex flex-wrap items-center gap-6">
						<Button
							variant="default"
							class="site-button bg-primary text-primary-content hover:bg-foreground"
							href={data.signedIn ? '/jobs' : '/client/signup'}
							>{data.signedIn ? 'Explore your opportunities' : 'Create your workspace'}<ArrowUpRight
								size={18}
							/></Button
						><a class="site-link" href="/resources/candidate-roadmap"
							>Prepare for your next interview <ArrowRight size={15} /></a
						>
					</div>{/if}
				{#if p.kind === 'article'}<div
						class="mt-7 flex items-center gap-3 text-xs text-muted-foreground"
					>
						<span
							class="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-primary"
							><Asterisk size={16} /></span
						>Space One field notes<span aria-hidden="true">/</span>{readingTime} min read
					</div>{/if}
			</div>
			{#if p.kind === 'services'}<div
					class="hidden justify-self-end border-l border-border py-2 pl-8 lg:block"
				>
					<Asterisk size={45} strokeWidth={1} class="mb-5 text-accent" />
					<p class="mb-0 max-w-52 text-sm leading-7 text-muted-foreground">
						Bring the challenge.<br /><span class="font-medium text-foreground"
							>We’ll start with the right questions.</span
						>
					</p>
				</div>
			{:else if p.kind === 'careers' || p.slug === 'about'}<div
					class="flex flex-wrap items-center gap-4 lg:flex-col lg:items-start lg:justify-self-end lg:pb-3"
				>
					<div class="flex shrink-0 -space-x-3" aria-hidden="true">
						{#each media.avatars.slice(0, 4) as avatar}<img
								src={avatar}
								alt=""
								width="52"
								height="52"
								class="h-12 w-12 shrink-0 rounded-full border-[3px] border-background bg-muted object-cover"
							/>{/each}
					</div>
					<p class="mb-0 max-w-52 text-xs leading-6 text-muted-foreground">
						{p.slug === 'about'
							? 'Different disciplines. A shared commitment to the work.'
							: 'Your search. Your next step. A team to keep it connected.'}
					</p>
				</div>{/if}
		</div>
	</header>

	{#if p.kind === 'services'}
		<section class="border-y border-border bg-card py-8 lg:py-12" aria-label="Technology services">
			<div class="site-width grid gap-x-12 md:grid-cols-2 lg:gap-x-20">
				{#each services as service, i}<a
						href={`/services/${service.slug}`}
						class="group border-b border-border py-8 last:border-0 md:last:border-b lg:py-10"
						><div class="mb-5 flex items-center justify-between">
							<span class="text-xs text-accent"
								>{String(i + 1).padStart(2, '0')} / {i === 0 ? 'PEOPLE' : 'TECHNOLOGY'}</span
							><ArrowUpRight
								size={22}
								strokeWidth={1.3}
								class="transition-transform group-hover:-translate-y-1 group-hover:translate-x-1"
							/>
						</div>
						<h2 class="section-title group-hover:text-primary">{service.name}</h2>
						<p class="mb-5 max-w-xl text-sm leading-7 text-muted-foreground">{service.intro}</p>
						<span class="text-xs font-medium underline decoration-accent/30 underline-offset-8"
							>See the approach</span
						></a
					>{/each}
			</div>
		</section>
		<section class="site-width grid gap-9 py-14 lg:grid-cols-[1fr_1fr] lg:py-20">
			<div>
				<p class="site-kicker">Where to begin</p>
				<h2 class="site-heading">
					You don’t need<br /><span class="site-serif text-primary">a perfect brief.</span>
				</h2>
			</div>
			<div>
				<p class="reading-copy">
					Tell us what is slowing your team down, what you have tried, and what needs to change.
					We’ll help define the scope before recommending a project, a support arrangement, or
					additional expertise.
				</p>
				<a class="site-link" href="/engagements"
					>Compare ways to work together <ArrowUpRight size={17} /></a
				>
			</div>
		</section>
	{:else if isService}
		<section class="border-y border-border bg-card py-12 lg:py-16">
			<div class="site-width grid items-start gap-10 lg:grid-cols-[.6fr_1.4fr] lg:gap-20">
				<aside class="lg:sticky lg:top-8">
					<p class="site-kicker">How we approach the work</p>
					<h2 class="site-heading">
						{approach[0]}<br /><span class="site-serif text-primary">{approach[1]}</span>
					</h2>
					<a class="site-link mt-4" href="/engagements"
						>Engagement options <ArrowUpRight size={17} /></a
					>
				</aside>
				<div>
					{#each p.sections as section, i}<section
							id={`section-${i + 1}`}
							class="scroll-mt-8 border-b border-border py-8 first:pt-0 last:border-0 last:pb-0"
						>
							<span class="mb-4 block text-xs text-accent">0{i + 1}</span>
							<h2 class="section-title">{section.title}</h2>
							<p class="reading-copy mb-0">{section.body}</p>
						</section>{/each}
				</div>
			</div>
		</section>
		<section class="site-width py-14 lg:py-20">
			<div class="grid gap-9 rounded-lg bg-muted p-7 sm:p-10 lg:grid-cols-[1fr_1fr]">
				<div>
					<p class="site-kicker">Before the work begins</p>
					<h2 class="mb-4 text-3xl font-medium tracking-tight">
						Everyone should know<br /><span class="site-serif text-primary">what happens next.</span
						>
					</h2>
					<p class="mb-0 max-w-md text-sm leading-7 text-muted-foreground">
						The first conversation helps us agree on the problem, responsibilities, and the right
						way to start.
					</p>
				</div>
				<div class="self-center">
					{#each pads as pad, i}<div
							class="flex items-center justify-between border-b border-primary/15 py-4 text-sm first:pt-0 last:border-0"
						>
							<span><span class="mr-5 text-xs text-accent">0{i + 1}</span>{pad}</span><Check
								size={16}
								class="text-primary"
							/>
						</div>{/each}
				</div>
			</div>
			<div class="mt-12 flex flex-wrap gap-6">
				<span class="text-xs text-muted-foreground">Related expertise</span>{#each services
					.filter((_, i) => i !== serviceIndex)
					.slice(0, 3) as service}<a
						class="text-xs font-medium hover:text-accent"
						href={`/services/${service.slug}`}>{service.name} ↗</a
					>{/each}
			</div>
		</section>
	{:else if p.kind === 'contact'}
		<section
			class="site-width grid items-start gap-10 pb-16 lg:grid-cols-[.8fr_1.2fr] lg:gap-20 lg:pb-24"
		>
			<aside class="order-2 lg:order-1">
				<div class="border-t border-border pt-7">
					<p class="site-kicker">Start with a conversation</p>
					<h2 class="section-title">
						A project. A person.<br /><span class="site-serif text-primary"
							>A question to work through.</span
						>
					</h2>
					<p class="text-sm leading-7 text-muted-foreground">
						Share the part you know. We’ll use your message to understand the request and follow up
						using your email.
					</p>
				</div>
				<a class="my-7 inline-flex items-center gap-3 text-lg font-medium" href="tel:+18327105930"
					><span
						class="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-primary"
						><Phone size={17} /></span
					>+1 (832) 710-5930</a
				>
				<p class="mb-7 text-xs text-muted-foreground">Monday–Friday · 8am–5pm Central</p>
				<div class="border-t border-border py-7">
					<h3 class="mb-3 text-sm font-medium">Our Irving office</h3>
					<address class="text-sm not-italic leading-7 text-muted-foreground">
						2300 Valley View Ln, Ste #865<br />Irving, TX 75062
					</address>
					<a
						class="site-link mt-4"
						href="https://www.google.com/maps/search/?api=1&query=2300+Valley+View+Ln+Irving+TX+75062"
						target="_blank"
						rel="noopener noreferrer">Get directions <ArrowUpRight size={14} /></a
					>
				</div>
				<div class="rounded-lg bg-accent/10 p-6">
					<h3 class="mb-3 text-base font-medium">Looking for your next role?</h3>
					<p class="mb-4 text-sm leading-7 text-muted-foreground">
						Create your client workspace to explore jobs and keep your applications organized.
					</p>
					<a class="site-link" href={data.signedIn ? '/jobs' : '/client/signup'}
						>{data.signedIn ? 'Open your job board' : 'Start your search'}
						<ArrowUpRight size={15} /></a
					>
				</div>
			</aside>
			<div class="order-1 lg:order-2">
				{#key page.url.searchParams.get('topic')}<ContactForm
						topic={page.url.searchParams.get('topic') || ''}
					/>{/key}
			</div>
		</section>
	{:else if p.kind === 'careers'}
		<section class="border-y border-border bg-card py-12 lg:py-16">
			<div class="site-width">
				<div class="mb-10 flex items-center justify-between border-b border-border pb-6">
					<p class="site-kicker mb-0">From the first application to the next conversation</p>
					<Asterisk size={27} strokeWidth={1.2} class="ml-4 shrink-0 text-accent" />
				</div>
				<div class="grid gap-10 md:grid-cols-3">
					{#each p.sections as section, i}<section>
							<span
								class="mb-6 flex h-11 w-11 items-center justify-center rounded-full border border-primary/20 text-xs text-primary"
								>0{i + 1}</span
							>
							<h2 class="section-title text-xl">{section.title}</h2>
							<p class="mb-0 text-sm leading-7 text-muted-foreground">{section.body}</p>
						</section>{/each}
				</div>
			</div>
		</section>
		<section
			class="site-width grid items-center gap-10 py-16 lg:grid-cols-[1fr_1fr] lg:gap-20 lg:py-24"
		>
			<figure class="m-0 overflow-hidden rounded-tl-[90px] rounded-br-[90px] bg-muted">
				<img
					src={media.collaboration}
					alt="People sharing ideas around a laptop"
					width="1024"
					height="645"
					loading="lazy"
					class="aspect-square w-full object-cover"
				/>
			</figure>
			<div>
				<p class="site-kicker">Made for the details</p>
				<h2 class="site-heading">
					Keep your energy<br /><span class="site-serif text-primary">for the opportunity.</span>
				</h2>
				{#each candidateFeatures as { icon: Icon, title, body }}<div
						class="flex gap-4 border-b border-border py-5 last:border-0"
					>
						<Icon size={20} strokeWidth={1.4} class="mt-1 shrink-0 text-accent" />
						<div>
							<h3 class="mb-2 text-base font-medium">{title}</h3>
							<p class="mb-0 text-sm leading-7 text-muted-foreground">{body}</p>
						</div>
					</div>{/each}
			</div>
		</section>
		<section class="site-width pb-16 lg:pb-24">
			<div
				class="flex flex-col justify-between gap-6 border-y border-border py-8 sm:flex-row sm:items-center"
			>
				<div>
					<h2 class="mb-2 text-2xl font-medium tracking-tight">
						The next interview starts with preparation.
					</h2>
					<p class="mb-0 text-sm text-muted-foreground">
						Ten steps to help you show your experience clearly.
					</p>
				</div>
				<a class="site-link shrink-0" href="/resources/candidate-roadmap"
					>Read the preparation guide <ArrowUpRight size={17} /></a
				>
			</div>
		</section>
	{:else if p.kind === 'articles'}
		<section class="site-width pb-16 lg:pb-24" aria-label="Field notes">
			<a
				href={`/insights/${articles[1].slug}`}
				class="group grid overflow-hidden rounded-lg border border-border bg-card md:grid-cols-2"
				><img
					src={media.editorial[0]}
					alt=""
					width="1024"
					height="673"
					class="h-full min-h-56 w-full object-cover"
				/>
				<div class="flex flex-col justify-center p-7 lg:p-12">
					<p class="site-kicker">The build-or-buy decision</p>
					<h2 class="site-heading text-3xl group-hover:text-primary">{articles[1].title}</h2>
					<p class="mb-7 text-sm leading-7 text-muted-foreground">{articles[1].intro}</p>
					<span class="site-link">Read the note <ArrowUpRight size={17} /></span>
				</div></a
			>
			<div class="mt-12 grid gap-x-8 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
				{#each articles.filter((_, i) => i !== 1) as article, i}
					<ArticleCard
						title={article.title}
						description={article.intro}
						href={`/insights/${article.slug}`}
						category={`Field note / ${String(i + 1).padStart(2, '0')}`}
					/>
				{/each}
			</div>
		</section>
	{:else if p.kind === 'projects'}
		<section class="site-width pb-16 lg:pb-24" aria-label="Product concepts">
			<div class="grid gap-x-8 gap-y-12 md:grid-cols-2">
				{#each projectIdeas as project, i}<a href={`/projects/${project.slug}`} class="group"
						><div class="relative mb-5 overflow-hidden rounded-lg bg-muted">
							<img
								src={media.editorial[i % media.editorial.length]}
								alt=""
								width="1024"
								height="673"
								loading={i < 2 ? 'eager' : 'lazy'}
								class="aspect-[1.8] w-full object-cover transition-transform duration-500 motion-safe:group-hover:scale-[1.03]"
							/><span
								class="absolute bottom-4 left-4 rounded bg-card px-3 py-2 text-xs font-medium uppercase tracking-[.13em]"
								>Concept / {String(i + 1).padStart(2, '0')}</span
							>
						</div>
						<div class="mb-3 flex items-center justify-between">
							<p class="site-kicker mb-0">{project.category}</p>
							<ArrowUpRight size={20} />
						</div>
						<h2 class="mb-2 text-3xl font-medium tracking-tight group-hover:text-primary">
							{project.name}
						</h2>
						<p class="mb-0 max-w-md text-sm leading-7 text-muted-foreground">{project.line}</p></a
					>{/each}
			</div>
		</section>
	{:else if p.slug === 'about'}
		<section class="site-width pb-16 lg:pb-24">
			<figure
				class="relative m-0 overflow-hidden rounded-tl-[70px] rounded-br-[70px] bg-muted sm:rounded-tl-[110px] sm:rounded-br-[110px]"
			>
				<img
					src={media.collaboration}
					srcset={`${media.collaborationSmall} 600w, ${media.collaboration} 1024w`}
					sizes="90vw"
					alt="A team working through ideas around a laptop"
					width="1024"
					height="645"
					class="aspect-[1.5] min-h-64 w-full object-cover sm:aspect-[2.25]"
				/>
				<figcaption
					class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-foreground/80 to-transparent px-7 pb-8 pt-20 text-primary-content sm:px-10"
				>
					<p class="mb-1 text-xs uppercase tracking-[.16em] text-primary-content/75">
						The work is always a conversation
					</p>
					<p class="mb-0 text-2xl font-medium sm:text-3xl">Listen closely. Build thoughtfully.</p>
				</figcaption>
			</figure>
			<div class="mt-14 grid gap-10 lg:grid-cols-[.55fr_1.45fr] lg:gap-20">
				<div>
					<p class="site-kicker">What you can expect</p>
					<h2 class="site-heading">
						The details<br /><span class="site-serif text-primary">matter to us.</span>
					</h2>
				</div>
				<div>
					{#each p.sections as section, i}<section
							id={`section-${i + 1}`}
							class="scroll-mt-8 border-b border-border py-7 first:pt-0 last:border-0"
						>
							<div class="flex items-start gap-5">
								<span class="pt-2 text-xs text-accent">0{i + 1}</span>
								<div>
									<h2 class="section-title">{section.title}</h2>
									<p class="reading-copy mb-0">{section.body}</p>
								</div>
							</div>
						</section>{/each}
				</div>
			</div>
			<div class="mt-10 grid gap-5 sm:grid-cols-2">
				<a
					class="group flex items-center justify-between gap-4 rounded-lg bg-muted p-7"
					href="/company/team"
					><span
						><span class="mb-2 block text-xs uppercase tracking-[.15em] text-primary"
							>The disciplines behind the work</span
						><strong class="text-xl font-medium">Different skills. Shared direction.</strong></span
					><ArrowUpRight size={23} class="shrink-0" /></a
				><a
					class="group flex items-center justify-between gap-4 rounded-lg bg-accent/10 p-7"
					href="/engagements"
					><span
						><span class="mb-2 block text-xs uppercase tracking-[.15em] text-accent"
							>Find the right fit</span
						><strong class="text-xl font-medium">How we work with your team.</strong></span
					><ArrowUpRight size={23} class="shrink-0" /></a
				>
			</div>
		</section>
	{:else if p.slug === 'company/team'}
		<section class="border-y border-border bg-card py-12 lg:py-16">
			<div class="site-width grid gap-x-14 gap-y-10 md:grid-cols-2">
				{#each p.sections as section, i}<section
						id={`section-${i + 1}`}
						class="scroll-mt-8 border-t border-border pt-7"
					>
						<div class="mb-7 flex items-center justify-between">
							<span class="text-xs text-accent">0{i + 1}</span><Asterisk
								size={25}
								strokeWidth={1}
								class="text-primary"
							/>
						</div>
						<h2 class="section-title">{section.title}</h2>
						<p class="reading-copy mb-0">{section.body}</p>
					</section>{/each}
			</div>
		</section>
		<section class="site-width grid gap-8 py-14 md:grid-cols-2 lg:py-20">
			<h2 class="site-heading">
				A shared outcome.<br /><span class="site-serif text-primary">Clear responsibilities.</span>
			</h2>
			<div>
				<p class="reading-copy">
					Projects work better when everyone knows what they own and when to bring another
					perspective into the conversation. We define those responsibilities as part of the
					engagement.
				</p>
				<a href="/engagements" class="site-link"
					>Find a way to work together <ArrowUpRight size={17} /></a
				>
			</div>
		</section>
	{:else if p.slug === 'engagements'}
		<section class="site-width pb-16 lg:pb-24">
			<div class="grid gap-5 lg:grid-cols-3">
				{#each p.sections.slice(0, 3) as section, i}<section
						id={`section-${i + 1}`}
						class="flex scroll-mt-8 flex-col rounded-lg border border-border p-7 sm:p-9"
						class:bg-forest={i === 0}
						class:text-primary-content={i === 0}
						class:bg-paper={i !== 0}
					>
						<span
							class="mb-10 block text-xs"
							class:text-primary-content={i === 0}
							class:text-rust={i !== 0}
							>0{i + 1} / {['DEFINED OUTCOME', 'CONTINUED CARE', 'ADDED EXPERTISE'][i]}</span
						>
						<h2 class="section-title">{section.title}</h2>
						<p
							class={`mb-8 text-sm leading-7 ${i === 0 ? 'text-primary-content/75' : 'text-muted-foreground'}`}
						>
							{section.body}
						</p>
						<a
							class={`mt-auto inline-flex items-center justify-between gap-4 border-t pt-5 text-xs font-medium ${i === 0 ? 'border-white/20' : 'border-border'}`}
							href={`/contact?topic=${encodeURIComponent(i === 2 ? 'Hiring & staffing' : 'Technology project')}`}
							>Discuss this engagement <ArrowUpRight size={17} /></a
						>
					</section>{/each}
			</div>
			<section
				id="section-4"
				class="mt-12 grid scroll-mt-8 gap-7 border-y border-border py-8 md:grid-cols-[.8fr_1.2fr]"
			>
				<h2 class="section-title mb-0">{p.sections[3].title}</h2>
				<p class="reading-copy mb-0">{p.sections[3].body}</p>
			</section>
		</section>
	{:else}
		{#if p.kind === 'project'}<div class="site-width">
				<figure class="m-0 overflow-hidden rounded-lg bg-muted">
					<img
						src={media.editorial[Math.max(0, projectIndex) % media.editorial.length]}
						alt=""
						width="1024"
						height="673"
						class="aspect-[2.6] min-h-52 w-full object-cover"
					/>
				</figure>
				<p class="mb-0 mt-4 text-xs leading-6 text-muted-foreground">
					Product concept · An exploration of the problem, proposed workflow, and validation. This
					is not a completed client implementation.
				</p>
			</div>{/if}
		<section
			class="site-width grid items-start gap-9 border-t border-border pb-16 pt-10 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-20 lg:pb-24 lg:pt-14"
		>
			<aside class="lg:sticky lg:top-8">
				<details open class="rounded-lg border border-border p-5 lg:border-0 lg:p-0">
					<summary
						class="cursor-pointer text-xs font-semibold uppercase tracking-[.15em] text-accent"
						>{legal
							? 'In this document'
							: p.slug === 'resources/candidate-roadmap'
								? 'Your preparation checklist'
								: p.kind === 'project'
									? 'Inside the concept'
									: 'In this note'}</summary
					>
					<nav
						aria-label="Page sections"
						class="mt-5 grid gap-4 text-xs leading-6 text-muted-foreground"
					>
						{#each p.sections as section, i}<a href={`#section-${i + 1}`} class="hover:text-accent"
								>{section.title}</a
							>{/each}
					</nav>
				</details>
				{#if p.kind === 'article'}<a class="site-link mt-8" href="/insights"
						>All field notes <ArrowLeft size={14} /></a
					>{:else if !legal}<a
						class="site-link mt-8"
						href={p.slug === 'resources/candidate-roadmap' ? '/careers' : '/contact'}
						>{p.slug === 'resources/candidate-roadmap'
							? 'Explore your next step'
							: 'Discuss the idea'}<ArrowUpRight size={15} /></a
					>{/if}
			</aside>
			<article class="min-w-0 max-w-[740px]">
				{#each p.sections as section, i}<section
						id={`section-${i + 1}`}
						class="scroll-mt-8 border-b border-border pb-9 pt-9 first:pt-0 last:border-0 last:pb-0"
					>
						<h2 class="section-title">{section.title}</h2>
						<p class="reading-copy mb-0">{section.body}</p>
					</section>{/each}{#if p.kind === 'article'}<div class="mt-12 rounded-lg bg-muted p-7">
						<p class="site-kicker">Put the idea to work</p>
						<h2 class="section-title">What does this look like for your team?</h2>
						<a href="/contact?topic=Technology%20project" class="site-link"
							>Talk through your project <ArrowUpRight size={16} /></a
						>
					</div>{:else if p.slug === 'resources/candidate-roadmap'}<div
						class="mt-12 rounded-lg bg-muted p-7"
					>
						<h2 class="section-title">Keep your preparation with the opportunity.</h2>
						<p class="text-sm leading-7 text-muted-foreground">
							Save the resume you submitted, record interview details, and add your next preparation
							task on the job page.
						</p>
						<a href={data.signedIn ? '/jobs' : '/client/signup'} class="site-link"
							>{data.signedIn ? 'Open your job board' : 'Create your workspace'}
							<ArrowUpRight size={16} /></a
						>
					</div>{/if}
			</article>
		</section>
		{#if p.kind === 'article'}<section class="border-t border-border bg-card py-12 lg:py-16">
				<div class="site-width">
					<p class="site-kicker">Keep reading</p>
					<div class="grid gap-8 md:grid-cols-3">
						{#each articles.filter((_, i) => i !== articleIndex).slice(0, 3) as article}<a
								href={`/insights/${article.slug}`}
								class="group border-t border-border pt-5"
								><h2
									class="mb-4 text-xl font-medium leading-snug tracking-tight group-hover:text-primary"
								>
									{article.title}
								</h2>
								<span class="inline-flex items-center gap-3 text-xs text-muted-foreground"
									>Read the note <ArrowUpRight size={15} /></span
								></a
							>{/each}
					</div>
				</div>
			</section>{/if}
	{/if}
</div>
