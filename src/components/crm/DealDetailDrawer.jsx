'use client';

// ─────────────────────────────────────────────────────────────────────
// DealDetailDrawer — side drawer pour voir / éditer / supprimer un deal.
// ─────────────────────────────────────────────────────────────────────
// Props :
//   - dealId : id du deal sélectionné (null = fermé)
//   - stages : stages du pipeline courant (pour le dropdown stage)
//   - onClose : () => void
//   - onUpdate(deal) : callback après PATCH success (mise à jour state parent)
//   - onDelete(dealId) : callback après DELETE success
//
// Fetch en interne (GET /api/crm/deals/[id]) au mount pour récupérer
// les détails complets (contact full, activities timeline).
// Phase 2 : pas de création d'activity (placeholder).
// ─────────────────────────────────────────────────────────────────────

import { useEffect, useState } from 'react';
import {
  X, Loader2, Trash2, Mail, Phone, Building2, User,
  Calendar, AlertCircle, Save, Check, StickyNote, CheckSquare,
  Square, Users as UsersIcon, Megaphone, Sparkles,
} from 'lucide-react';
import { formatDealValue } from '@/lib/crm';
import ActivityForm from './ActivityForm';
import AddToCampagneModal from './AddToCampagneModal';

// Icône par type d'activity
const ACTIVITY_TYPE_META = {
  note: { Icon: StickyNote, color: 'text-zinc-600 bg-zinc-100' },
  call: { Icon: Phone, color: 'text-blue-600 bg-blue-100' },
  email: { Icon: Mail, color: 'text-emerald-600 bg-emerald-100' },
  meeting: { Icon: UsersIcon, color: 'text-violet-600 bg-violet-100' },
  task: { Icon: CheckSquare, color: 'text-amber-600 bg-amber-100' },
};

function formatActivityDate(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
    });
  } catch {
    return '';
  }
}

function isOverdue(act) {
  if (act.type !== 'task') return false;
  if (act.completed_at) return false;
  if (!act.due_at) return false;
  return new Date(act.due_at).getTime() < Date.now();
}

export default function DealDetailDrawer({
  dealId,
  stages = [],
  onClose,
  onUpdate,
  onDelete,
}) {
  const [deal, setDeal] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // edits buffer (sauvegardé via Save explicite ou onBlur)
  const [edits, setEdits] = useState({});
  const [savingField, setSavingField] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Tasks toggle (Phase 4)
  const [togglingTaskId, setTogglingTaskId] = useState(null);

  // Bridge CRM → Campagnes
  const [campagneOpen, setCampagneOpen] = useState(false);
  const [campagneSuccess, setCampagneSuccess] = useState(null);

  // Toggle completed_at sur une task (optimistic)
  async function toggleTask(activity) {
    if (!activity || activity.type !== 'task' || togglingTaskId) return;
    const willComplete = !activity.completed_at;
    setTogglingTaskId(activity.id);
    // Optimistic update
    setDeal((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        activities: (prev.activities || []).map((a) =>
          a.id === activity.id
            ? { ...a, completed_at: willComplete ? new Date().toISOString() : null }
            : a
        ),
      };
    });
    try {
      const res = await fetch(`/api/crm/activities/${activity.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed_at: willComplete }),
      });
      const data = await res.json();
      if (!res.ok) {
        // Revert
        setDeal((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            activities: (prev.activities || []).map((a) =>
              a.id === activity.id
                ? { ...a, completed_at: activity.completed_at }
                : a
            ),
          };
        });
        setError(data.error || 'Erreur mise à jour de la tâche');
      } else {
        // Sync avec réponse server
        setDeal((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            activities: (prev.activities || []).map((a) =>
              a.id === activity.id ? { ...a, ...data.data } : a
            ),
          };
        });
      }
    } catch (err) {
      console.error('[DealDetailDrawer] toggleTask error', err);
      setError('Erreur réseau');
    } finally {
      setTogglingTaskId(null);
    }
  }

  // Fetch quand le drawer s'ouvre
  useEffect(() => {
    if (!dealId) {
      setDeal(null);
      setEdits({});
      setError('');
      setConfirmDelete(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError('');
    fetch(`/api/crm/deals/${dealId}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (!data.success) {
          setError(data.error || 'Erreur chargement deal');
          setLoading(false);
          return;
        }
        setDeal(data.data);
        setEdits({
          title: data.data.title || '',
          value_cents: data.data.value_cents || 0,
          expected_close_date: data.data.expected_close_date || '',
          notes: data.data.notes || '',
        });
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setError('Erreur réseau');
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [dealId]);

  // Escape close
  useEffect(() => {
    if (!dealId) return;
    function onKey(e) {
      if (e.key === 'Escape') onClose?.();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [dealId, onClose]);

  if (!dealId) return null;

  // ─── Save field (PATCH) ─────────────────────────────────────
  async function saveField(field, value) {
    if (!deal) return;
    setSavingField(field);
    setError('');
    try {
      const body = { [field]: value };
      const res = await fetch(`/api/crm/deals/${deal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Erreur sauvegarde');
        setSavingField(null);
        return;
      }
      setDeal({ ...deal, ...data.data });
      onUpdate?.(data.data);
    } catch {
      setError('Erreur réseau');
    } finally {
      setSavingField(null);
    }
  }

  // ─── Stage change (utilise /move pour gérer status auto) ────
  async function changeStage(newStageId) {
    if (!deal || newStageId === deal.stage_id) return;
    setSavingField('stage_id');
    setError('');
    try {
      const res = await fetch(`/api/crm/deals/${deal.id}/move`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage_id: newStageId, position: 0 }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Erreur changement étape');
        setSavingField(null);
        return;
      }
      const updated = { ...deal, ...data.data };
      setDeal(updated);
      onUpdate?.(updated);
    } catch {
      setError('Erreur réseau');
    } finally {
      setSavingField(null);
    }
  }

  // ─── Delete ─────────────────────────────────────────────────
  async function handleDelete() {
    if (!deal) return;
    setDeleting(true);
    setError('');
    try {
      const res = await fetch(`/api/crm/deals/${deal.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Erreur suppression');
        setDeleting(false);
        return;
      }
      onDelete?.(deal.id);
      onClose?.();
    } catch {
      setError('Erreur réseau');
      setDeleting(false);
    }
  }

  const status = deal?.status;
  const isWon = status === 'won';
  const isLost = status === 'lost';

  return (
    <div
      className="fixed inset-0 z-[90] flex justify-end bg-zinc-900/40 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Détail du deal"
        className="relative w-full max-w-md h-full overflow-y-auto bg-surface-base border-l border-line shadow-2xl animate-in slide-in-from-right duration-200"
      >
        {/* Header sticky */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-3.5 bg-surface-base border-b border-line">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
              Deal
            </span>
            {isWon && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-700 border border-emerald-200">
                ✓ Gagné
              </span>
            )}
            {isLost && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-rose-100 text-rose-700 border border-rose-200">
                ✗ Perdu
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-content-tertiary hover:text-content-primary hover:bg-surface-elevated transition-colors"
            aria-label="Fermer"
          >
            <X size={18} />
          </button>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin text-emerald-600" />
          </div>
        )}

        {error && !deal && (
          <div className="m-5 flex items-start gap-2 px-3 py-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-700">
            <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
            <p className="text-xs font-medium">{error}</p>
          </div>
        )}

        {deal && (
          <div className="p-5 space-y-5">
            {/* Auto-créé banner (Phase 2) */}
            {deal.metadata?.auto_created === true && (
              <AutoCreatedBanner metadata={deal.metadata} />
            )}

            {/* Title (editable inline) */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-content-tertiary mb-1.5">
                Titre
              </label>
              <input
                type="text"
                value={edits.title || ''}
                onChange={(e) => setEdits({ ...edits, title: e.target.value })}
                onBlur={() => {
                  if (edits.title !== deal.title && edits.title.trim()) {
                    saveField('title', edits.title.trim());
                  }
                }}
                className="w-full px-3 py-2 rounded-lg border border-line bg-surface-card text-base font-semibold text-content-primary focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
              />
            </div>

            {/* Value */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-content-tertiary mb-1.5">
                Valeur
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={Math.round((edits.value_cents || 0) / 100)}
                  onChange={(e) =>
                    setEdits({ ...edits, value_cents: Math.max(0, Math.round(parseFloat(e.target.value || 0) * 100)) })
                  }
                  onBlur={() => {
                    if (edits.value_cents !== deal.value_cents) {
                      saveField('value_cents', edits.value_cents);
                    }
                  }}
                  className="flex-1 px-3 py-2 rounded-lg border border-line bg-surface-card text-sm font-bold text-content-primary tabular-nums focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
                <span className="text-sm font-semibold text-content-tertiary">€</span>
              </div>
              <p className="mt-1 text-[11px] text-content-tertiary">
                {formatDealValue(edits.value_cents || 0)}
              </p>
            </div>

            {/* Stage */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-content-tertiary mb-1.5">
                Étape
                {savingField === 'stage_id' && (
                  <Loader2 size={10} className="inline ml-2 animate-spin" />
                )}
              </label>
              <select
                value={deal.stage_id}
                onChange={(e) => changeStage(e.target.value)}
                disabled={savingField === 'stage_id'}
                className="w-full px-3 py-2 rounded-lg border border-line bg-surface-card text-sm text-content-primary focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50"
              >
                {stages.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.probability}%)
                  </option>
                ))}
              </select>
            </div>

            {/* Expected close */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-content-tertiary mb-1.5">
                <Calendar size={10} className="inline mr-1" />
                Closing prévu
              </label>
              <input
                type="date"
                value={edits.expected_close_date || ''}
                onChange={(e) => setEdits({ ...edits, expected_close_date: e.target.value })}
                onBlur={() => {
                  if (edits.expected_close_date !== (deal.expected_close_date || '')) {
                    saveField('expected_close_date', edits.expected_close_date || null);
                  }
                }}
                className="w-full px-3 py-2 rounded-lg border border-line bg-surface-card text-sm text-content-primary focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            {/* Contact card */}
            {deal.contact ? (
              <div className="p-3 rounded-lg border border-line bg-surface-card">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-content-tertiary">
                    Contact
                  </span>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-sm font-semibold text-content-primary">
                    <User size={14} className="text-content-tertiary" />
                    {deal.contact.name}
                  </div>
                  {deal.contact.company && (
                    <div className="flex items-center gap-2 text-xs text-content-secondary">
                      <Building2 size={12} className="text-content-tertiary" />
                      {deal.contact.company}
                    </div>
                  )}
                  {deal.contact.email && (
                    <a
                      href={`mailto:${deal.contact.email}`}
                      className="flex items-center gap-2 text-xs text-emerald-700 hover:underline"
                    >
                      <Mail size={12} />
                      {deal.contact.email}
                    </a>
                  )}
                  {deal.contact.phone && (
                    <a
                      href={`tel:${deal.contact.phone}`}
                      className="flex items-center gap-2 text-xs text-content-secondary hover:text-content-primary"
                    >
                      <Phone size={12} />
                      {deal.contact.phone}
                    </a>
                  )}
                </div>
                {/* Bridge CRM → Campagnes */}
                <div className="mt-3 pt-3 border-t border-line/70">
                  <button
                    type="button"
                    onClick={() => setCampagneOpen(true)}
                    disabled={!deal.contact?.email && !deal.contact?.phone}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 shadow-sm shadow-violet-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all w-full justify-center"
                    title={
                      !deal.contact?.email && !deal.contact?.phone
                        ? 'Email ou téléphone requis pour ajouter à une séquence'
                        : 'Ajouter ce contact à une séquence Campagnes'
                    }
                  >
                    <Megaphone size={12} />
                    Ajouter à une séquence
                  </button>
                  {campagneSuccess && (
                    <p className="mt-2 text-[11px] text-violet-700">
                      Ajouté à « {campagneSuccess.list_name} »
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-lg border border-dashed border-line bg-surface-card/50 text-center">
                <p className="text-xs text-content-tertiary">Aucun contact lié</p>
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-content-tertiary mb-1.5">
                Notes
                {savingField === 'notes' && (
                  <Loader2 size={10} className="inline ml-2 animate-spin" />
                )}
              </label>
              <textarea
                rows={4}
                value={edits.notes || ''}
                onChange={(e) => setEdits({ ...edits, notes: e.target.value })}
                onBlur={() => {
                  if ((edits.notes || '') !== (deal.notes || '')) {
                    saveField('notes', edits.notes.trim() || null);
                  }
                }}
                placeholder="Contexte, prochaines étapes…"
                className="w-full px-3 py-2 rounded-lg border border-line bg-surface-card text-sm text-content-primary placeholder:text-content-muted focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 resize-none"
              />
            </div>

            {/* Activity timeline + form (Phase 4) */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-content-tertiary mb-1.5">
                Activités
              </label>

              {/* Form de création */}
              <ActivityForm
                dealId={deal.id}
                compact
                onCreated={(act) => {
                  // Optimistic prepend
                  setDeal((prev) =>
                    prev
                      ? { ...prev, activities: [act, ...(prev.activities || [])] }
                      : prev
                  );
                }}
              />

              {/* Timeline */}
              {Array.isArray(deal.activities) && deal.activities.length > 0 && (
                <ul className="mt-3 space-y-2">
                  {deal.activities.map((a) => {
                    const meta = ACTIVITY_TYPE_META[a.type] || ACTIVITY_TYPE_META.note;
                    const Icon = meta.Icon;
                    const overdue = isOverdue(a);
                    const completed = !!a.completed_at;
                    return (
                      <li
                        key={a.id}
                        className={`flex items-start gap-2 px-3 py-2 rounded-lg border ${
                          overdue
                            ? 'border-rose-200 bg-rose-50/40'
                            : completed
                            ? 'border-line bg-surface-card/40 opacity-70'
                            : 'border-line bg-surface-card/60'
                        }`}
                      >
                        <div className={`p-1.5 rounded-md flex-shrink-0 ${meta.color}`}>
                          <Icon size={11} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2 mb-0.5">
                            <span className="font-semibold uppercase text-[9px] text-content-tertiary tracking-wider">
                              {a.type}
                              {overdue && (
                                <span className="ml-1.5 px-1 py-px rounded bg-rose-100 text-rose-700 border border-rose-200 text-[8px]">
                                  En retard
                                </span>
                              )}
                            </span>
                            <span className="text-[10px] text-content-muted tabular-nums">
                              {formatActivityDate(a.created_at)}
                            </span>
                          </div>
                          <p
                            className={`text-xs whitespace-pre-wrap break-words ${
                              completed ? 'text-content-tertiary line-through' : 'text-content-primary'
                            }`}
                          >
                            {a.content}
                          </p>
                          {a.type === 'task' && a.due_at && (
                            <p className="text-[10px] text-content-tertiary mt-0.5 tabular-nums">
                              Échéance : {formatActivityDate(a.due_at)}
                            </p>
                          )}
                        </div>
                        {a.type === 'task' && (
                          <button
                            type="button"
                            onClick={() => toggleTask(a)}
                            disabled={togglingTaskId === a.id}
                            className={`p-1 rounded-md transition-colors flex-shrink-0 ${
                              completed
                                ? 'text-emerald-600 hover:bg-emerald-50'
                                : 'text-content-tertiary hover:text-emerald-600 hover:bg-emerald-50'
                            } disabled:opacity-50`}
                            aria-label={completed ? 'Marquer comme non-complétée' : 'Marquer comme complétée'}
                            title={completed ? 'Décocher' : 'Marquer complétée'}
                          >
                            {togglingTaskId === a.id ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : completed ? (
                              <CheckSquare size={14} />
                            ) : (
                              <Square size={14} />
                            )}
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Error display */}
            {error && (
              <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-700">
                <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                <p className="text-xs font-medium">{error}</p>
              </div>
            )}

            {/* Saving indicator global */}
            {savingField && savingField !== 'stage_id' && (
              <p className="text-[11px] text-content-tertiary flex items-center gap-1">
                <Save size={10} className="animate-pulse" />
                Sauvegarde…
              </p>
            )}

            {/* Delete */}
            <div className="pt-4 mt-4 border-t border-line">
              {!confirmDelete ? (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  <Trash2 size={12} />
                  Supprimer le deal
                </button>
              ) : (
                <div className="p-3 rounded-lg border border-rose-200 bg-rose-50">
                  <p className="text-xs font-semibold text-rose-700 mb-2">
                    Confirmer la suppression ? Action irréversible.
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={deleting}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 disabled:opacity-50"
                    >
                      {deleting ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <Check size={12} />
                      )}
                      Oui, supprimer
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(false)}
                      disabled={deleting}
                      className="px-3 py-1.5 rounded-md text-xs font-medium text-content-secondary hover:bg-surface-elevated"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal Bridge CRM → Campagnes */}
      {deal?.contact?.id && (
        <AddToCampagneModal
          open={campagneOpen}
          onClose={() => setCampagneOpen(false)}
          contactIds={[deal.contact.id]}
          dealId={deal.id}
          onSuccess={(data) => {
            setCampagneSuccess(data);
            // Optimistic prepend de l'activity note dans la timeline
            if (data?.activities_logged > 0 && data?.list_name) {
              const optimistic = {
                id: `tmp-${Date.now()}`,
                type: 'note',
                content: `Ajouté à la séquence "${data.list_name}"`,
                deal_id: deal.id,
                contact_id: deal.contact.id,
                due_at: null,
                completed_at: null,
                created_at: new Date().toISOString(),
              };
              setDeal((prev) =>
                prev
                  ? { ...prev, activities: [optimistic, ...(prev.activities || [])] }
                  : prev
              );
            }
          }}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// AutoCreatedBanner — bandeau violet affiché quand un deal est issu
// d'une réponse auto-traitée à une campagne (Phase 2).
// ─────────────────────────────────────────────────────────────────────
function AutoCreatedBanner({ metadata = {} }) {
  const channelRaw = metadata?.source_channel;
  const channelLabel =
    channelRaw === 'email' ? 'email' : channelRaw === 'sms' ? 'SMS' : null;
  return (
    <div className="rounded-lg border border-violet-200 bg-violet-50 px-3 py-2.5 flex items-start gap-2">
      <div className="p-1 rounded-md bg-violet-100 flex-shrink-0">
        <Sparkles size={12} className="text-violet-600" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-bold uppercase tracking-wider text-violet-700 mb-0.5">
          Deal auto-créé
        </p>
        <p className="text-xs text-violet-900 leading-snug">
          Ce deal a été créé automatiquement depuis une réponse à votre campagne
          {channelLabel ? ` ${channelLabel}` : ''}. Engagement déjà enregistré
          dans la timeline ci-dessous.
        </p>
      </div>
    </div>
  );
}
