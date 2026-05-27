'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Users, Plus, ChevronRight, Loader2, ShieldOff, LogIn,
  Mail, Phone, AlertCircle, MessageSquare,
} from 'lucide-react';
import { getSupabase } from '@/lib/supabase';
import { SMS_CAMPAIGNS_ENABLED } from '@/lib/feature-flags';
import { CAMPAGNES_ALLOWED_PLANS } from '@/lib/campagnes-access';
import NoAdminScreen from '@/components/NoAdminScreen';
import { CardListSkeleton } from '@/components/ui';

export default function ProspectionHubPage() {
  const router = useRouter();
  const supabase = getSupabase();
  const [authState, setAuthState] = useState(null);
  const [currentEmail, setCurrentEmail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lists, setLists] = useState([]);
  const [creating, setCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newSource, setNewSource] = useState('');
  const [error, setError] = useState(null);
  // Validation inline onBlur (Sprint 2 UX polish)
  const [nameError, setNameError] = useState(null);

  useEffect(() => {
    (async () => {
      if (!supabase) { setLoading(false); return; }
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setAuthState('guest'); setLoading(false); return; }
      setCurrentEmail(user.email);

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('plan')
        .eq('id', user.id)
        .maybeSingle();

      const allowed = profile?.plan && CAMPAGNES_ALLOWED_PLANS.includes(profile.plan.toLowerCase());
      if (!allowed) { router.push('/dashboard?upgrade=campagnes'); return; }
      setAuthState('ok');

      const res = await fetch('/api/admin/prospection/lists');
      if (res.ok) {
        const data = await res.json();
        setLists(data.lists || []);
      }
      setLoading(false);
    })();
  }, [router, supabase]);

  async function handleCreate(e) {
    e.preventDefault();
    if (creating || !newName.trim()) return;
    setCreating(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/prospection/lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName.trim(),
          source: newSource.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Erreur création'); setCreating(false); return; }
      // Redirige vers le détail pour démarrer l'import direct
      router.push(`/admin/prospection/lists/${data.list.id}`);
    } catch {
      setError('Erreur réseau');
      setCreating(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-base text-content-primary p-4 sm:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6 space-y-3">
            <div className="h-3 w-24 bg-zinc-200/80 dark:bg-zinc-700/40 rounded animate-pulse" />
            <div className="h-8 w-72 bg-zinc-200/80 dark:bg-zinc-700/40 rounded animate-pulse" />
          </div>
          <CardListSkeleton count={6} />
        </div>
      </div>
    );
  }
  if (authState === 'guest') return <GuestScreen />;
  if (authState === 'no-admin') return <NoAdminScreen email={currentEmail} signOut={async () => { await supabase.auth.signOut(); router.push('/login?return=/admin/prospection'); }} />;

  return (
    <div className="min-h-screen bg-surface-base text-content-primary p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <Link href="/admin" className="inline-flex items-center gap-2 text-sm text-content-tertiary hover:text-violet-400 transition mb-2">
              <ArrowLeft size={14} />
              Admin
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
              <Users size={24} className="text-violet-400" />
              Listes de prospects
            </h1>
            <p className="text-sm text-content-secondary mt-1">
              Importe ton CSV, lance une campagne. On s&apos;occupe du reste.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href="/admin/prospection/campaigns"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-line hover:bg-surface-elevated text-content-secondary hover:text-content-primary text-sm font-semibold transition"
            >
              <Mail size={14} />
              Campagnes email
            </Link>
            {SMS_CAMPAIGNS_ENABLED && (
              <Link
                href="/admin/prospection/sms"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-line hover:bg-surface-elevated text-content-secondary hover:text-content-primary text-sm font-semibold transition"
              >
                <MessageSquare size={14} />
                Campagnes SMS
              </Link>
            )}
            <button
              onClick={() => setShowCreate((s) => !s)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition shadow-lg shadow-violet-500/20"
            >
              <Plus size={14} />
              Nouvelle liste
            </button>
          </div>
        </div>

        {/* Formulaire création */}
        {showCreate && (
          <form onSubmit={handleCreate} className="mb-6 rounded-2xl border border-violet-500/30 bg-violet-500/[0.04] p-5">
            <h2 className="text-base font-semibold mb-3">Nouvelle liste</h2>
            {error && (
              <div className="mb-3 p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-300">
                {error}
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <div>
                <input
                  type="text"
                  required
                  maxLength={120}
                  placeholder="Nom de la liste (ex: SaaS B2B Paris 2026)"
                  value={newName}
                  onChange={(e) => {
                    setNewName(e.target.value);
                    if (nameError) setNameError(null);
                  }}
                  onBlur={() => {
                    if (!newName.trim()) setNameError('Nom de liste requis');
                  }}
                  className={`w-full px-3 py-2 rounded-lg bg-surface-base border text-sm text-content-primary placeholder:text-content-tertiary focus:outline-none transition ${nameError ? 'border-red-500/60 focus:border-red-500' : 'border-line focus:border-violet-500'}`}
                />
                {nameError && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">{nameError}</p>
                )}
              </div>
              <input
                type="text"
                maxLength={200}
                placeholder="Source (ex: Export Volia, LinkedIn Sales Nav…) — utile pour le registre RGPD"
                value={newSource}
                onChange={(e) => setNewSource(e.target.value)}
                className="px-3 py-2 rounded-lg bg-surface-base border border-line text-sm text-content-primary placeholder:text-content-tertiary focus:outline-none focus:border-violet-500 transition"
              />
            </div>
            <div className="flex items-center gap-2 justify-end">
              <button type="button" onClick={() => setShowCreate(false)} className="px-3 py-2 rounded-lg text-sm text-content-secondary hover:text-content-primary transition">
                Annuler
              </button>
              <button type="submit" disabled={creating || !newName.trim()} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-semibold transition">
                {creating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                Créer & importer
              </button>
            </div>
          </form>
        )}

        {/* Liste des listes */}
        {lists.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line p-12 text-center">
            <Users size={28} className="mx-auto mb-2 text-content-tertiary opacity-50" />
            <p className="text-content-tertiary mb-1">On va te trouver des prospects. Dis-moi qui tu cherches.</p>
            <p className="text-xs text-content-tertiary">Crée une liste, colle ton CSV. Première campagne dans 2 minutes.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {lists.map((l) => (
              <Link
                key={l.id}
                href={`/admin/prospection/lists/${l.id}`}
                className="group rounded-2xl border border-line bg-surface-card hover:bg-surface-elevated hover:border-violet-500/30 transition p-5 flex flex-col"
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h3 className="text-base font-bold text-content-primary group-hover:text-violet-400 transition leading-snug">
                    {l.name}
                  </h3>
                  <ChevronRight size={14} className="text-content-tertiary group-hover:text-violet-400 group-hover:translate-x-0.5 transition-all flex-shrink-0 mt-1" />
                </div>
                {l.description && (
                  <p className="text-xs text-content-secondary mb-3 line-clamp-2">{l.description}</p>
                )}
                <div className="grid grid-cols-3 gap-2 mt-auto text-xs">
                  <Stat icon={<Users size={11} />} value={l.contacts_count} label="contacts" />
                  <Stat icon={<Mail size={11} />} value={l.email_count} label="emails" />
                  <Stat icon={<Phone size={11} />} value={l.phone_count} label="tels" />
                </div>
                {l.opt_out_count > 0 && (
                  <div className="mt-2 inline-flex items-center gap-1 text-[10px] text-amber-600">
                    <AlertCircle size={10} />
                    {l.opt_out_count} opt-out{l.opt_out_count > 1 ? 's' : ''}
                  </div>
                )}
                {l.source && (
                  <div className="mt-1 text-[10px] text-content-tertiary truncate">Source : {l.source}</div>
                )}
              </Link>
            ))}
          </div>
        )}

        <p className="text-xs text-content-tertiary mt-6 leading-relaxed">
          <strong className="text-content-primary">RGPD :</strong> chaque liste a une <em>base légale</em> et une <em>source</em> tracées
          (registre art. 30). Toutes les campagnes ajoutent un opt-out 1 clic — c&apos;est non négociable.
        </p>
      </div>
    </div>
  );
}

function Stat({ icon, value, label }) {
  return (
    <div className="rounded-lg bg-surface-elevated px-2 py-1.5">
      <div className="flex items-center gap-1 text-content-tertiary text-[10px] uppercase tracking-wider">
        {icon}
        {label}
      </div>
      <div className="text-sm font-mono font-semibold text-content-primary tabular-nums">{value}</div>
    </div>
  );
}

function CenteredSpinner() {
  return (
    <div className="min-h-screen bg-surface-base flex items-center justify-center text-content-secondary">
      <Loader2 className="animate-spin" size={20} />
    </div>
  );
}

function GuestScreen() {
  return (
    <div className="min-h-screen bg-surface-base flex items-center justify-center p-6">
      <div className="max-w-md w-full rounded-2xl border border-line bg-surface-card p-8 text-center">
        <div className="w-12 h-12 mx-auto rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center mb-4">
          <LogIn size={20} className="text-violet-300" />
        </div>
        <h1 className="text-xl font-bold mb-2">Connexion requise</h1>
        <p className="text-sm text-content-secondary mb-6">Cette page est réservée aux administrateurs.</p>
        <Link href="/login?return=/admin/prospection" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition">
          <LogIn size={14} />
          Se connecter
        </Link>
      </div>
    </div>
  );
}

// NoAdminScreen est maintenant un composant partagé (src/components/NoAdminScreen.jsx)
// avec un wording positif ("Cette fonctionnalité arrive bientôt sur votre plan")
// au lieu du message négatif "Accès admin requis". Voir QW5.
