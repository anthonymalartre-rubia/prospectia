'use client';

// ─────────────────────────────────────────────────────────────────────
// TemplateLibraryModal — sélecteur de template email pour campagnes
// ─────────────────────────────────────────────────────────────────────
// Modal full-screen sur mobile, grid 2-3 cols sur desktop. Recherche +
// filtres par catégorie + preview détaillée avant validation.
//
// Props :
//   - open : boolean
//   - onClose : () => void
//   - onSelect : (template) => void  // appelé avec le template complet
//
// Le parent gère ensuite l'application :
//   setSubject(template.subject); setBodyHtml(template.body_html);
// ─────────────────────────────────────────────────────────────────────

import { useState, useEffect, useMemo } from 'react';
import { X, Search, FileText, Sparkles, ArrowLeft, Check, TrendingUp } from 'lucide-react';
import {
  EMAIL_TEMPLATES,
  TEMPLATE_CATEGORIES,
  filterTemplates,
  getCategoryLabel,
} from '@/lib/email-templates';

export default function TemplateLibraryModal({ open, onClose, onSelect }) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState(null);
  const [previewing, setPreviewing] = useState(null); // template courant en preview

  // Fermeture sur Escape
  useEffect(() => {
    if (!open) return;
    function onKey(e) {
      if (e.key === 'Escape') {
        if (previewing) setPreviewing(null);
        else onClose?.();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, previewing, onClose]);

  // Reset au close
  useEffect(() => {
    if (!open) {
      setSearch('');
      setActiveCategory(null);
      setPreviewing(null);
    }
  }, [open]);

  // Lock body scroll quand ouvert
  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = original; };
  }, [open]);

  const filtered = useMemo(
    () => filterTemplates({ category: activeCategory, search }),
    [activeCategory, search]
  );

  if (!open) return null;

  function handleSelect(template) {
    onSelect?.(template);
    onClose?.();
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-stretch sm:items-center sm:justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Bibliothèque de templates email"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full sm:max-w-5xl sm:max-h-[90vh] h-full sm:h-auto bg-surface-base sm:rounded-2xl border-0 sm:border border-line shadow-2xl flex flex-col overflow-hidden"
      >
        {previewing ? (
          <PreviewView
            template={previewing}
            onBack={() => setPreviewing(null)}
            onSelect={handleSelect}
            onClose={onClose}
          />
        ) : (
          <ListView
            search={search}
            setSearch={setSearch}
            activeCategory={activeCategory}
            setActiveCategory={setActiveCategory}
            filtered={filtered}
            onPreview={setPreviewing}
            onClose={onClose}
          />
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Vue liste (sticky header + grid)
// ─────────────────────────────────────────────────────────────────────
function ListView({ search, setSearch, activeCategory, setActiveCategory, filtered, onPreview, onClose }) {
  return (
    <>
      {/* Header sticky */}
      <div className="sticky top-0 z-10 border-b border-line bg-surface-base/95 backdrop-blur-xl">
        <div className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
              <FileText size={16} className="text-blue-500" />
            </div>
            <div>
              <h2 className="text-base font-bold text-content-primary">Bibliothèque de templates</h2>
              <p className="text-xs text-content-tertiary">
                {EMAIL_TEMPLATES.length} templates pré-faits par secteur — 1-clic pour gagner 15 min
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-content-tertiary hover:text-content-primary hover:bg-surface-elevated transition"
            aria-label="Fermer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Search + filtres */}
        <div className="px-5 pb-4 space-y-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-content-tertiary" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher : demo, follow-up, recrutement…"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-surface-card border border-line text-sm text-content-primary placeholder:text-content-tertiary focus:outline-none focus:border-blue-500 transition"
            />
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setActiveCategory(null)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition border ${
                !activeCategory
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'bg-surface-card text-content-tertiary border-line hover:border-blue-500/50'
              }`}
            >
              Tous ({EMAIL_TEMPLATES.length})
            </button>
            {TEMPLATE_CATEGORIES.map((cat) => {
              const count = EMAIL_TEMPLATES.filter((t) => t.category === cat.id).length;
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition border ${
                    isActive
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'bg-surface-card text-content-tertiary border-line hover:border-blue-500/50'
                  }`}
                >
                  {cat.label} ({count})
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto px-5 py-5">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-12 h-12 mx-auto rounded-xl bg-surface-card border border-line flex items-center justify-center mb-3">
              <Search size={18} className="text-content-tertiary" />
            </div>
            <p className="text-sm text-content-secondary">Aucun template ne correspond.</p>
            <button
              onClick={() => { setSearch(''); setActiveCategory(null); }}
              className="mt-3 text-xs text-blue-500 hover:underline"
            >
              Réinitialiser les filtres
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map((t) => (
              <TemplateCard key={t.id} template={t} onClick={() => onPreview(t)} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Card individuelle d'un template
// ─────────────────────────────────────────────────────────────────────
function TemplateCard({ template, onClick }) {
  return (
    <button
      onClick={onClick}
      className="group text-left p-4 rounded-xl bg-surface-card border border-line hover:border-blue-500/50 hover:bg-surface-elevated transition-all hover:shadow-md hover:shadow-blue-500/5 active:scale-[0.99]"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 border border-blue-500/20">
          {getCategoryLabel(template.category)}
        </span>
        {template.estimated_reply_rate && (
          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-semibold tabular-nums">
            <TrendingUp size={10} />
            {template.estimated_reply_rate}
          </span>
        )}
      </div>
      <h3 className="text-sm font-semibold text-content-primary mb-1 leading-snug group-hover:text-blue-600 transition">
        {template.label}
      </h3>
      <p className="text-[11px] text-content-tertiary leading-relaxed mb-2 line-clamp-2">
        {template.use_case}
      </p>
      <div className="pt-2 border-t border-line/60">
        <p className="text-[11px] text-content-secondary italic line-clamp-1">
          “{template.subject}”
        </p>
      </div>
      <div className="flex items-center gap-1 mt-2 flex-wrap">
        {template.tags.slice(0, 3).map((tag) => (
          <span
            key={tag}
            className="text-[9px] px-1.5 py-0.5 rounded bg-surface-base border border-line text-content-tertiary"
          >
            {tag}
          </span>
        ))}
      </div>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Vue preview d'un template (avant sélection finale)
// ─────────────────────────────────────────────────────────────────────
function PreviewView({ template, onBack, onSelect, onClose }) {
  // Aperçu : remplace variables par exemples
  const previewSubject = template.subject
    .replace(/\{\{\s*first_name\s*\}\}/g, 'Anthony')
    .replace(/\{\{\s*last_name\s*\}\}/g, 'Malartre')
    .replace(/\{\{\s*company\s*\}\}/g, 'Acme SAS')
    .replace(/\{\{\s*position_title\s*\}\}/g, 'CEO');
  const previewBody = template.body_html
    .replace(/\{\{\s*first_name\s*\}\}/g, 'Anthony')
    .replace(/\{\{\s*last_name\s*\}\}/g, 'Malartre')
    .replace(/\{\{\s*company\s*\}\}/g, 'Acme SAS')
    .replace(/\{\{\s*position_title\s*\}\}/g, 'CEO');

  return (
    <>
      {/* Header preview */}
      <div className="sticky top-0 z-10 border-b border-line bg-surface-base/95 backdrop-blur-xl px-5 py-4 flex items-center justify-between gap-3">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm text-content-tertiary hover:text-blue-500 transition"
        >
          <ArrowLeft size={14} />
          Retour à la liste
        </button>
        <button
          onClick={onClose}
          className="p-2 rounded-lg text-content-tertiary hover:text-content-primary hover:bg-surface-elevated transition"
          aria-label="Fermer"
        >
          <X size={18} />
        </button>
      </div>

      {/* Contenu */}
      <div className="flex-1 overflow-y-auto px-5 sm:px-8 py-6">
        <div className="max-w-3xl mx-auto">
          {/* Métadonnées */}
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 border border-blue-500/20">
                {getCategoryLabel(template.category)}
              </span>
              {template.estimated_reply_rate && (
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-semibold tabular-nums">
                  <TrendingUp size={11} />
                  Taux de réponse estimé : {template.estimated_reply_rate}
                </span>
              )}
            </div>
            <h3 className="text-xl font-bold text-content-primary mb-1">{template.label}</h3>
            <p className="text-sm text-content-secondary">{template.description}</p>
            <p className="text-xs text-content-tertiary mt-2 italic">
              Use case : {template.use_case}
            </p>
          </div>

          {/* Tags */}
          <div className="flex items-center gap-1 mb-5 flex-wrap">
            {template.tags.map((tag) => (
              <span
                key={tag}
                className="text-[10px] px-2 py-0.5 rounded bg-surface-card border border-line text-content-tertiary"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Preview email */}
          <div className="rounded-xl border border-line bg-surface-card overflow-hidden">
            <div className="px-4 py-3 border-b border-line bg-surface-elevated">
              <p className="text-[10px] uppercase tracking-wider text-content-tertiary font-semibold mb-1">
                Aperçu (variables remplacées par valeurs d&apos;exemple)
              </p>
              <p className="text-sm font-semibold text-content-primary">
                Objet : {previewSubject}
              </p>
            </div>
            <div
              className="px-5 py-5 text-sm text-content-secondary leading-relaxed [&_p]:my-2 [&_ul]:my-2 [&_ul]:pl-5 [&_ol]:my-2 [&_ol]:pl-5 [&_li]:my-1 [&_a]:text-blue-500 [&_a]:underline [&_strong]:text-content-primary"
              dangerouslySetInnerHTML={{ __html: previewBody }}
            />
          </div>

          {/* Variables détectées */}
          <div className="mt-4 p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
            <p className="text-[11px] text-blue-700 leading-relaxed flex items-start gap-2">
              <Sparkles size={11} className="mt-0.5 flex-shrink-0" />
              <span>
                Les variables <code className="bg-blue-500/10 px-1 rounded">{`{{first_name}}`}</code>,{' '}
                <code className="bg-blue-500/10 px-1 rounded">{`{{company}}`}</code>, etc. seront
                remplacées automatiquement par les valeurs de chaque contact à l&apos;envoi.
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="border-t border-line bg-surface-base px-5 py-4 flex items-center justify-end gap-2 sticky bottom-0">
        <button
          onClick={onBack}
          className="px-4 py-2 rounded-lg text-sm text-content-secondary hover:text-content-primary transition"
        >
          Annuler
        </button>
        <button
          onClick={() => onSelect(template)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition shadow-lg shadow-blue-500/20"
        >
          <Check size={14} />
          Utiliser ce template
        </button>
      </div>
    </>
  );
}
