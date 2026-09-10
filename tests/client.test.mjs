import test from 'node:test';
import assert from 'node:assert/strict';
import { date, tags, api } from '../src/lib/client.ts';

test('legacy scraped dates and tags cannot crash job-page rendering', () => {
	assert.equal(date('not a date'), '—');
	assert.equal(date(null), '—');
	assert.match(date('2026-09-10'), /Sep 10/);
	assert.ok(date('2026-09-10T16:00:00Z', 'invalid/timezone', true));
	for (const raw of ['null', '{}', '42', '"tag"', 'not json']) assert.deepEqual(tags(raw), []);
	assert.deepEqual(tags('["SQL",null,42,"Python"]'), ['SQL', 'Python']);
});

test('API client shows an actionable error when a proxy returns HTML', async () => {
	const original = globalThis.fetch;
	globalThis.fetch = async () => new Response('<h1>Service unavailable</h1>', { status: 503 });
	try {
		await assert.rejects(api('jobs'), /refresh and try again/);
	} finally {
		globalThis.fetch = original;
	}
});
