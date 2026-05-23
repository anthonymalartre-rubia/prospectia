'use client';

// ReviewSolicitationBanner — encart non-intrusif dans le dashboard pour
// inciter les power users à laisser un avis Trustpilot. Apparaît seulement :
// - Si Trustpilot est configuré (env var Business Unit ID set)
// - L'user a déjà fait au moins 1 export CSV réussi (signal "value reçue")
// - L'user n'a pas dismiss (localStorage check, durée 30 jours)
//
// Stratégie : "Strike when the iron is hot" — on demande l'avis au moment
// précis où l'user a perçu la valeur du produit (export = il a obtenu ses
// prospects). Best practice e-commerce/SaaS (Stripe le fait, Notion aussi).

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Star, X, ExternalLink } from 'lucide-react';
import {
  TRUSTPILOT_BUSINESS_UNIT_ID,
  TRUSTPILOT_REVIEW_URL,
} from '@/lib/trustpilot-data';

const DISMISS_KEY = 'prospectia_trustpilot_solicitation_dismissed_v1';
const DISMISS_DURATION_DAYS = 30;

export default function ReviewSolicitationBanner({ exportsCount = 0 }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Conditions cumulatives
    if (!TRUSTPILOT_BUSINESS_UNIT_ID) return;
    if (exportsCount < 1) return;

    // Vérifie dismiss (avec date d'expiration)
    try {
      const dismissedAtStr = localStorage.getItem(DISMISS_KEY);
      if (dismissedAtStr) {
        const dismissedAt = parseInt(dismissedAtStr, 10);
        const expiresAt = dismissedAt + DISMISS_DURATION_DAYS * 24 * 60 * 60 * 1000;
        if (Date.now() < expiresAt) return;
      }
    } catch {}

    setVisible(true);
  }, [exportsCount]);

  function handleDismiss() {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {}
    setVisible(false);
  }

  function handleClickReview() {
    // On marque comme dismiss pour ne plus afficher après que l'user
    // aille sur Trustpilot (peu importe ce qu'il fait là-bas).
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {}
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-4 z-40 w-[340px] max-w-[calc(100vw-2rem)] rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-zinc-900 to-black shadow-2xl shadow-emerald-900/20 overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-500">
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
            <Star size={16} className="text-emerald-400 fill-emerald-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-sm font-bold text-white">
                Vous aimez Prospectia ?
              </h3>
              <button
                type="button"
                onClick={handleDismiss}
                className="text-zinc-500 hover:text-zinc-200 transition flex-shrink-0"
                aria-label="Fermer"
              >
                <X size={14} />
              </button>
            </div>
            <p className="text-[12px] text-zinc-400 leading-relaxed mt-1">
              Votre avis Trustpilot nous aide énormément. 30 secondes, pas plus.
            </p>
            <div className="flex items-center gap-2 mt-3">
              <Link
                href={TRUSTPILOT_REVIEW_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleClickReview}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-semibold transition shadow-lg shadow-emerald-500/30"
              >
                <Star size={11} className="fill-white" />
                Laisser un avis
                <ExternalLink size={10} />
              </Link>
              <button
                type="button"
                onClick={handleDismiss}
                className="text-[11px] text-zinc-500 hover:text-zinc-300 transition px-2"
              >
                Plus tard
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
