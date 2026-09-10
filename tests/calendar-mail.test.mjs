import test from 'node:test';
import assert from 'node:assert/strict';
import { encryptToken, decryptToken } from '../src/lib/server/calendar-crypto.ts';
import { sendAccountMail } from '../src/lib/server/mail.ts';

test('Google refresh tokens are encrypted and bound to their account', async () => {
	const key = 'a'.repeat(64),
		raw = 'private-refresh-token';
	const encrypted = await encryptToken(raw, key, 'alice');
	assert.ok(!encrypted.includes(raw));
	assert.notEqual(encrypted, await encryptToken(raw, key, 'alice'));
	assert.equal(await decryptToken(encrypted, key, 'alice'), raw);
	await assert.rejects(decryptToken(encrypted, key, 'bob'));
	await assert.rejects(decryptToken(encrypted, 'b'.repeat(64), 'alice'));
	await assert.rejects(encryptToken(raw, 'short', 'alice'));
});
test('account emails use configured origin, acknowledge provider acceptance, and do not leak reset links', async () => {
	const messages = [];
	const e = {
		platform: {
			env: {
				APP_ORIGIN: 'https://candidate.spaceone.tech',
				MAIL_MODE: 'cloudflare',
				EMAIL_FROM: 'invites@spaceonetechnology.com',
				EMAIL: {
					send: async (message) => {
						messages.push(message);
						return { messageId: 'test-provider-id' };
					}
				}
			}
		}
	};
	for (const kind of ['invite', 'reset']) {
		const result = await sendAccountMail(e, 'recipient@example.com', kind, 'a'.repeat(64));
		assert.equal(result.delivery_status, 'sent');
		assert.equal(result.preview_url, undefined);
		assert.ok(messages.at(-1).html.includes('https://candidate.spaceone.tech/client/'));
		assert.match(
			messages.at(-1).text,
			kind === 'invite' ? /\/invite\?token=/ : /\/reset-password\?token=/
		);
	}
	e.platform.env.EMAIL.send = async () => {
		throw Object.assign(new Error('private provider data'), { code: 'E_SENDER_NOT_VERIFIED' });
	};
	await assert.rejects(sendAccountMail(e, 'recipient@example.com', 'invite', 'a'.repeat(64)));
	e.platform.env.EMAIL.send = async () => undefined;
	await assert.rejects(sendAccountMail(e, 'recipient@example.com', 'invite', 'a'.repeat(64)));
});
test('local email previews never invoke the sender and are refused for production origins', async () => {
	let calls = 0;
	const e = {
		platform: {
			env: {
				APP_ORIGIN: 'http://localhost:8787',
				MAIL_MODE: 'local',
				EMAIL_FROM: 'invites@example.com',
				EMAIL: {
					send: async () => {
						calls++;
					}
				}
			}
		}
	};
	assert.equal(
		(await sendAccountMail(e, 'person@example.com', 'invite', 'a'.repeat(64))).delivery_status,
		'local'
	);
	assert.equal(calls, 0);
	e.platform.env.APP_ORIGIN = 'https://candidate.spaceone.tech';
	await assert.rejects(sendAccountMail(e, 'person@example.com', 'invite', 'a'.repeat(64)));
	e.platform.env.MAIL_MODE = 'misspelled';
	await assert.rejects(sendAccountMail(e, 'person@example.com', 'invite', 'a'.repeat(64)));
});
