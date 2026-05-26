'use client';

// Page de gestion des numéros SMS d'envoi.
// Deux modes de connexion :
//   1. Volia-managed : 1 clic, on provisionne un numéro Twilio via notre compte
//   2. BYO          : le user fournit account_sid + auth_token + phone_number

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Phone, Plus, Trash2, RefreshCw, CheckCircle, AlertTriangle,
  X, Sparkles, Settings as SettingsIcon, Eye, EyeOff, Loader2,
} from 'lucide-react';

function maskPhone(phone) {
  if (!phone || typeof phone !== 'string') return '';
  const tail = phone.slice(-4);
  return `••• ••• ${tail}`;
}

function StatusBadge({ status }) {
  const map = {
    active: { label: 'Actif', cls: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30', icon: CheckCircle },
    pending: { label: 'En attente', cls: 'bg-amber-500/10 text-amber-500 border-amber-500/30', icon: RefreshCw },
    failed: { label: 'Échec', cls: 'bg-red-500/10 text-red-500 border-red-500/30', icon: AlertTriangle },
  };
  const meta = map[status] || map.pending;
  const Icon = meta.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${meta.cls}`}>
      <Icon className="h-3 w-3" />
      {meta.label}
    </span>
  );
}

function TypeBadge({ type }) {
  if (type === 'volia_managed') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-violet-500/10 text-violet-500 border border-violet-500/30">
        <Sparkles className="h-3 w-3" /> Volia
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-500/10 text-blue-500 border border-blue-500/30">
      <SettingsIcon className="h-3 w-3" /> BYO Twilio
    </span>
  );
}

function Toast({ toast, onClose }) {
  if (!toast) return null;
  const isErr = toast.type === 'error';
  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm">
      <div className={`rounded-xl border p-4 shadow-lg flex items-start gap-3 ${
        isErr ? 'bg-red-500/10 border-red-500/30 text-red-500' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
      }`}>
        {isErr ? <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" /> : <CheckCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />}
        <p className="text-sm flex-1">{toast.message}</p>
        <button onClick={onClose} className="text-current opacity-70 hover:opacity-100">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export default function SmsSendersPage() {
  const router = useRouter();
  const [senders, setSenders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [busyId, setBusyId] = useState(null);

  // Modal "Connecter un numéro"
  const [showModal, setShowModal] = useState(false);
  const [modalStep, setModalStep] = useState('choose'); // 'choose' | 'byo'
  const [submitting, setSubmitting] = useState(false);

  // Form BYO
  const [byoSid, setByoSid] = useState('');
  const [byoToken, setByoToken] = useState('');
  const [byoPhone, setByoPhone] = useState('');
  const [showToken, setShowToken] = useState(false);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(t);
  }, [toast]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/sms-senders', { credentials: 'include' });
      if (res.status === 401) {
        router.push('/login');
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Erreur chargement');
      setSenders(data.senders || []);
    } catch (err) {
      showToast(err.message || 'Erreur réseau', 'error');
    }
    setLoading(false);
  }, [router, showToast]);

  useEffect(() => {
    load();
  }, [load]);

  function resetModal() {
    setModalStep('choose');
    setByoSid('');
    setByoToken('');
    setByoPhone('');
    setShowToken(false);
    setSubmitting(false);
  }

  function closeModal() {
    setShowModal(false);
    resetModal();
  }

  async function connectManaged() {
    setSubmitting(true);
    try {
      const res = await fetch('/api/sms-senders', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'volia_managed', country_code: 'FR' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Erreur provisioning');
      showToast(`Numéro Volia connecté : ${data.sender?.phone_number || ''}`);
      closeModal();
      load();
    } catch (err) {
      showToast(err.message || 'Erreur réseau', 'error');
    }
    setSubmitting(false);
  }

  async function connectByo(e) {
    e.preventDefault();
    if (!/^\+[1-9]\d{6,14}$/.test(byoPhone)) {
      showToast('Numéro invalide (format E.164, ex: +33612345678)', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/sms-senders', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'byo',
          account_sid: byoSid.trim(),
          auth_token: byoToken,
          phone_number: byoPhone.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Erreur connexion');
      showToast('Numéro BYO connecté avec succès');
      closeModal();
      load();
    } catch (err) {
      showToast(err.message || 'Erreur réseau', 'error');
    }
    setSubmitting(false);
  }

  async function verifySender(id) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/sms-senders/${id}/verify`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Erreur vérification');
      if (data.valid) {
        showToast('Numéro vérifié avec succès');
      } else {
        showToast(`Échec vérification : ${data.error || 'inconnu'}`, 'error');
      }
      load();
    } catch (err) {
      showToast(err.message || 'Erreur réseau', 'error');
    }
    setBusyId(null);
  }

  async function deleteSender(id, type) {
    const msg = type === 'volia_managed'
      ? 'Supprimer ce numéro Volia ? Il sera libéré côté Twilio (action irréversible).'
      : 'Retirer ce numéro BYO ? Vos credentials chiffrés seront supprimés.';
    if (!confirm(msg)) return;
    setBusyId(id);
    try {
      const res = await fetch(`/api/sms-senders/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Erreur suppression');
      showToast('Numéro supprimé');
      load();
    } catch (err) {
      showToast(err.message || 'Erreur réseau', 'error');
    }
    setBusyId(null);
  }

  return (
    <div className="min-h-screen bg-surface-base">
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* Header */}
      <div className="border-b border-line bg-surface-card">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 flex items-center gap-4">
          <Link
            href="/settings"
            className="inline-flex items-center gap-1.5 text-sm text-content-tertiary hover:text-content-primary transition"
          >
            <ArrowLeft className="h-4 w-4" />
            Paramètres
          </Link>
          <div className="h-5 w-px bg-line" />
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-violet-500/10">
              <Phone className="h-4 w-4 text-violet-500" />
            </div>
            <h1 className="text-base font-semibold text-content-primary">Numéros SMS d&apos;envoi</h1>
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-end justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-semibold text-content-primary">Vos numéros connectés</h2>
            <p className="text-sm text-content-tertiary mt-1">
              Connectez un numéro Twilio pour envoyer des campagnes SMS à vos prospects.
            </p>
          </div>
          <button
            onClick={() => { resetModal(); setShowModal(true); }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-500 hover:to-indigo-500 shadow shadow-violet-500/20 transition"
          >
            <Plus className="h-4 w-4" />
            Connecter un numéro
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-content-tertiary">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Chargement…
          </div>
        ) : senders.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-line bg-surface-card p-10 text-center">
            <div className="inline-flex p-3 rounded-full bg-violet-500/10 mb-3">
              <Phone className="h-6 w-6 text-violet-500" />
            </div>
            <h3 className="text-base font-semibold text-content-primary">Aucun numéro connecté</h3>
            <p className="text-sm text-content-tertiary mt-1 max-w-md mx-auto">
              Pour lancer une campagne SMS, vous devez d&apos;abord connecter au moins un numéro d&apos;envoi.
            </p>
            <button
              onClick={() => { resetModal(); setShowModal(true); }}
              className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-violet-500/10 text-violet-600 border border-violet-500/30 hover:bg-violet-500/20 transition"
            >
              <Plus className="h-4 w-4" />
              Connecter mon premier numéro
            </button>
          </div>
        ) : (
          <div className="grid gap-3">
            {senders.map((s) => (
              <div key={s.id} className="rounded-xl border border-line bg-surface-card p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="p-2 rounded-lg bg-violet-500/10">
                    <Phone className="h-5 w-5 text-violet-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-mono font-medium text-content-primary">
                        {maskPhone(s.phone_number)}
                      </span>
                      <TypeBadge type={s.type} />
                      <StatusBadge status={s.status} />
                    </div>
                    <p className="text-xs text-content-tertiary mt-1 truncate">
                      {s.friendly_name || 'Sans nom'} · ajouté le {new Date(s.created_at).toLocaleDateString('fr-FR')}
                      {s.verified_at && ` · vérifié le ${new Date(s.verified_at).toLocaleDateString('fr-FR')}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => verifySender(s.id)}
                    disabled={busyId === s.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-line bg-surface-base hover:bg-surface-elevated text-content-primary disabled:opacity-50 transition"
                  >
                    {busyId === s.id ? (
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="h-3.5 w-3.5" />
                    )}
                    Tester
                  </button>
                  <button
                    onClick={() => deleteSender(s.id, s.type)}
                    disabled={busyId === s.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 text-red-500 border border-red-500/30 hover:bg-red-500/20 disabled:opacity-50 transition"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal de connexion */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={closeModal}>
          <div
            className="bg-surface-card border border-line rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-line">
              <h3 className="text-base font-semibold text-content-primary">
                {modalStep === 'choose' ? 'Connecter un numéro SMS' : 'Connecter votre compte Twilio'}
              </h3>
              <button onClick={closeModal} className="p-1.5 rounded-lg hover:bg-surface-elevated text-content-tertiary">
                <X className="h-4 w-4" />
              </button>
            </div>

            {modalStep === 'choose' && (
              <div className="p-5 space-y-3">
                <button
                  onClick={connectManaged}
                  disabled={submitting}
                  className="w-full text-left p-4 rounded-xl border border-line bg-surface-base hover:border-violet-500/50 hover:bg-violet-500/[0.03] disabled:opacity-50 transition group"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-violet-500/10 group-hover:bg-violet-500/20 transition">
                      <Sparkles className="h-5 w-5 text-violet-500" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-content-primary">Numéro Volia dédié</p>
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/30">
                          Recommandé
                        </span>
                      </div>
                      <p className="text-xs text-content-tertiary mt-1">
                        1€/mois inclus dans le plan Business. Nous provisionnons un numéro mobile français en 1 clic.
                      </p>
                      {submitting && (
                        <p className="text-xs text-violet-500 mt-2 inline-flex items-center gap-1.5">
                          <Loader2 className="h-3 w-3 animate-spin" /> Provisioning en cours…
                        </p>
                      )}
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setModalStep('byo')}
                  disabled={submitting}
                  className="w-full text-left p-4 rounded-xl border border-line bg-surface-base hover:border-blue-500/50 hover:bg-blue-500/[0.03] disabled:opacity-50 transition group"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/10 group-hover:bg-blue-500/20 transition">
                      <SettingsIcon className="h-5 w-5 text-blue-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-content-primary">Mon compte Twilio (avancé)</p>
                      <p className="text-xs text-content-tertiary mt-1">
                        Connectez votre propre compte Twilio. Vos credentials sont chiffrés AES-256-GCM avant stockage.
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            )}

            {modalStep === 'byo' && (
              <form onSubmit={connectByo} className="p-5 space-y-4">
                <button
                  type="button"
                  onClick={() => setModalStep('choose')}
                  className="text-xs text-content-tertiary hover:text-content-primary inline-flex items-center gap-1"
                >
                  <ArrowLeft className="h-3 w-3" />
                  Retour
                </button>

                <div>
                  <label className="text-xs font-medium text-content-tertiary mb-1.5 block">
                    Twilio Account SID
                  </label>
                  <input
                    type="text"
                    value={byoSid}
                    onChange={(e) => setByoSid(e.target.value)}
                    placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    required
                    pattern="^AC[a-fA-F0-9]{32}$"
                    className="w-full px-3 py-2.5 rounded-lg bg-surface-base border border-line text-sm font-mono text-content-primary placeholder-content-muted focus:outline-none focus:border-violet-500 transition"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-content-tertiary mb-1.5 block">
                    Twilio Auth Token
                  </label>
                  <div className="relative">
                    <input
                      type={showToken ? 'text' : 'password'}
                      value={byoToken}
                      onChange={(e) => setByoToken(e.target.value)}
                      placeholder="••••••••••••••••••••••••••••••••"
                      required
                      className="w-full px-3 py-2.5 pr-10 rounded-lg bg-surface-base border border-line text-sm font-mono text-content-primary placeholder-content-muted focus:outline-none focus:border-violet-500 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowToken((v) => !v)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-content-muted hover:text-content-primary"
                    >
                      {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-content-muted mt-1">
                    Chiffré AES-256-GCM. Jamais retourné par l&apos;API.
                  </p>
                </div>

                <div>
                  <label className="text-xs font-medium text-content-tertiary mb-1.5 block">
                    Numéro Twilio (format E.164)
                  </label>
                  <input
                    type="text"
                    value={byoPhone}
                    onChange={(e) => setByoPhone(e.target.value)}
                    placeholder="+33612345678"
                    required
                    pattern="^\+[1-9]\d{6,14}$"
                    className="w-full px-3 py-2.5 rounded-lg bg-surface-base border border-line text-sm font-mono text-content-primary placeholder-content-muted focus:outline-none focus:border-violet-500 transition"
                  />
                </div>

                <div className="pt-2 flex items-center gap-2 justify-end">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 rounded-lg text-sm font-medium border border-line bg-surface-base hover:bg-surface-elevated text-content-primary transition"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 transition"
                  >
                    {submitting ? (
                      <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Vérification…</>
                    ) : (
                      <>Connecter</>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
