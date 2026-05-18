'use client';

import { useEffect } from 'react';
import { AlertOctagon, Zap, X, ArrowRight, Check } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

/**
 * Modal affichée quand un appel API renvoie 429 (limite atteinte).
 * Plus visible qu'un simple log : explique ce qui s'est passé,
 * combien il manque, et propose le passage Pro en un clic.
 *
 * Props :
 * - type: 'enrichments' | 'searches'           — quelle métrique a sauté
 * - current: number                            — usage actuel (mois)
 * - limit: number                              — plafond du plan
 * - processed?: number                         — combien on a traité avant l'arrêt (optionnel)
 * - total?: number                             — taille de la liste qu'on voulait traiter (optionnel)
 * - currentPlanName?: string                   — ex : "Starter"
 * - onClose: () => void
 * - onUpgrade: () => void
 */
export default function LimitReachedModal({
  type,
  current,
  limit,
  processed,
  total,
  currentPlanName = 'Starter',
  onClose,
  onUpgrade,
}) {
  const { t } = useI18n();

  // Echap pour fermer
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const isEnrich = type === 'enrichments';
  const metricLabel = isEnrich ? t('limitModal.enrichments') : t('limitModal.prospects');
  const remainingToProcess = (typeof total === 'number' && typeof processed === 'number')
    ? Math.max(0, total - processed)
    : null;

  // Pro plan benefits to highlight
  const proBenefits = isEnrich
    ? [
        t('limitModal.proBenefitEnrich1'),
        t('limitModal.proBenefitEnrich2'),
        t('limitModal.proBenefitEnrich3'),
      ]
    : [
        t('limitModal.proBenefitSearch1'),
        t('limitModal.proBenefitSearch2'),
        t('limitModal.proBenefitSearch3'),
      ];

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="limit-modal-title"
    >
      <div
        className="relative w-full max-w-md rounded-2xl bg-surface-card border border-line shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 p-1.5 rounded-lg text-content-muted hover:text-content-primary hover:bg-surface-elevated transition"
          aria-label={t('common.close')}
        >
          <X size={16} />
        </button>

        {/* Header with gradient */}
        <div className="relative px-6 pt-7 pb-5 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-rose-500/10 border-b border-line">
          <div className="pointer-events-none absolute -top-10 -right-10 w-40 h-40 rounded-full bg-amber-500/20 blur-3xl" />
          <div className="relative flex items-start gap-3">
            <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
              <AlertOctagon size={22} className="text-white" />
            </div>
            <div className="flex-1 pr-6">
              <h2 id="limit-modal-title" className="text-lg font-semibold text-content-primary leading-tight">
                {t('limitModal.title', { metric: metricLabel })}
              </h2>
              <p className="mt-1 text-xs text-content-tertiary">
                {t('limitModal.subtitle', { plan: currentPlanName })}
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Usage stats */}
          <div className="rounded-xl border border-line bg-surface-elevated p-4">
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-xs font-medium text-content-secondary uppercase tracking-wider">
                {t('limitModal.usageLabel', { metric: metricLabel })}
              </span>
              <span className="text-sm font-mono font-semibold text-amber-600">
                {current} / {limit}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-surface-deep overflow-hidden">
              <div className="h-full bg-gradient-to-r from-amber-500 to-rose-500 rounded-full" style={{ width: '100%' }} />
            </div>
          </div>

          {/* Stopped progress (if applicable) */}
          {remainingToProcess !== null && remainingToProcess > 0 && (
            <p className="text-sm text-content-secondary leading-relaxed">
              {t('limitModal.stoppedAt', {
                processed: processed,
                total: total,
                remaining: remainingToProcess,
              })}
            </p>
          )}

          {/* Pro benefits */}
          <div className="rounded-xl border border-violet-500/30 bg-gradient-to-br from-violet-500/10 to-indigo-500/10 p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-md bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
                <Zap size={13} className="text-white" />
              </div>
              <span className="text-sm font-semibold text-content-primary">
                {t('limitModal.proHeadline')}
              </span>
            </div>
            <ul className="space-y-1.5">
              {proBenefits.map((b, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-content-secondary">
                  <Check size={13} className="text-violet-500 mt-0.5 flex-shrink-0" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer CTAs */}
        <div className="px-6 pb-6 pt-1 flex flex-col sm:flex-row gap-2">
          <button
            onClick={onUpgrade}
            className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-semibold shadow-lg shadow-violet-500/30 hover:shadow-xl hover:shadow-violet-500/40 hover:from-violet-500 hover:to-indigo-500 transition-all active:scale-[0.98]"
          >
            <Zap size={16} />
            {t('limitModal.upgradeCta')}
            <ArrowRight size={16} />
          </button>
          <button
            onClick={onClose}
            className="inline-flex items-center justify-center px-4 py-3 rounded-xl border border-line-hover bg-surface-card text-sm font-medium text-content-secondary hover:text-content-primary hover:border-content-faint hover:bg-surface-elevated transition-all active:scale-[0.98]"
          >
            {t('limitModal.dismiss')}
          </button>
        </div>
      </div>
    </div>
  );
}
