<script lang="ts">
	import {
		ArrowUpRight,
		ArrowRight,
		ArrowDown,
		Check,
		Play,
		Pause,
		Asterisk,
		Plus,
		Minus,
		CalendarDays,
		FileText,
		MessageCircle
	} from '@lucide/svelte';
	import { media } from '$lib/public/assets';
	import { services, articles } from '$lib/public/content';
	let { data } = $props();
	let motionPaused = $state(false);
	let activeService = $state(0);
	const disciplines = [
		'Technology staffing',
		'Software & apps',
		'Data & analytics',
		'Workflow automation',
		'Cloud & systems'
	];
	const featuredServices = [
		services[0],
		services[1],
		services[5],
		services[2],
		services[4],
		services[3]
	];
	const workspaceFeatures = [
		{
			icon: FileText,
			title: 'The resume you actually sent',
			detail: 'Saved with your application'
		},
		{
			icon: CalendarDays,
			title: 'Your next conversation',
			detail: 'Interview times and meeting links'
		},
		{
			icon: MessageCircle,
			title: 'Your team, in the loop',
			detail: 'Notes, questions, and next steps'
		}
	];
	const serviceNotes = [
		'People who understand the work. A hiring process that keeps everyone moving.',
		'From the first useful prototype to the product your customers use every day.',
		'Connect your sources, agree on the numbers, and see what needs your attention.',
		'Bring your tools and teams together around a more connected way of working.',
		'Give repetitive work a dependable process, and give your people their time back.',
		'Release with a clearer picture of what works, what matters, and what comes next.'
	];
</script>

<svelte:head>
	<title>Space One Technology · Good people. Great things.</title>
	<meta
		name="description"
		content="The engineering to build it. The people to move it forward. Discover technology consulting, software development, and career support with Space One Technology."
	/>
	<link rel="canonical" href={data.origin + '/'} />
	<meta property="og:title" content="Space One Technology · Good people. Great things." />
	<meta
		property="og:description"
		content="The engineering to build it. The people to move it forward."
	/>
	<meta property="og:image" content={media.collaboration} />
</svelte:head>

<div class="home-page overflow-clip">
	<section class="home-width pt-12 pb-12 lg:pt-20 lg:pb-16" aria-labelledby="home-title">
		<div class="grid items-center gap-12 lg:grid-cols-[1.08fr_1fr] lg:gap-14 xl:gap-20">
			<div class="relative z-10">
				<p
					class="mb-7 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[.18em] text-forest"
				>
					<span class="h-1.5 w-1.5 rounded-full bg-rust"></span>Technology & talent, connected
				</p>
				<h1 id="home-title" class="hero-title mb-7 font-medium text-ink">
					Good people.<br /><span class="editorial-serif text-forest">Great things.</span>
				</h1>
				<p class="mb-8 max-w-[27rem] text-base leading-[1.8] text-muted sm:text-lg">
					The engineering to build it. The people to move it forward. We help businesses do better
					work—and people find their place in it.
				</p>
				<div class="flex flex-wrap items-center gap-x-7 gap-y-4">
					<a class="home-button bg-forest text-white hover:bg-ink" href="/contact"
						>Let’s build something <ArrowUpRight size={18} /></a
					>
					<a
						class="inline-flex items-center gap-2 py-3 text-sm font-medium underline decoration-rust/40 underline-offset-8 hover:decoration-rust"
						href="/careers">Find your next role <ArrowRight size={16} /></a
					>
				</div>
				<div class="mt-10 flex flex-wrap items-center gap-4 lg:mt-12">
					<div class="flex shrink-0 -space-x-3" aria-hidden="true">
						{#each media.avatars.slice(0, 4) as avatar, i}<img
								src={avatar}
								alt=""
								width="48"
								height="48"
								class="h-11 w-11 shrink-0 rounded-full border-[3px] border-canvas bg-sage object-cover sm:h-12 sm:w-12"
								style={`z-index:${4 - i}`}
							/>{/each}
					</div>
					<p class="mb-0 text-xs leading-relaxed text-muted">
						Different skills. Shared ambition.<br /><span class="font-medium text-ink"
							>A little more human, by design.</span
						>
					</p>
				</div>
			</div>
			<div class="hero-visual relative mx-auto w-full max-w-[600px] pb-7 pl-4 sm:pl-8 lg:pb-10">
				<div
					class="absolute left-0 top-8 h-[78%] w-[88%] rounded-tl-[100px] rounded-br-[100px] border border-forest/20"
					aria-hidden="true"
				></div>
				<figure
					class="relative m-0 overflow-hidden rounded-tl-[100px] rounded-br-[100px] bg-sage sm:rounded-tl-[140px] sm:rounded-br-[140px]"
				>
					<img
						class="hero-photo w-full object-cover"
						src={media.collaboration}
						srcset={`${media.collaborationSmall} 600w, ${media.collaboration} 1024w`}
						sizes="(max-width: 1024px) 90vw, 44vw"
						alt="Colleagues bringing their ideas together around a laptop"
						width="1024"
						height="645"
						fetchpriority="high"
					/>
					<figcaption
						class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/85 to-transparent px-7 pb-9 pt-24 text-white sm:px-10 sm:pb-12"
					>
						<p class="mb-2 text-[10px] uppercase tracking-[.2em] text-white/75">
							Where good work begins
						</p>
						<p class="mb-0 text-xl font-medium leading-snug sm:text-2xl">
							A shared table.<br />A different perspective.
						</p>
					</figcaption>
				</figure>
				<div
					class="absolute -right-2 top-6 flex h-24 w-24 -rotate-12 flex-col items-center justify-center rounded-full bg-rust text-white shadow-sm sm:-right-4 sm:top-9 sm:h-28 sm:w-28"
					aria-hidden="true"
				>
					<Asterisk size={36} strokeWidth={1.3} /><span
						class="mt-1 text-[9px] font-medium uppercase tracking-[.16em]">People first</span
					>
				</div>
				<a
					href="#our-approach"
					class="absolute bottom-0 left-0 flex items-center gap-5 border border-line bg-paper px-5 py-4 shadow-[0_8px_30px_#2a302d0a] sm:px-6 sm:py-5"
					><span class="flex h-10 w-10 items-center justify-center rounded-full bg-sage text-forest"
						><ArrowDown size={19} /></span
					><span class="text-xs leading-relaxed text-muted"
						>A clear plan. A shared purpose.<br /><strong class="text-sm font-medium text-ink"
							>Get to know Space One</strong
						></span
					></a
				>
			</div>
		</div>
		<div
			class="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6 text-[10px] font-medium uppercase tracking-[.16em] text-muted lg:mt-16"
		>
			<span>Based in Texas. Built for connection.</span><span class="flex items-center gap-3"
				><span class="h-px w-8 bg-rust"></span>Your ambition. Our starting point.</span
			>
		</div>
	</section>

	<section
		class="marquee-section relative border-y border-forest/15 bg-sage py-7 sm:py-9"
		aria-label="Our areas of expertise"
	>
		<p class="sr-only">
			Technology staffing, software and app development, data and analytics, workflow automation,
			cloud and systems.
		</p>
		<div class="marquee-window mr-14 overflow-hidden" aria-hidden="true">
			<div class="marquee-track flex w-max" class:motion-paused={motionPaused}>
				{#each [0, 1] as copy}<div class="flex shrink-0 items-center">
						{#each disciplines as discipline}<span
								class="flex shrink-0 items-center gap-8 pr-8 text-[clamp(1.25rem,2.6vw,2.5rem)] font-medium tracking-tight text-forest sm:gap-12 sm:pr-12"
								>{discipline}<Asterisk size={27} strokeWidth={1.3} class="text-rust" /></span
							>{/each}
					</div>{/each}
			</div>
		</div>
		<button
			type="button"
			class="marquee-control absolute right-4 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-forest/25 bg-sage text-forest hover:bg-paper"
			aria-label={motionPaused ? 'Resume marquee' : 'Pause marquee'}
			aria-pressed={motionPaused}
			onclick={() => (motionPaused = !motionPaused)}
			>{#if motionPaused}<Play size={13} />{:else}<Pause size={13} />{/if}</button
		>
	</section>

	<section
		id="our-approach"
		class="home-width scroll-mt-8 py-16 lg:py-24"
		aria-labelledby="approach-title"
	>
		<div class="grid gap-8 lg:grid-cols-[.5fr_1.5fr] lg:gap-16">
			<div>
				<p class="home-kicker">01 / A shared direction</p>
				<span class="hidden text-rust lg:block" aria-hidden="true"
					><Asterisk size={60} strokeWidth={0.9} /></span
				>
			</div>
			<div>
				<h2 id="approach-title" class="home-heading max-w-[850px]">
					Behind every better business,<br class="hidden xl:block" /> there are
					<span class="editorial-serif text-forest">people making it happen.</span>
				</h2>
				<div class="mt-8 grid gap-7 sm:grid-cols-[1.1fr_1fr]">
					<p class="mb-0 text-base leading-8 text-muted">
						We work where technology and talent meet. A product that needs building. A team that
						needs the right expertise. A career ready for a new direction.
					</p>
					<div>
						<p class="mb-5 text-base leading-8 text-muted">
							We start by listening, get clear on the work, and stay close to the details that make
							progress possible.
						</p>
						<a href="/about" class="home-text-link">Our way of working <ArrowUpRight size={17} /></a
						>
					</div>
				</div>
			</div>
		</div>
		<div class="mt-12 grid gap-5 md:grid-cols-2 lg:mt-16">
			<a
				href="/services"
				class="group relative flex min-h-[340px] flex-col justify-between overflow-hidden rounded-[10px] bg-forest p-7 text-white sm:p-10"
			>
				<div class="relative z-10 flex items-center justify-between">
					<span class="text-[10px] font-medium uppercase tracking-[.17em] text-sage"
						>For businesses</span
					><ArrowUpRight
						size={25}
						strokeWidth={1.3}
						class="transition-transform group-hover:-translate-y-1 group-hover:translate-x-1"
					/>
				</div>
				<div class="relative z-10 mt-14">
					<h3
						class="mb-4 max-w-[370px] text-3xl font-medium leading-[1.15] tracking-tight sm:text-4xl"
					>
						Build the next thing.<br /><span class="editorial-serif text-sage"
							>Bring the right people.</span
						>
					</h3>
					<p class="mb-0 max-w-[300px] text-sm leading-7 text-white/75">
						Engineering, systems, and talent support that fit the work you need to do.
					</p>
				</div>
				<div
					class="pointer-events-none absolute -bottom-16 -right-14 h-64 w-64 rounded-full border border-sage/15"
					aria-hidden="true"
				></div>
				<div
					class="pointer-events-none absolute -bottom-8 -right-6 h-48 w-48 rounded-full border border-sage/15"
					aria-hidden="true"
				></div>
			</a>
			<a
				href="/careers"
				class="group relative flex min-h-[340px] flex-col justify-between overflow-hidden rounded-[10px] bg-sand p-7 sm:p-10"
			>
				<div class="relative z-10 flex items-center justify-between">
					<span class="text-[10px] font-medium uppercase tracking-[.17em] text-rust"
						>For your career</span
					><ArrowUpRight
						size={25}
						strokeWidth={1.3}
						class="text-rust transition-transform group-hover:-translate-y-1 group-hover:translate-x-1"
					/>
				</div>
				<div class="relative z-10 mt-14">
					<h3 class="mb-4 text-3xl font-medium leading-[1.15] tracking-tight sm:text-4xl">
						Your experience.<br /><span class="editorial-serif text-rust">New possibilities.</span>
					</h3>
					<p class="mb-0 max-w-[290px] text-sm leading-7 text-muted">
						Find relevant roles, prepare for the conversation, and keep your next move organized.
					</p>
				</div>
				<div
					class="absolute bottom-7 right-6 hidden flex-col -space-y-4 min-[500px]:flex md:hidden xl:flex"
					aria-hidden="true"
				>
					{#each media.avatars.slice(2, 5) as avatar, i}<img
							src={avatar}
							alt=""
							width="64"
							height="64"
							loading="lazy"
							class="h-16 w-16 rounded-full border-4 border-sand bg-sage object-cover"
							style={`transform:translateX(${i === 1 ? '-16' : '0'}px)`}
						/>{/each}
				</div>
			</a>
		</div>
	</section>

	<section class="border-y border-line bg-paper py-16 lg:py-24" aria-labelledby="services-title">
		<div class="home-width grid items-start gap-10 lg:grid-cols-[.85fr_1.15fr] lg:gap-20">
			<div>
				<p class="home-kicker">02 / What we bring</p>
				<h2 id="services-title" class="home-heading">
					Big-picture thinking.<br /><span class="editorial-serif text-forest"
						>Sleeves-up doing.</span
					>
				</h2>
				<p class="mt-6 max-w-sm text-base leading-8 text-muted">
					From a specialist on your team to a system built around your business. Start with what you
					need to move forward.
				</p>
				<a href="/services" class="home-text-link mt-3"
					>Explore all services <ArrowUpRight size={17} /></a
				>
				<figure
					class="relative mb-0 mt-10 hidden max-w-[380px] overflow-hidden rounded-[10px] bg-sage lg:block"
				>
					<img
						src={media.projectWorkspace}
						alt=""
						width="1024"
						height="673"
						loading="lazy"
						class="aspect-[1.6] w-full object-cover"
					/>
					<figcaption
						class="absolute bottom-3 left-3 rounded bg-paper px-3 py-2 text-[10px] font-medium uppercase tracking-[.1em]"
					>
						Thought through. Built with care.
					</figcaption>
				</figure>
			</div>
			<div class="border-t border-line">
				{#each featuredServices as service, i}<div class="border-b border-line py-1">
						<h3 class="m-0">
							<button
								type="button"
								class="flex w-full items-center gap-5 py-6 text-left hover:text-forest"
								aria-expanded={activeService === i}
								aria-controls={`home-service-${i}`}
								onclick={() => (activeService = activeService === i ? -1 : i)}
								><span class="text-[11px] font-normal text-rust">0{i + 1}</span><span
									class="grow text-xl font-medium tracking-tight sm:text-2xl">{service.name}</span
								><span
									class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
									class:bg-sage={activeService === i}
									>{#if activeService === i}<Minus size={18} />{:else}<Plus size={18} />{/if}</span
								></button
							>
						</h3>
						<div id={`home-service-${i}`} hidden={activeService !== i} class="pb-7 pl-10 pr-6">
							<p class="mb-4 max-w-md text-sm leading-7 text-muted">{serviceNotes[i]}</p>
							<a href={`/services/${service.slug}`} class="home-text-link text-xs"
								>Explore {service.name.toLowerCase()} <ArrowUpRight size={15} /></a
							>
						</div>
					</div>{/each}
			</div>
		</div>
	</section>

	<section class="home-width py-16 lg:py-24" aria-labelledby="workspace-title">
		<div class="grid items-center gap-12 lg:grid-cols-[1fr_1fr] lg:gap-20">
			<div class="relative rounded-xl bg-sage px-5 pb-8 pt-8 sm:px-9 sm:pb-10 sm:pt-10">
				<div class="mb-6 flex items-center justify-between">
					<span class="text-[10px] font-semibold uppercase tracking-[.16em] text-forest"
						>A little clarity goes a long way</span
					><Asterisk size={26} strokeWidth={1.2} class="text-forest" />
				</div>
				<div
					class="workspace-preview rounded-lg border border-forest/10 bg-paper p-5 shadow-[0_16px_36px_#304b3b0a] sm:p-7"
					aria-label="Illustrative preview of the client workspace"
				>
					<div class="flex items-center gap-3 border-b border-line pb-5">
						<div class="flex h-10 w-10 items-center justify-center rounded-full bg-sand text-rust">
							<FileText size={19} strokeWidth={1.4} />
						</div>
						<div>
							<p class="mb-0 text-sm font-medium">Your next chapter</p>
							<p class="mb-0 text-xs text-muted">Everything in one place</p>
						</div>
						<span class="ml-auto h-2 w-2 rounded-full bg-forest" aria-hidden="true"></span>
					</div>
					<div class="py-5">
						<span class="rounded bg-sage px-2.5 py-1 text-[10px] font-medium text-forest"
							>Application workspace</span
						>
						<h3 class="mb-1 mt-4 text-xl font-medium">The role that feels right.</h3>
						<p class="mb-0 text-xs text-muted">A clear next step, from application to interview.</p>
					</div>
					<div class="space-y-3 border-t border-line pt-4">
						{#each workspaceFeatures as { icon: Icon, title, detail }}<div
								class="flex items-center gap-3 rounded-md bg-canvas px-3 py-3"
							>
								<Icon size={17} strokeWidth={1.4} class="shrink-0 text-forest" />
								<div>
									<p class="mb-0 text-xs font-medium">{title}</p>
									<p class="mb-0 mt-0.5 text-[11px] text-muted">{detail}</p>
								</div>
								<Check size={14} class="ml-auto shrink-0 text-forest" />
							</div>{/each}
					</div>
				</div>
				<p class="mb-0 mt-4 text-[10px] text-forest/70">
					A preview of how your search comes together.
				</p>
			</div>
			<div>
				<p class="home-kicker">03 / A workspace for your next move</p>
				<h2 id="workspace-title" class="home-heading">
					Your search has<br />a lot of moving parts.<br /><span class="editorial-serif text-forest"
						>Give it a home.</span
					>
				</h2>
				<p class="mb-7 mt-6 max-w-md text-base leading-8 text-muted">
					Keep the opportunity, the resume, the conversation, and the follow-up together. Your Space
					One workspace gives you and your team a shared view of what comes next.
				</p>
				<ul class="mb-8 grid list-none gap-3 p-0 text-sm">
					{#each ['Relevant roles, ready to explore', 'Interview plans and shared availability', 'A record of every application and next step'] as item}<li
							class="flex items-center gap-3"
						>
							<Check size={15} class="text-rust" />{item}
						</li>{/each}
				</ul>
				<a
					class="home-button bg-forest text-white hover:bg-ink"
					href={data.signedIn ? '/dashboard' : '/client/signup'}
					>{data.signedIn ? 'Open your workspace' : 'Find your starting point'}<ArrowUpRight
						size={18}
					/></a
				>
				<p class="mb-0 mt-4 text-xs text-muted">
					Already with us? <a
						class="underline underline-offset-4 hover:text-ink"
						href="/client/login">Sign in to your workspace</a
					>
				</p>
			</div>
		</div>
	</section>

	<section class="bg-forest py-16 text-white lg:py-20" aria-labelledby="people-title">
		<div class="home-width">
			<div class="mb-10 flex flex-wrap items-end justify-between gap-7">
				<div>
					<p class="mb-5 text-[10px] font-medium uppercase tracking-[.18em] text-sage/75">
						04 / Technology is a team sport
					</p>
					<h2 id="people-title" class="home-heading mb-0 text-white">
						Good questions.<br /><span class="editorial-serif text-sage">Better conversations.</span
						>
					</h2>
				</div>
				<p class="mb-0 max-w-sm text-sm leading-7 text-white/70">
					A shared screen. An honest conversation. People willing to work through the details.
					That’s where the next good idea begins.
				</p>
			</div>
			<figure class="m-0">
				<video
					class="aspect-[16/8] min-h-56 w-full rounded-lg bg-ink object-cover"
					controls
					muted
					playsinline
					preload="none"
					poster={media.collaboration}
					aria-label="Collaboration footage from the Space One media library"
					><source src={media.collaborationVideo} type="video/mp4" />Your browser cannot play this
					video. <a href={media.collaborationVideo}>Open the original video</a>.</video
				>
				<figcaption
					class="mt-4 flex flex-wrap items-center justify-between gap-3 text-[10px] uppercase tracking-[.12em] text-sage/70"
				>
					<span>From the Space One media library</span><a
						href="/about"
						class="inline-flex items-center gap-2 text-white hover:underline"
						>The people side of our work <ArrowUpRight size={14} /></a
					>
				</figcaption>
			</figure>
		</div>
	</section>

	<section class="home-width py-16 lg:py-24" aria-labelledby="insights-title">
		<div class="mb-10 flex flex-wrap items-end justify-between gap-6">
			<div>
				<p class="home-kicker">05 / Notes worth sharing</p>
				<h2 id="insights-title" class="home-heading mb-0">
					A fresh <span class="editorial-serif text-forest">perspective.</span>
				</h2>
			</div>
			<a class="home-text-link" href="/insights">Read our field notes <ArrowUpRight size={17} /></a>
		</div>
		<div class="grid gap-9 md:grid-cols-3 md:gap-6 lg:gap-9">
			{#each [articles[1], articles[4], articles[7]] as article, i}<a
					href={`/insights/${article.slug}`}
					class="group"
					><div class="mb-5 overflow-hidden rounded-lg bg-sage">
						<img
							src={media.editorial[i]}
							alt=""
							width="1024"
							height="673"
							loading="lazy"
							class="aspect-[1.55] w-full object-cover transition-transform duration-500 motion-safe:group-hover:scale-[1.03]"
						/>
					</div>
					<div class="mb-3 flex items-center justify-between">
						<span class="text-[10px] font-medium uppercase tracking-[.15em] text-rust"
							>{['Product thinking', 'Engineering', 'Design & experience'][i]}</span
						><ArrowUpRight
							size={18}
							class="text-muted transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
						/>
					</div>
					<h3 class="mb-3 text-xl font-medium leading-snug tracking-tight group-hover:text-forest">
						{article.title}
					</h3>
					<p class="mb-0 text-sm leading-7 text-muted">{article.intro}</p></a
				>{/each}
		</div>
	</section>
</div>

<style>
	.home-width {
		width: min(100%, 1600px);
		margin-inline: auto;
		padding-inline: clamp(24px, 4vw, 64px);
	}
	.hero-title {
		font-size: clamp(3.2rem, 5.9vw, 5.6rem);
		line-height: 1.06;
		letter-spacing: -0.065em;
	}
	.editorial-serif {
		font-family: Georgia, 'Times New Roman', serif;
		font-style: italic;
		font-weight: 400;
		letter-spacing: -0.055em;
	}
	.home-heading {
		font-size: clamp(2.2rem, 3.7vw, 3.65rem);
		font-weight: 500;
		line-height: 1.13;
		letter-spacing: -0.045em;
	}
	.home-kicker {
		margin-bottom: 24px;
		font-size: 10px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.17em;
		color: var(--accent);
	}
	.home-button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 28px;
		min-height: 52px;
		padding: 15px 23px;
		border-radius: 6px;
		font-size: 13px;
		font-weight: 500;
		transition: background 0.2s;
	}
	.home-text-link {
		display: inline-flex;
		align-items: center;
		gap: 12px;
		width: fit-content;
		padding-block: 4px;
		border-bottom: 1px solid #a4513560;
		font-size: 13px;
		font-weight: 500;
	}
	.home-text-link:hover {
		border-color: var(--accent);
		color: var(--accent);
	}
	.hero-photo {
		height: clamp(360px, 38vw, 535px);
		object-position: 48% center;
	}
	.marquee-track {
		animation: expertise-scroll 42s linear infinite;
	}
	.marquee-track.motion-paused,
	.marquee-section:hover .marquee-track,
	.marquee-section:focus-within .marquee-track {
		animation-play-state: paused;
	}
	.marquee-window {
		mask-image: linear-gradient(to right, transparent, black 3%, black 97%, transparent);
	}
	@keyframes expertise-scroll {
		to {
			transform: translateX(-50%);
		}
	}
	@media (max-width: 1023px) {
		.hero-title {
			font-size: clamp(2.5rem, 13.5vw, 5.4rem);
		}
		.hero-photo {
			height: clamp(360px, 65vw, 510px);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.marquee-track {
			animation: none;
			width: auto;
		}
		.marquee-track > div:first-child {
			flex-wrap: wrap;
			justify-content: center;
			gap: 12px;
		}
		.marquee-track > div:nth-child(2),
		.marquee-control {
			display: none;
		}
		.marquee-window {
			margin-right: 0;
			mask-image: none;
		}
	}
</style>
