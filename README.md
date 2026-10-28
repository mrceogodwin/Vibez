# Vibez

A Next.js foundation for a premium black, white and orange social radio app.

## Current implementation
- Responsive landing page and visual system.
- Neon PostgreSQL selected as the only database provider.
- No Supabase dependency.
- Radio artwork and chat cards are clearly marked as preview UI; they are not live services yet.
- Environment template documents the Neon `DATABASE_URL`; real credentials must never be committed.

## Local development
1. Use Node.js 22 or newer.
2. Run `npm install`.
3. Copy `.env.example` to `.env.local` and set `DATABASE_URL` using the Neon connection string.
4. Run `npm run dev`.

## Build stages
1. Verify the Neon schema and add a server-only database module.
2. Implement authentication and session handling.
3. Add a curated radio catalog with verified stream URLs and a real audio player.
4. Implement messaging, communities, friends, notifications and moderation with server-side authorization.
5. Add tests, run production build and verify deployment.

Do not expose database credentials to browser code. Neon PostgreSQL by itself is not a WebSocket-based real-time messaging service; realtime delivery needs a separately chosen and configured transport.
