import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { createRequire } from 'node:module';
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { encryptToken } from '../src/lib/server/calendar-crypto.ts';
const require = createRequire(import.meta.url);
const { buildSync } = createRequire(require.resolve('drizzle-kit'))('esbuild');
const bundle = buildSync({
	stdin: {
		contents: `export * from './src/lib/server/google-calendar.ts'; export { handleApi } from './src/lib/server/api.ts'; export { load as jobPageLoad } from './src/routes/(portal)/jobs/[id]/+page.server.ts';`,
		resolveDir: process.cwd(),
		loader: 'ts'
	},
	bundle: true,
	format: 'esm',
	platform: 'node',
	packages: 'external',
	write: false,
	alias: { $lib: resolve('src/lib') }
}).outputFiles[0].text;
mkdirSync('.svelte-kit', { recursive: true });
const file = resolve('.svelte-kit/google-calendar-test.mjs');
writeFileSync(file, bundle);
const {
	syncInterview,
	calendarApi,
	deleteGoogleInterview,
	calendarSummary,
	handleApi,
	jobPageLoad
} = await import(pathToFileURL(file));

function fixture(calendar = true) {
	const sqlite = new DatabaseSync(':memory:');
	sqlite.exec('PRAGMA foreign_keys=ON');
	for (const f of readdirSync('migrations')
		.filter((f) => f.endsWith('.sql') && (calendar || !f.startsWith('0003_')))
		.sort())
		sqlite.exec(readFileSync('migrations/' + f, 'utf8'));
	sqlite.exec(
		"INSERT INTO users(id,email,name,password_hash,recovery_hash) VALUES('a','alice@example.com','Alice','hash','hash'),('b','bob@example.com','Bob','hash','hash');INSERT INTO jobs(id,title,company,location,description,application_url) VALUES('j','Engineer','Company','Remote','A role','https://example.com');INSERT INTO applications(id,user_id,job_id,status) VALUES('app','a','j','interview');INSERT INTO interviews(id,application_id,title,starts_at,ends_at,timezone) VALUES('i','app','Technical interview','2026-10-01T16:00:00.000Z','2026-10-01T17:00:00.000Z','UTC');"
	);
	const DB = {
		prepare(query) {
			let args = [];
			return {
				bind(...values) {
					args = values;
					return this;
				},
				async raw() {
					const stmt = sqlite.prepare(query);
					stmt.setReturnArrays(true);
					return stmt.all(...args);
				},
				async all() {
					const rows = await this.raw();
					return {
						results: rows.map((row) => Object.fromEntries(row.map((v, i) => ['c' + i, v]))),
						success: true,
						meta: { changes: sqlite.prepare('SELECT changes() n').get().n }
					};
				},
				async run() {
					return this.all();
				}
			};
		},
		async batch(statements) {
			sqlite.exec('BEGIN');
			try {
				const result = [];
				for (const s of statements) result.push(await s.all());
				sqlite.exec('COMMIT');
				return result;
			} catch (e) {
				sqlite.exec('ROLLBACK');
				throw e;
			}
		}
	};
	const event = {
		locals: { user: { id: 'a', role: 'client' } },
		platform: {
			env: {
				DB,
				APP_ORIGIN: 'https://candidate.spaceone.tech',
				GOOGLE_CLIENT_ID: 'test-client',
				GOOGLE_CLIENT_SECRET: 'test-secret',
				CALENDAR_ENCRYPTION_KEY: 'a'.repeat(64)
			}
		},
		url: new URL('https://candidate.spaceone.tech/api/calendar'),
		request: new Request('https://candidate.spaceone.tech/api/calendar'),
		cookies: { get: () => undefined, set() {}, delete() {} }
	};
	return { sqlite, event };
}
test('Google sync creates one event, handles conflicts, keeps ownership, and returns only free/busy data', async () => {
	const { sqlite, event } = fixture();
	sqlite
		.prepare('INSERT INTO calendar_connections(user_id,refresh_token) VALUES (?,?)')
		.run('a', await encryptToken('refresh', 'a'.repeat(64), 'a'));
	const original = globalThis.fetch;
	let remote = null,
		revision = 0,
		inserts = 0;
	const calls = [];
	globalThis.fetch = async (url, options = {}) => {
		calls.push({ url: String(url), options });
		if (String(url).includes('/token'))
			return Response.json({ access_token: 'access', scope: 'test' });
		if (String(url).endsWith('/freeBusy'))
			return Response.json({
				calendars: {
					primary: { busy: [{ start: '2026-10-01T12:00:00Z', end: '2026-10-01T13:00:00Z' }] }
				}
			});
		if (options.method === 'GET')
			return remote ? Response.json(remote) : Response.json({}, { status: 404 });
		if (options.method === 'DELETE') {
			remote = null;
			return new Response(null, { status: 204 });
		}
		const body = JSON.parse(options.body);
		if (options.method === 'POST') inserts++;
		remote = {
			...remote,
			...body,
			etag: 'revision-' + ++revision,
			htmlLink: 'https://www.google.com/calendar/event?eid=test',
			...(body.conferenceData ? { hangoutLink: 'https://meet.google.com/abc-defg-hij' } : {})
		};
		return Response.json(remote);
	};
	try {
		await syncInterview(event, 'i', true);
		assert.equal(inserts, 1);
		assert.equal(remote.conferenceData.createRequest.conferenceSolutionKey.type, 'hangoutsMeet');
		assert.ok(!('attendees' in remote));
		await syncInterview(event, 'i');
		assert.equal(inserts, 1);
		assert.ok(calls.some((c) => c.options.headers?.['If-Match']));
		event.locals.user = { id: 'b', role: 'client' };
		await assert.rejects(syncInterview(event, 'i'), (e) => e.status === 404);
		event.locals.user = { id: 'a', role: 'client' };
		remote.etag = 'external-edit';
		remote.start.dateTime = '2026-10-01T18:00:00Z';
		remote.end.dateTime = '2026-10-01T19:00:00Z';
		await assert.rejects(syncInterview(event, 'i'), (e) => e.status === 502);
		assert.match(
			sqlite.prepare('SELECT last_error FROM calendar_links').get().last_error,
			/changed/
		);
		await syncInterview(event, 'i', false, false, 'google');
		assert.equal(
			sqlite.prepare('SELECT starts_at FROM interviews').get().starts_at,
			'2026-10-01T18:00:00.000Z'
		);
		const response = await calendarApi(event, ['calendar', 'refresh'], 'POST', async () => ({
			from: '2026-10-01T00:00:00Z',
			to: '2026-10-08T00:00:00Z'
		}));
		const data = await response.json();
		assert.equal(data.busy.length, 1);
		assert.equal(JSON.stringify(data).includes('summary'), false);
		await deleteGoogleInterview(event, 'i');
		assert.equal(remote, null);
		await deleteGoogleInterview(event, 'i');
	} finally {
		globalThis.fetch = original;
		sqlite.close();
	}
});

test('Google OAuth uses PKCE and consumes state once for the signed-in owner', async () => {
	const { sqlite, event } = fixture();
	const cookies = new Map();
	event.cookies = {
		get: (k) => cookies.get(k),
		set: (k, v) => cookies.set(k, v),
		delete: (k) => cookies.delete(k)
	};
	const old = globalThis.fetch;
	let exchanges = 0;
	globalThis.fetch = async (url, options) => {
		assert.equal(url, 'https://oauth2.googleapis.com/token');
		assert.equal(options.body.get('code_verifier').length, 64);
		assert.equal(
			options.body.get('redirect_uri'),
			'https://candidate.spaceone.tech/api/calendar/google/callback'
		);
		exchanges++;
		return Response.json({
			access_token: 'access',
			refresh_token: 'refresh-private',
			scope:
				'https://www.googleapis.com/auth/calendar.events.owned https://www.googleapis.com/auth/calendar.freebusy'
		});
	};
	try {
		const connect = await calendarApi(
			event,
			['calendar', 'google', 'connect'],
			'POST',
			async () => ({})
		);
		const url = new URL((await connect.json()).url);
		const state = url.searchParams.get('state');
		assert.equal(url.searchParams.get('code_challenge_method'), 'S256');
		assert.equal(url.searchParams.get('access_type'), 'offline');
		event.url = new URL(
			'https://candidate.spaceone.tech/api/calendar/google/callback?state=' +
				state +
				'&code=authorization-code'
		);
		event.locals.user = { id: 'b', role: 'client' };
		await assert.rejects(
			calendarApi(event, ['calendar', 'google', 'callback'], 'GET', async () => ({})),
			(e) => e.status === 400
		);
		assert.equal(exchanges, 0);
		cookies.set('google_oauth_state', state);
		event.locals.user = { id: 'a', role: 'client' };
		await assert.rejects(
			calendarApi(event, ['calendar', 'google', 'callback'], 'GET', async () => ({})),
			(e) => e.status === 303 && e.location === '/interviews?google=connected'
		);
		assert.equal(exchanges, 1);
		assert.notEqual(
			sqlite.prepare('SELECT refresh_token FROM calendar_connections').get().refresh_token,
			'refresh-private'
		);
		cookies.set('google_oauth_state', state);
		await assert.rejects(
			calendarApi(event, ['calendar', 'google', 'callback'], 'GET', async () => ({})),
			(e) => e.status === 400
		);
		assert.equal(exchanges, 1);
	} finally {
		globalThis.fetch = old;
		sqlite.close();
	}
});

test('job pages and interview edits remain available before the calendar migration', async () => {
	const { sqlite, event } = fixture(false);
	try {
		event.params = { id: 'j' };
		const page = await jobPageLoad(event);
		assert.equal(page.job.id, 'j');
		assert.equal(page.calendar.available, false);
		assert.equal(page.interviews.length, 1);
		assert.match(page.calendar.setup_message, /migrations/);
		for (const role of ['staff', 'admin']) {
			event.locals.user = { id: 'b', role };
			const operatorPage = await jobPageLoad(event);
			assert.equal(operatorPage.job.id, 'j');
			assert.equal(operatorPage.candidate, null);
			event.url.searchParams.set('candidate', 'a');
			assert.equal((await jobPageLoad(event)).interviews.length, 1);
			event.url.searchParams.delete('candidate');
		}
		event.locals.user = { id: 'a', role: 'client' };
		await assert.rejects(
			calendarApi(event, ['calendar', 'availability'], 'POST', async () => ({})),
			(e) => e.status === 503
		);
		event.params = { path: 'interviews/i' };
		event.request = new Request(event.url, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ state: 'completed' })
		});
		const updated = await handleApi(event);
		assert.equal(updated.status, 200, await updated.text());
		assert.equal(
			sqlite.prepare("SELECT state FROM interviews WHERE id='i'").get().state,
			'completed'
		);
		event.request = new Request(event.url, { method: 'DELETE' });
		const removed = await handleApi(event);
		assert.equal(removed.status, 200, await removed.text());
		assert.equal(sqlite.prepare('SELECT count(*) n FROM interviews').get().n, 0);
	} finally {
		sqlite.close();
	}
});

test('calendar fallback never hides unrelated database failures', async () => {
	const { sqlite, event } = fixture();
	try {
		sqlite.exec('DROP TABLE interviews');
		await assert.rejects(deleteGoogleInterview(event, 'i'));
		sqlite.close();
		await assert.rejects(calendarSummary(event));
	} finally {
		if (sqlite.isOpen) sqlite.close();
	}
});
