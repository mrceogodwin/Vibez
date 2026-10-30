# Vibez

A Next.js foundation for a premium black, white and orange social radio app.

## Current implementation

- Responsive public landing page.
- Better Auth email/password authentication backed by Neon PostgreSQL.
- Creator Studio at `/studio` with station identity, genre and visibility settings, a saved queue (up to 250 tracks), playback preview controls, volume and crossfade settings.
- Creator station profile persistence through `creator_station_profiles`, keyed to the Better Auth `"user".id` text identifier.
- Public station discovery and public/unlisted station detail endpoints read from `creator_station_profiles`.
- Authenticated station deletion is restricted to the signed-in owner's profile row.
- Microphone input is a local level-meter test only. The broadcast control is a preview state; it does not publish a live stream.
- The Creator Pro plan display is a preview and does not bill users.

## Database architecture note — multi-station work is blocked

The additive schema in `db/migrations/0002_creator_radio_monetization.sql` defines `creator_stations.owner_user_id` as a UUID foreign key to `app_users(id)`. The active Better Auth setup and baseline migrations instead use the text primary key in the `"user"` table. The current Studio/profile API also uses that Better Auth text ID.

These identifiers and foreign-key targets must not be treated as interchangeable. Do not write creator station rows, migrate profile ownership, or switch Studio reads/writes to `creator_stations` until the production database's identity relationship is explicitly verified and a reviewed migration preserves existing creator data. The current Studio continues to use `creator_station_profiles` (one profile per account).

The newer playlists, subscription, payment-event and broadcast-session tables are schema groundwork only; they are not yet wired into the Creator Studio experience.

## Local development

1. Use Node.js 22 or newer.
2. Run `npm install`.
3. Copy `.env.example` to `.env.local` and set `DATABASE_URL` (or `VIBEZ_DATABASE_URL`) using the Neon connection string.
4. Configure `BETTER_AUTH_SECRET` and the appropriate Better Auth / public app URL values.
5. Run `npm run dev`.

## Remaining creator-radio work

1. Resolve the account identity and foreign-key mismatch with a verified production schema inspection and a non-destructive migration plan.
2. Implement multiple stations per account, including create/list/select flows and a safe migration path for each existing profile.
3. Provision a dedicated broadcast provider, then implement ingest, stream-key rotation, listener playback and verified status webhooks.
4. Add licensed music source/catalog integrations and enforce rights checks.
5. Implement payment checkout and webhook signature verification; grant premium access only after a verified, idempotently processed success event.
6. Add creator entitlements, billing management, moderation, automated tests and production monitoring.

## Security

- Never expose database URLs, payment API keys, webhook secrets or broadcast ingest keys in client code.
- Do not trust a browser redirect as proof of payment; a verified server-side webhook must be authoritative.
- Neon PostgreSQL is not itself an audio streaming service or a WebSocket messaging transport.
