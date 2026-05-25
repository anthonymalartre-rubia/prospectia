// ─────────────────────────────────────────────────────────────────────
// Logo Volia — composant unifié
// ─────────────────────────────────────────────────────────────────────
//
// 2 sous-composants :
//
// 1. <Logo /> — wordmark complet (juste le texte "Volia")
//    Utilise les SVG public/logos/volia-wordmark-{dark,light}.svg,
//    swap CSS via la classe .light sur <html>.
//
// 2. <LogoIcon /> — symbole V seul (V + diamant viseur), fond gradient
//    indigo→violet. Pour favicon-like, sidebar, hero, OG images.
//
// Le symbole évoque la prospection ciblée :
// - Le V : initiale Volia + métaphore entonnoir (large en haut → focus en bas)
// - Le diamant au point de convergence : viseur / cible / décideur trouvé
// - Continuité brand avec l'ancien logo "P + viseur" : on conserve le diamant
//
// Concept design : entonnoir de prospection (Volia, mai 2026).
// ─────────────────────────────────────────────────────────────────────

import Link from 'next/link';
import Image from 'next/image';

const SIZES = {
  xs: { icon: 'h-6 w-6', wordmark: 'h-5' },     // sidebar, footer
  sm: { icon: 'h-7 w-7', wordmark: 'h-6' },     // nav, top bar
  md: { icon: 'h-9 w-9', wordmark: 'h-7' },     // login/signup pages
  lg: { icon: 'h-12 w-12', wordmark: 'h-9' },   // hero landing
  xl: { icon: 'h-16 w-16', wordmark: 'h-12' },  // showcase / large
};

// ─────────────────────────────────────────────────────────────────────
// LogoIcon — symbole V seul avec fond gradient indigo→violet
// ─────────────────────────────────────────────────────────────────────
export function LogoIcon({
  size = 'md',
  className = '',
  asLink = false,
  href = '/',
  ariaLabel = 'Volia',
}) {
  const s = SIZES[size] || SIZES.md;
  const icon = (
    <span
      className={`inline-flex items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/20 ${s.icon} ${className}`}
      aria-label={ariaLabel}
      role="img"
    >
      <svg
        viewBox="0 0 32 32"
        className="w-[70%] h-[70%]"
        aria-hidden="true"
      >
        {/* Branche gauche du V */}
        <path d="M7 6.5 L 15.5 21" stroke="white" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        {/* Branche droite du V */}
        <path d="M25 6.5 L 16.5 21" stroke="white" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        {/* Diamant au point de convergence (viseur / cible) */}
        <rect x="13.5" y="22" width="5" height="5" fill="white" transform="rotate(45 16 24.5)" />
      </svg>
    </span>
  );

  if (asLink) {
    return (
      <Link href={href} className="inline-flex items-center hover:opacity-90 transition">
        {icon}
      </Link>
    );
  }
  return icon;
}

// ─────────────────────────────────────────────────────────────────────
// Logo — wordmark complet (juste le texte "Volia")
// ─────────────────────────────────────────────────────────────────────
//
// 2 SVG en swap CSS via la classe .light (ajoutée sur <html> par
// ThemeProvider en mode light) :
// - volia-wordmark-dark.svg : fill blanc, visible sur fond sombre
// - volia-wordmark-light.svg : fill noir, visible sur fond clair
//
// Pourquoi 2 fichiers et pas fill="currentColor" : <Image> de next/image
// traite le SVG comme un raster et NE propage PAS currentColor. Les
// alternatives (mask-image, inline SVG) sont plus lourdes à maintenir.
//
// Variants :
// - "wordmark" : SVG texte "Volia"
// - "icon" : juste le symbole V (alias de LogoIcon)
//
export default function Logo({
  variant = 'wordmark',
  size = 'md',
  className = '',
  asLink = false,
  href = '/',
}) {
  if (variant === 'icon') {
    return <LogoIcon size={size} className={className} asLink={asLink} href={href} />;
  }

  const s = SIZES[size] || SIZES.md;
  const wordmark = (
    <span
      className={`inline-flex items-center ${className}`}
      aria-label="Volia"
    >
      {/* Version dark mode (par défaut, fill blanc) — masquée en .light */}
      <Image
        src="/logos/volia-wordmark-dark.svg"
        alt=""
        width={480}
        height={150}
        className={`w-auto block [.light_&]:hidden ${s.wordmark}`}
        priority={size === 'lg' || size === 'xl'}
      />
      {/* Version light mode (fill noir) — visible uniquement quand .light */}
      <Image
        src="/logos/volia-wordmark-light.svg"
        alt=""
        width={480}
        height={150}
        className={`w-auto hidden [.light_&]:block ${s.wordmark}`}
        priority={size === 'lg' || size === 'xl'}
      />
    </span>
  );

  if (asLink) {
    return (
      <Link href={href} className="inline-flex items-center hover:opacity-90 transition">
        {wordmark}
      </Link>
    );
  }
  return wordmark;
}
