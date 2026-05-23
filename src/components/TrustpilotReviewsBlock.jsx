// TrustpilotReviewsBlock — bloc plein landing avec score + CTA + lien
// vers tous les avis Trustpilot.
//
// Volontairement SANS widget iframe Trustpilot officiel :
// - Le widget JS Trustpilot fait ~80 KiB JS supplémentaires + 3 round-trips
//   réseau → dégrade le LCP de 200-400ms.
// - Le widget rend les avis dans une iframe → SEO nul (Googlebot ne voit
//   pas les avis pour le contexte de la page).
// - Le widget impose le style Trustpilot (vert/blanc) qui jure avec le
//   thème dark forced de la landing.
//
// Solution maison : on récupère les vrais chiffres Trustpilot (manuel
// via trustpilot-data.js), on les affiche dans nos propres composants,
// et on met un lien BIEN VISIBLE vers le profil Trustpilot pour preuve
// d'authenticité. Google valide cette approche (le rich snippet est
// servi par notre JSON-LD aggregateRating, pas par le widget).

import Link from 'next/link';
import { Star, ExternalLink, Quote } from 'lucide-react';
import { getTrustpilotData } from '@/lib/trustpilot-data';
import { MarketingCard } from '@/components/ui';

export default function TrustpilotReviewsBlock({
  title = 'Ce que disent les utilisateurs sur Trustpilot',
  subtitle = 'Avis vérifiés indépendamment par Trustpilot — collecteur d\'avis tiers reconnu.',
}) {
  const data = getTrustpilotData();
  if (!data) return null;

  const fullStars = Math.floor(data.rating);
  const hasHalf = data.rating - fullStars >= 0.4;
  const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);

  return (
    <section className="max-w-5xl mx-auto px-4 sm:px-6 mb-16">
      <div className="text-center mb-10">
        <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-3">
          Avis Trustpilot
        </p>
        <h2 className="text-2xl sm:text-3xl font-bold mb-3 leading-tight bg-gradient-to-b from-white to-zinc-400 bg-clip-text text-transparent">
          {title}
        </h2>
        <p className="text-sm text-zinc-400 max-w-2xl mx-auto leading-relaxed mb-5">
          {subtitle}
        </p>

        {/* Card score Trustpilot mise en avant */}
        <MarketingCard variant="default" size="md" className="inline-flex flex-col sm:flex-row items-center gap-4 max-w-xl mx-auto">
          <div className="flex items-center gap-2">
            {Array.from({ length: fullStars }).map((_, i) => (
              <Star key={`full-${i}`} size={20} className="text-emerald-400 fill-emerald-400" />
            ))}
            {hasHalf && (
              <span className="relative inline-block" style={{ width: 20, height: 20 }}>
                <Star size={20} className="absolute inset-0 text-emerald-400/40" />
                <span className="absolute inset-0 overflow-hidden" style={{ width: '50%' }}>
                  <Star size={20} className="text-emerald-400 fill-emerald-400" />
                </span>
              </span>
            )}
            {Array.from({ length: emptyStars }).map((_, i) => (
              <Star key={`empty-${i}`} size={20} className="text-emerald-400/30" />
            ))}
          </div>
          <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2 text-left">
            <span className="text-3xl font-bold tabular-nums text-white">
              {data.rating.toFixed(1)}
            </span>
            <span className="text-sm text-zinc-400">
              / 5 sur <strong className="text-zinc-200 tabular-nums">{data.reviewCount}</strong> avis vérifiés
            </span>
          </div>
        </MarketingCard>

        {/* CTA dual : voir tous les avis + laisser un avis */}
        <div className="flex flex-col sm:flex-row gap-2 justify-center mt-5">
          <Link
            href={data.profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] text-zinc-200 hover:text-white text-sm font-semibold transition"
          >
            Voir tous les avis sur Trustpilot
            <ExternalLink size={13} />
          </Link>
          <Link
            href={data.reviewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 hover:text-emerald-200 text-sm font-semibold transition"
          >
            Laisser un avis
            <Quote size={13} />
          </Link>
        </div>
      </div>
    </section>
  );
}
