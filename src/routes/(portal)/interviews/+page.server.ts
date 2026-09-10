import { interviews } from '$lib/server/jobs';
import { calendarSummary } from '$lib/server/google-calendar';
export const load: import('./$types').PageServerLoad = async (event) => ({
	interviews: await interviews(event),
	calendar: await calendarSummary(event)
});
