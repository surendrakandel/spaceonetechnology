import { test, expect } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
const jobId = `ui-job-${Date.now()}`;
const base = 'http://127.0.0.1:8790';
const email = `ui-${Date.now()}@example.com`;
const password = 'Local interface test passphrase!';
let userId: string;
let cookie: { name: string; value: string; domain: string; path: string }[];
function sql(command: string) {
	execFileSync(
		process.execPath,
		[
			resolve('node_modules/wrangler/bin/wrangler.js'),
			'd1',
			'execute',
			'space-one-clients',
			'--local',
			'--config',
			resolve('.wrangler/ui-test/wrangler.json'),
			'--persist-to',
			resolve('.wrangler/ui-test/state'),
			'--command',
			command
		],
		{ stdio: 'pipe' }
	);
}
test.beforeAll(async ({ request }) => {
	// Only this suite's isolated local database; repeated runs must not share throttle counters.
	sql('DELETE FROM rate_limits;');
	const response = await request.post('/api/auth/signup', {
		headers: { origin: base },
		data: { name: 'Interface Test', email, password, phone: '+1 555 010 2222' }
	});
	expect(response.status()).toBe(201);
	const me = await (await request.get('/api/me')).json();
	userId = me.user.id;
	sql(`UPDATE users SET role='admin',access_role='admin' WHERE id='${userId}'`);
	const created = await request.post('/api/admin/jobs', {
		headers: { origin: base },
		data: {
			id: jobId,
			title: 'Interface Test Engineer',
			company: 'Example Company',
			location: 'Remote',
			description: 'A local interface test opportunity.',
			application_url: 'https://example.com/apply',
			visibility: 'all'
		}
	});
	expect(created.status()).toBe(201);
	const state = await request.storageState();
	cookie = state.cookies;
});
test.afterAll(() => {
	if (userId)
		sql(
			`DELETE FROM jobs WHERE id='${jobId}'; DELETE FROM sessions WHERE user_id='${userId}'; DELETE FROM users WHERE id='${userId}';`
		);
});

for (const width of [390, 1440]) {
	test(`public page templates remain usable at ${width}px`, async ({ page, request }) => {
		await page.setViewportSize({ width, height: 900 });
		const errors: string[] = [];
		page.on('pageerror', (e) => errors.push(e.message));
		const sitemap = await (await request.get('/sitemap.xml')).text();
		const paths = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
		for (const path of paths) {
			const response = await page.goto(path);
			expect(response?.status(), path).toBe(200);
			await expect(page.locator('h1')).toHaveCount(1);
			await expect(page.locator('[data-theme="sage"]').first()).toBeVisible();
			expect(
				await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
				path
			).toBeTruthy();
		}
		expect(errors).toEqual([]);
	});
	test(`workspace pages remain usable at ${width}px`, async ({ page, context }) => {
		await context.addCookies(cookie);
		await page.setViewportSize({ width, height: 900 });
		const errors: string[] = [];
		page.on('pageerror', (e) => errors.push(e.message));
		for (const path of [
			'/dashboard',
			'/jobs',
			`/jobs/${jobId}`,
			'/interviews',
			'/documents',
			'/settings',
			'/candidates',
			'/imports',
			'/admin',
			'/invitations',
			'/inquiries',
			'/team'
		]) {
			const response = await page.goto(path);
			expect(response?.status(), path).toBe(200);
			await expect(page.locator('main h1')).toHaveCount(1);
			if (path.startsWith('/jobs/')) {
				await page.screenshot({ path: `artifacts/ui-detail-${width}.png`, fullPage: true });
			}

			expect(
				await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
				path
			).toBeTruthy();
			if (['/dashboard', '/settings', '/jobs'].includes(path))
				await page.screenshot({
					path: `artifacts/ui-${path.slice(1)}-${width}.png`,
					fullPage: true
				});
		}
		if (width === 390) {
			await page.getByRole('button', { name: 'Toggle navigation' }).click();
			await expect(page.locator('.sidebar')).toHaveClass(/mobile-open/);
			await page.getByRole('button', { name: 'Close navigation' }).click();
			await expect(page.locator('.sidebar')).not.toHaveClass(/mobile-open/);
		}
		expect(errors).toEqual([]);
	});
}

test('form sizing, label placement and password visibility', async ({ page }) => {
	await page.goto('/contact');
	const fields = page.locator('.public-form :is(input,select,textarea):visible');
	for (const field of await fields.all()) {
		const dimensions = await field.evaluate((e) => ({
			height: e.getBoundingClientRect().height,
			font: getComputedStyle(e).fontSize,
			display: getComputedStyle(e).display
		}));
		expect(dimensions.height).toBeGreaterThanOrEqual(48);
		expect(dimensions.font).toBe('16px');
		expect(dimensions.display).toBe('block');
	}
	await page.locator('input[name="name"]').fill('Test Reader');
	await page.locator('select[name="interest"]').selectOption('Technology project');
	await page.goto('/client/login');
	await page.getByLabel('Password', { exact: true }).fill('A private test password');
	await page.getByRole('button', { name: 'Show password' }).click();
	await expect(page.locator('input[name="password"]')).toHaveAttribute('type', 'text');
	await page.getByRole('button', { name: 'Hide password' }).click();
	await expect(page.locator('input[name="password"]')).toHaveAttribute('type', 'password');
	const control = await page.locator('input[name="email"]').boundingBox();
	const submit = await page.getByRole('button', { name: 'Sign in', exact: true }).boundingBox();
	expect(Math.abs(control!.width - submit!.width)).toBeLessThan(1);
});

test('library controls preserve sign-in and task submission', async ({ page }) => {
	await page.goto('/client/login');
	await page.locator('input[name="email"]').fill(email);
	await page.locator('input[name="password"]').fill(password);
	await page.getByRole('button', { name: 'Sign in', exact: true }).click();
	await expect(page).toHaveURL('/dashboard');
	await page.locator('input[name="title"]').fill('Review the new interface');
	await page.getByRole('button', { name: 'Add task', exact: true }).click();
	await expect(page.getByText('Review the new interface', { exact: true })).toBeVisible();
	await page.getByRole('button', { name: 'Remove task: Review the new interface' }).click();
	await expect(page.getByText('Review the new interface', { exact: true })).toHaveCount(0);
});
