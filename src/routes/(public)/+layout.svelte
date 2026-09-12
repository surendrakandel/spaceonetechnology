<script lang="ts">
	import { Button } from '@usecase-ui/svelte';

	import '$lib/public/site.css';
	import { page } from '$app/state';
	import { ArrowUpRight, ArrowRight, Menu, X, Globe } from '@lucide/svelte';
	let { children, data } = $props();
	let menu = $state(false);
	let careerPage = $derived(
		page.url.pathname === '/careers' || page.url.pathname.startsWith('/resources/')
	);
	let showClosing = $derived(
		!['/contact', '/privacy', '/terms', '/image-credits'].includes(page.url.pathname)
	);
	let closing = $derived(
		careerPage
			? {
					lead: 'Ready for your',
					accent: 'next chapter?',
					label: data.signedIn ? 'Open your job board' : 'Create your workspace',
					href: data.signedIn ? '/jobs' : '/client/signup'
				}
			: page.url.pathname === '/services/technology-staffing'
				? {
						lead: 'Tell us who',
						accent: 'your team needs.',
						label: 'Discuss your hiring needs',
						href: '/contact?topic=Hiring%20%26%20staffing'
					}
				: page.url.pathname.startsWith('/services') || page.url.pathname === '/engagements'
					? {
							lead: 'Tell us what needs',
							accent: 'to work better.',
							label: 'Discuss your project',
							href: '/contact?topic=Technology%20project'
						}
					: {
							lead: 'Good work starts',
							accent: 'with a conversation.',
							label: 'Start a conversation',
							href: '/contact'
						}
	);
	const links = [
		['/services', 'Services'],
		['/about', 'Company'],
		['/projects', 'Our thinking'],
		['/careers', 'Careers'],
		['/insights', 'Insights']
	];
</script>

<div class="public-site bg-background min-h-screen">
	<a
		class="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:bg-card focus:p-4"
		href="#public-main">Skip to content</a
	>
	<header class="border-b border-border bg-background">
		<div
			class="max-w-[1600px] mx-auto px-6 sm:px-[4vw] min-h-22 flex items-center justify-between gap-6"
		>
			<a
				class="brand text-2xl flex items-center gap-2"
				href="/"
				aria-label="Space One Technology home"
			>
				<img
					src="/images/spaceonetechnology-logo.png"
					alt="Space One Technology"
					class="h-auto w-auto max-w-[175px] object-contain"
				/>

				<span class="sr-only">
					spaceonetechnology<span class="brand-dot">.</span>
				</span>
			</a>
			<nav class="hidden lg:flex gap-7 text-sm" aria-label="Company navigation">
				{#each links as [href, label]}<a
						class="hover:text-accent transition-colors"
						class:text-rust={page.url.pathname.startsWith(href)}
						{href}>{label}</a
					>{/each}
			</nav>
			<div class="flex items-center gap-6">
				<a
					class="hidden sm:flex text-sm items-center gap-2 hover:text-accent"
					href={data.signedIn ? '/dashboard' : '/client/login'}
					>{data.signedIn ? 'Dashboard' : 'Client sign in'}<ArrowUpRight size={15} /></a
				><Button variant="default" class="button primary hidden lg:inline-flex" href="/contact"
					>Let’s talk <ArrowUpRight size={16} /></Button
				><Button
					variant="ghost"
					type="button"
					size="icon"
					class="icon-button lg:hidden"
					aria-label={menu ? 'Close navigation' : 'Open navigation'}
					aria-expanded={menu}
					onclick={() => (menu = !menu)}
					>{#if menu}<X />{:else}<Menu />{/if}</Button
				>
			</div>
		</div>
		{#if menu}<nav
				class="lg:hidden border-t border-border px-6 py-6 grid gap-5"
				aria-label="Mobile navigation"
			>
				{#each [...links, ['/contact', 'Contact'], [data.signedIn ? '/dashboard' : '/client/login', data.signedIn ? 'Dashboard' : 'Client sign in']] as [href, label]}<a
						{href}
						onclick={() => (menu = false)}>{label}</a
					>{/each}
			</nav>{/if}
	</header>
	<main id="public-main">{@render children()}</main>
	{#if showClosing}<section class="bg-primary text-primary-content">
			<div
				class="site-width flex flex-col justify-between gap-8 py-14 md:flex-row md:items-center lg:py-20"
			>
				<div>
					<p class="mb-5 text-xs uppercase tracking-[.17em] text-primary-content/75">
						Make your next move
					</p>
					<h2 class="site-heading mb-0 text-primary-content">
						{closing.lead}<br /><span class="site-serif text-primary-content">{closing.accent}</span
						>
					</h2>
				</div>
				<Button
					variant="default"
					class="site-button w-fit shrink-0 bg-muted text-primary hover:bg-card"
					href={closing.href}>{closing.label}<ArrowUpRight size={20} /></Button
				>
			</div>
		</section>{/if}
	<footer class="site-width pt-16 pb-7">
		<div class="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
			<div>
				<a
					class="brand text-2xl flex items-center gap-2"
					href="/"
					aria-label="Space One Technology home"
				>
					<img
						src="/images/spaceonetechnology-logo.png"
						alt="Space One Technology"
						class="h-auto max-w-[175px] w-auto"
					/>

					<span class="sr-only">
						spaceonetechnology<span class="brand-dot">.</span>
					</span>
				</a>
				<p class="text-muted-foreground text-sm leading-7 mt-5 max-w-64">
					Technology that works.<br />People who move it forward.
				</p>
				<a
					class="inline-flex items-center gap-2 text-sm mt-2"
					href="https://www.linkedin.com/company/spaceonesocial"
					target="_blank"
					rel="noopener noreferrer"><Globe size={16} />Follow our work <ArrowUpRight size={14} /></a
				>
			</div>
			<div>
				<h3 class="text-sm mb-5">Explore</h3>
				<div class="grid gap-3 text-sm text-muted-foreground">
					{#each [['/services', 'Services'], ['/about', 'About Space One'], ['/company/team', 'Our disciplines'], ['/projects', 'Product concepts'], ['/engagements', 'Engagements'], ['/insights', 'Insights']] as [href, label]}<a
							class="hover:text-foreground"
							{href}>{label}</a
						>{/each}
				</div>
			</div>
			<div>
				<h3 class="text-sm mb-5">Your next chapter</h3>
				<div class="grid gap-3 text-sm text-muted-foreground">
					{#each [['/careers', 'Careers'], ['/client/login', 'Client workspace'], ['/client/signup', 'Create an account'], ['/resources/candidate-roadmap', 'Preparation guide'], ['/contact', 'Get in touch']] as [href, label]}<a
							class="hover:text-foreground"
							{href}>{label}</a
						>{/each}
				</div>
			</div>
			<div>
				<h3 class="text-sm mb-5">Based in Texas. Built for connection.</h3>
				<address class="not-italic text-sm text-muted-foreground leading-7">
					2300 Valley View Ln, Ste #865<br />Irving, TX 75062<br /><a
						class="inline-link block mt-3"
						href="tel:+18327105930">+1 (832) 710-5930</a
					>
				</address>
				<p class="text-xs text-muted-foreground mt-3">Monday–Friday · 8am–5pm Central</p>
			</div>
		</div>
		<div
			class="flex flex-wrap justify-between gap-5 border-t border-border mt-14 pt-6 text-xs text-muted-foreground"
		>
			<span>© {new Date().getFullYear()} Space One Technology.</span>
		</div>
	</footer>
</div>
