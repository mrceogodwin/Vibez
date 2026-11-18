# Migration plan

## What is already in production

Neon project `Vibez` (`muddy-lab-50083976`), default branch `main` (`br-calm-moon-zabzpxi0`), endpoint `ep-soft-wind-zam8gd6x`. The Vercel `DATABASE_URL` is the pooled connection for this project.

`public` contains the previous Prisma tables (`User`, `Event`, `Order`, `Ticket`, and others) and the TanStack catalogue (`events`, `curators`, `ticket_types`, `artist_profiles`, and others). A count at the start of this work showed catalogue rows (11 events, 5 curators, 5 artist profiles) and empty customer, order, and auth tables. Those rows are seeded catalogue data. They are left in place.

## What this migration does

`db/migrations/0001_vibez_schema.sql` creates schema `vibez` and the new tables inside it. It does not `ALTER`, `UPDATE`, or `DROP` anything in `public`.

It was applied to branch `cursor-phase1-rebuild` (`br-frosty-resonance-zaig0l6f`, endpoint `ep-patient-frost-zaffso5k`). After apply, `public.events` still had 11 rows and `vibez` had 83 base tables.

`scripts/migrate.mjs` records the filename in `vibez.schema_migrations` and refuses to run when the host contains `ep-soft-wind-zam8gd6x` unless `MIGRATE_ALLOW_PRODUCTION=yes`. Use a direct connection for the migration. The script strips `-pooler` from the hostname.

## Production cutover, after this PR is approved

1. Keep the current production deployment on `main` until the preview of this branch is accepted.
2. Take a Neon snapshot of `main`.
3. Run `MIGRATE_ALLOW_PRODUCTION=yes node scripts/migrate.mjs` against the production direct URL. This only adds schema `vibez`.
4. Deploy this branch to production.
5. Point Bachs at `https://vibez.ng/api/payments/webhooks/bachs` only after that deploy. Until then the production host is still the old app.
6. Do not rename or drop `public` tables in that step. Archiving them is a later, separate migration.

## Rollback

Before step 4, the old app does not read schema `vibez`, so leaving the schema in place is safe. After step 4, roll the Vercel deployment back to the previous TanStack deployment. The new schema can stay. Do not drop it as part of a rollback unless a reviewed script does so, and never drop `public`.
