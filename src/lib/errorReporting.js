/**
 * Error reporting utility.
 *
 * Stratégie :
 *   - Toujours log en console (visible dans Vercel Logs côté serveur,
 *     DevTools côté client).
 *   - En prod (et si Sentry configuré), forward à Sentry avec le contexte
 *     attaché en `extra` — visible dans la sidebar de l'event Sentry.
 *   - Conserve le legacy POST /api/report-error côté client comme
 *     fallback si Sentry n'est pas dispo (DSN absent).
 *
 * Sentry est chargé conditionnellement pour ne pas crasher si le SDK
 * n'est pas installé (env de dev minimal) et pour respecter la spec
 * "graceful degradation".
 */

import * as Sentry from '@sentry/nextjs';

const isDev = process.env.NODE_ENV === 'development';
const hasSentryDsn = Boolean(
  process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN
);

/**
 * Report an error with context.
 * @param {Error|string} error - The error to report
 * @param {Record<string, any>} context - Additional context (component, action, etc.)
 */
export function reportError(error, context = {}) {
  const payload = {
    timestamp: new Date().toISOString(),
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    url: typeof window !== 'undefined' ? window.location.href : undefined,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    ...context,
  };

  // Always log to console
  console.error('[ErrorReport]', payload);

  // Forward to Sentry (no-op si DSN absent grâce à la garde dans
  // sentry.*.config.js qui skip Sentry.init).
  if (hasSentryDsn) {
    try {
      const err = error instanceof Error ? error : new Error(String(error));
      Sentry.captureException(err, { extra: context });
    } catch {
      // Sentry indispo : silently fail, on a déjà console.error.
    }
  }

  // Legacy fallback : POST /api/report-error côté client en prod.
  // Utile si Sentry pas encore configuré (DSN absent) — garde une
  // trace serveur visible dans Vercel Logs.
  if (!isDev && !hasSentryDsn && typeof window !== 'undefined') {
    try {
      fetch('/api/report-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).catch(() => {
        // Silently fail
      });
    } catch {
      // Silently fail
    }
  }
}
