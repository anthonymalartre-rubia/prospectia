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
  metadataBase: new URL('https://prospectia.cloud'),
  title: {
    default: 'Prospectia.ai — Trouvez l\'email de n\'importe quelle entreprise en France',
    template: '%s | Prospectia.ai',
  },
  description: 'Prospection B2B automatisée : scraping intelligent + recherche Google. 150+ catégories, 101 départements, scoring de confiance. À partir de 49€/mois.',
  keywords: ['prospection B2B', 'enrichissement email', 'scraping email', 'leads B2B France', 'Google Places', 'export CSV', 'email professionnel'],
  authors: [{ name: 'Prospectia.ai' }],
  creator: 'Prospectia.ai',
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    siteName: 'Prospectia.ai',
  },
  twitter: {
    card: 'summary_large_image',
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
  name: 'Prospectia',
  alternateName: 'Prospectia.cloud',
  url: 'https://prospectia.cloud',
  logo: 'https://prospectia.cloud/icon.svg',
  description: 'Plateforme de prospection B2B automatisée en France. Scraping intelligent + recherche Google pour trouver les emails professionnels.',
  sameAs: [],
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer support',
    email: 'contact@prospectia.cloud',
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
  name: 'Prospectia',
  url: 'https://prospectia.cloud',
  potentialAction: {
    '@type': 'SearchAction',
    target: 'https://prospectia.cloud/prospection?q={search_term_string}',
    'query-input': 'required name=search_term_string',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr" className={`${inter.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <head>
        {/* Prevent flash of wrong theme — default = light */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            try {
              var t = localStorage.getItem('theme');
              var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
              var useLight = t === 'light' || (!t && !prefersDark);
              if (useLight) document.documentElement.classList.add('light');
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
        <ThemeProvider>
          <I18nProvider>
            {children}
            <CookieConsent />
          </I18nProvider>
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
