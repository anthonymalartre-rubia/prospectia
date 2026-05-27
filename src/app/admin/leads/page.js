'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Download, Mail, CheckCircle, XCircle, AlertCircle,
  Search, Loader2, ExternalLink, Filter, ShieldOff, LogIn,
} from 'lucide-react';
import { getSupabase } from '@/lib/supabase';

export default function AdminLeadsPage() {
  const router = useRouter();
  const supabase = getSupabase();
  const [loading, setLoading] = useState(true);
  // null = checking, 'guest' = pas connecté, 'no-admin' = connecté sans admin, 'ok' = ok
  const [authState, setAuthState] = useState(null);
  const [currentEmail, setCurrentEmail] = useState(null);
  const [leads, setLeads] = useState([]);
  const [search, setSearch] = useState('');
  const [resourceFilter, setResourceFilter] = useState('all');

  useEffect(() => {
    (async () => {
      if (!supabase) { setLoading(false); return; }
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setAuthState('guest'); setLoading(false); return; }
      setCurrentEmail(user.email);

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('is_admin')
        .eq('id', user.id)
        .maybeSingle();

      if (!profile?.is_admin) {
        setAuthState('no-admin');
        setLoading(false);
        return;
      }

      setAuthState('ok');
      const res = await fetch('/api/admin/leads?limit=500');
      if (res.ok) {
        const data = await res.json();
        setLeads(data.leads || []);
      }
      setLoading(false);
    })();
  }, [router, supabase]);

  const resources = useMemo(() => {
    const set = new Set(leads.map((l) => l.resource_slug));
    return ['all', ...Array.from(set).sort()];
  }, [leads]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return leads.filter((l) => {
      if (resourceFilter !== 'all' && l.resource_slug !== resourceFilter) return false;
      if (q) {
        const hay = `${l.email} ${l.first_name || ''} ${l.company || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [leads, search, resourceFilter]);

  const stats = useMemo(() => {
    return {
      total: leads.length,
      sent: leads.filter((l) => l.email_sent).length,
      failed: leads.filter((l) => !l.email_sent && l.email_error).length,
      optedOut: leads.filter((l) => l.opt_out).length,
    };
  }, [leads]);

  function downloadCsv() {
    const params = new URLSearchParams({ format: 'csv', limit: '1000' });
    if (resourceFilter !== 'all') params.set('resource_slug', resourceFilter);
    window.location.href = `/api/admin/leads?${params.toString()}`;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-base flex items-center justify-center text-content-secondary">
        <Loader2 className="animate-spin" size={20} />
      </div>
    );
  }

  // Pas connecté → écran clair avec lien login
  if (authState === 'guest') {
    return (
      <div className="min-h-screen bg-surface-base flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-2xl border border-line bg-surface-card p-8 text-center">
          <div className="w-12 h-12 mx-auto rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center mb-4">
            <LogIn size={20} className="text-violet-300" />
          </div>
          <h1 className="text-xl font-bold mb-2">Connexion requise</h1>
          <p className="text-sm text-content-secondary mb-6">
            Cette page est réservée aux administrateurs. Connectez-vous avec un compte admin pour accéder aux leads capturés.
          </p>
          <Link href="/login?return=/admin/leads" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition">
            <LogIn size={14} />
            Se connecter
          </Link>
        </div>
      </div>
    );
  }

  // Connecté mais sans droits admin → écran explicite
  if (authState === 'no-admin') {
    return (
      <div className="min-h-screen bg-surface-base flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-2xl border border-amber-400 bg-amber-50 p-8 text-center">
          <div className="w-12 h-12 mx-auto rounded-xl bg-amber-100 border border-amber-400 flex items-center justify-center mb-4">
            <ShieldOff size={20} className="text-amber-700" />
          </div>
          <h1 className="text-xl font-bold mb-2">Accès admin requis</h1>
          <p className="text-sm text-content-secondary mb-2">
            Vous êtes connecté en tant que <strong className="text-content-primary">{currentEmail}</strong>,
            mais ce compte n&apos;a pas les droits administrateur.
          </p>
          <p className="text-xs text-content-tertiary mb-6 leading-relaxed">
            Pour accéder à cette page, reconnectez-vous avec votre compte admin
            (ex : <code>@suraya.fr</code> ou <code>@gmail.fr</code>).
          </p>
          <div className="flex items-center justify-center gap-2">
            <Link href="/dashboard" className="px-4 py-2 rounded-xl border border-line text-content-secondary hover:text-content-primary hover:bg-surface-elevated text-sm font-medium transition">
              Retour au dashboard
            </Link>
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                router.push('/login?return=/admin/leads');
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition"
            >
              <LogIn size={14} />
              Changer de compte
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-base text-content-primary p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <Link href="/admin" className="inline-flex items-center gap-2 text-sm text-content-tertiary hover:text-violet-400 transition mb-2">
              <ArrowLeft size={14} />
              Admin
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold">Leads capturés via lead magnets</h1>
            <p className="text-sm text-content-secondary mt-1">
              Tous les emails captés via les pages /ressources — RGPD compliant (consent_given = true).
            </p>
          </div>
          <button
            onClick={downloadCsv}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition shadow-lg shadow-violet-500/20"
          >
            <Download size={14} />
            Exporter CSV {resourceFilter !== 'all' && '(filtré)'}
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <StatCard label="Total leads" value={stats.total} color="text-content-primary" />
          <StatCard label="Email livré" value={stats.sent} color="text-green-400" icon={<CheckCircle size={14} className="text-green-400" />} />
          <StatCard label="Échec envoi" value={stats.failed} color="text-red-400" icon={<XCircle size={14} className="text-red-400" />} />
          <StatCard label="Opt-out RGPD" value={stats.optedOut} color="text-amber-600" icon={<AlertCircle size={14} className="text-amber-600" />} />
        </div>

        {/* Warning si beaucoup d'échecs */}
        {stats.failed > 0 && (
          <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/[0.06] p-4 text-sm">
            <div className="flex items-start gap-2">
              <AlertCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-red-300">{stats.failed} email{stats.failed > 1 ? 's' : ''} en échec.</strong>{' '}
                Cause la plus probable : domaine <code className="text-xs px-1 rounded bg-surface-elevated">volia.fr</code> non vérifié sur Resend.
                Voir colonne &quot;Erreur&quot; pour le détail.
                <br/>
                <a
                  href="https://resend.com/domains"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-violet-400 hover:underline inline-flex items-center gap-1 mt-1"
                >
                  Vérifier le domaine sur Resend <ExternalLink size={11} />
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Filtres */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-content-tertiary" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher email, prénom ou société…"
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-surface-card border border-line text-sm text-content-primary placeholder:text-content-tertiary focus:outline-none focus:border-violet-500 transition"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-content-tertiary" />
            <select
              value={resourceFilter}
              onChange={(e) => setResourceFilter(e.target.value)}
              className="px-3 py-2 rounded-lg bg-surface-card border border-line text-sm text-content-primary focus:outline-none focus:border-violet-500 transition"
            >
              {resources.map((r) => (
                <option key={r} value={r}>{r === 'all' ? 'Toutes ressources' : r}</option>
              ))}
            </select>
          </div>
          <div className="text-xs text-content-tertiary">
            {filtered.length} / {leads.length}
          </div>
        </div>

        {/* Table */}
        <div className="rounded-2xl border border-line overflow-hidden bg-surface-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-elevated">
                <tr>
                  <th className="text-left p-3 font-semibold">Email</th>
                  <th className="text-left p-3 font-semibold">Société</th>
                  <th className="text-left p-3 font-semibold">Ressource</th>
                  <th className="text-left p-3 font-semibold">Source</th>
                  <th className="text-center p-3 font-semibold">Statut</th>
                  <th className="text-left p-3 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} className="p-12 text-center text-content-tertiary">Aucun lead avec ce filtre. Élargis la recherche.</td></tr>
                ) : filtered.map((l) => (
                  <tr key={l.id} className="border-t border-line">
                    <td className="p-3">
                      <div className="font-medium text-content-primary">{l.email}</div>
                      {l.first_name && <div className="text-xs text-content-tertiary">{l.first_name}</div>}
                    </td>
                    <td className="p-3 text-content-secondary">{l.company || '—'}</td>
                    <td className="p-3">
                      <code className="text-xs px-1.5 py-0.5 rounded bg-surface-elevated text-violet-300">
                        {l.resource_slug.length > 30 ? l.resource_slug.slice(0, 30) + '…' : l.resource_slug}
                      </code>
                    </td>
                    <td className="p-3 text-xs text-content-tertiary">
                      {l.utm_source || (l.referrer ? new URL(l.referrer).hostname : 'direct')}
                    </td>
                    <td className="p-3 text-center">
                      {l.opt_out ? (
                        <span title="Opt-out RGPD" className="inline-flex items-center gap-1 text-amber-600 text-xs">
                          <AlertCircle size={12} /> opt-out
                        </span>
                      ) : l.email_sent ? (
                        <span title={`Resend id : ${l.email_provider_id || '—'}`} className="inline-flex items-center gap-1 text-green-400 text-xs">
                          <CheckCircle size={12} /> envoyé
                        </span>
                      ) : l.email_error ? (
                        <span title={l.email_error} className="inline-flex items-center gap-1 text-red-400 text-xs cursor-help">
                          <XCircle size={12} /> erreur
                        </span>
                      ) : (
                        <span className="text-content-tertiary text-xs">—</span>
                      )}
                    </td>
                    <td className="p-3 text-xs text-content-tertiary whitespace-nowrap">
                      {new Date(l.created_at).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* RGPD note */}
        <p className="text-xs text-content-tertiary mt-4 leading-relaxed">
          <strong className="text-content-primary">RGPD :</strong>{' '}
          consent_given est vérifié à la capture (case opt-in obligatoire).
          Les opt-out sont exclus de tous les exports CSV.
          Conservation max 3 ans après dernier contact (purge automatique à implémenter via cron).
        </p>
      </div>
    </div>
  );
}

function StatCard({ label, value, color, icon }) {
  return (
    <div className="rounded-xl border border-line bg-surface-card p-4">
      <div className="text-xs text-content-tertiary uppercase tracking-wider mb-1 flex items-center gap-1.5">
        {icon}
        {label}
      </div>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
    </div>
  );
}
