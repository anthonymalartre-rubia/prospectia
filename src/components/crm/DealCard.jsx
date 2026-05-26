'use client';

// ─────────────────────────────────────────────────────────────────────
// DealCard — carte cliquable + draggable d'un deal dans le Kanban.
// ─────────────────────────────────────────────────────────────────────
// Props :
//   - deal : objet deal (avec contact + stage embarqués)
//   - onClick : ouvre le DealDetailDrawer
//   - onDragStart : handler natif HTML5 (parent gère le dataTransfer)
//   - onDragEnd   : reset visual state côté parent
//   - isDragging  : applique opacity-50 + ring violet
//
// Visuel : 240px wide, p-3, rounded-lg, hover shadow.
// Status 'won' → badge emerald + bg-emerald-50
// Status 'lost' → badge rose + bg-rose-50 + opacity-70
// ─────────────────────────────────────────────────────────────────────

import { Building2, Banknote, Calendar, Sparkles } from 'lucide-react';
import { formatDealValue } from '@/lib/crm';

// ─── Mini avatar (initiales) ─────────────────────────────────────────
const MINI_AVATAR_GRADIENTS = [
  'from-violet-500 to-indigo-600',
  'from-purple-500 to-violet-600',
  'from-fuchsia-500 to-purple-600',
  'from-indigo-500 to-blue-600',
  'from-sky-500 to-indigo-600',
  'from-cyan-500 to-teal-600',
  'from-emerald-500 to-teal-600',
  'from-rose-500 to-pink-600',
];
function miniAvatarGradient(seed = '') {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h << 5) - h + seed.charCodeAt(i);
    h |= 0;
  }
  return MINI_AVATAR_GRADIENTS[Math.abs(h) % MINI_AVATAR_GRADIENTS.length];
}
function miniInitials(name = '') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// ─── helpers date ────────────────────────────────────────────────────
function formatRelativeDate(dateString) {
  if (!dateString) return null;
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return null;

  const now = new Date();
  // Tronque à minuit pour éviter biais d'heure.
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((target - today) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return { label: "Aujourd'hui", tone: 'warn' };
  if (diffDays === 1) return { label: 'Demain', tone: 'warn' };
  if (diffDays === -1) return { label: 'Hier', tone: 'danger' };
  if (diffDays < 0) return { label: `Retard ${Math.abs(diffDays)}j`, tone: 'danger' };
  if (diffDays <= 7) return { label: `Dans ${diffDays}j`, tone: 'warn' };

  // > 7 jours : date complète FR
  const fmt = new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: target.getFullYear() === today.getFullYear() ? undefined : 'numeric',
  });
  return { label: fmt.format(date), tone: 'neutral' };
}

export default function DealCard({
  deal,
  onClick,
  onDragStart,
  onDragEnd,
  isDragging = false,
}) {
  if (!deal) return null;

  const isWon = deal.status === 'won';
  const isLost = deal.status === 'lost';
  const isClosed = isWon || isLost;
  const isAutoCreated = deal.metadata?.auto_created === true;
  const sourceChannel =
    deal.metadata?.source_channel === 'email'
      ? 'email'
      : deal.metadata?.source_channel === 'sms'
      ? 'SMS'
      : null;

  const dateInfo = formatRelativeDate(deal.expected_close_date);
  const contact = deal.contact;
  const company = contact?.company;
  const contactName = contact?.name;
  // Heuristique : titre principal = company > contact.name > deal.title
  const heading = company || contactName || null;

  const baseColors = isWon
    ? 'bg-emerald-50/80 border-emerald-200 hover:border-emerald-300'
    : isLost
    ? 'bg-rose-50/60 border-rose-200 hover:border-rose-300 opacity-75'
    : 'bg-surface-card border-line hover:border-emerald-300';

  const dateColors =
    dateInfo?.tone === 'danger'
      ? 'text-rose-600'
      : dateInfo?.tone === 'warn'
      ? 'text-amber-600'
      : 'text-content-tertiary';

  return (
    <div
      role="button"
      tabIndex={0}
      draggable={!isClosed}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={`
        group relative w-full p-3 rounded-lg border
        text-left transition-all
        ${baseColors}
        ${isClosed ? 'cursor-pointer' : 'cursor-grab active:cursor-grabbing'}
        ${isDragging ? 'opacity-40 ring-2 ring-emerald-400 ring-offset-2 ring-offset-surface-elevated' : 'hover:shadow-md hover:-translate-y-0.5'}
        focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-base
      `}
      aria-label={`Deal ${deal.title}, valeur ${formatDealValue(deal.value_cents)}${heading ? `, ${heading}` : ''}`}
    >
      {/* Status badge top-right (only if closed) */}
      {isClosed && (
        <div className="absolute top-2 right-2">
          <span
            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide ${
              isWon
                ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                : 'bg-rose-100 text-rose-700 border border-rose-200'
            }`}
          >
            {isWon ? '✓ Gagné' : '✗ Perdu'}
          </span>
        </div>
      )}

      {/* Auto-créé badge (Phase 2) — discret, en haut à gauche */}
      {isAutoCreated && (
        <div className="mb-1.5">
          <span
            title={
              sourceChannel
                ? `Créé automatiquement depuis une réponse à une campagne ${sourceChannel}`
                : 'Créé automatiquement depuis une réponse à une campagne'
            }
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-violet-50 text-violet-700 border border-violet-200"
          >
            <Sparkles size={9} className="text-violet-500" />
            Auto-créé
          </span>
        </div>
      )}

      {/* Heading : company OR contact name */}
      {heading && (
        <div className="flex items-center gap-1.5 mb-1 text-content-secondary">
          <Building2 size={11} className="flex-shrink-0 text-content-tertiary" />
          <span className="text-[11px] font-semibold uppercase tracking-wide truncate">
            {heading}
          </span>
        </div>
      )}

      {/* Title */}
      <h3 className={`text-sm font-semibold text-content-primary leading-tight mb-2 ${isClosed ? 'pr-16' : ''}`}>
        {deal.title}
      </h3>

      {/* Value + date row */}
      <div className="flex items-center justify-between gap-2 text-xs">
        <div className="inline-flex items-center gap-1 text-content-primary font-bold tabular-nums">
          <Banknote size={12} className="text-emerald-600" />
          <span>{formatDealValue(deal.value_cents, deal.currency)}</span>
        </div>
        {dateInfo && (
          <div className={`inline-flex items-center gap-1 ${dateColors} font-medium`}>
            <Calendar size={11} />
            <span>{dateInfo.label}</span>
          </div>
        )}
      </div>

      {/* Contact name + mini avatar (compact, only if heading shown company) */}
      {company && contactName && (
        <div className="mt-2 pt-2 border-t border-line flex items-center justify-between gap-2 text-[11px] text-content-tertiary">
          <span className="truncate flex-1">{contactName}</span>
          <span
            className={`flex-shrink-0 inline-flex items-center justify-center w-5 h-5 rounded-full bg-gradient-to-br ${miniAvatarGradient(
              contactName
            )} text-white text-[8px] font-bold tracking-wide ring-1 ring-white`}
            title={contactName}
          >
            {miniInitials(contactName)}
          </span>
        </div>
      )}

      {/* Si pas d'entreprise mais un contact, on affiche le mini avatar tout seul en bas droite */}
      {!company && contactName && (
        <div className="absolute bottom-2 right-2">
          <span
            className={`inline-flex items-center justify-center w-5 h-5 rounded-full bg-gradient-to-br ${miniAvatarGradient(
              contactName
            )} text-white text-[8px] font-bold tracking-wide ring-1 ring-white`}
            title={contactName}
          >
            {miniInitials(contactName)}
          </span>
        </div>
      )}
    </div>
  );
}
