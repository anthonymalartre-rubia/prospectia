'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, ArrowRight, Mail, Loader2, Send, AlertTriangle, Eye, Sparkles,
  LogIn, Users, CheckCircle2, FlaskConical, X, Plus, FileText, Globe2,
  Calendar, ChevronDown, ChevronUp, Settings2, Check,
} from 'lucide-react';
import { getSupabase } from '@/lib/supabase';
import { CAMPAGNES_ALLOWED_PLANS } from '@/lib/campagnes-access';
import NoAdminScreen from '@/components/NoAdminScreen';
import TemplateLibraryModal from '@/components/campagnes/TemplateLibraryModal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { getTemplateById } from '@/lib/email-templates';

/**
 * Wizard 3 étapes pour la création de campagne email.
 *
 * Architecture :
 *  - Step 1 : Destinataires & expéditeur (liste + sender + nom interne)
 *  - Step 2 : Message (subject + body + A/B testing collapsable)
 *  - Step 3 : Options & lancement (smart scheduling + options avancées + preview + send)
 *
 * Pourquoi un wizard et pas un single screen :
 *  - 14+ champs sur 1 page écrasent l'utilisateur Pro qui découvre le module
 *  - Time-to-first-send objectif < 5 min (vs ~15 min auparavant)
 *  - Progressive disclosure : Reply-to / From name custom collapsés
 *
 * Fix P0 #3 (double-envoi) :
 *  - `submitting` désactive les CTA pendant l'appel
 *  - redirect immédiat vers /campaigns/[id] après succès → impossible de re-cliquer
 */
function NewCampaignContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const presetListId = searchParams.get('list') || '';
  const presetTemplateId = searchParams.get('template') || '';
  const presetStep = Number(searchParams.get('step')) || 1;
  const supabase = getSupabase();
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [confirmExitOpen, setConfirmExitOpen] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [authState, setAuthState] = useState(null);
  const [currentEmail, setCurrentEmail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lists, setLists] = useState([]);
  const [senders, setSenders] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Wizard state
  const [currentStep, setCurrentStep] = useState(Math.min(Math.max(presetStep, 1), 3));
  // Default scheduling : "Envoyer maintenant" — on switche en mode planifié
  // dès que l'utilisateur clique "Planifier l'envoi" (datetime-local picker).
  const [sendMode, setSendMode] = useState('now'); // 'now' | 'scheduled'
  const [scheduledAt, setScheduledAt] = useState('');
  const [previewVariant, setPreviewVariant] = useState('A'); // A | B | C

  // Form state
  const [listId, setListId] = useState(presetListId);
  const [name, setName] = useState('');
  const [fromName, setFromName] = useState('Volia');
  const [fromEmail, setFromEmail] = useState('hello@volia.fr');
  const [replyTo, setReplyTo] = useState('');
  const [subject, setSubject] = useState('');
  // A/B testing
  const [abTestEnabled, setAbTestEnabled] = useState(false);
  const [subjectVariant2, setSubjectVariant2] = useState('');
  const [subjectVariant3, setSubjectVariant3] = useState('');
  const [hasVariant3, setHasVariant3] = useState(false);
  const [abTestSampleSize, setAbTestSampleSize] = useState(100);
  const [bodyHtml, setBodyHtml] = useState('');
  const [emailSenderId, setEmailSenderId] = useState('');
  // Smart scheduling timezone-aware : default ON.
  const [smartScheduling, setSmartScheduling] = useState(true);
  const [fieldErrors, setFieldErrors] = useState({});

  // Default auto pour le nom interne ("Campagne du DD/MM HH:MM").
  // Calculé une seule fois au montage pour éviter de re-générer à chaque render.
  const autoName = useMemo(() => {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `Campagne du ${pad(d.getDate())}/${pad(d.getMonth() + 1)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }, []);

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
        const verified = (data.senders || data.email_senders || []).filter(
          (s) => s.status === 'verified'
        );
        setSenders(verified);
        // Pré-sélection auto si un seul sender vérifié → -1 clic.
        if (verified.length === 1) setEmailSenderId(verified[0].id);
      }
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  // Dès qu'un sender est sélectionné, on adopte son from_name si l'utilisateur
  // n'a pas explicitement modifié le champ — cohérence visuelle dans le preview.
  useEffect(() => {
    if (!emailSenderId) return;
    const s = senders.find((x) => x.id === emailSenderId);
    if (s?.from_name && fromName === 'Volia') setFromName(s.from_name);
  }, [emailSenderId, senders, fromName]);

  // Pre-fill auto via query param ?template=X
  useEffect(() => {
    if (!presetTemplateId) return;
    const tpl = getTemplateById(presetTemplateId);
    if (tpl) applyEmailTemplate(tpl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presetTemplateId]);

  // Sync URL ?step= sans push history (replace) pour éviter d'empiler des entries.
  useEffect(() => {
    const url = new URL(window.location.href);
    if (Number(url.searchParams.get('step')) !== currentStep) {
      url.searchParams.set('step', String(currentStep));
      window.history.replaceState({}, '', url.toString());
    }
  }, [currentStep]);

  function applyEmailTemplate(template) {
    if (!template) return;
    setSubject(template.subject || '');
    setBodyHtml(template.body_html || '');
    setName((prev) => prev || template.label || '');
    setFieldErrors((p) => ({ ...p, subject: null, bodyHtml: null }));
  }

  function insertVar(v) {
    setBodyHtml((html) => html + v);
  }

  // ---------- Validation par étape ----------
  function validateStep(step) {
    const errs = {};
    if (step === 1) {
      if (!listId) errs.listId = 'Choisissez une liste';
      if (!emailSenderId) errs.emailSenderId = 'Sélectionnez un domaine vérifié';
    }
    if (step === 2) {
      if (!subject.trim()) errs.subject = 'Objet requis';
      if (!bodyHtml.trim()) errs.bodyHtml = 'Corps du message requis';
      if (abTestEnabled && !subjectVariant2.trim()) errs.subjectVariant2 = 'Variant B requis (ou désactivez A/B)';
      if (abTestEnabled && hasVariant3 && !subjectVariant3.trim()) errs.subjectVariant3 = 'Variant C requis (ou retirez-le)';
    }
    if (step === 3) {
      if (sendMode === 'scheduled' && !scheduledAt) errs.scheduledAt = 'Choisissez une date d\'envoi';
      if (sendMode === 'scheduled' && scheduledAt && new Date(scheduledAt) < new Date()) {
        errs.scheduledAt = 'La date doit être dans le futur';
      }
    }
    setFieldErrors((p) => ({ ...p, ...errs }));
    return Object.keys(errs).length === 0;
  }

  function goToStep(step) {
    // Validation à chaque "Suivant" — on ne saute pas en avant si invalide
    if (step > currentStep && !validateStep(currentStep)) return;
    setCurrentStep(step);
  }

  // ---------- Dirty tracking pour confirm exit ----------
  const isDirty = useMemo(() => {
    return Boolean(listId || subject.trim() || bodyHtml.trim() || name.trim() || abTestEnabled);
  }, [listId, subject, bodyHtml, name, abTestEnabled]);

  function handleExitClick() {
    if (isDirty) setConfirmExitOpen(true);
    else router.push('/admin/prospection/campaigns');
  }

  // ---------- Submit + auto-send ----------
  async function handleSubmit(launch) {
    if (submitting) return;
    // Validation finale tous steps confondus
    const ok = validateStep(1) && validateStep(2) && validateStep(3);
    if (!ok) return;

    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/prospection/email-campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          list_id: listId,
          name: (name.trim() || autoName),
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
      const campaignId = data.campaign.id;

      // Si launch=true → on enchaîne avec le POST /send pour démarrer l'envoi
      // immédiatement (ou planifié si scheduledAt). On garde submitting=true
      // jusqu'au router.push pour bloquer définitivement tout 2e clic.
      if (launch) {
        const sendBody = {};
        if (sendMode === 'scheduled' && scheduledAt) {
          sendBody.scheduled_at = new Date(scheduledAt).toISOString();
        }
        const sendRes = await fetch(`/api/admin/prospection/email-campaigns/${campaignId}/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sendBody),
        });
        if (!sendRes.ok) {
          const errData = await sendRes.json().catch(() => ({}));
          setError(errData.error || 'Brouillon créé, mais erreur au lancement. Allez sur la campagne pour lancer manuellement.');
          // Redirige malgré tout vers la fiche — l'utilisateur pourra relancer
          router.push(`/admin/prospection/campaigns/${campaignId}`);
          return;
        }
      }

      // Redirect immédiat — empêche tout double-click (fix P0 #3)
      router.push(`/admin/prospection/campaigns/${campaignId}`);
    } catch {
      setError('Erreur réseau');
      setSubmitting(false);
    }
  }

  // ---------- Computed values ----------
  const selectedList = lists.find((l) => l.id === listId);
  const totalRecipients = selectedList
    ? Math.max(0, (selectedList.email_count || 0) - (selectedList.opt_out_count || 0))
    : 0;

  // Sujet affiché dans le preview selon la variante sélectionnée
  const previewSubjectSource = (() => {
    if (previewVariant === 'B' && abTestEnabled) return subjectVariant2;
    if (previewVariant === 'C' && abTestEnabled && hasVariant3) return subjectVariant3;
    return subject;
  })();

  const interpolate = (str) => (str || '')
    .replace(/\{\{\s*first_name\s*\}\}/g, 'Anthony')
    .replace(/\{\{\s*last_name\s*\}\}/g, 'Malartre')
    .replace(/\{\{\s*company\s*\}\}/g, 'Acme SAS')
    .replace(/\{\{\s*position_title\s*\}\}/g, 'CEO');

  const previewSubject = interpolate(previewSubjectSource);
  const previewBody = interpolate(bodyHtml);

  if (loading) return <CenteredSpinner />;
  if (authState === 'guest') return <GuestScreen />;
  if (authState === 'no-admin') return <NoAdminScreen email={currentEmail} signOut={async () => { await supabase.auth.signOut(); router.push('/login?return=/admin/prospection/campaigns/new'); }} />;

  // Si l'utilisateur n'a aucune liste → empty state (avant même le wizard)
  if (lists.length === 0) {
    return (
      <div className="min-h-screen bg-surface-base text-content-primary p-4 sm:p-8">
        <div className="max-w-2xl mx-auto pt-12">
          <Link href="/admin/prospection/campaigns" className="inline-flex items-center gap-2 text-sm text-content-tertiary hover:text-violet-400 transition mb-4">
            <ArrowLeft size={14} />
            Campagnes
          </Link>
          <div className="rounded-2xl border border-amber-400/30 bg-amber-500/5 p-8 text-center">
            <AlertTriangle size={28} className="mx-auto mb-3 text-amber-500" />
            <h2 className="text-lg font-semibold text-content-primary mb-2">Pas de liste, pas de campagne.</h2>
            <p className="text-sm text-content-secondary mb-5 max-w-md mx-auto">
              Crée une liste et importe ton CSV. Tu pourras envoyer juste après.
            </p>
            <Link href="/admin/prospection" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition shadow-lg shadow-violet-500/20">
              <Users size={14} />
              Créer une liste
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const stepTitles = [
    'Destinataires & expéditeur',
    'Rédigez votre message',
    'Options & lancement',
  ];
  const stepDescriptions = [
    'Choisissez qui va recevoir, et depuis quel domaine.',
    'Objet et corps. A/B test disponible si besoin.',
    'Vérifiez l\'aperçu, puis envoyez ou planifiez.',
  ];

  return (
    <div className="min-h-screen bg-surface-base text-content-primary">
      {/* Header sticky avec progress bar */}
      <div className="sticky top-0 z-30 bg-surface-base/95 backdrop-blur-md border-b border-line">
        <div className="max-w-5xl mx-auto px-4 sm:px-8 py-4">
          <div className="flex items-center justify-between gap-4 mb-3">
            <div className="flex items-center gap-3 min-w-0">
              <Mail size={20} className="text-violet-400 flex-shrink-0" />
              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-wider text-content-tertiary font-semibold hidden sm:block">
                  Nouvelle campagne · Étape {currentStep}/3
                </div>
                <div className="text-[10px] uppercase tracking-wider text-content-tertiary font-semibold sm:hidden">
                  {currentStep}/3
                </div>
                <h1 className="text-base sm:text-lg font-semibold text-content-primary truncate">
                  {stepTitles[currentStep - 1]}
                </h1>
              </div>
            </div>
            <button
              type="button"
              onClick={handleExitClick}
              className="inline-flex items-center gap-1.5 text-xs text-content-tertiary hover:text-content-primary transition flex-shrink-0"
            >
              <X size={14} />
              <span className="hidden sm:inline">Quitter</span>
            </button>
          </div>

          {/* Progress bar visuel — 3 segments */}
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex-1 flex items-center gap-2">
                <div
                  className={`h-1 flex-1 rounded-full transition-all ${
                    s < currentStep
                      ? 'bg-violet-500'
                      : s === currentStep
                      ? 'bg-violet-500'
                      : 'bg-surface-elevated'
                  }`}
                />
              </div>
            ))}
          </div>
          <p className="text-xs text-content-tertiary mt-2 hidden sm:block">
            {stepDescriptions[currentStep - 1]}
          </p>
        </div>
      </div>

      {/* Contenu wizard */}
      <div className="max-w-5xl mx-auto px-4 sm:px-8 py-6 pb-32">
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-300 flex items-start gap-2">
            <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
            {error}
          </div>
        )}

        {currentStep === 1 && (
          <StepAudience
            lists={lists}
            listId={listId}
            setListId={(v) => { setListId(v); setFieldErrors((p) => ({ ...p, listId: null })); }}
            selectedList={selectedList}
            totalRecipients={totalRecipients}
            senders={senders}
            emailSenderId={emailSenderId}
            setEmailSenderId={(v) => { setEmailSenderId(v); setFieldErrors((p) => ({ ...p, emailSenderId: null })); }}
            name={name}
            setName={setName}
            autoName={autoName}
            fieldErrors={fieldErrors}
          />
        )}

        {currentStep === 2 && (
          <StepMessage
            subject={subject}
            setSubject={(v) => { setSubject(v); setFieldErrors((p) => ({ ...p, subject: null })); }}
            bodyHtml={bodyHtml}
            setBodyHtml={(v) => { setBodyHtml(v); setFieldErrors((p) => ({ ...p, bodyHtml: null })); }}
            abTestEnabled={abTestEnabled}
            setAbTestEnabled={setAbTestEnabled}
            subjectVariant2={subjectVariant2}
            setSubjectVariant2={(v) => { setSubjectVariant2(v); setFieldErrors((p) => ({ ...p, subjectVariant2: null })); }}
            subjectVariant3={subjectVariant3}
            setSubjectVariant3={(v) => { setSubjectVariant3(v); setFieldErrors((p) => ({ ...p, subjectVariant3: null })); }}
            hasVariant3={hasVariant3}
            setHasVariant3={setHasVariant3}
            abTestSampleSize={abTestSampleSize}
            setAbTestSampleSize={setAbTestSampleSize}
            insertVar={insertVar}
            onOpenTemplateLibrary={() => setTemplateModalOpen(true)}
            fieldErrors={fieldErrors}
          />
        )}

        {currentStep === 3 && (
          <StepLaunch
            smartScheduling={smartScheduling}
            setSmartScheduling={setSmartScheduling}
            showAdvanced={showAdvanced}
            setShowAdvanced={setShowAdvanced}
            replyTo={replyTo}
            setReplyTo={setReplyTo}
            fromName={fromName}
            setFromName={setFromName}
            fromEmail={fromEmail}
            setFromEmail={setFromEmail}
            previewSubject={previewSubject}
            previewBody={previewBody}
            previewVariant={previewVariant}
            setPreviewVariant={setPreviewVariant}
            abTestEnabled={abTestEnabled}
            hasVariant3={hasVariant3}
            sendMode={sendMode}
            setSendMode={setSendMode}
            scheduledAt={scheduledAt}
            setScheduledAt={(v) => { setScheduledAt(v); setFieldErrors((p) => ({ ...p, scheduledAt: null })); }}
            selectedList={selectedList}
            totalRecipients={totalRecipients}
            fieldErrors={fieldErrors}
          />
        )}
      </div>

      {/* Footer sticky avec navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-surface-base/95 backdrop-blur-md border-t border-line">
        <div className="max-w-5xl mx-auto px-4 sm:px-8 py-3 flex items-center justify-between gap-3">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={() => goToStep(currentStep - 1)}
              disabled={submitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-content-secondary hover:text-content-primary hover:bg-surface-elevated transition disabled:opacity-50"
            >
              <ArrowLeft size={14} />
              Précédent
            </button>
          ) : (
            <button
              type="button"
              onClick={handleExitClick}
              disabled={submitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-content-secondary hover:text-content-primary hover:bg-surface-elevated transition disabled:opacity-50"
            >
              Annuler
            </button>
          )}

          {currentStep < 3 ? (
            <button
              type="button"
              onClick={() => goToStep(currentStep + 1)}
              disabled={
                submitting ||
                (currentStep === 1 && (!listId || !emailSenderId)) ||
                (currentStep === 2 && (!subject.trim() || !bodyHtml.trim()))
              }
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition shadow-lg shadow-violet-500/20"
            >
              Suivant
              <ArrowRight size={14} />
            </button>
          ) : (
            <div className="flex items-center gap-2">
              {/* CTA secondaire — "Créer brouillon" pour utilisateurs prudents */}
              <button
                type="button"
                onClick={() => handleSubmit(false)}
                disabled={submitting}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-content-secondary hover:text-content-primary hover:bg-surface-elevated transition disabled:opacity-50"
              >
                Sauver brouillon
              </button>
              <button
                type="button"
                onClick={() => handleSubmit(true)}
                disabled={
                  submitting ||
                  !listId || !emailSenderId ||
                  !subject.trim() || !bodyHtml.trim() ||
                  (abTestEnabled && !subjectVariant2.trim()) ||
                  (abTestEnabled && hasVariant3 && !subjectVariant3.trim()) ||
                  (sendMode === 'scheduled' && !scheduledAt)
                }
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition shadow-lg shadow-violet-500/20"
              >
                {submitting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Envoi en cours…
                  </>
                ) : sendMode === 'scheduled' ? (
                  <>
                    <Calendar size={14} />
                    Planifier l&apos;envoi
                  </>
                ) : (
                  <>
                    <Send size={14} />
                    Envoyer maintenant
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Bibliothèque de templates email — modal global */}
      <TemplateLibraryModal
        open={templateModalOpen}
        onClose={() => setTemplateModalOpen(false)}
        onSelect={applyEmailTemplate}
      />

      {/* Confirmation avant de quitter le wizard (formulaire dirty) */}
      <ConfirmModal
        open={confirmExitOpen}
        onClose={() => setConfirmExitOpen(false)}
        onConfirm={() => {
          setConfirmExitOpen(false);
          router.push('/admin/prospection/campaigns');
        }}
        title="Quitter la création ?"
        message="Vos modifications seront perdues. Aucun brouillon n'a été sauvegardé."
        confirmLabel="Quitter sans sauver"
        cancelLabel="Continuer la rédaction"
        variant="danger"
      />
    </div>
  );
}

// ============================================================================
// STEP 1 — Audience + Sender + Nom interne
// ============================================================================
function StepAudience({
  lists, listId, setListId, selectedList, totalRecipients,
  senders, emailSenderId, setEmailSenderId,
  name, setName, autoName, fieldErrors,
}) {
  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-200">
      {/* Bloc Liste cible */}
      <WizardBlock
        title="Liste cible"
        icon={<Users size={14} />}
        description="Qui va recevoir cette campagne ?"
        required
      >
        <select
          value={listId}
          onChange={(e) => setListId(e.target.value)}
          className={`w-full px-3 py-2.5 rounded-lg bg-surface-base border text-sm text-content-primary focus:outline-none transition ${fieldErrors.listId ? 'border-red-500/60 focus:border-red-500' : 'border-line focus:border-violet-500'}`}
        >
          <option value="">— Sélectionner une liste —</option>
          {lists.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name} ({l.email_count} emails{l.opt_out_count > 0 ? ` · ${l.opt_out_count} opt-out` : ''})
            </option>
          ))}
        </select>
        {fieldErrors.listId && (
          <p className="text-xs text-red-500 mt-1.5">{fieldErrors.listId}</p>
        )}
        {selectedList && (
          <div className="mt-3 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20 flex items-center gap-2">
            <CheckCircle2 size={14} className="text-emerald-400 flex-shrink-0" />
            <span className="text-xs text-content-secondary">
              <strong className="text-emerald-400 tabular-nums">{totalRecipients}</strong> destinataires
              {selectedList.opt_out_count > 0 && (
                <span className="text-content-tertiary"> ({selectedList.opt_out_count} opt-out exclus)</span>
              )}
            </span>
          </div>
        )}
      </WizardBlock>

      {/* Bloc Sender / Domaine d'envoi */}
      <WizardBlock
        title="Domaine d'envoi"
        icon={<Globe2 size={14} />}
        description="Depuis quel domaine partent vos emails."
        required
      >
        {senders.length === 0 ? (
          <div className="p-4 rounded-lg bg-red-500/5 border border-red-500/30">
            <div className="flex items-start gap-2 mb-2">
              <AlertTriangle size={16} className="mt-0.5 flex-shrink-0 text-red-500" />
              <div>
                <strong className="text-sm text-red-400 block mb-1">Aucun domaine vérifié</strong>
                <p className="text-xs text-content-secondary leading-relaxed mb-3">
                  Pour des raisons de sécurité et de deliverability, Volia n&apos;envoie que depuis VOTRE
                  propre domaine vérifié (ex&nbsp;: send.votre-marque.fr). Connectez-en un d&apos;abord.
                </p>
                <Link
                  href="/settings/email-senders"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 font-semibold transition text-xs"
                >
                  Connecter mon domaine
                  <ArrowRight size={12} />
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <>
            <select
              value={emailSenderId}
              onChange={(e) => setEmailSenderId(e.target.value)}
              className={`w-full px-3 py-2.5 rounded-lg bg-surface-base border text-sm text-content-primary focus:outline-none transition ${fieldErrors.emailSenderId ? 'border-red-500/60 focus:border-red-500' : 'border-line focus:border-violet-500'}`}
            >
              <option value="">— Sélectionner un domaine —</option>
              {senders.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.from_name ? `${s.from_name} — ` : ''}noreply@{s.domain} (vérifié)
                </option>
              ))}
            </select>
            {fieldErrors.emailSenderId && (
              <p className="text-xs text-red-500 mt-1.5">{fieldErrors.emailSenderId}</p>
            )}
          </>
        )}
      </WizardBlock>

      {/* Bloc Nom interne (optionnel) */}
      <WizardBlock
        title="Nom interne"
        icon={<Settings2 size={14} />}
        description="Pour vous y retrouver dans vos campagnes. Jamais affiché aux destinataires."
      >
        <input
          type="text"
          maxLength={120}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={autoName}
          className="w-full px-3 py-2.5 rounded-lg bg-surface-base border border-line text-sm focus:outline-none focus:border-violet-500 transition"
        />
        <p className="text-[11px] text-content-tertiary mt-1.5">
          Laissez vide → utilisera automatiquement &laquo; {autoName} &raquo;
        </p>
      </WizardBlock>
    </div>
  );
}

// ============================================================================
// STEP 2 — Subject + Body + A/B test
// ============================================================================
function StepMessage({
  subject, setSubject, bodyHtml, setBodyHtml,
  abTestEnabled, setAbTestEnabled,
  subjectVariant2, setSubjectVariant2,
  subjectVariant3, setSubjectVariant3,
  hasVariant3, setHasVariant3,
  abTestSampleSize, setAbTestSampleSize,
  insertVar, onOpenTemplateLibrary, fieldErrors,
}) {
  const subjectLen = subject.length;
  const subjectColor = subjectLen === 0
    ? 'text-content-tertiary'
    : subjectLen > 60
    ? 'text-amber-500'
    : subjectLen > 50
    ? 'text-content-tertiary'
    : 'text-emerald-500';

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-200">
      {/* CTA template library en haut — gain de temps majeur */}
      <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-4 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
            <Sparkles size={16} className="text-blue-400" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-content-primary">Page blanche ?</div>
            <p className="text-xs text-content-tertiary">Démarrez avec un template pro testé — 20+ disponibles.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onOpenTemplateLibrary}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-500/15 hover:bg-blue-500/25 text-blue-400 border border-blue-500/30 hover:border-blue-500/50 text-xs font-semibold transition"
        >
          <FileText size={12} />
          Choisir un template
        </button>
      </div>

      {/* Bloc Subject */}
      <WizardBlock
        title="Objet de l'email"
        icon={<Send size={14} />}
        description="Le subject line — premier point de contact, le plus déterminant."
        required
        action={
          <button
            type="button"
            onClick={() => {
              setAbTestEnabled((v) => {
                const next = !v;
                if (!next) {
                  setSubjectVariant2('');
                  setSubjectVariant3('');
                  setHasVariant3(false);
                }
                return next;
              });
            }}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition ${
              abTestEnabled
                ? 'bg-violet-500/15 text-violet-300 border border-violet-500/40'
                : 'bg-surface-elevated text-content-tertiary border border-line hover:border-violet-500/40'
            }`}
          >
            <FlaskConical size={11} />
            {abTestEnabled ? 'A/B test activé' : 'A/B test'}
          </button>
        }
      >
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs text-content-tertiary">
            {abTestEnabled ? 'Variant A' : 'Objet'}
          </label>
          <span className={`text-[10px] tabular-nums ${subjectColor}`}>
            {subjectLen}/50 idéal
          </span>
        </div>
        <input
          type="text"
          maxLength={200}
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Ex : Quick question — {{company}}"
          className={`w-full px-3 py-2.5 rounded-lg bg-surface-base border text-sm focus:outline-none transition ${fieldErrors.subject ? 'border-red-500/60 focus:border-red-500' : 'border-line focus:border-violet-500'}`}
        />
        {fieldErrors.subject && (
          <p className="text-xs text-red-500 mt-1.5">{fieldErrors.subject}</p>
        )}

        {/* A/B test panel inline (collapsable via abTestEnabled) */}
        {abTestEnabled && (
          <div className="mt-3 space-y-2 p-3 rounded-lg bg-violet-500/[0.04] border border-violet-500/20 animate-in fade-in slide-in-from-top-2 duration-200">
            <div>
              <label className="block text-xs text-content-tertiary mb-1.5">Variant B</label>
              <input
                type="text"
                maxLength={200}
                value={subjectVariant2}
                onChange={(e) => setSubjectVariant2(e.target.value)}
                placeholder="Ex : {{first_name}}, 5 min ?"
                className={`w-full px-3 py-2 rounded-lg bg-surface-base border text-sm focus:outline-none ${fieldErrors.subjectVariant2 ? 'border-red-500/60 focus:border-red-500' : 'border-line focus:border-violet-500'}`}
              />
              {fieldErrors.subjectVariant2 && (
                <p className="text-xs text-red-500 mt-1">{fieldErrors.subjectVariant2}</p>
              )}
            </div>

            {hasVariant3 ? (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs text-content-tertiary">Variant C</label>
                  <button
                    type="button"
                    onClick={() => { setHasVariant3(false); setSubjectVariant3(''); }}
                    className="inline-flex items-center gap-1 text-[10px] text-content-tertiary hover:text-red-500 transition"
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
                  className={`w-full px-3 py-2 rounded-lg bg-surface-base border text-sm focus:outline-none ${fieldErrors.subjectVariant3 ? 'border-red-500/60 focus:border-red-500' : 'border-line focus:border-violet-500'}`}
                />
                {fieldErrors.subjectVariant3 && (
                  <p className="text-xs text-red-500 mt-1">{fieldErrors.subjectVariant3}</p>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setHasVariant3(true)}
                className="inline-flex items-center gap-1 text-[11px] text-violet-400 hover:text-violet-300 transition"
              >
                <Plus size={11} />
                Ajouter variant C
              </button>
            )}

            <div className="pt-2 mt-2 border-t border-violet-500/10">
              <label className="block text-xs text-content-tertiary mb-1.5">
                Échantillon (avant pick du winner)
              </label>
              <input
                type="number"
                min={10}
                max={10000}
                value={abTestSampleSize}
                onChange={(e) => setAbTestSampleSize(e.target.value)}
                className="w-32 px-3 py-2 rounded-lg bg-surface-base border border-line text-sm focus:outline-none focus:border-violet-500 tabular-nums"
              />
              <p className="text-[10px] text-content-tertiary mt-1 leading-relaxed">
                Volia split les {abTestSampleSize || 100} premiers envois équitablement, puis bascule sur le variant
                au meilleur taux d&apos;ouverture.
              </p>
            </div>
          </div>
        )}
      </WizardBlock>

      {/* Bloc Body */}
      <WizardBlock
        title="Corps du message"
        icon={<Mail size={14} />}
        description="HTML simple — gardez court, personnel, une seule CTA."
        required
      >
        <div className="flex items-center gap-1.5 mb-2 flex-wrap">
          <span className="text-[10px] uppercase tracking-wider text-content-tertiary font-semibold mr-1">Insérer&nbsp;:</span>
          <button type="button" onClick={() => insertVar('{{first_name}}')} className="px-2 py-1 rounded text-[11px] bg-surface-elevated border border-line hover:border-violet-500 transition">{`{{first_name}}`}</button>
          <button type="button" onClick={() => insertVar('{{company}}')} className="px-2 py-1 rounded text-[11px] bg-surface-elevated border border-line hover:border-violet-500 transition">{`{{company}}`}</button>
          <button type="button" onClick={() => insertVar('{{position_title}}')} className="px-2 py-1 rounded text-[11px] bg-surface-elevated border border-line hover:border-violet-500 transition">{`{{position_title}}`}</button>
          <button
            type="button"
            onClick={onOpenTemplateLibrary}
            className="ml-auto inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20 transition"
          >
            <FileText size={11} />
            Templates
          </button>
        </div>
        <textarea
          rows={14}
          value={bodyHtml}
          onChange={(e) => setBodyHtml(e.target.value)}
          placeholder="<p>Bonjour {{first_name}},</p>..."
          className={`w-full px-3 py-2.5 rounded-lg bg-surface-base border text-sm font-mono text-content-primary focus:outline-none transition resize-y ${fieldErrors.bodyHtml ? 'border-red-500/60 focus:border-red-500' : 'border-line focus:border-violet-500'}`}
        />
        {fieldErrors.bodyHtml && (
          <p className="text-xs text-red-500 mt-1.5">{fieldErrors.bodyHtml}</p>
        )}
        <p className="text-[10px] text-content-tertiary mt-2 leading-relaxed">
          Variables dispo&nbsp;: <code>{`{{first_name}}`}</code>, <code>{`{{last_name}}`}</code>, <code>{`{{company}}`}</code>, <code>{`{{position_title}}`}</code>.
          Le footer RGPD (lien désabonnement 1 clic) sera ajouté automatiquement.
        </p>
      </WizardBlock>
    </div>
  );
}

// ============================================================================
// STEP 3 — Smart scheduling + Options avancées + Preview + Launch
// ============================================================================
function StepLaunch({
  smartScheduling, setSmartScheduling,
  showAdvanced, setShowAdvanced,
  replyTo, setReplyTo, fromName, setFromName, fromEmail, setFromEmail,
  previewSubject, previewBody,
  previewVariant, setPreviewVariant,
  abTestEnabled, hasVariant3,
  sendMode, setSendMode, scheduledAt, setScheduledAt,
  selectedList, totalRecipients, fieldErrors,
}) {
  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-200">
      {/* Récap audience compact */}
      {selectedList && (
        <div className="rounded-lg bg-surface-card border border-line p-3 flex items-center gap-3">
          <Users size={14} className="text-violet-400 flex-shrink-0" />
          <div className="text-xs text-content-secondary">
            <strong className="text-content-primary">{totalRecipients}</strong> destinataires depuis
            <strong className="text-content-primary"> {selectedList.name}</strong>
          </div>
        </div>
      )}

      {/* Smart scheduling */}
      <WizardBlock title="Planification intelligente" icon={<Globe2 size={14} />}>
        <label className="flex items-start gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={smartScheduling}
            onChange={(e) => setSmartScheduling(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-line bg-surface-base text-violet-600 focus:ring-violet-500 focus:ring-offset-0 cursor-pointer"
          />
          <div className="flex-1">
            <div className="text-sm font-medium text-content-primary flex items-center gap-2 flex-wrap">
              Envoyer 9h-17h heure du destinataire
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold uppercase tracking-wider">
                Recommandé
              </span>
            </div>
            <p className="text-xs text-content-tertiary mt-1 leading-relaxed">
              +20% de taux d&apos;ouverture en moyenne. Volia détecte la timezone via le domaine email
              (.fr, .de, .com…) ou l&apos;indicatif téléphone (+33, +1, +49…) et planifie chaque envoi
              du lundi au vendredi dans la fenêtre 9h-17h locale.
            </p>
          </div>
        </label>
      </WizardBlock>

      {/* Options avancées (collapsé par défaut) */}
      <div className="rounded-xl border border-line bg-surface-card overflow-hidden">
        <button
          type="button"
          onClick={() => setShowAdvanced((v) => !v)}
          className="w-full px-4 py-3 flex items-center justify-between gap-2 hover:bg-surface-elevated transition text-left"
        >
          <div className="flex items-center gap-2">
            <Settings2 size={14} className="text-content-tertiary" />
            <span className="text-sm font-medium text-content-primary">Options avancées</span>
            <span className="text-[10px] text-content-tertiary">Reply-to, From name custom</span>
          </div>
          {showAdvanced ? <ChevronUp size={14} className="text-content-tertiary" /> : <ChevronDown size={14} className="text-content-tertiary" />}
        </button>
        {showAdvanced && (
          <div className="px-4 pb-4 pt-1 space-y-3 border-t border-line animate-in fade-in slide-in-from-top-2 duration-200">
            <div>
              <label className="block text-xs text-content-tertiary mb-1.5">Reply-To (où arrivent les réponses)</label>
              <input
                type="email"
                value={replyTo}
                onChange={(e) => setReplyTo(e.target.value)}
                placeholder="auto — inbound Volia"
                className="w-full px-3 py-2 rounded-lg bg-surface-base border border-line text-sm focus:outline-none focus:border-violet-500"
              />
              <p className="text-[10px] text-content-tertiary mt-1">Vide = auto (inbound Volia capte tout).</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-content-tertiary mb-1.5">Nom expéditeur (From)</label>
                <input
                  type="text"
                  value={fromName}
                  onChange={(e) => setFromName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-surface-base border border-line text-sm focus:outline-none focus:border-violet-500"
                />
              </div>
              <div>
                <label className="block text-xs text-content-tertiary mb-1.5">Email expéditeur (avancé)</label>
                <input
                  type="email"
                  value={fromEmail}
                  onChange={(e) => setFromEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-surface-base border border-line text-sm focus:outline-none focus:border-violet-500"
                />
                <p className="text-[10px] text-content-tertiary mt-1">Override — par défaut, dérivé du sender vérifié.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Aperçu */}
      <WizardBlock
        title="Aperçu"
        icon={<Eye size={14} />}
        description="Avec variables remplacées par des valeurs exemple."
        action={
          abTestEnabled && (
            <div className="inline-flex rounded-md border border-line overflow-hidden">
              {['A', 'B', hasVariant3 ? 'C' : null].filter(Boolean).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setPreviewVariant(v)}
                  className={`px-2.5 py-1 text-[11px] font-medium transition ${
                    previewVariant === v
                      ? 'bg-violet-500/15 text-violet-300'
                      : 'text-content-tertiary hover:text-content-primary'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          )
        }
      >
        <div className="rounded-lg bg-surface-base border border-line p-4 text-xs">
          <div className="space-y-1.5 mb-3 pb-3 border-b border-line">
            <div><span className="text-content-tertiary">Objet&nbsp;:</span> <strong className="text-content-primary">{previewSubject || <em className="text-content-tertiary font-normal">(vide)</em>}</strong></div>
          </div>
          <div
            className="prose prose-sm max-w-none [&_p]:my-2 [&_a]:text-violet-400 text-content-secondary"
            dangerouslySetInnerHTML={{ __html: previewBody || '<em style="color:#888">(corps vide)</em>' }}
          />
          <div className="mt-4 pt-3 border-t border-dashed border-line">
            <p className="text-[10px] text-content-tertiary italic">
              [Footer RGPD ajouté à l&apos;envoi&nbsp;: « Vous recevez ce mail car… Se désabonner en 1 clic »]
            </p>
          </div>
        </div>
      </WizardBlock>

      {/* Lancement — mode now vs scheduled */}
      <WizardBlock title="Quand envoyer ?" icon={<Calendar size={14} />}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <ModeCard
            active={sendMode === 'now'}
            onClick={() => setSendMode('now')}
            icon={<Send size={16} />}
            title="Envoyer maintenant"
            description="Démarrage immédiat dès la création."
          />
          <ModeCard
            active={sendMode === 'scheduled'}
            onClick={() => setSendMode('scheduled')}
            icon={<Calendar size={16} />}
            title="Planifier l'envoi"
            description="Choisissez une date et heure de départ."
          />
        </div>
        {sendMode === 'scheduled' && (
          <div className="mt-3 animate-in fade-in slide-in-from-top-2 duration-200">
            <label className="block text-xs text-content-tertiary mb-1.5">Date & heure d&apos;envoi</label>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className={`w-full sm:w-auto px-3 py-2 rounded-lg bg-surface-base border text-sm focus:outline-none transition ${fieldErrors.scheduledAt ? 'border-red-500/60 focus:border-red-500' : 'border-line focus:border-violet-500'}`}
            />
            {fieldErrors.scheduledAt && (
              <p className="text-xs text-red-500 mt-1.5">{fieldErrors.scheduledAt}</p>
            )}
          </div>
        )}
      </WizardBlock>
    </div>
  );
}

// ============================================================================
// Primitives partagées
// ============================================================================
function WizardBlock({ title, icon, description, required, action, children }) {
  return (
    <section className="rounded-2xl border border-line bg-surface-card p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-content-primary flex items-center gap-2">
            <span className="text-violet-400">{icon}</span>
            {title}
            {required && <span className="text-[10px] text-red-500/80">*</span>}
          </h2>
          {description && (
            <p className="text-xs text-content-tertiary mt-0.5">{description}</p>
          )}
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
      {children}
    </section>
  );
}

function ModeCard({ active, onClick, icon, title, description }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left p-4 rounded-xl border transition ${
        active
          ? 'border-violet-500 bg-violet-500/5 shadow-sm shadow-violet-500/10'
          : 'border-line bg-surface-base hover:border-violet-500/40'
      }`}
    >
      <div className="flex items-center gap-2 mb-1">
        <div className={`w-7 h-7 rounded-md flex items-center justify-center ${active ? 'bg-violet-500/15 text-violet-400' : 'bg-surface-elevated text-content-tertiary'}`}>
          {icon}
        </div>
        <div className="text-sm font-semibold text-content-primary flex-1">{title}</div>
        {active && <Check size={14} className="text-violet-400" />}
      </div>
      <p className="text-xs text-content-tertiary leading-relaxed">{description}</p>
    </button>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<CenteredSpinner />}>
      <NewCampaignContent />
    </Suspense>
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
