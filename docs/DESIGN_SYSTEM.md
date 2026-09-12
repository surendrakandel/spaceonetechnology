# Space One design system

Space One uses **Usecase UI + daisyUI + Tailwind CSS**, with the **Sage** palette and DM Sans. The existing photography, editorial serif accents, page structure, copy, and account workflows remain part of Space One's identity.

## One theme configuration

Edit `usecase.theme.json`. The root `ThemeProvider` applies the settings to public pages, authentication screens, and the signed-in workspace. Its schema supplies editor completion and documents the available settings.

- `controls.height`: `3rem` (48px) for standard fields and buttons.
- `controls.fontSize`: `1rem` (16px); field labels use the shared small-text token.
- `layout.containerWidth`: `100rem` (1600px); reading content stays narrower.
- `shape.radius`: `0.75rem` for cards; field corners use `--radius-field`.
- `colors`: only Space One's canvas and rust accent override Sage.
- `tokens`: editorial heading scales, serif font, card padding, and sidebar width.
- `motion`: theme-level preferences; controls use the library's shared Motion behavior and respect reduced motion.

Use `--color-page` for the canvas, `--color-surface` for cards, `--color-surface-inset` for grouped content, `--color-border` for outlines, and `--shadow-card` for subtle depth. Use semantic status colors for errors and success. Never use a border-color token as a card background.

## Components and page composition

```svelte
<script lang="ts">
	import { Button, Card, Input, Textarea, MetricCard } from '@usecase-ui/svelte';
</script>

<Card class="panel">
	<h2>Contact details</h2>
	<label class="field-label">
		Email address
		<Input type="email" name="email" autocomplete="email" required />
	</label>
	<Button type="submit">Save changes</Button>
</Card>
```

Use ordinary internal headings. Do not position visible legends across card outlines. Associate labels with fields, retain semantic fieldsets for related choices, and keep helper text next to its control.

The shared `field-label` composition gives inputs, native selects, and textareas the same label spacing. Native selects retain browser keyboard behavior and use `class="du-select"`. Keep selection values, validation, form names, `bind:value`, and submit handlers intact when replacing controls. Explicitly set `type="submit"` for submission buttons; the library's default is `button`.

Use compact buttons only for secondary toolbar actions, standard buttons for form submissions, and content-driven height for multi-line disclosures. Avoid setting independent input heights on individual pages. Keep date controls wide enough for both their text and calendar affordance.

`src/app.css` handles Space One layout and business-specific compositions. `src/lib/public/site.css` handles editorial typography. Both consume the same tokens. Generic controls, status badges, dashboard metrics, article cards, and the theme provider come from the library.

## Installation and updates

The library tarball is committed under `vendor/usecase-ui`; the npm dependency uses a relative file path. A fresh checkout works without a sibling library checkout or a published npm release:

```sh
npm ci
npm run dev
```

Update from a new tarball built by the standalone library:

```sh
npm run ui:update -- /path/to/usecase-ui-svelte-0.1.0.tgz
npm run check
npm run test:ui
```

Review the dependency diff and commit the new tarball with the updated lockfile. npm and `package-lock.json` are authoritative for this application. If using pnpm, run `pnpm import` after an npm dependency update to refresh its lockfile.

Vite excludes `@usecase-ui/svelte` from dependency prebundling in development to keep the package on the application's Svelte runtime. This follows the plugin's documented [per-library prebundling option](https://github.com/sveltejs/vite-plugin-svelte/blob/main/docs/faq.md). Production builds still compile and tree-shake the package normally.

## Validation

```sh
npm run check
npm test
npm run test:ui
```

On a new development machine, install the test browsers once with `npx playwright install chromium webkit`.

The browser suite checks Chromium and WebKit. It builds the site, starts an isolated local Cloudflare Worker, and checks public and workspace routes at mobile and desktop widths, hydration, overflow, form sizing, password visibility, sign-in, and task submission. It creates fictional test accounts in `.wrangler/ui-test` and cleans them up. The test Worker has local D1/R2 and local mail mode, with no production secrets or remote email binding. Screenshots and failure traces are written under `artifacts/`.

Keep the existing API integration tests for account, permissions, uploads, jobs, invitations, and calendar workflows. Visual changes must preserve those behaviors.
