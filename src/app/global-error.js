'use client';

// Global error boundary — distinct de `src/app/error.js`.
//
// `error.js` catch les erreurs dans les enfants du layout racine, mais
// PAS les erreurs dans le layout racine lui-même. `global-error.js`
// agit comme un dernier filet : il remplace TOUT le HTML (y compris
// <html> et <body>) en cas de crash du layout.
//
// Recommandé par Sentry pour ne manquer aucune erreur de rendering React.
// Doc : https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/#react-render-errors-in-app-router

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';
import NextError from 'next/error';

export default function GlobalError({ error }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="fr">
      <body>
        {/* NextError est le composant 404/500 par défaut de Next — sobre,
            pas de styles applicatifs requis (le layout a crashé). */}
        <NextError statusCode={500} />
      </body>
    </html>
  );
}
