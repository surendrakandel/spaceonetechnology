import { candidateDetail } from '$lib/server/operations';
import { calendarSummary } from '$lib/server/google-calendar';
export const load: import('./$types').PageServerLoad = async (event) => ({
	...(await candidateDetail(event, event.params.id)),
	calendar: await calendarSummary(event, event.params.id)
});
