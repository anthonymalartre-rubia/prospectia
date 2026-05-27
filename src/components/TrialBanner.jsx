'use client';

// ─────────────────────────────────────────────────────────────────
// TrialBanner — Affiche le countdown du trial Pro 14j sur le dashboard.
// ─────────────────────────────────────────────────────────────────
// Comportement :
//   - Trial actif > 3j  → fond emerald, message neutre + CTA Passer Pro
//   - Trial actif ≤ 3j  → fond amber, message urgence
//   - Trial expiré      → fond red, message "réactivez"
//   - Pas de trial      → null (rien affiché)
//
// "Plus tard" dismiss pour 24h (localStorage). Le dismiss ne s'applique
// PAS au mode trial expiré (qui doit rester visible jusqu'à upgrade).
// ─────────────────────────────────────────────────────────────────

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { daysRemainingInTrial, isTrialActive, isTrialExpired, isTrialExpiringSoon } from '@/lib/trial';

const DISMISS_KEY = 'volia_trial_banner_dismissed_until';

export default function TrialBanner({ profile }) {
  const [dismissedUntil, setDismissedUntil] = useState(null);

  useEffect(() => {
    try {
      const v = localStorage.getItem(DISMISS_KEY);
      if (v) setDismissedUntil(parseInt(v, 10));
    } catch {
      /* localStorage indispo (SSR / privé) → ignore */
    }
  }, []);

  if (!profile) return null;

  const active = isTrialActive(profile);
  const expired = isTrialExpired(profile);
  if (!active && !expired) return null;

  // Dismiss valide uniquement pour le mode "trial actif" non urgent.
  // L'expiration et le mode urgence (≤3j) ne peuvent pas être dismissed.
  const now = Date.now();
  const isUrgent = isTrialExpiringSoon(profile);
  const canDismiss = active && !isUrgent;
  if (canDismiss && dismissedUntil && now < dismissedUntil) {
    return null;
  }

  const handleDismiss = () => {
    const until = Date.now() + 24 * 60 * 60 * 1000; // +24h
    try {
      localStorage.setItem(DISMISS_KEY, String(until));
    } catch {
      /* ignore */
    }
    setDismissedUntil(until);
  };

  // ─── 3 variants selon état ──────────────────────────────────────
  let bgClass, borderClass, textClass, accentClass, icon, message, cta;

  if (expired) {
    bgClass = 'bg-red-50 dark:bg-red-950/30';
    borderClass = 'border-red-200 dark:border-red-900/60';
    textClass = 'text-red-900 dark:text-red-200';
    accentClass = 'text-red-700 dark:text-red-300';
    icon = '🛑';
    message = (
      <>
        <strong>Trial terminé.</strong> Passez Pro pour récupérer cascade waterfall,
        campagnes et 5&nbsp;000 prospects/mois.
      </>
    );
    cta = (
      <Link
        href="/pricing?plan=pro"
        className="inline-flex items-center px-4 py-1.5 rounded-md text-sm font-semibold bg-red-600 hover:bg-red-700 text-white transition-colors"
      >
        Réactiver Pro
      </Link>
    );
  } else if (isUrgent) {
    const days = daysRemainingInTrial(profile);
    bgClass = 'bg-amber-50 dark:bg-amber-950/30';
    borderClass = 'border-amber-200 dark:border-amber-900/60';
    textClass = 'text-amber-900 dark:text-amber-200';
    accentClass = 'text-amber-700 dark:text-amber-300';
    icon = '⏱️';
    message = (
      <>
        <strong>
          {days} {days > 1 ? 'jours' : 'jour'} de Pro restants.
        </strong>{' '}
        Passez Pro pour garder vos features sans interruption.
      </>
    );
    cta = (
      <Link
        href="/pricing?plan=pro"
        className="inline-flex items-center px-4 py-1.5 rounded-md text-sm font-semibold bg-amber-600 hover:bg-amber-700 text-white transition-colors"
      >
        Passer Pro maintenant
      </Link>
    );
  } else {
    const days = daysRemainingInTrial(profile);
    bgClass = 'bg-emerald-50 dark:bg-emerald-950/30';
    borderClass = 'border-emerald-200 dark:border-emerald-900/60';
    textClass = 'text-emerald-900 dark:text-emerald-200';
    accentClass = 'text-emerald-700 dark:text-emerald-300';
    icon = '🎉';
    message = (
      <>
        <strong>Trial Pro actif</strong> — {days} jours restants pour
        tester toutes les features.
      </>
    );
    cta = (
      <Link
        href="/pricing?plan=pro"
        className="inline-flex items-center px-4 py-1.5 rounded-md text-sm font-semibold bg-violet-600 hover:bg-violet-700 text-white transition-colors"
      >
        Passer à Pro
      </Link>
    );
  }

  return (
    <div
      className={`border-b ${bgClass} ${borderClass} ${textClass}`}
      role="status"
      aria-live="polite"
    >
      <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 py-2.5 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-start sm:items-center gap-2 flex-1 min-w-0">
          <span className="text-lg leading-none" aria-hidden="true">
            {icon}
          </span>
          <p className={`text-sm leading-relaxed ${accentClass}`}>{message}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {cta}
          {canDismiss && (
            <button
              type="button"
              onClick={handleDismiss}
              className={`text-xs px-2 py-1 rounded ${accentClass} hover:underline`}
              aria-label="Masquer le bandeau pendant 24h"
            >
              Plus tard
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
