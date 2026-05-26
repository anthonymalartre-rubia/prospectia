import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/lib/theme';
import { I18nProvider } from '@/lib/i18n';
import CookieConsent from '@/components/CookieConsent';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata = {
  metadataBase: new URL('https://volia.fr'),
  title: {
    default: 'Volia — Prospection B2B France : trouvez emails & entreprises (à partir de 19 €/mois)',
    template: '%s | Volia',
  },
  description: 'Le ticket d\'entrée le moins cher du marché français. Découverte d\'entreprises via Google Places (150+ catégories, 101 départements) + enrichissement email automatique. À partir de 19 €/mois.',
  keywords: ['prospection B2B', 'enrichissement email', 'scraping email', 'leads B2B France', 'Google Places', 'export CSV', 'email professionnel', 'outil prospection pas cher', 'alternative Apollo France', 'prospection RGPD'],
  authors: [{ name: 'Volia' }],
  creator: 'Volia',
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    siteName: 'Volia',
  },
  twitter: {
    card: 'summary_large_image',
  },
  // Apple touch icon mention (en plus de src/app/apple-icon.svg auto-géré)
  appleWebApp: {
    title: 'Volia',
    statusBarStyle: 'black-translucent',
    capable: true,
  },
  robots: {
    index: true,
    follow: true,
  },
};

// Global Schema.org Organization — appliqué partout
const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Volia',
  alternateName: ['Volia.fr', 'Volia.fr'],
  url: 'https://volia.fr',
  logo: 'https://volia.fr/icon.svg',
  description: 'Plateforme française de prospection B2B automatisée. Recherche d\'entreprises via Google Places + enrichissement email en cascade. Le ticket d\'entrée le moins cher du marché français à 19 €/mois.',
  sameAs: [],
  founder: {
    '@type': 'Person',
    name: 'Anthony Malartre',
  },
  foundingDate: '2025',
  knowsAbout: [
    'Prospection B2B',
    'Email finding',
    'Lead generation',
    'Sales intelligence',
    'RGPD',
    'Outbound marketing',
  ],
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer support',
    email: 'contact@volia.fr',
    availableLanguage: ['French', 'English'],
  },
  address: {
    '@type': 'PostalAddress',
    addressCountry: 'FR',
  },
};

const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Volia',
  url: 'https://volia.fr',
  potentialAction: {
    '@type': 'SearchAction',
    target: 'https://volia.fr/prospection?q={search_term_string}',
    'query-input': 'required name=search_term_string',
  },
};

// Viewport + theme-color (Next.js 14 metadata convention).
// Adapté pour mobile + dark mode default.
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#08080c' },
  ],
  colorScheme: 'light dark',
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr" className={`${inter.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <head>
        {/* Preconnect aux domaines tiers présents sur quasi toutes les pages.
            Note: Stripe (js.stripe.com, api.stripe.com) déplacé sur /settings
            uniquement — ça ne sert à rien sur la landing et ça gaspille une
            connexion qui retarde le LCP mobile. */}
        <link rel="preconnect" href="https://va.vercel-scripts.com" />
        <link rel="dns-prefetch" href="https://vitals.vercel-insights.com" />
        {/* DNS-prefetch Supabase (auth + queries client une fois loggé) */}
        <link rel="dns-prefetch" href="https://kqrarrrojdtxijkhejhg.supabase.co" />

        {/* Prevent flash of wrong theme — default = LIGHT pour tout le monde
            (décision rebrand Volia mai 2026, voir lib/theme.js). On n'honore
            PLUS la préférence OS dark : seul le toggle explicite via
            ThemeToggle peut activer le dark. */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            try {
              var t = localStorage.getItem('theme');
              if (t !== 'dark') {
                document.documentElement.classList.add('light');
              }
            } catch(e) {
              document.documentElement.classList.add('light');
            }
          })();
        `}} />
        {/* Global Organization + WebSite schemas */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }} />
      </head>
      <body className="bg-surface-base min-h-screen antialiased">
        {/* Skip-link a11y — visible uniquement au focus clavier (Tab). Permet
            aux utilisateurs lecteurs d'écran et clavier de sauter la nav et
            atterrir directement sur le contenu principal. */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-lg focus:bg-violet-600 focus:text-white focus:font-semibold focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-violet-400"
        >
          Aller au contenu principal
        </a>
        <ThemeProvider>
          <I18nProvider>
            <div id="main-content">
              {children}
            </div>
            <CookieConsent />
          </I18nProvider>
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
