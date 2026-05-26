'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Mail, Loader2, Send, AlertTriangle, Eye, Sparkles,
  ShieldOff, LogIn, Users, CheckCircle2, FlaskConical, X, Plus, FileText, Globe2,
} from 'lucide-react';
import { getSupabase } from '@/lib/supabase';
import { CAMPAGNES_ALLOWED_PLANS } from '@/lib/campagnes-access';
import NoAdminScreen from '@/components/NoAdminScreen';
import TemplateLibraryModal from '@/components/campagnes/TemplateLibraryModal';
import { getTemplateById } from '@/lib/email-templates';

function NewCampaignContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const presetListId = searchParams.get('list') || '';
  const presetTemplateId = searchParams.get('template') || '';
  const supabase = getSupabase();
  const [templateModalOpen, setTemplateModalOpen] = useState(false);

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
  // A/B testing — variants optionnels (legacy: 1 seul subject)
  const [abTestEnabled, setAbTestEnabled] = useState(false);
  const [subjectVariant2, setSubjectVariant2] = useState('');
  const [subjectVariant3, setSubjectVariant3] = useState('');
  const [hasVariant3, setHasVariant3] = useState(false);
  const [abTestSampleSize, setAbTestSampleSize] = useState(100);
  const [bodyHtml, setBodyHtml] = useState('');
  const [emailSenderId, setEmailSenderId] = useState(''); // '' = fallback Volia
  // Smart scheduling timezone-aware : default ON (recommandé). Quand actif, on
  // détecte la TZ de chaque destinataire (email TLD/phone) et on planifie
  // l'envoi dans la fenêtre 9h-17h heure locale (Lun-Ven). Cf lib/timezone-detector.js.
  const [smartScheduling, setSmartScheduling] = useState(true);
  const [previewMode, setPreviewMode] = useState(false);
  // Validation inline onBlur (Sprint 2 UX polish)
  const [fieldErrors, setFieldErrors] = useState({});

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
          subject_variant_2: abTestEnabled && subjectVariant2.trim() ? subjectVariant2.trim() : null,
          subject_variant_3: abTestEnabled && hasVariant3 && subjectVariant3.trim() ? subjectVariant3.trim() : null,
          ab_test_sample_size: abTestEnabled ? Number(abTestSampleSize) || 100 : 100,
          body_html: bodyHtml.trim(),
          email_sender_id: emailSenderId || null,
          smart_scheduling: smartScheduling,
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

  /**
   * Applique un template complet (subject + body) sélectionné depuis la
   * bibliothèque. Si la campagne n'a pas encore de nom, on suggère le
   * label du template pour gagner du temps.
   */
  function applyEmailTemplate(template) {
    if (!template) return;
    setSubject(template.subject || '');
    setBodyHtml(template.body_html || '');
    setName((prev) => prev || template.label || '');
    setFieldErrors((p) => ({ ...p, subject: null, bodyHtml: null }));
  }

  // Pre-fill auto via query param ?template=X (lien depuis /templates ou sidebar)
  useEffect(() => {
    if (!presetTemplateId) return;
    const tpl = getTemplateById(presetTemplateId);
    if (tpl) applyEmailTemplate(tpl);
    // Une seule fois au montage.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presetTemplateId]);

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
                  onChange={(e) => {
                    setListId(e.target.value);
                    if (fieldErrors.listId) setFieldErrors((p) => ({ ...p, listId: null }));
                  }}
                  onBlur={() => {
                    if (!listId) setFieldErrors((p) => ({ ...p, listId: 'Choisissez une liste' }));
                  }}
                  className={`w-full px-3 py-2 rounded-lg bg-surface-base border text-sm text-content-primary focus:outline-none transition ${fieldErrors.listId ? 'border-red-500/60 focus:border-red-500' : 'border-line focus:border-violet-500'}`}
                >
                  <option value="">— Sélectionner une liste —</option>
                  {lists.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name} ({l.email_count} emails{l.opt_out_count > 0 ? ` · ${l.opt_out_count} opt-out` : ''})
                    </option>
                  ))}
                </select>
                {fieldErrors.listId && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">{fieldErrors.listId}</p>
                )}
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
                      required
                      className="w-full px-3 py-2 rounded-lg bg-surface-base border border-line text-sm text-content-primary focus:outline-none focus:border-violet-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={senders.length === 0}
                    >
                      {senders.length === 0 ? (
                        <option value="">Aucun domaine vérifié — configurez-en un d&apos;abord</option>
                      ) : (
                        <>
                          <option value="">Sélectionnez un domaine d&apos;envoi…</option>
                          {senders.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.from_name ? `${s.from_name} — ` : ''}noreply@{s.domain} (vérifié)
                            </option>
                          ))}
                        </>
                      )}
                    </select>
                    {senders.length === 0 && (
                      <div className="mt-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-300 leading-relaxed">
                        <div className="flex items-start gap-2 mb-2">
                          <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
                          <strong className="text-red-200">Action requise : connectez votre domaine d&apos;envoi</strong>
                        </div>
                        <p className="ml-6 mb-2 text-red-300/90">
                          Pour des raisons de sécurité et de deliverability, vous devez envoyer vos
                          campagnes depuis VOTRE propre domaine (ex : send.votre-marque.fr).
                          Volia ne permet pas l&apos;envoi depuis le domaine partagé volia.fr —
                          chaque client a son propre domaine vérifié.
                        </p>
                        <Link
                          href="/settings/email-senders"
                          className="ml-6 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-200 font-semibold transition text-[11px]"
                        >
                          Connecter mon domaine →
                        </Link>
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
                    {/* CTA bibliothèque de templates (raccourci 1-clic) */}
                    <div className="mb-2 flex items-center justify-between gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => setTemplateModalOpen(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-300 border border-blue-500/30 hover:border-blue-500/50 text-xs font-semibold transition"
                      >
                        <FileText size={12} />
                        Choisir un template
                        <span className="hidden sm:inline text-blue-500/70 font-normal">· 20+ pré-faits</span>
                      </button>
                      <p className="text-[10px] text-content-tertiary italic">
                        Page blanche ? Pré-remplissez avec un template pro testé.
                      </p>
                    </div>

                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs text-content-tertiary">
                        {abTestEnabled ? 'Objet — Variant A' : 'Objet du mail'}
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setAbTestEnabled((v) => {
                            const next = !v;
                            if (!next) {
                              // Reset si on désactive
                              setSubjectVariant2('');
                              setSubjectVariant3('');
                              setHasVariant3(false);
                            }
                            return next;
                          });
                        }}
                        className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-medium transition ${
                          abTestEnabled
                            ? 'bg-violet-500/15 text-violet-300 border border-violet-500/40'
                            : 'bg-surface-elevated text-content-tertiary border border-line hover:border-violet-500/40'
                        }`}
                      >
                        <FlaskConical size={11} />
                        {abTestEnabled ? 'A/B test activé' : 'Activer A/B test'}
                      </button>
                    </div>
                    <input
                      type="text"
                      required maxLength={200}
                      value={subject}
                      onChange={(e) => {
                        setSubject(e.target.value);
                        if (fieldErrors.subject) setFieldErrors((p) => ({ ...p, subject: null }));
                      }}
                      onBlur={() => {
                        if (!subject.trim()) setFieldErrors((p) => ({ ...p, subject: 'Objet requis' }));
                      }}
                      placeholder="Ex : Quick question — {{company}}"
                      className={`w-full px-3 py-2 rounded-lg bg-surface-base border text-sm focus:outline-none ${fieldErrors.subject ? 'border-red-500/60 focus:border-red-500' : 'border-line focus:border-violet-500'}`}
                    />
                    {fieldErrors.subject && (
                      <p className="text-xs text-red-600 dark:text-red-400 mt-1">{fieldErrors.subject}</p>
                    )}

                    {/* A/B test — variants supplémentaires */}
                    {abTestEnabled && (
                      <div className="mt-3 space-y-2 p-3 rounded-lg bg-violet-500/[0.04] border border-violet-500/20">
                        <div>
                          <label className="block text-xs text-content-tertiary mb-1.5">Variant B</label>
                          <input
                            type="text"
                            maxLength={200}
                            value={subjectVariant2}
                            onChange={(e) => setSubjectVariant2(e.target.value)}
                            placeholder="Ex : {{first_name}}, 5 min ?"
                            className="w-full px-3 py-2 rounded-lg bg-surface-base border border-line text-sm focus:outline-none focus:border-violet-500"
                          />
                        </div>

                        {hasVariant3 ? (
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <label className="block text-xs text-content-tertiary">Variant C</label>
                              <button
                                type="button"
                                onClick={() => { setHasVariant3(false); setSubjectVariant3(''); }}
                                className="inline-flex items-center gap-1 text-[10px] text-content-tertiary hover:text-red-400 transition"
                              >
                                <X size={11} />
                                Retirer
                              </button>
                            </div>
                            <input
                              type="text"
                              maxLength={200}
                              value={subjectVariant3}
                              onChange={(e) => setSubjectVariant3(e.target.value)}
                              placeholder="Ex : Une idée pour {{company}}"
                              className="w-full px-3 py-2 rounded-lg bg-surface-base border border-line text-sm focus:outline-none focus:border-violet-500"
                            />
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setHasVariant3(true)}
                            className="inline-flex items-center gap-1 text-[11px] text-violet-400 hover:text-violet-300 transition"
                          >
                            <Plus size={11} />
                            Ajouter variant C (optionnel)
                          </button>
                        )}

                        <div className="pt-2 mt-2 border-t border-violet-500/10">
                          <label className="block text-xs text-content-tertiary mb-1.5">
                            Taille de l&apos;échantillon (split avant pick du winner)
                          </label>
                          <input
                            type="number"
                            min={10}
                            max={10000}
                            value={abTestSampleSize}
                            onChange={(e) => setAbTestSampleSize(e.target.value)}
                            className="w-32 px-3 py-2 rounded-lg bg-surface-base border border-line text-sm focus:outline-none focus:border-violet-500 tabular-nums"
                          />
                          <p className="text-[10px] text-content-tertiary mt-1">
                            Volia split équitablement les {abTestSampleSize || 100} premiers envois, puis bascule
                            automatiquement sur le variant qui a le meilleur taux d&apos;ouverture.
                          </p>
                        </div>
                      </div>
                    )}

                    <p className="text-[10px] text-content-tertiary mt-1.5">
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
                  <button
                    type="button"
                    onClick={() => setTemplateModalOpen(true)}
                    className="ml-auto inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] bg-blue-500/10 border border-blue-500/30 text-blue-600 dark:text-blue-300 hover:bg-blue-500/20 transition"
                  >
                    <FileText size={11} />
                    Bibliothèque (20+)
                  </button>
                </div>
                <textarea
                  required
                  rows={14}
                  value={bodyHtml}
                  onChange={(e) => {
                    setBodyHtml(e.target.value);
                    if (fieldErrors.bodyHtml) setFieldErrors((p) => ({ ...p, bodyHtml: null }));
                  }}
                  onBlur={() => {
                    if (!bodyHtml.trim()) setFieldErrors((p) => ({ ...p, bodyHtml: 'Corps du message requis' }));
                  }}
                  placeholder="<p>Bonjour {{first_name}},</p>..."
                  className={`w-full px-3 py-2 rounded-lg bg-surface-base border text-sm font-mono text-content-primary focus:outline-none transition resize-y ${fieldErrors.bodyHtml ? 'border-red-500/60 focus:border-red-500' : 'border-line focus:border-violet-500'}`}
                />
                {fieldErrors.bodyHtml && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">{fieldErrors.bodyHtml}</p>
                )}
                <p className="text-[10px] text-content-tertiary mt-1.5">
                  Le footer RGPD (lien désabonnement 1 clic) sera ajouté automatiquement à l&apos;envoi.
                </p>
              </Block>

              {/* Bloc Smart scheduling timezone */}
              <Block title="4. Planification intelligente" icon={<Globe2 size={14} />}>
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={smartScheduling}
                    onChange={(e) => setSmartScheduling(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-line bg-surface-base text-violet-600 focus:ring-violet-500 focus:ring-offset-0 cursor-pointer"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-content-primary flex items-center gap-2">
                      Envoyer dans la fenêtre 9h-17h heure du destinataire
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-semibold uppercase tracking-wider">
                        Recommandé
                      </span>
                    </div>
                    <p className="text-xs text-content-tertiary mt-1 leading-relaxed">
                      Augmente les taux d&apos;ouverture de ~20% en moyenne. Volia détecte la timezone
                      via le domaine email (.fr, .de, .com…) ou l&apos;indicatif téléphone (+33, +1, +49…)
                      et planifie chaque envoi du lundi au vendredi, dans la fenêtre 9h-17h locale.
                      Sans option, tous les emails partent dès que le cron passe — peu importe l&apos;heure
                      côté destinataire.
                    </p>
                  </div>
                </label>
              </Block>

              <div className="flex items-center gap-2 justify-end pt-2">
                <Link href="/admin/prospection/campaigns" className="px-3 py-2 rounded-lg text-sm text-content-secondary hover:text-content-primary transition">
                  Annuler
                </Link>
                <button
                  type="submit"
                  disabled={
                    submitting ||
                    !listId ||
                    !name.trim() ||
                    !subject.trim() ||
                    !bodyHtml.trim() ||
                    (abTestEnabled && !subjectVariant2.trim()) ||
                    (abTestEnabled && hasVariant3 && !subjectVariant3.trim())
                  }
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

      {/* Bibliothèque de templates email — modal global */}
      <TemplateLibraryModal
        open={templateModalOpen}
        onClose={() => setTemplateModalOpen(false)}
        onSelect={applyEmailTemplate}
      />
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

// NoAdminScreen partagé — voir src/components/NoAdminScreen.jsx (QW5).
