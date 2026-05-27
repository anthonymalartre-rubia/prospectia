'use client';

// ─────────────────────────────────────────────────────────────────────
// SettingsSidebar — sidebar contextuelle pour /settings/*
// ─────────────────────────────────────────────────────────────────────
// Pattern identique à CrmSidebar / CampagnesSidebar (cohérence
// cross-modules) mais accent violet — couleur historique Settings.
//
// 2 types d'items :
//   - ancres (href '/settings#xxx') → scroll dans la page principale
//   - sous-pages (href '/settings/xxx') → vraie navigation
//
// La détection active distingue les 2 :
//   - Sur /settings : on regarde le hash (preferences, securite, etc.)
//   - Sur /settings/xxx : on matche par startsWith
// ─────────────────────────────────────────────────────────────────────

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  SlidersHorizontal,
  Shield,
  CreditCard,
  Globe,
  Key,
  BookOpen,
  AlertTriangle,
  ChevronLeft,
  Sparkles,
  Users,
  Webhook,
} from 'lucide-react';
import { SMS_CAMPAIGNS_ENABLED } from '@/lib/feature-flags';

const NAV_ITEMS = [
  {
    id: 'preferences',
    label: 'Préférences',
    description: 'Theme, langue, RGPD',
    href: '/settings#preferences',
    icon: SlidersHorizontal,
    matches: (p) => p === '/settings' || p === '/settings/',
  },
  {
    id: 'securite',
    label: 'Sécurité',
    description: 'Mot de passe',
    href: '/settings#securite',
    icon: Shield,
    matches: () => false, // ancre dans la page /settings — pas un état actif distinct
  },
  {
    id: 'plan',
    label: 'Plan & Usage',
    description: 'Abonnement Stripe',
    href: '/settings#plan',
    icon: CreditCard,
    matches: () => false,
  },
  {
    id: 'team',
    label: 'Équipe',
    description: 'Membres & invitations',
    href: '/settings/team',
    icon: Users,
    matches: (p) => p.startsWith('/settings/team'),
  },
  {
    id: 'email-senders',
    label: 'Domaines email',
    description: 'Vos domaines d\'envoi',
    href: '/settings/email-senders',
    icon: Globe,
    matches: (p) => p.startsWith('/settings/email-senders'),
  },
  ...(SMS_CAMPAIGNS_ENABLED
    ? [
        {
          id: 'sms-senders',
          label: 'Numéros SMS',
          description: 'Vos numéros Twilio',
          href: '/settings/sms-senders',
          icon: Globe,
          matches: (p) => p.startsWith('/settings/sms-senders'),
        },
      ]
    : []),
  {
    id: 'api',
    label: 'API & intégrations',
    description: 'Clés Zapier/Make',
    href: '/settings#api',
    icon: Key,
    matches: () => false,
  },
  {
    id: 'webhooks',
    label: 'Webhooks',
    description: 'Events sortants HTTPS',
    href: '/settings/webhooks',
    icon: Webhook,
    matches: (p) => p.startsWith('/settings/webhooks'),
  },
  {
    id: 'aide',
    label: 'Aide',
    description: 'Centre de documentation',
    href: '/docs',
    icon: BookOpen,
    matches: (p) => p.startsWith('/docs'),
    external: false,
  },
  {
    id: 'danger',
    label: 'Zone dangereuse',
    description: 'Suppression compte',
    href: '/settings#danger',
    icon: AlertTriangle,
    matches: () => false,
    danger: true,
  },
];

/**
 * Bug fix UX 27 mai 2026 : la page /settings est désormais en mode onglets
 * (1 seule section visible à la fois). La sidebar gère elle-même l'état actif
 * via window.location.hash (pas de props nécessaires depuis le layout).
 * Au clic sur un anchor /settings#xxx, on update history + dispatch un
 * event hashchange pour que la page écoutante actualise sa section visible.
 */
export default function SettingsSidebar({ isOpen, onClose }) {
  const pathname = usePathname() || '';

  // Map sidebar item id → page section id (alignement FR ↔ EN dans page.js)
  const SECTION_MAP = {
    preferences: 'preferences',
    securite: 'security',
    plan: 'plan',
    api: 'api',
    aide: 'help',
    danger: 'danger',
  };

  // État local du hash courant — utilisé pour highlight la section active
  const [currentHash, setCurrentHash] = useState('preferences');
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const read = () => setCurrentHash(window.location.hash.replace('#', '') || 'preferences');
    read();
    window.addEventListener('hashchange', read);
    return () => window.removeEventListener('hashchange', read);
  }, []);

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed top-14 left-0 z-40 h-[calc(100vh-3.5rem)] w-64
          bg-surface-base/95 backdrop-blur-xl border-r border-line
          transition-transform duration-300 ease-out
          md:translate-x-0 md:static md:z-auto
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Hint gradient violet au sommet */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent pointer-events-none" />

        <div className="flex flex-col h-full p-4">
          {/* Close button mobile */}
          <button
            onClick={onClose}
            className="md:hidden self-end p-2.5 rounded-lg text-content-muted hover:text-content-primary hover:bg-surface-elevated active:scale-95 transition-all mb-3"
            aria-label="Fermer le menu"
          >
            <ChevronLeft size={18} />
          </button>

          {/* Section title */}
          <div className="px-3 mb-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-content-muted">
              Paramètres
            </p>
          </div>

          {/* Navigation */}
          <nav className="space-y-1" role="navigation" aria-label="Navigation paramètres">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isDanger = item.danger;
              // Item in-page (anchor /settings#xxx) → on intercepte le clic
              // pour update le hash et dispatcher un event que la page écoute.
              const isInPageAnchor = item.href?.startsWith('/settings#');
              const mappedSection = SECTION_MAP[item.id];
              const isActive = isInPageAnchor
                ? currentHash === mappedSection || (currentHash === '' && mappedSection === 'preferences')
                : item.matches(pathname);

              const className = `
                w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 relative
                ${
                  isActive
                    ? 'bg-violet-100/80 text-violet-700 shadow-sm shadow-violet-500/10'
                    : isDanger
                    ? 'text-content-tertiary hover:text-red-700 hover:bg-red-50 active:scale-[0.98]'
                    : 'text-content-tertiary hover:text-content-primary hover:bg-surface-card active:scale-[0.98]'
                }
              `;

              // Si in-page anchor → render bouton qui update le hash
              if (isInPageAnchor) {
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      if (typeof window !== 'undefined') {
                        // window.location.hash = X déclenche AUTOMATIQUEMENT
                        // l'événement 'hashchange' que la page écoute (et
                        // ça marche cross-browser, contrairement à
                        // dispatchEvent(new HashChangeEvent(...)) qui requiert
                        // oldURL/newURL et est ignoré par certains browsers).
                        // Bug fix 27 mai 2026.
                        window.location.hash = mappedSection;
                        // Scroll au top de la page (chaque section commence en haut)
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }
                      if (typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches) {
                        onClose?.();
                      }
                    }}
                    aria-current={isActive ? 'page' : undefined}
                    className={className + ' text-left'}
                  >
                    {isActive && (
                      <div className="absolute left-0 w-1 h-6 bg-violet-600 rounded-r-full" />
                    )}
                    <div className={`p-1.5 rounded-lg transition-colors ${isActive ? 'bg-violet-200/60' : isDanger ? 'bg-surface-card' : 'bg-surface-card'}`}>
                      <Icon size={16} />
                    </div>
                    <div className="flex-1 text-left">
                      <span>{item.label}</span>
                      <div className={`text-[10px] ${isActive ? 'text-violet-700/60' : 'text-content-faint'}`}>
                        {item.description}
                      </div>
                    </div>
                  </button>
                );
              }

              // Sinon, comportement Link standard (vers autre page ou fallback)
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  aria-current={isActive ? 'page' : undefined}
                  onClick={() => {
                    if (typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches) {
                      onClose?.();
                    }
                  }}
                  className={className}
                >
                  {isActive && (
                    <div className="absolute left-0 w-1 h-6 bg-violet-600 rounded-r-full" />
                  )}
                  <div
                    className={`p-1.5 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-violet-200/60'
                        : isDanger
                        ? 'bg-surface-card group-hover:bg-red-100'
                        : 'bg-surface-card'
                    }`}
                  >
                    <Icon size={16} />
                  </div>
                  <div className="flex-1 text-left">
                    <span>{item.label}</span>
                    <div
                      className={`text-[10px] ${
                        isActive ? 'text-violet-700/60' : 'text-content-faint'
                      }`}
                    >
                      {item.description}
                    </div>
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* Bottom info card */}
          <div className="mt-auto">
            <div className="relative p-4 rounded-xl bg-gradient-to-br from-violet-500/[0.06] to-indigo-500/[0.06] border border-violet-500/15 overflow-hidden">
              <div className="absolute -bottom-8 -right-8 w-20 h-20 rounded-full bg-violet-500/15 blur-2xl pointer-events-none" />
              <div className="relative flex items-center gap-2 mb-2">
                <Sparkles size={11} className="text-violet-600" />
                <p className="text-[10px] uppercase tracking-wider text-violet-700 font-semibold">
                  Paramètres compte
                </p>
              </div>
              <p className="relative text-[10px] text-content-tertiary leading-relaxed">
                Préférences globales, sécurité, abonnement et domaines d&apos;envoi
                multi-tenant.
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
