'use client';

// ─────────────────────────────────────────────────────────────────────
// CampagnesSidebar — sidebar contextuelle pour /admin/prospection/*
// ─────────────────────────────────────────────────────────────────────
// Pattern identique à CrmSidebar (cohérence cross-modules) mais accent
// blue/violet — couleur du module Campagnes (cf. ModuleSwitcher BETA blue).
//
// Détection active via usePathname() :
//   - /admin/prospection                  → Listes (hub)
//   - /admin/prospection/lists/[id]       → Listes (encore actif)
//   - /admin/prospection/campaigns        → Campagnes email
//   - /admin/prospection/campaigns/[id]   → idem
//   - /settings/email-senders             → Domaines (lien out vers settings)
// ─────────────────────────────────────────────────────────────────────

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Users,
  Mail,
  Globe,
  BarChart3,
  FileText,
  ChevronLeft,
  Sparkles,
  GitBranch,
} from 'lucide-react';

const NAV_ITEMS = [
  {
    id: 'lists',
    label: 'Listes',
    description: 'Vos listes de prospects',
    href: '/admin/prospection',
    icon: Users,
    matches: (p) =>
      p === '/admin/prospection' ||
      p === '/admin/prospection/' ||
      p.startsWith('/admin/prospection/lists'),
  },
  {
    id: 'campaigns',
    label: 'Campagnes email',
    description: 'Pilotez vos envois',
    href: '/admin/prospection/campaigns',
    icon: Mail,
    matches: (p) => p.startsWith('/admin/prospection/campaigns'),
  },
  {
    id: 'sequences',
    label: 'Séquences',
    description: 'Multi-touch + stop-on-reply',
    href: '/admin/prospection/sequences',
    icon: GitBranch,
    matches: (p) => p.startsWith('/admin/prospection/sequences'),
  },
  {
    id: 'senders',
    label: 'Domaines d\'envoi',
    description: 'Resend multi-tenant',
    href: '/settings/email-senders',
    icon: Globe,
    matches: (p) => p.startsWith('/settings/email-senders'),
  },
  {
    id: 'templates',
    label: 'Templates',
    description: 'Bibliothèque emails',
    href: '/admin/prospection/templates',
    icon: FileText,
    matches: (p) => p.startsWith('/admin/prospection/templates'),
  },
  {
    id: 'stats',
    label: 'Statistiques',
    description: 'Performance globale',
    href: '/admin/prospection/stats',
    icon: BarChart3,
    soon: true,
    matches: (p) => p.startsWith('/admin/prospection/stats'),
  },
];

export default function CampagnesSidebar({ isOpen, onClose }) {
  const pathname = usePathname() || '';

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
        {/* Hint gradient blue/violet au sommet */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/40 to-transparent pointer-events-none" />

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
              Volia Campagnes
            </p>
          </div>

          {/* Navigation */}
          <nav className="space-y-1" role="navigation" aria-label="Navigation Campagnes">
            {NAV_ITEMS.map((item) => {
              const isActive = item.matches(pathname);
              const Icon = item.icon;
              const isDisabled = item.soon;

              const className = `
                w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 relative
                ${
                  isActive
                    ? 'bg-blue-100/80 text-blue-700 shadow-sm shadow-blue-500/10'
                    : isDisabled
                    ? 'text-content-tertiary hover:bg-surface-card cursor-not-allowed opacity-70'
                    : 'text-content-tertiary hover:text-content-primary hover:bg-surface-card active:scale-[0.98]'
                }
              `;

              const inner = (
                <>
                  {isActive && (
                    <div className="absolute left-0 w-1 h-6 bg-blue-600 rounded-r-full" />
                  )}
                  <div
                    className={`p-1.5 rounded-lg transition-colors ${
                      isActive ? 'bg-blue-200/60' : 'bg-surface-card'
                    }`}
                  >
                    <Icon size={16} />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-1.5">
                      <span>{item.label}</span>
                      {item.soon && (
                        <span className="text-[8px] font-bold uppercase tracking-wider px-1 py-px rounded bg-amber-100 text-amber-700 border border-amber-200">
                          Bientôt
                        </span>
                      )}
                    </div>
                    <div
                      className={`text-[10px] ${
                        isActive ? 'text-blue-700/60' : 'text-content-faint'
                      }`}
                    >
                      {item.description}
                    </div>
                  </div>
                </>
              );

              if (isDisabled) {
                return (
                  <button
                    key={item.id}
                    type="button"
                    disabled
                    aria-disabled="true"
                    title="Disponible bientôt"
                    className={className}
                  >
                    {inner}
                  </button>
                );
              }

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
                  {inner}
                </Link>
              );
            })}
          </nav>

          {/* Bottom info card */}
          <div className="mt-auto">
            <div className="relative p-4 rounded-xl bg-gradient-to-br from-blue-500/[0.06] to-cyan-500/[0.06] border border-blue-500/15 overflow-hidden">
              <div className="absolute -bottom-8 -right-8 w-20 h-20 rounded-full bg-blue-500/15 blur-2xl pointer-events-none" />
              <div className="relative flex items-center gap-2 mb-2">
                <Sparkles size={11} className="text-blue-600" />
                <p className="text-[10px] uppercase tracking-wider text-blue-700 font-semibold">
                  Module Campagnes
                </p>
              </div>
              <p className="relative text-[10px] text-content-tertiary leading-relaxed">
                Séquences email avec warmup intégré, tracking opens/clicks
                et auto-create CRM depuis replies.
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
