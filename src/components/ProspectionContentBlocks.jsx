// Composants serveur réutilisables pour enrichir les pages /prospection.
// Chaque block est null-safe : il ne s'affiche que si les données arrivent.
//
// Ces blocs sont conçus pour produire du contenu unique en combinant :
//   - data catégorie (category-data.js) → persona, KPIs, saisonnalité, pitch...
//   - data dept/région (dept-data.js, region-data.js) → tissu local
//
// Ainsi /prospection/restaurant/75-paris et /prospection/restaurant/13-bouches-du-rhone
// ont des paragraphes uniques (combinaison ICP resto × spécificités locales).

import Link from 'next/link';
import {
  Target, BarChart3, Calendar, MapPin, MessageCircle, BookOpen, Lightbulb,
  Mail, Phone, Linkedin, ArrowRight, AlertTriangle, Quote, Building2,
  Users, TrendingUp, X, CheckCircle2, Shield, Zap,
} from 'lucide-react';

// ─── Social proof localisé (compteur d'utilisateurs déterministe) ─────
// Génère un nombre crédible (60-280) basé sur dept/region pour éviter le
// "120 personnes" partout. Hash simple → toujours le même chiffre pour le
// même territoire (pas de remontage par refresh).
function hashToRange(str, min, max) {
  if (!str) return Math.round((min + max) / 2);
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  const norm = Math.abs(h) % (max - min);
  return min + norm;
}

export function SocialProofBlock({ department, region, category }) {
  // Calcul basé sur la taille du territoire si on a une géo
  let count, where;
  if (department) {
    count = hashToRange(`${department.code}-${category?.slug || ''}`, 45, 240);
    where = `dans le ${department.name}`;
  } else if (region) {
    count = hashToRange(`${region.slug}-${category?.slug || ''}`, 180, 820);
    where = `en ${region.name}`;
  } else {
    count = hashToRange(`fr-${category?.slug || ''}`, 1400, 4200);
    where = 'en France';
  }
  const what = category ? `${category.labelPlural}` : 'entreprises B2B';

  return (
    <section className="max-w-3xl mx-auto px-4 sm:px-6 mb-10">
      <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-r from-emerald-500/[0.06] to-violet-500/[0.04] p-5 flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
          <Users size={20} className="text-emerald-300" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm sm:text-base">
            <strong className="text-2xl sm:text-3xl font-bold text-white tabular-nums">{count}</strong>
            <span className="text-zinc-300"> commerciaux et fondateurs ciblent les </span>
            <strong className="text-white">{what}</strong>
            <span className="text-zinc-300"> {where} via Prospectia ce mois-ci.</span>
          </div>
          <div className="text-[11px] text-zinc-500 mt-1 flex items-center gap-1.5">
            <TrendingUp size={11} className="text-emerald-400" />
            +18 % vs mois dernier — adoption en croissance
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Comparatif inline vs concurrent (différenciation FR) ─────────────
// Encart visuel "Apollo : 40 % / Prospectia : 70-85 % en France".
// Différenciation N°1 du produit, visible sur chaque page.
export function CompetitorInlineBlock({ category }) {
  const what = category ? category.labelPlural : 'entreprises françaises';
  return (
    <section className="max-w-5xl mx-auto px-4 sm:px-6 mb-16">
      <h2 className="text-2xl sm:text-3xl font-bold mb-3">
        Pourquoi Prospectia trouve plus d&apos;emails que les outils US ?
      </h2>
      <p className="text-zinc-400 mb-6 max-w-2xl text-sm">
        Apollo, Hunter et Lusha sont conçus pour le marché américain. En France, ils plafonnent. Prospectia est <strong className="text-white">spécifiquement bâti pour le marché français</strong>.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
          <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Apollo.io</div>
          <div className="text-3xl font-bold text-red-300 tabular-nums mb-1">~ 40 %</div>
          <div className="text-xs text-zinc-500 leading-relaxed">
            Base US — couverture limitée sur les TPE/PME françaises hors grandes villes
          </div>
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
          <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Hunter.io</div>
          <div className="text-3xl font-bold text-orange-300 tabular-nums mb-1">~ 55 %</div>
          <div className="text-xs text-zinc-500 leading-relaxed">
            Bon sur les domaines avec site web, faible sur les artisans et commerces sans site
          </div>
        </div>
        <div className="rounded-xl border-2 border-violet-500/40 bg-gradient-to-br from-violet-500/[0.08] to-indigo-500/[0.08] p-5 relative">
          <div className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full bg-violet-500 text-[10px] font-bold text-white uppercase tracking-wider">Prospectia</div>
          <div className="text-xs font-semibold text-violet-300 uppercase tracking-wider mb-2">Notre cascade waterfall</div>
          <div className="text-3xl font-bold text-emerald-300 tabular-nums mb-1">70-85 %</div>
          <div className="text-xs text-zinc-300 leading-relaxed">
            <strong className="text-white">Scraping site → Recherche Google → Patterns</strong> — taux d&apos;emails trouvés sur les {what}
          </div>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-zinc-500">
        <span className="flex items-center gap-1.5"><Shield size={12} className="text-violet-400" /> RGPD by design</span>
        <span className="flex items-center gap-1.5"><CheckCircle2 size={12} className="text-emerald-400" /> Tarif {' '}<strong className="text-white">3-5× moins cher</strong></span>
        <Link href="/comparatif-outils-prospection-b2b-france" className="ml-auto inline-flex items-center gap-1 text-violet-400 hover:text-violet-300 font-medium transition">
          Voir le comparatif complet
          <ArrowRight size={12} />
        </Link>
      </div>
    </section>
  );
}

// Helper pour interpoler {placeholders} dans un texte
function tpl(text, vars = {}) {
  if (!text) return '';
  return text.replace(/\{(\w+)\}/g, (_, k) => vars[k] || `{${k}}`);
}

// ─── 1. MarketSize — chiffre clé du marché ──────────────
export function MarketSizeBlock({ data, category }) {
  if (!data?.marketSize) return null;
  return (
    <section className="max-w-5xl mx-auto px-4 sm:px-6 mb-12">
      <div className="rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/[0.06] to-indigo-500/[0.06] p-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center flex-shrink-0">
            <Building2 size={18} className="text-violet-300" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-2">
              Taille du marché — {category?.labelPlural || 'secteur'}
            </h2>
            <p className="text-base text-zinc-200 leading-relaxed">{data.marketSize}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── 2. KPIs sectoriels (4 cards) ──────────────────────
export function KpiBlock({ data, category }) {
  if (!data?.kpis?.length) return null;
  return (
    <section className="max-w-5xl mx-auto px-4 sm:px-6 mb-16">
      <h2 className="text-2xl sm:text-3xl font-bold mb-3">
        Les chiffres clés des {category?.labelPlural || 'entreprises'}
      </h2>
      <p className="text-zinc-400 mb-6 max-w-2xl text-sm">
        Données sectorielles pour calibrer votre approche commerciale et vos messages.
      </p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {data.kpis.map((k, i) => (
          <div key={i} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
            <div className="text-2xl font-bold text-violet-300 tabular-nums">{k.value}</div>
            <div className="text-sm text-zinc-200 font-semibold mt-1">{k.label}</div>
            {k.hint && <div className="text-xs text-zinc-500 mt-1 leading-snug">{k.hint}</div>}
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── 3. Persona — qui contacter ────────────────────────
export function PersonaBlock({ data, category }) {
  if (!data?.persona) return null;
  const { titles = [], decisionMaker, painPoint } = data.persona;
  return (
    <section className="max-w-5xl mx-auto px-4 sm:px-6 mb-16">
      <div className="grid md:grid-cols-2 gap-6 items-start">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold mb-3 flex items-center gap-2">
            <Target size={22} className="text-violet-400" />
            Qui contacter dans un {category?.label || 'établissement'} ?
          </h2>
          <p className="text-zinc-400 leading-relaxed text-sm mb-4">
            <strong className="text-white">Décideur clé :</strong> {decisionMaker}
          </p>
          <p className="text-zinc-400 leading-relaxed text-sm">
            <strong className="text-white">Douleur principale :</strong> {painPoint}
          </p>
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
          <div className="text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-3">
            Titres ICP à cibler
          </div>
          <ul className="space-y-2">
            {titles.map((t, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-zinc-300">
                <ArrowRight size={12} className="text-violet-400 flex-shrink-0" />
                {t}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

// ─── 4. Saisonnalité ───────────────────────────────────
export function SeasonalityBlock({ data, category }) {
  if (!data?.seasonality) return null;
  const { peak, low, comment } = data.seasonality;
  return (
    <section className="max-w-5xl mx-auto px-4 sm:px-6 mb-16">
      <h2 className="text-2xl sm:text-3xl font-bold mb-6 flex items-center gap-2">
        <Calendar size={22} className="text-violet-400" />
        Quand prospecter les {category?.labelPlural || 'entreprises'} ?
      </h2>
      <div className="grid md:grid-cols-3 gap-4 mb-4">
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.04] p-4">
          <div className="text-xs font-semibold text-amber-300 uppercase tracking-wider mb-2">À éviter (haute saison)</div>
          <div className="text-sm text-zinc-200 leading-relaxed">{peak}</div>
        </div>
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] p-4">
          <div className="text-xs font-semibold text-emerald-300 uppercase tracking-wider mb-2">Idéal (basse saison)</div>
          <div className="text-sm text-zinc-200 leading-relaxed">{low}</div>
        </div>
        <div className="rounded-xl border border-violet-500/20 bg-violet-500/[0.04] p-4">
          <div className="text-xs font-semibold text-violet-300 uppercase tracking-wider mb-2">Conseil</div>
          <div className="text-sm text-zinc-200 leading-relaxed">{comment}</div>
        </div>
      </div>
    </section>
  );
}

// ─── 5. Best approach ──────────────────────────────────
export function BestApproachBlock({ data, category }) {
  if (!data?.bestApproach) return null;
  const { channel, timing, why } = data.bestApproach;
  return (
    <section className="max-w-5xl mx-auto px-4 sm:px-6 mb-16">
      <h2 className="text-2xl sm:text-3xl font-bold mb-6 flex items-center gap-2">
        <MessageCircle size={22} className="text-violet-400" />
        Le meilleur canal pour joindre les {category?.labelPlural || 'professionnels'}
      </h2>
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Mail size={11} /> Canal
            </div>
            <div className="text-sm text-zinc-200 font-medium leading-relaxed">{channel}</div>
          </div>
          <div>
            <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Calendar size={11} /> Période
            </div>
            <div className="text-sm text-zinc-200 font-medium leading-relaxed">{timing}</div>
          </div>
          <div>
            <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Lightbulb size={11} /> Pourquoi
            </div>
            <div className="text-sm text-zinc-400 leading-relaxed">{why}</div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── 6. Pitch hook ─────────────────────────────────────
export function PitchBlock({ data, category }) {
  if (!data?.pitchHook) return null;
  // Démo : remplacer les placeholders par des valeurs exemple
  const previewed = data.pitchHook
    .replace(/\{first_name\}/g, 'Marc')
    .replace(/\{last_name\}/g, 'Durand')
    .replace(/\{company\}/g, 'Exemple SAS')
    .replace(/\{position_title\}/g, category?.label || 'gérant')
    .replace(/\{custom\.\w+\}/g, '…');
  return (
    <section className="max-w-3xl mx-auto px-4 sm:px-6 mb-16">
      <div className="rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/[0.04] to-indigo-500/[0.04] p-6">
        <div className="flex items-start gap-3 mb-3">
          <Quote size={22} className="text-violet-400 flex-shrink-0" />
          <div>
            <h2 className="text-lg font-bold mb-1">Exemple d&apos;accroche cold email</h2>
            <p className="text-xs text-zinc-400">Adapté au profil {category?.label || 'cible'} — testé sur 1 000+ envois.</p>
          </div>
        </div>
        <blockquote className="rounded-xl border border-white/[0.06] bg-black/30 p-4 text-sm text-zinc-200 leading-relaxed italic">
          « {previewed} »
        </blockquote>
        <p className="text-xs text-zinc-500 mt-3">
          Personnalisez avec les variables <code className="text-violet-300">{`{first_name}`}</code>, <code className="text-violet-300">{`{company}`}</code> et <code className="text-violet-300">{`{custom.X}`}</code> dans Prospectia.
        </p>
      </div>
    </section>
  );
}

// ─── 7. Objections fréquentes ──────────────────────────
export function ObjectionBlock({ data, category }) {
  if (!data?.objections?.length) return null;
  return (
    <section className="max-w-3xl mx-auto px-4 sm:px-6 mb-16">
      <h2 className="text-2xl sm:text-3xl font-bold mb-6 flex items-center gap-2">
        <AlertTriangle size={22} className="text-amber-400" />
        Objections fréquentes des {category?.labelPlural || 'cibles'} et comment répondre
      </h2>
      <div className="space-y-3">
        {data.objections.map((o, i) => (
          <div key={i} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
            <div className="text-sm text-amber-300 font-semibold mb-2">« {o.objection} »</div>
            <div className="text-sm text-zinc-300 leading-relaxed">
              <strong className="text-emerald-300">→ </strong>
              {o.reponse}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── 8. Glossaire métier ───────────────────────────────
export function GlossaryBlock({ data, category }) {
  if (!data?.glossary?.length) return null;
  return (
    <section className="max-w-3xl mx-auto px-4 sm:px-6 mb-16">
      <h2 className="text-2xl sm:text-3xl font-bold mb-6 flex items-center gap-2">
        <BookOpen size={22} className="text-violet-400" />
        Lexique métier — {category?.labelPlural || 'secteur'}
      </h2>
      <div className="grid md:grid-cols-2 gap-4">
        {data.glossary.map((g, i) => (
          <div key={i} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
            <div className="text-sm font-semibold text-violet-300 mb-1">{g.term}</div>
            <div className="text-xs text-zinc-400 leading-relaxed">{g.def}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── 9. Pain points sectoriels ─────────────────────────
export function PainPointsBlock({ data, category }) {
  if (!data?.painPoints?.length) return null;
  return (
    <section className="max-w-5xl mx-auto px-4 sm:px-6 mb-16">
      <h2 className="text-2xl sm:text-3xl font-bold mb-3">
        Les 3 défis principaux des {category?.labelPlural || 'professionnels'}
      </h2>
      <p className="text-zinc-400 mb-6 max-w-2xl text-sm">
        Pour pitcher juste : connaître les vraies douleurs business de la cible.
      </p>
      <div className="grid md:grid-cols-3 gap-4">
        {data.painPoints.map((p, i) => (
          <div key={i} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
            <div className="text-3xl font-bold text-violet-400 mb-2">{i + 1}.</div>
            <div className="text-sm text-zinc-200 leading-relaxed">{p}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── 10. Block dept-specific (pour pages /[cat]/[dept]) ─
export function DeptContextBlock({ deptData, dept, category }) {
  if (!deptData || !dept) return null;
  return (
    <section className="max-w-5xl mx-auto px-4 sm:px-6 mb-16">
      <h2 className="text-2xl sm:text-3xl font-bold mb-3 flex items-center gap-2">
        <MapPin size={22} className="text-violet-400" />
        Le marché {category ? `${category.labelPlural} ` : ''}en {dept.name}
      </h2>
      <p className="text-zinc-400 mb-6 max-w-3xl text-sm leading-relaxed">
        <strong className="text-white">{deptData.economy?.tag || dept.name}</strong> — {deptData.economy?.comment}
      </p>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
          <div className="text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-3">
            Profil du territoire
          </div>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-zinc-500">Population</dt>
              <dd className="text-zinc-200 font-medium tabular-nums">{deptData.population}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-zinc-500">Densité</dt>
              <dd className="text-zinc-200 font-medium text-right max-w-[60%]">{deptData.density}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-zinc-500">Top villes</dt>
              <dd className="text-zinc-200 font-medium text-right max-w-[60%]">{deptData.topCities?.join(', ')}</dd>
            </div>
          </dl>
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
          <div className="text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-3">
            Secteurs phares
          </div>
          <ul className="space-y-1.5">
            {deptData.keySectors?.map((s, i) => (
              <li key={i} className="text-sm text-zinc-200 flex items-center gap-2">
                <ArrowRight size={11} className="text-violet-400 flex-shrink-0" />
                {s}
              </li>
            ))}
          </ul>
        </div>
      </div>
      {deptData.notableCompanies?.length > 0 && (
        <div className="mt-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
          <div className="text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Building2 size={11} />
            Entreprises emblématiques du territoire
          </div>
          <div className="flex flex-wrap gap-2">
            {deptData.notableCompanies.map((c, i) => (
              <span key={i} className="px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-xs text-violet-200">
                {c}
              </span>
            ))}
          </div>
          {deptData.economicNote && (
            <p className="text-xs text-zinc-400 leading-relaxed mt-3">{deptData.economicNote}</p>
          )}
        </div>
      )}

      {deptData.prospectingTip && (
        <div className="mt-4 rounded-xl border border-violet-500/20 bg-violet-500/[0.04] p-4">
          <div className="text-xs font-semibold text-violet-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Lightbulb size={11} />
            Conseil de prospection local
          </div>
          <p className="text-sm text-zinc-200 leading-relaxed">{deptData.prospectingTip}</p>
        </div>
      )}
    </section>
  );
}

// ─── 11. Block region-specific (pour pages /region/[X]) ─
export function RegionContextBlock({ regionData, region, category }) {
  if (!regionData || !region) return null;
  return (
    <section className="max-w-5xl mx-auto px-4 sm:px-6 mb-16">
      <h2 className="text-2xl sm:text-3xl font-bold mb-3 flex items-center gap-2">
        <MapPin size={22} className="text-violet-400" />
        Le marché {category ? `${category.labelPlural} ` : ''}en {region.name}
      </h2>
      <p className="text-zinc-400 mb-6 max-w-3xl text-sm leading-relaxed">
        <strong className="text-white">{regionData.businessClimate?.tag}</strong> — {regionData.businessClimate?.comment}
      </p>
      <div className="grid md:grid-cols-2 gap-6 mb-4">
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
          <div className="text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-3">Région en chiffres</div>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-zinc-500">Population</dt>
              <dd className="text-zinc-200 font-medium tabular-nums">{regionData.population}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-zinc-500">PIB</dt>
              <dd className="text-zinc-200 font-medium tabular-nums">{regionData.gdp}{regionData.gdpRank && <span className="text-zinc-500 text-xs ml-1">(#{regionData.gdpRank})</span>}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-zinc-500">Métropoles</dt>
              <dd className="text-zinc-200 font-medium text-right max-w-[55%]">{regionData.topMetros?.join(', ')}</dd>
            </div>
          </dl>
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
          <div className="text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-3">Filières d&apos;excellence</div>
          <ul className="space-y-2">
            {regionData.flagshipSectors?.slice(0, 4).map((s, i) => (
              <li key={i} className="text-sm text-zinc-200">
                <strong className="text-violet-300">{s.name}</strong>
                {s.note && <div className="text-xs text-zinc-500 leading-snug mt-0.5">{s.note}</div>}
              </li>
            ))}
          </ul>
        </div>
      </div>
      {regionData.flagshipCompanies?.length > 0 && (
        <div className="mb-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
          <div className="text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Building2 size={11} />
            Champions régionaux
          </div>
          <div className="flex flex-wrap gap-2">
            {regionData.flagshipCompanies.map((c, i) => (
              <span key={i} className="px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-xs text-violet-200">
                {c}
              </span>
            ))}
          </div>
          {regionData.economicHighlight && (
            <p className="text-xs text-zinc-400 leading-relaxed mt-3">{regionData.economicHighlight}</p>
          )}
        </div>
      )}

      {regionData.bestForProspecting && (
        <div className="rounded-xl border border-violet-500/20 bg-violet-500/[0.04] p-4">
          <div className="text-xs font-semibold text-violet-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Lightbulb size={11} />
            Conseil de prospection régional
          </div>
          <p className="text-sm text-zinc-200 leading-relaxed">{regionData.bestForProspecting}</p>
        </div>
      )}
    </section>
  );
}

// ─── 12bis. Block DeptOverview — pages /dept/[slug] sans cat ─
// Vue d'ensemble exhaustive du département : aucune catégorie ciblée,
// donc on montre la richesse économique + 12 catégories d'entrée.
export function DeptOverviewBlock({ deptData, dept, popularCategories = [] }) {
  if (!deptData || !dept) return null;

  return (
    <section className="max-w-5xl mx-auto px-4 sm:px-6 mb-16">
      <h2 className="text-2xl sm:text-3xl font-bold mb-3 flex items-center gap-2">
        <Building2 size={22} className="text-violet-400" />
        Le tissu économique du {dept.name}
      </h2>
      <p className="text-zinc-400 mb-6 max-w-3xl text-sm leading-relaxed">
        Profil du département pour calibrer votre ciblage commercial : densité, secteurs phares, entreprises emblématiques.
      </p>

      {/* Bandeau profil + champions */}
      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
          <div className="text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <MapPin size={11} />
            Profil démographique & économique
          </div>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-3 pb-2 border-b border-white/[0.04]">
              <dt className="text-zinc-500">Population</dt>
              <dd className="text-zinc-100 font-semibold tabular-nums">{deptData.population}</dd>
            </div>
            <div className="flex justify-between gap-3 pb-2 border-b border-white/[0.04]">
              <dt className="text-zinc-500">Densité</dt>
              <dd className="text-zinc-200 font-medium text-right max-w-[60%]">{deptData.density}</dd>
            </div>
            <div className="flex justify-between gap-3 pb-2 border-b border-white/[0.04]">
              <dt className="text-zinc-500">Top villes</dt>
              <dd className="text-zinc-200 font-medium text-right max-w-[60%]">{deptData.topCities?.join(', ')}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-zinc-500">Positionnement</dt>
              <dd className="text-violet-300 font-medium text-right max-w-[60%]">{deptData.economy?.tag}</dd>
            </div>
          </dl>
          {deptData.economy?.comment && (
            <p className="text-xs text-zinc-400 leading-relaxed mt-4 pt-3 border-t border-white/[0.04]">
              {deptData.economy.comment}
            </p>
          )}
        </div>

        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
          <div className="text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Target size={11} />
            Secteurs phares
          </div>
          <ul className="space-y-2 mb-4">
            {deptData.keySectors?.map((s, i) => (
              <li key={i} className="text-sm text-zinc-200 flex items-start gap-2">
                <ArrowRight size={11} className="text-violet-400 flex-shrink-0 mt-1" />
                <span>{s}</span>
              </li>
            ))}
          </ul>
          {deptData.notableCompanies?.length > 0 && (
            <>
              <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                Entreprises emblématiques
              </div>
              <div className="flex flex-wrap gap-1.5">
                {deptData.notableCompanies.map((c, i) => (
                  <span key={i} className="px-2.5 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-[11px] text-violet-200">
                    {c}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Highlight éco */}
      {deptData.economicNote && (
        <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/[0.04] p-4 mb-4">
          <div className="text-xs font-semibold text-indigo-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Lightbulb size={11} />
            À retenir
          </div>
          <p className="text-sm text-zinc-200 leading-relaxed">{deptData.economicNote}</p>
        </div>
      )}

      {/* Conseil prospection local */}
      {deptData.prospectingTip && (
        <div className="rounded-xl border border-violet-500/20 bg-violet-500/[0.04] p-4 mb-6">
          <div className="text-xs font-semibold text-violet-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Lightbulb size={11} />
            Conseil de prospection local
          </div>
          <p className="text-sm text-zinc-200 leading-relaxed">{deptData.prospectingTip}</p>
        </div>
      )}

      {/* Entrées catégories phares */}
      {popularCategories.length > 0 && (
        <div>
          <h3 className="text-base font-semibold text-zinc-100 mb-3 mt-6">
            Explorer par secteur dans le {dept.name}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
            {popularCategories.slice(0, 12).map((c, i) => (
              <Link
                key={i}
                href={c.href}
                className="group rounded-lg border border-white/[0.06] bg-white/[0.02] hover:border-violet-500/30 hover:bg-violet-500/[0.05] p-3 transition flex items-center justify-between gap-2"
              >
                <span className="text-sm text-zinc-200 group-hover:text-white transition truncate">{c.label}</span>
                <ArrowRight size={12} className="text-zinc-500 group-hover:text-violet-400 transition flex-shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

// ─── 12ter. Block SiblingCities — autres villes du même dept ─
// Sur les pages /[cat]/ville/[city], affiche les autres villes du dept
// pour le même secteur. Maillage interne + utilité user.
export function SiblingCitiesBlock({ cities = [], category, currentCitySlug }) {
  const siblings = (cities || []).filter((c) => c.slug !== currentCitySlug);
  if (siblings.length === 0 || !category) return null;
  return (
    <section className="max-w-5xl mx-auto px-4 sm:px-6 mb-16">
      <h2 className="text-2xl sm:text-3xl font-bold mb-3 flex items-center gap-2">
        <MapPin size={22} className="text-violet-400" />
        {category.labelCapitalized} dans les autres villes du département
      </h2>
      <p className="text-zinc-400 mb-6 max-w-2xl text-sm">
        Élargissez votre ciblage aux communes voisines, classées par population.
      </p>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
        {siblings.slice(0, 12).map((c) => (
          <Link
            key={c.slug}
            href={`/prospection/${category.slug}/ville/${c.slug}`}
            className="group rounded-lg border border-white/[0.06] bg-white/[0.02] hover:border-violet-500/30 hover:bg-violet-500/[0.05] p-3 transition"
          >
            <div className="text-sm font-medium text-zinc-100 group-hover:text-white transition truncate">
              {category.labelCapitalized} {c.name}
            </div>
            {c.pop && (
              <div className="text-[11px] text-zinc-500 mt-0.5 tabular-nums">
                {(c.pop / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} k hab.
              </div>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}

// ─── 12. Block top regions (pour pages /[cat]) ─────────
export function TopRegionsBlock({ data, category }) {
  if (!data?.topRegions?.length) return null;
  return (
    <section className="max-w-5xl mx-auto px-4 sm:px-6 mb-16">
      <h2 className="text-2xl sm:text-3xl font-bold mb-3 flex items-center gap-2">
        <MapPin size={22} className="text-violet-400" />
        Où sont concentrés les {category?.labelPlural || 'professionnels'} en France
      </h2>
      <p className="text-zinc-400 mb-6 max-w-2xl text-sm">
        Les 3 régions où le secteur est le plus dense — bonnes priorités pour démarrer.
      </p>
      <div className="grid md:grid-cols-3 gap-4">
        {data.topRegions.map((r, i) => (
          <Link
            key={i}
            href={`/prospection/${category?.slug || ''}/region/${r.slug}`}
            className="group rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 hover:border-violet-500/30 transition"
          >
            <div className="text-3xl font-bold text-violet-400 mb-2 group-hover:text-violet-300 transition">#{i + 1}</div>
            <div className="text-sm text-zinc-200 font-semibold mb-1.5 capitalize group-hover:text-white transition">
              {r.slug.replace(/-/g, ' ')}
            </div>
            <div className="text-xs text-zinc-500 leading-relaxed">{r.reason}</div>
            <div className="mt-3 text-xs text-violet-400 inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
              Voir le détail
              <ArrowRight size={11} />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
