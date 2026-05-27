'use client';

// ─────────────────────────────────────────────────────────────────────
// FAQSection — refonte mai 2026
// ─────────────────────────────────────────────────────────────────────
// Avant : 12 questions en colonne mono-bloc, "trop long et simple"
// (feedback founder). Améliorations UX :
//
//   1. Tabs catégorie (Tout / Produit / Données / Tarifs / Concurrents)
//      → l'utilisateur cible direct sa zone d'intérêt
//   2. Search live (filtre question + réponse) — débloque l'utilisateur
//      qui sait exactement ce qu'il cherche
//   3. Pastille couleur + emoji par catégorie → différenciation visuelle
//      au scan, fini la liste uniforme
//   4. Preview de la réponse (clamp 1 ligne) quand fermé → l'utilisateur
//      sait si ça vaut le clic
//   5. Compteur "X questions trouvées" → feedback résultat
//   6. CTA contact en bas → fallback si la FAQ ne répond pas
//   7. Empty state quand search ne retourne rien
//   8. Première question pré-ouverte → montre le format direct
//
// A11y : aria-expanded, aria-controls, focus-visible, role region.
// ─────────────────────────────────────────────────────────────────────

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronDown, Search, MessageCircle, X } from 'lucide-react';
import { FAQ_ITEMS, FAQ_CATEGORIES } from '@/lib/faq-data';

// ─── Style helpers par catégorie ─────────────────────────────────────
// Centralisé pour éviter la dispersion de classNames Tailwind dans le JSX.
const ACCENT_STYLES = {
  violet: {
    pill: 'bg-violet-100 text-violet-700 border-violet-200',
    pillActive: 'bg-violet-600 text-white border-violet-600 shadow-md shadow-violet-500/30',
    dot: 'bg-violet-500',
    iconBg: 'bg-violet-100 text-violet-600',
  },
  emerald: {
    pill: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    pillActive: 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-500/30',
    dot: 'bg-emerald-500',
    iconBg: 'bg-emerald-100 text-emerald-600',
  },
  amber: {
    pill: 'bg-amber-100 text-amber-700 border-amber-200',
    pillActive: 'bg-amber-600 text-white border-amber-600 shadow-md shadow-amber-500/30',
    dot: 'bg-amber-500',
    iconBg: 'bg-amber-100 text-amber-700',
  },
  rose: {
    pill: 'bg-rose-100 text-rose-700 border-rose-200',
    pillActive: 'bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-500/30',
    dot: 'bg-rose-500',
    iconBg: 'bg-rose-100 text-rose-600',
  },
};

// Lookup rapide id → meta catégorie (icône, accent…)
const CATEGORY_BY_ID = FAQ_CATEGORIES.reduce((acc, c) => {
  acc[c.id] = c;
  return acc;
}, {});

export default function FAQSection() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [query, setQuery] = useState('');
  const [openIndex, setOpenIndex] = useState(0); // 1re question ouverte par défaut

  // Filtre combiné catégorie + search ─ recalcul mémoïsé
  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    return FAQ_ITEMS.map((item, originalIdx) => ({ ...item, originalIdx })).filter((item) => {
      if (activeCategory !== 'all' && item.category !== activeCategory) return false;
      if (!q) return true;
      return (
        item.question.toLowerCase().includes(q) ||
        item.answer.toLowerCase().includes(q)
      );
    });
  }, [activeCategory, query]);

  // Compteurs par catégorie pour afficher les badges sur les pills
  const counts = useMemo(() => {
    const c = { all: FAQ_ITEMS.length };
    FAQ_ITEMS.forEach((item) => {
      c[item.category] = (c[item.category] || 0) + 1;
    });
    return c;
  }, []);

  const toggle = (idx) => setOpenIndex(openIndex === idx ? -1 : idx);

  return (
    <section id="faq" className="py-24 px-6 border-t border-line">
      <div className="max-w-5xl mx-auto">
        {/* ─── Header ─── */}
        <div className="text-center mb-12">
          <p className="text-sm font-semibold text-violet-400 mb-3">FAQ</p>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-content-primary">
            Les vraies questions.
          </h2>
          <p className="text-content-tertiary text-lg max-w-xl mx-auto">
            On vous a vu venir. Réponses directes.
          </p>
        </div>

        {/* ─── Controls : search + tabs catégorie ─── */}
        <div className="mb-8 space-y-4">
          {/* Search */}
          <div className="relative max-w-md mx-auto">
            <Search
              size={16}
              aria-hidden="true"
              className="absolute left-4 top-1/2 -translate-y-1/2 text-content-tertiary pointer-events-none"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Chercher une question…"
              aria-label="Filtrer les questions"
              className="w-full pl-10 pr-10 py-3 rounded-full border border-line bg-surface-elevated/60 text-sm text-content-primary placeholder:text-content-tertiary focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-400 transition"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="Effacer la recherche"
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-surface-card text-content-tertiary hover:text-content-primary transition"
              >
                <X size={14} aria-hidden="true" />
              </button>
            )}
          </div>

          {/* Tabs catégorie */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            {FAQ_CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat.id;
              const styles = ACCENT_STYLES[cat.accent] || {};
              const count = counts[cat.id] ?? 0;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setActiveCategory(cat.id);
                    setOpenIndex(-1); // reset accordéon au changement de catégorie
                  }}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-medium border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40 ${
                    isActive
                      ? cat.accent
                        ? styles.pillActive
                        : 'bg-content-primary text-surface-base border-content-primary shadow-md'
                      : 'border-line bg-surface-elevated/40 text-content-secondary hover:border-line-hover hover:text-content-primary'
                  }`}
                  aria-pressed={isActive}
                >
                  {cat.icon && <span aria-hidden="true">{cat.icon}</span>}
                  <span>{cat.label}</span>
                  <span
                    className={`text-[10px] font-mono rounded-full px-1.5 py-0.5 ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-surface-card text-content-tertiary'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ─── Result counter (subtil, n'apparaît qu'avec un filtre actif) ─── */}
        {(query || activeCategory !== 'all') && (
          <p className="text-center text-xs text-content-tertiary mb-6">
            {filteredItems.length === 0
              ? 'Aucune question trouvée.'
              : `${filteredItems.length} question${filteredItems.length > 1 ? 's' : ''} ${
                  query ? `pour « ${query} »` : ''
                }`}
          </p>
        )}

        {/* ─── Liste questions ─── */}
        {filteredItems.length === 0 ? (
          <EmptyState onReset={() => { setQuery(''); setActiveCategory('all'); }} />
        ) : (
          <div className="space-y-3">
            {filteredItems.map((item) => {
              const isOpen = openIndex === item.originalIdx;
              const panelId = `faq-panel-${item.originalIdx}`;
              const buttonId = `faq-button-${item.originalIdx}`;
              const catMeta = CATEGORY_BY_ID[item.category];
              const styles = catMeta ? ACCENT_STYLES[catMeta.accent] : {};
              // Preview = première phrase de la réponse (ou clamp ~100 char)
              const preview = item.answer.split(/(?<=[.!?])\s/)[0].slice(0, 110);
              return (
                <div
                  key={item.originalIdx}
                  className={`rounded-2xl border bg-surface-elevated/40 backdrop-blur-sm overflow-hidden transition-all ${
                    isOpen
                      ? 'border-violet-300/60 shadow-lg shadow-violet-500/5'
                      : 'border-line hover:border-line-hover'
                  }`}
                >
                  <button
                    type="button"
                    id={buttonId}
                    onClick={() => toggle(item.originalIdx)}
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    className="w-full flex items-start gap-4 px-5 sm:px-6 py-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40 focus-visible:ring-inset"
                  >
                    {/* Icône catégorie — coloré selon accent */}
                    <span
                      className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-base ${styles.iconBg || 'bg-surface-card text-content-tertiary'}`}
                      aria-hidden="true"
                    >
                      {catMeta?.icon || '•'}
                    </span>

                    {/* Question + preview */}
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm sm:text-base font-semibold text-content-primary">
                        {item.question}
                      </span>
                      {!isOpen && (
                        <span className="block mt-1 text-xs text-content-tertiary line-clamp-1">
                          {preview}…
                        </span>
                      )}
                    </span>

                    <ChevronDown
                      size={18}
                      aria-hidden="true"
                      className={`flex-shrink-0 mt-1 text-content-tertiary transition-transform duration-300 ${
                        isOpen ? 'rotate-180 text-violet-600' : ''
                      }`}
                    />
                  </button>

                  <div
                    id={panelId}
                    role="region"
                    aria-labelledby={buttonId}
                    hidden={!isOpen}
                    className={`grid transition-all duration-300 ease-in-out ${
                      isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div className="px-5 sm:px-6 pb-5 pt-0 pl-[68px] sm:pl-[76px]">
                        <p className="text-sm text-content-secondary leading-relaxed">
                          {item.answer}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ─── CTA "Pas trouvé ?" ─── */}
        <div className="mt-12 text-center">
          <div className="inline-flex flex-col sm:flex-row items-center gap-3 sm:gap-5 px-6 py-5 rounded-2xl border border-line bg-surface-elevated/40">
            <MessageCircle size={20} className="text-violet-500" aria-hidden="true" />
            <span className="text-sm text-content-secondary">
              Votre question n&apos;est pas là ?
            </span>
            <Link
              href="mailto:hello@volia.fr?subject=Question%20sur%20Volia"
              className="inline-flex items-center gap-1 text-sm font-semibold text-violet-700 hover:text-violet-600 transition"
            >
              Écrivez-nous directement
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Empty state séparé pour clarté ───────────────────────────────────
function EmptyState({ onReset }) {
  return (
    <div className="text-center py-16 px-6 rounded-2xl border border-dashed border-line bg-surface-elevated/30">
      <div className="text-3xl mb-3" aria-hidden="true">🔍</div>
      <p className="text-base font-semibold text-content-primary mb-1">
        Aucune question ne matche.
      </p>
      <p className="text-sm text-content-tertiary mb-5">
        Essayez d&apos;autres mots-clés, ou contactez-nous directement.
      </p>
      <button
        type="button"
        onClick={onReset}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border border-line bg-surface-base text-content-primary hover:border-violet-400 hover:text-violet-700 transition"
      >
        Réinitialiser les filtres
      </button>
    </div>
  );
}
