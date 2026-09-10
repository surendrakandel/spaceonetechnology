import { listJobs, interviews } from '$lib/server/jobs';
import { applicationMetrics } from '$lib/server/metrics';
export const load: import('./$types').PageServerLoad = async (event) => ({
	jobs: await listJobs(event),
	metrics: await applicationMetrics(event),
	interviews: await interviews(event)
});
