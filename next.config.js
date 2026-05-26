// Bundle analyzer activable via : ANALYZE=true npm run build
// Génère un rapport HTML interactif dans .next/analyze/ pour identifier
// les chunks lourds et le code inutilisé.
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

// Sentry — wrap final pour upload des source maps et injection des
// hooks d'instrumentation. Graceful : si SENTRY_AUTH_TOKEN absent au
// build, les source maps ne sont pas upload mais le build passe.
const { withSentryConfig } = require('@sentry/nextjs');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Compress responses (gzip/brotli)
  compress: true,

  // Optimize images
  images: {
    formats: ['image/avif', 'image/webp'],
  },

  // Security + caching headers
  async headers() {
    // Content-Security-Policy (P2 audit) :
    // - 'unsafe-inline' sur style/script reste requis tant qu'on utilise
    //   Tailwind JIT runtime + Next.js inline scripts d'hydratation.
    // - On whitelist explicitement les domaines tiers utilisés :
    //   Supabase (auth + REST), Stripe (checkout iframe), Resend (rien
    //   côté front), Google Fonts, Vercel Analytics, Vercel Insights.
    // - img-src 'self' data: blob: https: pour les OG images, avatars,
    //   et tout fetch d'image externe (Google Places, etc.).
    const csp = [
      "default-src 'self'",
      // widget.trustpilot.com : script bootstrap du Review Collector
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://va.vercel-scripts.com https://widget.trustpilot.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' data: https://fonts.gstatic.com",
      "img-src 'self' data: blob: https:",
      // *.trustpilot.com : appels API du widget pour récupérer config + envoyer reviews
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com https://va.vercel-scripts.com https://vitals.vercel-insights.com https://*.trustpilot.com",
      // widget.trustpilot.com : le Review Collector affiche un iframe pour le formulaire d'avis
      "frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://widget.trustpilot.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
      "upgrade-insecure-requests",
    ].join('; ');

    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(self "https://js.stripe.com")' },
          { key: 'Content-Security-Policy', value: csp },
        ],
      },
      {
        // Cache static assets aggressively
        source: '/(.*)\\.(js|css|woff2|woff|ttf|ico|png|jpg|jpeg|svg|webp|avif)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },

  // Reduce bundle: don't include server-only packages in client
  experimental: {
    optimizePackageImports: ['lucide-react'],
    // Inline critical CSS dans le <head> (économise ~600ms de blocage rendu sur mobile).
    // Powered by Critters — supprime le round-trip réseau sur le CSS critique.
    optimizeCss: true,
  },

  // Redirections gérées nativement dans Vercel :
  // - prospectia.cloud → volia.fr (Phase E — redirect 301 permanent post-rebrand mai 2026)
  // - getprospectia.com → volia.fr (legacy, à configurer côté Vercel)
  // - scraping-dom-ezdrive.vercel.app → volia.fr (à configurer)
  // - www.volia.fr → volia.fr (canonical apex, à configurer)
};

// Note : on chaîne d'abord withBundleAnalyzer (transforme la config Next)
// puis withSentryConfig (instrumentation + source maps).
// Doc Sentry : https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/
module.exports = withSentryConfig(withBundleAnalyzer(nextConfig), {
  // Silence les logs Sentry pendant le build sauf si SENTRY_DEBUG=true
  silent: true,

  org: process.env.SENTRY_ORG || 'volia',
  project: process.env.SENTRY_PROJECT || 'volia-prod',

  // Upload des source maps : permet d'avoir des stack traces lisibles
  // en prod malgré la minification. Nécessite SENTRY_AUTH_TOKEN sur Vercel.
  widenClientFileUpload: true,
  sourcemaps: {
    // Cache les source maps publiquement (équivalent ancien hideSourceMaps).
    deleteSourcemapsAfterUpload: true,
  },

  // Tunnel /monitoring → contourne les adblockers qui bloquent
  // sentry.io. Les events client sont POST sur /monitoring qui les
  // forward au DSN côté serveur.
  tunnelRoute: '/monitoring',
});
