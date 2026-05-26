'use client';

// ─────────────────────────────────────────────────────────────────────
// /admin/prospection/templates — index des templates email
// ─────────────────────────────────────────────────────────────────────
// Bibliothèque consultable de tous les templates pré-faits.
// Chaque card → "Créer une campagne avec ce template" → /campaigns/new?template=X
// ─────────────────────────────────────────────────────────────────────

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FileText, Search, ArrowRight, Sparkles, TrendingUp, Loader2, LogIn,
} from 'lucide-react';
import { getSupabase } from '@/lib/supabase';
import { CAMPAGNES_ALLOWED_PLANS } from '@/lib/campagnes-access';
import {
  EMAIL_TEMPLATES,
  TEMPLATE_CATEGORIES,
  filterTemplates,
  getCategoryLabel,
} from '@/lib/email-templates';

export default function TemplatesPage() {
  const router = useRouter();
  const supabase = getSupabase();
  const [authState, setAuthState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState(null);

  useEffect(() => {
    (async () => {
      if (!supabase) { setLoading(false); return; }
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setAuthState('guest'); setLoading(false); return; }
      const { data: profile } = await supabase
        .from('user_profiles').select('plan').eq('id', user.id).maybeSingle();
      const allowed = profile?.plan && CAMPAGNES_ALLOWED_PLANS.includes(profile.plan.toLowerCase());
      if (!allowed) { router.push('/dashboard?upgrade=campagnes'); return; }
      setAuthState('ok');
      setLoading(false);
    })();
  }, [supabase, router]);

  const filtered = useMemo(
    () => filterTemplates({ category: activeCategory, search }),
    [activeCategory, search]
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-base flex items-center justify-center text-content-secondary">
        <Loader2 className="animate-spin" size={20} />
      </div>
    );
  }

  if (authState === 'guest') {
    return (
      <div className="min-h-screen bg-surface-base flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-2xl border border-line bg-surface-card p-8 text-center">
          <div className="w-12 h-12 mx-auto rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center mb-4">
            <LogIn size={20} className="text-blue-400" />
          </div>
          <h1 className="text-xl font-bold mb-2">Connexion requise</h1>
          <Link
            href="/login?return=/admin/prospection/templates"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition"
          >
            <LogIn size={14} />
            Se connecter
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-base text-content-primary p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2 mb-2">
            <FileText size={24} className="text-blue-500" />
            Bibliothèque de templates
          </h1>
          <p className="text-sm text-content-secondary">
            {EMAIL_TEMPLATES.length} templates email pré-faits, testés sur le marché B2B français.
            Cliquez sur un template pour créer une campagne en 1-clic.
          </p>
        </div>

        {/* Search + filtres */}
        <div className="mb-6 space-y-3">
          <div className="relative max-w-xl">
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
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition border ${
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
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition border ${
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

        {/* Grid */}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((t) => (
              <TemplateCardLarge key={t.id} template={t} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TemplateCardLarge({ template }) {
  const previewSubject = template.subject
    .replace(/\{\{\s*first_name\s*\}\}/g, 'Anthony')
    .replace(/\{\{\s*company\s*\}\}/g, 'Acme SAS');

  return (
    <div className="group flex flex-col p-5 rounded-2xl bg-surface-card border border-line hover:border-blue-500/50 hover:bg-surface-elevated transition-all hover:shadow-lg hover:shadow-blue-500/5">
      <div className="flex items-start justify-between gap-2 mb-3">
        <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 border border-blue-500/20">
          {getCategoryLabel(template.category)}
        </span>
        {template.estimated_reply_rate && (
          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-semibold tabular-nums">
            <TrendingUp size={10} />
            {template.estimated_reply_rate}
          </span>
        )}
      </div>

      <h3 className="text-sm font-bold text-content-primary mb-1.5 leading-snug group-hover:text-blue-600 transition">
        {template.label}
      </h3>
      <p className="text-[11px] text-content-tertiary leading-relaxed mb-3 line-clamp-2">
        {template.description}
      </p>

      <div className="pt-3 mb-3 border-t border-line/60 flex-1">
        <p className="text-[10px] uppercase tracking-wider text-content-tertiary font-semibold mb-1">
          Objet d&apos;exemple
        </p>
        <p className="text-[12px] text-content-secondary italic leading-relaxed line-clamp-2">
          “{previewSubject}”
        </p>
      </div>

      <div className="flex items-center gap-1 mb-3 flex-wrap">
        {template.tags.slice(0, 4).map((tag) => (
          <span
            key={tag}
            className="text-[9px] px-1.5 py-0.5 rounded bg-surface-base border border-line text-content-tertiary"
          >
            {tag}
          </span>
        ))}
      </div>

      <Link
        href={`/admin/prospection/campaigns/new?template=${template.id}`}
        className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-blue-500/10 hover:bg-blue-500 text-blue-600 hover:text-white text-xs font-semibold transition border border-blue-500/30 hover:border-blue-500"
      >
        <Sparkles size={11} />
        Créer une campagne
        <ArrowRight size={11} />
      </Link>
    </div>
  );
}
