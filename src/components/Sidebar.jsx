'use client';

import { useState } from 'react';
import {
  LayoutDashboard,
  Search,
  Users,
  Download,
  ChevronLeft,
  Shield,
  Settings,
  ShieldCheck,
  Sparkles,
  ArrowUpRight,
  Lock,
  Gift,
  PlayCircle,
} from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import UpgradeRequiredModal from '@/components/UpgradeRequiredModal';

// ─── Hiérarchie des plans ──────────────────────────────────
// Ordre croissant utilisé pour comparer "user a au moins X".
// Note : "starter" et "free" sont alias (free historique) ;
//        "enterprise" est alias historique de "business".
const PLAN_ORDER = ['free', 'starter', 'solo', 'pro', 'business', 'enterprise'];
const PLAN_LEVEL = {
  free: 0,
  starter: 0,
  solo: 1,
  pro: 2,
  business: 3,
  enterprise: 3,
};

function hasAccess(userPlanId, requiredPlanId) {
  if (!requiredPlanId || requiredPlanId === 'free' || requiredPlanId === 'starter') return true;
  const userLevel = PLAN_LEVEL[userPlanId] ?? 0;
  const requiredLevel = PLAN_LEVEL[requiredPlanId] ?? 0;
  return userLevel >= requiredLevel;
}

// Métadonnées plans pour les badges et l'encart "next step"
const PLAN_META = {
  solo: { name: 'Solo', price: 19, hint: 'Passe Solo : 10× plus de prospects' },
  pro: { name: 'Pro', price: 49, hint: 'Passe Pro : vérif emails illimitée' },
  business: { name: 'Business', price: 99, hint: 'Passe Business : CRM intégré + API' },
};

// Plan suivant à proposer dans l'encart de bas de sidebar
function getNextPlan(userPlanId) {
  if (!userPlanId || userPlanId === 'free' || userPlanId === 'starter') return 'solo';
  if (userPlanId === 'solo') return 'pro';
  if (userPlanId === 'pro') return 'business';
  return null; // business/enterprise : rien à upgrade
}

export default function Sidebar({ activeView, onViewChange, onClose, isOpen, prospectCount, searchHistory, isAdmin, userPlan }) {
  const { t, locale } = useI18n();
  const [upgradeModal, setUpgradeModal] = useState(null); // { feature, requiredPlan } | null

  const userPlanId = userPlan?.id || 'free';
  const isBusiness = userPlanId === 'business' || userPlanId === 'enterprise';

  // ─── Items de navigation ─────────────────────────────────
  // requiredPlan : plan minimum requis pour utiliser l'item.
  // Tous les items sont AFFICHÉS (pas filtrés) ; les inaccessibles
  // portent un badge "Pro" / "Business" et ouvrent la modale upgrade.
  const NAV_ITEMS = [
    { id: 'overview', label: t('sidebar.overview'), icon: LayoutDashboard, description: 'Tableau de bord', requiredPlan: 'free' },
    { id: 'search', label: t('sidebar.search'), icon: Search, description: 'Google Places', requiredPlan: 'free' },
    { id: 'results', label: t('sidebar.leads'), icon: Users, description: 'Prospects', requiredPlan: 'free' },
    { id: 'export', label: t('sidebar.export'), icon: Download, description: 'CSV', requiredPlan: 'free' },
    { id: 'verify', label: t('sidebar.verify'), icon: ShieldCheck, description: t('sidebar.verifyDesc'), requiredPlan: 'pro' },
  ];

  const nextPlan = isBusiness || isAdmin ? null : getNextPlan(userPlanId);
  const nextMeta = nextPlan ? PLAN_META[nextPlan] : null;

  const handleItemClick = (item) => {
    // L'admin a tout, on bypass
    const accessible = isAdmin || hasAccess(userPlanId, item.requiredPlan);
    if (!accessible) {
      setUpgradeModal({ feature: item.label, requiredPlan: item.requiredPlan });
      return;
    }
    onViewChange(item.id);
    // onClose() ne sert qu'en mobile pour refermer le drawer.
    if (window.matchMedia('(max-width: 767px)').matches) {
      onClose();
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        relative fixed top-14 left-0 z-40 h-[calc(100vh-3.5rem)] w-64
        bg-surface-base/90 backdrop-blur-xl border-r border-line
        transition-transform duration-300 ease-out
        md:translate-x-0 md:static md:z-auto
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Hint gradient violet au sommet — signal visuel "premium" subtil */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/30 to-transparent pointer-events-none" />

        <div className="flex flex-col h-full p-4">
          {/* Close button mobile */}
          <button
            onClick={onClose}
            className="md:hidden self-end p-2.5 rounded-lg text-content-muted hover:text-content-primary hover:bg-surface-elevated active:scale-95 transition-all mb-3"
            aria-label={t('sidebar.closeMenu')}
          >
            <ChevronLeft size={18} />
          </button>

          {/* Navigation */}
          <nav className="space-y-1" role="navigation" aria-label="Navigation principale">
            {NAV_ITEMS.map((item) => {
              const isActive = activeView === item.id;
              const accessible = isAdmin || hasAccess(userPlanId, item.requiredPlan);
              const lockedMeta = !accessible ? PLAN_META[item.requiredPlan] : null;

              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  title={lockedMeta ? `Disponible dès ${lockedMeta.name} (${lockedMeta.price} €/mois)` : undefined}
                  className={`
                    w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 relative
                    ${isActive
                      ? 'bg-indigo-600/15 text-indigo-400 shadow-sm shadow-indigo-500/10'
                      : accessible
                        ? 'text-content-tertiary hover:text-content-primary hover:bg-surface-card active:scale-[0.98]'
                        : 'text-content-muted hover:bg-amber-500/[0.06] hover:text-content-secondary active:scale-[0.98]'
                    }
                  `}
                  aria-current={isActive ? 'page' : undefined}
                  aria-disabled={!accessible}
                >
                  {isActive && (
                    <div className="absolute left-0 w-1 h-6 bg-indigo-500 rounded-r-full" />
                  )}
                  <div className={`p-1.5 rounded-lg transition-colors ${isActive ? 'bg-indigo-500/20' : 'bg-surface-card'} ${!accessible ? 'opacity-70' : ''}`}>
                    <item.icon size={16} />
                  </div>
                  <div className={`flex-1 text-left ${!accessible ? 'opacity-80' : ''}`}>
                    <div className="flex items-center gap-1.5">
                      <span>{item.label}</span>
                      {lockedMeta && (
                        <span
                          className="inline-flex items-center gap-0.5 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/30"
                        >
                          <Lock size={8} className="opacity-80" strokeWidth={2.5} />
                          {lockedMeta.name}
                        </span>
                      )}
                    </div>
                    <div className={`text-[10px] ${isActive ? 'text-indigo-400/50' : 'text-content-faint'}`}>
                      {item.description}
                    </div>
                  </div>
                  {item.id === 'results' && prospectCount > 0 && accessible && (
                    <span className={`
                      text-xs font-mono px-2 py-0.5 rounded-full transition-colors
                      ${isActive ? 'bg-indigo-500/20 text-indigo-400' : 'bg-surface-elevated text-content-muted'}
                    `}>
                      {prospectCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Séparateur subtil entre Navigation et Settings/Admin */}
          <div className="my-5 h-px bg-line" />

          {/* Settings link */}
          <a
            href="/settings"
            className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-content-tertiary hover:text-content-primary hover:bg-surface-card transition-all duration-200"
          >
            <div className="p-1.5 rounded-lg bg-surface-card">
              <Settings size={16} />
            </div>
            <div className="flex-1 text-left">
              <div>{t('sidebar.settings')}</div>
              <div className="text-[10px] text-content-faint">{t('sidebar.settingsDesc')}</div>
            </div>
          </a>

          {/* Tutoriels link — accès rapide au centre vidéo (self-service) */}
          <a
            href="/tutoriels"
            className="mt-1 flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-content-tertiary hover:text-content-primary hover:bg-surface-card transition-all duration-200"
          >
            <div className="p-1.5 rounded-lg bg-surface-card">
              <PlayCircle size={16} />
            </div>
            <div className="flex-1 text-left">
              <div>Tutoriels</div>
              <div className="text-[10px] text-content-faint">5 vidéos · 19 min</div>
            </div>
          </a>

          {/* Parrainage link — visible mais discret (hover gradient violet/pink)
              avec badge "+3 mois" pour signaler le levier. Push #3 du programme. */}
          <a
            href="/parrainage"
            className="mt-1 flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-content-tertiary hover:text-content-primary hover:bg-gradient-to-r hover:from-violet-500/10 hover:to-pink-500/10 transition-all duration-200 group"
          >
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-violet-500/15 to-pink-500/15 group-hover:from-violet-500/25 group-hover:to-pink-500/25 transition-colors">
              <Gift size={16} className="text-pink-400" />
            </div>
            <div className="flex-1 text-left">
              <div className="flex items-center gap-1.5">
                <span>Parrainer</span>
                <span className="inline-flex items-center text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-pink-500/15 text-pink-300 border border-pink-500/30">
                  +3 mois
                </span>
              </div>
              <div className="text-[10px] text-content-faint">Gagnez des mois gratuits</div>
            </div>
          </a>

          {/* Admin link */}
          {isAdmin && (
            <a
              href="/admin"
              className="mt-1 flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-amber-600 hover:bg-amber-500/10 transition-all duration-200"
            >
              <div className="p-1.5 rounded-lg bg-amber-500/20">
                <Shield size={16} />
              </div>
              <div className="flex-1 text-left">
                <div>{t('sidebar.admin')}</div>
                <div className="text-[10px] text-amber-600/50">{t('sidebar.adminDesc')}</div>
              </div>
            </a>
          )}

          {/* Search history */}
          <div className="mt-6">
            <h3 className="px-3 text-[10px] font-semibold uppercase tracking-wider text-content-muted mb-2">
              {t('sidebar.history')}
            </h3>
            <div className="space-y-0.5 max-h-48 overflow-y-auto">
              {(searchHistory || []).slice(0, 10).map(session => (
                <div
                  key={session.id}
                  className="px-3 py-2 rounded-lg text-xs text-content-secondary hover:bg-surface-elevated hover:text-content-primary transition-colors"
                >
                  <div className="font-medium truncate">{session.label || t('sidebar.search')}</div>
                  <div className="text-[10px] text-content-muted mt-0.5">
                    {session.results_count || 0} {t('sidebar.results')} &middot; {new Date(session.created_at).toLocaleDateString(locale === 'en' ? 'en-GB' : 'fr-FR')}
                  </div>
                </div>
              ))}
              {(!searchHistory || searchHistory.length === 0) && (
                <div className="px-3 py-2 text-xs text-content-muted">{t('sidebar.noHistory')}</div>
              )}
            </div>
          </div>

          {/* ─── Bottom : encart "Upgrade hint" + bloc France ────────────────
              Si l'user est sur un plan < Business (et n'est pas admin),
              on glisse un mini-encart upgrade contextualisé juste au-dessus
              du bloc France — discret mais visible, gradient amber/violet
              pour signaler "premium" sans crier. */}
          <div className="mt-auto space-y-2">
            {nextMeta && (
              <button
                onClick={() => setUpgradeModal({ feature: null, requiredPlan: nextPlan })}
                className="w-full group relative text-left p-3 rounded-xl bg-gradient-to-br from-amber-500/[0.08] via-violet-500/[0.06] to-indigo-500/[0.08] border border-violet-500/20 hover:border-violet-500/40 hover:from-amber-500/[0.12] hover:to-indigo-500/[0.12] transition-all overflow-hidden"
                aria-label={`Passer au plan ${nextMeta.name}`}
              >
                <div className="absolute -top-6 -right-6 w-16 h-16 rounded-full bg-violet-500/15 blur-2xl pointer-events-none group-hover:bg-violet-500/25 transition-colors" />
                <div className="relative flex items-start gap-2.5">
                  <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-md shadow-violet-500/30">
                    <Sparkles size={13} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-[11px] font-semibold text-content-primary leading-tight">
                        Passer à {nextMeta.name}
                      </p>
                      <ArrowUpRight size={12} className="text-violet-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </div>
                    <p className="text-[10px] text-content-tertiary mt-0.5 leading-snug">
                      {nextMeta.hint} · <span className="font-semibold text-violet-400">{nextMeta.price} €/mois</span>
                    </p>
                  </div>
                </div>
              </button>
            )}

            {/* Bottom info — encart subtil avec hint gradient violet/indigo */}
            <div className="relative p-4 rounded-xl bg-gradient-to-br from-violet-500/[0.05] to-indigo-500/[0.05] border border-violet-500/15 overflow-hidden">
              <div className="absolute -bottom-8 -right-8 w-20 h-20 rounded-full bg-violet-500/15 blur-2xl pointer-events-none" />
              <p className="relative text-[10px] uppercase tracking-wider text-violet-300 font-semibold mb-2">{t('sidebar.allFrance')}</p>
              <p className="relative text-[10px] text-content-muted leading-relaxed">{t('sidebar.franceMeta')}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Modale Upgrade — ouverte quand un item premium est cliqué
          ou quand on clique l'encart "Passer à X" en bas de sidebar */}
      {upgradeModal && (
        <UpgradeRequiredModal
          feature={upgradeModal.feature}
          requiredPlan={upgradeModal.requiredPlan}
          currentPlan={userPlanId}
          onClose={() => setUpgradeModal(null)}
        />
      )}
    </>
  );
}
