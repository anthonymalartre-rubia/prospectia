import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

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
  title: 'Prospectia.ai — Prospection automatisée DOM-TOM',
  description: 'La plateforme de prospection B2B la plus abordable pour les DOM-TOM. Recherche Google Places, enrichissement email en cascade, export CSV et Zoho CRM.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="bg-[#09090b] min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
