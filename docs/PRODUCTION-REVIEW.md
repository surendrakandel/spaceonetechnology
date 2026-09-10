# Production review — September 10, 2026

## Corrected

- Confirmed migration 0003 was pending on the configured remote D1 database. Saved a private backup under ignored `.wrangler/backups/` and applied the additive migration; no migrations remain pending. Missing calendar tables no longer crash job/candidate/interview page loaders or unlinked interview edits/deletes. Calendar actions show a setup message until migrated. Regression coverage includes clients, staff, and administrators.
- Staff job status/saved/interview filters now use client activity, with upcoming client interview dates and aggregate stage metadata. Client responses do not expose other clients’ stage lists. Calendar cards link to their interview record, changing candidate closes stale interview forms, and active applications appear on the dashboard. Legacy malformed dates/tags and non-JSON API errors are handled safely.

- Operator application totals and interview calendars now cover client activity, rather than the operator's personal application records. Submission counts include status/interview evidence for legacy records without applied timestamps, and remain recorded after rejection/withdrawal.
- Recording a scheduled/completed interview advances active applications to Interview and records submission evidence. Completed rounds have a direct action. Staff must select a candidate before recording job application activity. Dashboard, candidate analytics and job popularity share the submission definition.
- Removed overlapping client-directory and JSON-import panels from Manage jobs; links lead to Candidates and the normalized Import jobs page. Kept compatible API endpoints. Replaced the second notes composer with the authored Conversation form while retaining historical activity/notes.
- Added candidate-owned availability windows per job or across jobs, a responsive weekly candidate calendar, Google OAuth with state/PKCE, encrypted refresh tokens, primary-calendar busy times, linked interview synchronization, Google Meet creation, conflict resolution, and disconnect/revocation.
- Email configuration is validated; provider acceptance is checked and logged by message ID. Failed deliveries are not reported as success. Invitation history reloads on failures. Provider errors are logged by safe error code without recording tokens or message bodies.
- Google client secret was found in tracked Wrangler variables. Removed it from current configuration and moved the development copy into ignored `.dev.vars`.

## Verification

- Type/Svelte checks: no errors or warnings.
- Unit and mocked-service tests: 16 passing (includes Google create/update/conflict/delete, OAuth state/PKCE/replay, ownership, encryption, mail acceptance/failure and existing import/schema tests).
- Local D1/R2 integration tests: 24 passing, using an isolated `.wrangler/review-state` database; includes role boundaries, availability ownership, statistics, interview state updates, private files, invitation and reset lifecycle, imports, and public/protected page rendering.
- Production build and Wrangler deployment dry run passed.
- Browser review: weekly calendar rendered with a fictional interview and overlapping availability. Mark completed updated the calendar; navigating to Dashboard showed 1 application, 0 upcoming interviews, 1 completed interview.
- Email delivery is working per the owner's confirmation. No real emails were sent in this review. Google requests were mocked; live consent, real Meet creation and production delivery still require the configured account acceptance run.

## Before release

1. **Rotate the Google OAuth client secret** in Google Cloud because it was committed. Removing it from the current file does not remove Git history. Store the replacement using `npx wrangler secret put GOOGLE_CLIENT_SECRET`, never in Wrangler vars. Keep it out of source archives too.
2. Set `GOOGLE_CLIENT_ID` and `CALENDAR_ENCRYPTION_KEY` in the deployment environment. Use a 64-character hexadecimal encryption key and retain it across deployments. A development key was generated only in ignored `.dev.vars`; it has not been installed in production.
3. Complete [Google consent/OAuth setup](GOOGLE-CALENDAR.md). The current origin is `https://spaceone.tech`; its exact callback is `/api/calendar/google/callback`. Register localhost separately if testing locally, and make local APP_ORIGIN match the browser port.
4. Remote migration 0003 has been applied. Deploy the final code with `npm run deploy` once the intended Worker name/account are confirmed. The current Wrangler name is `spaceonetechnology`; querying its secret metadata returned “Worker not found,” so production Google secret presence could not be verified. The earlier Worker name in Git was `space-one-clients`; the recent rename was preserved. For Workers Builds, either use build `npm run check && npm run build` plus deploy `npx wrangler deploy`, or leave build empty and use deploy `npm run deploy`.
5. Perform the real-account Google acceptance workflow in the setup guide. Sync from Google is explicit refresh-based; it is not a background/push integration. Unlinked Google events are busy periods only. Offered availability is not a booking lock. Meet policy/Google consent verification may be required for external clients.

Applied only the additive calendar migration to the configured remote D1 database after saving a private backup. No Worker deployment, Google account authorization, email send, or domain/DNS change was performed. Authenticated job-page behavior was verified locally; a signed-in production browser verification remains necessary.
