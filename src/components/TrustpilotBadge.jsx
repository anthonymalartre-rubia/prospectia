// TrustpilotBadge — mini-strip étoiles + score + nb avis + lien vers Trustpilot.
//
// Composant léger à mettre dans le hero de la landing, footer, /vs pages, etc.
// Server component (statique). Pas de JS Trustpilot chargé — on injecte nos
// propres étoiles SVG depuis Lucide pour ne pas dégrader le LCP.
//
// L'authenticité vient du LINK vers Trustpilot (Google la vérifie en
// suivant le lien, sans avoir besoin du widget iframe).
//
// Si Trustpilot pas activé → retourne null (composant inert).

import Link from 'next/link';
import { Star } from 'lucide-react';
import { getTrustpilotData } from '@/lib/trustpilot-data';

export default function TrustpilotBadge({
  size = 'sm', // 'xs' | 'sm' | 'md'
  variant = 'default', // 'default' | 'inline' (texte seul à côté des étoiles)
  className = '',
}) {
  const data = getTrustpilotData();
  if (!data) return null;

  const sizes = {
    xs: { star: 10, text: 'text-[10px]', gap: 'gap-1' },
    sm: { star: 12, text: 'text-xs', gap: 'gap-1.5' },
    md: { star: 14, text: 'text-sm', gap: 'gap-2' },
  };
  const s = sizes[size] || sizes.sm;

  // Pour les étoiles partielles : on affiche full pour la partie entière,
  // half pour le 0.5 si pertinent. Trustpilot arrondi au demi-point.
  const fullStars = Math.floor(data.rating);
  const hasHalf = data.rating - fullStars >= 0.4;
  const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);

  return (
    <Link
      href={data.profileUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center ${s.gap} text-content-tertiary hover:text-content-primary transition group ${className}`}
      aria-label={`Avis Prospectia sur Trustpilot : ${data.rating}/5 sur ${data.reviewCount} avis`}
    >
      {/* Étoiles */}
      <span className="flex items-center gap-0.5">
        {Array.from({ length: fullStars }).map((_, i) => (
          <Star key={`full-${i}`} size={s.star} className="text-emerald-400 fill-emerald-400" />
        ))}
        {hasHalf && (
          // Half star via SVG mask (Lucide n'a pas StarHalf en fill)
          <span className="relative inline-block" style={{ width: s.star, height: s.star }}>
            <Star size={s.star} className="absolute inset-0 text-emerald-400/40" />
            <span className="absolute inset-0 overflow-hidden" style={{ width: '50%' }}>
              <Star size={s.star} className="text-emerald-400 fill-emerald-400" />
            </span>
          </span>
        )}
        {Array.from({ length: emptyStars }).map((_, i) => (
          <Star key={`empty-${i}`} size={s.star} className="text-emerald-400/30" />
        ))}
      </span>

      {/* Score + count */}
      <span className={`${s.text} font-semibold text-content-secondary tabular-nums`}>
        {data.rating.toFixed(1)}
      </span>
      <span className={`${s.text} text-content-muted`}>
        ({data.reviewCount} avis)
      </span>

      {variant !== 'inline' && (
        <span className={`${s.text} text-content-muted hidden sm:inline group-hover:text-content-secondary transition`}>
          · Trustpilot
        </span>
      )}
    </Link>
  );
}
