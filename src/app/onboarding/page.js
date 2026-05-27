'use client';

// ─────────────────────────────────────────────────────────────────────────
// /onboarding — Wizard 3 étapes new user (post-signup)
// ─────────────────────────────────────────────────────────────────────────
//
// Pourquoi : après signup (email+password only), l'user atterrit sur
// /dashboard sans contexte → bounce rate énorme. Ce wizard intercepte avec
// 30 secondes de setup pour :
//   1. Pré-remplir le profil (company / rôle / taille équipe)
//   2. Choisir la catégorie cible (B2B_GROUPS)
//   3. Choisir la région cible (REGIONS + DEPTS)
// Puis redirect /dashboard?view=search&category=X&dept=Y qui auto-lance
// la 1ère recherche Prospection.
//
// Skip-friendly : bouton "Passer" en haut à droite, jamais bloquant. Si
// l'user skip, on ne sauvegarde rien et il atterrit sur /dashboard normal
// (mais l'onboarding_completed_at reste NULL → la barre OnboardingChecklist
// reste visible pour reprendre plus tard via le widget existant).
//
// Auth : page client-side, on fait un check session via getSupabase() au
// mount. Si pas de session → redirect /login. Si onboarding déjà complété
// → redirect /dashboard directement.

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabase } from '@/lib/supabase';
import { B2B_GROUPS, REGIONS, DEPTS } from '@/lib/constants';
import { Button, Input, LogoIcon } from '@/components/ui';
import {
  ArrowRight, ArrowLeft, Loader2, Building2, Users, Target,
  MapPin, Sparkles, Rocket,
} from 'lucide-react';

// Liste plate des catégories B2B avec leur groupe pour l'optgroup du select
const B2B_OPTIONS = Object.entries(B2B_GROUPS).map(([group, cats]) => ({
  group,
  cats,
}));

// Liste des régions FR triées + leur 1er dept comme valeur par défaut.
// Pour le select région, on stocke la valeur sous forme `region:idf` ou
// `dept:75`. Si l'user choisit une région, on prend son chef-lieu (1er dept)
// comme cible — c'est l'approche la plus simple pour lancer une 1ère
// recherche dimensionnée (sinon 8 départements Île-de-France = trop large
// pour une démo "30 secondes").
const REGION_OPTIONS = Object.entries(REGIONS).map(([key, r]) => ({
  key,
  name: r.name,
  firstDept: r.depts[0],
  deptCount: r.depts.length,
}));

const ROLES = [
  { value: 'founder', label: 'Fondateur / CEO' },
  { value: 'sales', label: 'Sales / Business Development' },
  { value: 'marketing', label: 'Marketing / Growth' },
  { value: 'freelance', label: 'Freelance / Consultant' },
  { value: 'other', label: 'Autre' },
];

const TEAM_SIZES = [
  { value: '1', label: 'Je suis seul·e' },
  { value: '2-10', label: '2 à 10' },
  { value: '11-50', label: '11 à 50' },
  { value: '51+', label: '51+' },
];

// Tracking utility — analytics-agnostic. Pour l'instant juste console + tag
// Vercel via window.va si dispo (Vercel Analytics est mounted dans layout).
function track(event, props = {}) {
  try {
    if (typeof window !== 'undefined') {
      if (typeof window.va === 'function') {
        window.va('event', { name: event, ...props });
      }
      // Console pour debug local
      // eslint-disable-next-line no-console
      console.log('[onboarding]', event, props);
    }
  } catch {
    // never break the flow on analytics
  }
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1, 2, 3
  const [authChecked, setAuthChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [companyName, setCompanyName] = useState('');
  const [role, setRole] = useState('founder');
  const [teamSize, setTeamSize] = useState('1');
  const [targetCategory, setTargetCategory] = useState('restaurant'); // sensible default
  const [regionOrDept, setRegionOrDept] = useState('dept:75'); // Paris par défaut

  // ─── Mount : check session + onboarding déjà fait ─────────────────
  useEffect(() => {
    let mounted = true;
    (async () => {
      const supabase = getSupabase();
      if (!supabase) {
        // pas de client = problème de config, on laisse l'user voir le
        // wizard quand même (il pourra skip).
        if (mounted) setAuthChecked(true);
        return;
      }
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/login');
        return;
      }
      // Check si onboarding déjà fait → skip direct au dashboard
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('onboarding_completed_at, company_name')
        .eq('id', user.id)
        .maybeSingle();
      if (profile?.onboarding_completed_at) {
        router.replace('/dashboard');
        return;
      }
      // Pré-remplit le nom de société si déjà connu (cas où l'user revient)
      if (mounted) {
        if (profile?.company_name) setCompanyName(profile.company_name);
        setAuthChecked(true);
        track('onboarding_started');
      }
    })();
    return () => { mounted = false; };
  }, [router]);

  // ─── Helpers ──────────────────────────────────────────────────────
  const targetDept = useMemo(() => {
    if (!regionOrDept) return '75';
    const [type, value] = regionOrDept.split(':');
    if (type === 'dept') return value;
    if (type === 'region') {
      const r = REGIONS[value];
      return r?.depts?.[0] || '75';
    }
    return '75';
  }, [regionOrDept]);

  const canGoNextStep1 = companyName.trim().length > 0 && role && teamSize;
  const canGoNextStep2 = !!targetCategory;
  const canSubmit = !!targetDept;

  // ─── Submit final ─────────────────────────────────────────────────
  async function handleSubmit() {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setError('');

    try {
      // 1) Save profile + mark onboarding completed
      const res = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_name: companyName.trim(),
          role,
          team_size: teamSize,
          target_category: targetCategory,
          target_dept: targetDept,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || 'Erreur lors de la sauvegarde');
      }

      // 2) Track first_search step (fire-and-forget — non bloquant)
      // L'user n'a pas encore *lancé* la recherche, mais l'INTENTION est
      // claire (il a explicitement cliqué "Lancer ma première recherche").
      // On marque la step pour que la checklist soit déjà cochée à
      // l'arrivée sur le dashboard. La vraie recherche sera lancée par
      // le dashboard via les query params.
      fetch('/api/onboarding/complete-step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: 'first_search' }),
      }).catch(() => {});

      track('onboarding_completed', {
        role,
        team_size: teamSize,
        target_category: targetCategory,
        target_dept: targetDept,
      });
      track('first_search_intent', {
        category: targetCategory,
        dept: targetDept,
      });

      // 3) Redirect dashboard avec pré-fill — query string consommée par
      //    dashboard/page.js pour auto-lancer le scraping.
      const params = new URLSearchParams({
        view: 'search',
        category: targetCategory,
        dept: targetDept,
        autostart: '1',
      });
      router.replace(`/dashboard?${params.toString()}`);
    } catch (err) {
      setError(err?.message || 'Erreur inattendue');
      setSubmitting(false);
    }
  }

  function handleSkip() {
    track('onboarding_skipped', { step });
    // Pas de save, pas d'onboarding_completed_at → l'user pourra
    // reprendre via la barre OnboardingChecklist en haut du dashboard.
    router.replace('/dashboard');
  }

  // ─── Loading state ─────────────────────────────────────────────
  if (!authChecked) {
    return (
      <main className="min-h-screen bg-surface-base flex items-center justify-center px-4">
        <Loader2 className="w-6 h-6 text-violet-500 animate-spin" />
      </main>
    );
  }

  const pct = Math.round((step / 3) * 100);

  return (
    <main className="min-h-screen bg-surface-base text-content-primary">
      {/* ─── Header : logo + skip ───────────────────────────────── */}
      <header className="absolute top-0 inset-x-0 z-10 px-4 sm:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <LogoIcon size="sm" />
          <span className="text-sm font-semibold tracking-tight">
            Volia<span className="text-violet-400">.fr</span>
          </span>
        </div>
        <button
          type="button"
          onClick={handleSkip}
          className="text-xs text-content-tertiary hover:text-content-secondary transition px-2 py-1 rounded-md"
        >
          Passer
        </button>
      </header>

      {/* ─── Wizard container ──────────────────────────────────── */}
      <div className="min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 py-20">
        <div className="w-full max-w-xl">
          {/* Progress bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2 text-[11px] font-medium text-content-tertiary">
              <span>Étape {step} sur 3</span>
              <span className="tabular-nums">{pct}%</span>
            </div>
            <div className="h-1.5 bg-surface-elevated rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-500 ease-out"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          {/* Title hero — visible only on step 1 pour pas trop charger
              ensuite. Donne le contexte "30 secondes" pour rassurer. */}
          {step === 1 && (
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 mb-4">
                <Sparkles size={12} className="text-violet-400" />
                <span className="text-[11px] font-semibold text-violet-300">
                  Bienvenue chez Volia
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-content-primary">
                30 secondes. Promis.
              </h1>
              <p className="mt-2 text-sm text-content-tertiary">
                On configure ton espace et on lance ta première recherche.
              </p>
            </div>
          )}

          {/* ─── STEP 1 — Profile ────────────────────────────── */}
          {step === 1 && (
            <div
              key="step-1"
              className="bg-surface-card border border-line rounded-2xl p-6 sm:p-8 shadow-xl shadow-black/5 animate-in fade-in slide-in-from-right-4 duration-300"
            >
              <div className="flex items-center gap-2 mb-1">
                <Building2 size={16} className="text-violet-400" />
                <h2 className="text-lg font-semibold text-content-primary">Qui es-tu ?</h2>
              </div>
              <p className="text-xs text-content-tertiary mb-6">
                On utilise ces infos pour personnaliser tes templates et tes exports.
              </p>

              <div className="space-y-5">
                {/* Company */}
                <div>
                  <label htmlFor="company" className="block text-sm font-medium text-content-secondary mb-1.5">
                    Nom de ton entreprise
                  </label>
                  <Input
                    id="company"
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Ex : Volia, Acme SAS…"
                    leadingIcon={Building2}
                    autoFocus
                    required
                    maxLength={200}
                  />
                </div>

                {/* Role */}
                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-content-secondary mb-1.5">
                    Ton rôle
                  </label>
                  <select
                    id="role"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm rounded-xl bg-surface-base border border-line text-content-primary focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/50 transition min-h-[44px]"
                  >
                    {ROLES.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>

                {/* Team size — pills tactiles */}
                <div>
                  <label className="block text-sm font-medium text-content-secondary mb-1.5">
                    Taille de l&apos;équipe
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {TEAM_SIZES.map((t) => {
                      const active = teamSize === t.value;
                      return (
                        <button
                          key={t.value}
                          type="button"
                          onClick={() => setTeamSize(t.value)}
                          className={`min-h-[44px] px-3 py-2.5 text-xs sm:text-sm rounded-xl border transition-all ${
                            active
                              ? 'bg-violet-500/15 border-violet-500/50 text-violet-200 font-semibold'
                              : 'bg-surface-base border-line text-content-secondary hover:border-violet-500/30 hover:bg-violet-500/[0.04]'
                          }`}
                        >
                          <Users size={12} className="inline-block mr-1.5 -mt-0.5" />
                          {t.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="mt-8 flex items-center justify-end">
                <Button
                  type="button"
                  variant="primary"
                  size="lg"
                  iconRight={ArrowRight}
                  onClick={() => {
                    if (!canGoNextStep1) return;
                    setStep(2);
                  }}
                  disabled={!canGoNextStep1}
                >
                  Suivant
                </Button>
              </div>
            </div>
          )}

          {/* ─── STEP 2 — Target category ────────────────────── */}
          {step === 2 && (
            <div
              key="step-2"
              className="bg-surface-card border border-line rounded-2xl p-6 sm:p-8 shadow-xl shadow-black/5 animate-in fade-in slide-in-from-right-4 duration-300"
            >
              <div className="flex items-center gap-2 mb-1">
                <Target size={16} className="text-violet-400" />
                <h2 className="text-lg font-semibold text-content-primary">Tu cherches quoi ?</h2>
              </div>
              <p className="text-xs text-content-tertiary mb-6">
                Choisis ta cible principale. Tu pourras chercher d&apos;autres catégories après.
              </p>

              <div>
                <label htmlFor="category" className="block text-sm font-medium text-content-secondary mb-1.5">
                  Catégorie B2B cible
                </label>
                <select
                  id="category"
                  value={targetCategory}
                  onChange={(e) => setTargetCategory(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm rounded-xl bg-surface-base border border-line text-content-primary focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/50 transition min-h-[44px]"
                >
                  {B2B_OPTIONS.map(({ group, cats }) => (
                    <optgroup key={group} label={group}>
                      {cats.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              <div className="mt-4 px-4 py-3 rounded-xl border border-violet-500/20 bg-violet-500/[0.04]">
                <p className="text-xs text-content-secondary leading-relaxed">
                  <Sparkles size={11} className="inline-block mr-1 text-violet-400" />
                  Exemple : <span className="text-content-primary font-medium">{targetCategory}</span> →
                  on récupère nom, adresse, téléphone, email pro et site web depuis Google Maps.
                </p>
              </div>

              <div className="mt-8 flex items-center justify-between gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="lg"
                  icon={ArrowLeft}
                  onClick={() => setStep(1)}
                >
                  Précédent
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="lg"
                  iconRight={ArrowRight}
                  onClick={() => {
                    if (!canGoNextStep2) return;
                    setStep(3);
                  }}
                  disabled={!canGoNextStep2}
                >
                  Suivant
                </Button>
              </div>
            </div>
          )}

          {/* ─── STEP 3 — Region/dept ────────────────────────── */}
          {step === 3 && (
            <div
              key="step-3"
              className="bg-surface-card border border-line rounded-2xl p-6 sm:p-8 shadow-xl shadow-black/5 animate-in fade-in slide-in-from-right-4 duration-300"
            >
              <div className="flex items-center gap-2 mb-1">
                <MapPin size={16} className="text-violet-400" />
                <h2 className="text-lg font-semibold text-content-primary">Quelle zone géographique ?</h2>
              </div>
              <p className="text-xs text-content-tertiary mb-6">
                On utilisera le chef-lieu de la région ou le département pour la 1ère recherche.
                Tu pourras élargir ensuite.
              </p>

              <div>
                <label htmlFor="region" className="block text-sm font-medium text-content-secondary mb-1.5">
                  Région ou département
                </label>
                <select
                  id="region"
                  value={regionOrDept}
                  onChange={(e) => setRegionOrDept(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm rounded-xl bg-surface-base border border-line text-content-primary focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/50 transition min-h-[44px]"
                >
                  <optgroup label="Régions (recherche sur chef-lieu)">
                    {REGION_OPTIONS.map((r) => (
                      <option key={`region:${r.key}`} value={`region:${r.key}`}>
                        {r.name} ({r.deptCount} dépts)
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Tous les départements">
                    {Object.entries(DEPTS).map(([code, d]) => (
                      <option key={`dept:${code}`} value={`dept:${code}`}>
                        {code} — {d.name}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              <div className="mt-4 px-4 py-3 rounded-xl border border-violet-500/20 bg-violet-500/[0.04]">
                <p className="text-xs text-content-secondary leading-relaxed">
                  <Rocket size={11} className="inline-block mr-1 text-violet-400" />
                  Recherche prête : <span className="text-content-primary font-medium">{targetCategory}</span> dans
                  le <span className="text-content-primary font-medium">{DEPTS[targetDept]?.name || targetDept}</span> ({targetDept}).
                </p>
              </div>

              {error && (
                <div className="mt-4 px-4 py-3 rounded-xl border border-red-500/30 bg-red-500/10 text-xs text-red-300">
                  {error}
                </div>
              )}

              <div className="mt-8 flex items-center justify-between gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="lg"
                  icon={ArrowLeft}
                  onClick={() => setStep(2)}
                  disabled={submitting}
                >
                  Précédent
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="lg"
                  iconRight={Rocket}
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  loading={submitting}
                >
                  {submitting ? 'Lancement…' : 'Lancer ma première recherche'}
                </Button>
              </div>
            </div>
          )}

          {/* Step dots */}
          <div className="mt-6 flex items-center justify-center gap-2">
            {[1, 2, 3].map((s) => (
              <span
                key={s}
                className={`h-1.5 rounded-full transition-all ${
                  s === step
                    ? 'w-6 bg-violet-500'
                    : s < step
                      ? 'w-1.5 bg-violet-500/60'
                      : 'w-1.5 bg-line'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
