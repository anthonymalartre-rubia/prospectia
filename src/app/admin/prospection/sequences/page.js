'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, GitBranch, Plus, ChevronRight, LogIn,
  Play, Pause, Clock, CheckCircle2, XCircle, Layers,
} from 'lucide-react';
import { getSupabase } from '@/lib/supabase';
import NoAdminScreen from '@/components/NoAdminScreen';
import { CAMPAGNES_ALLOWED_PLANS } from '@/lib/campagnes-access';
import { CardListSkeleton } from '@/components/ui';

const STATUS_META = {
  draft:     { label: 'Brouillon', color: 'text-content-tertiary', bg: 'bg-content-tertiary/10', icon: <Clock size={11} /> },
  active:    { label: 'Active',    color: 'text-emerald-600',      bg: 'bg-emerald-500/10',      icon: <Play size={11} /> },
  paused:    { label: 'En pause',  color: 'text-orange-600',       bg: 'bg-orange-500/10',       icon: <Pause size={11} /> },
  completed: { label: 'Terminée',  color: 'text-blue-600',         bg: 'bg-blue-500/10',         icon: <CheckCircle2 size={11} /> },
  failed:    { label: 'Échouée',   color: 'text-red-500',          bg: 'bg-red-500/10',          icon: <XCircle size={11} /> },
};

export default function SequencesHubPage() {
  const router = useRouter();
  const supabase = getSupabase();
  const [authState, setAuthState] = useState(null);
  const [currentEmail, setCurrentEmail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sequences, setSequences] = useState([]);
  const [listsCount, setListsCount] = useState(0);

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

      const [seqRes, listsRes] = await Promise.all([
        fetch('/api/admin/prospection/sequences'),
        fetch('/api/admin/prospection/lists'),
      ]);
      if (seqRes.ok) {
        const data = await seqRes.json();
        setSequences(data.sequences || []);
      }
      if (listsRes.ok) {
        const data = await listsRes.json();
        setListsCount((data.lists || []).length);
      }
      setLoading(false);
    })();
  }, [router, supabase]);

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-base text-content-primary p-4 sm:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6 space-y-3">
            <div className="h-3 w-24 bg-zinc-200/80 dark:bg-zinc-700/40 rounded animate-pulse" />
            <div className="h-8 w-64 bg-zinc-200/80 dark:bg-zinc-700/40 rounded animate-pulse" />
          </div>
          <CardListSkeleton count={4} />
        </div>
      </div>
    );
  }
  if (authState === 'guest') return <GuestScreen />;
  if (authState === 'no-admin') return <NoAdminScreen email={currentEmail} signOut={async () => { await supabase.auth.signOut(); router.push('/login?return=/admin/prospection/sequences'); }} />;

  return (
    <div className="min-h-screen bg-surface-base text-content-primary p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <Link href="/admin/prospection" className="inline-flex items-center gap-2 text-sm text-content-tertiary hover:text-blue-500 transition mb-2">
              <ArrowLeft size={14} />
              Prospection
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
              <GitBranch size={24} className="text-blue-500" />
              Séquences email
            </h1>
            <p className="text-sm text-content-secondary mt-1">
              Cold email pro : 3-5 touches sur 14 jours, stop automatique si le prospect répond.
            </p>
          </div>
          {listsCount > 0 && (
            <Link
              href="/admin/prospection/sequences/new"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition shadow-lg shadow-blue-500/20"
            >
              <Plus size={14} />
              Nouvelle séquence
            </Link>
          )}
        </div>

        {sequences.length === 0 ? (
          listsCount === 0 ? (
            <div className="rounded-2xl border border-dashed border-line p-12 text-center">
              <Layers size={28} className="mx-auto mb-2 text-content-tertiary opacity-50" />
              <p className="text-content-tertiary mb-1">Commencez par créer une liste de prospects.</p>
              <p className="text-xs text-content-tertiary mb-4">
                Une séquence cible toujours une liste. Importez d&apos;abord vos contacts.
              </p>
              <Link href="/admin/prospection" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition">
                <Plus size={14} />
                Créer ma première liste
              </Link>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-line p-12 text-center">
              <GitBranch size={28} className="mx-auto mb-2 text-content-tertiary opacity-50" />
              <p className="text-content-tertiary mb-1">Aucune séquence. C&apos;est là que ça devient marrant.</p>
              <p className="text-xs text-content-tertiary mb-4">
                Une séquence = 3 à 5 emails de relance (J+0, J+3, J+7…) qui s&apos;arrêtent dès que le prospect répond.
              </p>
              <Link href="/admin/prospection/sequences/new" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition">
                <Plus size={14} />
                Première séquence
              </Link>
            </div>
          )
        ) : (
          <div className="rounded-2xl border border-line bg-surface-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-surface-elevated text-xs text-content-tertiary uppercase tracking-wider">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Séquence</th>
                  <th className="text-left px-4 py-3 font-semibold">Statut</th>
                  <th className="text-right px-4 py-3 font-semibold">Steps</th>
                  <th className="text-right px-4 py-3 font-semibold">Enrôlés</th>
                  <th className="text-right px-4 py-3 font-semibold">Actifs</th>
                  <th className="text-right px-4 py-3 font-semibold">Répondu</th>
                  <th className="text-right px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {sequences.map((s) => {
                  const meta = STATUS_META[s.status] || STATUS_META.draft;
                  const replyRate = s.stats.total > 0 ? Math.round((s.stats.replied / s.stats.total) * 100) : 0;
                  return (
                    <tr key={s.id} className="border-t border-line hover:bg-surface-elevated/50 transition group">
                      <td className="px-4 py-3">
                        <Link href={`/admin/prospection/sequences/${s.id}`} className="block group-hover:text-blue-500 transition">
                          <div className="font-semibold text-content-primary">{s.name}</div>
                          {s.description && (
                            <div className="text-xs text-content-tertiary truncate max-w-md">{s.description}</div>
                          )}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium ${meta.bg} ${meta.color}`}>
                          {meta.icon}
                          {meta.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-content-secondary">{s.steps_count}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-content-secondary">{s.stats.total}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-content-secondary">{s.stats.active}</td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        <span className="text-content-primary">{s.stats.replied}</span>
                        {s.stats.total > 0 && (
                          <span className="text-content-tertiary text-xs ml-1">({replyRate}%)</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/admin/prospection/sequences/${s.id}`}
                          className="inline-flex items-center gap-1 text-content-tertiary group-hover:text-blue-500 transition"
                        >
                          <ChevronRight size={16} />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <p className="text-xs text-content-tertiary mt-6 leading-relaxed">
          <strong className="text-content-primary">Comment ça marche :</strong> chaque step est envoyé en fonction du
          <code className="px-1 mx-1 rounded bg-surface-elevated">wait_days</code>
          défini. Le cron tourne toutes les 5 min. Si un prospect répond, les follow-ups sont stoppés automatiquement (stop-on-reply).
        </p>
      </div>
    </div>
  );
}

function GuestScreen() {
  return (
    <div className="min-h-screen bg-surface-base flex items-center justify-center p-6">
      <div className="max-w-md w-full rounded-2xl border border-line bg-surface-card p-8 text-center">
        <div className="w-12 h-12 mx-auto rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center mb-4">
          <LogIn size={20} className="text-blue-500" />
        </div>
        <h1 className="text-xl font-bold mb-2">Connexion requise</h1>
        <p className="text-sm text-content-secondary mb-6">Cette page est réservée aux administrateurs.</p>
        <Link href="/login?return=/admin/prospection/sequences" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition">
          <LogIn size={14} />
          Se connecter
        </Link>
      </div>
    </div>
  );
}
