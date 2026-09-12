import { defineConfig } from '@playwright/test';
export default defineConfig({
	testDir: './tests/ui',
	projects: [
		{ name: 'chromium', use: { browserName: 'chromium' } },
		{ name: 'webkit', use: { browserName: 'webkit' } }
	],
	fullyParallel: false,
	workers: 1,
	timeout: 60000,
	use: {
		baseURL: 'http://127.0.0.1:8790',
		viewport: { width: 1440, height: 1000 },
		trace: 'retain-on-failure'
	},
	outputDir: 'artifacts/playwright',
	reporter: [['list']],
	webServer: {
		command: 'node scripts/serve-ui-test.mjs',
		url: 'http://127.0.0.1:8790/client/login',
		reuseExistingServer: false,
		timeout: 120000
	}
});
