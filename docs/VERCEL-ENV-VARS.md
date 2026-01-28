# Vercel — Environment Variables (Production)

This file lists the environment variables you must set in the Vercel Project Settings for a production deploy. **Do not** commit secret values to the repository. Set them in the Vercel dashboard (Project → Settings → Environment Variables).

Required (minimum):

- DATABASE_URL — Neon production DB connection (postgresql://... ?sslmode=require)
- SESSION_SECRET — secure session secret (32+ chars)
- BASE_URL — https://{PROD_BASE_URL} (configure your production base URL; Vercel-specific instructions were removed)
Optional / for features:

- PDF_SERVICE_API_KEY — (if using external PDF generation service)
- VERCEL_TOKEN — (CI automation, only for deployment automation)
- SENTRY_DSN — (optional) error monitoring

Notes:

- Tests and dev use different variables (`TEST_DATABASE_URL`, `LOCAL_DATABASE_URL`) — **do not** use `LOCAL_DATABASE_URL` in production.
- Cron jobs should be configured in `vercel.json` (see `docs/PDF_BACKGROUND_JOBS.md` and `docs/MIGRACAO-LGPD.md`).
