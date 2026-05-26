'use client';

// ─────────────────────────────────────────────────────────────────────
// /admin/forms/[id]/preview — Mode aperçu (Sprint F3)
// ─────────────────────────────────────────────────────────────────────
// Render le form via FormRenderer (le même composant que /f/[slug])
// mais en mode aperçu : pas de submit réel, toast d'info à la place.
// ─────────────────────────────────────────────────────────────────────

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Eye, ArrowLeft, Info } from 'lucide-react';
import FormRenderer from '@/components/forms/FormRenderer';
import { normalizeSchema, schemaFieldsToRendererFields } from '@/lib/forms';

export default function FormPreviewPage() {
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
        if (!res.ok) {
          setError(json.error || 'Erreur');
        } else {
          // Adapte au format attendu par FormRenderer
          const schema = normalizeSchema(json.data.schema);
          setForm({
            ...json.data,
            schema,
            fields: schemaFieldsToRendererFields(schema),
          });
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
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-zinc-500 text-sm">
        <Loader2 size={18} className="animate-spin mr-2" /> Chargement…
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto mt-20 p-4 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-700">
        {error}
      </div>
    );
  }

  if (!form) return null;

  // Wrappe le FormRenderer avec un intercepteur sur le submit pour
  // afficher un toast "mode aperçu" plutôt que d'envoyer la requête.
  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-zinc-50 to-white text-zinc-900">
      {/* Banner mode aperçu */}
      <div className="sticky top-0 z-30 bg-amber-500 text-amber-950">
        <div className="max-w-5xl mx-auto px-4 py-2 flex items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 text-xs font-semibold">
            <Eye size={13} />
            <span>Mode aperçu — les soumissions ne sont pas enregistrées</span>
          </div>
          <Link
            href={`/admin/forms/${id}`}
            className="inline-flex items-center gap-1 text-[11px] font-medium hover:underline"
          >
            <ArrowLeft size={11} /> Retour au builder
          </Link>
        </div>
      </div>

      <header className="w-full px-4 sm:px-6 py-5 flex items-center justify-center">
        <span className="text-xs font-semibold tracking-wider text-zinc-400">volia</span>
      </header>

      <main className="w-full px-4 sm:px-6 pb-12">
        <div className="max-w-2xl mx-auto">
          <PreviewFormWrapper form={form} />
        </div>
      </main>

      <footer className="w-full px-4 py-6 text-center">
        <span className="inline-flex items-center gap-1.5 text-[11px] text-zinc-400">
          <span>Propulsé par</span>
          <span className="font-bold tracking-wider">Volia</span>
        </span>
      </footer>
    </div>
  );
}

function PreviewFormWrapper({ form }) {
  // Stratégie simple : on monte le FormRenderer mais on intercepte le fetch
  // via override de window.fetch sur le lifecycle du composant.
  useEffect(() => {
    const originalFetch = window.fetch;
    window.fetch = (...args) => {
      const url = String(args[0] || '');
      if (url.includes('/api/public/forms/') && url.includes('/submit')) {
        // Bloque la requête réelle, retourne un faux succès
        alert('Mode aperçu — soumission désactivée.\n\nDans un vrai contexte, le formulaire serait envoyé et les bridges CRM/Campagnes déclenchés.');
        return Promise.resolve(
          new Response(JSON.stringify({ success: true, preview: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        );
      }
      return originalFetch(...args);
    };
    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  return <FormRenderer form={form} slug={form.slug} />;
}
