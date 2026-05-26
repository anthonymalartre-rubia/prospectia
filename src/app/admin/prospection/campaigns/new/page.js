'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Mail, Loader2, Send, AlertTriangle, Eye, Sparkles,
  ShieldOff, LogIn, Users, CheckCircle2,
} from 'lucide-react';
import { getSupabase } from '@/lib/supabase';

function NewCampaignContent() {
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

  // Form state
  const [listId, setListId] = useState(presetListId);
  const [name, setName] = useState('');
  const [fromName, setFromName] = useState('Volia');
  const [fromEmail, setFromEmail] = useState('hello@volia.fr');
  const [replyTo, setReplyTo] = useState('');
  const [subject, setSubject] = useState('');
  const [bodyHtml, setBodyHtml] = useState('');
  const [emailSenderId, setEmailSenderId] = useState(''); // '' = fallback Volia
  const [previewMode, setPreviewMode] = useState(false);

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

      // Charge l'email réel + les listes + les senders vérifiés
      setReplyTo(user.email);
      const [listsRes, sendersRes] = await Promise.all([
        fetch('/api/admin/prospection/lists'),
        fetch('/api/email-senders').catch(() => null),
      ]);
      if (listsRes.ok) {
        const data = await listsRes.json();
        setLists(data.lists || []);
      }
      if (sendersRes && sendersRes.ok) {
        const data = await sendersRes.json();
        // On ne propose dans le dropdown que les senders status='verified'
        const verified = (data.senders || data.email_senders || []).filter(
          (s) => s.status === 'verified'
        );
        setSenders(verified);
      }
      setLoading(false);
    })();
  }, [supabase]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/prospection/email-campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          list_id: listId,
          name: name.trim(),
          from_name: fromName.trim(),
          from_email: fromEmail.trim(),
          reply_to: replyTo.trim() || null,
          subject: subject.trim(),
          body_html: bodyHtml.trim(),
          email_sender_id: emailSenderId || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Erreur création campagne');
        setSubmitting(false);
        return;
      }
      router.push(`/admin/prospection/campaigns/${data.campaign.id}`);
    } catch {
      setError('Erreur réseau');
      setSubmitting(false);
    }
  }

  function insertVar(v) {
    setBodyHtml((html) => html + v);
  }

  function loadTemplate() {
    setSubject('Quick question — {{company}}');
    setBodyHtml(
`<p>Bonjour {{first_name}},</p>

<p>Je viens de tomber sur {{company}} et j'ai pensé à vous écrire.</p>

<p>Nous aidons les boîtes B2B en France à <strong>générer 3× plus de RDV qualifiés</strong> sans agence ni SDR — directement depuis leur CRM.</p>

<p>Si c'est un sujet pour vous en ce moment, je peux vous envoyer une démo de 8 minutes ?</p>

<p>À très vite,<br>
Anthony</p>

<p style="font-size:12px;color:#888;">PS — pas pour vous ? Désolé pour le bruit, je vous laisse tranquille.</p>`
    );
  }

  const selectedList = lists.find((l) => l.id === listId);
  const totalRecipients = selectedList
    ? Math.max(0, (selectedList.email_count || 0) - (selectedList.opt_out_count || 0))
    : 0;

  // Aperçu : remplace les variables par des valeurs exemple
  const previewSubject = subject
    .replace(/\{\{\s*first_name\s*\}\}/g, 'Anthony')
    .replace(/\{\{\s*last_name\s*\}\}/g, 'Malartre')
    .replace(/\{\{\s*company\s*\}\}/g, 'Acme SAS')
    .replace(/\{\{\s*position_title\s*\}\}/g, 'CEO');
  const previewBody = bodyHtml
    .replace(/\{\{\s*first_name\s*\}\}/g, 'Anthony')
    .replace(/\{\{\s*last_name\s*\}\}/g, 'Malartre')
    .replace(/\{\{\s*company\s*\}\}/g, 'Acme SAS')
    .replace(/\{\{\s*position_title\s*\}\}/g, 'CEO');

  if (loading) return <CenteredSpinner />;
  if (authState === 'guest') return <GuestScreen />;
  if (authState === 'no-admin') return <NoAdminScreen email={currentEmail} signOut={async () => { await supabase.auth.signOut(); router.push('/login?return=/admin/prospection/campaigns/new'); }} />;

  return (
    <div className="min-h-screen bg-surface-base text-content-primary p-4 sm:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <Link href="/admin/prospection/campaigns" className="inline-flex items-center gap-2 text-sm text-content-tertiary hover:text-violet-400 transition mb-2">
            <ArrowLeft size={14} />
            Campagnes
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <Mail size={24} className="text-violet-400" />
            Nouvelle campagne email
          </h1>
          <p className="text-sm text-content-secondary mt-1">
            Brouillon, vous pourrez prévisualiser puis envoyer depuis la page suivante.
          </p>
        </div>

        {lists.length === 0 ? (
          <div className="rounded-2xl border border-amber-400 bg-amber-50 p-6 text-center">
            <AlertTriangle size={20} className="mx-auto mb-2 text-amber-600" />
            <p className="text-sm text-amber-700 mb-3">
              Vous n&apos;avez aucune liste de prospects. Créez-en une et importez votre CSV pour commencer.
            </p>
            <Link href="/admin/prospection" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition">
              <Users size={14} />
              Aller aux listes
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Colonne formulaire */}
            <div className="lg:col-span-2 space-y-6">
              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-300 flex items-start gap-2">
                  <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
                  {error}
                </div>
              )}

              {/* Bloc Liste */}
              <Block title="1. Audience" icon={<Users size={14} />}>
                <label className="block text-xs text-content-tertiary mb-1.5">Liste de destinataires</label>
                <select
                  required
                  value={listId}
                  onChange={(e) => setListId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-surface-base border border-line text-sm text-content-primary focus:outline-none focus:border-violet-500 transition"
                >
                  <option value="">— Sélectionner une liste —</option>
                  {lists.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name} ({l.email_count} emails{l.opt_out_count > 0 ? ` · ${l.opt_out_count} opt-out` : ''})
                    </option>
                  ))}
                </select>
                {selectedList && (
                  <div className="mt-2 inline-flex items-center gap-1.5 text-xs text-emerald-400">
                    <CheckCircle2 size={11} />
                    <strong className="tabular-nums">{totalRecipients}</strong> destinataires (après exclusion des opt-out)
                  </div>
                )}
              </Block>

              {/* Bloc Métadonnées */}
              <Block title="2. Identité & objet" icon={<Send size={14} />}>
                <div className="space-y-3">
                  {/* Dropdown sender multi-tenant (soft migration : option par défaut = Volia) */}
                  <div>
                    <label className="block text-xs text-content-tertiary mb-1.5">
                      Envoyer depuis
                    </label>
                    <select
                      value={emailSenderId}
                      onChange={(e) => setEmailSenderId(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-surface-base border border-line text-sm text-content-primary focus:outline-none focus:border-violet-500 transition"
                    >
                      <option value="">Sender par défaut Volia (hello@volia.fr)</option>
                      {senders.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.from_name ? `${s.from_name} — ` : ''}noreply@{s.domain} (vérifié)
                        </option>
                      ))}
                    </select>
                    {senders.length === 0 && (
                      <div className="mt-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-300 leading-relaxed flex items-start gap-2">
                        <AlertTriangle size={12} className="mt-0.5 flex-shrink-0" />
                        <span>
                          Aucun domaine vérifié. Configurez votre domaine d&apos;envoi pour une meilleure deliverability →{' '}
                          <Link href="/settings/email-senders" className="underline font-semibold hover:text-amber-200">
                            /settings/email-senders
                          </Link>
                        </span>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs text-content-tertiary mb-1.5">Nom interne (jamais affiché aux destinataires)</label>
                    <input
                      type="text"
                      required maxLength={120}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ex : Lancement SaaS Paris — Mai 2026"
                      className="w-full px-3 py-2 rounded-lg bg-surface-base border border-line text-sm focus:outline-none focus:border-violet-500"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-content-tertiary mb-1.5">Nom expéditeur (From)</label>
                      <input
                        type="text"
                        required
                        value={fromName}
                        onChange={(e) => setFromName(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-surface-base border border-line text-sm focus:outline-none focus:border-violet-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-content-tertiary mb-1.5">Email expéditeur</label>
                      <input
                        type="email"
                        required
                        value={fromEmail}
                        onChange={(e) => setFromEmail(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-surface-base border border-line text-sm focus:outline-none focus:border-violet-500"
                      />
                      <p className="text-[10px] text-content-tertiary mt-1">
                        Domaine volia.fr vérifié sur Resend.
                      </p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-content-tertiary mb-1.5">Reply-To (où arrivent les réponses)</label>
                    <input
                      type="email"
                      value={replyTo}
                      onChange={(e) => setReplyTo(e.target.value)}
                      placeholder="votre.email@example.com"
                      className="w-full px-3 py-2 rounded-lg bg-surface-base border border-line text-sm focus:outline-none focus:border-violet-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-content-tertiary mb-1.5">Objet du mail</label>
                    <input
                      type="text"
                      required maxLength={200}
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Ex : Quick question — {{company}}"
                      className="w-full px-3 py-2 rounded-lg bg-surface-base border border-line text-sm focus:outline-none focus:border-violet-500"
                    />
                    <p className="text-[10px] text-content-tertiary mt-1">
                      Variables dispo : <code>{`{{first_name}}`}</code>, <code>{`{{last_name}}`}</code>, <code>{`{{company}}`}</code>, <code>{`{{position_title}}`}</code>, <code>{`{{custom.X}}`}</code>
                    </p>
                  </div>
                </div>
              </Block>

              {/* Bloc Corps */}
              <Block title="3. Corps du message (HTML)" icon={<Mail size={14} />}>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <button type="button" onClick={() => insertVar('{{first_name}}')} className="px-2 py-1 rounded text-[11px] bg-surface-elevated border border-line hover:border-violet-500 transition">{`+ {{first_name}}`}</button>
                  <button type="button" onClick={() => insertVar('{{company}}')} className="px-2 py-1 rounded text-[11px] bg-surface-elevated border border-line hover:border-violet-500 transition">{`+ {{company}}`}</button>
                  <button type="button" onClick={() => insertVar('{{position_title}}')} className="px-2 py-1 rounded text-[11px] bg-surface-elevated border border-line hover:border-violet-500 transition">{`+ {{position_title}}`}</button>
                  <button type="button" onClick={loadTemplate} className="ml-auto inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] bg-violet-500/10 border border-violet-500/30 text-violet-300 hover:bg-violet-500/20 transition">
                    <Sparkles size={11} />
                    Charger template cold email
                  </button>
                </div>
                <textarea
                  required
                  rows={14}
                  value={bodyHtml}
                  onChange={(e) => setBodyHtml(e.target.value)}
                  placeholder="<p>Bonjour {{first_name}},</p>..."
                  className="w-full px-3 py-2 rounded-lg bg-surface-base border border-line text-sm font-mono text-content-primary focus:outline-none focus:border-violet-500 transition resize-y"
                />
                <p className="text-[10px] text-content-tertiary mt-1.5">
                  Le footer RGPD (lien désabonnement 1 clic) sera ajouté automatiquement à l&apos;envoi.
                </p>
              </Block>

              <div className="flex items-center gap-2 justify-end pt-2">
                <Link href="/admin/prospection/campaigns" className="px-3 py-2 rounded-lg text-sm text-content-secondary hover:text-content-primary transition">
                  Annuler
                </Link>
                <button
                  type="submit"
                  disabled={submitting || !listId || !name.trim() || !subject.trim() || !bodyHtml.trim()}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-semibold transition shadow-lg shadow-violet-500/20"
                >
                  {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  Créer le brouillon
                </button>
              </div>
            </div>

            {/* Colonne aperçu sticky */}
            <div className="lg:col-span-1">
              <div className="lg:sticky lg:top-6 rounded-2xl border border-line bg-surface-card overflow-hidden">
                <div className="px-4 py-3 border-b border-line bg-surface-elevated flex items-center justify-between">
                  <div className="text-xs font-semibold uppercase tracking-wider text-content-tertiary flex items-center gap-1.5">
                    <Eye size={12} />
                    Aperçu
                  </div>
                  <span className="text-[10px] text-content-tertiary">avec variables remplacées</span>
                </div>
                <div className="p-4 text-xs">
                  <div className="space-y-1.5 mb-3 pb-3 border-b border-line">
                    <div><span className="text-content-tertiary">De :</span> <strong>{fromName || 'Volia'}</strong> &lt;{fromEmail || 'hello@volia.fr'}&gt;</div>
                    {replyTo && <div><span className="text-content-tertiary">Reply-To :</span> {replyTo}</div>}
                    <div><span className="text-content-tertiary">Objet :</span> <strong>{previewSubject || <em className="text-content-tertiary">(vide)</em>}</strong></div>
                  </div>
                  <div
                    className="prose prose-sm prose-invert max-w-none [&_p]:my-2 [&_a]:text-violet-400 text-content-secondary"
                    dangerouslySetInnerHTML={{ __html: previewBody || '<em style="color:#666">(corps vide)</em>' }}
                  />
                  <div className="mt-4 pt-3 border-t border-dashed border-line">
                    <p className="text-[10px] text-content-tertiary italic">
                      [Footer RGPD ajouté à l&apos;envoi : « Vous recevez ce mail car… Se désabonner en 1 clic »]
                    </p>
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
      <NewCampaignContent />
    </Suspense>
  );
}

function Block({ title, icon, children }) {
  return (
    <section className="rounded-2xl border border-line bg-surface-card p-5">
      <h2 className="text-sm font-semibold text-content-primary mb-3 flex items-center gap-2">
        <span className="text-violet-400">{icon}</span>
        {title}
      </h2>
      {children}
    </section>
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
        <Link href="/login?return=/admin/prospection/campaigns/new" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition">
          <LogIn size={14} />
          Se connecter
        </Link>
      </div>
    </div>
  );
}

function NoAdminScreen({ email, signOut }) {
  return (
    <div className="min-h-screen bg-surface-base flex items-center justify-center p-6">
      <div className="max-w-md w-full rounded-2xl border border-amber-400 bg-amber-50 p-8 text-center">
        <div className="w-12 h-12 mx-auto rounded-xl bg-amber-100 border border-amber-400 flex items-center justify-center mb-4">
          <ShieldOff size={20} className="text-amber-700" />
        </div>
        <h1 className="text-xl font-bold mb-2">Accès admin requis</h1>
        <p className="text-sm text-content-secondary mb-2">Connecté en tant que <strong>{email}</strong>, mais ce compte n&apos;a pas les droits.</p>
        <button onClick={signOut} className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition">
          <LogIn size={14} />
          Changer de compte
        </button>
      </div>
    </div>
  );
}
