'use client';

import { useDroppable } from '@dnd-kit/core';
import { MousePointer2 } from 'lucide-react';

export default function EmptyCanvas() {
  const { setNodeRef, isOver } = useDroppable({
    id: 'canvas-empty',
    data: { source: 'canvas-empty' },
  });
  return (
    <div
      ref={setNodeRef}
      className={`rounded-2xl border-2 border-dashed p-12 text-center transition-all ${
        isOver
          ? 'border-pink-400 bg-pink-50/50'
          : 'border-line bg-surface-card/30'
      }`}
    >
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-pink-100 text-pink-600 mb-3">
        <MousePointer2 size={20} />
      </div>
      <p className="text-sm font-semibold text-content-primary">
        Cette page est vide. Glisse un champ ici.
      </p>
      <p className="mt-1 text-xs text-content-tertiary max-w-xs mx-auto">
        Ou clique sur un type à gauche, ça l&apos;ajoute direct.
      </p>
    </div>
  );
}
