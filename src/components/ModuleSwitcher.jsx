'use client';

// ─────────────────────────────────────────────────────────────────────
// ModuleSwitcher — dropdown HubSpot-style pour switcher entre les 3
// modules de la suite Volia (Prospection / Campagnes / CRM).
// ─────────────────────────────────────────────────────────────────────
//
// Placement : TopBar, juste après le logo.
//
// Détection du module actif via usePathname() :
//   - /dashboard*       OR /app/prospection* → Prospection (LIVE, violet)
//   - /admin/prospection/campaigns* OR /admin/prospection/sms*
//                       OR /app/campagnes*   → Campagnes (BETA, blue)
//   - /app/crm*                              → CRM (BIENTÔT, emerald)
//   - sinon (settings, admin home, ...)      → Prospection par défaut
//
// Couleurs alignées avec MODULE_THEMES de ProductPageLayout.jsx.
// Tout en LIGHT mode (semantic tokens). A11y : aria-* + keyboard nav.
// ─────────────────────────────────────────────────────────────────────

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Search,
  Mail,
  KanbanSquare,
  ChevronDown,
  ChevronRight,
  Check,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────
// Catalogue des modules
// ─────────────────────────────────────────────────────────────────────
// On garde la liste statique (3 modules connus) et on déclare TOUTES
// les classes Tailwind explicitement — pas de string interpolation
// dynamique sinon le purge Tailwind les supprime au build.
// ─────────────────────────────────────────────────────────────────────
const MODULES = [
  {
    id: 'prospection',
    name: 'Prospection',
    description: 'Trouvez les emails B2B',
    href: '/app/prospection',
    icon: Search,
    status: { label: 'LIVE', className: 'bg-emerald-100 text-emerald-700 border-emerald-300' },
    color: 'violet',
    iconGradient: 'from-violet-500 to-indigo-600',
    activeBg: 'bg-violet-50',
    activeBorder: 'border-violet-200',
    activeText: 'text-violet-700',
    accent: 'text-violet-600',
  },
  {
    id: 'campagnes',
    name: 'Campagnes',
    description: 'Séquences email + SMS',
    href: '/app/campagnes',
    icon: Mail,
    status: { label: 'BETA', className: 'bg-blue-100 text-blue-700 border-blue-300' },
    color: 'blue',
    iconGradient: 'from-blue-500 to-cyan-600',
    activeBg: 'bg-blue-50',
    activeBorder: 'border-blue-200',
    activeText: 'text-blue-700',
    accent: 'text-blue-600',
  },
  {
    id: 'crm',
    name: 'CRM',
    description: 'Pipeline commercial',
    href: '/app/crm',
    icon: KanbanSquare,
    status: { label: 'BIENTÔT', className: 'bg-amber-100 text-amber-700 border-amber-300' },
    color: 'emerald',
    iconGradient: 'from-emerald-500 to-teal-600',
    activeBg: 'bg-emerald-50',
    activeBorder: 'border-emerald-200',
    activeText: 'text-emerald-700',
    accent: 'text-emerald-600',
  },
];

// ─────────────────────────────────────────────────────────────────────
// Détection du module actif depuis le pathname.
// ─────────────────────────────────────────────────────────────────────
function detectActiveModule(pathname) {
  if (!pathname) return MODULES[0];

  // Campagnes : checked before /admin/prospection (qui matche aussi).
  if (
    pathname.startsWith('/admin/prospection/campaigns') ||
    pathname.startsWith('/admin/prospection/sms') ||
    pathname.startsWith('/app/campagnes')
  ) {
    return MODULES[1];
  }

  // CRM
  if (pathname.startsWith('/app/crm')) {
    return MODULES[2];
  }

  // Prospection (default — dashboard, /app/prospection, et fallback admin/settings)
  return MODULES[0];
}

export default function ModuleSwitcher() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const triggerRef = useRef(null);

  const activeModule = useMemo(() => detectActiveModule(pathname), [pathname]);
  const ActiveIcon = activeModule.icon;

  // Close on outside click + Escape
  useEffect(() => {
    if (!open) return;

    function onPointerDown(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    function onKeyDown(e) {
      if (e.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      {/* ─── Trigger ────────────────────────────────────────────── */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Module actif : Volia ${activeModule.name}. Cliquer pour changer de module.`}
        className={`
          group flex items-center gap-2 pl-2 pr-2.5 py-1.5 rounded-lg
          border border-line bg-surface-card hover:bg-surface-elevated
          text-content-primary text-sm font-medium
          active:scale-[0.98] transition-all
        `}
      >
        <span
          className={`
            w-6 h-6 rounded-md flex items-center justify-center
            bg-gradient-to-br ${activeModule.iconGradient}
            shadow-sm
          `}
          aria-hidden="true"
        >
          <ActiveIcon size={13} className="text-white" />
        </span>
        <span className="hidden sm:inline whitespace-nowrap">
          {activeModule.name}
        </span>
        <ChevronDown
          size={14}
          className={`text-content-tertiary transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* ─── Dropdown menu ──────────────────────────────────────── */}
      {open && (
        <div
          role="menu"
          aria-label="Modules Volia"
          className={`
            absolute left-0 mt-2 w-[300px] max-w-[calc(100vw-2rem)]
            rounded-xl border border-line bg-surface-base shadow-2xl shadow-zinc-900/10
            ring-1 ring-zinc-900/5
            p-2 z-50
            animate-in fade-in slide-in-from-top-2 duration-200
          `}
        >
          <div className="px-2 pt-1 pb-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-content-muted">
              Suite Volia
            </p>
          </div>

          <ul className="space-y-1" role="none">
            {MODULES.map((mod) => {
              const Icon = mod.icon;
              const isActive = mod.id === activeModule.id;
              return (
                <li key={mod.id} role="none">
                  <Link
                    href={mod.href}
                    role="menuitem"
                    onClick={() => setOpen(false)}
                    aria-current={isActive ? 'page' : undefined}
                    className={`
                      group flex items-center gap-3 px-2.5 py-2.5 rounded-lg
                      border transition-all
                      ${
                        isActive
                          ? `${mod.activeBg} ${mod.activeBorder}`
                          : 'border-transparent hover:bg-surface-elevated hover:border-line'
                      }
                    `}
                  >
                    <span
                      className={`
                        w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
                        bg-gradient-to-br ${mod.iconGradient}
                        shadow-md
                        ${isActive ? '' : 'group-hover:scale-105'}
                        transition-transform
                      `}
                      aria-hidden="true"
                    >
                      <Icon size={16} className="text-white" />
                    </span>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-sm font-semibold ${
                            isActive ? mod.activeText : 'text-content-primary'
                          }`}
                        >
                          Volia {mod.name}
                        </span>
                        <span
                          className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full border ${mod.status.className}`}
                        >
                          {mod.status.label}
                        </span>
                      </div>
                      <div className="text-[11px] text-content-tertiary mt-0.5 truncate">
                        {mod.description}
                      </div>
                    </div>

                    {isActive ? (
                      <Check
                        size={16}
                        className={`flex-shrink-0 ${mod.accent}`}
                        aria-hidden="true"
                      />
                    ) : (
                      <ChevronRight
                        size={14}
                        className="flex-shrink-0 text-content-muted group-hover:text-content-tertiary group-hover:translate-x-0.5 transition-all"
                        aria-hidden="true"
                      />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="mt-2 pt-2 border-t border-line">
            <Link
              href="/produits/prospection"
              onClick={() => setOpen(false)}
              role="menuitem"
              className="block px-2.5 py-1.5 rounded-md text-[11px] text-content-tertiary hover:text-content-primary hover:bg-surface-elevated transition-colors"
            >
              Découvrir la suite Volia →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
