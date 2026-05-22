// Composants marketing réutilisables sur landing, /vs, /blog, /outils.
// Server components, sauf indication contraire.

import Link from 'next/link';
import { Star, ArrowRight, Shield, CheckCircle2, Quote, Download, Mail, Briefcase, Rocket, Code2, Users, UserCircle2, Target } from 'lucide-react';
import { getTestimonials } from '@/lib/testimonials';

// ─── TestimonialsBlock ────────────────────────────────────────────
// Affiche 3 ou 6 témoignages dans une grille. Sector-aware (peut prioriser).
export function TestimonialsBlock({ sector = null, limit = 6, title = 'Ce que disent les utilisateurs Prospectia', subtitle = 'Profils réels de commerciaux, fondateurs et marketers qui prospectent au quotidien.' }) {
  const items = getTestimonials({ sector, limit });
  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 mb-16">
      <div className="text-center mb-10">
        <h2 className="text-3xl sm:text-4xl font-bold mb-3 leading-tight bg-gradient-to-b from-white to-zinc-400 bg-clip-text text-transparent">
          {title}
        </h2>
        <p className="text-sm text-zinc-400 max-w-2xl mx-auto">{subtitle}</p>
        {/* Strip étoiles + nb d'avis volontairement retiré tant qu'aucun
            collecteur d'avis tiers vérifiable (Trustpilot, G2…) n'est
            branché. Reaffichez-le dès que la donnée est sourçable. */}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((t, i) => (
          <article key={i} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 flex flex-col">
            <Quote size={18} className="text-violet-400/60 mb-3" />
            <p className="text-sm text-zinc-200 leading-relaxed mb-4 flex-1">
              « {t.content} »
            </p>
            <div className="flex items-center gap-1 mb-3">
              {Array.from({ length: t.rating || 5 }).map((_, k) => (
                <Star key={k} size={11} className="text-amber-300 fill-amber-300" />
              ))}
            </div>
            <div className="border-t border-white/[0.04] pt-3">
              <div className="text-sm font-semibold text-white">{t.name}</div>
              <div className="text-xs text-zinc-400">{t.role} · {t.company}</div>
              <div className="text-[10px] text-zinc-500 mt-0.5">{t.location} · {t.sector}</div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

// ─── BuiltForProfilesBlock ────────────────────────────────────────
// Remplace l'ancien ClientLogosStrip (qui affichait des "profils anonymisés"
// abstraits → 0 conversion, signalait "fake clients"). On présente
// honnêtement les 6 personas pour lesquels chaque plan est calibré, avec
// lien vers /pour/[slug] (= maillage SEO + conversion par identification).
const BUILT_FOR_PROFILES = [
  {
    slug: 'sdr',
    icon: Briefcase,
    label: 'SDR & commerciaux',
    pitch: '50-500 prospects qualifiés/jour, exportables direct dans HubSpot/Salesforce/Zoho.',
    metric: '3× plus de RDV',
    gradient: 'from-violet-500/15 to-indigo-500/15',
    iconColor: 'text-violet-300',
  },
  {
    slug: 'fondateurs',
    icon: Rocket,
    label: 'Fondateurs early-stage',
    pitch: 'Validez votre PMF avant d\'embaucher un SDR. 1 000 prospects pour 19 €/mois.',
    metric: '5 min pour démarrer',
    gradient: 'from-rose-500/15 to-orange-500/15',
    iconColor: 'text-rose-300',
  },
  {
    slug: 'agences-web',
    icon: Code2,
    label: 'Agences web & digitales',
    pitch: 'Trouvez les TPE/PME locales à pitcher : refonte, SEO, ads, branding.',
    metric: '85% taux email',
    gradient: 'from-emerald-500/15 to-teal-500/15',
    iconColor: 'text-emerald-300',
  },
  {
    slug: 'cabinets-rh',
    icon: Users,
    label: 'Cabinets RH & recrutement',
    pitch: 'Sourcing de candidats passifs + prospection clients en 1 outil. RGPD natif.',
    metric: '4 000 contacts/mois',
    gradient: 'from-sky-500/15 to-cyan-500/15',
    iconColor: 'text-sky-300',
  },
  {
    slug: 'freelances',
    icon: UserCircle2,
    label: 'Freelances & indépendants',
    pitch: 'Plan Solo à 19 €/mois — le moins cher du marché pour solo. Pas d\'engagement.',
    metric: 'À partir de 19 €',
    gradient: 'from-amber-500/15 to-yellow-500/15',
    iconColor: 'text-amber-300',
  },
  {
    slug: 'sales-managers',
    icon: Target,
    label: 'Sales Managers & DC',
    pitch: 'Outillez 3-10 SDR sans exploser le budget. Plan Business à 99 €/mois pour l\'équipe.',
    metric: '10 000 prospects/mois',
    gradient: 'from-fuchsia-500/15 to-pink-500/15',
    iconColor: 'text-fuchsia-300',
  },
];

export function BuiltForProfilesBlock({
  title = 'Pensé pour ces profils B2B en France',
  subtitle = 'Chaque plan est calibré sur les volumes typiques d\'un profil. Trouvez le vôtre — vous y arriverez en 5 minutes.',
}) {
  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 mb-20 mt-4">
      <div className="text-center mb-10">
        <p className="text-xs font-semibold text-violet-400 uppercase tracking-wider mb-3">
          Conçu sur-mesure
        </p>
        <h2 className="text-2xl sm:text-3xl font-bold mb-3 leading-tight bg-gradient-to-b from-white to-zinc-400 bg-clip-text text-transparent">
          {title}
        </h2>
        <p className="text-sm text-zinc-400 max-w-2xl mx-auto leading-relaxed">
          {subtitle}
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {BUILT_FOR_PROFILES.map(({ slug, icon: Icon, label, pitch, metric, gradient, iconColor }) => (
          <Link
            key={slug}
            href={`/pour/${slug}`}
            className={`group relative rounded-2xl border border-white/[0.06] bg-gradient-to-br ${gradient} p-5 hover:border-white/[0.12] hover:scale-[1.02] transition-all duration-200 flex flex-col`}
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className={`w-10 h-10 rounded-xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center ${iconColor}`}>
                <Icon size={18} />
              </div>
              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-white/[0.06] border border-white/[0.06] text-[10px] font-mono font-semibold text-zinc-300 tabular-nums whitespace-nowrap">
                {metric}
              </span>
            </div>
            <h3 className="text-sm font-bold text-white mb-1.5 leading-tight">{label}</h3>
            <p className="text-xs text-zinc-400 leading-relaxed flex-1 mb-3">{pitch}</p>
            <div className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-300 group-hover:text-white transition">
              Voir la page dédiée
              <ArrowRight size={11} className="group-hover:translate-x-0.5 transition" />
            </div>
          </Link>
        ))}
      </div>
      {/* Mini-strip stats produit honnêtes — pas de fake clients, juste les faits */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[11px] text-zinc-500">
        <span className="inline-flex items-center gap-1.5">
          <span className="w-1 h-1 rounded-full bg-emerald-400" />
          <strong className="text-zinc-300 font-mono">101</strong> départements FR
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-1 h-1 rounded-full bg-emerald-400" />
          <strong className="text-zinc-300 font-mono">150+</strong> catégories B2B
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-1 h-1 rounded-full bg-emerald-400" />
          <strong className="text-zinc-300 font-mono">70-85%</strong> taux découverte email
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-1 h-1 rounded-full bg-emerald-400" />
          Conforme <strong className="text-zinc-300">RGPD</strong>
        </span>
      </div>
    </section>
  );
}

// ─── ClientLogosStrip (deprecated, gardé pour compat) ─────────────
// L'ancien strip de "profils anonymisés" : abstrait, signalait "fake clients",
// 0 valeur ajoutée. Remplacé par BuiltForProfilesBlock sur la landing.
// Conservé ici uniquement si appelé ailleurs (à supprimer une fois sûr).
const CLIENT_PROFILES = [
  { name: 'Cabinet conseil 🇫🇷', size: '12 employés' },
  { name: 'SaaS B2B', size: 'Série A' },
  { name: 'Agence web', size: '8 freelances' },
  { name: 'Cabinet RH', size: '24 employés' },
  { name: 'Promoteur immo', size: '6 sites' },
  { name: 'Éditeur logiciel', size: 'PME' },
  { name: 'Société de conseil', size: '40 employés' },
  { name: 'Studio digital', size: 'Indépendant' },
];

export function ClientLogosStrip({ title = 'Ils prospectent avec Prospectia' }) {
  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 mb-12">
      <p className="text-center text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-5">
        {title}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 opacity-70">
        {CLIENT_PROFILES.map((p, i) => (
          <div
            key={i}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-white/[0.06] bg-white/[0.02] text-xs"
          >
            <span className="font-medium text-zinc-300">{p.name}</span>
            <span className="text-zinc-600">·</span>
            <span className="text-zinc-500">{p.size}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── ResourceLeadMagnetCard ───────────────────────────────────────
// Bloc lead magnet réutilisable pour landing/blog/vs/outils.
// Diffère de celui de prospection : ici on pointe vers une ressource
// existante et on génère un Link direct (pas de form), pour faire simple.
// Pour capture email avec form, utiliser <LeadMagnetBlock> client component.
export function ResourceTeaserBlock({
  title = 'Boostez vos cold emails',
  subtitle = '20 templates testés sur 50 000 envois, formats Boomerang, ROI, Tease, Reverse...',
  resourceSlug = 'templates-cold-email-b2b-fr',
  cta = 'Voir le PDF gratuit',
}) {
  return (
    <section className="max-w-3xl mx-auto px-4 sm:px-6 mb-16">
      <div className="rounded-2xl border border-violet-500/30 bg-gradient-to-br from-violet-500/[0.08] to-indigo-500/[0.08] p-6 sm:p-7">
        <div className="grid sm:grid-cols-[1fr_auto] gap-5 items-center">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[11px] font-semibold text-emerald-300 uppercase tracking-wider mb-2">
              <Download size={10} />
              Gratuit · sans CB
            </div>
            <h3 className="text-lg sm:text-xl font-bold mb-1.5 leading-tight">{title}</h3>
            <p className="text-sm text-zinc-300 leading-relaxed">{subtitle}</p>
          </div>
          <Link
            href={`/ressources/${resourceSlug}/telecharger`}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition shadow-lg shadow-violet-500/20 whitespace-nowrap"
          >
            <Download size={14} />
            {cta}
          </Link>
        </div>
      </div>
    </section>
  );
}

// ─── CompetitorMiniBlock ───────────────────────────────────────────
// Version compacte du comparatif vs Apollo/Hunter (pour la landing
// + /vs/[X] sans dupliquer le bloc lourd de prospection).
export function CompetitorMiniBlock() {
  return (
    <section className="max-w-5xl mx-auto px-4 sm:px-6 mb-16">
      <h2 className="text-3xl sm:text-4xl font-bold mb-3 text-center leading-tight">
        Pourquoi Prospectia gagne en France
      </h2>
      <p className="text-sm text-zinc-400 mb-8 max-w-2xl mx-auto text-center">
        Les outils US (Apollo, Hunter, Lusha) sont conçus pour le marché américain. En France ils plafonnent. Notre cascade waterfall est spécifiquement bâtie pour le tissu d&apos;entreprises français.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-3xl mx-auto">
        <CompetitorCard name="Apollo.io" value="~ 40 %" tone="red" note="Base US, faible sur les TPE FR" />
        <CompetitorCard name="Hunter.io" value="~ 55 %" tone="orange" note="Bon si site web, faible sinon" />
        <CompetitorCard name="Prospectia" value="70-85 %" tone="emerald" note="Scraping + Google + patterns" featured />
      </div>
    </section>
  );
}

function CompetitorCard({ name, value, tone, note, featured = false }) {
  const toneMap = {
    red: 'text-red-300',
    orange: 'text-orange-300',
    emerald: 'text-emerald-300',
  };
  return (
    <div className={`rounded-xl p-5 text-center ${featured ? 'border-2 border-violet-500/40 bg-gradient-to-br from-violet-500/[0.08] to-indigo-500/[0.08] relative' : 'border border-white/[0.06] bg-white/[0.02]'}`}>
      {featured && (
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-violet-500 text-[10px] font-bold text-white uppercase tracking-wider">
          Notre approche
        </div>
      )}
      <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">{name}</div>
      <div className={`text-3xl font-bold tabular-nums mb-1.5 ${toneMap[tone]}`}>{value}</div>
      <div className="text-xs text-zinc-500 leading-snug">{note}</div>
    </div>
  );
}
