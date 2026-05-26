'use client';

// ─────────────────────────────────────────────────────────────────────
// FieldRenderer (builder) — preview désactivé d'un field dans le canvas
// ─────────────────────────────────────────────────────────────────────
// Affiche un visuel proche du rendu réel (FormRenderer public) mais
// non-interactif : inputs disabled, pas de submit, juste visuel.
// ─────────────────────────────────────────────────────────────────────

import { Star, Upload, EyeOff } from 'lucide-react';

export default function FieldRenderer({ field }) {
  const inputCls =
    'w-full px-3 py-2.5 rounded-lg bg-white border border-zinc-200 text-zinc-700 text-sm cursor-default';

  if (field.type === 'hidden') {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-50 border border-dashed border-zinc-200 text-xs text-zinc-500">
        <EyeOff size={12} /> Champ caché — key : <code className="text-pink-600">{field.key}</code>
      </div>
    );
  }

  if (field.type === 'textarea') {
    return (
      <textarea
        rows={3}
        placeholder={field.placeholder || ''}
        disabled
        className={inputCls}
        tabIndex={-1}
      />
    );
  }

  if (field.type === 'select') {
    return (
      <select disabled className={inputCls} tabIndex={-1}>
        <option>— Choisir —</option>
        {(field.options || []).map((opt, i) => (
          <option key={i}>{typeof opt === 'object' ? opt.label : opt}</option>
        ))}
      </select>
    );
  }

  if (field.type === 'radio') {
    const opts = field.options || [];
    return (
      <div className="space-y-1.5">
        {opts.map((opt, i) => {
          const label = typeof opt === 'object' ? opt.label : opt;
          return (
            <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-zinc-200 bg-white">
              <span className="w-3.5 h-3.5 rounded-full border-2 border-zinc-300" />
              <span className="text-sm text-zinc-700">{label}</span>
            </div>
          );
        })}
      </div>
    );
  }

  if (field.type === 'checkbox') {
    const opts = field.options || [];
    if (opts.length === 0) {
      return (
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded border-2 border-zinc-300" />
          <span className="text-sm text-zinc-700">{field.label}</span>
        </div>
      );
    }
    return (
      <div className="space-y-1.5">
        {opts.map((opt, i) => {
          const label = typeof opt === 'object' ? opt.label : opt;
          return (
            <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-zinc-200 bg-white">
              <span className="w-3.5 h-3.5 rounded border-2 border-zinc-300" />
              <span className="text-sm text-zinc-700">{label}</span>
            </div>
          );
        })}
      </div>
    );
  }

  if (field.type === 'file') {
    return (
      <div className="flex items-center gap-2 px-3 py-3 rounded-lg border-2 border-dashed border-zinc-200 bg-zinc-50">
        <Upload size={14} className="text-zinc-400" />
        <span className="text-xs text-zinc-500">Choisir un fichier</span>
      </div>
    );
  }

  if (field.type === 'rating') {
    const max = field.validation?.max || 5;
    return (
      <div className="flex gap-1">
        {Array.from({ length: max }, (_, i) => (
          <Star key={i} size={20} className="text-zinc-300" />
        ))}
      </div>
    );
  }

  if (field.type === 'date') {
    return <input type="date" disabled className={inputCls} tabIndex={-1} />;
  }

  const inputType =
    field.type === 'email' ? 'email' :
    field.type === 'tel' ? 'tel' :
    field.type === 'number' ? 'number' :
    'text';

  return (
    <input
      type={inputType}
      placeholder={field.placeholder || ''}
      disabled
      className={inputCls}
      tabIndex={-1}
    />
  );
}
