'use client';

// ─────────────────────────────────────────────────────────────────────
// BuilderLayout — Orchestration 3 colonnes + drag-drop + auto-save
// ─────────────────────────────────────────────────────────────────────
// • DndContext (@dnd-kit) qui couvre palette + canvas
// • Auto-save debounced (1s) → PUT /api/admin/forms/[id]
// • Keyboard shortcuts : Cmd+S, Cmd+Z, Cmd+Shift+Z, Delete, Escape
// • Topbar : nom inline-editable + status + Aperçu + Settings + Publier
// • Toast "Sauvegardé" en bas à droite (1s)
// ─────────────────────────────────────────────────────────────────────

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragOverlay,
  closestCenter,
} from '@dnd-kit/core';
import {
  arrayMove,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import {
  ArrowLeft,
  Settings,
  ExternalLink,
  CheckCircle2,
  Loader2,
  Eye,
  Send,
  AlertTriangle,
  Pencil,
  Check as CheckIcon,
} from 'lucide-react';
import useFormBuilder from './useFormBuilder';
import FieldsPanel from './FieldsPanel';
import Canvas from './Canvas';
import FieldPropertiesPanel from './FieldPropertiesPanel';

const AUTO_SAVE_DEBOUNCE = 1000; // 1s

export default function BuilderLayout({ formId, initialForm, onPublishedChange }) {
  const builder = useFormBuilder(initialForm?.schema);
  const [formName, setFormName] = useState(initialForm?.name || 'Sans titre');
  const [editingName, setEditingName] = useState(false);
  const [status, setStatus] = useState(initialForm?.status || 'draft');
  const [savingState, setSavingState] = useState('idle'); // idle | saving | saved | error
  const [saveError, setSaveError] = useState(null);
  const [publishLoading, setPublishLoading] = useState(false);
  const [publishError, setPublishError] = useState(null);
  const [windowTooSmall, setWindowTooSmall] = useState(false);
  const [activeDragId, setActiveDragId] = useState(null);
  const [activeDragType, setActiveDragType] = useState(null);

  const saveTimerRef = useRef(null);
  const lastSavedRef = useRef({ name: formName, schema: JSON.stringify(builder.schema) });

  // Responsive guard
  useEffect(() => {
    function check() {
      setWindowTooSmall(window.innerWidth < 1280);
    }
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // ─── Auto-save ────────────────────────────────────────────────────
  const scheduleSave = (immediate = false) => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    const run = async () => {
      setSavingState('saving');
      setSaveError(null);
      try {
        const payload = {
          name: formName,
          schema: builder.schema,
        };
        const res = await fetch(`/api/admin/forms/${formId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          setSavingState('error');
          setSaveError(json.error || json.details?.[0] || `Erreur ${res.status}`);
          return;
        }
        lastSavedRef.current = { name: formName, schema: JSON.stringify(builder.schema) };
        builder.markSaved();
        setSavingState('saved');
        // Hide toast after 1.5s
        setTimeout(() => setSavingState((s) => (s === 'saved' ? 'idle' : s)), 1500);
      } catch (e) {
        setSavingState('error');
        setSaveError(e.message);
      }
    };
    if (immediate) {
      run();
    } else {
      saveTimerRef.current = setTimeout(run, AUTO_SAVE_DEBOUNCE);
    }
  };

  // Trigger save quand schema ou name changent
  useEffect(() => {
    const currentSchemaStr = JSON.stringify(builder.schema);
    if (
      currentSchemaStr !== lastSavedRef.current.schema ||
      formName !== lastSavedRef.current.name
    ) {
      scheduleSave(false);
    }
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [builder.schema, formName]);

  // ─── Keyboard shortcuts ───────────────────────────────────────────
  useEffect(() => {
    function handler(e) {
      // Ignore si focus dans un input/textarea
      const target = e.target;
      const inEditable = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);

      // Cmd/Ctrl + S → force save
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        scheduleSave(true);
        return;
      }
      // Cmd/Ctrl + Z → undo
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key === 'z') {
        if (inEditable) return;
        e.preventDefault();
        builder.undo();
        return;
      }
      // Cmd/Ctrl + Shift + Z → redo
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === 'z' || e.key === 'Z')) {
        if (inEditable) return;
        e.preventDefault();
        builder.redo();
        return;
      }
      // Delete → delete selected field
      if ((e.key === 'Delete' || e.key === 'Backspace') && !inEditable) {
        if (builder.selectedFieldId) {
          const f = builder.schema.fields.find((x) => x.id === builder.selectedFieldId);
          if (f && confirm(`Supprimer "${f.label}" ?`)) {
            builder.deleteField(builder.selectedFieldId);
          }
        }
      }
      // Escape → deselect
      if (e.key === 'Escape') {
        builder.setSelectedFieldId(null);
      }
    }
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [builder.selectedFieldId, builder.schema.fields]);

  // ─── Publish handler ──────────────────────────────────────────────
  async function handlePublish() {
    setPublishLoading(true);
    setPublishError(null);
    try {
      // Force save d'abord
      if (builder.dirty || formName !== lastSavedRef.current.name) {
        scheduleSave(true);
        await new Promise((r) => setTimeout(r, 200));
      }
      const endpoint = status === 'published' ? `unpublish` : `publish`;
      const res = await fetch(`/api/admin/forms/${formId}/${endpoint}`, {
        method: 'POST',
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setPublishError(json.error || `Erreur ${res.status}`);
        setPublishLoading(false);
        return;
      }
      const newStatus = status === 'published' ? 'draft' : 'published';
      setStatus(newStatus);
      onPublishedChange?.(newStatus);
    } catch (e) {
      setPublishError(e.message);
    } finally {
      setPublishLoading(false);
    }
  }

  // ─── DnD handlers ─────────────────────────────────────────────────
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragStart(event) {
    setActiveDragId(event.active.id);
    setActiveDragType(event.active.data?.current?.type || event.active.data?.current?.source || null);
  }

  function handleDragEnd(event) {
    const { active, over } = event;
    setActiveDragId(null);
    setActiveDragType(null);

    if (!over) return;

    const activeSource = active.data?.current?.source;
    const overSource = over.data?.current?.source;
    const overFieldId = over.data?.current?.fieldId;

    // Cas 1 : palette → canvas (insertion d'un nouveau field)
    if (activeSource === 'palette') {
      const type = active.data.current.type;
      if (overSource === 'canvas-empty' || overSource === 'canvas-list') {
        builder.addField(type);
        return;
      }
      // Drop sur un field existant → insère AVANT ce field
      if (overSource === 'canvas-field' && overFieldId) {
        const idx = builder.fieldsOnCurrentPage.findIndex((f) => f.id === overFieldId);
        builder.addField(type, idx >= 0 ? idx : undefined);
        return;
      }
    }

    // Cas 2 : canvas-field → canvas-field (réordonnement)
    if (activeSource === 'canvas-field' && overSource === 'canvas-field') {
      const fromId = active.data.current.fieldId;
      const toId = over.data.current.fieldId;
      if (fromId === toId) return;
      const ids = builder.fieldsOnCurrentPage.map((f) => f.id);
      const fromIdx = ids.indexOf(fromId);
      const toIdx = ids.indexOf(toId);
      if (fromIdx >= 0 && toIdx >= 0) {
        builder.moveField(fromIdx, toIdx);
      }
    }
  }

  // ─── Sélection du field actif pour le right panel ─────────────────
  const selectedField = useMemo(
    () => (builder.schema.fields || []).find((f) => f.id === builder.selectedFieldId) || null,
    [builder.schema.fields, builder.selectedFieldId]
  );

  if (windowTooSmall) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-base p-8">
        <div className="max-w-md text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-amber-100 text-amber-600 mb-4">
            <AlertTriangle size={22} />
          </div>
          <h2 className="text-lg font-semibold text-content-primary">Écran trop petit</h2>
          <p className="mt-2 text-sm text-content-tertiary">
            Le builder de formulaires est optimisé pour les écrans de plus de 1280px.
            Utilise un écran plus grand ou bascule en mode aperçu pour tester ton formulaire sur mobile.
          </p>
          <Link
            href="/admin/forms"
            className="mt-5 inline-flex items-center gap-1.5 text-xs text-pink-700 hover:text-pink-800"
          >
            <ArrowLeft size={13} /> Retour à mes formulaires
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 top-14 flex flex-col bg-surface-base">
      {/* Topbar */}
      <header className="shrink-0 h-14 flex items-center gap-3 px-4 border-b border-line bg-surface-base/95 backdrop-blur z-20">
        <Link
          href="/admin/forms"
          className="inline-flex items-center gap-1 text-xs text-content-tertiary hover:text-pink-700 transition-colors"
        >
          <ArrowLeft size={14} /> Mes formulaires
        </Link>
        <div className="h-5 w-px bg-line" />

        {/* Nom inline-editable */}
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          {editingName ? (
            <input
              autoFocus
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              onBlur={() => setEditingName(false)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === 'Escape') {
                  e.currentTarget.blur();
                }
              }}
              className="text-sm font-semibold text-content-primary bg-transparent border-b border-pink-300 focus:outline-none focus:border-pink-500 min-w-0 flex-1 max-w-md"
            />
          ) : (
            <button
              type="button"
              onClick={() => setEditingName(true)}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-content-primary hover:text-pink-700 transition-colors"
            >
              {formName || 'Sans titre'}
              <Pencil size={11} className="text-content-faint" />
            </button>
          )}
          <span
            className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${
              status === 'published'
                ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                : 'bg-zinc-100 text-zinc-700 border-zinc-200'
            }`}
          >
            {status === 'published' ? 'Publié' : 'Brouillon'}
          </span>
        </div>

        {/* Save indicator */}
        <div className="hidden md:flex items-center gap-1.5 text-[11px] text-content-faint min-w-[100px]">
          {savingState === 'saving' && (
            <>
              <Loader2 size={11} className="animate-spin" />
              <span>Sauvegarde…</span>
            </>
          )}
          {savingState === 'idle' && builder.lastSavedAt && (
            <>
              <CheckIcon size={11} className="text-emerald-600" />
              <span>
                Sauvegardé à {builder.lastSavedAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </>
          )}
          {savingState === 'error' && (
            <span className="text-rose-600">Erreur : {saveError || 'inconnue'}</span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <Link
            href={`/admin/forms/${formId}/preview`}
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-card border border-line hover:bg-surface-elevated text-xs font-medium text-content-primary transition-colors"
          >
            <Eye size={12} /> Aperçu
          </Link>
          <Link
            href={`/admin/forms/${formId}/settings`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-card border border-line hover:bg-surface-elevated text-xs font-medium text-content-primary transition-colors"
          >
            <Settings size={12} /> Réglages
          </Link>
          <button
            type="button"
            onClick={handlePublish}
            disabled={publishLoading}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-sm disabled:opacity-60 ${
              status === 'published'
                ? 'bg-zinc-100 text-zinc-700 border border-zinc-200 hover:bg-zinc-200'
                : 'bg-pink-600 hover:bg-pink-500 text-white shadow-pink-500/20'
            }`}
          >
            {publishLoading ? (
              <Loader2 size={12} className="animate-spin" />
            ) : status === 'published' ? null : (
              <Send size={12} />
            )}
            {status === 'published' ? 'Dépublier' : 'Publier'}
          </button>
          {status === 'published' && (
            <Link
              href={`/f/${initialForm.slug}`}
              target="_blank"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-pink-100 text-pink-700 hover:bg-pink-200 text-[11px] font-medium transition-colors"
              title={`Voir /f/${initialForm.slug}`}
            >
              <ExternalLink size={11} /> /f/{initialForm.slug}
            </Link>
          )}
        </div>
      </header>

      {publishError && (
        <div className="px-4 py-2 bg-rose-50 border-b border-rose-200 text-xs text-rose-700">
          {publishError}
        </div>
      )}

      {/* 3 columns */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 flex min-h-0">
          <FieldsPanel onAddField={builder.addField} />
          <Canvas
            formName={formName}
            formDescription={initialForm?.description}
            pages={builder.schema.pages}
            currentPageId={builder.currentPageId}
            fields={builder.fieldsOnCurrentPage}
            selectedFieldId={builder.selectedFieldId}
            onSelectField={builder.setSelectedFieldId}
            onDeleteField={builder.deleteField}
            onDuplicateField={builder.duplicateField}
            onSelectPage={builder.setCurrentPageId}
            onAddPage={() => builder.addPage()}
            onUpdatePage={builder.updatePage}
            onDeletePage={builder.deletePage}
          />
          <FieldPropertiesPanel
            field={selectedField}
            allFields={builder.schema.fields}
            onUpdate={builder.updateField}
          />
        </div>

        <DragOverlay>
          {activeDragId ? (
            <div className="px-3 py-2 rounded-lg bg-white border-2 border-pink-400 shadow-lg text-xs font-medium text-pink-700">
              {activeDragType === 'palette' || activeDragType?.length < 20
                ? `+ Nouveau champ`
                : 'Déplacement...'}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Toast saved */}
      {savingState === 'saved' && (
        <div className="fixed bottom-4 right-4 z-50 inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-600 text-white text-xs font-medium shadow-lg animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 size={14} /> Sauvegardé
        </div>
      )}
    </div>
  );
}
