'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Mail, Plus, ChevronRight, Loader2, ShieldOff, LogIn,
  Send, Pause, Clock, CheckCircle2, XCircle, Eye, MousePointerClick,
} from 'lucide-react';
import { getSupabase } from '@/lib/supabase';
import NoAdminScreen from '@/components/NoAdminScreen';
import { CAMPAGNES_ALLOWED_PLANS } from '@/lib/campagnes-access';
import { CardListSkeleton } from '@/components/ui';

const STATUS_META = {
  draft:     { label: 'Brouillon',  color: 'text-content-tertiary', bg: 'bg-content-tertiary/10', icon: <Clock size={11} /> },
  scheduled: { label: 'Planifiée',  color: 'text-blue-400',         bg: 'bg-blue-500/10',          icon: <Clock size={11} /> },
  sending:   { label: 'En cours',   color: 'text-amber-600',        bg: 'bg-amber-500/10',         icon: <Send size={11} /> },
  paused:    { label: 'En pause',   color: 'text-orange-600',       bg: 'bg-orange-500/10',        icon: <Pause size={11} /> },
  sent:      { label: 'Envoyée',    color: 'text-emerald-400',      bg: 'bg-emerald-500/10',       icon: <CheckCircle2 size={11} /> },
  failed:    { label: 'Échouée',    color: 'text-red-400',          bg: 'bg-red-500/10',           icon: <XCircle size={11} /> },
};

export default function CampaignsHubPage() {
  const router = useRouter();
  const supabase = getSupabase();
  const [authState, setAuthState] = useState(null);
  const [currentEmail, setCurrentEmail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState([]);
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

      // Fetch en parallèle : campagnes + listes (empty state contextuel).
      // Si l'user n'a aucune liste, le CTA "Nouvelle campagne" mène à
      // /campaigns/new qui exige obligatoirement un list_id → erreur garantie.
      // On préfère alors proposer "Créer ma première liste".
      const [campRes, listsRes] = await Promise.all([
        fetch('/api/admin/prospection/email-campaigns'),
        fetch('/api/admin/prospection/lists'),
      ]);
      if (campRes.ok) {
        const data = await campRes.json();
        setCampaigns(data.campaigns || []);
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
  if (authState === 'no-admin') return <NoAdminScreen email={currentEmail} signOut={async () => { await supabase.auth.signOut(); router.push('/login?return=/admin/prospection/campaigns'); }} />;

  return (
    <div className="min-h-screen bg-surface-base text-content-primary p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <Link href="/admin/prospection" className="inline-flex items-center gap-2 text-sm text-content-tertiary hover:text-violet-400 transition mb-2">
              <ArrowLeft size={14} />
              Prospection
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
              <Mail size={24} className="text-violet-400" />
              Campagnes email
            </h1>
            <p className="text-sm text-content-secondary mt-1">
              Envoie, suis les ouvertures, les clics, les réponses. C&apos;est tout.
            </p>
          </div>
          <Link
            href="/admin/prospection/campaigns/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition shadow-lg shadow-violet-500/20"
          >
            <Plus size={14} />
            Nouvelle campagne
          </Link>
        </div>

        {campaigns.length === 0 ? (
          listsCount === 0 ? (
            // Pas encore de liste → on dirige d'abord vers la création de
            // liste (sans liste, /campaigns/new échoue car list_id est requis).
            <div className="rounded-2xl border border-dashed border-line p-12 text-center">
              <Mail size={28} className="mx-auto mb-2 text-content-tertiary opacity-50" />
              <p className="text-content-tertiary mb-1">Avant la campagne, il te faut une liste.</p>
              <p className="text-xs text-content-tertiary mb-4">
                Une campagne sans destinataires, ça envoie pas grand-chose. Commence par là.
              </p>
              <Link href="/admin/prospection" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition">
                <Plus size={14} />
                Créer une liste
              </Link>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-line p-12 text-center">
              <Mail size={28} className="mx-auto mb-2 text-content-tertiary opacity-50" />
              <p className="text-content-tertiary mb-1">Pas encore de campagne. Plus elle est petite, mieux c&apos;est pour commencer.</p>
              <p className="text-xs text-content-tertiary mb-4">
                {listsCount} liste{listsCount > 1 ? 's' : ''} dispo{listsCount > 1 ? 's' : ''}. Une cible bien choisie vaut mieux qu&apos;un blast à 10k.
              </p>
              <Link href="/admin/prospection/campaigns/new" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition">
                <Plus size={14} />
                Première campagne
              </Link>
            </div>
          )
        ) : (
          <div className="rounded-2xl border border-line bg-surface-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-surface-elevated text-xs text-content-tertiary uppercase tracking-wider">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Campagne</th>
                  <th className="text-left px-4 py-3 font-semibold">Statut</th>
                  <th className="text-right px-4 py-3 font-semibold">Destinataires</th>
                  <th className="text-right px-4 py-3 font-semibold">Envoyés</th>
                  <th className="text-right px-4 py-3 font-semibold">Ouvertures</th>
                  <th className="text-right px-4 py-3 font-semibold">Clics</th>
                  <th className="text-right px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c) => {
                  const meta = STATUS_META[c.status] || STATUS_META.draft;
                  const openRate = c.sent_count > 0 ? Math.round((c.opened_count / c.sent_count) * 100) : 0;
                  const clickRate = c.sent_count > 0 ? Math.round((c.clicked_count / c.sent_count) * 100) : 0;
                  return (
                    <tr key={c.id} className="border-t border-line hover:bg-surface-elevated/50 transition group">
                      <td className="px-4 py-3">
                        <Link href={`/admin/prospection/campaigns/${c.id}`} className="block group-hover:text-violet-400 transition">
                          <div className="font-semibold text-content-primary">{c.name}</div>
                          <div className="text-xs text-content-tertiary truncate max-w-md">{c.subject}</div>
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium ${meta.bg} ${meta.color}`}>
                          {meta.icon}
                          {meta.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-content-secondary">
                        {c.total_recipients || 0}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-content-secondary">
                        {c.sent_count || 0}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        <span className="text-content-primary">{c.opened_count || 0}</span>
                        {c.sent_count > 0 && (
                          <span className="text-content-tertiary text-xs ml-1">({openRate}%)</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        <span className="text-content-primary">{c.clicked_count || 0}</span>
                        {c.sent_count > 0 && (
                          <span className="text-content-tertiary text-xs ml-1">({clickRate}%)</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/admin/prospection/campaigns/${c.id}`}
                          className="inline-flex items-center gap-1 text-content-tertiary group-hover:text-violet-400 transition"
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
          <strong className="text-content-primary">Cadence :</strong> le cron envoie ~50 emails toutes les 5 minutes (limite Resend ~10/sec, marge de sécurité).
          Pour une liste de 1 000 contacts, comptez ~2h. Vous pouvez planifier une heure d&apos;envoi (RGPD : éviter nuit/weekend).
        </p>
      </div>
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
        <Link href="/login?return=/admin/prospection/campaigns" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition">
          <LogIn size={14} />
          Se connecter
        </Link>
      </div>
    </div>
  );
}

// NoAdminScreen partagé — voir src/components/NoAdminScreen.jsx (QW5).
