# Vibez architecture

Phase 1 replaces the TanStack Start app with one Expo SDK 58 codebase. Production on `main` keeps serving the current app until this branch is merged. The database cutover is additive and is not applied to production by the build.

## Decision

The product spec says Next.js. The owner overrode that: Expo with Expo Router, one codebase for the Vercel web app, the iOS app, and the Android app. V2 wins over the earlier promotion PRD wherever they disagree, including the dark orange brand, the Home / Discover / Create / Chats / Profile dock, and the credits wallet.

The web app is an Expo Router server export (`web.output: "server"`). `api/index.js` uses `expo-server/adapter/vercel` and Vercel rewrites traffic to that function, which serves the client bundle and the Expo Router API routes in `src/app/api`. SDK 58 documents this adapter and also says it is experimental and not continuously tested. That is an accepted risk because the owner required the existing Vercel project rather than EAS Hosting. If the adapter breaks on a future SDK, the server modules in `src/server` can move behind another Node host without changing the ledger rules.

Authoritative state is Neon Postgres. Serverless instances do not keep sessions, balances, rate limits, or match state in memory.

## Boundaries

| Layer | Where it lives | Responsibility |
| --- | --- | --- |
| UI | `src/app`, `src/screens`, `src/components`, `src/theme` | Expo Router screens. No secrets. No balance math. |
| API | `src/app/api/**/+api.ts` | HTTP, cookies, status codes. Thin. |
| Domain | `src/server` | Auth, ledger, payments, home queries. Tested in Node. |
| Data | schema `vibez` on Neon | Constraints, immutability triggers, indexes. |
| Media | Cloudflare R2 | Presigned uploads. Unavailable until the R2 env vars exist. |
| Payments | Bachs, optional Paystack adapter | Server creates the checkout. A signed webhook plus a server retrieve credits the wallet. |

Native builds use bundle id and package `ng.vibez.app` (`app.json`, `eas.json`). Store submission is not part of this phase. `eas init` still needs the owner's Expo account before a cloud build.

## Identity

Email and password use scrypt (`N=16384`) with `SESSION_PEPPER`. Sessions are random tokens. Only the SHA-256 hash is stored. The browser gets an HttpOnly `SameSite=Lax` cookie. A native client that sends `x-vibez-client: native` also receives the token. Cookie mutations require a same-origin `Origin` or a same-site fetch metadata header. Bearer requests skip that check.

Google sign-in is a server authorization-code flow. It links an existing verified email and refuses to take over an unverified password account. Apple is routed (`/api/auth/apple/start`) and stays disabled until `APPLE_CLIENT_ID`, `APPLE_TEAM_ID`, `APPLE_KEY_ID`, and `APPLE_PRIVATE_KEY` exist.

Signup creates only the `member` role. Staff roles are granted by someone who already has `staff.manage`, never to themselves, and never `super_admin` through that function. Super Admin is bootstrapped only when a verified email is listed in `SUPER_ADMIN_EMAILS`. That grant is audited. Super Admin sessions last 8 hours. Member sessions last 30 days.

Unverified accounts cannot log in. Password reset revokes existing sessions.

## Money

Amounts in Postgres are integer kobo. ₦10 is 1000. ₦2,000 is 200000. One credit is 100 kobo, so one credit is ₦1. Bachs is called with decimal naira strings, which is what their API requires. The minimum Bachs NGN checkout is 100, so the ₦10 room fee is a wallet debit, not a card charge.

`vibez.wallet_ledger` has triggers that reject UPDATE and DELETE. The official balance is `vibez.wallet_balance(user_id)`, the sum of the ledger. Payment order amount, user, purpose, currency, provider, and idempotency key cannot be updated. Payment events are insert-only. A credit uses idempotency key `credit:<order id>`, so a second Bachs event for the same order cannot insert a second credit.

A room start runs in one transaction: lock the wallet and the trial, decide, then either consume one free start or insert a −1000 kobo `game_room_fee`, then set the room `active`. A reconnect or resume does not charge. A room cancelled before start does not charge. A second start finds the existing `room_charges` row. If the platform has to abort a started match, `reverseRoomCharge` inserts a positive `reversal` row or gives the free start back. It does not edit the original row.

Vibez Plus is a one-time 30-day Bachs checkout, not a Bachs recurring subscription. A renewal starts at the later of now and the current period end, so unused days are kept. Expiry is `period_end > now()` at read time. There is no automatic charge.

Live `sk_live_` checkouts are refused unless `VERCEL_ENV=production` or `BACHS_ALLOW_LIVE=true`. The webhook is `POST /api/payments/webhooks/bachs`. It checks `X-Bachs-Signature-V2` (HMAC-SHA256 of `{timestamp}.{raw body}`, 300 second window, every `v1` value) before any credit. It then retrieves the checkout from Bachs and credits only when the provider says it is paid, the currency is NGN, and the amount matches the order. Failed, forged, stale, and mismatched events do not credit.

The trial is not started at signup. `activateTrial` grants 3 starts for 30 days and is idempotent. Nothing in the Phase 1 UI calls it, because the games are not shipped and starting the clock now would expire the trial first. See the questions below.

## Home

Home, notifications, profile counts, and the wallet read Neon. Editorial heroes, posts, and communities come back empty until real rows exist. The old public catalogue (events, curators, artists) is not shown. Onboarding photography is generated for this rebuild and is not presented as member content.

## Realtime, jobs, and media

Not built in this phase. Match state, when games arrive, must be written to `vibez.game_events` and `vibez.game_state_snapshots` in Neon. Vercel functions are not a durable WebSocket tier. The gateway should be chosen after a prototype and a 100-room load test. Redis is not assumed.

Expiry and reminders are correct without a cron because access checks the timestamp. A reminder email job is still required before launch. Email sending uses Resend when `RESEND_API_KEY` and `EMAIL_FROM` are set. Until then, non-production responses can include the verification or reset path so the flow can be completed. Production does not return those paths.

R2 uploads fail with a clear 503 until `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, and `R2_PUBLIC_URL` are set.

## Environments

| Environment | Database | Deploy |
| --- | --- | --- |
| Development | Neon branch `cursor-phase1-rebuild` (`br-frosty-resonance-zaig0l6f`) on project `muddy-lab-50083976` | Local |
| Preview | Must use that branch, not production | Vercel preview for this branch |
| Production | Neon main `br-calm-moon-zabzpxi0`, endpoint `ep-soft-wind-zam8gd6x` | Current TanStack app until merge |

`scripts/migrate.mjs` refuses the production endpoint unless `MIGRATE_ALLOW_PRODUCTION=yes`. The Vercel build does not migrate. There is a second Neon project, `vibez-2`, with empty tables. The Vercel `DATABASE_URL` comment points at `muddy-lab-50083976`, so that is the database this work uses.

## Questions that need an owner answer

1. Confirm trial activation stays deferred until the Games hub exists, rather than starting at account creation.
2. Confirm the ledger unit is integer kobo, with Bachs still receiving decimal naira.
3. Confirm Plus must stay a one-time 30-day checkout, not a Bachs recurring subscription, and that a renewal keeps unused days.
4. What are the approved Plus benefits? None are enabled. The proposed list in the spec is not treated as live.
5. What is the ticketing commission, and what are music-placement and community-push prices? They are null and inactive. Community-push payouts stay disabled until a verified settlement method exists.
6. What is the minimum age, and should signup collect a date of birth? It does not, until that policy exists.
7. Which email provider should production use? The code supports Resend.
8. Should a dispute webhook debit a wallet automatically? Phase 1 records the requirement as open and does not auto-debit.
9. Can `vibez-2` be ignored?
10. After the new app is verified, may the legacy `public` tables be renamed to an archive schema? This phase does not touch them.
11. Which realtime host should the games prototype use, after we measure Vercel’s limits?
12. WebAuthn or TOTP for Super Admin and finance is not built. Is email verification plus an 8-hour session enough until a later phase?
