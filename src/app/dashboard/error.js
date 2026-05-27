'use client';

import { useEffect } from 'react';
import { reportError } from '@/lib/errorReporting';

export default function DashboardError({ error, reset }) {
  useEffect(() => {
    reportError(error, { boundary: 'dashboard' });
  }, [error]);

  return (
    <div className="flex-1 flex items-center justify-center px-6 py-20">
      <div className="max-w-md w-full bg-surface-card border border-line rounded-2xl p-8 text-center">
        {/* Icon */}
        <div className="w-14 h-14 mx-auto mb-5 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-400">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>

        <h2 className="text-xl font-semibold text-content-primary mb-2">
          Le dashboard a planté.
        </h2>
        <p className="text-sm text-content-secondary mb-6 leading-relaxed">
          Tes données sont en sécu. On regarde — réessaie dans 30 secondes.
        </p>

        {process.env.NODE_ENV === 'development' && error?.message && (
          <div className="mb-6 p-3 rounded-lg bg-surface-elevated border border-line text-left">
            <p className="text-xs font-mono text-red-400 break-all">{error.message}</p>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <button
            onClick={() => reset()}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-semibold hover:from-violet-500 hover:to-indigo-500 transition shadow-lg shadow-violet-500/20"
          >
            Réessayer
          </button>
          <a
            href="/"
            className="w-full py-2.5 px-4 rounded-xl border border-line text-content-secondary text-sm font-medium hover:bg-surface-hover transition text-center"
          >
            Retour à l&apos;accueil
          </a>
        </div>
      </div>
    </div>
  );
}
