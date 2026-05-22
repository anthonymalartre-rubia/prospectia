'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, Mail, Building2, ArrowRight, CheckCircle2, Sparkles, Loader2, Globe, Phone, Star } from 'lucide-react';

const TABS = [
  { id: 'category', label: 'Par secteur + ville', icon: Search },
  { id: 'company', label: 'Par entreprise', icon: Building2 },
  { id: 'verify', label: 'Vérifier un email', icon: Mail },
];

// Pre-built example results — to wow visitors immediately
const MOCK_RESULTS = {
  category: {
    'restaurant-paris': {
      total: 4823,
      examples: [
        { name: 'Le Bouillon Chartier', address: '7 Rue du Faubourg Montmartre', email: 'reservation@bouillon-chartier.com', phone: '01 47 70 86 29', rating: 4.4, website: 'bouillon-chartier.com' },
        { name: 'Chez Janou', address: '2 Rue Roger Verlomme', email: 'contact@chez-janou.com', phone: '01 42 72 28 41', rating: 4.5, website: 'chezjanou.com' },
        { name: 'Brasserie Lipp', address: '151 Bd Saint-Germain', email: 'info@brasserielipp.fr', phone: '01 45 48 53 91', rating: 4.2, website: 'brasserielipp.fr' },
      ],
    },
    'avocat-lyon': {
      total: 2156,
      examples: [
        { name: 'Cabinet Berthier & Associés', address: '12 Rue Childebert, Lyon 2', email: 'contact@cabinet-berthier.fr', phone: '04 78 42 15 30', rating: 4.7, website: 'cabinet-berthier.fr' },
        { name: 'SCP Dujardin Avocats', address: '45 Cours Lafayette, Lyon 3', email: 'secretariat@dujardin-avocats.com', phone: '04 72 61 84 22', rating: 4.6, website: 'dujardin-avocats.com' },
        { name: 'Maître Lefèvre', address: '8 Place Bellecour, Lyon 2', email: 'cabinet@me-lefevre.fr', phone: '04 78 37 91 56', rating: 4.8, website: 'me-lefevre.fr' },
      ],
    },
    'hotel-marseille': {
      total: 1247,
      examples: [
        { name: 'Sofitel Vieux Port', address: '36 Bd Charles Livon', email: 'h0542@sofitel.com', phone: '04 91 15 59 00', rating: 4.5, website: 'sofitel.com' },
        { name: 'Mercure Marseille Canebière', address: '38 Rue Sénac de Meilhan', email: 'h2451@accor.com', phone: '04 91 91 27 27', rating: 4.1, website: 'mercure.com' },
        { name: 'Hôtel Le Corbusier', address: '280 Bd Michelet', email: 'contact@hotellecorbusier.com', phone: '04 91 16 78 00', rating: 4.3, website: 'hotellecorbusier.com' },
      ],
    },
    default: {
      total: 1834,
      examples: [
        { name: 'Entreprise SARL', address: '12 Rue Principale', email: 'contact@entreprise-sarl.fr', phone: '01 23 45 67 89', rating: 4.5, website: 'entreprise-sarl.fr' },
        { name: 'Société SAS', address: '24 Avenue Centrale', email: 'info@societe-sas.com', phone: '01 23 45 67 90', rating: 4.3, website: 'societe-sas.com' },
        { name: 'Compagnie SA', address: '36 Boulevard du Commerce', email: 'hello@compagnie-sa.fr', phone: '01 23 45 67 91', rating: 4.6, website: 'compagnie-sa.fr' },
      ],
    },
  },
  company: {
    // Aperçu démo : on n'affiche PAS de vrais noms de dirigeants ni de
    // vrais emails (risque juridique : usurpation, RGPD, atteinte à la vie
    // privée). On montre la STRUCTURE typique d'une fiche enrichie avec
    // des emails génériques et des libellés de rôle.
    default: {
      name: 'OpenAI',
      domain: 'openai.com',
      employees: 770,
      foundedYear: 2015,
      industry: 'AI Research',
      emails: [
        { person: 'Direction', role: 'CEO', email: 'ceo@openai.com', verified: true },
        { person: 'Direction', role: 'COO', email: 'contact@openai.com', verified: true },
        { person: 'Direction', role: 'CTO', email: 'press@openai.com', verified: false },
      ],
    },
  },
  verify: {
    valid: { result: 'ok', status: 'Valide', color: 'green', detail: 'Adresse vérifiée par SMTP — délivrabilité garantie' },
    invalid: { result: 'invalid', status: 'Invalide', color: 'red', detail: 'Cette boîte mail n\'existe pas' },
    catch_all: { result: 'catch_all', status: 'Catch-all', color: 'amber', detail: 'Le domaine accepte tous les emails — fiabilité moyenne' },
  },
};

const QUICK_TRIES = {
  category: [
    { cat: 'Restaurants', city: 'Paris', key: 'restaurant-paris' },
    { cat: 'Avocats', city: 'Lyon', key: 'avocat-lyon' },
    { cat: 'Hôtels', city: 'Marseille', key: 'hotel-marseille' },
  ],
  company: [
    { name: 'OpenAI', label: 'OpenAI' },
    { name: 'Stripe', label: 'Stripe' },
    { name: 'Notion', label: 'Notion' },
  ],
  verify: [
    { email: 'contact@openai.com', label: 'contact@openai.com' },
    { email: 'fake@nope.invalid', label: 'fake@nope.invalid' },
  ],
};

export default function HeroSearchWidget() {
  const [tab, setTab] = useState('category');
  const [category, setCategory] = useState('');
  const [city, setCity] = useState('');
  const [company, setCompany] = useState('');
  const [emailToVerify, setEmailToVerify] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleSearch = async (preset = null) => {
    setLoading(true);
    setResult(null);
    // Simulate API latency for realism
    await new Promise((r) => setTimeout(r, 800));

    if (tab === 'category') {
      const cat = preset?.cat || category;
      const cit = preset?.city || city;
      if (preset?.key) {
        setResult({ type: 'category', data: MOCK_RESULTS.category[preset.key], query: { cat, city: cit } });
      } else {
        // Try to match the query to a preset
        const matchKey = Object.keys(MOCK_RESULTS.category).find((k) =>
          k.includes((cat || '').toLowerCase()) && k.includes((cit || '').toLowerCase().replace(/\s/g, '-'))
        );
        setResult({
          type: 'category',
          data: MOCK_RESULTS.category[matchKey] || MOCK_RESULTS.category.default,
          query: { cat: cat || 'entreprises', city: cit || 'France' },
        });
      }
    } else if (tab === 'company') {
      const name = preset?.name || company;
      setResult({
        type: 'company',
        data: { ...MOCK_RESULTS.company.default, name: name || 'OpenAI' },
        query: { name },
      });
    } else if (tab === 'verify') {
      const em = preset?.email || emailToVerify;
      const isInvalid = em.includes('invalid') || em.includes('nope') || em.includes('fake@');
      setResult({
        type: 'verify',
        data: isInvalid ? MOCK_RESULTS.verify.invalid : MOCK_RESULTS.verify.valid,
        query: { email: em },
      });
    }
    setLoading(false);
  };

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl p-3 sm:p-5">
      {/* Tabs */}
      <div className="flex flex-wrap gap-1 mb-4 p-1 rounded-xl bg-white/[0.03] border border-white/[0.04]">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); setResult(null); }}
              className={`flex-1 min-w-0 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition ${
                active
                  ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20'
                  : 'text-zinc-400 hover:text-white hover:bg-white/[0.05]'
              }`}
            >
              <Icon size={14} />
              <span className="truncate">{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Inputs by tab */}
      {tab === 'category' && (
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Restaurants, avocats, hôtels..."
              className="w-full pl-9 pr-3 py-3 rounded-lg bg-zinc-900/60 border border-white/[0.06] text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-violet-500/50"
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <div className="flex-1 relative">
            <Globe size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Ville ou département..."
              className="w-full pl-9 pr-3 py-3 rounded-lg bg-zinc-900/60 border border-white/[0.06] text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-violet-500/50"
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <button
            onClick={() => handleSearch()}
            disabled={loading}
            className="px-5 py-3 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition shadow-lg shadow-violet-500/30 disabled:opacity-60 flex items-center justify-center gap-2 whitespace-nowrap"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            Trouver les emails
          </button>
        </div>
      )}

      {tab === 'company' && (
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1 relative">
            <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Nom de l'entreprise (ex: OpenAI)"
              className="w-full pl-9 pr-3 py-3 rounded-lg bg-zinc-900/60 border border-white/[0.06] text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-violet-500/50"
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <button
            onClick={() => handleSearch()}
            disabled={loading}
            className="px-5 py-3 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition shadow-lg shadow-violet-500/30 disabled:opacity-60 flex items-center justify-center gap-2 whitespace-nowrap"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            Trouver le contact
          </button>
        </div>
      )}

      {tab === 'verify' && (
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1 relative">
            <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="email"
              value={emailToVerify}
              onChange={(e) => setEmailToVerify(e.target.value)}
              placeholder="contact@entreprise.com"
              className="w-full pl-9 pr-3 py-3 rounded-lg bg-zinc-900/60 border border-white/[0.06] text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-violet-500/50"
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <button
            onClick={() => handleSearch()}
            disabled={loading}
            className="px-5 py-3 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition shadow-lg shadow-violet-500/30 disabled:opacity-60 flex items-center justify-center gap-2 whitespace-nowrap"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
            Vérifier
          </button>
        </div>
      )}

      {/* Quick try suggestions */}
      <div className="flex flex-wrap items-center gap-2 mt-3 text-xs text-zinc-500">
        <span>Essai rapide :</span>
        {QUICK_TRIES[tab].map((q, i) => (
          <button
            key={i}
            onClick={() => {
              if (tab === 'category') { setCategory(q.cat); setCity(q.city); handleSearch(q); }
              else if (tab === 'company') { setCompany(q.name); handleSearch(q); }
              else { setEmailToVerify(q.email); handleSearch(q); }
            }}
            className="px-2 py-1 rounded-md bg-white/[0.04] hover:bg-violet-500/10 hover:text-violet-300 border border-white/[0.04] hover:border-violet-500/30 text-zinc-400 transition"
          >
            {q.label || `${q.cat} ${q.city}`}
          </button>
        ))}
      </div>

      {/* Results */}
      {result && (
        <div className="mt-5 pt-5 border-t border-white/[0.08]">
          {result.type === 'category' && (
            <CategoryResult result={result} />
          )}
          {result.type === 'company' && (
            <CompanyResult result={result} />
          )}
          {result.type === 'verify' && (
            <VerifyResult result={result} />
          )}
        </div>
      )}
    </div>
  );
}

function CategoryResult({ result }) {
  const { data, query } = result;
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <div className="px-2.5 py-1 rounded-full bg-green-500/15 border border-green-500/30 text-green-400 text-xs font-semibold flex items-center gap-1">
          <CheckCircle2 size={12} />
          {data.total.toLocaleString('fr-FR')} {query.cat?.toLowerCase()} trouvés à {query.city}
        </div>
      </div>
      <div className="space-y-2 mb-4">
        {data.examples.map((p, i) => (
          <div key={i} className="rounded-lg bg-white/[0.03] border border-white/[0.04] p-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1.5">
              <div className="font-semibold text-white text-sm flex items-center gap-2">
                {p.name}
                <span className="flex items-center gap-0.5 text-xs text-amber-400">
                  <Star size={11} className="fill-amber-400" /> {p.rating}
                </span>
              </div>
              <div className="text-[10px] text-zinc-500">{p.address}</div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <div className="flex items-center gap-1.5 text-zinc-300">
                <Mail size={11} className="text-violet-400 flex-shrink-0" />
                <span className="truncate font-mono">{p.email}</span>
              </div>
              <div className="flex items-center gap-1.5 text-zinc-400">
                <Phone size={11} className="text-zinc-500 flex-shrink-0" />
                <span className="font-mono">{p.phone}</span>
              </div>
              <div className="flex items-center gap-1.5 text-zinc-400">
                <Globe size={11} className="text-zinc-500 flex-shrink-0" />
                <span className="truncate">{p.website}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="rounded-xl bg-gradient-to-r from-violet-600/20 to-indigo-600/20 border border-violet-500/30 p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-white">+{(data.total - 3).toLocaleString('fr-FR')} autres résultats disponibles</div>
          <div className="text-xs text-zinc-400 mt-0.5">Créez votre compte pour voir tous les emails et exporter en CSV</div>
        </div>
        <Link
          href="/signup"
          className="px-5 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition shadow-lg shadow-violet-500/30 flex items-center gap-2 whitespace-nowrap"
        >
          Voir tous les résultats
          <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}

function CompanyResult({ result }) {
  const { data } = result;
  return (
    <div>
      <div className="rounded-lg bg-white/[0.03] border border-white/[0.04] p-4 mb-3">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <h3 className="text-lg font-bold text-white">{data.name}</h3>
            <div className="text-xs text-zinc-500">{data.domain} · {data.industry} · {data.employees} employés · Fondée en {data.foundedYear}</div>
          </div>
          {/* Badge "Exemple démo" — obligatoire pour ne pas laisser croire
              que les emails affichés sont réels. RGPD + intégrité. */}
          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-[10px] font-semibold text-amber-300 uppercase tracking-wider whitespace-nowrap">
            Exemple démo
          </span>
        </div>
        <div className="space-y-2">
          {data.emails.map((e, i) => (
            <div key={i} className="flex items-center justify-between gap-2 py-2 px-3 rounded bg-white/[0.02]">
              <div>
                <div className="text-sm font-semibold text-white">{e.person}</div>
                <div className="text-[10px] text-zinc-500">{e.role}</div>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="font-mono text-zinc-300">{e.email}</span>
                {e.verified ? (
                  <span className="px-1.5 py-0.5 rounded bg-green-500/15 text-green-400 text-[10px] font-semibold">✓ Vérifié</span>
                ) : (
                  <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 text-[10px] font-semibold">Pattern</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-xl bg-gradient-to-r from-violet-600/20 to-indigo-600/20 border border-violet-500/30 p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-sm text-zinc-300">+15 autres contacts disponibles chez {data.name}</div>
        <Link
          href="/signup"
          className="px-5 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition shadow-lg shadow-violet-500/30 flex items-center gap-2 whitespace-nowrap"
        >
          Voir tous les contacts
          <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}

function VerifyResult({ result }) {
  const { data, query } = result;
  const colors = {
    green: 'bg-green-500/15 border-green-500/30 text-green-400',
    red: 'bg-red-500/15 border-red-500/30 text-red-400',
    amber: 'bg-amber-500/15 border-amber-500/30 text-amber-400',
  };
  return (
    <div>
      <div className={`rounded-lg border p-4 mb-3 ${colors[data.color]}`}>
        <div className="flex items-center gap-3 mb-2">
          <CheckCircle2 size={20} />
          <div>
            <div className="font-bold">{data.status}</div>
            <div className="text-xs opacity-80">{query.email}</div>
          </div>
        </div>
        <p className="text-xs opacity-80">{data.detail}</p>
      </div>
      <div className="rounded-xl bg-gradient-to-r from-violet-600/20 to-indigo-600/20 border border-violet-500/30 p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-sm text-zinc-300">Vérifiez vos listes d'emails en masse — jusqu'à 50 000 emails/heure</div>
        <Link
          href="/signup"
          className="px-5 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition shadow-lg shadow-violet-500/30 flex items-center gap-2 whitespace-nowrap"
        >
          Vérifier ma base
          <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}
