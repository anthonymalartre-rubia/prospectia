'use client';

// Barre de progression onboarding — pattern Linear/Notion.
//
// AVANT (legacy) :
// - Widget fixed bottom-right (340px de large, écrasait le dashboard)
// - Tjs visible avec liste expanded
// - Intrusif, masquait du contenu, parfois oublié au fond de l'écran
//
// MAINTENANT (Linear-style) :
// - Barre HORIZONTALE discrète, sticky en haut du dashboard
// - Pliée par défaut : juste "Onboarding · 3/5 (60%)" + bouton expand
// - Expand au clic → modal-popover avec les détails des étapes
// - Disparaît auto quand 100% complété (state.completed_at)
// - Dismissable définitivement (X) avec confirmation localStorage
//
// Auto-fetch /api/onboarding/complete-step (GET) pour récupérer l'état.

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CheckCircle2, Circle, Search, Upload, Send, Download,
  User, ChevronDown, X, Sparkles, ArrowRight, PlayCircle,
} from 'lucide-react';
import BookDemoButton from '@/components/BookDemoButton';

// adminOnly: true → l'étape n'est montrée qu'aux admins (features /admin
// non accessibles aux users standards aujourd'hui). À retirer le jour où
// CSV import et campagnes deviennent self-serve.
//
// nonAdminHref: si défini, on garde l'étape visible pour les non-admins
// mais on substitue le href vers une page marketing/présentation (au lieu
// de masquer l'étape ou de l'envoyer vers une page gated qui renverra
// une erreur d'accès).
const STEPS = [
  {
    id: 'watch_getting_started',
    title: 'Regarde le tuto « Démarrer avec Volia »',
    desc: '3 min pour voir le parcours : signup → première recherche',
    icon: PlayCircle,
    cta: { label: 'Regarder', href: '/tutoriels#getting-started' },
  },
  {
    id: 'first_search',
    title: 'Lance ta première recherche',
    desc: '50 prospects en 30 secondes : catégorie + département',
    icon: Search,
    cta: { label: 'Y aller', href: '/dashboard?view=search' },
  },
  {
    id: 'first_export',
    title: 'Exporte ton CSV',
    desc: 'Format HubSpot / Salesforce / Pipedrive, prêt à coller',
    icon: Download,
    cta: { label: 'Voir mes leads', href: '/dashboard?view=results' },
  },
  {
    id: 'profile_completed',
    title: 'Complète ton profil',
    desc: 'Fonction et entreprise pour personnaliser les templates',
    icon: User,
    cta: { label: 'Réglages', href: '/settings' },
  },
  {
    id: 'first_csv_import',
    title: 'Importe ta première liste CSV',
    desc: 'Récupère tes contacts depuis Excel ou Notion',
    icon: Upload,
    cta: { label: 'Importer', href: '/admin/prospection' },
    adminOnly: true,
  },
  {
    id: 'first_campaign',
    title: 'Lance ta première campagne email',
    desc: 'Cold email avec {{first_name}} + footer RGPD auto',
    icon: Send,
    cta: { label: 'Créer une campagne', href: '/admin/prospection/campaigns/new' },
    // Pour les non-admins, on renvoie vers la page produit (pitch + upgrade)
    // au lieu de masquer l'étape ou de buter sur un écran d'erreur d'accès.
    nonAdminHref: '/produits/campagnes',
    nonAdminLabel: 'Découvrir le module',
  },
];

export default function OnboardingChecklist({ isAdmin = false }) {
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Local dismiss session (l'user peut masquer définitivement)
    if (typeof window !== 'undefined' && localStorage.getItem('onboarding_progressbar_dismissed') === '1') {
      setDismissed(true);
    }
    (async () => {
      try {
        const res = await fetch('/api/onboarding/complete-step');
        if (res.ok) {
          const data = await res.json();
          setState(data);
        }
      } catch {}
      setLoading(false);
    })();
  }, []);

  // Pas afficher pendant le chargement, après dismiss, ou si tout est fait
  if (loading || dismissed || !state) return null;
  if (state.completed_at) return null;

  // Filtre admin-only pour les users standards.
  // Si l'étape a un nonAdminHref, on la garde mais on substituera le CTA
  // plus bas pour pointer vers la page marketing au lieu de la page gated.
  const visibleSteps = STEPS.filter((s) => !s.adminOnly || isAdmin || s.nonAdminHref);
  const stepsDone = visibleSteps.filter((s) => state.steps?.[s.id]).length;
  const pct = Math.round((stepsDone / visibleSteps.length) * 100);

  function handleDismiss() {
    try { localStorage.setItem('onboarding_progressbar_dismissed', '1'); } catch {}
    setDismissed(true);
  }

  // Si tout est fait mais pas encore "completed_at" en base : on cache aussi
  if (stepsDone === visibleSteps.length) return null;

  return (
    <>
      {/* Barre top sticky, juste sous TopBar (h-14). Discrète mais visible. */}
      <div className="sticky top-14 z-30 border-b border-violet-500/20 bg-gradient-to-r from-violet-500/[0.05] via-indigo-500/[0.05] to-violet-500/[0.05] backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 py-2 flex items-center gap-3">
          {/* Icon + label */}
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            className="flex items-center gap-2.5 flex-1 min-w-0 text-left group"
            aria-expanded={expanded}
            aria-controls="onboarding-steps-popover"
          >
            <div className="w-7 h-7 rounded-lg bg-violet-500/15 border border-violet-500/30 flex items-center justify-center flex-shrink-0">
              <Sparkles size={13} className="text-violet-300" />
            </div>
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className="text-xs font-semibold text-content-primary group-hover:text-violet-300 transition whitespace-nowrap">
                Démarrage Volia
              </span>
              <span className="hidden sm:inline text-[11px] text-content-tertiary tabular-nums">
                {stepsDone}/{visibleSteps.length} · {pct}%
              </span>
            </div>
          </button>

          {/* Mini progress bar inline */}
          <div className="hidden sm:block w-32 md:w-48 h-1.5 bg-surface-elevated rounded-full overflow-hidden flex-shrink-0">
            <div
              className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>

          {/* Compact mobile counter */}
          <span className="sm:hidden text-[11px] text-content-tertiary tabular-nums flex-shrink-0">
            {stepsDone}/{visibleSteps.length}
          </span>

          {/* Actions */}
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            className="p-1.5 rounded-lg text-content-tertiary hover:text-content-primary hover:bg-surface-elevated transition"
            aria-label={expanded ? 'Fermer le détail' : 'Voir le détail'}
          >
            <ChevronDown size={14} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className="p-1.5 rounded-lg text-content-muted hover:text-content-tertiary hover:bg-surface-elevated transition"
            aria-label="Masquer définitivement"
            title="Masquer définitivement"
          >
            <X size={14} />
          </button>
        </div>

        {/* Popover détaillé — apparaît sous la barre */}
        {expanded && (
          <div
            id="onboarding-steps-popover"
            className="border-t border-violet-500/15 bg-surface-base/95 backdrop-blur-xl"
          >
            <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 py-3">
              <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {visibleSteps.map((step) => {
                  const done = !!state.steps?.[step.id];
                  const Icon = step.icon;
                  // Étape admin-only mais visible pour non-admin grâce à
                  // nonAdminHref → on swap href + label.
                  const useNonAdminFallback = step.adminOnly && !isAdmin && step.nonAdminHref;
                  const ctaHref = useNonAdminFallback ? step.nonAdminHref : step.cta?.href;
                  const ctaLabel = useNonAdminFallback ? (step.nonAdminLabel || 'En savoir plus') : step.cta?.label;
                  return (
                    <li
                      key={step.id}
                      className={`flex items-start gap-2.5 p-3 rounded-xl border transition ${
                        done
                          ? 'border-emerald-500/20 bg-emerald-500/[0.04] opacity-70'
                          : 'border-line bg-surface-card hover:border-violet-500/30 hover:bg-violet-500/[0.04]'
                      }`}
                    >
                      <div className="mt-0.5 flex-shrink-0">
                        {done ? (
                          <CheckCircle2 size={16} className="text-emerald-400" />
                        ) : (
                          <Circle size={16} className="text-content-muted" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`text-[13px] font-semibold leading-tight ${done ? 'text-content-muted line-through decoration-emerald-500/30' : 'text-content-primary'}`}>
                          {step.title}
                        </div>
                        <div className="text-[11px] text-content-tertiary leading-snug mt-0.5">
                          {step.desc}
                        </div>
                        {!done && ctaHref && (
                          <Link
                            href={ctaHref}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-violet-400 hover:text-violet-300 mt-1.5 transition"
                          >
                            <Icon size={11} />
                            {ctaLabel}
                            <ArrowRight size={10} />
                          </Link>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>

              {/* Footer du popover — CTA booking démo perso (trial assist) */}
              <div className="mt-3 pt-3 border-t border-line/60 flex flex-col sm:flex-row items-center justify-between gap-2">
                <p className="text-[11px] text-content-tertiary leading-snug">
                  Besoin d&apos;un coup de main pour démarrer ? Anthony (founder) vous fait
                  une démo perso en 15 min.
                </p>
                <BookDemoButton
                  label="Réserver 15 min"
                  variant="ghost"
                  size="sm"
                  source="dashboard_onboarding"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
