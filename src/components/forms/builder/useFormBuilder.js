'use client';

// ─────────────────────────────────────────────────────────────────────
// useFormBuilder — State management du builder Volia Formulaires (F3)
// ─────────────────────────────────────────────────────────────────────
// API publique :
//   - schema, selectedFieldId, dirty, lastSavedAt
//   - addField(type, position?)     → push à la fin de la page courante
//   - updateField(id, patch)        → merge patch
//   - deleteField(id)               → confirm côté UI
//   - moveField(fromIdx, toIdx)     → réordonne dans la page courante
//   - duplicateField(id)
//   - addPage(title?)               → push à la fin
//   - deletePage(pageId)            → bloque si dernière page
//   - movePage(fromIdx, toIdx)
//   - setSelectedFieldId(id)
//   - setCurrentPageId(id)
//   - undo() / redo()               → history stack (20 max)
//   - markSaved()                   → reset dirty
//
// Génération du field.key : auto à partir du label, avec dédup.
// ─────────────────────────────────────────────────────────────────────

import { useCallback, useMemo, useRef, useState } from 'react';
import { createEmptySchema, generateLocalId, normalizeSchema } from '@/lib/forms';

const HISTORY_LIMIT = 20;

function defaultLabelForType(type) {
  switch (type) {
    case 'text':     return 'Texte court';
    case 'textarea': return 'Texte long';
    case 'email':    return 'Adresse email';
    case 'tel':      return 'Téléphone';
    case 'number':   return 'Nombre';
    case 'select':   return 'Choisir une option';
    case 'radio':    return 'Choix unique';
    case 'checkbox': return 'Cases à cocher';
    case 'date':     return 'Date';
    case 'file':     return 'Fichier';
    case 'rating':   return 'Note';
    case 'hidden':   return 'Valeur cachée';
    default:         return 'Nouveau champ';
  }
}

function defaultsForType(type) {
  const base = {
    label: defaultLabelForType(type),
    placeholder: '',
    help_text: '',
    required: false,
    options: [],
    validation: {},
    conditional_logic: null,
  };
  if (['select', 'radio', 'checkbox'].includes(type)) {
    base.options = [
      { label: 'Option 1', value: 'option_1' },
      { label: 'Option 2', value: 'option_2' },
    ];
  }
  if (type === 'rating') {
    base.validation = { max: 5 };
  }
  if (type === 'textarea') {
    base.validation = { max_length: 1000 };
  }
  if (type === 'text') {
    base.validation = { max_length: 200 };
  }
  return base;
}

function slugifyKey(label) {
  return String(label || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_{2,}/g, '_')
    .slice(0, 60) || 'field';
}

function uniqueKey(baseKey, existingKeys) {
  if (!existingKeys.has(baseKey)) return baseKey;
  let i = 2;
  while (existingKeys.has(`${baseKey}_${i}`)) i++;
  return `${baseKey}_${i}`;
}

export default function useFormBuilder(initialSchema) {
  const [schema, setSchemaState] = useState(() => normalizeSchema(initialSchema));
  const [selectedFieldId, setSelectedFieldId] = useState(null);
  const [currentPageId, setCurrentPageId] = useState(() => normalizeSchema(initialSchema).pages[0]?.id || 'page-1');
  const [dirty, setDirty] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState(null);

  // History stack pour undo/redo
  const historyRef = useRef({ past: [], future: [] });

  const pushHistory = useCallback((prev) => {
    historyRef.current.past.push(JSON.stringify(prev));
    if (historyRef.current.past.length > HISTORY_LIMIT) {
      historyRef.current.past.shift();
    }
    historyRef.current.future = [];
  }, []);

  const updateSchema = useCallback(
    (updater, { trackHistory = true } = {}) => {
      setSchemaState((prev) => {
        if (trackHistory) pushHistory(prev);
        const next = typeof updater === 'function' ? updater(prev) : updater;
        return next;
      });
      setDirty(true);
    },
    [pushHistory]
  );

  const undo = useCallback(() => {
    setSchemaState((prev) => {
      const past = historyRef.current.past;
      if (past.length === 0) return prev;
      const previous = JSON.parse(past.pop());
      historyRef.current.future.push(JSON.stringify(prev));
      return previous;
    });
    setDirty(true);
  }, []);

  const redo = useCallback(() => {
    setSchemaState((prev) => {
      const future = historyRef.current.future;
      if (future.length === 0) return prev;
      const next = JSON.parse(future.pop());
      historyRef.current.past.push(JSON.stringify(prev));
      return next;
    });
    setDirty(true);
  }, []);

  const fieldsOnCurrentPage = useMemo(() => {
    return (schema.fields || [])
      .filter((f) => f.page_id === currentPageId)
      .sort((a, b) => (a.position || 0) - (b.position || 0));
  }, [schema.fields, currentPageId]);

  const allKeys = useMemo(() => new Set((schema.fields || []).map((f) => f.key)), [schema.fields]);

  // ─── Operations ───────────────────────────────────────────────────

  const addField = useCallback(
    (type, atPosition = null) => {
      const defaults = defaultsForType(type);
      const baseKey = slugifyKey(defaults.label);
      const key = uniqueKey(baseKey, allKeys);
      const newField = {
        id: generateLocalId('fld'),
        key,
        type,
        page_id: currentPageId,
        position: 0, // ré-attribuée plus bas
        ...defaults,
      };
      updateSchema((prev) => {
        const pageFields = (prev.fields || [])
          .filter((f) => f.page_id === currentPageId)
          .sort((a, b) => (a.position || 0) - (b.position || 0));
        const insertAt = atPosition == null ? pageFields.length : Math.max(0, Math.min(atPosition, pageFields.length));
        const newPageFields = [...pageFields];
        newPageFields.splice(insertAt, 0, newField);
        const reindexed = newPageFields.map((f, i) => ({ ...f, position: i }));
        const otherFields = (prev.fields || []).filter((f) => f.page_id !== currentPageId);
        return { ...prev, fields: [...otherFields, ...reindexed] };
      });
      setSelectedFieldId(newField.id);
      return newField.id;
    },
    [allKeys, currentPageId, updateSchema]
  );

  const updateField = useCallback(
    (id, patch) => {
      updateSchema((prev) => {
        const fields = (prev.fields || []).map((f) => {
          if (f.id !== id) return f;
          const next = { ...f, ...patch };
          // Si label change ET la key est celle auto-générée, on régénère
          if (patch.label && patch.label !== f.label && !patch.key) {
            const baseKey = slugifyKey(patch.label);
            const slugifiedOld = slugifyKey(f.label);
            // On ne touche à la key que si elle "matche" le slug de l'ancien label
            // (= elle n'a pas été éditée manuellement)
            if (f.key === slugifiedOld || f.key.startsWith(slugifiedOld + '_')) {
              const existingKeysWithoutMe = new Set((prev.fields || []).filter((x) => x.id !== id).map((x) => x.key));
              next.key = uniqueKey(baseKey, existingKeysWithoutMe);
            }
          }
          // Si key changée manuellement → slugify + dédup
          if (patch.key !== undefined) {
            const cleaned = slugifyKey(patch.key);
            const existingKeysWithoutMe = new Set((prev.fields || []).filter((x) => x.id !== id).map((x) => x.key));
            next.key = uniqueKey(cleaned, existingKeysWithoutMe);
          }
          return next;
        });
        return { ...prev, fields };
      });
    },
    [updateSchema]
  );

  const deleteField = useCallback(
    (id) => {
      updateSchema((prev) => {
        // Supprime + ré-indexe les positions sur la page
        const fld = (prev.fields || []).find((f) => f.id === id);
        if (!fld) return prev;
        const remaining = (prev.fields || []).filter((f) => f.id !== id);
        const samePage = remaining
          .filter((f) => f.page_id === fld.page_id)
          .sort((a, b) => (a.position || 0) - (b.position || 0))
          .map((f, i) => ({ ...f, position: i }));
        const otherPages = remaining.filter((f) => f.page_id !== fld.page_id);
        return { ...prev, fields: [...otherPages, ...samePage] };
      });
      setSelectedFieldId((sid) => (sid === id ? null : sid));
    },
    [updateSchema]
  );

  const duplicateField = useCallback(
    (id) => {
      const original = (schema.fields || []).find((f) => f.id === id);
      if (!original) return null;
      const cloned = {
        ...original,
        id: generateLocalId('fld'),
        key: uniqueKey(original.key, allKeys),
        label: `${original.label} (copie)`,
      };
      updateSchema((prev) => {
        const samePage = (prev.fields || [])
          .filter((f) => f.page_id === original.page_id)
          .sort((a, b) => (a.position || 0) - (b.position || 0));
        const idx = samePage.findIndex((f) => f.id === id);
        const inserted = [...samePage];
        inserted.splice(idx + 1, 0, cloned);
        const reindexed = inserted.map((f, i) => ({ ...f, position: i }));
        const other = (prev.fields || []).filter((f) => f.page_id !== original.page_id);
        return { ...prev, fields: [...other, ...reindexed] };
      });
      setSelectedFieldId(cloned.id);
      return cloned.id;
    },
    [allKeys, schema.fields, updateSchema]
  );

  const moveField = useCallback(
    (fromIdx, toIdx) => {
      if (fromIdx === toIdx) return;
      updateSchema((prev) => {
        const samePage = (prev.fields || [])
          .filter((f) => f.page_id === currentPageId)
          .sort((a, b) => (a.position || 0) - (b.position || 0));
        const newOrder = [...samePage];
        const [moved] = newOrder.splice(fromIdx, 1);
        if (!moved) return prev;
        newOrder.splice(toIdx, 0, moved);
        const reindexed = newOrder.map((f, i) => ({ ...f, position: i }));
        const otherPages = (prev.fields || []).filter((f) => f.page_id !== currentPageId);
        return { ...prev, fields: [...otherPages, ...reindexed] };
      });
    },
    [currentPageId, updateSchema]
  );

  const moveFieldToPage = useCallback(
    (fieldId, targetPageId) => {
      updateSchema((prev) => {
        const fld = (prev.fields || []).find((f) => f.id === fieldId);
        if (!fld) return prev;
        const others = (prev.fields || []).filter((f) => f.id !== fieldId);
        // Re-index source
        const sourceSame = others
          .filter((f) => f.page_id === fld.page_id)
          .sort((a, b) => (a.position || 0) - (b.position || 0))
          .map((f, i) => ({ ...f, position: i }));
        // Push à la fin du target
        const targetSame = others
          .filter((f) => f.page_id === targetPageId)
          .sort((a, b) => (a.position || 0) - (b.position || 0));
        const movedFld = { ...fld, page_id: targetPageId, position: targetSame.length };
        const restOfOthers = others.filter(
          (f) => f.page_id !== fld.page_id && f.page_id !== targetPageId
        );
        return {
          ...prev,
          fields: [...restOfOthers, ...sourceSame, ...targetSame, movedFld],
        };
      });
    },
    [updateSchema]
  );

  const addPage = useCallback(
    (title = null) => {
      const id = generateLocalId('page');
      updateSchema((prev) => {
        const pages = prev.pages || [];
        const idx = pages.length;
        const newPage = {
          id,
          title: title || `Page ${idx + 1}`,
          description: '',
          position: idx,
        };
        return { ...prev, pages: [...pages, newPage] };
      });
      setCurrentPageId(id);
      return id;
    },
    [updateSchema]
  );

  const updatePage = useCallback(
    (pageId, patch) => {
      updateSchema((prev) => {
        const pages = (prev.pages || []).map((p) => (p.id === pageId ? { ...p, ...patch } : p));
        return { ...prev, pages };
      });
    },
    [updateSchema]
  );

  const deletePage = useCallback(
    (pageId) => {
      if ((schema.pages || []).length <= 1) {
        return { ok: false, reason: 'last_page' };
      }
      updateSchema((prev) => {
        const remainingPages = (prev.pages || [])
          .filter((p) => p.id !== pageId)
          .map((p, i) => ({ ...p, position: i }));
        // Réassocie les fields orphelins à la 1ère page restante
        const fallbackId = remainingPages[0]?.id || 'page-1';
        const fields = (prev.fields || []).map((f) =>
          f.page_id === pageId ? { ...f, page_id: fallbackId } : f
        );
        return { ...prev, pages: remainingPages, fields };
      });
      setCurrentPageId((pid) => {
        if (pid !== pageId) return pid;
        return (schema.pages || []).filter((p) => p.id !== pageId)[0]?.id || 'page-1';
      });
      return { ok: true };
    },
    [schema.pages, updateSchema]
  );

  const movePage = useCallback(
    (fromIdx, toIdx) => {
      if (fromIdx === toIdx) return;
      updateSchema((prev) => {
        const pages = [...(prev.pages || [])].sort((a, b) => (a.position || 0) - (b.position || 0));
        const [moved] = pages.splice(fromIdx, 1);
        if (!moved) return prev;
        pages.splice(toIdx, 0, moved);
        const reindexed = pages.map((p, i) => ({ ...p, position: i }));
        return { ...prev, pages: reindexed };
      });
    },
    [updateSchema]
  );

  const updateSettings = useCallback(
    (patch) => {
      updateSchema((prev) => ({
        ...prev,
        settings: { ...(prev.settings || {}), ...patch },
      }));
    },
    [updateSchema]
  );

  const markSaved = useCallback(() => {
    setDirty(false);
    setLastSavedAt(new Date());
  }, []);

  const replaceSchema = useCallback((next) => {
    setSchemaState(normalizeSchema(next));
    historyRef.current = { past: [], future: [] };
    setDirty(false);
  }, []);

  return {
    schema,
    selectedFieldId,
    currentPageId,
    fieldsOnCurrentPage,
    dirty,
    lastSavedAt,
    canUndo: historyRef.current.past.length > 0,
    canRedo: historyRef.current.future.length > 0,
    setSelectedFieldId,
    setCurrentPageId,
    addField,
    updateField,
    deleteField,
    duplicateField,
    moveField,
    moveFieldToPage,
    addPage,
    updatePage,
    deletePage,
    movePage,
    updateSettings,
    markSaved,
    replaceSchema,
    undo,
    redo,
  };
}
