'use client';

// ─────────────────────────────────────────────────────────────────────
// Layout des pages /admin/forms/*
// ─────────────────────────────────────────────────────────────────────
// Wrappe les pages du module Volia Formulaires avec :
//   - FormsSidebar (Mes formulaires, Templates, Statistiques)
//   - Bouton hamburger mobile
//
// Hérite automatiquement du layout admin parent (TopBar + ModuleSwitcher).
// Pattern strictement identique à /admin/prospection/layout.js.
// ─────────────────────────────────────────────────────────────────────

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import FormsSidebar from '@/components/forms/FormsSidebar';
import { Menu } from 'lucide-react';

export default function FormsLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname() || '';

  // Sur les pages builder (/admin/forms/[id], hors sous-pages) ou preview,
  // on cache la sidebar pour laisser le builder occuper toute la largeur.
  // Match :
  //   /admin/forms/abc                → builder fullscreen
  //   /admin/forms/abc/preview        → preview fullscreen
  //   /admin/forms/abc/settings       → garde sidebar
  //   /admin/forms/abc/responses      → garde sidebar
  //   /admin/forms/templates          → garde sidebar (sous-route nommée)
  //   /admin/forms/stats              → garde sidebar (sous-route nommée)
  //
  // ⚠️ Bug 28 mai 2026 (signalé par founder) : la regex `[^/]+` matchait
  // aussi "templates" et "stats" → le menu de gauche disparaissait sur
  // ces 2 pages. Fix : whitelist explicite des sous-routes nommées non
  // fullscreen, comme ça toute future sous-route (ex /admin/forms/import)
  // ne cassera pas non plus.
  const RESERVED_SUBROUTES = new Set(['templates', 'stats']);
  const fullscreenExec = /^\/admin\/forms\/([^/]+)(\/preview)?\/?$/.exec(pathname);
  const isFullscreen =
    fullscreenExec &&
    pathname !== '/admin/forms' &&
    !RESERVED_SUBROUTES.has(fullscreenExec[1]);

  if (isFullscreen) {
    return <main className="min-w-0">{children}</main>;
  }

  return (
    <div className="flex">
      <FormsSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Mobile : bouton hamburger pour ouvrir la sidebar */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="md:hidden fixed bottom-4 left-4 z-30 p-3 rounded-full bg-pink-600 hover:bg-pink-500 text-white shadow-lg shadow-pink-500/30 active:scale-95 transition-all"
        aria-label="Ouvrir le menu Formulaires"
      >
        <Menu size={20} />
      </button>

      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
