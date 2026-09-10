import { error, json, redirect, type RequestEvent } from '@sveltejs/kit';
import { and, eq, gt, lt, or, isNull, sql, getTableColumns } from 'drizzle-orm';
import { z } from 'zod';
import { db, requireUser, requireOperator, token, digest, rateLimit } from './security';
import { appOrigin } from './mail';
import { encryptToken, decryptToken } from './calendar-crypto';
import {
	calendarConnections,
	calendarOAuth,
	calendarLinks,
	availability,
	interviews,
	applications,
	users,
	jobs
} from './schema';
import { subjectUserId, getJob } from './jobs';

const scopes = [
	'https://www.googleapis.com/auth/calendar.events.owned',
	'https://www.googleapis.com/auth/calendar.freebusy'
];
const callbackPath = '/api/calendar/google/callback';
const envOf = (e: RequestEvent) => e.platform!.env;
const calendarSetupMessage =
	'Calendar setup is pending. Your team needs to apply the latest database migrations. Interviews and job applications remain available.';
async function calendarStorageReady(e: RequestEvent) {
	const result = await db(e)
		.select({ count: sql<number>`count(*)` })
		.from(sql`sqlite_master`)
		.where(
			sql`type='table' AND name IN ('calendar_connections','calendar_oauth','calendar_links','availability')`
		)
		.get();
	return result?.count === 4;
}
async function interviewLink(e: RequestEvent, interviewId: string) {
	// Older deployments have no linked Google events. Do not make their core interview
	// workflow depend on an additive calendar migration, or hide other database errors.
	try {
		return await db(e)
			.select()
			.from(calendarLinks)
			.where(eq(calendarLinks.interview_id, interviewId))
			.get();
	} catch (ex) {
		let cause: unknown = ex;
		for (let depth = 0; cause instanceof Error && depth < 5; depth++, cause = cause.cause) {
			if (/no such table:\s*(?:main\.)?calendar_links\b/i.test(cause.message)) return undefined;
		}
		throw ex;
	}
}
function configured(e: RequestEvent) {
	const env = envOf(e);
	return !!(
		env.GOOGLE_CLIENT_ID &&
		env.GOOGLE_CLIENT_SECRET &&
		/^[a-f0-9]{64}$/i.test(env.CALENDAR_ENCRYPTION_KEY || '')
	);
}
function settings(e: RequestEvent) {
	if (!configured(e))
		error(
			503,
			'Google Calendar is not configured yet. Your team can still use interviews and shared availability.'
		);
	const env = envOf(e);
	return {
		id: env.GOOGLE_CLIENT_ID!,
		secret: env.GOOGLE_CLIENT_SECRET!,
		key: env.CALENDAR_ENCRYPTION_KEY!,
		redirect: appOrigin(e).origin + callbackPath
	};
}
const tokenResponse = z.object({
	access_token: z.string(),
	refresh_token: z.string().optional(),
	scope: z.string().optional()
});
async function readResponse(response: Response) {
	const reader = response.body?.getReader();
	if (!reader) throw new Error('Empty Google response');
	const chunks: Uint8Array[] = [];
	let size = 0;
	try {
		while (true) {
			const { done, value } = await reader.read();
			if (done) break;
			size += value.length;
			if (size > 1024 * 1024) throw new Error('Google response too large');
			chunks.push(value);
		}
	} finally {
		await reader.cancel();
		reader.releaseLock();
	}
	const bytes = new Uint8Array(size);
	let at = 0;
	for (const part of chunks) {
		bytes.set(part, at);
		at += part.length;
	}
	return JSON.parse(new TextDecoder().decode(bytes)) as unknown;
}
async function tokenRequest(params: URLSearchParams) {
	const response = await fetch('https://oauth2.googleapis.com/token', {
		method: 'POST',
		body: params,
		signal: AbortSignal.timeout(15000)
	});
	if (!response.ok) {
		await response.body?.cancel();
		error(
			502,
			'Google authorization expired or was declined. Reconnect Google Calendar in your calendar settings.'
		);
	}
	return tokenResponse.parse(await readResponse(response));
}
async function accessToken(e: RequestEvent, userId: string) {
	const c = await db(e)
		.select()
		.from(calendarConnections)
		.where(eq(calendarConnections.user_id, userId))
		.get();
	if (!c) error(409, 'This candidate needs to connect Google Calendar first.');
	const config = settings(e);
	const refresh = await decryptToken(c.refresh_token, config.key, userId);
	return (
		await tokenRequest(
			new URLSearchParams({
				grant_type: 'refresh_token',
				refresh_token: refresh,
				client_id: config.id,
				client_secret: config.secret
			})
		)
	).access_token;
}
class GoogleError extends Error {
	constructor(public status: number) {
		super(
			status === 412
				? 'The Google event changed. Refresh the calendar before saving again.'
				: status === 403
					? 'Google denied calendar access. Check consent and Google Calendar API settings.'
					: 'Google Calendar could not complete this request. Refresh or reconnect and try again.'
		);
	}
}
async function google(access: string, path: string, method = 'GET', body?: unknown, etag?: string) {
	const response = await fetch('https://www.googleapis.com/calendar/v3/' + path, {
		method,
		headers: {
			Authorization: `Bearer ${access}`,
			'Content-Type': 'application/json',
			...(etag ? { 'If-Match': etag } : {})
		},
		body: body === undefined ? undefined : JSON.stringify(body),
		signal: AbortSignal.timeout(15000)
	});
	if (!response.ok) {
		await response.body?.cancel();
		throw new GoogleError(response.status);
	}
	return response.status === 204 ? {} : await readResponse(response);
}
const eventSchema = z.object({
	id: z.string(),
	etag: z.string().default(''),
	status: z.string().optional(),
	summary: z.string().optional(),
	start: z.object({ dateTime: z.string().optional(), date: z.string().optional() }).optional(),
	end: z.object({ dateTime: z.string().optional(), date: z.string().optional() }).optional(),
	hangoutLink: z.string().optional(),
	htmlLink: z.string().optional(),
	location: z.string().optional()
});
const safeGoogleUrl = (value: string | undefined, host: string) => {
	try {
		const u = new URL(value || '');
		return u.protocol === 'https:' && (u.hostname === host || u.hostname.endsWith('.' + host))
			? u.href
			: '';
	} catch {
		return '';
	}
};
export async function calendarOwner(e: RequestEvent, interviewId: string) {
	const actor = requireUser(e);
	const item = await db(e)
		.select({
			...getTableColumns(interviews),
			user_id: applications.user_id,
			job_id: jobs.id,
			company: jobs.company,
			job_title: jobs.title
		})
		.from(interviews)
		.innerJoin(applications, eq(applications.id, interviews.application_id))
		.innerJoin(jobs, eq(jobs.id, applications.job_id))
		.where(eq(interviews.id, interviewId))
		.get();
	if (!item || (actor.role === 'client' && item.user_id !== actor.id))
		error(404, 'Interview not found.');
	return item;
}
export async function syncInterview(
	e: RequestEvent,
	interviewId: string,
	createMeet = false,
	onlyLinked = false,
	resolution?: 'portal' | 'google'
) {
	const item = await calendarOwner(e, interviewId);
	let link = await interviewLink(e, interviewId);
	if (onlyLinked && !link) return;
	if (!(await calendarStorageReady(e))) error(503, calendarSetupMessage);
	try {
		const access = await accessToken(e, item.user_id);
		if (!link) {
			// Google permits base32hex IDs; deterministic IDs make retries safe after a timeout.
			const eventId = 's' + (await digest(interviewId + ':' + item.user_id)).slice(0, 40);
			await db(e)
				.insert(calendarLinks)
				.values({ interview_id: interviewId, user_id: item.user_id, event_id: eventId })
				.onConflictDoNothing();
			link = (await db(e)
				.select()
				.from(calendarLinks)
				.where(eq(calendarLinks.interview_id, interviewId))
				.get())!;
		}
		let remote: z.infer<typeof eventSchema> | null = null;
		try {
			remote = eventSchema.parse(await google(access, `calendars/primary/events/${link.event_id}`));
		} catch (ex) {
			if (!(ex instanceof GoogleError && [404, 410].includes(ex.status))) throw ex;
		}
		if (resolution === 'google') {
			await applyGoogleEvent(
				e,
				link,
				remote || { id: link.event_id, etag: '', status: 'cancelled' },
				item
			);
			return { ok: true };
		}
		if (resolution !== 'portal' && remote && link.etag && remote.etag !== link.etag)
			throw new GoogleError(412);
		if (remote?.status === 'cancelled' && item.state !== 'cancelled') throw new GoogleError(412);
		if (item.state === 'cancelled') {
			if (remote && remote.status !== 'cancelled')
				await google(
					access,
					`calendars/primary/events/${link.event_id}?sendUpdates=none`,
					'DELETE',
					undefined,
					remote.etag
				);
		} else {
			const payload = {
				summary: `${item.title} · ${item.company}`,
				start: { dateTime: item.starts_at, timeZone: item.timezone },
				end: { dateTime: item.ends_at, timeZone: item.timezone },
				location: item.location,
				description: `${item.job_title}\nManage this interview: ${appOrigin(e).origin}/jobs/${item.job_id}`,
				...(createMeet && !remote?.hangoutLink
					? {
							conferenceData: {
								createRequest: {
									requestId: crypto.randomUUID(),
									conferenceSolutionKey: { type: 'hangoutsMeet' }
								}
							}
						}
					: {})
			};
			remote = eventSchema.parse(
				await google(
					access,
					`calendars/primary/events${remote ? '/' + link.event_id : ''}?conferenceDataVersion=1&sendUpdates=none`,
					remote ? 'PATCH' : 'POST',
					remote ? payload : { id: link.event_id, ...payload },
					remote?.etag
				)
			);
		}
		await db(e)
			.update(calendarLinks)
			.set({
				etag: item.state === 'cancelled' ? '' : remote?.etag || '',
				meet_url: safeGoogleUrl(remote?.hangoutLink, 'meet.google.com'),
				google_url: safeGoogleUrl(remote?.htmlLink, 'google.com'),
				last_error: '',
				last_synced_at: new Date().toISOString()
			})
			.where(eq(calendarLinks.interview_id, interviewId));
		return { ok: true };
	} catch (ex) {
		const message =
			ex instanceof GoogleError
				? ex.message
				: 'Google Calendar sync failed. Check the connection and retry.';
		await db(e)
			.update(calendarLinks)
			.set({ last_error: message })
			.where(eq(calendarLinks.interview_id, interviewId));
		if (onlyLinked) return { calendar_warning: 'Interview saved. ' + message };
		error(502, message);
	}
}
async function applyGoogleEvent(
	e: RequestEvent,
	link: typeof calendarLinks.$inferSelect,
	remote: z.infer<typeof eventSchema>,
	expected: { starts_at: string; ends_at: string; state: string }
) {
	const database = db(e);
	const item = await database
		.select()
		.from(interviews)
		.where(eq(interviews.id, link.interview_id))
		.get();
	if (!item) error(404, 'Interview not found.');
	const cancelled = remote.status === 'cancelled';
	if (!cancelled && (!remote.start?.dateTime || !remote.end?.dateTime))
		error(
			409,
			'This Google event is now all-day. Restore its interview time in Google before syncing.'
		);
	const starts = cancelled ? item.starts_at : new Date(remote.start!.dateTime!).toISOString(),
		ends = cancelled ? item.ends_at : new Date(remote.end!.dateTime!).toISOString();
	const result = await database.batch([
		database
			.update(interviews)
			.set({ starts_at: starts, ends_at: ends, state: cancelled ? 'cancelled' : item.state })
			.where(
				and(
					eq(interviews.id, item.id),
					eq(interviews.starts_at, expected.starts_at),
					eq(interviews.ends_at, expected.ends_at),
					sql`${interviews.state}=${expected.state}`
				)
			),
		database
			.update(calendarLinks)
			.set({
				etag: remote.etag,
				meet_url: safeGoogleUrl(remote.hangoutLink, 'meet.google.com'),
				google_url: safeGoogleUrl(remote.htmlLink, 'google.com'),
				last_synced_at: new Date().toISOString(),
				last_error: ''
			})
			.where(and(eq(calendarLinks.interview_id, item.id), sql`changes()=1`)),
		database
			.update(applications)
			.set({ updated_at: new Date().toISOString(), version: sql`${applications.version}+1` })
			.where(and(eq(applications.id, item.application_id), sql`changes()=1`))
	]);
	if (!result[0].meta.changes)
		error(409, 'This interview was edited while syncing. Refresh and retry.');
}
export async function deleteGoogleInterview(e: RequestEvent, interviewId: string) {
	const item = await calendarOwner(e, interviewId);
	const link = await interviewLink(e, interviewId);
	if (!link) return;
	try {
		await google(
			await accessToken(e, item.user_id),
			`calendars/primary/events/${link.event_id}?sendUpdates=none`,
			'DELETE',
			undefined,
			link.etag || undefined
		);
	} catch (ex) {
		if (!(ex instanceof GoogleError && [404, 410].includes(ex.status)))
			error(
				502,
				'Could not remove the Google event. Refresh the calendar and retry before deleting this interview.'
			);
	}
}
export async function calendarSummary(e: RequestEvent, userId = requireUser(e).id, jobId?: string) {
	if (userId !== requireUser(e).id) requireOperator(e);
	if (!(await calendarStorageReady(e)))
		return {
			available: false,
			setup_message: calendarSetupMessage,
			configured: false,
			connected: false,
			connection: null,
			slots: [] as (typeof availability.$inferSelect)[],
			links: [] as (typeof calendarLinks.$inferSelect)[]
		};
	const connection = await db(e)
		.select({
			connected_at: calendarConnections.connected_at,
			last_synced_at: calendarConnections.last_synced_at,
			last_error: calendarConnections.last_error
		})
		.from(calendarConnections)
		.where(eq(calendarConnections.user_id, userId))
		.get();
	const slots = await db(e)
		.select()
		.from(availability)
		.where(
			and(
				eq(availability.user_id, userId),
				gt(availability.ends_at, new Date().toISOString()),
				jobId ? or(eq(availability.job_id, jobId), isNull(availability.job_id)) : undefined
			)
		)
		.orderBy(availability.starts_at)
		.limit(300);
	const links = await db(e).select().from(calendarLinks).where(eq(calendarLinks.user_id, userId));
	return {
		available: true,
		setup_message: '',
		configured: configured(e),
		connected: !!connection,
		connection: connection || null,
		slots,
		links
	};
}

export async function calendarApi(
	e: RequestEvent,
	path: string[],
	method: string,
	body: () => Promise<unknown>
): Promise<Response | null> {
	if (path[0] !== 'calendar') return null;
	const actor = requireUser(e),
		database = db(e);
	if (!(path[1] === 'summary' && method === 'GET') && !(await calendarStorageReady(e)))
		error(503, calendarSetupMessage);
	if (path[1] === 'google' && path[2] === 'connect' && method === 'POST') {
		const config = settings(e),
			state = token(),
			verifier = token();
		if (
			await database
				.select({ id: calendarConnections.user_id })
				.from(calendarConnections)
				.where(eq(calendarConnections.user_id, actor.id))
				.get()
		)
			error(409, 'Disconnect the current calendar before connecting another account.');
		await rateLimit(e, `google-connect:${actor.id}`, 10);
		await database
			.delete(calendarOAuth)
			.where(or(eq(calendarOAuth.user_id, actor.id), lt(calendarOAuth.expires_at, Date.now())));
		await database.insert(calendarOAuth).values({
			state_hash: await digest(state),
			user_id: actor.id,
			verifier,
			expires_at: Date.now() + 600000
		});
		e.cookies.set('google_oauth_state', state, {
			path: callbackPath,
			httpOnly: true,
			sameSite: 'lax',
			secure: e.url.protocol === 'https:',
			maxAge: 600
		});
		const challenge = btoa(
			String.fromCharCode(
				...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier)))
			)
		)
			.replaceAll('+', '-')
			.replaceAll('/', '_')
			.replaceAll('=', '');
		return json({
			url:
				'https://accounts.google.com/o/oauth2/v2/auth?' +
				new URLSearchParams({
					client_id: config.id,
					redirect_uri: config.redirect,
					response_type: 'code',
					scope: scopes.join(' '),
					state,
					code_challenge: challenge,
					code_challenge_method: 'S256',
					access_type: 'offline',
					prompt: 'consent'
				})
		});
	}
	if (path[1] === 'google' && path[2] === 'callback' && method === 'GET') {
		const state = e.url.searchParams.get('state');
		if (!state || state !== e.cookies.get('google_oauth_state'))
			error(400, 'Google connection expired. Start again from Calendar.');
		e.cookies.delete('google_oauth_state', { path: callbackPath });
		const stateHash = await digest(state);
		const [pending] = await database
			.delete(calendarOAuth)
			.where(
				and(
					eq(calendarOAuth.state_hash, stateHash),
					eq(calendarOAuth.user_id, actor.id),
					gt(calendarOAuth.expires_at, Date.now())
				)
			)
			.returning();
		if (!pending) error(400, 'Google connection expired. Start again from Calendar.');
		if (e.url.searchParams.has('error')) redirect(303, '/interviews?google=declined');
		const code = e.url.searchParams.get('code');
		if (!code) error(400, 'Google did not provide an authorization code.');
		const config = settings(e);
		const tokens = await tokenRequest(
			new URLSearchParams({
				grant_type: 'authorization_code',
				code,
				code_verifier: pending.verifier,
				client_id: config.id,
				client_secret: config.secret,
				redirect_uri: config.redirect
			})
		);
		if (!scopes.every((s) => (tokens.scope || '').split(' ').includes(s)))
			error(
				400,
				'Both calendar event and availability permissions are required. Reconnect and allow both.'
			);
		if (!tokens.refresh_token)
			error(400, 'Google did not grant offline access. Reconnect and grant calendar access.');
		const refresh = await encryptToken(tokens.refresh_token, config.key, actor.id);
		const previous = await database
			.select()
			.from(calendarConnections)
			.where(eq(calendarConnections.user_id, actor.id))
			.get();
		if (previous) error(409, 'Disconnect the existing calendar before connecting another account.');
		await database
			.insert(calendarConnections)
			.values({ user_id: actor.id, refresh_token: refresh });
		redirect(303, '/interviews?google=connected');
	}
	if (path[1] === 'google' && method === 'DELETE') {
		const connection = await database
			.select()
			.from(calendarConnections)
			.where(eq(calendarConnections.user_id, actor.id))
			.get();
		if (connection) {
			const config = settings(e);
			const response = await fetch('https://oauth2.googleapis.com/revoke', {
				method: 'POST',
				headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
				body: new URLSearchParams({
					token: await decryptToken(connection.refresh_token, config.key, actor.id)
				}),
				signal: AbortSignal.timeout(15000)
			});
			if (!response.ok && response.status !== 400)
				error(502, 'Google could not revoke access. Try again.');
			await response.body?.cancel();
		}
		await database.batch([
			database.delete(calendarLinks).where(eq(calendarLinks.user_id, actor.id)),
			database.delete(calendarConnections).where(eq(calendarConnections.user_id, actor.id)),
			database.delete(calendarOAuth).where(eq(calendarOAuth.user_id, actor.id))
		]);
		return json({ ok: true });
	}
	if (path[1] === 'interviews' && path[2] && method === 'POST') {
		await rateLimit(e, `google-sync:${actor.id}`, 30);
		const data = z
			.object({
				create_meet: z.boolean().default(false),
				resolution: z.enum(['portal', 'google']).optional()
			})
			.strict()
			.parse(await body());
		return json(await syncInterview(e, path[2], data.create_meet, false, data.resolution));
	}
	const subject = await subjectUserId(e);
	if (path[1] === 'summary' && method === 'GET') return json(await calendarSummary(e, subject));
	if (path[1] === 'availability') {
		if (method === 'POST') {
			if (subject !== actor.id) error(403, 'Only the candidate can publish their availability.');
			const data = z
				.object({
					job_id: z.string().nullable().default(null),
					starts_at: z.iso.datetime(),
					ends_at: z.iso.datetime(),
					note: z.string().trim().max(300).default('')
				})
				.strict()
				.refine(
					(v) =>
						Date.parse(v.ends_at) > Date.parse(v.starts_at) &&
						Date.parse(v.starts_at) > Date.now() &&
						Date.parse(v.ends_at) - Date.parse(v.starts_at) <= 24 * 3600000,
					'Choose a future availability window of up to 24 hours.'
				)
				.parse(await body());
			if (data.job_id) await getJob(e, data.job_id);
			const [{ n }] = await database
				.select({ n: sql<number>`count(*)` })
				.from(availability)
				.where(
					and(
						eq(availability.user_id, actor.id),
						gt(availability.ends_at, new Date().toISOString())
					)
				);
			if (n >= 300) error(400, 'Remove an availability window before adding more.');
			const id = crypto.randomUUID();
			await database.insert(availability).values({ id, user_id: actor.id, ...data });
			return json({ id }, { status: 201 });
		}
		if (method === 'DELETE' && path[2]) {
			await database
				.delete(availability)
				.where(and(eq(availability.id, path[2]), eq(availability.user_id, actor.id)));
			return json({ ok: true });
		}
	}
	if (path[1] === 'refresh' && method === 'POST') {
		await rateLimit(e, `google-refresh:${actor.id}`, 30);
		const data = z
			.object({ from: z.iso.datetime(), to: z.iso.datetime() })
			.strict()
			.refine(
				(v) =>
					Date.parse(v.to) > Date.parse(v.from) &&
					Date.parse(v.to) - Date.parse(v.from) <= 32 * 86400000,
				'Choose a calendar range of up to 32 days.'
			)
			.parse(await body());
		try {
			const access = await accessToken(e, subject);
			const response = z
				.object({
					calendars: z.record(
						z.string(),
						z.object({
							errors: z.array(z.unknown()).optional(),
							busy: z.array(z.object({ start: z.string(), end: z.string() }))
						})
					)
				})
				.parse(
					await google(access, 'freeBusy', 'POST', {
						timeMin: data.from,
						timeMax: data.to,
						items: [{ id: 'primary' }]
					})
				);
			const calendar = response.calendars.primary;
			if (!calendar || calendar.errors?.length)
				error(502, 'Google could not read availability. Reconnect your calendar.');
			const links = await database
				.select({
					...getTableColumns(calendarLinks),
					starts_at: interviews.starts_at,
					ends_at: interviews.ends_at,
					state: interviews.state
				})
				.from(calendarLinks)
				.innerJoin(interviews, eq(interviews.id, calendarLinks.interview_id))
				.where(
					and(
						eq(calendarLinks.user_id, subject),
						lt(interviews.starts_at, data.to),
						gt(interviews.ends_at, data.from)
					)
				)
				.limit(100);
			let conflicts = 0;
			for (const link of links) {
				if (link.last_error || !link.last_synced_at) {
					conflicts++;
					continue;
				}
				let remote;
				try {
					remote = eventSchema.parse(
						await google(access, `calendars/primary/events/${link.event_id}`)
					);
				} catch (ex) {
					if (ex instanceof GoogleError && [404, 410].includes(ex.status))
						remote = { id: link.event_id, etag: '', status: 'cancelled' };
					else throw ex;
				}
				await applyGoogleEvent(e, link, remote, link);
			}
			const synced = new Date().toISOString();
			await database
				.update(calendarConnections)
				.set({ last_synced_at: synced, last_error: '' })
				.where(eq(calendarConnections.user_id, subject));
			return json({ busy: calendar.busy, synced_at: synced, conflicts });
		} catch (ex) {
			const message =
				ex instanceof GoogleError
					? ex.message
					: 'Calendar refresh failed. Check the Google connection and retry.';
			await database
				.update(calendarConnections)
				.set({ last_error: message })
				.where(eq(calendarConnections.user_id, subject));
			error(502, message);
		}
	}
	error(404, 'Calendar endpoint not found.');
}
