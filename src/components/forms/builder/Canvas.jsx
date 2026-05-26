'use client';

// ─────────────────────────────────────────────────────────────────────
// Canvas — Center du builder, render des fields + drop targets
// ─────────────────────────────────────────────────────────────────────
// Sortable list pour réordonner. Drop zone visible pour insérer.
// ─────────────────────────────────────────────────────────────────────

import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2, Copy } from 'lucide-react';
import FieldRenderer from './FieldRenderer';
import EmptyCanvas from './EmptyCanvas';
import PageTabs from './PageTabs';

function SortableFieldCard({
  field,
  isSelected,
  onSelect,
  onDelete,
  onDuplicate,
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `field:${field.id}`,
    data: { source: 'canvas-field', fieldId: field.id },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={() => onSelect(field.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(field.id);
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`Champ ${field.label}`}
      className={`group relative rounded-xl border bg-white p-4 transition-all cursor-pointer ${
        isSelected
          ? 'border-pink-500 shadow-lg shadow-pink-500/15 ring-2 ring-pink-500/20'
          : 'border-zinc-200 hover:border-pink-200 hover:shadow-sm'
      }`}
    >
      {/* Toolbar (drag handle + actions) */}
      <div className="absolute -left-9 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          type="button"
          {...listeners}
          {...attributes}
          className="p-1.5 rounded-md text-content-faint hover:bg-zinc-100 cursor-grab active:cursor-grabbing"
          aria-label="Glisser pour réordonner"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical size={14} />
        </button>
      </div>

      <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDuplicate(field.id);
          }}
          className="p-1.5 rounded-md text-content-tertiary hover:bg-zinc-100 hover:text-content-primary transition-colors"
          aria-label="Dupliquer"
          title="Dupliquer"
        >
          <Copy size={13} />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (confirm(`Supprimer le champ "${field.label}" ?`)) {
              onDelete(field.id);
            }
          }}
          className="p-1.5 rounded-md text-content-tertiary hover:bg-rose-50 hover:text-rose-600 transition-colors"
          aria-label="Supprimer"
          title="Supprimer"
        >
          <Trash2 size={13} />
        </button>
      </div>

      {/* Field label */}
      <label className="block text-sm font-medium text-zinc-800 mb-1.5">
        {field.label || 'Sans titre'}
        {field.required && <span className="text-rose-500 ml-0.5">*</span>}
        <span className="ml-2 text-[10px] uppercase tracking-wider text-content-faint font-normal">
          {field.type}
        </span>
      </label>

      {/* Preview */}
      <FieldRenderer field={field} />

      {field.help_text && (
        <p className="mt-1.5 text-xs text-zinc-500">{field.help_text}</p>
      )}

      {field.conditional_logic?.show_if?.field_key && (
        <p className="mt-2 text-[10px] uppercase tracking-wider text-violet-600 font-semibold flex items-center gap-1">
          ⚡ Conditionnel · si {field.conditional_logic.show_if.field_key}
        </p>
      )}
    </div>
  );
}

function CanvasDropZone({ fields, selectedFieldId, onSelect, onDelete, onDuplicate }) {
  const { setNodeRef, isOver } = useDroppable({
    id: 'canvas-list',
    data: { source: 'canvas-list' },
  });

  return (
    <div
      ref={setNodeRef}
      className={`space-y-3 pl-10 transition-colors ${
        isOver ? 'bg-pink-50/30 rounded-2xl py-2' : ''
      }`}
    >
      <SortableContext
        items={fields.map((f) => `field:${f.id}`)}
        strategy={verticalListSortingStrategy}
      >
        {fields.map((field) => (
          <SortableFieldCard
            key={field.id}
            field={field}
            isSelected={selectedFieldId === field.id}
            onSelect={onSelect}
            onDelete={onDelete}
            onDuplicate={onDuplicate}
          />
        ))}
      </SortableContext>
    </div>
  );
}

export default function Canvas({
  formName,
  formDescription,
  pages,
  currentPageId,
  fields,
  selectedFieldId,
  onSelectField,
  onDeleteField,
  onDuplicateField,
  onSelectPage,
  onAddPage,
  onUpdatePage,
  onDeletePage,
}) {
  const currentPage = (pages || []).find((p) => p.id === currentPageId);

  return (
    <main className="flex-1 min-w-0 overflow-y-auto bg-zinc-50/40">
      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* Page tabs */}
        <div className="mb-6">
          <PageTabs
            pages={pages}
            currentPageId={currentPageId}
            onSelect={onSelectPage}
            onAdd={onAddPage}
            onRename={onUpdatePage}
            onDelete={onDeletePage}
          />
        </div>

        {/* Header form */}
        <div className="mb-8 pl-10">
          <h1 className="text-2xl font-bold text-zinc-900">{formName || 'Sans titre'}</h1>
          {formDescription && (
            <p className="mt-1 text-sm text-zinc-500">{formDescription}</p>
          )}
          {currentPage?.title && pages.length > 1 && (
            <p className="mt-3 text-xs uppercase tracking-wider text-pink-700 font-semibold">
              {currentPage.title}
            </p>
          )}
        </div>

        {/* Fields */}
        {fields.length === 0 ? (
          <div className="pl-10">
            <EmptyCanvas />
          </div>
        ) : (
          <CanvasDropZone
            fields={fields}
            selectedFieldId={selectedFieldId}
            onSelect={onSelectField}
            onDelete={onDeleteField}
            onDuplicate={onDuplicateField}
          />
        )}
      </div>
    </main>
  );
}
