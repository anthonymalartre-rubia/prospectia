'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, MessageSquare, Loader2, Send, AlertTriangle, ShieldOff, LogIn,
  Users, CheckCircle2, Sparkles, Euro, Hash,
} from 'lucide-react';
import { getSupabase } from '@/lib/supabase';
import { countSmsSegments, estimateSmsCostEur, appendSmsOptOutFooter } from '@/lib/sms';

function NewSmsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const presetListId = searchParams.get('list') || '';
  const supabase = getSupabase();

  const [authState, setAuthState] = useState(null);
  const [currentEmail, setCurrentEmail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lists, setLists] = useState([]);
  const [senders, setSenders] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [listId, setListId] = useState(presetListId);
  const [name, setName] = useState('');
  const [senderName, setSenderName] = useState('');
  const [body, setBody] = useState('');
  const [smsSenderId, setSmsSenderId] = useState(''); // '' = fallback Volia managed

  useEffect(() => {
    (async () => {
      if (!supabase) { setLoading(false); return; }
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setAuthState('guest'); setLoading(false); return; }
      setCurrentEmail(user.email);

      const { data: profile } = await supabase
        .from('user_profiles').select('is_admin').eq('id', user.id).maybeSingle();
      if (!profile?.is_admin) { setAuthState('no-admin'); setLoading(false); return; }
      setAuthState('ok');

      const [listsRes, sendersRes] = await Promise.all([
        fetch('/api/admin/prospection/lists'),
        fetch('/api/sms-senders').catch(() => null),
      ]);
      if (listsRes.ok) {
        const data = await listsRes.json();
        setLists(data.lists || []);
      }
      if (sendersRes && sendersRes.ok) {
        const data = await sendersRes.json();
        const verified = (data.senders || data.sms_senders || []).filter(
          (s) => s.status === 'verified'
        );
        setSenders(verified);
      }
      setLoading(false);
    })();
  }, [supabase]);

  const selectedList = lists.find((l) => l.id === listId);
  const totalRecipients = selectedList
    ? Math.max(0, (selectedList.phone_count || 0) - (selectedList.opt_out_count || 0))
    : 0;

  // Compteur live segments + coût
  const fullPreview = useMemo(() => {
    const sample = body
      .replace(/\{\{\s*first_name\s*\}\}/g, 'Anthony')
      .replace(/\{\{\s*company\s*\}\}/g, 'Acme');
    return appendSmsOptOutFooter(sample);
  }, [body]);
  const segments = countSmsSegments(fullPreview);
  const costPerRecipient = estimateSmsCostEur(fullPreview);
  const totalCost = (costPerRecipient * totalRecipients).toFixed(2);

  async function handleSubmit(e) {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/prospection/sms-campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          list_id: listId,
          name: name.trim(),
          sender_name: senderName.trim() || null,
          body: body.trim(),
          sms_sender_id: smsSenderId || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Erreur création campagne SMS');
        setSubmitting(false);
        return;
      }
      router.push(`/admin/prospection/sms/${data.campaign.id}`);
    } catch {
      setError('Erreur réseau');
      setSubmitting(false);
    }
  }

  function loadTemplate() {
    setBody('Bonjour {{first_name}}, ici Anthony de Volia. On vient de sortir un outil qui aide {{company}} à trouver 3x plus de prospects B2B en 5 min. Démo 10 min ? Répondez OUI.');
  }

  if (loading) return <CenteredSpinner />;
  if (authState === 'guest') return <GuestScreen />;
  if (authState === 'no-admin') return <NoAdminScreen email={currentEmail} signOut={async () => { await supabase.auth.signOut(); router.push('/login?return=/admin/prospection/sms/new'); }} />;

  return (
    <div className="min-h-screen bg-surface-base text-content-primary p-4 sm:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <Link href="/admin/prospection/sms" className="inline-flex items-center gap-2 text-sm text-content-tertiary hover:text-emerald-400 transition mb-2">
            <ArrowLeft size={14} />
            Campagnes SMS
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <MessageSquare size={24} className="text-emerald-400" />
            Nouvelle campagne SMS
          </h1>
          <p className="text-sm text-content-secondary mt-1">
            Footer STOP ajouté automatiquement. Mobile FR uniquement (+33 6 / +33 7).
          </p>
        </div>

        {lists.length === 0 ? (
          <div className="rounded-2xl border border-amber-400 bg-amber-50 p-6 text-center">
            <AlertTriangle size={20} className="mx-auto mb-2 text-amber-600" />
            <p className="text-sm text-amber-700 mb-3">Aucune liste. Importez d&apos;abord des contacts avec numéros mobiles.</p>
            <Link href="/admin/prospection" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition">
              <Users size={14} />
              Aller aux listes
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-300 flex items-start gap-2">
                  <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
                  {error}
                </div>
              )}

              <Block title="1. Audience" icon={<Users size={14} />}>
                <label className="block text-xs text-content-tertiary mb-1.5">Liste (numéros mobiles FR uniquement)</label>
                <select required value={listId} onChange={(e) => setListId(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-surface-base border border-line text-sm focus:outline-none focus:border-emerald-500 transition">
                  <option value="">— Sélectionner une liste —</option>
                  {lists.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name} ({l.phone_count} numéros{l.opt_out_count > 0 ? ` · ${l.opt_out_count} opt-out` : ''})
                    </option>
                  ))}
                </select>
                {selectedList && (
                  <div className="mt-2 inline-flex items-center gap-1.5 text-xs text-emerald-400">
                    <CheckCircle2 size={11} />
                    <strong className="tabular-nums">{totalRecipients}</strong> destinataires éligibles (après opt-out)
                  </div>
                )}
              </Block>

              <Block title="2. Identité" icon={<Send size={14} />}>
                {/* Dropdown sender SMS multi-tenant (soft migration : default = Volia managed) */}
                <div className="mb-3">
                  <label className="block text-xs text-content-tertiary mb-1.5">
                    Envoyer depuis
                  </label>
                  <select
                    value={smsSenderId}
                    onChange={(e) => setSmsSenderId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-surface-base border border-line text-sm text-content-primary focus:outline-none focus:border-emerald-500 transition"
                  >
                    <option value="">Numéro Volia managé (par défaut)</option>
                    {senders.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.phone_number} {s.type === 'byo' ? '(BYO)' : '(Volia)'}
                      </option>
                    ))}
                  </select>
                  {senders.length === 0 && (
                    <div className="mt-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-300 leading-relaxed flex items-start gap-2">
                      <AlertTriangle size={12} className="mt-0.5 flex-shrink-0" />
                      <span>
                        Aucun numéro SMS vérifié. Configurez votre propre numéro pour une meilleure deliverability →{' '}
                        <Link href="/settings/sms-senders" className="underline font-semibold hover:text-amber-200">
                          /settings/sms-senders
                        </Link>
                      </span>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-content-tertiary mb-1.5">Nom interne</label>
                    <input
                      type="text" required maxLength={120}
                      value={name} onChange={(e) => setName(e.target.value)}
                      placeholder="Ex : Relance webinar — mai 2026"
                      className="w-full px-3 py-2 rounded-lg bg-surface-base border border-line text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-content-tertiary mb-1.5">
                      Sender ID alphanumérique (optionnel, 11 chars max)
                    </label>
                    <input
                      type="text" maxLength={11}
                      value={senderName} onChange={(e) => setSenderName(e.target.value)}
                      placeholder="Ex : Volia"
                      className="w-full px-3 py-2 rounded-lg bg-surface-base border border-line text-sm focus:outline-none focus:border-emerald-500"
                    />
                    <p className="text-[10px] text-content-tertiary mt-1">
                      Affichage dans l&apos;app SMS du destinataire. Non supporté en FR sans déclaration ARCEP — laissez vide pour utiliser le numéro Twilio par défaut.
                    </p>
                  </div>
                </div>
              </Block>

              <Block title="3. Message" icon={<MessageSquare size={14} />}>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <button type="button" onClick={() => setBody((b) => b + '{{first_name}}')} className="px-2 py-1 rounded text-[11px] bg-surface-elevated border border-line hover:border-emerald-500 transition">{`+ {{first_name}}`}</button>
                  <button type="button" onClick={() => setBody((b) => b + '{{company}}')} className="px-2 py-1 rounded text-[11px] bg-surface-elevated border border-line hover:border-emerald-500 transition">{`+ {{company}}`}</button>
                  <button type="button" onClick={loadTemplate} className="ml-auto inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 transition">
                    <Sparkles size={11} />
                    Charger template prospection
                  </button>
                </div>
                <textarea
                  required rows={6}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Bonjour {{first_name}}, ..."
                  className="w-full px-3 py-2 rounded-lg bg-surface-base border border-line text-sm font-mono focus:outline-none focus:border-emerald-500 transition resize-y"
                />
                <p className="text-[10px] text-content-tertiary mt-1.5">
                  Le footer <code>STOP au 36111 pour ne plus recevoir.</code> sera ajouté automatiquement (compte dans les segments !).
                </p>
              </Block>

              <div className="flex items-center gap-2 justify-end pt-2">
                <Link href="/admin/prospection/sms" className="px-3 py-2 rounded-lg text-sm text-content-secondary hover:text-content-primary transition">Annuler</Link>
                <button
                  type="submit"
                  disabled={submitting || !listId || !name.trim() || !body.trim()}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-semibold transition shadow-lg shadow-emerald-500/20"
                >
                  {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  Créer le brouillon
                </button>
              </div>
            </div>

            {/* Sidebar : compteur live + aperçu mobile */}
            <div className="lg:col-span-1 space-y-4">
              <div className="lg:sticky lg:top-6 space-y-4">
                {/* Compteur */}
                <div className="rounded-2xl border border-line bg-surface-card p-4">
                  <div className="text-xs font-semibold uppercase tracking-wider text-content-tertiary mb-3">
                    Coût et segments
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <Metric icon={<Hash size={12} />} label="Caractères" value={fullPreview.length} />
                    <Metric icon={<Hash size={12} />} label="Segments" value={segments} warn={segments > 1} />
                    <Metric icon={<Euro size={12} />} label="/ SMS" value={`${costPerRecipient.toFixed(4)} €`} small />
                    <Metric icon={<Euro size={12} />} label="Total estimé" value={`${totalCost} €`} highlight />
                  </div>
                  {segments > 1 && (
                    <p className="text-[10px] text-amber-700 leading-relaxed">
                      ⚠ Message multi-segments ({segments} parts). Chaque part facturée séparément. Réduisez à 160 chars pour 1 segment.
                    </p>
                  )}
                </div>

                {/* Aperçu mobile */}
                <div className="rounded-2xl border border-line bg-surface-card p-4">
                  <div className="text-xs font-semibold uppercase tracking-wider text-content-tertiary mb-3">
                    Aperçu mobile
                  </div>
                  <div className="rounded-xl bg-surface-elevated border border-line p-3 max-w-[260px] mx-auto">
                    <div className="text-[10px] font-semibold text-content-tertiary mb-1">{senderName || 'Twilio +33...'}</div>
                    <div className="rounded-xl bg-emerald-600/20 border border-emerald-500/30 p-2.5 text-xs whitespace-pre-wrap break-words text-content-primary leading-relaxed">
                      {fullPreview || <em className="text-content-tertiary">(message vide)</em>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<CenteredSpinner />}>
      <NewSmsContent />
    </Suspense>
  );
}

function Block({ title, icon, children }) {
  return (
    <section className="rounded-2xl border border-line bg-surface-card p-5">
      <h2 className="text-sm font-semibold text-content-primary mb-3 flex items-center gap-2">
        <span className="text-emerald-400">{icon}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Metric({ icon, label, value, warn = false, highlight = false, small = false }) {
  return (
    <div className={`rounded-lg px-2.5 py-2 ${highlight ? 'bg-emerald-500/10 border border-emerald-500/30' : warn ? 'bg-amber-500/10 border border-amber-400' : 'bg-surface-elevated border border-line'}`}>
      <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-content-tertiary">
        {icon}
        {label}
      </div>
      <div className={`${small ? 'text-xs' : 'text-sm'} font-mono font-semibold tabular-nums ${highlight ? 'text-emerald-300' : warn ? 'text-amber-700' : 'text-content-primary'}`}>
        {value}
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
        <h1 className="text-xl font-bold mb-2">Connexion requise</h1>
        <Link href="/login?return=/admin/prospection/sms/new" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition"><LogIn size={14} />Se connecter</Link>
      </div>
    </div>
  );
}

function NoAdminScreen({ email, signOut }) {
  return (
    <div className="min-h-screen bg-surface-base flex items-center justify-center p-6">
      <div className="max-w-md w-full rounded-2xl border border-amber-400 bg-amber-50 p-8 text-center">
        <h1 className="text-xl font-bold mb-2">Accès admin requis</h1>
        <p className="text-sm text-content-secondary mb-2">Connecté en tant que <strong>{email}</strong>.</p>
        <button onClick={signOut} className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition"><LogIn size={14} />Changer de compte</button>
      </div>
    </div>
  );
}
