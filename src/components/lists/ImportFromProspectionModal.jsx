'use client';

// ─────────────────────────────────────────────────────────────────────
// ImportFromProspectionModal — sélectionne une search_session Volia
// Prospection et importe ses prospects dans la liste Campagnes courante.
// ─────────────────────────────────────────────────────────────────────
// Props :
//   - open : bool
//   - onClose : () => void
//   - listId : string (UUID de la prospect_list cible)
//   - onSuccess?({ inserted, skipped, total }) : callback
//
// Flow :
//   1. Au mount → GET /api/admin/prospection/lists/[id]/sources/sessions
//   2. L'user choisit une session (radio) + checkbox "inclure sans email"
//   3. POST /api/admin/prospection/lists/[id]/import-from-session
//   4. Succès → toast + close + onSuccess (parent refetch contacts)
// ─────────────────────────────────────────────────────────────────────

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  X,
  Loader2,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Search,
  Inbox,
  MapPin,
  Mail,
  Users,
} from 'lucide-react';

function formatDate(iso) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, '0');
    const mi = String(d.getMinutes()).padStart(2, '0');
    return `${dd}/${mm}/${yyyy} ${hh}:${mi}`;
  } catch {
    return iso;
  }
}

function describeCategories(cats) {
  if (!cats) return '';
  if (Array.isArray(cats)) return cats.slice(0, 3).join(', ');
  if (typeof cats === 'object') {
    // jsonb peut contenir {b2b: [...], copro: [...]} ou similaire
    const labels = [];
    for (const v of Object.values(cats)) {
      if (Array.isArray(v)) labels.push(...v);
      else if (typeof v === 'string') labels.push(v);
    }
    return labels.slice(0, 3).join(', ');
  }
  return String(cats);
}

export default function ImportFromProspectionModal({ open, onClose, listId, onSuccess }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [includeEmailless, setIncludeEmailless] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  // ─── Reset + fetch au mount ───────────────────────────────
  useEffect(() => {
    if (!open) return;
    setResult(null);
    setError('');
    setLoadError('');
    setSelectedId('');
    setIncludeEmailless(false);
    setLoading(true);

    fetch(`/api/admin/prospection/lists/${listId}/sources/sessions`)
      .then((r) => r.json().then((d) => ({ ok: r.ok, d })))
      .then(({ ok, d }) => {
        if (!ok) {
          setLoadError(d?.error || 'Erreur chargement sessions');
          setSessions([]);
        } else {
          const arr = Array.isArray(d?.sessions) ? d.sessions : [];
          setSessions(arr);
          if (arr.length > 0) setSelectedId(arr[0].session_id);
        }
        setLoading(false);
      })
      .catch(() => {
        setLoadError('Erreur réseau');
        setLoading(false);
      });
  }, [open, listId]);

  // ─── Escape close ─────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    function onKey(e) {
      if (e.key === 'Escape' && !submitting) onClose?.();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose, submitting]);

  const selectedSession = useMemo(
    () => sessions.find((s) => s.session_id === selectedId) || null,
    [sessions, selectedId]
  );

  const importCount = useMemo(() => {
    if (!selectedSession) return 0;
    return includeEmailless ? selectedSession.prospects_count : selectedSession.emails_count;
  }, [selectedSession, includeEmailless]);

  // Auto-coche "Inclure les prospects sans email" quand on sélectionne une
  // session qui n'a AUCUN email — sinon importCount = 0 et le bouton
  // resterait grisé avec "0 prospect à importer" alors que la session a
  // des prospects valides (juste sans email, ex: catégorie obscure outre-mer).
  // L'user peut toujours décocher manuellement après s'il préfère filtrer.
  useEffect(() => {
    if (selectedSession && selectedSession.emails_count === 0 && selectedSession.prospects_count > 0) {
      setIncludeEmailless(true);
    }
  }, [selectedSession]);

  if (!open) return null;

  async function handleSubmit() {
    if (!selectedId || submitting || importCount === 0) return;
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch(
        `/api/admin/prospection/lists/${listId}/import-from-session`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_id: selectedId,
            include_emailless: includeEmailless,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Erreur import');
        setSubmitting(false);
        return;
      }
      setResult(data);
      onSuccess?.(data);
    } catch (err) {
      console.error('[ImportFromProspectionModal] error', err);
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
        aria-labelledby="import-prosp-title"
        className="relative w-full max-w-2xl max-h-[92vh] overflow-hidden rounded-2xl bg-surface-base border border-line shadow-2xl flex flex-col animate-in zoom-in-95 slide-in-from-bottom-2 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-surface-base border-b border-line flex-shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0">
              <Search size={14} className="text-white" />
            </div>
            <h2 id="import-prosp-title" className="text-base font-bold text-content-primary">
              Importer depuis Volia Prospection
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
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {result ? (
            // ─── Success ─────────────────────────────
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 size={20} className="text-violet-600" />
                </div>
                <div>
                  <p className="text-base font-bold text-content-primary">Import terminé</p>
                  <p className="text-xs text-content-tertiary">
                    Les prospects ont été ajoutés à votre liste.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 mb-5">
                <div className="rounded-xl border border-violet-200 bg-violet-50/60 p-3">
                  <div className="text-2xl font-extrabold text-violet-700 tabular-nums">
                    {result.inserted || 0}
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-violet-700/80 font-semibold mt-0.5">
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
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 shadow-md shadow-violet-500/20 transition-all"
                >
                  Terminer
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          ) : loading ? (
            // ─── Loading ─────────────────────────────
            <div className="flex items-center justify-center py-16">
              <Loader2 size={20} className="animate-spin text-violet-500" />
            </div>
          ) : loadError ? (
            // ─── Load error ──────────────────────────
            <div className="flex items-start gap-2 px-3 py-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700">
              <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
              <p className="text-xs font-medium">{loadError}</p>
            </div>
          ) : sessions.length === 0 ? (
            // ─── Empty state ─────────────────────────
            <div className="flex flex-col items-center text-center py-10">
              <div className="w-14 h-14 rounded-full bg-violet-100 flex items-center justify-center mb-3">
                <Inbox size={22} className="text-violet-600" />
              </div>
              <p className="text-base font-bold text-content-primary mb-1">
                Aucune recherche encore.
              </p>
              <p className="text-sm text-content-tertiary max-w-sm mb-4">
                Lance une recherche dans Prospection pour générer des prospects à importer ici.
              </p>
              <Link
                href="/dashboard"
                onClick={onClose}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 shadow-md shadow-violet-500/20 transition-all"
              >
                Aller à Volia Prospection
                <ArrowRight size={14} />
              </Link>
            </div>
          ) : (
            // ─── Sessions list ───────────────────────
            <div className="space-y-3">
              <p className="text-xs text-content-tertiary">
                Choisissez une recherche pour importer ses prospects dans la liste.
              </p>

              <div className="space-y-2 max-h-[42vh] overflow-y-auto pr-1">
                {sessions.map((s) => {
                  const isSelected = s.session_id === selectedId;
                  const depts = (s.departments || []).slice(0, 5).join(', ');
                  const moreDepts = (s.departments || []).length > 5
                    ? ` +${s.departments.length - 5}` : '';
                  const cats = describeCategories(s.categories);
                  return (
                    <label
                      key={s.session_id}
                      className={`flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer transition-colors ${
                        isSelected
                          ? 'border-violet-400 bg-violet-50/60 ring-2 ring-violet-500/20'
                          : 'border-line bg-surface-card hover:bg-surface-elevated'
                      }`}
                    >
                      <input
                        type="radio"
                        name="session"
                        value={s.session_id}
                        checked={isSelected}
                        onChange={() => setSelectedId(s.session_id)}
                        className="mt-1 w-4 h-4 text-violet-600 border-line focus:ring-violet-500 focus:ring-offset-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-content-primary">
                            {s.label || `Recherche du ${formatDate(s.created_at)}`}
                          </span>
                          {!s.label && (
                            <span className="text-[10px] text-content-tertiary">
                              {formatDate(s.created_at)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-[11px] text-content-tertiary flex-wrap">
                          {depts && (
                            <span className="inline-flex items-center gap-1">
                              <MapPin size={10} />
                              {depts}
                              {moreDepts}
                            </span>
                          )}
                          {cats && (
                            <span className="truncate max-w-[260px]">{cats}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1.5 text-[11px] flex-wrap">
                          <span className="inline-flex items-center gap-1 text-content-secondary">
                            <Users size={11} />
                            <strong className="tabular-nums">{s.prospects_count}</strong> prospect
                            {s.prospects_count > 1 ? 's' : ''}
                          </span>
                          <span className={`inline-flex items-center gap-1 ${s.emails_count > 0 ? 'text-green-700' : 'text-content-tertiary'}`}>
                            <Mail size={11} />
                            <strong className="tabular-nums">{s.emails_count}</strong> avec email
                          </span>
                          {/* Hint pour les sessions sans email (rare mais courant
                              sur catégories obscures / outre-mer) */}
                          {s.prospects_count > 0 && s.emails_count === 0 && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 text-[10px] font-semibold">
                              Pas d&apos;email — option ci-dessous requise
                            </span>
                          )}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>

              {/* Checkbox emailless */}
              <label className="flex items-start gap-2 p-3 rounded-lg border border-line bg-surface-card cursor-pointer hover:bg-surface-elevated transition-colors">
                <input
                  type="checkbox"
                  checked={includeEmailless}
                  onChange={(e) => setIncludeEmailless(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-violet-600 border-line rounded focus:ring-violet-500 focus:ring-offset-0"
                />
                <div className="flex-1">
                  <span className="text-sm font-medium text-content-primary">
                    Inclure les prospects sans email
                  </span>
                  <p className="text-[11px] text-content-tertiary mt-0.5">
                    Utile pour les campagnes SMS (téléphone seul).
                  </p>
                </div>
              </label>

              {error && (
                <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-700">
                  <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                  <p className="text-xs font-medium">{error}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {!result && !loading && sessions.length > 0 && (
          <div className="flex items-center justify-between gap-2 px-6 py-3.5 bg-surface-elevated border-t border-line flex-shrink-0">
            <div className="text-xs text-content-secondary">
              {selectedSession ? (
                <>
                  <strong className="tabular-nums">{importCount}</strong> prospect
                  {importCount > 1 ? 's' : ''} à importer
                  {selectedSession.emails_count !== selectedSession.prospects_count && (
                    <span className="text-content-tertiary ml-1">
                      ({includeEmailless
                        ? `dont ${selectedSession.emails_count} avec email`
                        : `${selectedSession.prospects_count - selectedSession.emails_count} sans email exclus`})
                    </span>
                  )}
                </>
              ) : (
                'Sélectionnez une recherche'
              )}
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
                disabled={submitting || !selectedId || importCount === 0}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 shadow-md shadow-violet-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {submitting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Import…
                  </>
                ) : (
                  <>
                    <ArrowRight size={14} />
                    Importer {importCount > 0 ? `(${importCount})` : ''}
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
