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
    <div className="dark min-h-screen bg-[#08080c] text-white overflow-hidden">
      {/* Background animé : 2 gradients flous + grid pattern subtil */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-violet-600/20 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[700px] h-[700px] rounded-full bg-pink-600/15 blur-[140px]" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      {/* Top nav */}
      <nav className="fixed top-0 w-full z-50 bg-[#08080c]/70 backdrop-blur-2xl border-b border-white/[0.06]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-1">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center mr-1.5">
              <span className="text-[11px] font-bold text-white">P</span>
            </div>
            <span className="text-lg font-bold tracking-tight">Prospectia</span>
            <span className="text-violet-400 text-xs font-semibold">.cloud</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login?return=/parrainage" className="text-sm text-zinc-400 hover:text-white transition">Se connecter</Link>
            <Link href="/signup" className="text-sm px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-semibold transition">Essayer gratuit</Link>
          </div>
        </div>
      </nav>

      <main className="pt-24 pb-16 relative">
        {/* Hero */}
        <section className="max-w-3xl mx-auto px-4 sm:px-6 text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-pink-500/15 to-violet-500/15 border border-pink-500/30 text-xs text-pink-300 mb-6 animate-pulse">
            <Gift size={12} />
            Programme de parrainage Prospectia
          </div>
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight leading-[1.05] mb-6 bg-gradient-to-b from-white via-violet-100 to-violet-400 bg-clip-text text-transparent">
            Invitez vos amis,<br />gagnez des <span className="bg-gradient-to-r from-pink-400 to-violet-400 bg-clip-text">mois gratuits</span>
          </h1>
          <p className="text-lg text-zinc-400 leading-relaxed max-w-2xl mx-auto mb-8">
            <strong className="text-white">1 mois offert</strong> par filleul devenu client payant.
            Et votre filleul reçoit aussi <strong className="text-pink-300">+1 mois bonus</strong> à l&apos;inscription.
            Pas de limite : 10 amis = 10 mois.
          </p>

          {/* Big metric */}
          <div className="inline-flex items-center gap-6 px-6 py-4 rounded-2xl border border-violet-500/30 bg-gradient-to-r from-violet-500/[0.08] to-pink-500/[0.08] mb-10">
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-pink-300 to-violet-300 bg-clip-text text-transparent tabular-nums">+1</div>
              <div className="text-[10px] text-zinc-400 uppercase tracking-wider mt-0.5">Mois parrain</div>
            </div>
            <div className="text-zinc-600">+</div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-pink-300 to-violet-300 bg-clip-text text-transparent tabular-nums">+1</div>
              <div className="text-[10px] text-zinc-400 uppercase tracking-wider mt-0.5">Mois filleul</div>
            </div>
            <div className="text-zinc-600">=</div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-emerald-300 tabular-nums">2 mois</div>
              <div className="text-[10px] text-zinc-400 uppercase tracking-wider mt-0.5">Win-win</div>
            </div>
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/login?return=/parrainage"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-pink-600 to-violet-600 hover:from-pink-500 hover:to-violet-500 text-white text-sm font-semibold transition shadow-lg shadow-pink-500/20"
            >
              <LogIn size={16} />
              Récupérer mon lien de parrainage
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-white/10 hover:bg-white/[0.04] text-white text-sm font-semibold transition"
            >
              <Sparkles size={16} />
              Créer un compte
              <ArrowRight size={16} />
            </Link>
          </div>
          <p className="text-xs text-zinc-500 mt-4">
            Plan Starter gratuit à vie · 100 prospects offerts chaque mois sans carte bancaire · le lien apparaît après connexion
          </p>
        </section>

        {/* Comment ça marche */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3 text-center">Comment ça marche</h2>
          <p className="text-sm text-zinc-400 text-center mb-10 max-w-xl mx-auto">
            3 étapes, 100% automatique. Le bonus est crédité dès que votre filleul devient client payant.
          </p>
          <div className="grid sm:grid-cols-3 gap-4">
            <GuestStep
              num={1}
              title="Récupérez votre lien"
              desc="Connectez-vous, copiez le lien personnalisé prospectia.cloud/signup?ref=VOTRE_CODE."
              icon={<Copy size={16} />}
              gradient="from-violet-500/15 to-indigo-500/15"
              border="border-violet-500/30"
            />
            <GuestStep
              num={2}
              title="Partagez-le"
              desc="LinkedIn, email pro, Slack, Discord... ou intégrez-le dans votre signature email."
              icon={<Share2 size={16} />}
              gradient="from-indigo-500/15 to-violet-500/15"
              border="border-indigo-500/30"
            />
            <GuestStep
              num={3}
              title="Vous gagnez 1 mois (chacun)"
              desc="Dès qu'il devient client payant. Notif + email instantanés. Bonus appliqué via coupon Stripe sur votre prochaine facture."
              icon={<Gift size={16} />}
              gradient="from-pink-500/15 to-violet-500/15"
              border="border-pink-500/30"
            />
          </div>
        </section>

        {/* Pourquoi c'est intéressant */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 mb-16">
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 sm:p-8">
            <div className="grid sm:grid-cols-2 gap-6 sm:gap-10 items-center">
              <div>
                <h2 className="text-2xl font-bold mb-3">Pourquoi c&apos;est rentable</h2>
                <p className="text-sm text-zinc-400 leading-relaxed mb-4">
                  Prospectia coûte 19 à 99 €/mois. <strong className="text-white">Chaque ami payant = 19 à 99 € économisés</strong> sur votre prochain renouvellement.
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2 text-zinc-300"><CheckCircle2 size={14} className="text-emerald-400 mt-0.5 flex-shrink-0" /> Aucune limite de filleuls</li>
                  <li className="flex items-start gap-2 text-zinc-300"><CheckCircle2 size={14} className="text-emerald-400 mt-0.5 flex-shrink-0" /> Crédit Stripe automatique (coupon dynamique)</li>
                  <li className="flex items-start gap-2 text-zinc-300"><CheckCircle2 size={14} className="text-emerald-400 mt-0.5 flex-shrink-0" /> Mois cumulables pour étendre votre abonnement</li>
                  <li className="flex items-start gap-2 text-zinc-300"><CheckCircle2 size={14} className="text-emerald-400 mt-0.5 flex-shrink-0" /> Bonus bienvenue pour votre filleul (double incentive)</li>
                </ul>
              </div>
              {/* Mini scenarios */}
              <div className="space-y-3">
                <Scenario amis="3" mois="3" total="147 €" plan="Pro" />
                <Scenario amis="5" mois="5" total="245 €" plan="Pro" featured />
                <Scenario amis="10" mois="10" total="990 €" plan="Business" />
              </div>
            </div>
          </div>
        </section>

        {/* CTA final */}
        <section className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="rounded-2xl border border-pink-500/30 bg-gradient-to-br from-pink-500/[0.08] to-violet-500/[0.08] p-8 text-center">
            <Gift size={32} className="text-pink-300 mx-auto mb-3" />
            <h3 className="text-2xl font-bold mb-2">Prêt à parrainer ?</h3>
            <p className="text-sm text-zinc-400 mb-6 max-w-md mx-auto">
              Connectez-vous pour récupérer votre lien unique. Si vous n&apos;avez pas encore de compte, créez-en un en 30 secondes.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Link href="/login?return=/parrainage" className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-violet-600 hover:from-pink-500 hover:to-violet-500 text-white text-sm font-semibold transition shadow-lg">
                <LogIn size={14} />
                Se connecter
              </Link>
              <Link href="/signup" className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-white/10 hover:bg-white/[0.04] text-white text-sm font-semibold transition">
                <Sparkles size={14} />
                Créer un compte
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/[0.06] py-8 mt-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center justify-between text-xs text-zinc-500">
          <span>© 2026 Prospectia.cloud</span>
          <div className="flex gap-4">
            <Link href="/changelog" className="hover:text-zinc-300">Changelog</Link>
            <Link href="/cgu" className="hover:text-zinc-300">CGU</Link>
            <Link href="/rgpd" className="hover:text-zinc-300">RGPD</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function GuestStep({ num, title, desc, icon, gradient, border }) {
  return (
    <div className={`rounded-2xl border ${border} bg-gradient-to-br ${gradient} p-5 relative overflow-hidden`}>
      <div className="absolute top-2 right-3 text-5xl font-bold text-white/[0.04] select-none">{num}</div>
      <div className="relative">
        <div className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-white/[0.08] border border-white/[0.1] mb-3">
          {icon}
        </div>
        <h3 className="text-base font-semibold mb-1.5 leading-tight">{title}</h3>
        <p className="text-xs text-zinc-400 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

function Scenario({ amis, mois, total, plan, featured = false }) {
  return (
    <div className={`rounded-xl p-3 flex items-center gap-3 ${
      featured
        ? 'border-2 border-pink-500/40 bg-gradient-to-r from-pink-500/[0.08] to-violet-500/[0.08]'
        : 'border border-white/[0.06] bg-white/[0.02]'
    }`}>
      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-violet-500/15 border border-violet-500/30 flex items-center justify-center">
        <Users size={14} className="text-violet-300" />
      </div>
      <div className="flex-1 text-xs leading-snug">
        <div className="text-zinc-100 font-medium">
          <span className="text-violet-300 font-bold tabular-nums">{amis}</span> amis payants
        </div>
        <div className="text-zinc-500">
          = <strong className="text-pink-300 tabular-nums">{mois} mois</strong> offerts ({total} pour Plan {plan})
        </div>
      </div>
    </div>
  );
}
