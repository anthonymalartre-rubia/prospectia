'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Mail, Loader2, Send, AlertTriangle, Eye, MousePointerClick,
  CheckCircle2, XCircle, Clock, Pause, Trash2, RefreshCw, ShieldOff,
  LogIn, Users, Calendar, BarChart3, AlertCircle, MessageSquareReply,
  Sparkles, ExternalLink, FlaskConical, Trophy,
} from 'lucide-react';
import { getSupabase } from '@/lib/supabase';
import { CAMPAGNES_ALLOWED_PLANS } from '@/lib/campagnes-access';
import NoAdminScreen from '@/components/NoAdminScreen';

const STATUS_META = {
  draft:     { label: 'Brouillon',  color: 'text-content-tertiary', bg: 'bg-content-tertiary/10', icon: <Clock size={12} /> },
  scheduled: { label: 'Planifiée',  color: 'text-blue-400',         bg: 'bg-blue-500/10',          icon: <Clock size={12} /> },
  sending:   { label: 'En cours',   color: 'text-amber-600',        bg: 'bg-amber-500/10',         icon: <Send size={12} /> },
  paused:    { label: 'En pause',   color: 'text-orange-600',       bg: 'bg-orange-500/10',        icon: <Pause size={12} /> },
  sent:      { label: 'Envoyée',    color: 'text-emerald-400',      bg: 'bg-emerald-500/10',       icon: <CheckCircle2 size={12} /> },
  failed:    { label: 'Échouée',    color: 'text-red-400',          bg: 'bg-red-500/10',           icon: <XCircle size={12} /> },
};

const SEND_STATUS_META = {
  pending:   { label: 'En attente', color: 'text-content-tertiary' },
  sent:      { label: 'Envoyé',     color: 'text-emerald-400' },
  delivered: { label: 'Délivré',    color: 'text-emerald-300' },
  opened:    { label: 'Ouvert',     color: 'text-violet-300' },
  clicked:   { label: 'Cliqué',     color: 'text-violet-400' },
  bounced:   { label: 'Bounced',    color: 'text-red-400' },
  failed:    { label: 'Échec',      color: 'text-red-400' },
  replied:   { label: 'Répondu',    color: 'text-blue-300' },
};

export default function CampaignDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id;
  const supabase = getSupabase();

  const [authState, setAuthState] = useState(null);
  const [currentEmail, setCurrentEmail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [campaign, setCampaign] = useState(null);
  const [sample, setSample] = useState([]);
  const [crmStats, setCrmStats] = useState({ replies_count: 0, auto_created_deals_count: 0 });
  const [abTest, setAbTest] = useState(null);
  const [error, setError] = useState(null);
  const [sending, setSending] = useState(false);
  const [submitting, setSubmitting] = useState(false); // Bug P0 #3 : verrou ferme contre double-click
  const [confirmSend, setConfirmSend] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [scheduledAt, setScheduledAt] = useState('');

  const fetchCampaign = useCallback(async () => {
    if (!id) return;
    try {
      const res = await fetch(`/api/admin/prospection/email-campaigns/${id}`);
      if (!res.ok) {
        setError('Campagne introuvable');
        setLoading(false);
        return;
      }
      const data = await res.json();
      setCampaign(data.campaign);
      setSample(data.sample_sends || []);
      setCrmStats(data.crm || { replies_count: 0, auto_created_deals_count: 0 });
      setAbTest(data.ab_test || null);
    } catch {
      setError('Erreur réseau');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    (async () => {
      if (!supabase) { setLoading(false); return; }
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setAuthState('guest'); setLoading(false); return; }
      setCurrentEmail(user.email);

      const { data: profile } = await supabase
        .from('user_profiles').select('plan').eq('id', user.id).maybeSingle();
      const allowed = profile?.plan && CAMPAGNES_ALLOWED_PLANS.includes(profile.plan.toLowerCase());
      if (!allowed) { router.push('/dashboard?upgrade=campagnes'); return; }
      setAuthState('ok');

      await fetchCampaign();
    })();
  }, [supabase, fetchCampaign]);

  // Auto-refresh stats si campagne en cours
  useEffect(() => {
    if (!campaign || !['sending', 'scheduled'].includes(campaign.status)) return;
    const t = setInterval(fetchCampaign, 30000); // toutes les 30s
    return () => clearInterval(t);
  }, [campaign, fetchCampaign]);

  async function handleSend() {
    // Bug P0 #3 : double verrou. `submitting` est synchrone (lecture
    // immédiate après set côté React 18 batch), `sending` reste pour
    // l'UI (spinner). On garde aussi le verrou DB (UNIQUE INDEX
    // email_sends_campaign_contact_unique) comme dernière ligne de
    // défense — un double-click ne créera jamais 2× le même send.
    if (submitting || sending || !campaign) return;
    setSubmitting(true);
    setSending(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/prospection/email-campaigns/${id}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Erreur envoi');
        setSending(false);
        setSubmitting(false);
        return;
      }
      // On ferme la modale AVANT le fetch pour éviter qu'un re-render
      // ne laisse le bouton actif (même si disabled) le temps que
      // fetchCampaign tourne.
      setConfirmSend(false);
      await fetchCampaign();
    } catch {
      setError('Erreur réseau');
    } finally {
      setSending(false);
      // submitting reste true volontairement après succès — la modale
      // est fermée et la prochaine ouverture est un nouveau cycle.
      // On reset uniquement en cas d'erreur (déjà fait au-dessus).
      if (!confirmSend) setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!campaign) return;
    try {
      const res = await fetch(`/api/admin/prospection/email-campaigns/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Erreur suppression');
        return;
      }
      router.push('/admin/prospection/campaigns');
    } catch {
      setError('Erreur réseau');
    }
  }

  if (loading) return <CenteredSpinner />;
  if (authState === 'guest') return <GuestScreen />;
  if (authState === 'no-admin') return <NoAdminScreen email={currentEmail} signOut={async () => { await supabase.auth.signOut(); router.push('/login?return=/admin/prospection/campaigns'); }} />;
  if (!campaign) return <NotFound error={error} />;

  const meta = STATUS_META[campaign.status] || STATUS_META.draft;
  const sent = campaign.sent_count || 0;
  const total = campaign.total_recipients || 0;
  const progress = total > 0 ? Math.round((sent / total) * 100) : 0;
  const remaining = Math.max(0, total - sent);
  const etaMinutes = remaining > 0 ? Math.ceil(remaining / 50) * 5 : 0; // 50 sends / 5 min

  const openRate = sent > 0 ? ((campaign.opened_count / sent) * 100).toFixed(1) : '0.0';
  const clickRate = sent > 0 ? ((campaign.clicked_count / sent) * 100).toFixed(1) : '0.0';
  const replyRate = sent > 0 ? ((campaign.replied_count / sent) * 100).toFixed(1) : '0.0';
  const bounceRate = sent > 0 ? ((campaign.bounced_count / sent) * 100).toFixed(1) : '0.0';

  // ── Phase 2 — engagement (CRM) ──────────────────────────────────
  // Réponses comptées côté CRM via inbound_events / email_sends.replied_at.
  // engagementRate = replies / delivered (vs reply rate au sens marketing
  // = replies / sent qui surévalue si beaucoup de bounces).
  const repliesCrm = crmStats?.replies_count || 0;
  const autoDealsCount = crmStats?.auto_created_deals_count || 0;
  const delivered = campaign.delivered_count || 0;
  const engagementRate = delivered > 0 ? ((repliesCrm / delivered) * 100).toFixed(1) : '0.0';

  const canSend = ['draft', 'paused'].includes(campaign.status);
  const canDelete = ['draft', 'paused'].includes(campaign.status);

  return (
    <div className="min-h-screen bg-surface-base text-content-primary p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link href="/admin/prospection/campaigns" className="inline-flex items-center gap-2 text-sm text-content-tertiary hover:text-violet-400 transition mb-2">
            <ArrowLeft size={14} />
            Campagnes
          </Link>
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
                {campaign.name}
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${meta.bg} ${meta.color}`}>
                  {meta.icon}
                  {meta.label}
                </span>
              </h1>
              <p className="text-sm text-content-secondary mt-1.5 truncate max-w-2xl">
                Objet : <span className="text-content-primary">{campaign.subject}</span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={fetchCampaign}
                className="p-2 rounded-lg border border-line hover:bg-surface-elevated text-content-secondary transition"
                title="Actualiser"
              >
                <RefreshCw size={14} />
              </button>
              {canDelete && (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="p-2 rounded-lg border border-red-500/30 hover:bg-red-500/10 text-red-400 transition"
                  title="Supprimer"
                >
                  <Trash2 size={14} />
                </button>
              )}
              {canSend && (
                <button
                  onClick={() => {
                    // Bug P0 #3 : nouveau cycle d'envoi → on relâche le
                    // verrou submitting (qui restait true après un succès
                    // pour bloquer un re-click pendant fetchCampaign).
                    setSubmitting(false);
                    setConfirmSend(true);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition shadow-lg shadow-violet-500/20"
                >
                  <Send size={14} />
                  Lancer la campagne
                </button>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-300 flex items-start gap-2">
            <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Progress bar si sending */}
        {['sending', 'scheduled'].includes(campaign.status) && (
          <div className="mb-6 rounded-2xl border border-amber-400 bg-amber-50 p-5">
            <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
              <div className="text-sm font-semibold text-amber-700">
                {campaign.status === 'sending' ? 'Envoi en cours' : 'Planifiée'}
              </div>
              <div className="text-xs text-amber-700/80 tabular-nums">
                {sent} / {total} envoyés ({progress}%)
                {etaMinutes > 0 && campaign.status === 'sending' && ` · ~${etaMinutes} min restantes`}
                {campaign.scheduled_at && campaign.status === 'scheduled' && ` · démarrage ${new Date(campaign.scheduled_at).toLocaleString('fr-FR')}`}
              </div>
            </div>
            <div className="h-2 rounded-full bg-amber-100 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-[11px] text-amber-700/70 mt-2">
              Stats actualisées automatiquement toutes les 30s. Le cron tourne toutes les 5 min.
            </p>
          </div>
        )}

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
          <StatCard icon={<Users size={14} />} label="Destinataires" value={total} color="text-content-primary" />
          <StatCard icon={<Send size={14} />} label="Envoyés" value={sent} color="text-content-primary" />
          <StatCard icon={<CheckCircle2 size={14} />} label="Délivrés" value={campaign.delivered_count || 0} color="text-emerald-400" />
          <StatCard icon={<Eye size={14} />} label="Ouvertures" value={campaign.opened_count || 0} sub={`${openRate}%`} color="text-violet-300" />
          <StatCard icon={<MousePointerClick size={14} />} label="Clics" value={campaign.clicked_count || 0} sub={`${clickRate}%`} color="text-violet-400" />
          <StatCard icon={<MessageSquareReply size={14} />} label="Réponses" value={campaign.replied_count || 0} sub={`${replyRate}%`} color="text-blue-300" />
        </div>

        {/* Engagement & CRM (Phase 2 — couleur violet "campagnes") */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
          <StatCard
            icon={<MessageSquareReply size={14} />}
            label="Réponses (CRM)"
            value={repliesCrm}
            color="text-violet-400"
            sub={`Trackées via inbound_events`}
          />
          <StatCard
            icon={<BarChart3 size={14} />}
            label="Taux engagement"
            value={`${engagementRate}%`}
            color="text-violet-400"
            sub="Réponses / Délivrés"
          />
          <StatCard
            icon={<Sparkles size={14} />}
            label="Deals auto-créés"
            value={autoDealsCount}
            color="text-violet-400"
            sub="Convertis vers CRM"
          />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <StatCard icon={<AlertCircle size={14} />} label="Bounces" value={campaign.bounced_count || 0} sub={`${bounceRate}%`} color="text-red-400" warn={bounceRate > 3} />
          <StatCard icon={<XCircle size={14} />} label="Échecs" value={campaign.failed_count || 0} color="text-red-400" />
          {campaign.scheduled_at && (
            <StatCard icon={<Calendar size={14} />} label="Planifié pour" value={new Date(campaign.scheduled_at).toLocaleString('fr-FR')} valueClass="text-xs" />
          )}
          {campaign.started_at && (
            <StatCard icon={<Calendar size={14} />} label="Démarrée" value={new Date(campaign.started_at).toLocaleString('fr-FR')} valueClass="text-xs" />
          )}
          {campaign.completed_at && (
            <StatCard icon={<CheckCircle2 size={14} />} label="Terminée" value={new Date(campaign.completed_at).toLocaleString('fr-FR')} valueClass="text-xs" color="text-emerald-400" />
          )}
        </div>

        {/* Bounce warning */}
        {parseFloat(bounceRate) > 3 && sent > 50 && (
          <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/[0.04] p-4 text-sm text-red-200 flex items-start gap-2">
            <AlertTriangle size={16} className="mt-0.5 flex-shrink-0 text-red-400" />
            <div>
              <strong>Taux de bounce élevé ({bounceRate}%).</strong> Au-dessus de 3 %, Resend peut suspendre le domaine.
              Vérifiez la qualité de votre liste (emails invalides) et envisagez de l&apos;épurer avant la prochaine campagne.
            </div>
          </div>
        )}

        {/* A/B test results — visible uniquement si A/B activé */}
        {abTest && abTest.enabled && (
          <section className="mb-6 rounded-2xl border border-violet-500/30 bg-violet-500/[0.04] overflow-hidden">
            <div className="px-4 py-3 border-b border-violet-500/20 bg-violet-500/[0.06] flex items-center justify-between flex-wrap gap-2">
              <div className="text-xs font-semibold uppercase tracking-wider text-violet-300 flex items-center gap-1.5">
                <FlaskConical size={12} />
                A/B test — Résultats par variant
              </div>
              <div className="text-[11px] text-content-tertiary">
                Sample size : <strong className="tabular-nums text-content-secondary">{abTest.sample_size}</strong>
                {abTest.winner_variant && abTest.picked_at && (
                  <span className="ml-2">
                    · winner picked {new Date(abTest.picked_at).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="text-[10px] text-content-tertiary uppercase tracking-wider">
                  <tr>
                    <th className="text-left px-4 py-2 font-semibold">Variant</th>
                    <th className="text-left px-4 py-2 font-semibold">Subject</th>
                    <th className="text-right px-4 py-2 font-semibold">Sent</th>
                    <th className="text-right px-4 py-2 font-semibold">Opened</th>
                    <th className="text-right px-4 py-2 font-semibold">Open rate</th>
                  </tr>
                </thead>
                <tbody>
                  {abTest.variants.map((v) => {
                    const label = String.fromCharCode(64 + v.id); // 1→A, 2→B, 3→C
                    const isWinner = abTest.winner_variant === v.id;
                    const rate = (v.open_rate * 100).toFixed(1);
                    return (
                      <tr key={v.id} className={`border-t border-violet-500/10 ${isWinner ? 'bg-violet-500/[0.05]' : ''}`}>
                        <td className="px-4 py-2.5">
                          <span className={`inline-flex items-center gap-1 font-semibold ${isWinner ? 'text-violet-300' : 'text-content-primary'}`}>
                            {label}
                            {isWinner && <Trophy size={11} className="text-amber-400" />}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 max-w-md">
                          <span className="text-content-secondary truncate block" title={v.subject || ''}>
                            {v.subject || <em className="text-content-tertiary">(vide)</em>}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-content-secondary">{v.sent}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-content-secondary">{v.opened}</td>
                        <td className={`px-4 py-2.5 text-right tabular-nums font-semibold ${isWinner ? 'text-violet-300' : 'text-content-primary'}`}>
                          {rate}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {abTest.winner_variant ? (
              (() => {
                const winner = abTest.variants.find((v) => v.id === abTest.winner_variant);
                const winnerLabel = String.fromCharCode(64 + abTest.winner_variant);
                const remaining = Math.max(0, (campaign.total_recipients || 0) - sent);
                return (
                  <div className="px-4 py-3 border-t border-violet-500/20 bg-violet-500/[0.03] text-xs text-violet-200 flex items-center gap-2">
                    <Trophy size={13} className="text-amber-400" />
                    <span>
                      Variant <strong>{winnerLabel}</strong> picked as winner
                      {winner && ` (${(winner.open_rate * 100).toFixed(1)}% open rate)`}
                      {remaining > 0 && ` — used for the remaining ${remaining} send${remaining > 1 ? 's' : ''}`}
                    </span>
                  </div>
                );
              })()
            ) : (
              <div className="px-4 py-3 border-t border-violet-500/20 bg-violet-500/[0.03] text-xs text-content-tertiary flex items-center gap-2">
                <FlaskConical size={13} className="text-violet-400" />
                <span>
                  En cours — {Math.min(sent, abTest.sample_size)} / {abTest.sample_size} envois faits. Le winner sera automatiquement choisi
                  une fois le sample size atteint.
                </span>
              </div>
            )}
          </section>
        )}

        {/* Aperçu + sample */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Aperçu mail */}
          <section className="rounded-2xl border border-line bg-surface-card overflow-hidden">
            <div className="px-4 py-3 border-b border-line bg-surface-elevated text-xs font-semibold uppercase tracking-wider text-content-tertiary flex items-center gap-1.5">
              <Eye size={12} />
              Contenu envoyé
            </div>
            <div className="p-4 text-xs">
              <div className="space-y-1.5 mb-3 pb-3 border-b border-line">
                <div><span className="text-content-tertiary">De :</span> <strong>{campaign.from_name}</strong> &lt;{campaign.from_email}&gt;</div>
                {campaign.reply_to && <div><span className="text-content-tertiary">Reply-To :</span> {campaign.reply_to}</div>}
                <div><span className="text-content-tertiary">Objet :</span> <strong>{campaign.subject}</strong></div>
              </div>
              <div
                className="prose prose-sm prose-invert max-w-none [&_p]:my-2 [&_a]:text-violet-400 text-content-secondary"
                dangerouslySetInnerHTML={{ __html: campaign.body_html }}
              />
            </div>
          </section>

          {/* Échantillon de sends */}
          <section className="rounded-2xl border border-line bg-surface-card overflow-hidden">
            <div className="px-4 py-3 border-b border-line bg-surface-elevated text-xs font-semibold uppercase tracking-wider text-content-tertiary flex items-center gap-1.5">
              <BarChart3 size={12} />
              Derniers envois ({sample.length})
            </div>
            {sample.length === 0 ? (
              <div className="p-8 text-center text-xs text-content-tertiary">
                Aucun envoi pour le moment.
              </div>
            ) : (
              <div className="max-h-[440px] overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-surface-elevated text-[10px] text-content-tertiary uppercase tracking-wider">
                    <tr>
                      <th className="text-left px-3 py-2 font-semibold">Email</th>
                      <th className="text-left px-3 py-2 font-semibold">Statut</th>
                      <th className="text-right px-3 py-2 font-semibold">Quand</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sample.map((s) => {
                      const smeta = SEND_STATUS_META[s.status] || SEND_STATUS_META.pending;
                      const ts = s.replied_at || s.clicked_at || s.opened_at || s.delivered_at || s.bounced_at || s.sent_at;
                      return (
                        <tr key={s.id} className="border-t border-line">
                          <td className="px-3 py-2 max-w-[220px]" title={s.email}>
                            <div className="flex items-center gap-1.5">
                              <span className="truncate">{s.email}</span>
                              {s.crm_contact_id && (
                                <Link
                                  href={`/app/crm/contacts/${s.crm_contact_id}`}
                                  title="Voir ce contact dans le CRM"
                                  className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors flex-shrink-0"
                                >
                                  CRM
                                  <ExternalLink size={9} />
                                </Link>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-2">
                            <span className={`text-[11px] font-medium ${smeta.color}`}>{smeta.label}</span>
                            {s.error && (
                              <div className="text-[10px] text-red-400 truncate max-w-[200px]" title={s.error}>
                                {s.error}
                              </div>
                            )}
                          </td>
                          <td className="px-3 py-2 text-right text-content-tertiary tabular-nums">
                            {ts ? new Date(ts).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        {/* Confirm send modal */}
        {confirmSend && canSend && (
          <Modal onClose={() => setConfirmSend(false)}>
            <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
              <Send size={18} className="text-violet-400" />
              Lancer la campagne
            </h3>
            <p className="text-sm text-content-secondary mb-4">
              <strong className="text-content-primary">{total} destinataires</strong> recevront cet email.
              Le cron envoie ~50 emails toutes les 5 min — comptez ~{Math.ceil(total / 50) * 5} min pour tout envoyer.
            </p>
            <div className="mb-4">
              <label className="block text-xs text-content-tertiary mb-1.5">Planifier (optionnel) — laisser vide pour envoi immédiat</label>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface-base border border-line text-sm focus:outline-none focus:border-violet-500"
              />
              <p className="text-[10px] text-content-tertiary mt-1">
                Bonnes pratiques RGPD : éviter nuit, weekend, jours fériés.
              </p>
            </div>
            <div className="rounded-lg bg-amber-500/10 border border-amber-400 p-3 mb-4 text-xs text-amber-700">
              <strong>Cette action est irréversible.</strong> Les opt-out sont automatiquement exclus, et chaque mail contient un lien de désabonnement.
            </div>
            <div className="flex items-center gap-2 justify-end">
              <button onClick={() => setConfirmSend(false)} className="px-3 py-2 rounded-lg text-sm text-content-secondary hover:text-content-primary transition">
                Annuler
              </button>
              <button
                onClick={handleSend}
                disabled={sending || submitting}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition"
              >
                {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                {scheduledAt ? 'Planifier' : 'Envoyer maintenant'}
              </button>
            </div>
          </Modal>
        )}

        {/* Confirm delete modal */}
        {confirmDelete && (
          <Modal onClose={() => setConfirmDelete(false)}>
            <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
              <Trash2 size={18} className="text-red-400" />
              Supprimer cette campagne ?
            </h3>
            <p className="text-sm text-content-secondary mb-4">
              Le brouillon <strong className="text-content-primary">{campaign.name}</strong> sera définitivement supprimé. Cette action est irréversible.
            </p>
            <div className="flex items-center gap-2 justify-end">
              <button onClick={() => setConfirmDelete(false)} className="px-3 py-2 rounded-lg text-sm text-content-secondary hover:text-content-primary transition">
                Annuler
              </button>
              <button
                onClick={handleDelete}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition"
              >
                <Trash2 size={14} />
                Supprimer
              </button>
            </div>
          </Modal>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, sub, color = 'text-content-primary', valueClass = 'text-lg', warn = false }) {
  return (
    <div className={`rounded-xl border ${warn ? 'border-red-500/30 bg-red-500/[0.04]' : 'border-line bg-surface-card'} p-3`}>
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-content-tertiary mb-1">
        {icon}
        {label}
      </div>
      <div className={`${valueClass} font-semibold tabular-nums ${color}`}>
        {value}
      </div>
      {sub && <div className="text-[10px] text-content-tertiary mt-0.5">{sub}</div>}
    </div>
  );
}

function Modal({ children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="max-w-md w-full rounded-2xl border border-line bg-surface-card p-6" onClick={(e) => e.stopPropagation()}>
        {children}
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

function NotFound({ error }) {
  return (
    <div className="min-h-screen bg-surface-base flex items-center justify-center p-6">
      <div className="max-w-md w-full rounded-2xl border border-line bg-surface-card p-8 text-center">
        <Mail size={28} className="mx-auto mb-3 text-content-tertiary opacity-50" />
        <h1 className="text-lg font-bold mb-2">Campagne introuvable</h1>
        <p className="text-sm text-content-secondary mb-4">{error || 'Cette campagne n\'existe pas ou ne vous appartient pas.'}</p>
        <Link href="/admin/prospection/campaigns" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition">
          <ArrowLeft size={14} />
          Retour aux campagnes
        </Link>
      </div>
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
        <Link href="/login?return=/admin/prospection/campaigns" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition">
          <LogIn size={14} />
          Se connecter
        </Link>
      </div>
    </div>
  );
}

// NoAdminScreen partagé — voir src/components/NoAdminScreen.jsx (QW5).
