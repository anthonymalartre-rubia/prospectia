// ─────────────────────────────────────────────────────────────────────
// /f/[slug] — Renderer public Volia Formulaires
// ─────────────────────────────────────────────────────────────────────
// Server component minimal :
//   1. RPC get_published_form(slug) → 1 query (schema JSONB inclus).
//   2. SOURCE OF TRUTH = form.schema (Sprint F3) — on n'interroge plus
//      form_fields. Le builder écrit dans schema, le renderer lit schema.
//   3. View count incrémenté fire-and-forget.
//   4. Si ?embed=true → mode embed (ultra-minimal, transparent).
//
// SEO : noindex (les forms persos ne doivent pas être indexés).
// ─────────────────────────────────────────────────────────────────────

import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import Link from 'next/link';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { schemaFieldsToRendererFields, normalizeSchema } from '@/lib/forms';
import FormRenderer from '@/components/forms/FormRenderer';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function loadForm(slug) {
  const supabase = getSupabaseAdmin();

  // RPC SECURITY DEFINER → bypass RLS, ne retourne que status='published'
  const { data: rows, error } = await supabase.rpc('get_published_form', {
    p_slug: slug,
  });

  if (error) {
    console.error('[/f/[slug]] get_published_form error', error);
    return null;
  }

  const form = Array.isArray(rows) ? rows[0] : rows;
  if (!form) return null;

  // Sprint F3 : on lit schema JSONB et on aplatit pour le FormRenderer
  // (qui attend toujours la shape DB historique avec field_key, field_type,
  // page numérique). Évite de réécrire le renderer entier.
  const schema = normalizeSchema(form.schema);
  const fields = schemaFieldsToRendererFields(schema);

  return { ...form, schema, fields };
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const form = await loadForm(slug);
  if (!form) {
    return {
      title: 'Formulaire introuvable',
      robots: { index: false, follow: false },
    };
  }
  return {
    title: form.name,
    description: form.description || undefined,
    robots: { index: false, follow: false },
    openGraph: {
      title: form.name,
      description: form.description || 'Formulaire propulsé par Volia',
      type: 'website',
    },
  };
}

export default async function FormRendererPage({ params, searchParams }) {
  const { slug } = await params;
  const sp = (await searchParams) || {};
  const isEmbed = sp.embed === 'true' || sp.embed === '1';

  const form = await loadForm(slug);
  if (!form) {
    notFound();
  }

  // Fire-and-forget view_count increment
  (async () => {
    try {
      const supabase = getSupabaseAdmin();
      await supabase.rpc('increment_form_view_count', { p_form_id: form.id });
    } catch (err) {
      console.warn('[/f/[slug]] view_count increment failed', err);
    }
  })();

  try {
    await headers();
  } catch {}

  if (isEmbed) {
    return (
      <div className="min-h-screen w-full bg-transparent">
        <FormRenderer form={form} slug={slug} isEmbed />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-zinc-50 to-white text-zinc-900">
      <header className="w-full px-4 sm:px-6 py-5 flex items-center justify-center">
        <Link
          href="https://volia.fr?utm_source=form_header&utm_medium=referral"
          target="_blank"
          rel="noopener"
          className="text-xs font-semibold tracking-wider text-zinc-400 hover:text-pink-600 transition-colors"
        >
          volia
        </Link>
      </header>

      <main className="w-full px-4 sm:px-6 pb-12">
        <div className="max-w-2xl mx-auto">
          <FormRenderer form={form} slug={slug} />
        </div>
      </main>

      <footer className="w-full px-4 py-6 text-center">
        <Link
          href="https://volia.fr?utm_source=form_powered_by&utm_medium=referral"
          target="_blank"
          rel="noopener"
          className="inline-flex items-center gap-1.5 text-[11px] text-zinc-400 hover:text-pink-600 transition-colors"
        >
          <span>Propulsé par</span>
          <span className="font-bold tracking-wider">Volia</span>
        </Link>
      </footer>
    </div>
  );
}
