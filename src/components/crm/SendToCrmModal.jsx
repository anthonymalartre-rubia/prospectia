'use client';

// ─────────────────────────────────────────────────────────────────────
// SendToCrmModal — pousse N prospects (de la Prospection) vers le CRM.
// ─────────────────────────────────────────────────────────────────────
// Props :
//   - open : bool
//   - onClose : () => void
//   - prospects : array (les prospects à envoyer ; le mapping
//     prospect → contact se fait ici-même)
//   - onSuccess?({ created, updated, skipped, deals_created }) : callback
//     après succès du bulk-import.
//
// Flow :
//   1. Au mount, fetch /api/crm/pipelines pour la liste (Business plan
//      requis ; un 403 est traité comme "no access" et on ferme).
//   2. L'user choisit s'il veut créer des deals (checkbox) et la
//      stage initiale (select).
//   3. L'user choisit le comportement sur doublon (skip / update).
//   4. POST /api/crm/contacts/bulk-import.
//
// Le composant est self-contained : le parent ne fournit que la liste
// brute des prospects. Le mapping (nom, email, phone, company, etc.)
// est fait ici, pas dans ResultsPanel.
// ─────────────────────────────────────────────────────────────────────

import { useEffect, useState } from 'react';
import { X, Loader2, AlertCircle, ArrowRight, CheckCircle2, KanbanSquare, Users } from 'lucide-react';
import Link from 'next/link';

function mapProspectToContact(p) {
  if (!p) return null;
  return {
    name: p.nom || p.name || '',
    email: p.email || null,
    phone: p.telephone || p.phone || null,
    company: p.nom || null, // En B2B/Google Places, le "nom" = l'entreprise
    position: null,
    source: 'prospection',
    source_ref_id: p.place_id || p.id || null,
  };
}

export default function SendToCrmModal({
  open,
  onClose,
  prospects = [],
  onSuccess,
}) {
  const [pipelines, setPipelines] = useState([]);
  const [loadingPipes, setLoadingPipes] = useState(false);
  const [pipelinesError, setPipelinesError] = useState('');

  const [createDeals, setCreateDeals] = useState(true);
  const [pipelineId, setPipelineId] = useState('');
  const [stageId, setStageId] = useState('');
  const [duplicateMode, setDuplicateMode] = useState('skip');

  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  // ─── Mount : fetch pipelines ────────────────────────────────
  useEffect(() => {
    if (!open) return;
    setResult(null);
    setError('');
    setLoadingPipes(true);
    setPipelinesError('');
    fetch('/api/crm/pipelines')
      .then((r) => r.json().then((d) => ({ ok: r.ok, status: r.status, d })))
      .then(({ ok, status, d }) => {
        if (!ok) {
          if (status === 403) {
            // Le gating Business est déjà en amont ; si on tombe ici c'est
            // une condition de course (downgrade pendant l'usage par ex.)
            setPipelinesError('CRM réservé au plan Business. Mettez-vous à jour pour continuer.');
          } else {
            setPipelinesError(d?.error || 'Erreur chargement pipelines');
          }
          setLoadingPipes(false);
          return;
        }
        const list = Array.isArray(d?.data) ? d.data : [];
        setPipelines(list);
        const def = list.find((p) => p.is_default) || list[0];
        if (def) {
          setPipelineId(def.id);
          const firstStage = def.stages?.[0];
          if (firstStage) setStageId(firstStage.id);
        }
        setLoadingPipes(false);
      })
      .catch(() => {
        setPipelinesError('Erreur réseau');
        setLoadingPipes(false);
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

  // Quand on change de pipeline, reset le stage sur le premier
  useEffect(() => {
    if (!pipelineId) return;
    const p = pipelines.find((x) => x.id === pipelineId);
    if (p && p.stages?.length > 0) {
      // Si le stage actuel n'appartient pas au nouveau pipeline, on reset
      const stageBelongs = p.stages.some((s) => s.id === stageId);
      if (!stageBelongs) setStageId(p.stages[0].id);
    }
  }, [pipelineId, pipelines, stageId]);

  if (!open) return null;

  const validProspects = prospects.filter((p) => p && (p.nom || p.name));
  const count = validProspects.length;

  const selectedPipeline = pipelines.find((p) => p.id === pipelineId);
  // On exclut les stages closing du select initial (créer un deal directement
  // en "Closé gagné" n'a aucun sens à l'envoi).
  const openStages = (selectedPipeline?.stages || []).filter(
    (s) => !s.closing_type
  );

  async function handleSubmit(e) {
    e.preventDefault();
    if (submitting || count === 0) return;
    setError('');
    setSubmitting(true);

    try {
      const contacts = validProspects.map(mapProspectToContact).filter(Boolean);

      const body = {
        contacts,
        source: 'prospection',
        mode: duplicateMode,
      };
      if (createDeals && pipelineId && stageId) {
        body.createDeals = { pipeline_id: pipelineId, stage_id: stageId };
      }

      const res = await fetch('/api/crm/contacts/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Erreur envoi vers CRM');
        setSubmitting(false);
        return;
      }
      setResult(data.data);
      onSuccess?.(data.data);
    } catch (err) {
      console.error('[SendToCrmModal] error', err);
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
        aria-labelledby="send-crm-title"
        className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-2xl bg-surface-base border border-line shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-2 duration-200"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-surface-base border-b border-line">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0">
              <KanbanSquare size={14} className="text-white" />
            </div>
            <h2 id="send-crm-title" className="text-base font-bold text-content-primary">
              Envoyer vers le CRM
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
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 size={20} className="text-emerald-600" />
              </div>
              <div>
                <p className="text-base font-bold text-content-primary">Envoi terminé</p>
                <p className="text-xs text-content-tertiary">Vos prospects sont dans le CRM.</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-5">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3">
                <div className="text-2xl font-extrabold text-emerald-700 tabular-nums">
                  {result.created || 0}
                </div>
                <div className="text-[10px] uppercase tracking-wider text-emerald-700/80 font-semibold mt-0.5">
                  Contacts créés
                </div>
              </div>
              <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-3">
                <div className="text-2xl font-extrabold text-blue-700 tabular-nums">
                  {result.updated || 0}
                </div>
                <div className="text-[10px] uppercase tracking-wider text-blue-700/80 font-semibold mt-0.5">
                  Mis à jour
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
              {result.deals_created > 0 && (
                <div className="rounded-xl border border-violet-200 bg-violet-50/60 p-3">
                  <div className="text-2xl font-extrabold text-violet-700 tabular-nums">
                    {result.deals_created}
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-violet-700/80 font-semibold mt-0.5">
                    Deals créés
                  </div>
                </div>
              )}
            </div>

            {result.errors && result.errors.length > 0 && (
              <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                <p className="font-semibold mb-1">Erreurs :</p>
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
                href={createDeals && result.deals_created > 0 ? '/app/crm' : '/app/crm/contacts'}
                onClick={() => onClose?.()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-md shadow-emerald-500/20 transition-all"
              >
                {createDeals && result.deals_created > 0
                  ? 'Voir le pipeline'
                  : 'Voir les contacts'}
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        ) : (
          // ─── Form state ───────────────────────────────
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
            {/* Summary */}
            <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-gradient-to-br from-emerald-50 to-teal-50/60 border border-emerald-200">
              <Users size={16} className="text-emerald-600 flex-shrink-0" />
              <p className="text-sm text-content-primary">
                <strong className="font-bold tabular-nums">{count}</strong> prospect
                {count > 1 ? 's' : ''} {count > 1 ? 'vont être envoyés' : 'va être envoyé'} vers votre CRM.
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

            {/* Loading pipelines */}
            {loadingPipes && (
              <div className="flex items-center justify-center py-6">
                <Loader2 size={20} className="animate-spin text-emerald-600" />
              </div>
            )}

            {pipelinesError && !loadingPipes && (
              <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-700">
                <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                <p className="text-xs font-medium">{pipelinesError}</p>
              </div>
            )}

            {!loadingPipes && !pipelinesError && (
              <>
                {/* Création contacts (toujours coché, désactivé) */}
                <div className="flex items-start gap-2.5 p-3 rounded-lg border border-emerald-200 bg-emerald-50/40">
                  <input
                    type="checkbox"
                    checked
                    disabled
                    className="mt-0.5 w-4 h-4 rounded text-emerald-600 border-emerald-300 cursor-not-allowed"
                  />
                  <div className="flex-1">
                    <label className="text-sm font-semibold text-content-primary">
                      Créer les contacts
                    </label>
                    <p className="text-[11px] text-content-tertiary mt-0.5">
                      Tous les prospects deviendront des contacts dans le CRM.
                    </p>
                  </div>
                </div>

                {/* Création deals */}
                <div className="rounded-lg border border-line p-3">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={createDeals}
                      onChange={(e) => setCreateDeals(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded text-emerald-600 border-line focus:ring-emerald-500 focus:ring-offset-0"
                    />
                    <div className="flex-1">
                      <span className="text-sm font-semibold text-content-primary">
                        Créer un deal par contact dans le pipeline
                      </span>
                      <p className="text-[11px] text-content-tertiary mt-0.5">
                        Un deal de 0€ sera créé pour chaque contact. Vous éditerez les
                        détails (valeur, notes) dans le Kanban.
                      </p>
                    </div>
                  </label>

                  {createDeals && pipelines.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 mt-3 pl-7">
                      <div>
                        <label
                          htmlFor="pipeline-select"
                          className="block text-[10px] font-semibold uppercase tracking-wider text-content-muted mb-1"
                        >
                          Pipeline
                        </label>
                        <select
                          id="pipeline-select"
                          value={pipelineId}
                          onChange={(e) => setPipelineId(e.target.value)}
                          className="w-full px-2 py-1.5 rounded-md border border-line bg-surface-card text-xs text-content-primary focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                        >
                          {pipelines.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                              {p.is_default ? ' (par défaut)' : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label
                          htmlFor="stage-select"
                          className="block text-[10px] font-semibold uppercase tracking-wider text-content-muted mb-1"
                        >
                          Étape initiale
                        </label>
                        <select
                          id="stage-select"
                          value={stageId}
                          onChange={(e) => setStageId(e.target.value)}
                          className="w-full px-2 py-1.5 rounded-md border border-line bg-surface-card text-xs text-content-primary focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                        >
                          {openStages.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {/* Doublons */}
                <div className="rounded-lg border border-line p-3">
                  <p className="text-xs font-semibold text-content-secondary mb-2">
                    Si un email existe déjà :
                  </p>
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="duplicateMode"
                        value="skip"
                        checked={duplicateMode === 'skip'}
                        onChange={() => setDuplicateMode('skip')}
                        className="w-4 h-4 text-emerald-600 border-line focus:ring-emerald-500 focus:ring-offset-0"
                      />
                      <span className="text-xs text-content-primary">
                        <strong className="font-semibold">Ignorer</strong>{' '}
                        <span className="text-content-tertiary">— pas de modification</span>
                      </span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="duplicateMode"
                        value="update"
                        checked={duplicateMode === 'update'}
                        onChange={() => setDuplicateMode('update')}
                        className="w-4 h-4 text-emerald-600 border-line focus:ring-emerald-500 focus:ring-offset-0"
                      />
                      <span className="text-xs text-content-primary">
                        <strong className="font-semibold">Mettre à jour</strong>{' '}
                        <span className="text-content-tertiary">
                          — complète les champs vides
                        </span>
                      </span>
                    </label>
                  </div>
                </div>
              </>
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
                disabled={submitting || count === 0 || loadingPipes || !!pipelinesError}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-md shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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
