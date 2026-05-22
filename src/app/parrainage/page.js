'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Gift, Copy, Check, Share2, Users, Loader2, LogIn,
  CheckCircle2, Clock, TrendingUp, Mail,
} from 'lucide-react';

// SVG LinkedIn inline (pas dans lucide-react v0.5x)
function LinkedinIcon({ size = 14, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5v-9h3zM6.5 8.25A1.75 1.75 0 118.3 6.5a1.78 1.78 0 01-1.8 1.75zM19 19h-3v-4.74c0-1.42-.6-1.93-1.38-1.93A1.74 1.74 0 0013 14.19a.66.66 0 000 .14V19h-3v-9h2.9v1.3a3.11 3.11 0 012.7-1.4c1.55 0 3.36.86 3.36 3.66z" />
    </svg>
  );
}
import { getSupabase } from '@/lib/supabase';

export default function ParrainagePage() {
  const router = useRouter();
  const supabase = getSupabase();
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [stats, setStats] = useState(null);
  const [referrals, setReferrals] = useState([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    (async () => {
      if (!supabase) { setLoading(false); return; }
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setAuthed(false); setLoading(false); return; }
      setAuthed(true);
      try {
        const res = await fetch('/api/referrals/me');
        if (res.ok) {
          const data = await res.json();
          setStats(data.stats);
          setReferrals(data.referrals || []);
        }
      } catch {}
      setLoading(false);
    })();
  }, [supabase]);

  const shareUrl = stats?.code ? `https://prospectia.cloud/signup?ref=${stats.code}` : '';

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  const linkedinShareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
  const emailShareUrl = `mailto:?subject=${encodeURIComponent('Tu vas adorer Prospectia')}&body=${encodeURIComponent(`J'utilise Prospectia pour ma prospection B2B en France et Belgique. À partir de 19 €/mois, super outil. Avec mon lien tu peux tester gratuitement : ${shareUrl}`)}`;

  if (loading) return <Loading />;
  if (!authed) return <GuestScreen />;

  return (
    <div className="dark min-h-screen bg-[#08080c] text-white">
      <nav className="fixed top-0 w-full z-50 bg-[#08080c]/70 backdrop-blur-2xl border-b border-white/[0.06]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition">
            <ArrowLeft size={14} />
            Dashboard
          </Link>
          <Link href="/" className="flex items-center gap-1">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center mr-1.5">
              <span className="text-[11px] font-bold text-white">P</span>
            </div>
            <span className="text-lg font-bold tracking-tight">Prospectia</span>
          </Link>
        </div>
      </nav>

      <main className="pt-24 pb-16">
        <section className="max-w-3xl mx-auto px-4 sm:px-6 mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-xs text-violet-300 mb-4">
            <Gift size={12} />
            Programme de parrainage
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">Invitez vos amis, gagnez des mois gratuits</h1>
          <p className="text-base text-zinc-400 leading-relaxed">
            Pour chaque ami qui devient client payant grâce à votre lien, vous gagnez <strong className="text-emerald-300">1 mois gratuit</strong> sur votre abonnement Prospectia. Pas de limite : 5 amis = 5 mois offerts.
          </p>
        </section>

        {/* Stats grid */}
        <section className="max-w-3xl mx-auto px-4 sm:px-6 mb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard icon={Users} label="Filleuls invités" value={stats?.total || 0} color="text-violet-400" />
            <StatCard icon={Clock} label="En attente" value={stats?.pending || 0} color="text-amber-400" />
            <StatCard icon={CheckCircle2} label="Payants" value={stats?.qualified || 0} color="text-emerald-400" />
            <StatCard icon={Gift} label="Mois gagnés" value={stats?.bonus_months_earned || 0} color="text-pink-400" highlight />
          </div>
        </section>

        {/* Apply bonus CTA — visible uniquement si bonus disponible */}
        {stats?.bonus_months_earned > 0 && (
          <ApplyBonusCard bonus={stats.bonus_months_earned} onApplied={() => window.location.reload()} />
        )}

        {/* Mon lien de parrainage */}
        <section className="max-w-3xl mx-auto px-4 sm:px-6 mb-8">
          <div className="rounded-2xl border border-violet-500/30 bg-gradient-to-br from-violet-500/[0.06] to-indigo-500/[0.06] p-6">
            <div className="text-xs font-semibold text-violet-300 uppercase tracking-wider mb-2">Votre lien de parrainage</div>
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <code className="flex-1 px-3 py-2.5 rounded-lg bg-black/40 border border-white/10 font-mono text-sm text-white break-all">
                {shareUrl}
              </code>
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition flex-shrink-0"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Copié !' : 'Copier'}
              </button>
            </div>
            <div className="text-xs text-zinc-400 mb-3">Partagez via :</div>
            <div className="flex gap-2 flex-wrap">
              <a href={linkedinShareUrl} target="_blank" rel="noopener" className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-white/10 hover:bg-white/[0.04] text-sm transition">
                <LinkedinIcon size={14} className="text-blue-400" />
                LinkedIn
              </a>
              <a href={emailShareUrl} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-white/10 hover:bg-white/[0.04] text-sm transition">
                <Mail size={14} className="text-zinc-400" />
                Email
              </a>
              {typeof navigator !== 'undefined' && navigator.share && (
                <button
                  onClick={() => navigator.share({ title: 'Prospectia', url: shareUrl })}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-white/10 hover:bg-white/[0.04] text-sm transition"
                >
                  <Share2 size={14} className="text-zinc-400" />
                  Partage natif
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Comment ça marche */}
        <section className="max-w-3xl mx-auto px-4 sm:px-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Comment ça marche ?</h2>
          <div className="grid sm:grid-cols-3 gap-3">
            <Step num={1} title="Partagez votre lien" desc="Envoyez votre lien personnalisé à vos contacts B2B (LinkedIn, email, Slack...)." />
            <Step num={2} title="Ils s'inscrivent" desc="Quand un ami crée un compte via votre lien, vous voyez la conversion en temps réel ici." />
            <Step num={3} title="Vous gagnez 1 mois" desc="Dès qu'il devient client payant (Solo, Pro ou Business), 1 mois bonus est crédité." />
          </div>
        </section>

        {/* Liste filleuls */}
        {referrals.length > 0 && (
          <section className="max-w-3xl mx-auto px-4 sm:px-6 mb-8">
            <h2 className="text-xl font-bold mb-4">Vos filleuls ({referrals.length})</h2>
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-white/[0.02] border-b border-white/[0.06] text-xs text-zinc-400 uppercase tracking-wider">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold">Email</th>
                    <th className="text-left px-4 py-3 font-semibold">Statut</th>
                    <th className="text-right px-4 py-3 font-semibold">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {referrals.map((r) => (
                    <tr key={r.id} className="border-b border-white/[0.04] last:border-0">
                      <td className="px-4 py-3 text-zinc-200">{r.referred_email || '—'}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="px-4 py-3 text-right text-xs text-zinc-500 tabular-nums">
                        {r.signed_up_at ? new Date(r.signed_up_at).toLocaleDateString('fr-FR') : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* FAQ rapide */}
        <section className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
            <h3 className="text-base font-semibold mb-3">Questions fréquentes</h3>
            <details className="group border-b border-white/[0.04] py-2.5">
              <summary className="cursor-pointer text-sm font-medium text-zinc-200 group-open:text-white">Combien de filleuls puis-je parrainer ?</summary>
              <p className="text-sm text-zinc-400 mt-2 leading-relaxed">Aucune limite. 10 filleuls = 10 mois bonus. Et vous pouvez accumuler les mois pour étendre votre abonnement quand vous voulez.</p>
            </details>
            <details className="group border-b border-white/[0.04] py-2.5">
              <summary className="cursor-pointer text-sm font-medium text-zinc-200 group-open:text-white">Mon filleul a aussi un bonus ?</summary>
              <p className="text-sm text-zinc-400 mt-2 leading-relaxed">Pas pour l&apos;instant. La v1 récompense le parrain uniquement. On ajoutera un bonus filleul dans une version future.</p>
            </details>
            <details className="group py-2.5">
              <summary className="cursor-pointer text-sm font-medium text-zinc-200 group-open:text-white">Quand mon bonus est-il crédité ?</summary>
              <p className="text-sm text-zinc-400 mt-2 leading-relaxed">Dès que le filleul devient client payant (Solo, Pro ou Business). Notification email + in-app instantanée. Vous voyez le total dans le compteur "Mois gagnés".</p>
            </details>
          </div>
        </section>
      </main>
    </div>
  );
}

function ApplyBonusCard({ bonus, onApplied }) {
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState('');
  async function handleApply() {
    if (applying) return;
    setApplying(true);
    setError('');
    try {
      const res = await fetch('/api/referrals/apply-bonus', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Erreur — réessayez');
        setApplying(false);
        return;
      }
      onApplied?.();
    } catch {
      setError('Erreur réseau');
      setApplying(false);
    }
  }
  return (
    <section className="max-w-3xl mx-auto px-4 sm:px-6 mb-8">
      <div className="rounded-2xl border border-pink-500/30 bg-gradient-to-br from-pink-500/[0.08] to-violet-500/[0.08] p-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-pink-500/20 border border-pink-500/30 flex items-center justify-center flex-shrink-0">
            <Gift size={18} className="text-pink-300" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold mb-1">
              Vous avez <span className="text-pink-300">{bonus} mois bonus</span> disponibles
            </h3>
            <p className="text-sm text-zinc-400 leading-relaxed mb-3">
              Appliquez 1 mois bonus sur votre prochaine facture (100% off via coupon Stripe). Vous pouvez répéter l&apos;opération chaque mois jusqu&apos;à épuisement.
            </p>
            <button
              onClick={handleApply}
              disabled={applying}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-pink-600 to-violet-600 hover:from-pink-500 hover:to-violet-500 disabled:opacity-50 text-white text-sm font-semibold transition shadow-lg"
            >
              {applying ? <Loader2 size={14} className="animate-spin" /> : <Gift size={14} />}
              {applying ? 'Application...' : `Appliquer 1 mois bonus (${bonus - 1} restant)`}
            </button>
            {error && <p className="text-xs text-red-300 mt-2">⚠ {error}</p>}
          </div>
        </div>
      </div>
    </section>
  );
}

function StatCard({ icon: Icon, label, value, color, highlight }) {
  return (
    <div className={`rounded-xl border ${highlight ? 'border-pink-500/30 bg-pink-500/[0.04]' : 'border-white/[0.06] bg-white/[0.02]'} p-4`}>
      <Icon size={16} className={`${color} mb-1.5`} />
      <div className="text-2xl font-bold text-white tabular-nums">{value}</div>
      <div className="text-xs text-zinc-500 mt-0.5">{label}</div>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    pending: { label: 'En attente', color: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
    qualified: { label: 'Payant ✓', color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
    rewarded: { label: 'Récompensé', color: 'bg-pink-500/15 text-pink-300 border-pink-500/30' },
    expired: { label: 'Expiré', color: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30' },
  }[status] || { label: status, color: 'bg-zinc-500/15 text-zinc-400' };
  return (
    <span className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-medium border ${map.color}`}>
      {map.label}
    </span>
  );
}

function Step({ num, title, desc }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="text-3xl font-bold text-violet-400 mb-1.5">{num}.</div>
      <div className="text-sm font-semibold text-zinc-100 mb-1">{title}</div>
      <div className="text-xs text-zinc-400 leading-relaxed">{desc}</div>
    </div>
  );
}

function Loading() {
  return (
    <div className="dark min-h-screen bg-[#08080c] text-zinc-400 flex items-center justify-center">
      <Loader2 size={20} className="animate-spin" />
    </div>
  );
}

function GuestScreen() {
  return (
    <div className="dark min-h-screen bg-[#08080c] text-white flex items-center justify-center p-6">
      <div className="max-w-md w-full rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 text-center">
        <div className="w-12 h-12 mx-auto rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center mb-4">
          <LogIn size={20} className="text-violet-300" />
        </div>
        <h1 className="text-xl font-bold mb-2">Connexion requise</h1>
        <p className="text-sm text-zinc-400 mb-6">Connectez-vous pour accéder à votre programme de parrainage.</p>
        <Link href="/login?return=/parrainage" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition">
          <LogIn size={14} />
          Se connecter
        </Link>
      </div>
    </div>
  );
}
