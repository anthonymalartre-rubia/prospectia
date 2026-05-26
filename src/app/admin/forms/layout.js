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
import FormsSidebar from '@/components/forms/FormsSidebar';
import { Menu } from 'lucide-react';

export default function FormsLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
