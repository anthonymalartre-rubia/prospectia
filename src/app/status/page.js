'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, AlertTriangle, XCircle, Loader2, RefreshCw, Activity } from 'lucide-react';

const REFRESH_INTERVAL = 30000; // 30 sec

const STATUS_META = {
  operational: { label: 'Opérationnel', color: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/30', icon: CheckCircle2 },
  degraded: { label: 'Dégradé', color: 'text-amber-400', bg: 'bg-amber-500/15', border: 'border-amber-500/30', icon: AlertTriangle },
  down: { label: 'Down', color: 'text-red-400', bg: 'bg-red-500/15', border: 'border-red-500/30', icon: XCircle },
  unknown: { label: 'Inconnu', color: 'text-zinc-400', bg: 'bg-zinc-500/15', border: 'border-zinc-500/30', icon: AlertTriangle },
};

const OVERALL_META = {
  ok: { label: 'Tous les services opérationnels', color: 'text-emerald-400', bg: 'bg-emerald-500/[0.08]', border: 'border-emerald-500/30' },
  degraded: { label: 'Service dégradé en cours', color: 'text-amber-400', bg: 'bg-amber-500/[0.08]', border: 'border-amber-500/30' },
  down: { label: 'Incident en cours — investigation', color: 'text-red-400', bg: 'bg-red-500/[0.08]', border: 'border-red-500/30' },
};

export default function StatusPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastFetch, setLastFetch] = useState(null);

  async function fetchStatus() {
    try {
      const res = await fetch('/api/status', { cache: 'no-store' });
      const d = await res.json();
      setData(d);
      setLastFetch(new Date());
    } catch {
      setData({ overall: 'down', services: [], error: 'fetch failed' });
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchStatus();
    const t = setInterval(fetchStatus, REFRESH_INTERVAL);
    return () => clearInterval(t);
  }, []);

  const overall = OVERALL_META[data?.overall] || OVERALL_META.ok;

  return (
    <div className="dark min-h-screen bg-[#08080c] text-white">
      <nav className="fixed top-0 w-full z-50 bg-[#08080c]/70 backdrop-blur-2xl border-b border-white/[0.06]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition">
            <ArrowLeft size={14} />
            Prospectia
          </Link>
          <button onClick={fetchStatus} disabled={loading} className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Actualiser
          </button>
        </div>
      </nav>

      <main className="pt-24 pb-16">
        <section className="max-w-3xl mx-auto px-4 sm:px-6 mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-xs text-violet-300 mb-4">
            <Activity size={12} />
            Status page
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">État des services Prospectia</h1>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Health checks live (refresh toutes les 30 sec). Si vous constatez un incident non listé ici, contactez <a href="mailto:hello@prospectia.cloud" className="text-violet-300 hover:underline">hello@prospectia.cloud</a>.
          </p>
        </section>

        {/* Overall status */}
        <section className="max-w-3xl mx-auto px-4 sm:px-6 mb-8">
          {loading ? (
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 flex items-center gap-3">
              <Loader2 size={20} className="animate-spin text-zinc-400" />
              <span className="text-sm text-zinc-300">Vérification en cours...</span>
            </div>
          ) : (
            <div className={`rounded-2xl border ${overall.border} ${overall.bg} p-6`}>
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${overall.color.replace('text-', 'bg-')} animate-pulse`} />
                <h2 className={`text-lg font-bold ${overall.color}`}>{overall.label}</h2>
              </div>
              {lastFetch && (
                <p className="text-xs text-zinc-500 mt-2">
                  Dernière vérification : {lastFetch.toLocaleTimeString('fr-FR')} · auto-refresh toutes les 30 sec
                </p>
              )}
            </div>
          )}
        </section>

        {/* Services */}
        {data?.services && (
          <section className="max-w-3xl mx-auto px-4 sm:px-6 mb-8">
            <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">Composants</h2>
            <div className="space-y-2">
              {data.services.map((svc) => {
                const meta = STATUS_META[svc.status] || STATUS_META.unknown;
                const Icon = meta.icon;
                return (
                  <div key={svc.name} className={`rounded-xl border ${meta.border} ${meta.bg} p-4 flex items-center gap-3`}>
                    <Icon size={18} className={meta.color} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-zinc-100">{svc.name}</span>
                        <span className={`text-xs font-medium ${meta.color}`}>{meta.label}</span>
                      </div>
                      <div className="text-xs text-zinc-500 mt-0.5 tabular-nums">
                        {svc.latency_ms ? `${svc.latency_ms}ms` : ''}
                        {svc.message && ` · ${svc.message}`}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Légende */}
        <section className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Légende</h3>
            <ul className="space-y-1.5 text-xs">
              <li className="flex items-center gap-2"><CheckCircle2 size={12} className="text-emerald-400" /> <strong className="text-emerald-400">Opérationnel</strong> — le service répond normalement</li>
              <li className="flex items-center gap-2"><AlertTriangle size={12} className="text-amber-400" /> <strong className="text-amber-400">Dégradé</strong> — latence élevée ou erreurs intermittentes</li>
              <li className="flex items-center gap-2"><XCircle size={12} className="text-red-400" /> <strong className="text-red-400">Down</strong> — service indisponible (incident en cours)</li>
            </ul>
            <p className="text-[11px] text-zinc-500 mt-3 leading-relaxed">
              Note : cette page exécute des probes live depuis l&apos;edge Vercel. Pour un historique d&apos;incidents,
              voir aussi les status pages officielles : <a href="https://status.supabase.com" target="_blank" rel="noopener" className="text-violet-300 hover:underline">Supabase</a> ·
              <a href="https://status.stripe.com" target="_blank" rel="noopener" className="text-violet-300 hover:underline"> Stripe</a> ·
              <a href="https://www.vercel-status.com" target="_blank" rel="noopener" className="text-violet-300 hover:underline"> Vercel</a> ·
              <a href="https://status.resend.com" target="_blank" rel="noopener" className="text-violet-300 hover:underline"> Resend</a>.
            </p>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/[0.06] py-8 mt-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 flex items-center justify-between text-xs text-zinc-500">
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
