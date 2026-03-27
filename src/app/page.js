import Link from 'next/link';
import { ArrowRight, Check } from 'lucide-react';
import { NavAuth, HeroCTA, FooterCTA } from '@/components/AuthCTA';

export const metadata = {
  title: 'Prospectia — Trouvez vos prospects DOM-TOM en quelques clics',
  description: 'La plateforme de prospection B2B la plus abordable pour les DOM-TOM. Recherche Google Places + enrichissement email en cascade. 92% moins cher que la concurrence.',
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-[#111] overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight">Prospectia</span>
            <span className="text-[10px] font-medium text-rose-500 ml-0.5">.ai</span>
          </Link>
          <div className="hidden sm:flex items-center gap-8">
            <Link href="#features" className="text-sm text-gray-500 hover:text-black transition">Fonctionnalites</Link>
            <Link href="#pricing" className="text-sm text-gray-500 hover:text-black transition">Pricing</Link>
          </div>
          <div className="flex items-center gap-3">
            <NavAuth />
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-36 pb-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl sm:text-6xl lg:text-[5rem] font-bold tracking-tight leading-[1.05] mb-8">
            Decrivez vos prospects.
            <br />
            On les trouve.
          </h1>
          <p className="text-lg sm:text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            La plateforme qui trouve les entreprises, emails et telephones
            dans les DOM-TOM. Aussi simple qu'une recherche Google.
          </p>
          <HeroCTA />
        </div>
      </section>

      {/* Feature 1 — Smart Search */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-sm font-semibold text-rose-500 mb-3">Recherche intelligente</p>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 max-w-lg">
            Trouvez exactement qui vous cherchez
          </h2>
          <p className="text-gray-500 text-lg max-w-xl mb-12">
            Selectionnez vos departements et categories. Notre moteur interroge
            Google Places et collecte tous les etablissements : nom, adresse,
            telephone, site web.
          </p>

          {/* Search mockup */}
          <div className="border border-gray-200 rounded-2xl p-8 bg-gray-50/50">
            <div className="max-w-xl mx-auto">
              <div className="text-center mb-6">
                <span className="text-xl font-bold tracking-tight">Prospectia<span className="text-rose-500">.ai</span></span>
                <p className="text-sm text-gray-400 mt-1">Prospection B2B & Copro — DOM-TOM</p>
              </div>
              <div className="border border-gray-200 rounded-xl p-4 bg-white">
                <p className="text-gray-400 text-sm mb-3">pharmacie Martinique</p>
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1.5 bg-black text-white text-xs font-medium rounded-full">B2B</span>
                  <span className="px-3 py-1.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">Copro</span>
                  <span className="px-3 py-1.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">Custom</span>
                </div>
              </div>
              <div className="mt-4 space-y-1">
                <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">Essayez</p>
                <p className="text-sm text-gray-500">+ hotel Guadeloupe</p>
                <p className="text-sm text-gray-500">+ restaurant La Reunion</p>
                <p className="text-sm text-gray-500">+ syndic copropriete Martinique</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature 2 — Instant Results */}
      <section className="py-24 px-6 bg-gray-50/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-right mb-12">
            <p className="text-sm font-semibold text-rose-500 mb-3">Resultats instantanes</p>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Des contacts verifies en quelques secondes
            </h2>
            <p className="text-gray-500 text-lg max-w-xl ml-auto">
              Parcourez les informations detaillees de chaque lead : email, telephone,
              site web, note Google, departement.
            </p>
          </div>

          {/* Results table mockup */}
          <div className="border border-gray-200 rounded-2xl bg-white overflow-hidden shadow-sm">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold">Prospectia<span className="text-rose-500">.ai</span></span>
                <div className="flex items-center gap-2 px-3 py-1 bg-white border border-gray-200 rounded-lg">
                  <span className="text-xs font-medium">B2B</span>
                  <span className="text-gray-300">/</span>
                  <span className="text-xs text-gray-400">Copro</span>
                </div>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-white border border-gray-200 rounded-lg">
                <span className="text-xs text-gray-400">pharmacie Martinique</span>
              </div>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left">
                  <th className="px-4 py-3 font-medium text-gray-400 text-xs uppercase">Nom</th>
                  <th className="px-4 py-3 font-medium text-gray-400 text-xs uppercase">Email</th>
                  <th className="px-4 py-3 font-medium text-gray-400 text-xs uppercase">Telephone</th>
                  <th className="px-4 py-3 font-medium text-gray-400 text-xs uppercase hidden sm:table-cell">Dept</th>
                  <th className="px-4 py-3 font-medium text-gray-400 text-xs uppercase hidden md:table-cell">Note</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { nom: 'Pharmacie du Marin', email: 'contact@pharma-marin.mq', tel: '0596 74 XX XX', dept: '972', note: '4.6' },
                  { nom: 'Pharmacie Centrale', email: 'accueil@phcentrale.fr', tel: '0596 71 XX XX', dept: '972', note: '4.3' },
                  { nom: 'Pharmacie des Iles', email: 'info@pharma-iles.mq', tel: '0596 63 XX XX', dept: '972', note: '4.8' },
                  { nom: 'Pharmacie Riviere Salee', email: 'contact@prs972.fr', tel: '0596 68 XX XX', dept: '972', note: '4.1' },
                  { nom: 'Pharmacie Lamentin', email: 'pharma.lamentin@orange.fr', tel: '0596 51 XX XX', dept: '972', note: '4.4' },
                ].map((row, i) => (
                  <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-medium">{row.nom}</td>
                    <td className="px-4 py-3 text-gray-500">{row.email}</td>
                    <td className="px-4 py-3 text-gray-400 font-mono text-xs">{row.tel}</td>
                    <td className="px-4 py-3 text-gray-400 font-mono text-xs hidden sm:table-cell">{row.dept}</td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-yellow-500 text-xs">&#9733;</span>
                      <span className="text-gray-500 text-xs ml-1">{row.note}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex items-center justify-center gap-4 px-4 py-3 border-t border-gray-100 bg-gray-50">
              <button className="px-3 py-1.5 text-xs font-medium bg-white border border-gray-200 rounded-lg text-gray-500">Filtres</button>
              <span className="text-xs text-gray-400">247 leads</span>
              <button className="px-3 py-1.5 text-xs font-medium bg-black text-white rounded-lg">Export</button>
            </div>
          </div>
        </div>
      </section>

      {/* Feature 3 — Waterfall Enrichment */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-sm font-semibold text-rose-500 mb-3">Enrichissement en cascade</p>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 max-w-lg">
            7 sources. 1 seul clic. Le meilleur email.
          </h2>
          <p className="text-gray-500 text-lg max-w-xl mb-12">
            Notre waterfall teste chaque source dans l'ordre et s'arrete
            des qu'un email verifie est trouve. 92% moins cher qu'Apollo seul.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { step: '1', name: 'Scraping', desc: 'Parcourt le site web', tag: 'Gratuit', color: 'bg-green-50 border-green-200 text-green-700' },
              { step: '2', name: 'Serper.dev', desc: 'Recherche Google', tag: '$0.002/req', color: 'bg-yellow-50 border-yellow-200 text-yellow-700' },
              { step: '3', name: 'Apollo.io', desc: 'Base B2B mondiale', tag: '$79/mo', color: 'bg-orange-50 border-orange-200 text-orange-700' },
              { step: '4', name: 'Enrichly', desc: 'Enrichissement email', tag: '$59/mo', color: 'bg-cyan-50 border-cyan-200 text-cyan-700' },
            ].map((item) => (
              <div key={item.step} className="relative p-5 rounded-xl border border-gray-200 bg-white">
                <div className="text-xs font-mono text-gray-300 mb-3">0{item.step}</div>
                <h3 className="font-semibold mb-1">{item.name}</h3>
                <p className="text-sm text-gray-500 mb-3">{item.desc}</p>
                <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium border ${item.color}`}>
                  {item.tag}
                </span>
                {Number(item.step) < 4 && (
                  <div className="absolute top-1/2 -right-3 hidden lg:flex items-center justify-center w-6 h-6 bg-white border border-gray-200 rounded-full z-10">
                    <ArrowRight size={12} className="text-gray-400" />
                  </div>
                )}
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-gray-400 mt-6">
            + Anymail Finder, Findymail, et fallback intelligent. S'arrete au premier email trouve.
          </p>
        </div>
      </section>

      {/* Social proof / Stats */}
      <section className="py-20 px-6 border-t border-b border-gray-100">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            {[
              { value: '19', label: 'Categories de recherche' },
              { value: '4', label: 'Departements DOM-TOM' },
              { value: '7', label: "Sources d'enrichissement" },
              { value: '92%', label: 'Moins cher qu\'Apollo' },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-4xl sm:text-5xl font-bold font-mono">{stat.value}</div>
                <div className="text-sm text-gray-500 mt-2">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-rose-500 mb-3">Pricing transparent</p>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Le plus competitif du marche
            </h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">
              Pas de credits caches. Pas de markup sur les API. Vous payez le cout reel.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Free */}
            <div className="p-8 rounded-2xl border border-gray-200 bg-white">
              <h3 className="text-lg font-semibold mb-1">Starter</h3>
              <p className="text-sm text-gray-500 mb-6">Pour tester la plateforme</p>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-bold">0&euro;</span>
                <span className="text-gray-400 text-sm">/mois</span>
              </div>
              <Link
                href="/signup"
                className="block w-full py-3 text-center text-sm font-semibold rounded-xl border border-gray-200 hover:bg-gray-50 transition mb-8"
              >
                Commencer gratuitement
              </Link>
              <div className="space-y-3">
                {[
                  '100 recherches Google Places',
                  'Scraping email gratuit',
                  'Export CSV standard',
                  '4 departements DOM-TOM',
                  '1 utilisateur',
                ].map((f) => (
                  <div key={f} className="flex items-start gap-2">
                    <Check size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-600">{f}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Pro */}
            <div className="p-8 rounded-2xl border-2 border-black bg-white relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-black text-white text-xs font-semibold rounded-full">
                Populaire
              </div>
              <h3 className="text-lg font-semibold mb-1">Pro</h3>
              <p className="text-sm text-gray-500 mb-6">Pour les equipes commerciales</p>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-bold">49&euro;</span>
                <span className="text-gray-400 text-sm">/mois</span>
              </div>
              <Link
                href="/signup"
                className="block w-full py-3 text-center text-sm font-semibold rounded-xl bg-black text-white hover:bg-gray-800 transition mb-8"
              >
                Choisir Pro &rarr;
              </Link>
              <div className="space-y-3">
                {[
                  'Recherches illimitees',
                  'Waterfall complet (7 sources)',
                  'Export CSV + Zoho CRM',
                  'Enrichissement Serper.dev inclus',
                  '5 utilisateurs',
                  'Support prioritaire',
                ].map((f) => (
                  <div key={f} className="flex items-start gap-2">
                    <Check size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-600">{f}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Enterprise */}
            <div className="p-8 rounded-2xl border border-gray-200 bg-white">
              <h3 className="text-lg font-semibold mb-1">Enterprise</h3>
              <p className="text-sm text-gray-500 mb-6">Volume et sur-mesure</p>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-bold">149&euro;</span>
                <span className="text-gray-400 text-sm">/mois</span>
              </div>
              <Link
                href="/signup"
                className="block w-full py-3 text-center text-sm font-semibold rounded-xl border border-gray-200 hover:bg-gray-50 transition mb-8"
              >
                Contacter l'equipe
              </Link>
              <div className="space-y-3">
                {[
                  'Tout dans Pro',
                  'Apollo + Enrichly + Anymail inclus',
                  'API access',
                  'Utilisateurs illimites',
                  'Webhooks & integrations',
                  'SLA & support dedie',
                ].map((f) => (
                  <div key={f} className="flex items-start gap-2">
                    <Check size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-600">{f}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Comparison */}
          <div className="mt-16 p-8 rounded-2xl bg-gray-50 border border-gray-100">
            <h3 className="font-semibold mb-6 text-center">Comparez avec la concurrence</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-400"></th>
                    <th className="text-center py-3 px-4 font-bold">Prospectia</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-400">Apollo.io</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-400">LeadQuest</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Prix/mois', '49\u20AC', '79\u20AC', '~99\u20AC'],
                    ['Sources enrichissement', '7', '1', '?'],
                    ['Focus DOM-TOM', '\u2713', '\u2717', '\u2717'],
                    ['Google Places integre', '\u2713', '\u2717', '\u2717'],
                    ['Export Zoho CRM', '\u2713', '\u2717', '\u2717'],
                  ].map(([label, ...values], i) => (
                    <tr key={i} className="border-b border-gray-100">
                      <td className="py-3 px-4 text-gray-600">{label}</td>
                      {values.map((v, j) => (
                        <td key={j} className={`py-3 px-4 text-center ${j === 0 ? 'font-semibold' : 'text-gray-400'}`}>
                          {v === '\u2713' ? <span className="text-green-500 font-bold">&#10003;</span> :
                           v === '\u2717' ? <span className="text-gray-300">&#10005;</span> : v}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-6 bg-black text-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Pret a trouver vos prochains clients ?
          </h2>
          <p className="text-gray-400 text-lg mb-8 max-w-xl mx-auto">
            Creez votre compte en 30 secondes. Aucune carte bancaire requise.
          </p>
          <FooterCTA />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-12 px-6 bg-white">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold tracking-tight">Prospectia</span>
            <span className="text-rose-500 text-sm font-medium">.ai</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-gray-400">
            <span>Guadeloupe</span>
            <span>Martinique</span>
            <span>Guyane</span>
            <span>La Reunion</span>
          </div>
          <p className="text-xs text-gray-400">
            &copy; 2026 Prospectia.ai — Tous droits reserves.
          </p>
        </div>
      </footer>
    </div>
  );
}
