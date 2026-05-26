'use client';

// ─────────────────────────────────────────────────────────────────────
// ActivityForm — formulaire de création d'activité (note/call/email/meeting/task).
// ─────────────────────────────────────────────────────────────────────
// Props :
//   - dealId? : string  (lier l'activity à un deal)
//   - contactId? : string  (lier l'activity à un contact)
//     (au moins l'un des deux doit être fourni)
//   - onCreated(activity) : callback après POST success
//   - compact?: bool — version dense (utilisée dans le drawer)
//
// L'API impose deal_id OU contact_id. Le composant ne sait pas lequel,
// il transmet juste ce qu'il a. Si les deux sont fournis (rare), l'API
// accepte aussi.
//
// Si type === 'task', un champ date apparaît pour due_at.
// ─────────────────────────────────────────────────────────────────────

import { useState } from 'react';
import {
  StickyNote,
  Phone,
  Mail,
  Users,
  CheckSquare,
  Loader2,
  AlertCircle,
  Send,
} from 'lucide-react';

const TYPES = [
  { value: 'note', label: 'Note', Icon: StickyNote },
  { value: 'call', label: 'Appel', Icon: Phone },
  { value: 'email', label: 'Email', Icon: Mail },
  { value: 'meeting', label: 'Meeting', Icon: Users },
  { value: 'task', label: 'Tâche', Icon: CheckSquare },
];

export default function ActivityForm({
  dealId = null,
  contactId = null,
  onCreated,
  compact = false,
}) {
  const [type, setType] = useState('note');
  const [content, setContent] = useState('');
  const [dueAt, setDueAt] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const isTask = type === 'task';

  async function handleSubmit(e) {
    e.preventDefault();
    if (submitting) return;
    const trimmed = content.trim();
    if (!trimmed) {
      setError('Le contenu est requis');
      return;
    }
    if (!dealId && !contactId) {
      setError('Aucun deal ou contact lié');
      return;
    }
    setSubmitting(true);
    setError('');

    const body = { type, content: trimmed };
    if (dealId) body.deal_id = dealId;
    if (contactId) body.contact_id = contactId;
    if (isTask && dueAt) {
      // L'input type="date" renvoie YYYY-MM-DD. On stocke en ISO début de journée locale.
      try {
        const d = new Date(`${dueAt}T09:00:00`);
        if (!Number.isNaN(d.getTime())) body.due_at = d.toISOString();
      } catch {
        /* ignore */
      }
    }

    try {
      const res = await fetch('/api/crm/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Erreur création activité');
        setSubmitting(false);
        return;
      }
      // Reset form
      setContent('');
      setDueAt('');
      setType('note');
      onCreated?.(data.data);
    } catch (err) {
      console.error('[ActivityForm] error', err);
      setError('Erreur réseau');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`rounded-xl border border-line bg-surface-card/60 ${compact ? 'p-3' : 'p-4'}`}
    >
      {/* Types tabs */}
      <div className="flex flex-wrap items-center gap-1 mb-2.5">
        {TYPES.map(({ value, label, Icon }) => {
          const active = type === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => setType(value)}
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                active
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'text-content-tertiary hover:text-content-primary hover:bg-surface-elevated'
              }`}
            >
              <Icon size={11} />
              {label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <textarea
        rows={compact ? 2 : 3}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={
          type === 'task'
            ? 'Décrivez la tâche à effectuer…'
            : type === 'note'
            ? 'Ajouter une note…'
            : type === 'call'
            ? 'Résumé de l\'appel…'
            : type === 'email'
            ? 'Objet ou résumé de l\'email…'
            : 'Compte-rendu du meeting…'
        }
        className="w-full px-2.5 py-2 rounded-lg border border-line bg-surface-base text-sm text-content-primary placeholder:text-content-muted focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 resize-none transition-all"
      />

      {/* Due at (only task) */}
      {isTask && (
        <div className="mt-2">
          <label className="block text-[10px] font-semibold uppercase tracking-wider text-content-muted mb-1">
            Échéance
          </label>
          <input
            type="date"
            value={dueAt}
            onChange={(e) => setDueAt(e.target.value)}
            className="px-2 py-1.5 rounded-md border border-line bg-surface-base text-xs text-content-primary focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>
      )}

      {error && (
        <div className="mt-2 flex items-start gap-1.5 px-2 py-1.5 rounded-md bg-rose-50 border border-rose-200 text-rose-700">
          <AlertCircle size={11} className="flex-shrink-0 mt-0.5" />
          <p className="text-[11px] font-medium">{error}</p>
        </div>
      )}

      <div className="mt-2.5 flex items-center justify-end">
        <button
          type="submit"
          disabled={submitting || !content.trim()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-sm shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {submitting ? (
            <>
              <Loader2 size={12} className="animate-spin" />
              Ajout…
            </>
          ) : (
            <>
              <Send size={11} />
              Ajouter
            </>
          )}
        </button>
      </div>
    </form>
  );
}
