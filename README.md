# Vibez

Music. Events. Culture. Promotion.

Vibez is a Nigeria-first entertainment app: discovery, artist pages, event tickets, community promotion and advertising. This repository is a TanStack Start app (Vite and Nitro). It deploys on Vercel as project `vibez`. The product spec mentions Next.js, Prisma and Auth.js. Those are not the stack here. Identity is Better Auth, data is Neon Postgres through SQL migrations, and the server is TanStack Start server functions.

## Scripts

- `npm run dev` starts the app on port 8080.
- `npm run build` runs `vite build` and then `npm run db:migrate`.
- `npm run db:migrate` applies `migrations/*.sql` once, in order, when `DATABASE_URL` is set. Without it, the build skips the database and local preview uses embedded PGLite.
- `npm test` runs the unit tests, including payment decision tests.

## Environment

Copy `.env.example`. The app keeps working when a provider key is missing and shows a not-configured message instead of crashing.

| Variable | Used for |
| --- | --- |
| `DATABASE_URL` | Neon Postgres. Required in production. Migrations run during the Vercel build. |
| `VITE_AUTH_ENABLED` | Set to `true` in production. `false` uses the local preview user. |
| `BETTER_AUTH_SECRET` | Session signing secret in production. |
| `BETTER_AUTH_URL` / `APP_URL` | Public origin for auth callbacks and Paystack return URLs. |
| `GROK_AUTH_ISSUER`, `GROK_AUTH_CLIENT_ID`, `GROK_AUTH_CLIENT_SECRET` | Existing broker used for Google and X sign-in. |
| `RESEND_API_KEY` | Sends verification and password-reset codes. |
| `EMAIL_FROM` | From address Resend is allowed to use. |
| `AUTH_CODE_PEPPER` | Extra secret mixed into emailed code hashes. |
| `PAYSTACK_SECRET_KEY` | Server-side Paystack initialise, verify and webhooks. Never exposed to the browser. |
| `PAYSTACK_PUBLIC_KEY` | Reserved for a client widget. Not required for the redirect checkout. |
| `VIBEZ_ADMIN_EMAILS` | Comma-separated emails that become Control Room super admins. |
| `BLOB_READ_WRITE_TOKEN` | Optional uploads. Without it, artwork is a pasted image URL. |

Paystack webhook: `POST /api/paystack/webhook`. The handler checks the `x-paystack-signature` HMAC and then confirms the transaction with Paystack's verify API. Tickets are inserted once. A second webhook does not create a second set of tickets. A browser return to `/checkout/return` is not treated as proof of payment.

Organiser settlement uses a Paystack subaccount only when one is saved on the organiser profile. If it is missing, the payment is collected by the Vibez Paystack account and the checkout screen says so. Community-owner payouts are not enabled.

## Sample catalogue

Migration `0003_platform.sql` inserts sample artists, releases, communities and a homepage hero. They are stored with `is_sample = true` and labelled Sample in the interface. Sample events are not for sale. Follower counts, ticket sales and ad impressions are counted from rows this app writes. They are not filled in with made-up totals.

The Control Room can hide sample artists, approve events, music, ads and communities, and change the ticket fee in basis points (`ticket_fee_bps`, 500 means 5%).

Onboarding photographs and their licences are listed in `public/media/CREDITS.md`.

## Routes

- `/` onboarding, `/register`, `/login`, `/verify`, `/personalise`, `/reset`
- `/home`, `/discover`, `/activity`, `/profile`
- `/@username` and `/@username/slug`
- `/events`, `/events/$slug`, `/checkout/return`, `/tickets`
- `/studio`, `/create`, `/organise`, `/ads`, `/community`, `/control`
