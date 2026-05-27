'use client';

// ─────────────────────────────────────────────────────────────────────
// SendToCampagneModal — pousse N prospects (Prospection) dans une
// liste prospect_lists pour servir de cible à une campagne email/SMS.
// ─────────────────────────────────────────────────────────────────────
// Calque sur SendToCrmModal (mêmes patterns d'état/UX) — thème violet
// pour matcher l'identité du module Campagnes (vs emerald pour CRM).
//
// Props :
//   - open : bool
//   - onClose : () => void
//   - prospects : array (les prospects à envoyer)
//   - onSuccess?({ list_id, list_name, inserted, skipped }) : callback
//
// Flow :
//   1. Au mount, fetch GET /api/admin/prospection/lists pour proposer
//      une liste existante (si l'user en a déjà).
//   2. L'user choisit "nouvelle liste" (input nom) ou "liste existante"
//      (select).
//   3. Submit POST /api/prospection/send-to-campagne.
//   4. Sur succès → écran de résultat avec CTA "Créer la campagne →"
//      qui redirige vers /admin/prospection/campaigns/new?list_id=…
// ─────────────────────────────────────────────────────────────────────

import { useEffect, useState } from 'react';
import {
  X,
  Loader2,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Send,
  Users,
  Plus,
  ListChecks,
} from 'lucide-react';
import Link from 'next/link';

export default function SendToCampagneModal({
  open,
  onClose,
  prospects = [],
  onSuccess,
}) {
  // ─── State liste cible ─────────────────────────────────────
  const [mode, setMode] = useState('new'); // 'new' | 'existing'
  const [listName, setListName] = useState('');
  const [existingListId, setExistingListId] = useState('');
  const [lists, setLists] = useState([]);
  const [loadingLists, setLoadingLists] = useState(false);
  const [listsError, setListsError] = useState('');

  // ─── State submit / résultat ───────────────────────────────
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  // ─── Mount : fetch listes existantes + reset state ─────────
  useEffect(() => {
    if (!open) return;
    setResult(null);
    setError('');
    setMode('new');
    setExistingListId('');
    // Nom par défaut : "Prospects DD/MM/YYYY"
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    setListName(`Prospects ${dd}/${mm}/${today.getFullYear()}`);

    setLoadingLists(true);
    setListsError('');
    fetch('/api/admin/prospection/lists')
      .then((r) => r.json().then((d) => ({ ok: r.ok, status: r.status, d })))
      .then(({ ok, status, d }) => {
        if (!ok) {
          // 403 = pas admin → on cache simplement l'option "liste existante"
          // (l'user pourra créer une nouvelle liste si la route /api/prospection/
          // send-to-campagne autorise les non-admins, ce qui est le cas ici).
          if (status !== 403) {
            setListsError(d?.error || 'Erreur chargement listes');
          }
          setLoadingLists(false);
          return;
        }
        const arr = Array.isArray(d?.lists) ? d.lists : [];
        setLists(arr);
        if (arr.length > 0) setExistingListId(arr[0].id);
        setLoadingLists(false);
      })
      .catch(() => {
        setListsError('Erreur réseau');
        setLoadingLists(false);
      });
  }, [open]);

  // Escape close
  useEffect(() => {
    if (!open) return;
    function onKey(e) {
      if (e.key === 'Escape') onClose?.();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const validProspects = prospects.filter((p) => p && (p.nom || p.name));
  const count = validProspects.length;
  const withEmail = validProspects.filter((p) => p.email).length;

  async function handleSubmit(e) {
    e.preventDefault();
    if (submitting || count === 0) return;
    if (mode === 'new' && !listName.trim()) {
      setError('Donnez un nom à votre liste.');
      return;
    }
    if (mode === 'existing' && !existingListId) {
      setError('Choisissez une liste existante.');
      return;
    }
    setError('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/prospection/send-to-campagne', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prospects: validProspects,
          create_new_list: mode === 'new',
          list_name: mode === 'new' ? listName.trim() : undefined,
          existing_list_id: mode === 'existing' ? existingListId : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Erreur envoi vers Campagnes');
        setSubmitting(false);
        return;
      }
      setResult(data);
      onSuccess?.(data);
    } catch (err) {
      console.error('[SendToCampagneModal] error', err);
      setError('Erreur réseau');
    } finally {
      setSubmitting(false);
    }
  }

  // ─── Render ────────────────────────────────────────────────
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
        aria-labelledby="send-campagne-title"
        className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-2xl bg-surface-base border border-line shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-2 duration-200"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-surface-base border-b border-line">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0">
              <Send size={14} className="text-white" />
            </div>
            <h2 id="send-campagne-title" className="text-base font-bold text-content-primary">
              Lancer une campagne
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
        {result ? (
          // ─── Result state ─────────────────────────────
          <div className="px-6 py-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 size={20} className="text-violet-600" />
              </div>
              <div>
                <p className="text-base font-bold text-content-primary">Liste prête</p>
                <p className="text-xs text-content-tertiary">
                  Vos prospects sont dans <strong>{result.list_name}</strong>.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-5">
              <div className="rounded-xl border border-violet-200 bg-violet-50/60 p-3">
                <div className="text-2xl font-extrabold text-violet-700 tabular-nums">
                  {result.inserted || 0}
                </div>
                <div className="text-[10px] uppercase tracking-wider text-violet-700/80 font-semibold mt-0.5">
                  Contacts ajoutés
                </div>
              </div>
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                <div className="text-2xl font-extrabold text-zinc-700 tabular-nums">
                  {result.skipped || 0}
                </div>
                <div className="text-[10px] uppercase tracking-wider text-zinc-600 font-semibold mt-0.5">
                  Ignorés (doublons)
                </div>
              </div>
            </div>

            {result.errors && result.errors.length > 0 && (
              <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                <p className="font-semibold mb-1">Avertissements :</p>
                <ul className="list-disc pl-4 space-y-0.5">
                  {result.errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-sm font-medium text-content-secondary hover:bg-surface-elevated transition-colors"
              >
                Fermer
              </button>
              <Link
                href={`/admin/prospection/campaigns/new?list_id=${encodeURIComponent(result.list_id)}`}
                onClick={() => onClose?.()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 shadow-md shadow-violet-500/20 transition-all"
              >
                Créer la campagne
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        ) : (
          // ─── Form state ───────────────────────────────
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
            {/* Summary */}
            <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-gradient-to-br from-violet-50 to-purple-50/60 border border-violet-200">
              <Users size={16} className="text-violet-600 flex-shrink-0" />
              <p className="text-sm text-content-primary">
                <strong className="font-bold tabular-nums">{count}</strong> prospect
                {count > 1 ? 's' : ''}{' '}
                {count > 1 ? 'vont être ajoutés' : 'va être ajouté'} à la liste
                <span className="text-content-tertiary">
                  {' '}
                  · {withEmail} avec email
                </span>
              </p>
            </div>

            {count === 0 && (
              <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800">
                <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                <p className="text-xs font-medium">
                  Rien de coché. Sélectionne au moins un prospect dans la liste.
                </p>
              </div>
            )}

            {/* Choix : nouvelle liste OU existante */}
            <div className="space-y-2">
              {/* Option : nouvelle liste */}
              <label
                className={`flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer transition-colors ${
                  mode === 'new'
                    ? 'border-violet-500 bg-violet-50/50'
                    : 'border-line hover:bg-surface-elevated'
                }`}
              >
                <input
                  type="radio"
                  name="mode"
                  value="new"
                  checked={mode === 'new'}
                  onChange={() => setMode('new')}
                  className="mt-0.5 w-4 h-4 text-violet-600 border-line focus:ring-violet-500 focus:ring-offset-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <Plus size={13} className="text-violet-600" />
                    <span className="text-sm font-semibold text-content-primary">
                      Nouvelle liste
                    </span>
                  </div>
                  {mode === 'new' && (
                    <input
                      type="text"
                      value={listName}
                      onChange={(e) => setListName(e.target.value)}
                      placeholder="Nom de la liste"
                      maxLength={120}
                      className="mt-2 w-full px-2.5 py-1.5 rounded-md border border-line bg-surface-card text-xs text-content-primary focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all"
                    />
                  )}
                </div>
              </label>

              {/* Option : liste existante (uniquement si listes dispo) */}
              {lists.length > 0 && (
                <label
                  className={`flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer transition-colors ${
                    mode === 'existing'
                      ? 'border-violet-500 bg-violet-50/50'
                      : 'border-line hover:bg-surface-elevated'
                  }`}
                >
                  <input
                    type="radio"
                    name="mode"
                    value="existing"
                    checked={mode === 'existing'}
                    onChange={() => setMode('existing')}
                    className="mt-0.5 w-4 h-4 text-violet-600 border-line focus:ring-violet-500 focus:ring-offset-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <ListChecks size={13} className="text-violet-600" />
                      <span className="text-sm font-semibold text-content-primary">
                        Ajouter à une liste existante
                      </span>
                    </div>
                    {mode === 'existing' && (
                      <select
                        value={existingListId}
                        onChange={(e) => setExistingListId(e.target.value)}
                        className="mt-2 w-full px-2.5 py-1.5 rounded-md border border-line bg-surface-card text-xs text-content-primary focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all"
                      >
                        {lists.map((l) => (
                          <option key={l.id} value={l.id}>
                            {l.name} ({l.contacts_count || 0} contacts)
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </label>
              )}
            </div>

            {/* Loading listes */}
            {loadingLists && (
              <div className="flex items-center justify-center py-2">
                <Loader2 size={16} className="animate-spin text-violet-600" />
              </div>
            )}

            {listsError && !loadingLists && (
              <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800">
                <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                <p className="text-xs font-medium">{listsError}</p>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-700">
                <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                <p className="text-xs font-medium">{error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-4 py-2 rounded-lg text-sm font-medium text-content-secondary hover:bg-surface-elevated transition-colors disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={submitting || count === 0}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 shadow-md shadow-violet-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {submitting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Envoi…
                  </>
                ) : (
                  <>
                    <ArrowRight size={14} />
                    Envoyer {count > 0 ? `(${count})` : ''}
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
