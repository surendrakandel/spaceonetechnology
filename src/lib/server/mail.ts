import { error, type RequestEvent } from '@sveltejs/kit';
export function appOrigin(event: RequestEvent) {
	const configured = event.platform?.env.APP_ORIGIN;
	if (!configured) error(503, 'The application origin is not configured.');
	let url: URL;
	try {
		url = new URL(configured);
	} catch {
		error(503, 'The application origin is invalid.');
	}
	if (url.username || url.password || url.pathname !== '/' || url.search || url.hash)
		error(503, 'Configure the application origin without a path, credentials, query, or fragment.');
	const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
	if (url.protocol !== 'https:' && !local) error(503, 'The application origin must use HTTPS.');
	return { origin: url.origin, local };
}
export async function sendAccountMail(
	event: RequestEvent,
	to: string,
	kind: 'invite' | 'reset',
	raw: string
) {
	const { origin, local } = appOrigin(event);
	const env = event.platform!.env;
	const href = `${origin}/client/${kind === 'invite' ? 'invite' : 'reset-password'}?token=${raw}`;
	if (String(env.MAIL_MODE) === 'local') {
		if (!local) error(503, 'Local email mode requires a localhost application origin.');
		return { delivery_status: 'local' as const, preview_url: href };
	}
	if (env.MAIL_MODE !== 'cloudflare') error(503, 'Email sending mode is not configured.');
	if (!env.EMAIL || typeof env.EMAIL.send !== 'function')
		error(503, 'Email binding is not configured.');
	if (!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(env.EMAIL_FROM || ''))
		error(503, 'Email sender is not configured.');
	const subject =
		kind === 'invite' ? 'Your Space One workspace is ready' : 'Reset your Space One password';
	const intro =
		kind === 'invite'
			? 'You have been invited to Space One. Set up your profile and keep every opportunity moving in one place.'
			: 'We received a request to reset your password. If this was not you, you can ignore this email.';
	const action = kind === 'invite' ? 'Accept your invitation' : 'Choose a new password';
	const expiry = kind === 'invite' ? '7 days' : '1 hour';
	try {
		const result = await env.EMAIL.send({
			from: { email: env.EMAIL_FROM, name: 'Space One Technology' },
			to: [to],
			subject,
			text: `${intro}\n\n${action}: ${href}\n\nThis link expires in ${expiry}.`,
			html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:40px;color:#263b32"><p style="font-size:22px;font-weight:bold">space one.</p><h1 style="font-size:30px">${subject}</h1><p style="line-height:1.7">${intro}</p><p style="margin:32px 0"><a href="${href}" style="background:#263b32;color:white;padding:15px 24px;border-radius:8px;text-decoration:none">${action}</a></p><p>This link expires in ${expiry}. Keep it private.</p></div>`
		});
		if (!result?.messageId) throw new Error('Email service did not acknowledge the message.');
		console.info(
			JSON.stringify({ event: 'account_email_accepted', kind, message_id: result.messageId })
		);
		return { delivery_status: 'sent' as const };
	} catch (cause) {
		const code =
			cause &&
			typeof cause === 'object' &&
			'code' in cause &&
			typeof cause.code === 'string' &&
			/^E_[A-Z_]+$/.test(cause.code)
				? cause.code
				: 'E_SEND_FAILED';
		console.error(JSON.stringify({ event: 'account_email_failed', kind, code }));
		throw cause;
	}
}
