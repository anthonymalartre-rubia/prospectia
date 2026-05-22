'use client';

// Composants client pour les pages /prospection — interactivité (forms, sticky bar).
// Server components dans ProspectionContentBlocks.jsx, client ici (state + events).

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Download, Mail, ArrowRight, CheckCircle2, Loader2, X, Sparkles, Zap,
} from 'lucide-react';

// ─── Lead magnet contextuel mid-page ───────────────────
// Capture email contre l'envoi des "20 templates cold email pour [secteur]".
// Branche sur /api/ressources/download (envoi PDF via Resend + ajout opt_in DB).
export function LeadMagnetBlock({ category }) {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState(null); // 'success' | 'error' | null
  const [errorMsg, setErrorMsg] = useState('');

  const sectorLabel = category?.labelPlural || 'votre secteur';
  const resourceSlug = 'templates-cold-email-b2b-fr';

  async function handleSubmit(e) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/ressources/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resource_slug: resourceSlug,
          email: email.trim(),
          source: `prospection/${category?.slug || 'home'}`,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus('error');
        setErrorMsg(data.error || 'Erreur — réessayez');
      } else {
        setStatus('success');
      }
    } catch {
      setStatus('error');
      setErrorMsg('Erreur réseau');
    } finally {
      setSubmitting(false);
    }
  }

  if (status === 'success') {
    return (
      <section className="max-w-3xl mx-auto px-4 sm:px-6 mb-16">
        <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/[0.08] to-violet-500/[0.06] p-8 text-center">
          <CheckCircle2 size={32} className="text-emerald-400 mx-auto mb-3" />
          <h3 className="text-xl font-bold mb-2">Email envoyé !</h3>
          <p className="text-sm text-zinc-300 max-w-md mx-auto">
            Les 20 templates cold email pour {sectorLabel} sont dans votre boîte mail.
            Vérifiez vos spams si vous ne les voyez pas dans 2 min.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="max-w-3xl mx-auto px-4 sm:px-6 mb-16">
      <div className="rounded-2xl border border-violet-500/30 bg-gradient-to-br from-violet-600/[0.12] to-indigo-600/[0.12] p-7 sm:p-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center">
            <Download size={18} className="text-violet-300" />
          </div>
          <div className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[11px] font-semibold text-emerald-300 uppercase tracking-wider">
            Gratuit
          </div>
        </div>
        <h3 className="text-xl sm:text-2xl font-bold mb-2 leading-tight">
          Téléchargez 20 templates cold email B2B pour {sectorLabel}
        </h3>
        <p className="text-sm text-zinc-400 mb-5 leading-relaxed">
          PDF de 30 pages : intros qui taquinent la curiosité, accroches qui s&apos;adressent vraiment au secteur, lignes d&apos;objet à fort taux d&apos;ouverture. Testé sur 50 000+ envois.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
          <input
            type="email"
            required
            placeholder="votre@email.pro"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-violet-500 transition"
          />
          <button
            type="submit"
            disabled={submitting || !email}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-semibold transition shadow-lg shadow-violet-500/20 whitespace-nowrap"
          >
            {submitting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            Recevoir le PDF
          </button>
        </form>
        {status === 'error' && (
          <p className="text-xs text-red-300 mt-2">⚠ {errorMsg}</p>
        )}
        <p className="text-[10px] text-zinc-500 mt-3 leading-relaxed">
          🔒 Aucun spam — uniquement le PDF + 1 email de bienvenue. Désabonnement 1 clic. RGPD compliant.
        </p>
      </div>
    </section>
  );
}

// ─── Sticky bottom CTA bar ─────────────────────────────
// Apparaît après ~600px de scroll, contextualisée par catégorie/dept.
export function StickyCtaBar({ category, department, region, stats }) {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 600);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (dismissed || !visible) return null;

  const where = department?.name || region?.name || 'France entière';
  const what = category?.labelPlural || 'entreprises';
  const total = stats?.total || '1 580';

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-r from-violet-600 to-indigo-600 border-t border-white/10 shadow-2xl shadow-violet-900/40 backdrop-blur-xl">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3 flex-wrap sm:flex-nowrap">
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-white truncate">
            <span className="tabular-nums">{total}</span> {what} disponibles à {where}
          </div>
          <div className="text-xs text-violet-100/80 hidden sm:block">
            Email + téléphone + site web, exportables en CSV. À partir de 19 €/mois.
          </div>
        </div>
        <Link
          href="/signup"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-violet-700 hover:bg-violet-50 text-sm font-bold transition flex-shrink-0"
        >
          <Zap size={14} />
          Essayer gratuit
        </Link>
        <button
          onClick={() => setDismissed(true)}
          className="p-2 text-white/70 hover:text-white transition"
          aria-label="Fermer"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
