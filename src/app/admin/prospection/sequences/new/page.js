'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, GitBranch, Loader2, Plus, Trash2, Save, AlertTriangle, LogIn,
} from 'lucide-react';
import { getSupabase } from '@/lib/supabase';
import { CAMPAGNES_ALLOWED_PLANS } from '@/lib/campagnes-access';

const DEFAULT_STEPS = [
  { wait_days: 0, subject: '', body_html: '' },
  { wait_days: 3, subject: 'Re: {{first_name}}', body_html: 'Bonjour {{first_name}},\n\nJe me permets de relancer suite à mon premier message.\n\nÀ disposition.' },
  { wait_days: 7, subject: 'Dernière relance', body_html: 'Bonjour {{first_name}},\n\nDernier message de ma part — je vous laisse tranquille après ça.\n\nBien cordialement.' },
];

export default function NewSequencePage() {
  const router = useRouter();
  const supabase = getSupabase();
  const [authState, setAuthState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [lists, setLists] = useState([]);
  const [senders, setSenders] = useState([]);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [listId, setListId] = useState('');
  const [senderId, setSenderId] = useState('');
  const [dailyLimit, setDailyLimit] = useState(50);
  const [stopOnReply, setStopOnReply] = useState(true);
  const [steps, setSteps] = useState(DEFAULT_STEPS);

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
        const verified = (data.senders || data.email_senders || []).filter((s) => s.status === 'verified');
        setSenders(verified);
        if (verified.length === 1) setSenderId(verified[0].id);
      }
      setLoading(false);
    })();
  }, [supabase, router]);

  function updateStep(idx, patch) {
    setSteps((prev) => prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  }
  function addStep() {
    if (steps.length >= 10) return;
    setSteps((prev) => [...prev, { wait_days: 3, subject: '', body_html: '' }]);
  }
  function removeStep(idx) {
    if (steps.length <= 1) return;
    setSteps((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (submitting) return;
    setError(null);

    if (!name.trim()) return setError('Nom requis');
    if (!listId) return setError('Choisissez une liste');
    if (!senderId) return setError('Choisissez un sender vérifié');
    for (let i = 0; i < steps.length; i++) {
      if (!steps[i].subject.trim()) return setError(`Step ${i + 1} : sujet requis`);
      if (!steps[i].body_html.trim()) return setError(`Step ${i + 1} : contenu requis`);
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/prospection/sequences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          list_id: listId,
          email_sender_id: senderId,
          daily_limit: Number(dailyLimit) || 50,
          stop_on_reply: stopOnReply,
          steps: steps.map((s, i) => ({
            wait_days: i === 0 ? 0 : Number(s.wait_days) || 0,
            subject: s.subject.trim(),
            body_html: s.body_html.trim(),
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Erreur création séquence');
        setSubmitting(false);
        return;
      }
      router.push(`/admin/prospection/sequences/${data.sequence.id}`);
    } catch (err) {
      setError(err.message || 'Erreur réseau');
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-base flex items-center justify-center">
        <Loader2 className="animate-spin text-content-tertiary" size={24} />
      </div>
    );
  }
  if (authState === 'guest') {
    return (
      <div className="min-h-screen bg-surface-base flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-2xl border border-line bg-surface-card p-8 text-center">
          <div className="w-12 h-12 mx-auto rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center mb-4">
            <LogIn size={20} className="text-blue-500" />
          </div>
          <h1 className="text-xl font-bold mb-2">Connexion requise</h1>
          <Link href="/login?return=/admin/prospection/sequences/new" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition">
            <LogIn size={14} /> Se connecter
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-base text-content-primary p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/admin/prospection/sequences" className="inline-flex items-center gap-2 text-sm text-content-tertiary hover:text-blue-500 transition mb-2">
          <ArrowLeft size={14} />
          Séquences
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2 mb-6">
          <GitBranch size={24} className="text-blue-500" />
          Nouvelle séquence
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section infos */}
          <section className="rounded-2xl border border-line bg-surface-card p-5 sm:p-6 space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-content-tertiary">1. Informations</h2>
            <div>
              <label className="block text-xs font-medium text-content-secondary mb-1">Nom *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Cold outreach SaaS PME"
                className="w-full px-3 py-2 rounded-lg bg-surface-base border border-line text-sm focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-content-secondary mb-1">Description</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optionnel — pour vos notes internes"
                className="w-full px-3 py-2 rounded-lg bg-surface-base border border-line text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-content-secondary mb-1">Liste de prospects *</label>
                <select
                  value={listId}
                  onChange={(e) => setListId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-surface-base border border-line text-sm focus:outline-none focus:border-blue-500"
                  required
                >
                  <option value="">— Sélectionner —</option>
                  {lists.map((l) => (
                    <option key={l.id} value={l.id}>{l.name} ({l.contacts_count || 0} contacts)</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-content-secondary mb-1">Domaine d&apos;envoi *</label>
                <select
                  value={senderId}
                  onChange={(e) => setSenderId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-surface-base border border-line text-sm focus:outline-none focus:border-blue-500"
                  required
                >
                  <option value="">— Sélectionner —</option>
                  {senders.map((s) => (
                    <option key={s.id} value={s.id}>{s.domain}</option>
                  ))}
                </select>
                {senders.length === 0 && (
                  <p className="text-xs text-amber-500 mt-1 flex items-center gap-1">
                    <AlertTriangle size={11} />
                    Aucun domaine vérifié — <Link href="/settings/email-senders" className="underline ml-1">configurer</Link>
                  </p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-content-secondary mb-1">Limite par jour</label>
                <input
                  type="number"
                  min="1"
                  max="500"
                  value={dailyLimit}
                  onChange={(e) => setDailyLimit(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-surface-base border border-line text-sm focus:outline-none focus:border-blue-500"
                />
                <p className="text-[10px] text-content-tertiary mt-1">Max d&apos;emails envoyés/jour, tous steps confondus.</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-content-secondary mb-1">Stop-on-reply</label>
                <label className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-base border border-line cursor-pointer hover:border-blue-500/40">
                  <input
                    type="checkbox"
                    checked={stopOnReply}
                    onChange={(e) => setStopOnReply(e.target.checked)}
                    className="accent-blue-500"
                  />
                  <span className="text-sm">Arrêter les follow-ups si le prospect répond</span>
                </label>
              </div>
            </div>
          </section>

          {/* Section steps */}
          <section className="rounded-2xl border border-line bg-surface-card p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-content-tertiary">2. Étapes ({steps.length})</h2>
              <button
                type="button"
                onClick={addStep}
                disabled={steps.length >= 10}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-600 hover:bg-blue-500/15 text-xs font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus size={12} />
                Ajouter
              </button>
            </div>

            {steps.map((step, idx) => (
              <div key={idx} className="rounded-xl border border-line bg-surface-base p-4 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-blue-500/15 text-blue-600 flex items-center justify-center text-xs font-bold">
                      {idx + 1}
                    </div>
                    {idx === 0 ? (
                      <span className="text-xs text-content-tertiary">Envoi immédiat (J+0)</span>
                    ) : (
                      <div className="flex items-center gap-2 text-xs text-content-tertiary">
                        <span>Envoi</span>
                        <input
                          type="number"
                          min="1"
                          max="60"
                          value={step.wait_days}
                          onChange={(e) => updateStep(idx, { wait_days: Number(e.target.value) })}
                          className="w-14 px-2 py-1 rounded bg-surface-card border border-line text-xs"
                        />
                        <span>jours après step {idx}</span>
                      </div>
                    )}
                  </div>
                  {steps.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeStep(idx)}
                      className="p-1.5 rounded-md text-content-tertiary hover:text-red-500 hover:bg-red-500/10 transition"
                      aria-label="Supprimer ce step"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={step.subject}
                  onChange={(e) => updateStep(idx, { subject: e.target.value })}
                  placeholder="Sujet de l'email"
                  className="w-full px-3 py-2 rounded-lg bg-surface-card border border-line text-sm focus:outline-none focus:border-blue-500"
                />
                <textarea
                  value={step.body_html}
                  onChange={(e) => updateStep(idx, { body_html: e.target.value })}
                  placeholder="Contenu de l'email (variables : {{first_name}}, {{last_name}}, {{company}})"
                  rows={6}
                  className="w-full px-3 py-2 rounded-lg bg-surface-card border border-line text-sm font-mono focus:outline-none focus:border-blue-500 resize-y"
                />
              </div>
            ))}
          </section>

          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-500 flex items-center gap-2">
              <AlertTriangle size={14} />
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-3">
            <Link
              href="/admin/prospection/sequences"
              className="px-4 py-2 rounded-lg text-sm font-medium text-content-secondary hover:text-content-primary transition"
            >
              Annuler
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition shadow-lg shadow-blue-500/20 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Créer la séquence
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
