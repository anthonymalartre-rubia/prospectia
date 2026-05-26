'use client';

// ─────────────────────────────────────────────────────────────────────
// FieldsPanel — Left rail du builder, drag sources
// ─────────────────────────────────────────────────────────────────────
// Affiche les types de champs disponibles. Click → addField(type).
// Drag : on utilise useDraggable de @dnd-kit avec un id préfixé
// "palette:<type>" pour différencier des fields existants ("field:<id>").
// ─────────────────────────────────────────────────────────────────────

import { useDraggable } from '@dnd-kit/core';
import {
  Type,
  AlignLeft,
  AtSign,
  Phone,
  Hash,
  List,
  CircleDot,
  CheckSquare,
  Calendar,
  Upload,
  Star,
  EyeOff,
  Plus,
  GripVertical,
} from 'lucide-react';
import { FORM_FIELD_TYPES } from '@/lib/forms';

const TYPE_ICONS = {
  text: Type,
  textarea: AlignLeft,
  email: AtSign,
  tel: Phone,
  number: Hash,
  select: List,
  radio: CircleDot,
  checkbox: CheckSquare,
  date: Calendar,
  file: Upload,
  rating: Star,
  hidden: EyeOff,
};

function DraggableFieldCard({ type, label, onClick }) {
  const Icon = TYPE_ICONS[type] || Type;
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette:${type}`,
    data: { source: 'palette', type },
  });

  return (
    <button
      ref={setNodeRef}
      type="button"
      onClick={onClick}
      {...listeners}
      {...attributes}
      className={`group w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-line bg-surface-card hover:bg-surface-elevated hover:border-pink-200 transition-all text-left ${
        isDragging ? 'opacity-40' : ''
      }`}
      aria-label={`Ajouter un champ ${label}`}
    >
      <div className="p-1.5 rounded-lg bg-pink-50 text-pink-600 group-hover:bg-pink-100 transition-colors">
        <Icon size={14} />
      </div>
      <span className="flex-1 text-xs font-medium text-content-primary">{label}</span>
      <GripVertical size={12} className="text-content-faint opacity-0 group-hover:opacity-100 transition-opacity" />
      <Plus size={12} className="text-content-faint" aria-hidden="true" />
    </button>
  );
}

export default function FieldsPanel({ onAddField }) {
  return (
    <aside className="w-60 shrink-0 border-r border-line bg-surface-base/50 h-full overflow-y-auto p-4">
      <div className="mb-3">
        <p className="text-[10px] uppercase tracking-wider font-semibold text-content-muted">
          Champs
        </p>
        <p className="mt-0.5 text-[11px] text-content-faint">
          Glisse ou clique pour ajouter
        </p>
      </div>
      <div className="space-y-1.5">
        {FORM_FIELD_TYPES.map((ft) => (
          <DraggableFieldCard
            key={ft.type}
            type={ft.type}
            label={ft.label}
            onClick={() => onAddField(ft.type)}
          />
        ))}
      </div>
    </aside>
  );
}
