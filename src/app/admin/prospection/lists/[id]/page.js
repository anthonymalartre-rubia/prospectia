'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Upload, Loader2, Users, Mail, Phone, Trash2, Ban,
  CheckCircle, AlertCircle, FileText, Search, Send, MessageSquare,
} from 'lucide-react';
import { getSupabase } from '@/lib/supabase';
import { SMS_CAMPAIGNS_ENABLED } from '@/lib/feature-flags';

export default function ListDetailPage() {
  const router = useRouter();
  const params = useParams();
  const listId = params.id;
  const supabase = getSupabase();

  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [list, setList] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [importResult, setImportResult] = useState(null);
  const [importing, setImporting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState(null);

  // Charge la liste + contacts
  const loadList = useCallback(async () => {
    const params = new URLSearchParams({ limit: '100' });
    if (search) params.set('search', search);
    const res = await fetch(`/api/admin/prospection/lists/${listId}?${params}`);
    if (res.status === 404) { setError('Liste introuvable'); return; }
    if (!res.ok) return;
    const data = await res.json();
    setList(data.list);
    setContacts(data.contacts || []);
    setTotal(data.pagination?.total || 0);
  }, [listId, search]);

  useEffect(() => {
    (async () => {
      if (!supabase) { setLoading(false); return; }
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login?return=' + encodeURIComponent(`/admin/prospection/lists/${listId}`)); return; }

      const { data: profile } = await supabase.from('user_profiles').select('is_admin').eq('id', user.id).maybeSingle();
      if (!profile?.is_admin) { router.push('/dashboard'); return; }

      setAuthorized(true);
      await loadList();
      setLoading(false);
    })();
  }, [router, supabase, listId, loadList]);

  // Recharge à chaque changement de search (debounced)
  useEffect(() => {
    if (!authorized) return;
    const t = setTimeout(() => { loadList(); }, 250);
    return () => clearTimeout(t);
  }, [search, authorized, loadList]);

  async function handleFile(file) {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { setError('Fichier > 10 MB'); return; }
    if (!file.name.toLowerCase().endsWith('.csv')) { setError('Fichier .csv requis'); return; }
    setImporting(true);
    setError(null);
    setImportResult(null);
    try {
      const text = await file.text();
      const res = await fetch(`/api/admin/prospection/lists/${listId}/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csv: text }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Erreur import'); setImporting(false); return; }
      setImportResult(data);
      await loadList();
    } catch (err) {
      setError(err.message || 'Erreur lecture fichier');
    } finally {
      setImporting(false);
    }
  }

  async function deleteContact(contactId) {
    if (!confirm('Supprimer ce contact de la liste ?')) return;
    await fetch(`/api/admin/prospection/lists/${listId}/contacts/${contactId}`, { method: 'DELETE' });
    await loadList();
  }

  async function toggleOptOut(contact) {
    await fetch(`/api/admin/prospection/lists/${listId}/contacts/${contact.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ opt_out: !contact.opt_out, opt_out_reason: contact.opt_out ? null : 'Admin manuel' }),
    });
    await loadList();
  }

  async function deleteList() {
    if (!confirm(`Supprimer définitivement la liste "${list?.name}" et tous ses ${total} contacts ?`)) return;
    const res = await fetch(`/api/admin/prospection/lists/${listId}`, { method: 'DELETE' });
    if (res.ok) router.push('/admin/prospection');
  }

  if (loading) return (
    <div className="min-h-screen bg-surface-base flex items-center justify-center text-content-secondary">
      <Loader2 className="animate-spin" size={20} />
    </div>
  );
  if (!authorized) return null;
  if (error && !list) return (
    <div className="min-h-screen bg-surface-base flex items-center justify-center p-6">
      <div className="rounded-xl border border-red-500/30 bg-red-500/[0.06] p-6 max-w-md text-center">
        <AlertCircle size={20} className="mx-auto mb-2 text-red-400" />
        <p className="text-content-primary">{error}</p>
        <Link href="/admin/prospection" className="mt-4 inline-flex items-center gap-2 text-sm text-violet-400 hover:text-violet-300">
          <ArrowLeft size={14} />
          Retour
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-surface-base text-content-primary p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
          <div>
            <Link href="/admin/prospection" className="inline-flex items-center gap-2 text-sm text-content-tertiary hover:text-violet-400 transition mb-2">
              <ArrowLeft size={14} />
              Toutes les listes
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold">{list?.name || 'Liste'}</h1>
            {list?.description && <p className="text-sm text-content-secondary mt-1">{list.description}</p>}
            {list?.source && <p className="text-xs text-content-tertiary mt-1">Source : {list.source} · Base légale : {list.legal_basis === 'consent' ? 'Consentement' : 'Intérêt légitime'}</p>}
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/admin/prospection/campaigns/new?list=${listId}`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition"
            >
              <Send size={14} />
              Campagne email
            </Link>
            {SMS_CAMPAIGNS_ENABLED && (
              <Link
                href={`/admin/prospection/sms/new?list=${listId}`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition"
              >
                <MessageSquare size={14} />
                Campagne SMS
              </Link>
            )}
            <button onClick={deleteList} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 text-sm font-medium transition" title="Supprimer la liste">
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <StatCard icon={<Users size={14} className="text-violet-400" />} label="Total" value={list?.contacts_count || 0} />
          <StatCard icon={<Mail size={14} className="text-green-400" />} label="Emails" value={list?.email_count || 0} />
          <StatCard icon={<Phone size={14} className="text-indigo-400" />} label="Téléphones" value={list?.phone_count || 0} />
          <StatCard icon={<Ban size={14} className="text-amber-600" />} label="Opt-out" value={list?.opt_out_count || 0} />
        </div>

        {/* Dropzone import */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const file = e.dataTransfer.files?.[0];
            if (file) handleFile(file);
          }}
          className={`mb-6 rounded-2xl border-2 border-dashed transition p-6 sm:p-8 text-center cursor-pointer ${
            dragOver ? 'border-violet-500 bg-violet-500/10' : 'border-line bg-surface-card hover:border-violet-500/40'
          }`}
          onClick={() => document.getElementById('csv-input')?.click()}
        >
          <input
            id="csv-input"
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          <Upload size={28} className="mx-auto mb-2 text-violet-400" />
          {importing ? (
            <p className="text-content-secondary">
              <Loader2 className="inline animate-spin mr-2" size={14} />
              Import en cours…
            </p>
          ) : (
            <>
              <p className="text-sm font-semibold text-content-primary">Glissez-déposez votre fichier CSV</p>
              <p className="text-xs text-content-tertiary mt-1">ou cliquez pour choisir un fichier (max 10 MB · max 50 000 lignes)</p>
              <p className="text-xs text-content-tertiary mt-2">
                Colonnes reconnues : <code className="text-violet-300">email, phone, first_name, last_name, company, position_title</code>{' '}
                (alias FR : <code>prenom, nom, societe, poste</code>)
              </p>
            </>
          )}
        </div>

        {/* Résultat import */}
        {importResult && (
          <div className="mb-6 rounded-2xl border border-green-500/30 bg-green-500/[0.04] p-5">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle size={16} className="text-green-400" />
              <h3 className="font-semibold text-green-300">Import terminé</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
              <Stat label="Parsé" value={importResult.parsed} />
              <Stat label="Insérés" value={importResult.inserted} color="text-green-400" />
              <Stat label="Doublons" value={importResult.duplicates} color="text-amber-600" />
              <Stat label="Skip (erreur)" value={importResult.skipped} color="text-red-400" />
            </div>
            {importResult.warnings?.length > 0 && (
              <div className="mt-3 text-xs text-amber-700">
                <strong>Warnings :</strong>
                <ul className="list-disc list-inside mt-1">
                  {importResult.warnings.map((w, i) => <li key={i}>{w}</li>)}
                </ul>
              </div>
            )}
            {importResult.errors?.length > 0 && (
              <div className="mt-3 text-xs text-red-300">
                <strong>{importResult.errors.length} premières erreurs :</strong>
                <ul className="list-disc list-inside mt-1">
                  {importResult.errors.slice(0, 5).map((e, i) => <li key={i}>{e}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/[0.06] p-3 text-sm text-red-300 flex items-center gap-2">
            <AlertCircle size={14} />
            {error}
          </div>
        )}

        {/* Search */}
        <div className="mb-4">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-content-tertiary" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher email, prénom, société…"
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-surface-card border border-line text-sm text-content-primary placeholder:text-content-tertiary focus:outline-none focus:border-violet-500 transition"
            />
          </div>
        </div>

        {/* Table contacts */}
        <div className="rounded-2xl border border-line overflow-hidden bg-surface-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-elevated">
                <tr>
                  <th className="text-left p-3 font-semibold">Email</th>
                  <th className="text-left p-3 font-semibold">Téléphone</th>
                  <th className="text-left p-3 font-semibold">Nom</th>
                  <th className="text-left p-3 font-semibold">Société</th>
                  <th className="text-left p-3 font-semibold">Poste</th>
                  <th className="text-center p-3 font-semibold">Statut</th>
                  <th className="text-right p-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {contacts.length === 0 ? (
                  <tr><td colSpan={7} className="p-12 text-center text-content-tertiary">
                    {total === 0 ? 'Aucun contact pour le moment. Importez un CSV.' : 'Aucun contact pour cette recherche.'}
                  </td></tr>
                ) : contacts.map((c) => (
                  <tr key={c.id} className={`border-t border-line ${c.opt_out ? 'opacity-50' : ''}`}>
                    <td className="p-3 text-content-primary">{c.email || '—'}</td>
                    <td className="p-3 text-content-secondary font-mono text-xs">{c.phone || '—'}</td>
                    <td className="p-3 text-content-secondary">{[c.first_name, c.last_name].filter(Boolean).join(' ') || '—'}</td>
                    <td className="p-3 text-content-secondary">{c.company || '—'}</td>
                    <td className="p-3 text-content-tertiary text-xs">{c.position_title || '—'}</td>
                    <td className="p-3 text-center">
                      {c.opt_out ? (
                        <span className="inline-flex items-center gap-1 text-xs text-amber-600" title={c.opt_out_reason}>
                          <Ban size={11} /> opt-out
                        </span>
                      ) : c.bounce_count > 0 ? (
                        <span className="inline-flex items-center gap-1 text-xs text-red-400">
                          <AlertCircle size={11} /> bounce
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-green-400">
                          <CheckCircle size={11} /> actif
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right whitespace-nowrap">
                      <button onClick={() => toggleOptOut(c)} className="p-1 text-content-tertiary hover:text-amber-600 transition" title={c.opt_out ? 'Réactiver' : 'Marquer opt-out'}>
                        <Ban size={12} />
                      </button>
                      <button onClick={() => deleteContact(c.id)} className="p-1 text-content-tertiary hover:text-red-400 transition" title="Supprimer">
                        <Trash2 size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {total > 100 && (
            <div className="p-3 text-center text-xs text-content-tertiary border-t border-line">
              Affichage des 100 premiers résultats sur {total.toLocaleString('fr-FR')}. Utilisez la recherche pour filtrer.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }) {
  return (
    <div className="rounded-xl border border-line bg-surface-card p-4">
      <div className="text-xs text-content-tertiary uppercase tracking-wider mb-1 flex items-center gap-1.5">
        {icon}
        {label}
      </div>
      <div className="text-2xl font-bold text-content-primary tabular-nums">{value.toLocaleString('fr-FR')}</div>
    </div>
  );
}

function Stat({ label, value, color = 'text-content-primary' }) {
  return (
    <div className="rounded-lg bg-surface-elevated p-2">
      <div className="text-xs text-content-tertiary">{label}</div>
      <div className={`text-lg font-bold ${color} tabular-nums`}>{(value || 0).toLocaleString('fr-FR')}</div>
    </div>
  );
}
