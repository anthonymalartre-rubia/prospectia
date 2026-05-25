// Wordmark unifié Volia.
//
// Utilise le composant <Logo /> (vrai logo Volia avec symbole V + diamant
// viseur, intégré en mai 2026 lors du rebrand depuis Prospectia).
//
// Variants conservés pour rétro-compat avec l'ancienne API :
// - default : juste le wordmark "Volia" (image SVG)
// - logo : symbole V + texte "Volia"
// - compact : juste le symbole V (rare)

import Link from 'next/link';
import Image from 'next/image';
import { LogoIcon } from './Logo';

const SIZES = {
  xs: { wordmarkH: 'h-4', iconSize: 'xs', gap: 'gap-1.5' },
  sm: { wordmarkH: 'h-5', iconSize: 'sm', gap: 'gap-2' },
  md: { wordmarkH: 'h-6', iconSize: 'sm', gap: 'gap-2' },
  lg: { wordmarkH: 'h-7', iconSize: 'md', gap: 'gap-2.5' },
  xl: { wordmarkH: 'h-10', iconSize: 'lg', gap: 'gap-3' },
};

export default function BrandWordmark({
  variant = 'default',
  size = 'md',
  asLink = false,
  href = '/',
  className = '',
}) {
  const s = SIZES[size] || SIZES.md;

  // variant="compact" : juste le symbole P (sans wordmark)
  if (variant === 'compact') {
    return <LogoIcon size={s.iconSize} className={className} asLink={asLink} href={href} />;
  }

  // variant="logo" : symbole V + wordmark côte à côte
  // variant="default" : juste wordmark
  // Note : 2 SVG en swap CSS via .light pour theme-awareness (voir Logo.jsx)
  const inner = (
    <span className={`inline-flex items-center ${s.gap} ${className}`}>
      {variant === 'logo' && <LogoIcon size={s.iconSize} />}
      {/* Dark mode (par défaut, fill blanc) */}
      <Image
        src="/logos/volia-wordmark-dark.svg"
        alt="Volia"
        width={480}
        height={150}
        className={`w-auto block [.light_&]:hidden ${s.wordmarkH}`}
        priority={size === 'lg' || size === 'xl'}
      />
      {/* Light mode (fill noir) */}
      <Image
        src="/logos/volia-wordmark-light.svg"
        alt=""
        aria-hidden="true"
        width={480}
        height={150}
        className={`w-auto hidden [.light_&]:block ${s.wordmarkH}`}
        priority={size === 'lg' || size === 'xl'}
      />
    </span>
  );

  if (asLink) {
    return (
      <Link href={href} className="inline-flex items-center hover:opacity-90 transition">
        {inner}
      </Link>
    );
  }
  return inner;
}
