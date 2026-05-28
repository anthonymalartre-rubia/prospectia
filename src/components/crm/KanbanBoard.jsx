'use client';

// ─────────────────────────────────────────────────────────────────────
// KanbanBoard — Kanban du pipeline CRM (drag-drop natif HTML5).
// ─────────────────────────────────────────────────────────────────────
// Props :
//   - pipeline : { id, name, stages: [...] } (stages triées par position)
//   - deals    : array de deals (avec stage embarqué)
//   - onDealMove(dealId, stageId, position) : appelé après un drop
//   - onDealClick(deal) : ouvre le drawer
//   - onNewDeal(stageId) : ouvre le modal pré-rempli sur ce stage
//
// Drag-drop : API native HTML5 (pas de dépendance).
//   - DealCard.draggable=true + dataTransfer.setData('dealId', id)
//   - Column.onDragOver preventDefault + visual highlight
//   - Column.onDrop : appelle onDealMove
//
// Layout : flex overflow-x-auto pour scroll horizontal sur petits écrans.
// Sur mobile (<sm), on stack vertical avec navigation par tabs (gérée
// dans la page parent via le filtre stage).
// ─────────────────────────────────────────────────────────────────────

import { useState } from 'react';
import { Plus, Inbox } from 'lucide-react';
import DealCard from './DealCard';
import { formatDealValue } from '@/lib/crm';
import { InfoTooltip } from '@/components/ui';

// ─── Palette stage → classes Tailwind (toutes déclarées en dur pour le purge)
const STAGE_COLORS = {
  zinc:    { dot: 'bg-zinc-400',    headerBg: 'bg-zinc-50',    border: 'border-zinc-200',    text: 'text-zinc-700' },
  blue:    { dot: 'bg-blue-500',    headerBg: 'bg-blue-50',    border: 'border-blue-200',    text: 'text-blue-700' },
  indigo:  { dot: 'bg-indigo-500',  headerBg: 'bg-indigo-50',  border: 'border-indigo-200',  text: 'text-indigo-700' },
  violet:  { dot: 'bg-violet-500',  headerBg: 'bg-violet-50',  border: 'border-violet-200',  text: 'text-violet-700' },
  emerald: { dot: 'bg-emerald-500', headerBg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700' },
  teal:    { dot: 'bg-teal-500',    headerBg: 'bg-teal-50',    border: 'border-teal-200',    text: 'text-teal-700' },
  amber:   { dot: 'bg-amber-500',   headerBg: 'bg-amber-50',   border: 'border-amber-200',   text: 'text-amber-700' },
  rose:    { dot: 'bg-rose-500',    headerBg: 'bg-rose-50',    border: 'border-rose-200',    text: 'text-rose-700' },
};

function getStageColors(color) {
  return STAGE_COLORS[color] || STAGE_COLORS.zinc;
}

// ─── KanbanColumn (interne) ────────────────────────────────────────
function KanbanColumn({
  stage,
  deals,
  onDealMove,
  onDealClick,
  onNewDeal,
  draggingDealId,
  setDraggingDealId,
  onMoveStage,
  canMovePrev = true,
  canMoveNext = true,
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const colors = getStageColors(stage.color);
  const isClosingWon = stage.closing_type === 'won';
  const isClosingLost = stage.closing_type === 'lost';
  const isClosing = isClosingWon || isClosingLost;

  const totalValue = deals.reduce((sum, d) => sum + (d.value_cents || 0), 0);

  function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!isDragOver) setIsDragOver(true);
  }
  function handleDragLeave(e) {
    // Vérifier qu'on quitte vraiment la colonne et pas un enfant
    if (e.currentTarget.contains(e.relatedTarget)) return;
    setIsDragOver(false);
  }
  function handleDrop(e) {
    e.preventDefault();
    setIsDragOver(false);
    const dealId = e.dataTransfer.getData('dealId');
    const sourceStageId = e.dataTransfer.getData('sourceStageId');
    setDraggingDealId(null);
    if (!dealId) return;
    // Pas d'op si on drop dans la même colonne (Phase 2 : pas de reorder
    // intra-colonne, juste move entre stages).
    if (sourceStageId === stage.id) return;
    onDealMove(dealId, stage.id, deals.length);
  }

  // Border treatment selon closing
  const columnBorder = isDragOver
    ? 'border-2 border-emerald-400 bg-emerald-50/30'
    : isClosingWon
    ? 'border-2 border-emerald-200/70'
    : isClosingLost
    ? 'border-2 border-rose-200/70'
    : 'border border-line';

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        flex-shrink-0 w-[280px] sm:w-[300px]
        flex flex-col rounded-xl
        bg-surface-elevated/40
        ${columnBorder}
        transition-colors
      `}
      aria-label={`Colonne ${stage.name}, ${deals.length} deals`}
    >
      {/* ─── Header compact (1 ligne : nom + total + %) ─────────
          Refonte 28 mai 2026 (feedback founder) : avant on avait 2
          lignes (nom au-dessus, total en dessous). À cause du sticky
          header de page CRM qui recouvrait le haut du board, l'user ne
          voyait que la ligne 2 (total) sans savoir quel stage c'était.
          Compaction sur 1 ligne → moins haut, moins de chance d'être
          recouvert, et même tronqué l'user voit nom + total.

          [Revert 28 mai 2026 — tentative sticky abandonnée]
          On avait essayé `sticky top-[140px]` pour que le header reste
          visible au scroll vertical profond. Mais le sticky se positionnait
          EN BAS de la column (au lieu de top viewport) parce que la column
          flex est plus courte que le delta de scroll requis → sticky reste
          collé à la fin du parent. Re-tentative future = autre approche
          (ex : KanbanBoard avec h-[calc(100vh-N)] + scroll interne). */}
      <div className={`px-3 py-2.5 rounded-t-xl ${colors.headerBg} border-b-2 ${colors.border}`}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className={`w-2.5 h-2.5 rounded-full ${colors.dot} flex-shrink-0 shadow-sm`}
              aria-hidden="true"
            />
            <h3 className={`text-sm font-bold truncate ${colors.text}`}>
              {stage.name || 'Stage'}
            </h3>
            <span className={`text-[10px] font-bold tabular-nums flex-shrink-0 px-1.5 py-0.5 rounded-full bg-white/70 ${colors.text}`}>
              {deals.length}
            </span>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className={`text-xs font-bold tabular-nums whitespace-nowrap ${colors.text} opacity-90`}>
              {formatDealValue(totalValue)}
            </span>
            {!isClosing && (
              <span className={`text-[10px] font-bold tabular-nums whitespace-nowrap px-1.5 py-0.5 rounded-md bg-white/70 ${colors.text} inline-flex items-center gap-1`}>
                {stage.probability}%
                <InfoTooltip
                  content={`Probabilité de closing à ce stade (${stage.probability}%). Utilisée pour calculer le pipeline pondéré : somme des deals × probabilité de leur stage.`}
                  iconSize={10}
                />
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ─── Body : list of cards ──────────────────────────── */}
      <div className="flex-1 p-2 space-y-2 min-h-[120px] overflow-y-auto max-h-[calc(100vh-280px)]">
        {deals.length === 0 ? (
          <button
            type="button"
            onClick={() => onNewDeal(stage.id)}
            className="w-full py-8 px-3 rounded-lg border-2 border-dashed border-line hover:border-emerald-300 hover:bg-emerald-50/40 transition-colors flex flex-col items-center justify-center gap-1.5 text-content-tertiary hover:text-emerald-700 group"
          >
            <Inbox size={18} className="opacity-60 group-hover:opacity-100" />
            <span className="text-[11px] font-medium">Vide.</span>
            <span className="text-[10px] text-content-muted group-hover:text-emerald-600">
              + Créer un deal
            </span>
          </button>
        ) : (
          deals.map((deal) => (
            <DealCard
              key={deal.id}
              deal={deal}
              onClick={() => onDealClick(deal)}
              isDragging={draggingDealId === deal.id}
              onDragStart={(e) => {
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('dealId', deal.id);
                e.dataTransfer.setData('sourceStageId', deal.stage_id);
                setDraggingDealId(deal.id);
              }}
              onDragEnd={() => setDraggingDealId(null)}
              onMoveStage={onMoveStage}
              canMovePrev={canMovePrev}
              canMoveNext={canMoveNext}
            />
          ))
        )}
      </div>

      {/* ─── Footer : "+ New" (sauf closing stages quand pleines) ── */}
      {!isClosing && deals.length > 0 && (
        <div className="p-2 border-t border-line">
          <button
            type="button"
            onClick={() => onNewDeal(stage.id)}
            className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-content-tertiary hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
          >
            <Plus size={12} />
            Nouveau deal
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main KanbanBoard ───────────────────────────────────────────────
export default function KanbanBoard({
  pipeline,
  deals = [],
  onDealMove,
  onDealClick,
  onNewDeal,
  onMoveStage, // P1-3 : fallback mobile drag-drop
}) {
  const [draggingDealId, setDraggingDealId] = useState(null);

  if (!pipeline || !Array.isArray(pipeline.stages)) {
    return (
      <div className="text-center py-12 text-content-tertiary text-sm">
        Pipeline introuvable.
      </div>
    );
  }

  // Group deals by stage_id
  const dealsByStage = {};
  for (const stage of pipeline.stages) {
    dealsByStage[stage.id] = [];
  }
  for (const d of deals) {
    if (dealsByStage[d.stage_id]) {
      dealsByStage[d.stage_id].push(d);
    }
  }
  // Sort by position then created_at desc inside each column
  for (const sid of Object.keys(dealsByStage)) {
    dealsByStage[sid].sort((a, b) => {
      const posA = a.position ?? 0;
      const posB = b.position ?? 0;
      if (posA !== posB) return posA - posB;
      return new Date(b.created_at) - new Date(a.created_at);
    });
  }

  const stageCount = pipeline.stages.length;

  return (
    <div className="w-full overflow-x-auto pb-4">
      <div className="flex gap-3 min-w-min px-1">
        {pipeline.stages.map((stage, idx) => (
          <KanbanColumn
            key={stage.id}
            stage={stage}
            deals={dealsByStage[stage.id] || []}
            onDealMove={onDealMove}
            onDealClick={onDealClick}
            onNewDeal={onNewDeal}
            draggingDealId={draggingDealId}
            setDraggingDealId={setDraggingDealId}
            onMoveStage={onMoveStage}
            canMovePrev={idx > 0}
            canMoveNext={idx < stageCount - 1}
          />
        ))}
      </div>
    </div>
  );
}
