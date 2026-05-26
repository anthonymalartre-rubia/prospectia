'use client';

// ─────────────────────────────────────────────────────────────────────
// /admin/forms/[id] — Builder UI (Sprint F3)
// ─────────────────────────────────────────────────────────────────────
// Fetch initial du form puis monte BuilderLayout en dynamic import
// ssr:false (dnd-kit utilise window pour les sensors).
// ─────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

const BuilderLayout = dynamic(() => import('@/components/forms/builder/BuilderLayout'), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 top-14 flex items-center justify-center text-content-tertiary text-sm">
      <Loader2 size={18} className="animate-spin mr-2" /> Chargement du builder…
    </div>
  ),
});

export default function FormBuilderPage() {
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

  if (loading) {
    return (
      <div className="fixed inset-0 top-14 flex items-center justify-center text-content-tertiary text-sm">
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

  if (!form) {
    return null;
  }

  return <BuilderLayout formId={id} initialForm={form} />;
}
