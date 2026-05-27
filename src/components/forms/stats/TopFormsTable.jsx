'use client';

// ─────────────────────────────────────────────────────────────────────
// TopFormsTable — tableau top forms (Sprint F7)
// ─────────────────────────────────────────────────────────────────────
// Tableau triable client-side : Submissions vs Taux de conversion.
// Light, compact, lien direct vers la page analytics du form.
// ─────────────────────────────────────────────────────────────────────

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ArrowDownUp, ChevronRight, Send, TrendingUp, Eye } from 'lucide-react';

function formatPercent(n) {
  if (n == null) return '0 %';
  return `${Number(n).toFixed(1)} %`;
}

export default function TopFormsTable({ topBySubmissions, topByConversion }) {
  const [sortKey, setSortKey] = useState('submissions'); // 'submissions' | 'conversion_rate'

  const rows = useMemo(() => {
    if (sortKey === 'conversion_rate') return topByConversion || [];
    return topBySubmissions || [];
  }, [sortKey, topBySubmissions, topByConversion]);

  return (
    <div className="rounded-2xl border border-line bg-surface-card overflow-hidden">
      <div className="px-4 py-3 border-b border-line flex items-center justify-between gap-3 flex-wrap">
        <h3 className="text-sm font-semibold text-content-primary">Top 5 formulaires</h3>
        <div className="inline-flex rounded-lg border border-line bg-surface-base p-0.5">
          <SortButton
            active={sortKey === 'submissions'}
            onClick={() => setSortKey('submissions')}
            icon={Send}
            label="Soumissions"
          />
          <SortButton
            active={sortKey === 'conversion_rate'}
            onClick={() => setSortKey('conversion_rate')}
            icon={TrendingUp}
            label="Conversion"
          />
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="p-6 text-center">
          <ArrowDownUp size={18} className="mx-auto text-content-faint mb-2" />
          <p className="text-xs text-content-tertiary">
            {sortKey === 'conversion_rate'
              ? 'Pas assez de vues pour calculer le taux (min 20 vues par form).'
              : 'Aucune soumission. Partage tes forms.'}
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-line">
          {rows.map((f, i) => (
            <li key={f.id}>
              <Link
                href={`/admin/forms/${f.id}/analytics`}
                className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-surface-elevated transition-colors group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-6 h-6 rounded-full bg-pink-100 text-pink-700 text-[11px] font-bold flex items-center justify-center flex-shrink-0">
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-content-primary truncate group-hover:text-pink-700 transition-colors">
                      {f.name}
                    </p>
                    <div className="flex items-center gap-3 mt-0.5 text-[11px] text-content-tertiary">
                      <span className="inline-flex items-center gap-1">
                        <Eye size={10} /> {f.views}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Send size={10} /> {f.submissions}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <TrendingUp size={10} /> {formatPercent(f.conversion_rate)}
                      </span>
                    </div>
                  </div>
                </div>
                <ChevronRight size={14} className="text-content-faint group-hover:text-pink-700 transition-colors flex-shrink-0" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SortButton({ active, onClick, icon: Icon, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
        active
          ? 'bg-pink-600 text-white shadow-sm'
          : 'text-content-tertiary hover:text-content-primary'
      }`}
    >
      <Icon size={11} />
      {label}
    </button>
  );
}
