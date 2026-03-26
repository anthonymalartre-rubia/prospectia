'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getSupabase } from '@/lib/supabase';
import {
  Search,
  Mail,
  Download,
  Shield,
  Zap,
  Globe,
  ArrowRight,
  CheckCircle2,
  MapPin,
  Building2,
  Users,
  BarChart3,
  ChevronRight,
  Star,
} from 'lucide-react';

export default function LandingPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const supabase = getSupabase();
    if (supabase) {
      supabase.auth.getUser().then(({ data: { user } }) => {
        setIsLoggedIn(!!user);
      });
    }
  }, []);

  const ctaHref = isLoggedIn ? '/dashboard' : '/signup';
  const ctaText = isLoggedIn ? 'Accéder au dashboard' : 'Commencer gratuitement';

  return (
    <div className="min-h-screen bg-[#09090b] text-[#fafafa] overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-[#09090b]/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600">
              <span className="text-sm font-bold text-white">LG</span>
            </div>
            <span className="text-lg font-semibold">Lead Generator</span>
          </div>
          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-sm font-medium transition-all"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm text-[#a1a1aa] hover:text-white transition"
                >
                  Se connecter
                </Link>
                <Link
                  href="/signup"
                  className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-sm font-medium transition-all"
                >
                  Essai gratuit
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-24 px-6">
        {/* Background effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-indigo-600/15 rounded-full blur-[120px]" />
          <div className="absolute top-40 left-1/4 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[100px]" />
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 text-sm font-medium mb-8">
            <Zap size={14} />
            Prospection automatisée pour les DOM-TOM
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6">
            Générez des leads
            <br />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
              qualifiés en minutes
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-[#a1a1aa] max-w-2xl mx-auto mb-10 leading-relaxed">
            Trouvez, enrichissez et exportez des prospects B2B et copropriétés
            en Guadeloupe, Martinique, Guyane et La Réunion.
            <span className="text-[#fafafa] font-medium"> Automatiquement.</span>
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href={ctaHref}
              className="group flex items-center gap-2 px-8 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-base font-semibold transition-all shadow-lg shadow-indigo-600/25 hover:shadow-indigo-500/40"
            >
              {ctaText}
              <ArrowRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              href="#features"
              className="flex items-center gap-2 px-8 py-3.5 rounded-xl border border-[#1e1e24] hover:border-[#3f3f46] text-base font-medium text-[#a1a1aa] hover:text-white transition-all"
            >
              Découvrir les fonctionnalités
            </Link>
          </div>

          {/* Trust indicators */}
          <div className="flex items-center justify-center gap-8 mt-14 text-sm text-[#52525b]">
            <div className="flex items-center gap-2">
              <Shield size={16} className="text-green-500" />
              <span>Données sécurisées</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap size={16} className="text-amber-500" />
              <span>Résultats instantanés</span>
            </div>
            <div className="flex items-center gap-2">
              <Globe size={16} className="text-indigo-500" />
              <span>4 départements couverts</span>
            </div>
          </div>
        </div>

        {/* Hero visual — Dashboard mockup */}
        <div className="relative max-w-5xl mx-auto mt-20">
          <div className="rounded-2xl border border-[#1e1e24] bg-[#111114] shadow-2xl shadow-black/50 overflow-hidden">
            {/* Window chrome */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-[#1e1e24] bg-[#0a0a0c]">
              <div className="w-3 h-3 rounded-full bg-[#ef4444]/80" />
              <div className="w-3 h-3 rounded-full bg-[#eab308]/80" />
              <div className="w-3 h-3 rounded-full bg-[#22c55e]/80" />
              <div className="flex-1 mx-4">
                <div className="max-w-xs mx-auto h-5 rounded bg-[#1e1e24] flex items-center justify-center">
                  <span className="text-[10px] text-[#52525b]">lead-generator.app/dashboard</span>
                </div>
              </div>
            </div>
            {/* Mockup content */}
            <div className="p-6">
              {/* Stats row */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                {[
                  { label: 'Prospects', value: '2,847', color: 'text-indigo-400' },
                  { label: 'Emails trouvés', value: '1,923', color: 'text-green-400' },
                  { label: 'Téléphones', value: '2,156', color: 'text-[#fafafa]' },
                  { label: 'Taux enrichi', value: '67%', color: 'text-purple-400' },
                ].map((stat) => (
                  <div key={stat.label} className="bg-[#0a0a0c] border border-[#1e1e24] rounded-xl p-4 text-center">
                    <div className={`text-2xl font-bold font-mono ${stat.color}`}>{stat.value}</div>
                    <div className="text-xs text-[#52525b] mt-1">{stat.label}</div>
                  </div>
                ))}
              </div>
              {/* Table preview */}
              <div className="bg-[#0a0a0c] border border-[#1e1e24] rounded-xl overflow-hidden">
                <div className="grid grid-cols-5 gap-4 px-4 py-2 text-xs text-[#52525b] border-b border-[#1e1e24] bg-[#111114]">
                  <span>Nom</span><span>Email</span><span>Téléphone</span><span>Ville</span><span>Type</span>
                </div>
                {[
                  { nom: 'Hôtel Bakoua', email: 'contact@bakoua.fr', tel: '0596 66 00 00', ville: 'Martinique', type: 'B2B' },
                  { nom: 'Syndic Antilles Gestion', email: 'info@ag-syndic.gp', tel: '0590 82 14 50', ville: 'Guadeloupe', type: 'Copro' },
                  { nom: 'Garage Auto Plus', email: 'garage@autoplus.re', tel: '0262 55 30 00', ville: 'La Réunion', type: 'B2B' },
                ].map((row, i) => (
                  <div key={i} className="grid grid-cols-5 gap-4 px-4 py-3 text-xs border-b border-[#1e1e24]/50 last:border-0">
                    <span className="text-[#fafafa] font-medium">{row.nom}</span>
                    <span className="text-green-400">{row.email}</span>
                    <span className="text-[#a1a1aa]">{row.tel}</span>
                    <span className="text-[#a1a1aa]">{row.ville}</span>
                    <span className={`inline-flex w-fit px-2 py-0.5 rounded text-[10px] font-medium ${row.type === 'B2B' ? 'bg-blue-500/10 text-blue-400' : 'bg-purple-500/10 text-purple-400'}`}>{row.type}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* Glow under mockup */}
          <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-3/4 h-20 bg-indigo-600/20 blur-[60px]" />
        </div>
      </section>

      {/* Logos / Regions */}
      <section className="py-16 border-t border-b border-[#1e1e24]">
        <div className="max-w-4xl mx-auto px-6">
          <p className="text-center text-sm text-[#52525b] mb-8 uppercase tracking-wider font-medium">
            Couvre les 4 départements d'outre-mer
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {[
              { code: '971', name: 'Guadeloupe', icon: '🏝️' },
              { code: '972', name: 'Martinique', icon: '🌴' },
              { code: '973', name: 'Guyane', icon: '🌿' },
              { code: '974', name: 'La Réunion', icon: '🌋' },
            ].map((dept) => (
              <div key={dept.code} className="flex flex-col items-center gap-2 p-6 rounded-xl border border-[#1e1e24] bg-[#111114]/50 hover:border-indigo-600/30 transition">
                <span className="text-3xl">{dept.icon}</span>
                <span className="text-sm font-semibold text-[#fafafa]">{dept.name}</span>
                <span className="text-xs text-[#52525b]">{dept.code}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Tout ce qu'il faut pour
              <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent"> prospecter efficacement</span>
            </h2>
            <p className="text-[#a1a1aa] text-lg max-w-2xl mx-auto">
              Un outil complet qui automatise la recherche, l'enrichissement et l'export de vos prospects.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Search,
                title: 'Recherche Google Places',
                desc: 'Interroge automatiquement l\'API Google Places pour chaque combinaison département × catégorie. Des milliers de résultats en quelques minutes.',
                color: 'from-blue-500 to-cyan-500',
              },
              {
                icon: Mail,
                title: 'Enrichissement email',
                desc: 'Scraping intelligent des sites web : pages contact, mentions légales, patterns mailto. Scoring et validation automatique des emails trouvés.',
                color: 'from-green-500 to-emerald-500',
              },
              {
                icon: Building2,
                title: '13 catégories B2B',
                desc: 'Hôtels, restaurants, garages, cliniques, pharmacies, architectes... Toutes les catégories clés pour la prospection dans les DOM.',
                color: 'from-indigo-500 to-violet-500',
              },
              {
                icon: Users,
                title: '6 catégories Copro',
                desc: 'Syndics, administrateurs de biens, gestionnaires immobiliers. Ciblez le marché de la copropriété avec précision.',
                color: 'from-purple-500 to-pink-500',
              },
              {
                icon: Download,
                title: 'Export CSV & Zoho',
                desc: 'Exportez en CSV standard ou au format Zoho CRM. Intégrez directement vos leads dans votre pipeline commercial.',
                color: 'from-amber-500 to-orange-500',
              },
              {
                icon: Shield,
                title: 'Données privées & sécurisées',
                desc: 'Chaque utilisateur a son espace dédié. Vos prospects sont isolés et accessibles uniquement par vous.',
                color: 'from-rose-500 to-red-500',
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="group relative p-6 rounded-2xl border border-[#1e1e24] bg-[#111114] hover:border-[#3f3f46] transition-all duration-300"
              >
                <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${feature.color} mb-4`}>
                  <feature.icon size={22} className="text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-[#a1a1aa] leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-6 bg-[#0a0a0c]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Comment ça marche
            </h2>
            <p className="text-[#a1a1aa] text-lg">
              3 étapes simples pour remplir votre pipeline commercial
            </p>
          </div>

          <div className="space-y-12">
            {[
              {
                step: '01',
                title: 'Sélectionnez vos cibles',
                desc: 'Choisissez les départements et les catégories de prospects qui vous intéressent. B2B, copropriété, ou requêtes personnalisées.',
                icon: MapPin,
              },
              {
                step: '02',
                title: 'Lancez la recherche',
                desc: 'Notre moteur interroge Google Places et collecte automatiquement tous les établissements correspondants : nom, adresse, téléphone, site web.',
                icon: Search,
              },
              {
                step: '03',
                title: 'Enrichissez et exportez',
                desc: 'L\'enrichissement automatique scrape les sites web pour trouver les emails. Exportez le tout en CSV ou directement dans Zoho CRM.',
                icon: Download,
              },
            ].map((item, i) => (
              <div key={item.step} className="flex gap-8 items-start">
                <div className="flex-shrink-0 flex items-center justify-center w-14 h-14 rounded-2xl border border-indigo-500/30 bg-indigo-500/10">
                  <span className="text-xl font-bold text-indigo-400 font-mono">{item.step}</span>
                </div>
                <div className="flex-1 pt-1">
                  <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                  <p className="text-[#a1a1aa] leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { value: '19', label: 'Catégories de recherche', suffix: '' },
              { value: '4', label: 'Départements couverts', suffix: '' },
              { value: '67', label: 'Taux d\'enrichissement email', suffix: '%' },
              { value: '100', label: 'Données isolées par user', suffix: '%' },
            ].map((stat) => (
              <div key={stat.label} className="text-center p-8 rounded-2xl border border-[#1e1e24] bg-[#111114]">
                <div className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent font-mono">
                  {stat.value}{stat.suffix}
                </div>
                <div className="text-sm text-[#71717a] mt-2">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use cases */}
      <section className="py-24 px-6 bg-[#0a0a0c]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Pour qui est Lead Generator ?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: 'Commerciaux terrain',
                desc: 'Préparez vos tournées avec des listes de prospects qualifiés et leurs coordonnées complètes.',
                icon: BarChart3,
              },
              {
                title: 'Agences immobilières',
                desc: 'Identifiez tous les syndics et gestionnaires de copropriétés dans votre zone.',
                icon: Building2,
              },
              {
                title: 'Prestataires B2B',
                desc: 'Trouvez vos futurs clients parmi les hôtels, restaurants, garages et commerces des DOM.',
                icon: Users,
              },
            ].map((useCase) => (
              <div key={useCase.title} className="p-8 rounded-2xl border border-[#1e1e24] bg-[#111114] text-center">
                <div className="inline-flex p-4 rounded-2xl bg-indigo-500/10 mb-6">
                  <useCase.icon size={28} className="text-indigo-400" />
                </div>
                <h3 className="text-lg font-semibold mb-3">{useCase.title}</h3>
                <p className="text-sm text-[#a1a1aa] leading-relaxed">{useCase.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="relative p-12 rounded-3xl border border-indigo-500/20 bg-gradient-to-b from-indigo-500/10 to-transparent overflow-hidden">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMyMjIiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-50" />
            <div className="relative">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Prêt à booster votre prospection ?
              </h2>
              <p className="text-[#a1a1aa] text-lg mb-8 max-w-xl mx-auto">
                Créez votre compte en 30 secondes et commencez à générer des leads qualifiés dans les DOM-TOM.
              </p>
              <Link
                href={ctaHref}
                className="group inline-flex items-center gap-2 px-10 py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-lg font-semibold transition-all shadow-lg shadow-indigo-600/25 hover:shadow-indigo-500/40"
              >
                {ctaText}
                <ArrowRight size={20} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <p className="text-xs text-[#52525b] mt-4">
                Aucune carte bancaire requise
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#1e1e24] py-12 px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600">
              <span className="text-xs font-bold text-white">LG</span>
            </div>
            <span className="text-sm font-medium text-[#a1a1aa]">Lead Generator</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-[#52525b]">
            <span>Guadeloupe</span>
            <span>Martinique</span>
            <span>Guyane</span>
            <span>La Réunion</span>
          </div>
          <p className="text-xs text-[#52525b]">
            &copy; {new Date().getFullYear()} Lead Generator. Tous droits réservés.
          </p>
        </div>
      </footer>
    </div>
  );
}
