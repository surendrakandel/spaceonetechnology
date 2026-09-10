import { calendarSummary } from '$lib/server/google-calendar';
import { details, subjectUserId } from '$lib/server/jobs';
import { candidateRows } from '$lib/server/operations';
export const load: import('./$types').PageServerLoad = async (event) => ({
	...(await details(event, event.params.id)),
	calendar: await calendarSummary(event, await subjectUserId(event), event.params.id),
	candidates: event.locals.user?.role !== 'client' ? await candidateRows(event) : []
});
