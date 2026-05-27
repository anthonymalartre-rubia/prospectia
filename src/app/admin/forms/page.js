'use client';

// ─────────────────────────────────────────────────────────────────────
// /admin/forms — Hub Volia Formulaires
// ─────────────────────────────────────────────────────────────────────
// Sprint F1 : placeholder hub avec liste des forms + bouton de création.
// Le builder complet (drag-drop, multi-page, logique conditionnelle)
// viendra Sprint F3.
//
// Flow création : clic sur "+ Nouveau formulaire" → POST /api/admin/forms
// avec un nom par défaut → redirect vers /admin/forms/[id] (page builder
// placeholder pour l'instant).
// ─────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  FileText,
  Plus,
  Eye,
  Send,
  Sparkles,
  ExternalLink,
  Archive,
  Loader2,
  Pencil,
  Layers,
} from 'lucide-react';

const STATUS_BADGES = {
  draft: { label: 'Brouillon', cls: 'bg-zinc-100 text-zinc-700 border-zinc-200' },
  published: { label: 'Publié', cls: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  archived: { label: 'Archivé', cls: 'bg-amber-100 text-amber-700 border-amber-200' },
};

export default function FormsHubPage() {
  const router = useRouter();
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/admin/forms');
        const json = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setError(json.error || 'Erreur de chargement');
        } else {
          setForms(json.data || []);
        }
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleCreate() {
    setCreating(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/forms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Nouveau formulaire' }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || 'Impossible de créer le formulaire');
        setCreating(false);
        return;
      }
      router.push(`/admin/forms/${json.data.id}`);
    } catch (e) {
      setError(e.message);
      setCreating(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* Hero */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles size={14} className="text-pink-600" />
          <p className="text-[11px] uppercase tracking-wider font-semibold text-pink-700">
            Nouveau · Sprint F3
          </p>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-content-primary tracking-tight">
          Formulaires
        </h1>
        <p className="mt-2 text-content-tertiary text-sm sm:text-base max-w-2xl">
          Attrape des leads par l&apos;autre bout. Ils atterrissent direct dans
          ton CRM et tes Campagnes — zéro copier-coller, zéro Zapier.
        </p>
      </div>

      {/* Action bar */}
      <div className="mb-6 flex items-center justify-between gap-3">
        <p className="text-sm text-content-tertiary">
          {loading
            ? 'Chargement…'
            : forms.length === 0
            ? 'Aucun form. C\'est le moment d\'en faire un.'
            : `${forms.length} formulaire${forms.length > 1 ? 's' : ''}`}
        </p>
        <button
          onClick={handleCreate}
          disabled={creating}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-sm font-medium shadow-lg shadow-pink-500/20 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {creating ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Plus size={16} />
          )}
          Nouveau formulaire
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-4 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-700">
          {error}
        </div>
      )}

      {/* Empty state — F7 enrichi (illustration SVG + 2 CTAs) */}
      {!loading && forms.length === 0 && !error && (
        <div className="rounded-3xl border border-dashed border-pink-200 bg-gradient-to-br from-pink-50/50 via-surface-card/30 to-rose-50/40 p-10 sm:p-12 text-center overflow-hidden relative">
          {/* Decorative blobs */}
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-pink-200/30 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-rose-200/30 rounded-full blur-3xl pointer-events-none" />

          {/* Illustration SVG : un formulaire stylisé + "souris piège" */}
          <div className="relative inline-block mb-5">
            <svg
              width="120"
              height="100"
              viewBox="0 0 120 100"
              fill="none"
              className="drop-shadow-md"
              aria-hidden="true"
            >
              {/* Form card */}
              <rect x="10" y="14" width="86" height="76" rx="10" fill="white" stroke="#fbcfe8" strokeWidth="1.5" />
              <rect x="20" y="24" width="50" height="6" rx="3" fill="#fbcfe8" />
              <rect x="20" y="36" width="66" height="9" rx="3" fill="#fce7f3" />
              <rect x="20" y="50" width="66" height="9" rx="3" fill="#fce7f3" />
              <rect x="20" y="64" width="66" height="9" rx="3" fill="#fce7f3" />
              <rect x="20" y="78" width="34" height="9" rx="4" fill="#db2777" />
              {/* "Send" arrow (the trap) */}
              <circle cx="98" cy="86" r="13" fill="#db2777" />
              <path d="M93 86 L100 86 M98 82 L102 86 L98 90" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          <h3 className="relative text-xl font-bold text-content-primary mb-2">
            Aucun form. C&apos;est le moment d&apos;attraper des leads.
          </h3>
          <p className="relative text-sm text-content-tertiary max-w-md mx-auto leading-relaxed">
            Tes prochains leads se collent direct dans le CRM et les Campagnes.
            Pas d&apos;export CSV, pas de Zapier. Juste un lien à coller.
          </p>
          <div className="relative mt-6 flex flex-col sm:flex-row items-center justify-center gap-2">
            <Link
              href="/admin/forms/templates"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-sm font-medium shadow-lg shadow-pink-500/20 active:scale-95 transition-all"
            >
              <Sparkles size={14} /> Partir d&apos;un template
            </Link>
            <button
              onClick={handleCreate}
              disabled={creating}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-line hover:border-pink-300 hover:bg-pink-50 text-content-primary text-sm font-medium transition-all disabled:opacity-50"
            >
              {creating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              Form vide
            </button>
          </div>
        </div>
      )}

      {/* Forms list */}
      {!loading && forms.length > 0 && (
        <div className="space-y-2">
          {forms.map((form) => {
            const badge = STATUS_BADGES[form.status] || STATUS_BADGES.draft;
            return (
              <div
                key={form.id}
                className="p-4 rounded-xl border border-line bg-surface-card hover:bg-surface-elevated hover:border-pink-200 transition-all group"
              >
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <Link href={`/admin/forms/${form.id}`} className="block">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-semibold text-content-primary group-hover:text-pink-700 transition-colors">
                          {form.name}
                        </h3>
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${badge.cls}`}
                        >
                          {badge.label}
                        </span>
                        {form.status === 'archived' && (
                          <Archive size={12} className="text-amber-600" />
                        )}
                      </div>
                      {form.description && (
                        <p className="mt-1 text-xs text-content-tertiary line-clamp-1">
                          {form.description}
                        </p>
                      )}
                      <div className="mt-2 flex items-center gap-4 text-[11px] text-content-faint flex-wrap">
                        <span className="inline-flex items-center gap-1">
                          <FileText size={11} /> {form.fields_count || 0} champ{(form.fields_count || 0) > 1 ? 's' : ''}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Layers size={11} /> {form.pages_count || 1} page{(form.pages_count || 1) > 1 ? 's' : ''}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Eye size={11} /> {form.view_count} vues
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Send size={11} /> {form.submission_count} réponses
                        </span>
                      </div>
                    </Link>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Link
                      href={`/admin/forms/${form.id}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium bg-surface-base border border-line hover:bg-surface-elevated hover:border-pink-200 transition-colors"
                    >
                      <Pencil size={11} /> Modifier
                    </Link>
                    {form.status === 'published' && (
                      <Link
                        href={`/f/${form.slug}`}
                        target="_blank"
                        rel="noopener"
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium bg-pink-100 text-pink-700 hover:bg-pink-200 transition-colors"
                      >
                        <ExternalLink size={11} /> Voir
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
