'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, MessageSquare, Plus, ChevronRight, Loader2, ShieldOff, LogIn,
  Send, Pause, Clock, CheckCircle2, XCircle, AlertTriangle, Euro,
} from 'lucide-react';
import { getSupabase } from '@/lib/supabase';
import { CAMPAGNES_ALLOWED_PLANS } from '@/lib/campagnes-access';
import NoAdminScreen from '@/components/NoAdminScreen';

const STATUS_META = {
  draft:     { label: 'Brouillon',  color: 'text-content-tertiary', bg: 'bg-content-tertiary/10', icon: <Clock size={11} /> },
  scheduled: { label: 'Planifiée',  color: 'text-blue-400',         bg: 'bg-blue-500/10',          icon: <Clock size={11} /> },
  sending:   { label: 'En cours',   color: 'text-amber-600',        bg: 'bg-amber-500/10',         icon: <Send size={11} /> },
  paused:    { label: 'En pause',   color: 'text-orange-600',       bg: 'bg-orange-500/10',        icon: <Pause size={11} /> },
  sent:      { label: 'Envoyée',    color: 'text-emerald-400',      bg: 'bg-emerald-500/10',       icon: <CheckCircle2 size={11} /> },
  failed:    { label: 'Échouée',    color: 'text-red-400',          bg: 'bg-red-500/10',           icon: <XCircle size={11} /> },
};

export default function SmsHubPage() {
  const router = useRouter();
  const supabase = getSupabase();
  const [authState, setAuthState] = useState(null);
  const [currentEmail, setCurrentEmail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState([]);

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

      const res = await fetch('/api/admin/prospection/sms-campaigns');
      if (res.ok) {
        const data = await res.json();
        setCampaigns(data.campaigns || []);
      }
      setLoading(false);
    })();
  }, [router, supabase]);

  if (loading) return <CenteredSpinner />;
  if (authState === 'guest') return <GuestScreen />;
  if (authState === 'no-admin') return <NoAdminScreen email={currentEmail} signOut={async () => { await supabase.auth.signOut(); router.push('/login?return=/admin/prospection/sms'); }} />;

  const totalSpent = campaigns.reduce((s, c) => s + (Number(c.actual_cost_eur) || 0), 0);

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
              <MessageSquare size={24} className="text-emerald-400" />
              Campagnes SMS
            </h1>
            <p className="text-sm text-content-secondary mt-1">
              Envois Twilio. Coût indicatif : ~0,07 € / SMS standard (160 chars). Footer STOP ajouté automatiquement.
            </p>
          </div>
          <Link
            href="/admin/prospection/sms/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition shadow-lg shadow-emerald-500/20"
          >
            <Plus size={14} />
            Nouvelle campagne SMS
          </Link>
        </div>

        {/* Avertissement RGPD/cadre légal */}
        <div className="mb-6 rounded-2xl border border-amber-400 bg-amber-50 p-4 text-sm text-amber-700">
          <div className="flex items-start gap-2">
            <AlertTriangle size={16} className="mt-0.5 flex-shrink-0 text-amber-600" />
            <div>
              <strong className="text-amber-100">SMS B2B en France :</strong> opt-in préalable obligatoire pour les particuliers (CNIL).
              En B2B avec une <em>relation établie</em>, intérêt légitime acceptable mais opt-out obligatoire (STOP au 36111).
              Évitez d&apos;envoyer entre 20h et 8h, le dimanche et jours fériés.
            </div>
          </div>
        </div>

        {/* Total dépensé */}
        {totalSpent > 0 && (
          <div className="mb-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.04] p-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <Euro size={16} className="text-emerald-400" />
              <span className="text-content-secondary">Total dépensé en SMS :</span>
              <strong className="text-emerald-300 tabular-nums">{totalSpent.toFixed(2)} €</strong>
            </div>
            <span className="text-[11px] text-content-tertiary">Coûts réels Twilio (post-envoi).</span>
          </div>
        )}

        {campaigns.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line p-12 text-center">
            <MessageSquare size={28} className="mx-auto mb-2 text-content-tertiary opacity-50" />
            <p className="text-content-tertiary mb-1">Aucune campagne SMS. Le mobile, c&apos;est 90% de taux d&apos;ouverture.</p>
            <p className="text-xs text-content-tertiary">
              Il te faut une liste avec des mobiles FR (+33 6 / +33 7) au format E.164.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-line bg-surface-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-surface-elevated text-xs text-content-tertiary uppercase tracking-wider">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Campagne</th>
                  <th className="text-left px-4 py-3 font-semibold">Statut</th>
                  <th className="text-right px-4 py-3 font-semibold">Destinataires</th>
                  <th className="text-right px-4 py-3 font-semibold">Envoyés</th>
                  <th className="text-right px-4 py-3 font-semibold">Délivrés</th>
                  <th className="text-right px-4 py-3 font-semibold">Coût</th>
                  <th className="text-right px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c) => {
                  const meta = STATUS_META[c.status] || STATUS_META.draft;
                  const cost = Number(c.actual_cost_eur) || Number(c.estimated_cost_eur) || 0;
                  return (
                    <tr key={c.id} className="border-t border-line hover:bg-surface-elevated/50 transition group">
                      <td className="px-4 py-3">
                        <Link href={`/admin/prospection/sms/${c.id}`} className="block group-hover:text-emerald-400 transition">
                          <div className="font-semibold text-content-primary">{c.name}</div>
                          <div className="text-xs text-content-tertiary truncate max-w-md font-mono">
                            {(c.body || '').slice(0, 80)}{(c.body || '').length > 80 ? '…' : ''}
                          </div>
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium ${meta.bg} ${meta.color}`}>
                          {meta.icon}
                          {meta.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-content-secondary">{c.total_recipients || 0}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-content-secondary">{c.sent_count || 0}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-content-secondary">{c.delivered_count || 0}</td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        <span className="text-emerald-300">{cost.toFixed(2)} €</span>
                        {!c.actual_cost_eur && c.estimated_cost_eur > 0 && (
                          <div className="text-[10px] text-content-tertiary">estimé</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link href={`/admin/prospection/sms/${c.id}`} className="inline-flex items-center gap-1 text-content-tertiary group-hover:text-emerald-400 transition">
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
          <strong className="text-content-primary">Cadence Twilio :</strong> ~20 SMS toutes les 5 min (limite trunk standard).
          Pour 1 000 SMS, comptez ~4h. Coût estimé ≈ <strong>70 €</strong> (à 0,07 € / SMS standard).
        </p>
      </div>
    </div>
  );
}

function CenteredSpinner() {
  return <div className="min-h-screen bg-surface-base flex items-center justify-center text-content-secondary"><Loader2 className="animate-spin" size={20} /></div>;
}

function GuestScreen() {
  return (
    <div className="min-h-screen bg-surface-base flex items-center justify-center p-6">
      <div className="max-w-md w-full rounded-2xl border border-line bg-surface-card p-8 text-center">
        <div className="w-12 h-12 mx-auto rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center mb-4"><LogIn size={20} className="text-violet-300" /></div>
        <h1 className="text-xl font-bold mb-2">Connexion requise</h1>
        <Link href="/login?return=/admin/prospection/sms" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition"><LogIn size={14} />Se connecter</Link>
      </div>
    </div>
  );
}

// NoAdminScreen partagé — voir src/components/NoAdminScreen.jsx (QW5).
