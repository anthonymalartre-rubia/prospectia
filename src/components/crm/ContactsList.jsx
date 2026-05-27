'use client';

// ─────────────────────────────────────────────────────────────────────
// ContactsList — table de contacts réutilisable (Phase 3).
// ─────────────────────────────────────────────────────────────────────
// Props :
//   - contacts : array
//   - onEdit?(contact) : action ligne (icône Pencil)
//   - onDelete?(contact) : action ligne (icône Trash2 — sera confirmée par le parent)
//   - onClick?(contact) : clic sur la ligne (ouvre détail)
//   - loading : bool
//   - emptyState : ReactNode (affiché si contacts.length === 0 && !loading)
//   - selectable?: bool — affiche les checkboxes multi-select
//   - selectedIds?: Set<string> — IDs sélectionnés (controlled)
//   - onToggleSelect?(id) : toggle d'une ligne
//   - onToggleSelectAll?(checked, visibleIds) : toggle global header
//
// Design : light mode, accent emerald/teal (cohérent CRM Phase 2),
// avatars en gradient violet (initiales 2 lettres).
// ─────────────────────────────────────────────────────────────────────

import { Mail, Phone, Pencil, Trash2, Building2, ArrowDown, ArrowUp } from 'lucide-react';

// Palette de gradients violets/cyan/indigo pour les avatars contacts.
// Choisi de manière déterministe selon le nom (hash basique) pour qu'un
// même contact ait toujours la même couleur entre 2 reloads.
const AVATAR_GRADIENTS = [
  'from-violet-500 to-indigo-600',
  'from-purple-500 to-violet-600',
  'from-fuchsia-500 to-purple-600',
  'from-indigo-500 to-blue-600',
  'from-sky-500 to-indigo-600',
  'from-cyan-500 to-teal-600',
  'from-emerald-500 to-teal-600',
  'from-rose-500 to-pink-600',
];

function avatarGradient(seed = '') {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const idx = Math.abs(hash) % AVATAR_GRADIENTS.length;
  return AVATAR_GRADIENTS[idx];
}

function initials(name = '') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '??';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const SOURCE_BADGES = {
  manual: {
    label: 'manuel',
    className: 'bg-violet-50 text-violet-700 border-violet-200',
    tip: 'Contact créé manuellement',
  },
  prospection: {
    label: 'prospection',
    className: 'bg-violet-50 text-violet-700 border-violet-200',
    tip: 'Importé depuis la Prospection',
  },
  campagnes: {
    label: 'campagnes',
    className: 'bg-blue-50 text-blue-700 border-blue-200',
    tip: 'Provenance Campagnes',
  },
  import: {
    label: 'import',
    className: 'bg-zinc-100 text-zinc-700 border-zinc-200',
    tip: 'Import CSV / bulk',
  },
};

function SourceBadge({ source }) {
  const cfg = SOURCE_BADGES[source] || SOURCE_BADGES.manual;
  return (
    <span
      title={cfg.tip}
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${cfg.className} whitespace-nowrap`}
    >
      {cfg.label}
    </span>
  );
}

function formatDate(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
}

// ─── Engagement helpers ──────────────────────────────────────────────
// Heatmap de couleurs basée sur le score d'engagement cumulé (Phase 2).
// 0-9 : gris discret · 10-29 : bleu · 30-59 : violet · 60+ : orange/feu.
function engagementTone(score) {
  const s = Number(score) || 0;
  if (s >= 60) return {
    className: 'bg-orange-100 text-orange-700 border-orange-200',
    hot: true,
  };
  if (s >= 30) return {
    className: 'bg-violet-100 text-violet-700 border-violet-200',
    hot: false,
  };
  if (s >= 10) return {
    className: 'bg-blue-100 text-blue-700 border-blue-200',
    hot: false,
  };
  return {
    className: 'bg-zinc-100 text-zinc-600 border-zinc-200',
    hot: false,
  };
}

// Format simple "il y a Xj / Xh / Xmin" — sans dep externe.
function formatRelativeShort(iso) {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  const diffMs = Date.now() - date.getTime();
  if (diffMs < 60_000) return "à l'instant";
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 60) return `il y a ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `il y a ${days} j`;
  const months = Math.floor(days / 30);
  if (months < 12) return `il y a ${months} mois`;
  return `il y a ${Math.floor(months / 12)} an${months >= 24 ? 's' : ''}`;
}

function EngagementBadge({ score, lastAt }) {
  const s = Number(score) || 0;
  const tone = engagementTone(s);
  const rel = formatRelativeShort(lastAt);
  const tooltip = rel
    ? `Score d'engagement : ${s} · Dernier event : ${rel}`
    : `Score d'engagement : ${s} · Aucun engagement enregistré`;
  return (
    <span
      title={tooltip}
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[11px] font-bold tabular-nums border ${tone.className}`}
    >
      {tone.hot && <span aria-hidden="true">🔥</span>}
      {s}
    </span>
  );
}

export default function ContactsList({
  contacts = [],
  onEdit,
  onDelete,
  onClick,
  loading = false,
  emptyState = null,
  selectable = false,
  selectedIds = null,
  onToggleSelect,
  onToggleSelectAll,
  // Phase 2 — Tri colonne Engagement (controlled). Si absent, header inerte.
  sortKey = null,
  sortDir = 'desc',
  onSortChange = null,
  // Custom fields columns (optionnel). Array de field defs (id, field_key, field_label, field_type, field_options).
  customColumns = [],
}) {
  function handleSortClick(key) {
    if (!onSortChange) return;
    if (sortKey === key) {
      onSortChange(key, sortDir === 'desc' ? 'asc' : 'desc');
    } else {
      onSortChange(key, 'desc');
    }
  }
  const isSelectable = selectable && !!selectedIds && typeof onToggleSelect === 'function';
  const visibleIds = contacts.map((c) => c.id);
  const visibleSelectedCount = isSelectable
    ? visibleIds.filter((id) => selectedIds.has(id)).length
    : 0;
  const allVisibleSelected = isSelectable && visibleIds.length > 0 && visibleSelectedCount === visibleIds.length;
  const someVisibleSelected = isSelectable && visibleSelectedCount > 0 && !allVisibleSelected;
  if (loading && contacts.length === 0) {
    // ─── Skeleton table (Phase 4 polish) ───────────────────
    return (
      <div className="rounded-2xl border border-line bg-surface-base overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-card border-b border-line">
              <tr>
                <th className="w-12 px-4 py-3" />
                <th className="px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-content-muted">Nom</th>
                <th className="px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-content-muted">Email</th>
                <th className="px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-content-muted hidden md:table-cell">Téléphone</th>
                <th className="px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-content-muted hidden lg:table-cell">Entreprise</th>
                <th className="px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-content-muted hidden sm:table-cell">Engagement</th>
                <th className="px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-content-muted hidden sm:table-cell">Source</th>
                <th className="w-24 px-3 py-3" />
              </tr>
            </thead>
            <tbody>
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <tr key={i} className="border-b border-line/70 last:border-b-0">
                  <td className="pl-4 pr-1 py-3">
                    <div className="w-9 h-9 rounded-full bg-zinc-200 animate-pulse" />
                  </td>
                  <td className="px-3 py-3">
                    <div className="h-3 w-32 bg-zinc-200 rounded animate-pulse" />
                  </td>
                  <td className="px-3 py-3">
                    <div className="h-3 w-40 bg-zinc-200 rounded animate-pulse" />
                  </td>
                  <td className="px-3 py-3 hidden md:table-cell">
                    <div className="h-3 w-24 bg-zinc-200 rounded animate-pulse" />
                  </td>
                  <td className="px-3 py-3 hidden lg:table-cell">
                    <div className="h-3 w-28 bg-zinc-200 rounded animate-pulse" />
                  </td>
                  <td className="px-3 py-3 hidden sm:table-cell">
                    <div className="h-5 w-10 bg-zinc-200 rounded animate-pulse" />
                  </td>
                  <td className="px-3 py-3 hidden sm:table-cell">
                    <div className="h-3 w-16 bg-zinc-200 rounded animate-pulse" />
                  </td>
                  <td className="pr-4 pl-1 py-3" />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (!loading && contacts.length === 0) {
    return (
      <div className="py-16 text-center">
        {emptyState || (
          <p className="text-sm text-content-tertiary">Aucun contact. Une réponse à une campagne, et le premier apparaît ici.</p>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-line bg-surface-base overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-surface-card border-b border-line">
            <tr>
              {isSelectable && (
                <th className="w-10 pl-4 pr-1 py-3 text-left">
                  <input
                    type="checkbox"
                    aria-label="Tout sélectionner"
                    checked={allVisibleSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = someVisibleSelected;
                    }}
                    onChange={(e) =>
                      onToggleSelectAll?.(e.target.checked, visibleIds)
                    }
                    className="w-4 h-4 rounded text-violet-600 border-line focus:ring-violet-500 focus:ring-offset-0 cursor-pointer"
                  />
                </th>
              )}
              <th className="w-12 px-4 py-3" />
              <th className="px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-content-muted">
                Nom
              </th>
              <th className="px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-content-muted">
                Email
              </th>
              <th className="px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-content-muted hidden md:table-cell">
                Téléphone
              </th>
              <th className="px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-content-muted hidden lg:table-cell">
                Entreprise
              </th>
              <th className="px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-content-muted hidden sm:table-cell">
                {onSortChange ? (
                  <button
                    type="button"
                    onClick={() => handleSortClick('engagement')}
                    className={`inline-flex items-center gap-1 hover:text-content-secondary transition-colors ${
                      sortKey === 'engagement' ? 'text-violet-700' : ''
                    }`}
                    title="Trier par engagement"
                    aria-label="Trier par engagement"
                  >
                    Engagement
                    {sortKey === 'engagement' ? (
                      sortDir === 'asc' ? (
                        <ArrowUp size={10} />
                      ) : (
                        <ArrowDown size={10} />
                      )
                    ) : (
                      <ArrowDown size={10} className="opacity-30" />
                    )}
                  </button>
                ) : (
                  'Engagement'
                )}
              </th>
              <th className="px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-content-muted hidden sm:table-cell">
                Source
              </th>
              <th className="px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-content-muted hidden xl:table-cell">
                Date
              </th>
              {customColumns.map((col) => (
                <th
                  key={col.id}
                  className="px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-content-muted hidden xl:table-cell whitespace-nowrap"
                  title={col.field_label}
                >
                  {col.field_label}
                </th>
              ))}
              <th className="w-24 px-3 py-3" />
            </tr>
          </thead>
          <tbody>
            {contacts.map((c) => {
              const grad = avatarGradient(c.name || c.email || c.id);
              const isChecked = isSelectable && selectedIds.has(c.id);
              return (
                <tr
                  key={c.id}
                  onClick={() => onClick?.(c)}
                  className={`border-b border-line/70 last:border-b-0 transition-colors cursor-pointer group ${
                    isChecked ? 'bg-violet-50/40 hover:bg-violet-50/60' : 'hover:bg-zinc-50'
                  }`}
                >
                  {/* Checkbox */}
                  {isSelectable && (
                    <td className="pl-4 pr-1 py-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        aria-label={`Sélectionner ${c.name || c.email || 'contact'}`}
                        checked={isChecked}
                        onChange={() => onToggleSelect?.(c.id)}
                        className="w-4 h-4 rounded text-violet-600 border-line focus:ring-violet-500 focus:ring-offset-0 cursor-pointer"
                      />
                    </td>
                  )}
                  {/* Avatar */}
                  <td className={isSelectable ? 'px-1 py-3' : 'pl-4 pr-1 py-3'}>
                    <div
                      className={`w-9 h-9 rounded-full bg-gradient-to-br ${grad} flex items-center justify-center shadow-sm ring-1 ring-white`}
                    >
                      <span className="text-[11px] font-bold text-white tracking-wider">
                        {initials(c.name)}
                      </span>
                    </div>
                  </td>

                  {/* Nom */}
                  <td className="px-3 py-3 min-w-0">
                    <div className="font-semibold text-content-primary truncate max-w-[200px]">
                      {c.name || '—'}
                    </div>
                    {c.position && (
                      <div className="text-[11px] text-content-tertiary truncate max-w-[200px]">
                        {c.position}
                      </div>
                    )}
                  </td>

                  {/* Email */}
                  <td className="px-3 py-3">
                    {c.email ? (
                      <a
                        href={`mailto:${c.email}`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1.5 text-[12px] text-emerald-700 hover:text-emerald-900 hover:underline truncate max-w-[220px]"
                      >
                        <Mail size={11} className="text-emerald-500 flex-shrink-0" />
                        <span className="truncate">{c.email}</span>
                      </a>
                    ) : (
                      <span className="text-content-faint text-[11px]">—</span>
                    )}
                  </td>

                  {/* Téléphone */}
                  <td className="px-3 py-3 hidden md:table-cell">
                    {c.phone ? (
                      <a
                        href={`tel:${c.phone}`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1.5 text-[12px] text-content-secondary hover:text-content-primary"
                      >
                        <Phone size={11} className="text-content-tertiary" />
                        <span className="font-mono">{c.phone}</span>
                      </a>
                    ) : (
                      <span className="text-content-faint text-[11px]">—</span>
                    )}
                  </td>

                  {/* Entreprise */}
                  <td className="px-3 py-3 hidden lg:table-cell">
                    {c.company ? (
                      <div className="inline-flex items-center gap-1.5 text-[12px] text-content-secondary truncate max-w-[180px]">
                        <Building2 size={11} className="text-content-tertiary flex-shrink-0" />
                        <span className="truncate">{c.company}</span>
                      </div>
                    ) : (
                      <span className="text-content-faint text-[11px]">—</span>
                    )}
                  </td>

                  {/* Engagement */}
                  <td className="px-3 py-3 hidden sm:table-cell">
                    <EngagementBadge
                      score={c.engagement_score}
                      lastAt={c.last_engagement_at}
                    />
                  </td>

                  {/* Source */}
                  <td className="px-3 py-3 hidden sm:table-cell">
                    <SourceBadge source={c.source} />
                  </td>

                  {/* Date */}
                  <td className="px-3 py-3 hidden xl:table-cell">
                    <span className="text-[11px] text-content-tertiary tabular-nums">
                      {formatDate(c.created_at)}
                    </span>
                  </td>

                  {/* Custom field cells */}
                  {customColumns.map((col) => (
                    <td
                      key={col.id}
                      className="px-3 py-3 hidden xl:table-cell text-[12px] text-content-secondary"
                    >
                      <CustomFieldCell
                        value={c.custom_fields?.[col.field_key]}
                        type={col.field_type}
                      />
                    </td>
                  ))}

                  {/* Actions hover */}
                  <td className="pr-4 pl-1 py-3 text-right">
                    <div className="inline-flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      {onEdit && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit(c);
                          }}
                          className="p-1.5 rounded-md text-content-tertiary hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                          title="Éditer"
                          aria-label="Éditer le contact"
                        >
                          <Pencil size={13} />
                        </button>
                      )}
                      {onDelete && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(c);
                          }}
                          className="p-1.5 rounded-md text-content-tertiary hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Supprimer"
                          aria-label="Supprimer le contact"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Helper : affichage de la valeur d'un custom field dans une cellule ────
function CustomFieldCell({ value, type }) {
  if (value === null || value === undefined || value === '') {
    return <span className="text-content-faint">—</span>;
  }
  if (type === 'boolean') {
    return (
      <span
        className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
          value
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            : 'bg-zinc-100 text-zinc-600 border border-zinc-200'
        }`}
      >
        {value ? 'Oui' : 'Non'}
      </span>
    );
  }
  if (type === 'date') {
    try {
      return (
        <span className="tabular-nums">
          {new Date(value).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })}
        </span>
      );
    } catch {
      return <span>{String(value)}</span>;
    }
  }
  if (type === 'number') {
    return <span className="tabular-nums">{String(value)}</span>;
  }
  return <span className="truncate max-w-[160px] inline-block">{String(value)}</span>;
}

// Exports utilitaires réutilisables ailleurs (page détail contact).
export {
  initials,
  avatarGradient,
  SourceBadge,
  formatDate,
  EngagementBadge,
  engagementTone,
  formatRelativeShort,
};
