'use client';

// ─────────────────────────────────────────────────────────────────────
// ImportFromCrmModal — sélectionne N contacts CRM et les importe dans
// la liste Campagnes courante.
// ─────────────────────────────────────────────────────────────────────
// Props :
//   - open : bool
//   - onClose : () => void
//   - listId : string (UUID prospect_list cible)
//   - onSuccess?({ inserted, skipped, total }) : callback
//
// Gating : si l'utilisateur n'a pas accès au CRM (plan < Business), l'API
// renvoie 403 + code:'crm_not_allowed'. Le modal affiche alors un écran
// d'upgrade avec lien vers /pricing.
//
// Palette : emerald (cohérent avec le module CRM).
// ─────────────────────────────────────────────────────────────────────

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  X,
  Loader2,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Search,
  User,
  Inbox,
  Lock,
  Sparkles,
} from 'lucide-react';

export default function ImportFromCrmModal({ open, onClose, listId, onSuccess }) {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [needsUpgrade, setNeedsUpgrade] = useState(false);

  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState(() => new Set());

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const debounceRef = useRef(null);

  const fetchContacts = useCallback(
    async (q) => {
      setLoading(true);
      setLoadError('');
      try {
        const params = new URLSearchParams({ limit: '200' });
        if (q) params.set('q', q);
        const res = await fetch(
          `/api/admin/prospection/lists/${listId}/sources/crm-contacts?${params}`
        );
        const data = await res.json();
        if (!res.ok) {
          if (data?.code === 'crm_not_allowed') {
            setNeedsUpgrade(true);
            setContacts([]);
          } else {
            setLoadError(data?.error || 'Erreur chargement contacts');
            setContacts([]);
          }
        } else {
          setContacts(Array.isArray(data?.contacts) ? data.contacts : []);
          setNeedsUpgrade(false);
        }
      } catch {
        setLoadError('Erreur réseau');
        setContacts([]);
      } finally {
        setLoading(false);
      }
    },
    [listId]
  );

  // ─── Reset + fetch initial au mount ───────────────────────
  useEffect(() => {
    if (!open) return;
    setResult(null);
    setError('');
    setSearch('');
    setSelectedIds(new Set());
    setNeedsUpgrade(false);
    fetchContacts('');
  }, [open, fetchContacts]);

  // ─── Search debounce 300ms ────────────────────────────────
  useEffect(() => {
    if (!open || needsUpgrade) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchContacts(search.trim());
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [search, open, needsUpgrade, fetchContacts]);

  // ─── Escape close ─────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    function onKey(e) {
      if (e.key === 'Escape' && !submitting) onClose?.();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose, submitting]);

  const selectedCount = selectedIds.size;
  const allVisibleSelected = useMemo(() => {
    if (contacts.length === 0) return false;
    return contacts.every((c) => selectedIds.has(c.id));
  }, [contacts, selectedIds]);

  function toggleOne(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) {
        contacts.forEach((c) => next.delete(c.id));
      } else {
        contacts.forEach((c) => next.add(c.id));
      }
      return next;
    });
  }

  if (!open) return null;

  async function handleSubmit() {
    if (selectedCount === 0 || submitting) return;
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch(
        `/api/admin/prospection/lists/${listId}/import-from-crm`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contact_ids: Array.from(selectedIds) }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        if (data?.code === 'crm_not_allowed') setNeedsUpgrade(true);
        setError(data?.error || 'Erreur import');
        setSubmitting(false);
        return;
      }
      setResult(data);
      onSuccess?.(data);
    } catch (err) {
      console.error('[ImportFromCrmModal] error', err);
      setError('Erreur réseau');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose?.();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="import-crm-title"
        className="relative w-full max-w-2xl max-h-[92vh] overflow-hidden rounded-2xl bg-surface-base border border-line shadow-2xl flex flex-col animate-in zoom-in-95 slide-in-from-bottom-2 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-surface-base border-b border-line flex-shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0">
              <User size={14} className="text-white" />
            </div>
            <h2 id="import-crm-title" className="text-base font-bold text-content-primary">
              Importer depuis Volia CRM
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="p-1.5 rounded-lg text-content-tertiary hover:text-content-primary hover:bg-surface-elevated transition-colors disabled:opacity-50"
            aria-label="Fermer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {result ? (
            // ─── Success ─────────────────────────────
            <div className="px-6 py-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 size={20} className="text-emerald-600" />
                </div>
                <div>
                  <p className="text-base font-bold text-content-primary">Import terminé</p>
                  <p className="text-xs text-content-tertiary">
                    Les contacts CRM ont été ajoutés à votre liste.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 mb-5">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3">
                  <div className="text-2xl font-extrabold text-emerald-700 tabular-nums">
                    {result.inserted || 0}
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-emerald-700/80 font-semibold mt-0.5">
                    Ajoutés
                  </div>
                </div>
                <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                  <div className="text-2xl font-extrabold text-zinc-700 tabular-nums">
                    {result.skipped || 0}
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-zinc-600 font-semibold mt-0.5">
                    Doublons
                  </div>
                </div>
                <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                  <div className="text-2xl font-extrabold text-zinc-700 tabular-nums">
                    {result.total || 0}
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-zinc-600 font-semibold mt-0.5">
                    Total
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-md shadow-emerald-500/20 transition-all"
                >
                  Terminer
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          ) : needsUpgrade ? (
            // ─── Upgrade gate ────────────────────────
            <div className="flex flex-col items-center text-center px-6 py-10">
              <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mb-3">
                <Lock size={22} className="text-amber-600" />
              </div>
              <p className="text-base font-bold text-content-primary mb-1">
                Importer depuis le CRM nécessite le plan Business
              </p>
              <p className="text-sm text-content-tertiary max-w-md mb-4">
                Le module Volia CRM (contacts, pipelines, deals) est inclus dans le
                plan Business 99 €/mois.
              </p>
              <Link
                href="/settings?tab=plan"
                onClick={onClose}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 shadow-md shadow-amber-500/20 transition-all"
              >
                <Sparkles size={14} />
                Passer au plan Business
              </Link>
            </div>
          ) : (
            // ─── Contacts list ───────────────────────
            <>
              {/* Search bar */}
              <div className="px-6 py-3 border-b border-line flex-shrink-0">
                <div className="relative">
                  <Search
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-content-tertiary"
                  />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Rechercher par nom, email, société…"
                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-surface-card border border-line text-sm text-content-primary placeholder:text-content-tertiary focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  />
                </div>
              </div>

              {/* List */}
              <div className="flex-1 overflow-y-auto px-6 py-3">
                {loading ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 size={20} className="animate-spin text-emerald-500" />
                  </div>
                ) : loadError ? (
                  <div className="flex items-start gap-2 px-3 py-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700">
                    <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                    <p className="text-xs font-medium">{loadError}</p>
                  </div>
                ) : contacts.length === 0 ? (
                  search ? (
                    <div className="text-center py-12 text-sm text-content-tertiary">
                      Aucun contact CRM pour « {search} ».
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-center py-10">
                      <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mb-3">
                        <Inbox size={22} className="text-emerald-600" />
                      </div>
                      <p className="text-base font-bold text-content-primary mb-1">
                        CRM vide.
                      </p>
                      <p className="text-sm text-content-tertiary max-w-sm mb-4">
                        Ajoute des contacts au CRM pour les importer dans tes listes Campagnes.
                      </p>
                      <Link
                        href="/app/crm/contacts"
                        onClick={onClose}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-md shadow-emerald-500/20 transition-all"
                      >
                        Aller à Volia CRM
                        <ArrowRight size={14} />
                      </Link>
                    </div>
                  )
                ) : (
                  <div className="rounded-lg border border-line overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-surface-elevated sticky top-0">
                        <tr>
                          <th className="p-2 w-8">
                            <input
                              type="checkbox"
                              checked={allVisibleSelected}
                              onChange={toggleAll}
                              className="w-4 h-4 text-emerald-600 border-line rounded focus:ring-emerald-500 focus:ring-offset-0"
                            />
                          </th>
                          <th className="text-left p-2 font-semibold text-content-secondary">
                            Nom
                          </th>
                          <th className="text-left p-2 font-semibold text-content-secondary">
                            Email
                          </th>
                          <th className="text-left p-2 font-semibold text-content-secondary">
                            Société
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {contacts.map((c) => {
                          const checked = selectedIds.has(c.id);
                          return (
                            <tr
                              key={c.id}
                              className={`border-t border-line cursor-pointer hover:bg-surface-elevated transition-colors ${
                                checked ? 'bg-emerald-50/40' : ''
                              }`}
                              onClick={() => toggleOne(c.id)}
                            >
                              <td className="p-2">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => toggleOne(c.id)}
                                  onClick={(e) => e.stopPropagation()}
                                  className="w-4 h-4 text-emerald-600 border-line rounded focus:ring-emerald-500 focus:ring-offset-0"
                                />
                              </td>
                              <td className="p-2 text-content-primary font-medium">
                                {c.name || '—'}
                              </td>
                              <td className="p-2 text-content-secondary">
                                {c.email || (
                                  <span className="text-content-tertiary text-xs italic">
                                    sans email
                                  </span>
                                )}
                              </td>
                              <td className="p-2 text-content-tertiary">
                                {c.company || '—'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {error && (
                <div className="px-6 pb-3">
                  <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-700">
                    <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                    <p className="text-xs font-medium">{error}</p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer sticky */}
        {!result && !needsUpgrade && (
          <div className="flex items-center justify-between gap-2 px-6 py-3.5 bg-surface-elevated border-t border-line flex-shrink-0">
            <div className="text-xs text-content-secondary">
              <strong className="tabular-nums">{selectedCount}</strong> contact
              {selectedCount > 1 ? 's' : ''} sélectionné
              {selectedCount > 1 ? 's' : ''}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-4 py-2 rounded-lg text-sm font-medium text-content-secondary hover:bg-surface-base transition-colors disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting || selectedCount === 0}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-md shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {submitting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Import…
                  </>
                ) : (
                  <>
                    <ArrowRight size={14} />
                    Importer {selectedCount > 0 ? `(${selectedCount})` : ''}
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
