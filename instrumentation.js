// Next.js instrumentation hook — appelé une seule fois au boot.
//
// Pattern recommandé Sentry (remplace sentry.server.config.js /
// sentry.edge.config.js qui sont deprecated avec Turbopack).
//
// On init Sentry de manière conditionnelle selon le runtime
// (nodejs vs edge) et avec graceful degradation : si SENTRY_DSN
// n'est pas défini, Sentry.init() est skip → pas de crash.
//
// Doc :
//   - https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
//   - https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

import * as Sentry from '@sentry/nextjs';

export async function register() {
  const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) return;

  if (process.env.NEXT_RUNTIME === 'nodejs') {
    Sentry.init({
      dsn,
      tracesSampleRate: 0.1,
      environment: process.env.VERCEL_ENV || 'development',
      release: process.env.VERCEL_GIT_COMMIT_SHA,
      beforeSend(event) {
        if (process.env.NODE_ENV === 'development') return null;
        return event;
      },
    });
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    Sentry.init({
      dsn,
      tracesSampleRate: 0.1,
      environment: process.env.VERCEL_ENV || 'development',
      release: process.env.VERCEL_GIT_COMMIT_SHA,
    });
  }
}

// Hook Sentry pour capturer les erreurs depuis les Server Actions /
// Route Handlers. On l'export conditionnellement : si Sentry n'est
// pas init (DSN absent), on no-op pour ne pas perturber le worker
// Next.js (cas observé : prerender errors en build sans DSN).
//
// Doc : https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/#capture-request-errors
import * as SentryNS from '@sentry/nextjs';

const _hasDsn = Boolean(process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN);
export const onRequestError = _hasDsn ? SentryNS.captureRequestError : undefined;
