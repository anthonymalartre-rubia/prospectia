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
          Volia Formulaires
        </h1>
        <p className="mt-2 text-content-tertiary text-sm sm:text-base max-w-2xl">
          Créez des formulaires multi-étapes connectés nativement à votre
          CRM et vos Campagnes. Aucun copier-coller, aucune intégration Zapier.
        </p>
      </div>

      {/* Action bar */}
      <div className="mb-6 flex items-center justify-between gap-3">
        <p className="text-sm text-content-tertiary">
          {loading
            ? 'Chargement…'
            : forms.length === 0
            ? 'Aucun formulaire pour l\'instant.'
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

      {/* Empty state */}
      {!loading && forms.length === 0 && !error && (
        <div className="rounded-2xl border border-dashed border-line bg-surface-card/50 p-10 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-pink-100 text-pink-600 mb-4">
            <FileText size={22} />
          </div>
          <h3 className="text-lg font-semibold text-content-primary">
            Créez votre premier formulaire
          </h3>
          <p className="mt-1 text-sm text-content-tertiary max-w-md mx-auto">
            Démarrez avec un formulaire vide ou (bientôt) un template métier.
            Vous pourrez le partager via un lien public ou l\'embed sur votre site.
          </p>
          <button
            onClick={handleCreate}
            disabled={creating}
            className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-sm font-medium shadow-lg shadow-pink-500/20 active:scale-95 transition-all disabled:opacity-50"
          >
            {creating ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
            Commencer
          </button>
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
