'use client';

// ─────────────────────────────────────────────────────────────────────
// WaitlistForm — formulaire d'inscription beta Volia CRM
// ─────────────────────────────────────────────────────────────────────
// Réutilise l'endpoint /api/newsletter/subscribe existant avec source='crm-waitlist'
// pour les notifications de lancement. Reste très simple : email + bouton.
// 2 variants : 'hero' (compact, sur fond couleur) et 'cta' (gros, fond white).
// ─────────────────────────────────────────────────────────────────────

import { useState } from 'react';
import { Mail, CheckCircle2, Loader2, ArrowRight } from 'lucide-react';

export default function WaitlistForm({ variant = 'hero' }) {
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
        body: JSON.stringify({ email: email.trim(), source: 'crm-waitlist' }),
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
          : 'C\'est noté. On vous prévient dès l\'ouverture de la beta.'
      );
      setEmail('');
    } catch {
      setStatus('error');
      setMessage('Erreur réseau');
    }
  }

  // Variant compact pour le hero (à côté du CTA primary)
  if (variant === 'hero') {
    return (
      <form onSubmit={handleSubmit} className="inline-flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
        <input
          type="email"
          required
          placeholder="votre@email.pro"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={status === 'loading' || status === 'success'}
          className="px-5 py-4 rounded-xl border-2 border-line-hover bg-white text-content-primary placeholder:text-content-tertiary text-base font-medium focus:outline-none focus:border-emerald-400 transition min-w-[260px]"
        />
        <button
          type="submit"
          disabled={status === 'loading' || status === 'success' || !email}
          className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl border-2 border-line-hover hover:border-emerald-400 hover:bg-emerald-50 disabled:opacity-50 text-content-primary font-semibold transition-all whitespace-nowrap"
        >
          {status === 'loading' ? <Loader2 size={16} className="animate-spin" /> : status === 'success' ? <CheckCircle2 size={16} /> : <Mail size={16} />}
          {status === 'success' ? 'Inscrit' : 'Rejoindre la beta'}
        </button>
        {status === 'error' && <p className="text-xs text-rose-600 sm:basis-full">⚠ {message}</p>}
        {status === 'success' && <p className="text-xs text-emerald-700 sm:basis-full">✓ {message}</p>}
      </form>
    );
  }

  // Variant CTA final : gros bloc avec input + bouton stylé
  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 w-full max-w-md mx-auto">
      <input
        type="email"
        required
        placeholder="votre@email.pro"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={status === 'loading' || status === 'success'}
        className="flex-1 px-5 py-4 rounded-xl border-2 border-line-hover bg-white text-content-primary placeholder:text-content-tertiary text-base font-medium focus:outline-none focus:border-emerald-400 transition"
      />
      <button
        type="submit"
        disabled={status === 'loading' || status === 'success' || !email}
        className="group inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-semibold shadow-xl shadow-emerald-500/30 hover:shadow-2xl hover:-translate-y-0.5 transition-all whitespace-nowrap"
      >
        {status === 'loading' ? <Loader2 size={18} className="animate-spin" /> : status === 'success' ? <CheckCircle2 size={18} /> : <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
        {status === 'success' ? 'Inscrit !' : 'Rejoindre la beta'}
      </button>
      {status === 'error' && <p className="text-xs text-rose-600 sm:basis-full text-center">⚠ {message}</p>}
      {status === 'success' && <p className="text-xs text-emerald-700 sm:basis-full text-center">✓ {message}</p>}
    </form>
  );
}
