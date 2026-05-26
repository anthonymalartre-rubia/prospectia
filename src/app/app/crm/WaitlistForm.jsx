'use client';

// ─────────────────────────────────────────────────────────────────────
// WaitlistForm (in-app variant) — formulaire d'inscription beta CRM
// ─────────────────────────────────────────────────────────────────────
// Réutilise /api/newsletter/subscribe avec source='crm-waitlist-app'
// pour différencier des inscrits via la landing /produits/crm
// (source='crm-waitlist') côté analytics.
// ─────────────────────────────────────────────────────────────────────

import { useState } from 'react';
import { ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';

export default function WaitlistForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (status === 'loading') return;
    setStatus('loading');
    setMessage('');
    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          source: 'crm-waitlist-app',
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus('error');
        setMessage(data.error || 'Erreur — réessayez');
        return;
      }
      setStatus('success');
      setMessage(
        data.status === 'reactivated'
          ? 'Bon retour ! Vous serez notifié au lancement.'
          : data.status === 'already_subscribed'
          ? 'Vous êtes déjà sur la waitlist, parfait.'
          : "C'est noté. On vous prévient dès l'ouverture de la beta."
      );
      setEmail('');
    } catch {
      setStatus('error');
      setMessage('Erreur réseau');
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col sm:flex-row gap-2 w-full max-w-md mx-auto"
    >
      <input
        type="email"
        required
        placeholder="votre@email.pro"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={status === 'loading' || status === 'success'}
        className="flex-1 px-5 py-3.5 rounded-xl border-2 border-line-hover bg-surface-base text-content-primary placeholder:text-content-tertiary text-base font-medium focus:outline-none focus:border-emerald-400 transition"
        aria-label="Email professionnel"
      />
      <button
        type="submit"
        disabled={status === 'loading' || status === 'success' || !email}
        className="group inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:-translate-y-0.5 transition-all whitespace-nowrap"
      >
        {status === 'loading' ? (
          <Loader2 size={18} className="animate-spin" />
        ) : status === 'success' ? (
          <CheckCircle2 size={18} />
        ) : (
          <ArrowRight
            size={18}
            className="group-hover:translate-x-1 transition-transform"
          />
        )}
        {status === 'success' ? 'Inscrit !' : 'Rejoindre la beta'}
      </button>
      {status === 'error' && (
        <p className="text-xs text-rose-600 sm:basis-full text-center">
          ⚠ {message}
        </p>
      )}
      {status === 'success' && (
        <p className="text-xs text-emerald-700 sm:basis-full text-center">
          ✓ {message}
        </p>
      )}
    </form>
  );
}
