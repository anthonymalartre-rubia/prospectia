'use client';

// ─────────────────────────────────────────────────────────────────────
// PageTabs — Onglets pour naviguer entre les pages multi-step
// ─────────────────────────────────────────────────────────────────────

import { Plus, X, FileText, Pencil, Check } from 'lucide-react';
import { useState } from 'react';

function PageTab({ page, isActive, onSelect, onRename, onDelete, canDelete }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(page.title || '');

  function commit() {
    const t = title.trim();
    if (t && t !== page.title) {
      onRename(page.id, { title: t });
    }
    setEditing(false);
  }

  return (
    <div
      role="tab"
      aria-selected={isActive}
      className={`group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
        isActive
          ? 'bg-pink-100 text-pink-700 border-pink-200'
          : 'bg-surface-card text-content-tertiary border-line hover:border-pink-200 hover:text-pink-700'
      }`}
    >
      <button
        type="button"
        onClick={() => onSelect(page.id)}
        className="inline-flex items-center gap-1.5"
      >
        <FileText size={11} />
        {editing ? (
          <input
            autoFocus
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commit();
              if (e.key === 'Escape') {
                setTitle(page.title || '');
                setEditing(false);
              }
            }}
            className="bg-white border border-pink-300 rounded px-1.5 py-0.5 text-xs w-28 focus:outline-none focus:ring-2 focus:ring-pink-500/40"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span>{page.title || 'Page'}</span>
        )}
      </button>
      {!editing && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setEditing(true);
          }}
          className="opacity-0 group-hover:opacity-100 text-content-faint hover:text-pink-600 transition-opacity"
          aria-label="Renommer la page"
        >
          <Pencil size={10} />
        </button>
      )}
      {editing && (
        <button type="button" onClick={commit} className="text-pink-600">
          <Check size={11} />
        </button>
      )}
      {canDelete && !editing && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (confirm(`Supprimer "${page.title}" ? Les champs seront déplacés vers la 1ère page.`)) {
              onDelete(page.id);
            }
          }}
          className="opacity-0 group-hover:opacity-100 text-content-faint hover:text-rose-600 transition-opacity"
          aria-label="Supprimer la page"
        >
          <X size={11} />
        </button>
      )}
    </div>
  );
}

export default function PageTabs({ pages, currentPageId, onSelect, onAdd, onRename, onDelete }) {
  const sorted = [...(pages || [])].sort((a, b) => (a.position || 0) - (b.position || 0));
  const canDelete = sorted.length > 1;

  return (
    <div className="flex items-center gap-2 flex-wrap" role="tablist" aria-label="Pages du formulaire">
      {sorted.map((page) => (
        <PageTab
          key={page.id}
          page={page}
          isActive={page.id === currentPageId}
          onSelect={onSelect}
          onRename={onRename}
          onDelete={onDelete}
          canDelete={canDelete}
        />
      ))}
      <button
        type="button"
        onClick={onAdd}
        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-dashed border-line text-content-tertiary hover:border-pink-300 hover:text-pink-700 transition-all"
        aria-label="Ajouter une page"
      >
        <Plus size={11} /> Page
      </button>
    </div>
  );
}
