'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, GitBranch, Loader2, Play, Pause, Trash2, AlertTriangle,
  Mail, Users, CheckCircle2, XCircle, Clock, Reply, Ban,
} from 'lucide-react';
import { getSupabase } from '@/lib/supabase';
import { CAMPAGNES_ALLOWED_PLANS } from '@/lib/campagnes-access';

const STATUS_META = {
  draft:     { label: 'Brouillon', color: 'text-content-tertiary', bg: 'bg-content-tertiary/10' },
  active:    { label: 'Active',    color: 'text-emerald-600',      bg: 'bg-emerald-500/10' },
  paused:    { label: 'En pause',  color: 'text-orange-600',       bg: 'bg-orange-500/10' },
  completed: { label: 'Terminée',  color: 'text-blue-600',         bg: 'bg-blue-500/10' },
  failed:    { label: 'Échouée',   color: 'text-red-500',          bg: 'bg-red-500/10' },
};

const ENROLLMENT_STATUS_META = {
  active:    { label: 'En cours',  icon: <Clock size={11} />,        cls: 'text-emerald-600 bg-emerald-500/10' },
  replied:   { label: 'Répondu',   icon: <Reply size={11} />,        cls: 'text-blue-600 bg-blue-500/10' },
  completed: { label: 'Terminé',   icon: <CheckCircle2 size={11} />, cls: 'text-content-secondary bg-content-tertiary/10' },
  failed:    { label: 'Échec',     icon: <XCircle size={11} />,      cls: 'text-red-500 bg-red-500/10' },
  opted_out: { label: 'Opt-out',   icon: <Ban size={11} />,          cls: 'text-orange-600 bg-orange-500/10' },
};

export default function SequenceDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const supabase = getSupabase();
  const [authState, setAuthState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  async function load() {
    const res = await fetch(`/api/admin/prospection/sequences/${id}`);
    if (!res.ok) {
      const e = await res.json().catch(() => ({}));
      setError(e.error || 'Erreur chargement');
      return;
    }
    const json = await res.json();
    setData(json);
  }

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
      await load();
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, id]);

  async function handleStart() {
    if (actionLoading) return;
    setActionLoading(true);
    setError(null);
    const res = await fetch(`/api/admin/prospection/sequences/${id}/start`, { method: 'POST' });
    const json = await res.json();
    if (!res.ok) setError(json.error || 'Erreur démarrage');
    await load();
    setActionLoading(false);
  }
  async function handlePause() {
    if (actionLoading) return;
    setActionLoading(true);
    setError(null);
    const res = await fetch(`/api/admin/prospection/sequences/${id}/pause`, { method: 'POST' });
    const json = await res.json();
    if (!res.ok) setError(json.error || 'Erreur pause');
    await load();
    setActionLoading(false);
  }
  async function handleDelete() {
    if (!confirm('Supprimer définitivement cette séquence ? Les enrollments seront aussi supprimés.')) return;
    setActionLoading(true);
    const res = await fetch(`/api/admin/prospection/sequences/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const e = await res.json().catch(() => ({}));
      setError(e.error || 'Suppression impossible');
      setActionLoading(false);
      return;
    }
    router.push('/admin/prospection/sequences');
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-base flex items-center justify-center">
        <Loader2 className="animate-spin text-content-tertiary" size={24} />
      </div>
    );
  }
  if (!data) {
    return (
      <div className="min-h-screen bg-surface-base p-8">
        <p className="text-content-secondary">Séquence introuvable.</p>
        {error && <p className="text-red-500 mt-2">{error}</p>}
      </div>
    );
  }

  const { sequence, steps, enrollments, stats } = data;
  const meta = STATUS_META[sequence.status] || STATUS_META.draft;
  const replyRate = stats.total > 0 ? Math.round((stats.replied / stats.total) * 100) : 0;

  return (
    <div className="min-h-screen bg-surface-base text-content-primary p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        <Link href="/admin/prospection/sequences" className="inline-flex items-center gap-2 text-sm text-content-tertiary hover:text-blue-500 transition mb-2">
          <ArrowLeft size={14} />
          Séquences
        </Link>
        <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
              <GitBranch size={24} className="text-blue-500" />
              {sequence.name}
            </h1>
            {sequence.description && (
              <p className="text-sm text-content-secondary mt-1">{sequence.description}</p>
            )}
            <div className="flex items-center gap-2 mt-3">
              <span className={`inline-flex items-center px-2 py-1 rounded-md text-[11px] font-medium ${meta.bg} ${meta.color}`}>
                {meta.label}
              </span>
              <span className="text-xs text-content-tertiary">
                {steps.length} step{steps.length > 1 ? 's' : ''} · limite {sequence.daily_limit}/jour
                {sequence.stop_on_reply && ' · stop-on-reply'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {sequence.status === 'active' ? (
              <button
                onClick={handlePause}
                disabled={actionLoading}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-500/10 text-orange-600 hover:bg-orange-500/15 text-sm font-medium transition disabled:opacity-60"
              >
                <Pause size={14} />
                Pause
              </button>
            ) : (
              <button
                onClick={handleStart}
                disabled={actionLoading || steps.length === 0}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition shadow-lg shadow-blue-500/20 disabled:opacity-60"
              >
                {actionLoading ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                {sequence.status === 'paused' ? 'Reprendre' : 'Démarrer'}
              </button>
            )}
            {sequence.status !== 'active' && (
              <button
                onClick={handleDelete}
                disabled={actionLoading}
                className="p-2 rounded-lg text-content-tertiary hover:text-red-500 hover:bg-red-500/10 transition"
                aria-label="Supprimer"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-500 flex items-center gap-2 mb-4">
            <AlertTriangle size={14} />
            {error}
          </div>
        )}

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
          <StatCard icon={<Users size={14} />} label="Enrôlés" value={stats.total} />
          <StatCard icon={<Clock size={14} />} label="En cours" value={stats.active} accent="emerald" />
          <StatCard icon={<Reply size={14} />} label="Répondu" value={stats.replied} subtitle={`${replyRate}%`} accent="blue" />
          <StatCard icon={<CheckCircle2 size={14} />} label="Terminés" value={stats.completed} />
          <StatCard icon={<Ban size={14} />} label="Opt-out / fail" value={stats.opted_out + stats.failed} accent="orange" />
        </div>

        {/* Steps */}
        <section className="rounded-2xl border border-line bg-surface-card p-5 mb-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-content-tertiary mb-3">Étapes ({steps.length})</h2>
          <div className="space-y-2">
            {steps.map((step) => (
              <div key={step.id} className="flex items-start gap-3 rounded-lg bg-surface-base p-3 border border-line">
                <div className="w-7 h-7 shrink-0 rounded-full bg-blue-500/15 text-blue-600 flex items-center justify-center text-xs font-bold">
                  {step.step_order}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-content-tertiary">
                      {step.wait_days === 0 ? 'Envoi immédiat' : `J+${step.wait_days} après step ${step.step_order - 1}`}
                    </span>
                  </div>
                  <div className="text-sm font-medium truncate">{step.subject}</div>
                  <div className="text-xs text-content-tertiary line-clamp-2 mt-1">{step.body_html.slice(0, 200)}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Enrollments */}
        <section className="rounded-2xl border border-line bg-surface-card overflow-hidden">
          <div className="px-5 py-3 border-b border-line">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-content-tertiary">
              Contacts enrôlés ({enrollments.length} {enrollments.length >= 100 ? 'premiers' : ''})
            </h2>
          </div>
          {enrollments.length === 0 ? (
            <div className="p-8 text-center text-content-tertiary text-sm">
              <Users size={24} className="mx-auto mb-2 opacity-50" />
              Aucun contact enrôlé. Clique sur Démarrer pour enrôler les contacts de la liste.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-surface-elevated text-xs text-content-tertiary uppercase tracking-wider">
                <tr>
                  <th className="text-left px-4 py-2 font-semibold">Contact</th>
                  <th className="text-left px-4 py-2 font-semibold">Statut</th>
                  <th className="text-right px-4 py-2 font-semibold">Step actuel</th>
                  <th className="text-right px-4 py-2 font-semibold">Prochain envoi</th>
                </tr>
              </thead>
              <tbody>
                {enrollments.map((e) => {
                  const sm = ENROLLMENT_STATUS_META[e.status] || ENROLLMENT_STATUS_META.active;
                  const c = e.contact;
                  return (
                    <tr key={e.id} className="border-t border-line hover:bg-surface-elevated/40 transition">
                      <td className="px-4 py-2">
                        <div className="font-medium text-content-primary truncate max-w-[260px]">
                          {c ? `${c.first_name || ''} ${c.last_name || ''}`.trim() || c.email : '—'}
                        </div>
                        <div className="text-xs text-content-tertiary truncate max-w-[260px]">
                          {c?.email}
                          {c?.company && <span className="ml-2">· {c.company}</span>}
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium ${sm.cls}`}>
                          {sm.icon}
                          {sm.label}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right tabular-nums text-content-secondary">
                        {e.current_step} / {steps.length}
                      </td>
                      <td className="px-4 py-2 text-right text-xs text-content-tertiary">
                        {e.status === 'active' && e.next_send_at
                          ? new Date(e.next_send_at).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })
                          : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, subtitle, accent }) {
  const accentCls = accent === 'emerald' ? 'text-emerald-600' :
                    accent === 'blue'    ? 'text-blue-600' :
                    accent === 'orange'  ? 'text-orange-600' :
                    'text-content-primary';
  return (
    <div className="rounded-xl border border-line bg-surface-card p-3">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-content-tertiary mb-1.5">
        {icon}
        {label}
      </div>
      <div className={`text-xl font-bold tabular-nums ${accentCls}`}>
        {value}
        {subtitle && <span className="text-xs text-content-tertiary font-medium ml-1">{subtitle}</span>}
      </div>
    </div>
  );
}
