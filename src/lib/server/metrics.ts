import type { RequestEvent } from '@sveltejs/kit';
import { and, eq, sql, type SQL } from 'drizzle-orm';
import { applications, interviews, users } from './schema';
import { db, requireUser } from './security';

// Count a submission once, including legacy records that predate applied_at.
export function submitted(a: { id: SQL; status: SQL; applied_at: SQL }) {
	return sql`(${a.applied_at} IS NOT NULL OR ${a.status} IN ('applied','processing','interview','offer','rejected') OR EXISTS (SELECT 1 FROM interviews evidence WHERE evidence.application_id=${a.id} AND evidence.state!='cancelled'))`;
}
export const submittedApplication = submitted({
	id: sql`${applications.id}`,
	status: sql`${applications.status}`,
	applied_at: sql`${applications.applied_at}`
});

export async function applicationMetrics(event: RequestEvent) {
	const user = requireUser(event);
	const scope = user.role === 'client'
		? eq(applications.user_id, user.id)
		: eq(users.access_role, 'client');
	const [appRows, interviewRows] = await db(event).batch([
		db(event).select({
			applied: sql<number>`COALESCE(SUM(CASE WHEN ${submittedApplication} THEN 1 ELSE 0 END),0)`.mapWith(Number),
			offers: sql<number>`COALESCE(SUM(CASE WHEN ${applications.status}='offer' THEN 1 ELSE 0 END),0)`.mapWith(Number)
		}).from(applications).innerJoin(users, eq(users.id, applications.user_id)).where(scope),
		db(event).select({
			completed: sql<number>`COALESCE(SUM(CASE WHEN ${interviews.state}='completed' THEN 1 ELSE 0 END),0)`.mapWith(Number),
			upcoming: sql<number>`COALESCE(SUM(CASE WHEN ${interviews.state}='scheduled' AND julianday(${interviews.ends_at})>julianday('now') THEN 1 ELSE 0 END),0)`.mapWith(Number)
		}).from(interviews).innerJoin(applications, eq(applications.id, interviews.application_id))
			.innerJoin(users, eq(users.id, applications.user_id)).where(scope)
	]);
	return { ...appRows[0], ...interviewRows[0] };
}
