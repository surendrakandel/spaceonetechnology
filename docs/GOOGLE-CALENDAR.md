# Google Calendar & Meet setup

The portal works without Google configured: clients can record interviews and share availability. Connecting Google adds primary-calendar busy times, linked interview events, and optional Meet links. The current production origin in Wrangler is `https://candidate.spaceone.tech`.

## Google Cloud

1. Create/select your Google Cloud project and enable **Google Calendar API**.
2. Configure Google Auth Platform branding, support email, audience, authorized domains, and privacy policy. Use your own company/project details. For external clients use an External audience. While Testing, add each test account explicitly; testing-mode refresh tokens may expire after seven days. Complete Google's applicable verification and publish the consent screen before broad client rollout.
3. Create an OAuth client of type **Web application**. Register this exact authorized redirect URI:
   `https://candidate.spaceone.tech/api/calendar/google/callback`
   For local tests add the exact local origin and port, e.g. `http://localhost:8787/api/calendar/google/callback`. `APP_ORIGIN` must match the origin the browser uses for sign-in, otherwise the OAuth state cookie cannot be read.
4. Configure these requested scopes:
   - `https://www.googleapis.com/auth/calendar.events.owned`
   - `https://www.googleapis.com/auth/calendar.freebusy`
5. Set Worker secrets from the project folder:

```sh
npx wrangler secret put GOOGLE_CLIENT_ID
npx wrangler secret put GOOGLE_CLIENT_SECRET
npx wrangler secret put CALENDAR_ENCRYPTION_KEY
```

Generate the encryption key with `openssl rand -hex 32`, keep it in your password manager, and paste it at the secret prompt. It encrypts each refresh token with AES-GCM and binds it to the owning user. Keep the same key across deployments; changing it requires clients to reconnect and should be treated as a token migration. Never commit secrets. For local development put values in your ignored `.dev.vars`.

6. Back up production D1, apply `npm run db:remote`, then `npm run deploy`. Migration 0003 adds calendar connections, expiring OAuth requests, event links, and availability tables; existing application data is preserved.
7. Sign in as a test client, open **Interviews → Connect Google Calendar**, and grant both permissions. Staff cannot connect Google on behalf of a client.

## Daily workflow

- On a job page record an interview, then choose **Add to Google Calendar** or **Create Google Meet**. Each event has its own Meet conference request; existing employer meeting links can remain in the interview location field.
- Subsequent portal edits and cancellation sync to linked Google events. Completion is an explicit portal action; elapsed time does not imply that the interview happened.
- **Refresh Google calendar** loads busy times for the displayed week and brings changed times/cancellations back from linked Google events in that window. This is refresh-based sync, not a background subscription or push-notification service. Unlinked Google events are shown as busy periods, never imported by guessing which job they belong to. Link known employer interview details by recording the interview and meeting URL on its job page.
- If both copies change, the portal flags a conflict. On the job page explicitly choose **Use Google version** or **Use portal version**. A Google-deleted event cannot be silently recreated as the same event; accept its cancellation and create a new interview if required.
- Availability may apply to all jobs or one job. Only its owner can add/remove availability; operators can view it from the candidate page and job page. Refresh busy times before booking. Offered availability is not a reservation and does not guarantee the candidate is free.
- No recruiter/attendee invitations are sent automatically. Meet creation can take a short time; refresh the calendar if the link is still pending. Google Workspace policy may restrict Meet creation.
- Disconnect revokes the Google authorization and removes stored connection/event links. Existing Google events and portal interviews remain; future changes no longer sync.

## Production acceptance

Test with a real consenting Google account: connect, create one interview/Meet, edit its time in the portal, edit it in Google and refresh, resolve a conflict, mark completed, cancel/delete, confirm another client cannot access it, then disconnect. Automated tests mock Google transport and cannot prove that your OAuth project, consent approval, domain, or account policy is configured correctly.

References: [OAuth web-server flow](https://developers.google.com/identity/protocols/oauth2/web-server), [Calendar event creation](https://developers.google.com/workspace/calendar/api/v3/reference/events/insert), [Free/busy](https://developers.google.com/workspace/calendar/api/v3/reference/freebusy/query).
