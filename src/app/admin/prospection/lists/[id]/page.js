'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Upload, Loader2, Users, Mail, Phone, Trash2, Ban,
  CheckCircle, AlertCircle, FileText, Search, Send, MessageSquare,
  User as UserIcon, ChevronRight,
} from 'lucide-react';
import { getSupabase } from '@/lib/supabase';
import { SMS_CAMPAIGNS_ENABLED } from '@/lib/feature-flags';
import { CAMPAGNES_ALLOWED_PLANS } from '@/lib/campagnes-access';
import ImportFromProspectionModal from '@/components/lists/ImportFromProspectionModal';
import ImportFromCrmModal from '@/components/lists/ImportFromCrmModal';
import { ConfirmModal, DetailPageSkeleton } from '@/components/ui';

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
  const [showProspectionModal, setShowProspectionModal] = useState(false);
  const [showCrmModal, setShowCrmModal] = useState(false);
  const [importToast, setImportToast] = useState(null); // { source, inserted, skipped }
  // Modales de confirmation (remplacent les confirm() natifs)
  const [contactToDelete, setContactToDelete] = useState(null);
  const [confirmDeleteList, setConfirmDeleteList] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

      const { data: profile } = await supabase.from('user_profiles').select('plan').eq('id', user.id).maybeSingle();
      const allowed = profile?.plan && CAMPAGNES_ALLOWED_PLANS.includes(profile.plan.toLowerCase());
      if (!allowed) { router.push('/dashboard?upgrade=campagnes'); return; }

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

  async function confirmDeleteContact() {
    if (!contactToDelete) return;
    setDeleting(true);
    try {
      await fetch(`/api/admin/prospection/lists/${listId}/contacts/${contactToDelete}`, { method: 'DELETE' });
      await loadList();
    } finally {
      setDeleting(false);
      setContactToDelete(null);
    }
  }

  async function toggleOptOut(contact) {
    await fetch(`/api/admin/prospection/lists/${listId}/contacts/${contact.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ opt_out: !contact.opt_out, opt_out_reason: contact.opt_out ? null : 'Admin manuel' }),
    });
    await loadList();
  }

  async function performDeleteList() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/prospection/lists/${listId}`, { method: 'DELETE' });
      if (res.ok) router.push('/admin/prospection');
    } finally {
      setDeleting(false);
      setConfirmDeleteList(false);
    }
  }

  if (loading) return <DetailPageSkeleton />;
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
            <button onClick={() => setConfirmDeleteList(true)} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 text-sm font-medium transition" title="Supprimer la liste">
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

        {/* Importer depuis Volia */}
        <div className="mb-6">
          <h2 className="text-xs font-bold uppercase tracking-wider text-content-tertiary mb-3">
            Importer depuis Volia
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Card Prospection (violet) */}
            <button
              type="button"
              onClick={() => setShowProspectionModal(true)}
              className="group text-left rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/[0.06] to-purple-500/[0.04] hover:border-violet-500/40 hover:from-violet-500/[0.10] hover:to-purple-500/[0.08] transition-all p-5"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-violet-500/20">
                  <Search size={18} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base font-bold text-content-primary">
                      Volia Prospection
                    </span>
                    <ChevronRight
                      size={14}
                      className="text-violet-500 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all"
                    />
                  </div>
                  <p className="text-sm text-content-secondary mt-1">
                    Importez vos prospects depuis une recherche
                  </p>
                </div>
              </div>
            </button>

            {/* Card CRM (emerald) */}
            <button
              type="button"
              onClick={() => setShowCrmModal(true)}
              className="group text-left rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.06] to-teal-500/[0.04] hover:border-emerald-500/40 hover:from-emerald-500/[0.10] hover:to-teal-500/[0.08] transition-all p-5"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-500/20">
                  <UserIcon size={18} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base font-bold text-content-primary">
                      Volia CRM
                    </span>
                    <ChevronRight
                      size={14}
                      className="text-emerald-500 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all"
                    />
                  </div>
                  <p className="text-sm text-content-secondary mt-1">
                    Importez vos contacts CRM existants
                  </p>
                </div>
              </div>
            </button>
          </div>

          <div className="flex items-center gap-3 my-5 text-[10px] uppercase tracking-wider text-content-tertiary font-semibold">
            <div className="flex-1 h-px bg-line"></div>
            <span>ou</span>
            <div className="flex-1 h-px bg-line"></div>
          </div>
        </div>

        {/* Toast import succès */}
        {importToast && (
          <div className="mb-4 rounded-lg border border-green-500/30 bg-green-500/[0.08] px-4 py-2.5 text-sm text-green-300 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <CheckCircle size={14} />
              <span>
                <strong>{importToast.inserted}</strong> contact
                {importToast.inserted > 1 ? 's' : ''} importé
                {importToast.inserted > 1 ? 's' : ''} depuis {importToast.source}
                {importToast.skipped > 0 && (
                  <span className="text-content-tertiary ml-1">
                    · {importToast.skipped} doublon{importToast.skipped > 1 ? 's' : ''}
                  </span>
                )}
              </span>
            </div>
            <button
              onClick={() => setImportToast(null)}
              className="text-content-tertiary hover:text-content-primary"
            >
              <Trash2 size={12} />
            </button>
          </div>
        )}

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
                    {total === 0 ? 'Liste vide. Importe un CSV pour démarrer.' : 'Aucun contact pour cette recherche.'}
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
                      <button onClick={() => setContactToDelete(c.id)} className="p-1 text-content-tertiary hover:text-red-400 transition" title="Supprimer">
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

      {/* Modals */}
      <ImportFromProspectionModal
        open={showProspectionModal}
        onClose={() => setShowProspectionModal(false)}
        listId={listId}
        onSuccess={async (data) => {
          setImportToast({
            source: 'Volia Prospection',
            inserted: data.inserted || 0,
            skipped: data.skipped || 0,
          });
          await loadList();
        }}
      />
      <ImportFromCrmModal
        open={showCrmModal}
        onClose={() => setShowCrmModal(false)}
        listId={listId}
        onSuccess={async (data) => {
          setImportToast({
            source: 'Volia CRM',
            inserted: data.inserted || 0,
            skipped: data.skipped || 0,
          });
          await loadList();
        }}
      />

      <ConfirmModal
        open={!!contactToDelete}
        onClose={() => !deleting && setContactToDelete(null)}
        onConfirm={confirmDeleteContact}
        title="Supprimer ce contact ?"
        message="Ce contact sera retiré de la liste. Cette action est définitive."
        confirmLabel="Supprimer"
        variant="danger"
        loading={deleting}
      />

      <ConfirmModal
        open={confirmDeleteList}
        onClose={() => !deleting && setConfirmDeleteList(false)}
        onConfirm={performDeleteList}
        title={`Supprimer la liste "${list?.name || ''}" ?`}
        message={`${total.toLocaleString('fr-FR')} contact${total > 1 ? 's' : ''} ser${total > 1 ? 'ont' : 'a'} également supprimé${total > 1 ? 's' : ''}. Cette action est définitive.`}
        confirmLabel="Supprimer définitivement"
        variant="danger"
        loading={deleting}
      />
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
