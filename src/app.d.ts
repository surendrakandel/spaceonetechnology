import type { User } from '$lib/types';
declare global {
	interface Env {
		GOOGLE_CLIENT_ID?: string;
		GOOGLE_CLIENT_SECRET?: string;
		CALENDAR_ENCRYPTION_KEY?: string;
	}
	namespace App {
		interface Locals {
			user: User | null;
		}
		interface Platform {
			env: Env;
			context: ExecutionContext;
		}
	}
}
export {};
