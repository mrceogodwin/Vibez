# Vibez

Expo SDK 58 app for web, iOS, and Android. The web app deploys to the existing Vercel project. Production stays on `main` until this branch is merged.

Read `docs/architecture.md`, `docs/requirements.md`, `docs/schema.md`, and `docs/migration-plan.md` before changing money, auth, or the database.

```bash
npm install
npm test
npm run lint
npm run typecheck
npm run db:migrate
npm run web
```

`db:migrate` applies `db/migrations` to `DATABASE_URL` and refuses the production Neon endpoint unless `MIGRATE_ALLOW_PRODUCTION=yes`.

Bachs webhooks: `POST /api/payments/webhooks/bachs`.
