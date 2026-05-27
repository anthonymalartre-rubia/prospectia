'use client';

// Page /settings/email-senders
//
// Multi-tenant : chaque user Volia connecte son ou ses domaines d'envoi email
// (vérifiés via Resend Domains API). Les campagnes du user partiront ensuite
// depuis SON domaine (alignement DKIM / SPF / DMARC → délivrabilité maximale).
//
// Flow :
//   1. Liste les senders existants avec status badge + actions
//      (Vérifier maintenant / Supprimer / Voir DNS)
//   2. Bouton "+ Connecter un domaine" → wizard inline 3 steps :
//      a. saisie domaine + from_name (recommande send.{root})
//      b. affichage des DNS records à copier (avec bouton Copier)
//      c. bouton "J'ai configuré, vérifier" → poll /verify

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Mail,
  Plus,
  RefreshCw,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Clock,
  Copy,
  Check,
  X,
  Globe,
  ChevronRight,
  Info,
  ExternalLink,
  Flame,
  Play,
} from 'lucide-react';
import { ConfirmModal, InfoTooltip } from '@/components/ui';
import {
  calculateCurrentDay,
  getCurrentPhase,
  getWarmupProgressPercent,
  estimateCompletionDate,
  WARMUP_DURATION_DAYS,
} from '@/lib/warmup';

// Définitions courtes pour expliquer les concepts DNS aux non-experts.
const DNS_TYPE_HELP = {
  TXT: 'Record texte DNS — utilisé pour SPF, DMARC et la vérification de domaine. Aucun risque pour votre site.',
  MX: 'Mail eXchanger — indique vers quel serveur les emails de votre domaine doivent être routés.',
  CNAME: 'Canonical Name — alias DNS pointant vers un autre domaine. Utilisé ici pour DKIM (signature cryptographique).',
};

const RECORD_NAME_HELP = (name = '') => {
  const n = name.toLowerCase();
  if (n.includes('dkim') || n.includes('_domainkey')) {
    return 'DKIM (DomainKeys Identified Mail) — signature cryptographique qui prouve que l\'email vient bien de votre domaine. Empêche le phishing et améliore la délivrabilité.';
  }
  if (n.includes('spf') || n.startsWith('@') || n === '') {
    return 'SPF (Sender Policy Framework) — liste les serveurs autorisés à envoyer du mail pour votre domaine. Sans SPF, vos mails atterrissent souvent en spam.';
  }
  if (n.includes('dmarc') || n.includes('_dmarc')) {
    return 'DMARC — politique qui dit aux serveurs destinataires quoi faire des mails qui échouent SPF/DKIM (rejet, quarantaine, ou rien). Brique anti-phishing essentielle.';
  }
  return null;
};

function statusBadge(status) {
  switch (status) {
    case 'verified':
      return {
        label: 'Vérifié',
        cls: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30',
        icon: CheckCircle,
      };
    case 'failed':
      return {
        label: 'Échec',
        cls: 'bg-red-500/15 text-red-600 border-red-500/30',
        icon: AlertTriangle,
      };
    case 'temp_failure':
      return {
        label: 'Échec temporaire',
        cls: 'bg-amber-500/15 text-amber-600 border-amber-500/30',
        icon: AlertTriangle,
      };
    case 'pending':
    default:
      return {
        label: 'En attente',
        cls: 'bg-amber-500/15 text-amber-600 border-amber-500/30',
        icon: Clock,
      };
  }
}

// Devine un sous-domaine d'envoi propre à partir d'un domaine racine.
//   ex: 'cabinet-dupont.fr' → 'send.cabinet-dupont.fr'
//   ex: 'www.cabinet-dupont.fr' → 'send.cabinet-dupont.fr'
function suggestSendDomain(input) {
  if (!input) return '';
  let v = input.trim().toLowerCase();
  v = v.replace(/^https?:\/\//, '');
  v = v.replace(/\/.*$/, '');
  if (v.startsWith('www.')) v = v.slice(4);
  if (!v) return '';
  if (v.startsWith('send.')) return v;
  return `send.${v}`;
}

function CopyButton({ value }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(String(value || ''));
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          /* noop */
        }
      }}
      className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium border border-line bg-surface-card hover:bg-surface-elevated text-content-secondary transition"
    >
      {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
      {copied ? 'Copié' : 'Copier'}
    </button>
  );
}

function DnsTable({ records }) {
  if (!records || records.length === 0) {
    return (
      <p className="text-xs text-content-tertiary italic">
        Aucun record DNS retourné. Cliquez sur « Vérifier maintenant » pour rafraîchir.
      </p>
    );
  }
  return (
    <div className="overflow-x-auto rounded-lg border border-line">
      <table className="w-full text-xs">
        <thead className="bg-surface-elevated">
          <tr className="text-left text-content-tertiary">
            <th className="px-3 py-2 font-semibold">Type</th>
            <th className="px-3 py-2 font-semibold">Nom / Host</th>
            <th className="px-3 py-2 font-semibold">Valeur</th>
            <th className="px-3 py-2 font-semibold text-right">TTL</th>
            <th className="px-3 py-2 font-semibold text-right">Status</th>
          </tr>
        </thead>
        <tbody>
          {records.map((r, i) => {
            const type = r.type || r.record || '—';
            const name = r.name || '—';
            const value = r.value || '—';
            const ttl = r.ttl || 'Auto';
            const recStatus = r.status || 'pending';
            const typeHelp = DNS_TYPE_HELP[type];
            const nameHelp = RECORD_NAME_HELP(name);
            return (
              <tr key={`${type}-${name}-${i}`} className="border-t border-line">
                <td className="px-3 py-2 align-top">
                  <span className="font-mono font-semibold text-content-primary inline-flex items-center gap-1">
                    {type}
                    {typeHelp && <InfoTooltip content={typeHelp} iconSize={10} />}
                  </span>
                </td>
                <td className="px-3 py-2 align-top">
                  <div className="flex items-start gap-2">
                    <code className="font-mono text-content-secondary break-all inline-flex items-center gap-1">
                      {name}
                      {nameHelp && <InfoTooltip content={nameHelp} iconSize={10} />}
                    </code>
                    <CopyButton value={name} />
                  </div>
                </td>
                <td className="px-3 py-2 align-top max-w-md">
                  <div className="flex items-start gap-2">
                    <code className="font-mono text-content-secondary break-all">{value}</code>
                    <CopyButton value={value} />
                  </div>
                </td>
                <td className="px-3 py-2 align-top text-right text-content-tertiary">{ttl}</td>
                <td className="px-3 py-2 align-top text-right">
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${
                      recStatus === 'verified'
                        ? 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30'
                        : 'bg-amber-500/15 text-amber-600 border-amber-500/30'
                    }`}
                  >
                    {recStatus}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// Section warmup affichée dans la card de chaque sender.
// 3 états :
//   - Sender pas verified           → on cache (warmup pas applicable)
//   - Warmup absent ou completed    → badge "Warm" + bouton optionnel "Démarrer le warmup"
//                                      (utile pour les senders legacy verified avant la feature)
//   - Warmup active                 → progress bar + phase courante + date fin estimée
function WarmupSection({ sender, onStart, starting }) {
  if (sender.status !== 'verified') return null;

  const warmup = sender.warmup;
  const tooltip = 'Volia chauffe votre domaine progressivement pour atteindre 200 emails/jour sans tomber en spam. Process automatique pendant 28 jours qui respecte le protocole de warmup Gmail/Outlook.';

  // Pas de session warmup OU déjà completed → considéré "warm"
  if (!warmup || warmup.status === 'completed') {
    return (
      <div className="mt-3 pt-3 border-t border-line flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 text-xs text-content-secondary">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border bg-emerald-500/15 text-emerald-600 border-emerald-500/30">
            <Flame className="h-3 w-3" />
            {warmup ? 'Warmup terminé' : 'Warm'}
          </span>
          <span className="text-content-tertiary">
            Domaine en régime nominal — pas de limite de volume.
          </span>
          <InfoTooltip content={tooltip} iconSize={11} />
        </div>
        {!warmup && (
          <button
            onClick={() => onStart(sender.id)}
            disabled={starting}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium border border-line bg-surface-card hover:bg-surface-elevated text-content-secondary transition disabled:opacity-40"
            title="Démarrer manuellement un warmup 28 jours (recommandé pour un nouveau domaine)"
          >
            {starting ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
            Démarrer le warmup
          </button>
        )}
      </div>
    );
  }

  // Warmup active : on calcule les infos d'affichage côté client (sans round-trip)
  const currentDay = Math.min(calculateCurrentDay(warmup.started_at), WARMUP_DURATION_DAYS);
  const phase = getCurrentPhase(currentDay);
  const progress = getWarmupProgressPercent(currentDay);
  const completionDate = estimateCompletionDate(warmup.started_at);

  // Stats peer-to-peer (Phase 3) — fournies par l'API si le sender est enrôlé.
  const peer = warmup.peer || null;
  const peerEnrolled = peer && peer.peer_email; // schema : {peer_email, total_*} si enrôlé, {enrolled:false} sinon
  const peerExchangesToday = peer?.exchanges_today ?? null;
  const poolSize = peer?.pool_size ?? 0;
  const peerTooltip = 'Volia simule des échanges email réalistes (ouvertures, clics, réponses) entre les domaines de tous les clients Volia. Ces signaux positifs sont vus par Gmail/Outlook et accélèrent la mise en réputation de votre domaine.';

  return (
    <div className="mt-3 pt-3 border-t border-line space-y-2">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 min-w-0">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border bg-amber-500/15 text-amber-600 border-amber-500/30">
            <Flame className="h-3 w-3" />
            Warmup en cours
          </span>
          {phase && (
            <span className="text-xs text-content-secondary truncate">
              {phase.label} — <strong>{phase.maxPerDay}</strong>/jour autorisés
            </span>
          )}
          <InfoTooltip content={tooltip} iconSize={11} />
        </div>
        <span className="text-[11px] text-content-tertiary whitespace-nowrap">
          Jour {currentDay} / {WARMUP_DURATION_DAYS}
        </span>
      </div>

      <div className="h-1.5 w-full rounded-full bg-surface-elevated overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      <p className="text-[11px] text-content-tertiary">
        Plein régime estimé le{' '}
        <strong>
          {completionDate.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
          })}
        </strong>
        .
      </p>

      {peerEnrolled && (
        <div className="mt-2 px-3 py-2 rounded-md border border-line bg-surface-elevated/40 space-y-1">
          <div className="flex items-center gap-2 flex-wrap text-[11px] text-content-secondary">
            <span className="inline-flex items-center gap-1 font-semibold text-violet-600">
              <Flame className="h-3 w-3" />
              Réseau peer-to-peer
            </span>
            <InfoTooltip content={peerTooltip} iconSize={11} />
            {poolSize > 0 && (
              <span className="text-content-tertiary">
                · Vous contribuez à un pool de <strong>{poolSize}+</strong> domaines Volia
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 flex-wrap text-[11px] text-content-tertiary">
            {peerExchangesToday !== null && (
              <span>
                <strong className="text-content-secondary">{peerExchangesToday}</strong> emails échangés aujourd'hui
              </span>
            )}
            {typeof peer?.total_sent === 'number' && (
              <span>· Total envoyés : <strong className="text-content-secondary">{peer.total_sent}</strong></span>
            )}
            {typeof peer?.total_opened === 'number' && (
              <span>· Ouverts : <strong className="text-content-secondary">{peer.total_opened}</strong></span>
            )}
            {typeof peer?.total_replied === 'number' && (
              <span>· Réponses : <strong className="text-content-secondary">{peer.total_replied}</strong></span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function EmailSendersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [senders, setSenders] = useState([]);
  const [toast, setToast] = useState(null);
  const [expandedDnsId, setExpandedDnsId] = useState(null);
  const [verifyingId, setVerifyingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [startingWarmupId, setStartingWarmupId] = useState(null);
  // Modal de confirmation pour la suppression (remplace confirm() natif)
  const [senderToDelete, setSenderToDelete] = useState(null);

  // Wizard state machine
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1); // 1=form 2=dns 3=verify
  const [wizardRoot, setWizardRoot] = useState('');
  const [wizardDomain, setWizardDomain] = useState('');
  const [wizardFromName, setWizardFromName] = useState('');
  const [wizardSubmitting, setWizardSubmitting] = useState(false);
  const [wizardCreated, setWizardCreated] = useState(null); // sender retourné par POST
  const [wizardVerifying, setWizardVerifying] = useState(false);

  useEffect(() => {
    loadSenders();
  }, []);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
  }, []);

  async function loadSenders() {
    setLoading(true);
    try {
      const res = await fetch('/api/email-senders', { cache: 'no-store' });
      if (res.status === 401) {
        router.push('/login');
        return;
      }
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Erreur de chargement', 'error');
        setSenders([]);
      } else {
        setSenders(data.senders || []);
      }
    } catch {
      showToast('Erreur réseau', 'error');
    }
    setLoading(false);
  }

  async function handleVerify(id, { silent = false } = {}) {
    setVerifyingId(id);
    try {
      const res = await fetch(`/api/email-senders/${id}/verify`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        if (!silent) showToast(data.error || 'Vérification impossible', 'error');
        return null;
      }
      setSenders((prev) => prev.map((s) => (s.id === id ? data.sender : s)));
      if (!silent) {
        if (data.sender.status === 'verified') {
          showToast('Domaine vérifié. Tu peux lancer une campagne.', 'success');
        } else if (data.sender.status === 'failed') {
          showToast('La vérif a échoué. Check tes DNS.', 'error');
        } else {
          showToast('DNS en cours de propagation (1-24h).', 'success');
        }
      }
      return data.sender;
    } catch {
      if (!silent) showToast('Erreur réseau', 'error');
      return null;
    } finally {
      setVerifyingId(null);
    }
  }

  async function handleStartWarmup(senderId) {
    setStartingWarmupId(senderId);
    try {
      const res = await fetch(`/api/email-senders/${senderId}/warmup`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Impossible de démarrer le warmup', 'error');
        return;
      }
      setSenders((prev) =>
        prev.map((s) => (s.id === senderId ? { ...s, warmup: data.warmup } : s))
      );
      showToast('Warmup lancé. 28 jours, on s\'occupe du reste.', 'success');
    } catch {
      showToast('Erreur réseau', 'error');
    } finally {
      setStartingWarmupId(null);
    }
  }

  async function performDelete() {
    const sender = senderToDelete;
    if (!sender) return;
    const id = sender.id;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/email-senders/${id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast(data.error || 'Suppression impossible', 'error');
        return;
      }
      setSenders((prev) => prev.filter((s) => s.id !== id));
      showToast('Domaine supprimé.', 'success');
    } catch {
      showToast('Erreur réseau', 'error');
    } finally {
      setDeletingId(null);
      setSenderToDelete(null);
    }
  }

  function openWizard() {
    setWizardOpen(true);
    setWizardStep(1);
    setWizardRoot('');
    setWizardDomain('');
    setWizardFromName('');
    setWizardCreated(null);
  }

  function closeWizard() {
    setWizardOpen(false);
    setWizardSubmitting(false);
    setWizardVerifying(false);
    setWizardCreated(null);
    // Re-sync la liste pour récupérer le nouveau sender si on close après step 2/3.
    loadSenders();
  }

  // Quand l'user tape le domaine racine, on suggère un sous-domaine.
  const suggestedSendDomain = useMemo(() => suggestSendDomain(wizardRoot), [wizardRoot]);
  useEffect(() => {
    if (wizardStep === 1 && suggestedSendDomain && !wizardDomain) {
      setWizardDomain(suggestedSendDomain);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [suggestedSendDomain, wizardStep]);

  async function handleWizardCreate(e) {
    e.preventDefault();
    if (!wizardDomain.trim()) {
      showToast('Saisissez un domaine.', 'error');
      return;
    }
    setWizardSubmitting(true);
    try {
      const res = await fetch('/api/email-senders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain: wizardDomain.trim(),
          from_name: wizardFromName.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Erreur création', 'error');
        return;
      }
      setWizardCreated(data.sender);
      setSenders((prev) => [data.sender, ...prev]);
      setWizardStep(2);
    } catch {
      showToast('Erreur réseau', 'error');
    } finally {
      setWizardSubmitting(false);
    }
  }

  async function handleWizardVerify() {
    if (!wizardCreated) return;
    setWizardVerifying(true);
    const updated = await handleVerify(wizardCreated.id, { silent: true });
    setWizardVerifying(false);
    if (updated) {
      setWizardCreated(updated);
      setWizardStep(3);
    } else {
      showToast('Vérification impossible. Réessayez dans quelques minutes.', 'error');
    }
  }

  return (
    <div className="min-h-screen bg-surface-base text-content-primary">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-[100] flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium shadow-lg animate-in fade-in slide-in-from-top-2 ${
            toast.type === 'success'
              ? 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/30'
              : 'bg-red-500/15 text-red-600 border border-red-500/30'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <AlertTriangle className="h-4 w-4" />
          )}
          {toast.message}
          <button onClick={() => setToast(null)} className="ml-2 hover:opacity-70">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Header sticky */}
      <header className="sticky top-0 z-30 border-b border-line bg-surface-base/85 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
          <button
            onClick={() => router.push('/settings')}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-surface-elevated transition-colors text-content-tertiary hover:text-content-primary text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Paramètres</span>
          </button>
          <div className="h-6 w-px bg-line mx-1" />
          <Mail className="h-4 w-4 text-violet-500" />
          <h1 className="text-base font-semibold text-content-primary">
            Domaines d&apos;envoi email
          </h1>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 lg:py-10 space-y-6">
        {/* Intro */}
        <section className="rounded-2xl border border-line bg-gradient-to-br from-violet-500/[0.06] via-indigo-500/[0.04] to-surface-card p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 p-2 rounded-lg bg-violet-500/15">
              <Globe className="h-5 w-5 text-violet-500" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-semibold text-content-primary">
                Envoyez vos campagnes depuis votre propre domaine
              </h2>
              <p className="text-sm text-content-secondary mt-1 leading-relaxed">
                Connectez un domaine (ex&nbsp;: <code className="font-mono text-xs">send.votre-marque.fr</code>),
                ajoutez les records DNS fournis par Volia, et vos prospects
                recevront vos emails depuis votre marque — pas la nôtre.
                Cela maximise la délivrabilité (DKIM, SPF, DMARC alignés).
              </p>
            </div>
          </div>
        </section>

        {/* Bouton créer */}
        {!wizardOpen && (
          <div className="flex justify-end">
            <button
              onClick={openWizard}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-semibold shadow-lg shadow-violet-500/30 hover:shadow-xl hover:shadow-violet-500/40 hover:from-violet-500 hover:to-indigo-500 transition-all active:scale-[0.98]"
            >
              <Plus className="h-4 w-4" />
              Connecter un domaine
            </button>
          </div>
        )}

        {/* Wizard inline */}
        {wizardOpen && (
          <section className="rounded-2xl border border-violet-500/30 bg-surface-card p-5 sm:p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-violet-500/15">
                  <Plus className="h-5 w-5 text-violet-500" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-content-primary">
                    Connecter un nouveau domaine
                  </h3>
                  <p className="text-xs text-content-tertiary mt-0.5">
                    Étape {wizardStep} sur 3
                  </p>
                </div>
              </div>
              <button
                onClick={closeWizard}
                className="p-1.5 rounded-lg hover:bg-surface-elevated text-content-tertiary"
                aria-label="Fermer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Progress dots */}
            <div className="flex items-center gap-2 mb-6">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`h-1.5 flex-1 rounded-full transition-colors ${
                    s <= wizardStep ? 'bg-violet-500' : 'bg-surface-elevated'
                  }`}
                />
              ))}
            </div>

            {wizardStep === 1 && (
              <form onSubmit={handleWizardCreate} className="space-y-4">
                <div>
                  <label className="text-xs text-content-tertiary mb-1.5 block font-medium">
                    Domaine racine de votre marque
                  </label>
                  <input
                    type="text"
                    value={wizardRoot}
                    onChange={(e) => setWizardRoot(e.target.value)}
                    placeholder="ex: cabinet-dupont.fr"
                    className="w-full px-3 py-2.5 rounded-lg bg-surface-base border border-line text-sm text-content-primary placeholder-content-muted focus:outline-none focus:border-violet-500 transition-colors"
                  />
                  <p className="text-[11px] text-content-tertiary mt-1.5">
                    On vous propose un sous-domaine d&apos;envoi dédié, sans toucher à vos emails actuels.
                  </p>
                </div>

                <div>
                  <label className="text-xs text-content-tertiary mb-1.5 block font-medium">
                    Domaine d&apos;envoi (sous-domaine recommandé)
                  </label>
                  <input
                    type="text"
                    value={wizardDomain}
                    onChange={(e) => setWizardDomain(e.target.value)}
                    placeholder="send.cabinet-dupont.fr"
                    required
                    className="w-full px-3 py-2.5 rounded-lg bg-surface-base border border-line text-sm text-content-primary placeholder-content-muted focus:outline-none focus:border-violet-500 transition-colors font-mono"
                  />
                  <p className="text-[11px] text-content-tertiary mt-1.5 flex items-start gap-1.5">
                    <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                    Utilisez de préférence un sous-domaine dédié (ex: <code className="font-mono">send.</code>).
                    Cela isole l&apos;envoi marketing de votre messagerie principale.
                  </p>
                </div>

                <div>
                  <label className="text-xs text-content-tertiary mb-1.5 block font-medium">
                    Nom expéditeur affiché <span className="text-content-muted">(optionnel)</span>
                  </label>
                  <input
                    type="text"
                    value={wizardFromName}
                    onChange={(e) => setWizardFromName(e.target.value)}
                    placeholder="ex: Cabinet Dupont"
                    maxLength={80}
                    className="w-full px-3 py-2.5 rounded-lg bg-surface-base border border-line text-sm text-content-primary placeholder-content-muted focus:outline-none focus:border-violet-500 transition-colors"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={closeWizard}
                    className="px-4 py-2.5 rounded-lg text-sm border border-line bg-surface-card hover:bg-surface-elevated text-content-secondary transition"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={wizardSubmitting || !wizardDomain.trim()}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-500 hover:to-indigo-500 transition disabled:opacity-40"
                  >
                    {wizardSubmitting ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        Continuer
                        <ChevronRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {wizardStep === 2 && wizardCreated && (
              <div className="space-y-4">
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 flex items-start gap-2">
                  <Info className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-amber-700 leading-relaxed">
                    Ajoutez ces records DNS chez votre registrar (Infomaniak, OVH, Gandi,
                    Cloudflare, etc.). La propagation prend généralement
                    <strong> de quelques minutes à 24h</strong>. Une fois fait, revenez ici et cliquez sur
                    « J&apos;ai configuré, vérifier ».
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-content-primary mb-2">
                    Records DNS pour <code className="font-mono text-violet-500">{wizardCreated.domain}</code>
                  </h4>
                  <DnsTable records={wizardCreated.dns_records} />
                </div>

                <details className="rounded-lg border border-line bg-surface-base">
                  <summary className="cursor-pointer px-3 py-2 text-xs font-semibold text-content-secondary hover:bg-surface-elevated">
                    Guides registrar (Infomaniak / OVH / Gandi / Cloudflare)
                  </summary>
                  <div className="px-3 py-3 border-t border-line space-y-2 text-xs text-content-tertiary">
                    <p>
                      <strong className="text-content-secondary">Infomaniak :</strong>{' '}
                      Hébergement &gt; Domaines &gt; votre domaine &gt; Zone DNS &gt; Ajouter une entrée.
                      Pour le champ « Source / Host », n&apos;indiquez que la partie avant votre domaine
                      (ex: <code className="font-mono">resend._domainkey.send</code>).
                    </p>
                    <p>
                      <strong className="text-content-secondary">OVH :</strong>{' '}
                      Espace client &gt; Domaines &gt; Zone DNS &gt; Ajouter une entrée.
                      OVH attend la même convention que ci-dessus (sans le domaine racine).
                    </p>
                    <p>
                      <strong className="text-content-secondary">Gandi :</strong>{' '}
                      Onglet DNS Records de votre domaine &gt; bouton « Add ».
                    </p>
                    <p>
                      <strong className="text-content-secondary">Cloudflare :</strong>{' '}
                      DNS &gt; Records &gt; Add record. <strong>Désactivez le « proxy »</strong>{' '}
                      (nuage gris) pour les records MX et TXT.
                    </p>
                  </div>
                </details>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setWizardStep(1)}
                    className="px-4 py-2.5 rounded-lg text-sm border border-line bg-surface-card hover:bg-surface-elevated text-content-secondary transition"
                  >
                    Retour
                  </button>
                  <button
                    onClick={handleWizardVerify}
                    disabled={wizardVerifying}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-500 hover:to-indigo-500 transition disabled:opacity-40"
                  >
                    {wizardVerifying ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4" />
                    )}
                    J&apos;ai configuré, vérifier
                  </button>
                </div>
              </div>
            )}

            {wizardStep === 3 && wizardCreated && (
              <div className="space-y-4">
                {wizardCreated.status === 'verified' ? (
                  <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="text-sm font-semibold text-emerald-700">
                        C&apos;est bon, vous pouvez créer une campagne !
                      </h4>
                      <p className="text-xs text-emerald-700/80 mt-1 leading-relaxed">
                        Votre domaine <code className="font-mono">{wizardCreated.domain}</code>{' '}
                        est vérifié. Vos campagnes Volia partiront désormais depuis votre marque.
                      </p>
                    </div>
                  </div>
                ) : wizardCreated.status === 'failed' ? (
                  <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="text-sm font-semibold text-red-700">Vérification échouée</h4>
                      <p className="text-xs text-red-700/80 mt-1 leading-relaxed">
                        Vérifiez que les records DNS sont bien copiés à l&apos;identique
                        (host, valeur, type). Vous pouvez relancer une vérification depuis la
                        liste des domaines.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 flex items-start gap-3">
                    <Clock className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="text-sm font-semibold text-amber-700">
                        DNS en cours de propagation
                      </h4>
                      <p className="text-xs text-amber-700/80 mt-1 leading-relaxed">
                        Les records sont en attente. Cela peut prendre <strong>1 à 24h</strong>.
                        Pas besoin de rester sur cette page : vous pouvez revenir plus tard
                        et cliquer sur « Vérifier maintenant ».
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setWizardStep(2)}
                    className="px-4 py-2.5 rounded-lg text-sm border border-line bg-surface-card hover:bg-surface-elevated text-content-secondary transition"
                  >
                    Revoir les DNS
                  </button>
                  <button
                    onClick={closeWizard}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-violet-600 text-white hover:bg-violet-500 transition"
                  >
                    Terminé
                  </button>
                </div>
              </div>
            )}
          </section>
        )}

        {/* Liste des senders */}
        <section className="space-y-3">
          {loading ? (
            <div className="rounded-2xl border border-line bg-surface-card p-8 flex items-center justify-center">
              <RefreshCw className="h-5 w-5 text-violet-500 animate-spin" />
            </div>
          ) : senders.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-line bg-surface-card p-8 text-center">
              <Mail className="h-8 w-8 text-content-muted mx-auto mb-2" />
              <h3 className="text-sm font-semibold text-content-primary">
                Aucun domaine connecté
              </h3>
              <p className="text-xs text-content-tertiary mt-1">
                Connectez votre premier domaine pour envoyer des campagnes depuis votre marque.
              </p>
            </div>
          ) : (
            senders.map((s) => {
              const badge = statusBadge(s.status);
              const Icon = badge.icon;
              const isExpanded = expandedDnsId === s.id;
              return (
                <div
                  key={s.id}
                  className="rounded-2xl border border-line bg-surface-card p-5"
                >
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center flex-wrap gap-2">
                        <code className="font-mono text-sm font-semibold text-content-primary">
                          {s.domain}
                        </code>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${badge.cls}`}
                        >
                          <Icon className="h-3 w-3" />
                          {badge.label}
                        </span>
                      </div>
                      {s.from_name && (
                        <p className="text-xs text-content-tertiary mt-1">
                          Expéditeur affiché : <strong>{s.from_name}</strong>
                        </p>
                      )}
                      <p className="text-[11px] text-content-muted mt-1">
                        Créé le {new Date(s.created_at).toLocaleDateString('fr-FR')}
                        {s.verified_at && (
                          <>
                            {' '}
                            · vérifié le {new Date(s.verified_at).toLocaleDateString('fr-FR')}
                          </>
                        )}
                        {s.last_check_at && (
                          <>
                            {' '}
                            · dernier check{' '}
                            {new Date(s.last_check_at).toLocaleString('fr-FR', {
                              dateStyle: 'short',
                              timeStyle: 'short',
                            })}
                          </>
                        )}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => handleVerify(s.id)}
                        disabled={verifyingId === s.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-violet-500/10 text-violet-600 hover:bg-violet-500/20 border border-violet-500/30 transition disabled:opacity-40"
                      >
                        {verifyingId === s.id ? (
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <RefreshCw className="h-3.5 w-3.5" />
                        )}
                        Vérifier maintenant
                      </button>
                      <button
                        onClick={() => setExpandedDnsId(isExpanded ? null : s.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-line bg-surface-card hover:bg-surface-elevated text-content-secondary transition"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        {isExpanded ? 'Masquer DNS' : 'Voir les records DNS'}
                      </button>
                      <button
                        onClick={() => setSenderToDelete(s)}
                        disabled={deletingId === s.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/30 transition disabled:opacity-40"
                      >
                        {deletingId === s.id ? (
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                        Supprimer
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-line">
                      <DnsTable records={s.dns_records} />
                    </div>
                  )}

                  <WarmupSection
                    sender={s}
                    onStart={handleStartWarmup}
                    starting={startingWarmupId === s.id}
                  />
                </div>
              );
            })
          )}
        </section>
      </div>

      <ConfirmModal
        open={!!senderToDelete}
        onClose={() => !deletingId && setSenderToDelete(null)}
        onConfirm={performDelete}
        title={`Supprimer le domaine ${senderToDelete?.domain || ''} ?`}
        message="Les campagnes existantes resteront, mais vous ne pourrez plus envoyer de nouveaux emails depuis cette adresse. Vous devrez reconnecter ce domaine si vous changez d'avis."
        confirmLabel="Supprimer le domaine"
        variant="danger"
        loading={!!deletingId}
      />
    </div>
  );
}
