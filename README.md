# Vibez

A Next.js foundation for a premium black, white and orange social radio app.

## Implemented
- Responsive public landing page.
- Creator Studio UI at `/studio`: station identity, genre/discovery settings, local demo queue, DJ transport controls, master volume, crossfade and broadcast preview state.
- Neon PostgreSQL as the database; no Supabase dependency.
- Additive creator-radio schema: creator stations, playlists/items, subscription state, idempotent payment-event records, and broadcast-session tracking.
- Bachs is the intended payment provider candidate; credentials are environment-only and payment processing is not yet enabled.
- The Studio queue and controls are currently a frontend prototype. They do not yet broadcast audio, save stations, or charge subscriptions.

## Local development
1. Use Node.js 22 or newer.
2. Run `npm install`.
3. Copy `.env.example` to `.env.local` and set `DATABASE_URL` using the Neon connection string.
4. Run `npm run dev`.

## Creator Radio roadmap
1. Add server-only database access and authentication before persisting owner data.
2. Provision a dedicated broadcast provider (for example, an Icecast-compatible hosted streaming service or a managed live-audio platform), then implement ingest, stream-key rotation, listener playback and status webhooks.
3. Add licensed music source/catalog integrations. Do not accept arbitrary copyrighted uploads without rights checks.
4. Implement Bachs sandbox checkout and webhook signature verification; grant premium access only after a verified, idempotently processed success event.
5. Add creator plan entitlements, account billing management, moderation, tests and production monitoring.

## Security
- Never expose `DATABASE_URL`, Bachs API keys, webhook secrets, or broadcast ingest keys in client code.
- Do not trust the browser redirect as proof of payment; the verified server-side webhook is authoritative.
- Neon PostgreSQL is not itself a realtime audio streaming service or a WebSocket messaging transport.
