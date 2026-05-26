'use client';

// ─────────────────────────────────────────────────────────────────────
// /admin/forms/[id] — Placeholder builder (Sprint F3)
// ─────────────────────────────────────────────────────────────────────
// Affiche les métadonnées du form + un message "Builder à venir Sprint F3".
// Le vrai builder (drag-drop multi-page + logique conditionnelle) sera
// implémenté au sprint F3. F1 ne fournit que le squelette CRUD.
// ─────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, FileText, Sparkles, Loader2 } from 'lucide-react';

export default function FormBuilderPlaceholderPage() {
  const { id } = useParams();
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/admin/forms/${id}`);
        const json = await res.json();
        if (cancelled) return;
        if (!res.ok) setError(json.error || 'Erreur');
        else setForm(json.data);
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <Link
        href="/admin/forms"
        className="inline-flex items-center gap-1.5 text-xs text-content-tertiary hover:text-pink-700 transition-colors mb-6"
      >
        <ArrowLeft size={14} /> Retour à mes formulaires
      </Link>

      {loading && (
        <div className="flex items-center gap-2 text-content-tertiary text-sm">
          <Loader2 size={16} className="animate-spin" /> Chargement…
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-700">
          {error}
        </div>
      )}

      {form && (
        <>
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-1.5">
              <FileText size={14} className="text-pink-600" />
              <p className="text-[11px] uppercase tracking-wider font-semibold text-content-muted">
                Formulaire · {form.status}
              </p>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-content-primary tracking-tight">
              {form.name}
            </h1>
            {form.description && (
              <p className="mt-1.5 text-sm text-content-tertiary">{form.description}</p>
            )}
            <p className="mt-2 text-[11px] text-content-faint">
              Slug : <code className="px-1.5 py-0.5 rounded bg-surface-card">/f/{form.slug}</code>
            </p>
          </div>

          {/* Placeholder builder */}
          <div className="rounded-2xl border border-dashed border-pink-200 bg-gradient-to-br from-pink-500/[0.04] to-rose-500/[0.04] p-10 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-pink-100 text-pink-600 mb-4">
              <Sparkles size={22} />
            </div>
            <h3 className="text-lg font-semibold text-content-primary">
              Builder à venir Sprint F3
            </h3>
            <p className="mt-1 text-sm text-content-tertiary max-w-md mx-auto">
              Le constructeur drag-drop multi-pages avec logique conditionnelle
              sera disponible au prochain sprint. En attendant, vous pouvez
              éditer les métadonnées via l\'API.
            </p>
            <div className="mt-6 grid grid-cols-3 gap-4 max-w-md mx-auto text-center">
              <div>
                <p className="text-xl font-bold text-content-primary">{form.stats?.total_views || 0}</p>
                <p className="text-[10px] uppercase tracking-wider text-content-muted">Vues</p>
              </div>
              <div>
                <p className="text-xl font-bold text-content-primary">{form.stats?.total_submissions || 0}</p>
                <p className="text-[10px] uppercase tracking-wider text-content-muted">Réponses</p>
              </div>
              <div>
                <p className="text-xl font-bold text-content-primary">{form.stats?.conversion_rate || 0}%</p>
                <p className="text-[10px] uppercase tracking-wider text-content-muted">Conversion</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
