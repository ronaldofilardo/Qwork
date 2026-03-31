import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  enabled:
    process.env.APP_ENV === 'production' || process.env.APP_ENV === 'staging',
  environment: process.env.APP_ENV ?? 'development',
  tracesSampleRate: process.env.APP_ENV === 'production' ? 0.1 : 1.0,
  debug: false,
});
