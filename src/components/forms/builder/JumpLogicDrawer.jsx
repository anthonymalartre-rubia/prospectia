'use client';

// ─────────────────────────────────────────────────────────────────────
// JumpLogicDrawer — Modal d'édition du jump_logic d'une page (F4)
// ─────────────────────────────────────────────────────────────────────
// Permet de définir des règles "Si <condition AND/OR> → sauter à <page>".
// Une page peut avoir plusieurs règles ; la 1ère qui match prend le dessus.
// target_page_id 'submit' = soumettre direct (skip toutes les pages restantes).
// ─────────────────────────────────────────────────────────────────────

import { useEffect } from 'react';
import { X, Plus, Trash2, ArrowRight, Zap, Send } from 'lucide-react';
import ConditionsBuilder from './ConditionsBuilder';
import { generateLocalId } from '@/lib/forms';

export default function JumpLogicDrawer({
  open,
  page,
  allPages,
  allFields,
  onClose,
  onChangeRules,
}) {
  useEffect(() => {
    if (!open) return;
    function handler(e) {
      if (e.key === 'Escape') onClose?.();
    }
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open || !page) return null;

  const rules = page.jump_logic?.rules || [];
  const sortedPages = [...(allPages || [])].sort((a, b) => (a.position || 0) - (b.position || 0));
  const currentIdx = sortedPages.findIndex((p) => p.id === page.id);
  // On ne propose que les pages SUIVANTES (impossible de jump en arrière, sinon boucle infinie)
  const targetablePages = sortedPages.slice(currentIdx + 1);

  function patchRule(idx, patch) {
    const next = rules.map((r, i) => (i === idx ? { ...r, ...patch } : r));
    onChangeRules(next);
  }

  function addRule() {
    const firstField = allFields[0];
    const newRule = {
      id: generateLocalId('rule'),
      condition: firstField
        ? {
            combinator: 'AND',
            conditions: [{ field_key: firstField.key, operator: 'equals', value: '' }],
          }
        : null,
      action: 'skip_to_page',
      target_page_id: targetablePages[0]?.id || 'submit',
    };
    onChangeRules([...rules, newRule]);
  }

  function removeRule(idx) {
    onChangeRules(rules.filter((_, i) => i !== idx));
  }

  return (
    <div className="fixed inset-0 z-50 flex" role="dialog" aria-modal="true" aria-labelledby="jump-logic-title">
      {/* Backdrop */}
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 bg-zinc-950/40 backdrop-blur-sm"
        aria-label="Fermer"
      />

      {/* Drawer */}
      <div className="ml-auto relative w-full max-w-md bg-surface-base shadow-2xl border-l border-line flex flex-col h-full">
        <header className="shrink-0 px-5 py-4 border-b border-line flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-content-muted font-semibold flex items-center gap-1">
              <Zap size={11} /> Logique de saut
            </p>
            <h2 id="jump-logic-title" className="mt-0.5 text-sm font-semibold text-content-primary">
              {page.title || 'Page'}
            </h2>
            <p className="mt-1 text-[11px] text-content-tertiary">
              Lorsque l&apos;utilisateur clique sur &quot;Suivant&quot;, ces règles sont évaluées.
              La 1ère règle qui correspond prend le dessus.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md text-content-faint hover:bg-surface-card hover:text-content-primary transition-colors"
            aria-label="Fermer"
          >
            <X size={14} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {targetablePages.length === 0 && (
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-700">
              Cette page est la dernière. Le jump n&apos;est pas applicable (sauf vers &quot;Soumettre&quot;).
            </div>
          )}

          {rules.length === 0 ? (
            <div className="p-6 text-center rounded-lg border border-dashed border-line">
              <p className="text-xs text-content-tertiary">
                Aucune règle. Ajoute-en une pour rediriger selon les réponses.
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {rules.map((rule, idx) => (
                <li
                  key={rule.id || idx}
                  className="rounded-xl border border-line bg-surface-card p-3 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-violet-700">
                      Règle {idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeRule(idx)}
                      className="p-1 text-content-faint hover:text-rose-600 transition-colors"
                      aria-label="Supprimer la règle"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>

                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-content-muted font-semibold mb-1">
                      Si
                    </p>
                    <ConditionsBuilder
                      value={rule.condition}
                      onChange={(next) => patchRule(idx, { condition: next })}
                      availableFields={allFields}
                    />
                  </div>

                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-content-muted font-semibold mb-1 flex items-center gap-1">
                      <ArrowRight size={10} /> Alors sauter à
                    </p>
                    <select
                      value={rule.target_page_id || ''}
                      onChange={(e) => patchRule(idx, { target_page_id: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-md bg-surface-base border border-line text-xs text-content-primary focus:outline-none focus:ring-2 focus:ring-pink-500/30 focus:border-pink-500"
                    >
                      {targetablePages.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.title || p.id}
                        </option>
                      ))}
                      <option value="submit">
                        ⚡ Soumettre directement
                      </option>
                    </select>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <button
            type="button"
            onClick={addRule}
            disabled={targetablePages.length === 0 && rules.length > 0}
            className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-dashed border-pink-300 text-xs text-pink-700 hover:bg-pink-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus size={12} /> Ajouter une règle de saut
          </button>
        </div>

        <footer className="shrink-0 px-5 py-3 border-t border-line flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-pink-600 hover:bg-pink-500 text-white text-xs font-semibold transition-colors"
          >
            <Send size={11} /> Terminé
          </button>
        </footer>
      </div>
    </div>
  );
}
