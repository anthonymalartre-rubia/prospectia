// ─────────────────────────────────────────────────────────────────────
// /produits/formulaires — landing commerciale Volia Formulaires (LIVE)
// ─────────────────────────────────────────────────────────────────────
// Positionnement : alternative française à Typeform + Tally + JotForm.
// Couleur dominante : PINK (cohérente avec la sidebar in-app du module)
// Argument N°1 : bridges natifs CRM + Campagnes (zéro Zapier)
// Argument N°2 : RGPD-ready + dans le même plan que le reste de Volia
// ─────────────────────────────────────────────────────────────────────

import {
  FormInput, ClipboardList, Send, Check, X, ArrowRight,
  Workflow, Sparkles, Shield, QrCode, Webhook, LockKeyhole,
  MousePointerClick, Layers, FileText, Code2,
} from 'lucide-react';
import ProductPageLayout from '@/components/ProductPageLayout';
import MotionInView from '@/components/MotionInView';
import TrustpilotBadge from '@/components/TrustpilotBadge';
import { breadcrumbSchema, productSchema } from '@/lib/seo-helpers';

const SITE_URL = 'https://volia.fr';
const PAGE_URL = `${SITE_URL}/produits/formulaires`;

export const metadata = {
  title: 'Volia Formulaires — Form builder B2B avec CRM et cold email intégrés',
  description:
    'Alternative française à Typeform + Tally. Form builder drag-drop, multi-step, logique conditionnelle, bridges natifs vers CRM et cold email. Inclus dans Solo à 19 €/mois. Plus jamais de Tally → Zapier → HubSpot. RGPD by default.',
  alternates: {
    canonical: PAGE_URL,
    languages: {
      'fr-FR': PAGE_URL,
      'en-US': `${SITE_URL}/en/products/forms`,
      'en-GB': `${SITE_URL}/en/products/forms`,
      'x-default': PAGE_URL,
    },
  },
  keywords: [
    'form builder b2b',
    'alternative typeform',
    'alternative tally',
    'alternative jotform',
    'formulaire en ligne français',
    'form multi-step',
    'logique conditionnelle formulaire',
    'capture lead formulaire',
    'formulaire RGPD',
    'embed formulaire iframe',
    'QR code formulaire',
    'webhook formulaire',
    'Volia Formulaires',
  ],
  openGraph: {
    title: 'Volia Formulaires — Capturez. Convertissez. Le tout dans Volia.',
    description:
      'Typeform 25 $. Tally 29 $. Volia Formulaires : inclus dans Solo à 19 €. Bridges natifs vers CRM et cold email — plus jamais de Tally → Zapier → HubSpot.',
    url: PAGE_URL,
    type: 'website',
  },
};

// ─────────────────────────────────────────────────────────────────────
// HERO MOCKUP — multi-step form en cours de remplissage, page 2/3
// ─────────────────────────────────────────────────────────────────────
function HeroMockup() {
  return (
    <>
      <div className="absolute -top-4 -left-4 z-20 px-3 py-1.5 rounded-full bg-pink-100 border border-pink-300 shadow-md flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-pink-500"></span>
        </span>
        <span className="text-xs font-semibold text-pink-700">Formulaire en cours</span>
      </div>

      <div className="relative rounded-2xl bg-white border border-line shadow-2xl shadow-pink-500/10 overflow-hidden">
        {/* Header browser */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-line bg-gradient-to-r from-pink-50 to-rose-50">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-400" />
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            </div>
            <div className="ml-3 text-xs font-mono text-content-tertiary">volia.fr/f/devis-saas-pro</div>
          </div>
          <div className="text-xs px-2 py-1 rounded-md bg-pink-100 text-pink-700 font-semibold">Étape 2/3</div>
        </div>

        {/* Progress bar */}
        <div className="px-5 pt-4">
          <div className="h-1.5 rounded-full bg-pink-100 overflow-hidden">
            <div className="h-full w-2/3 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full" />
          </div>
        </div>

        {/* Form */}
        <div className="p-5 space-y-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-pink-700 mb-1">Page 2 · Votre besoin</p>
            <h3 className="text-lg font-semibold text-content-primary">Décrivez votre projet en 2 lignes</h3>
          </div>

          <div>
            <label className="block text-xs font-medium text-content-tertiary mb-1.5">Type de projet *</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'SaaS / Web app', selected: true },
                { label: 'E-commerce', selected: false },
                { label: 'Refonte site', selected: false },
                { label: 'Conseil / Audit', selected: false },
              ].map((c, i) => (
                <div
                  key={i}
                  className={`px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                    c.selected
                      ? 'border-pink-500 bg-pink-50 text-pink-700 shadow-sm'
                      : 'border-line bg-surface-elevated text-content-secondary'
                  }`}
                >
                  {c.selected && <Check size={12} className="inline mr-1.5" />}
                  {c.label}
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-content-tertiary mb-1.5">Budget envisagé *</label>
            <div className="px-3 py-2 rounded-lg border border-line bg-surface-elevated text-sm text-content-primary">
              20 000 – 50 000 €
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button type="button" className="text-xs text-content-tertiary hover:text-content-primary">← Précédent</button>
            <button type="button" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-pink-600 to-rose-600 text-white text-sm font-semibold shadow-md">
              Suivant <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-line bg-surface-elevated/30">
          <span className="text-[11px] text-content-tertiary">Propulsé par Volia · RGPD</span>
          <div className="flex items-center gap-2 text-[11px] font-semibold text-pink-700">
            <Sparkles size={11} /> Logique conditionnelle active
          </div>
        </div>
      </div>

      {/* Floating "→ CRM" sticker */}
      <div className="hidden lg:flex absolute -bottom-6 -right-6 z-20 px-4 py-3 rounded-xl bg-white border border-line shadow-xl items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-700">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
          <Workflow size={18} className="text-white" />
        </div>
        <div>
          <div className="text-xs text-content-tertiary">Submission → CRM auto</div>
          <div className="text-lg font-bold text-content-primary tabular-nums">+ 1 deal</div>
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────
// SECTION 2 — Stats killer du module (3 chiffres punchy)
// ─────────────────────────────────────────────────────────────────────
function SocialProofSection() {
  const stats = [
    { value: '12', label: 'types de champs', sub: 'text, email, tel, file, rating, hidden…', color: 'from-pink-600 via-rose-600 to-pink-700' },
    { value: '0 €', label: 'Zapier nécessaire', sub: 'Bridges CRM + Campagnes natifs', color: 'from-emerald-600 to-teal-700' },
    { value: '< 2 min', label: 'pour créer un form', sub: 'Drag-drop + auto-save', color: 'from-rose-600 to-fuchsia-700' },
  ];
  return (
    <section className="relative py-20 px-4 sm:px-6 border-t border-line overflow-hidden bg-gradient-to-br from-pink-50/60 via-white to-rose-50/40">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-pink-200/30 rounded-full blur-3xl pointer-events-none -z-0" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-rose-200/25 rounded-full blur-3xl pointer-events-none -z-0" />

      <div className="max-w-6xl mx-auto relative z-10">
        <MotionInView>
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-pink-200 bg-pink-100 text-pink-700 text-[11px] font-bold uppercase tracking-wider">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-pink-600"></span>
              </span>
              Module LIVE
            </span>
            <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight bg-gradient-to-b from-zinc-900 to-zinc-600 bg-clip-text text-transparent">
              Pendant que Typeform vous facture par submission,
              <br />
              Volia vous laisse capturer en illimité.
            </h2>
          </div>
        </MotionInView>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-center">
          {stats.map((stat, i) => (
            <MotionInView key={stat.label} delay={i * 100}>
              <div className="group">
                <div className={`text-5xl sm:text-6xl lg:text-7xl font-bold font-mono tabular-nums bg-gradient-to-br ${stat.color} bg-clip-text text-transparent leading-none mb-3 group-hover:scale-105 transition-transform`}>
                  {stat.value}
                </div>
                <div className="text-sm font-semibold text-content-primary">{stat.label}</div>
                <div className="text-xs text-content-tertiary mt-1">{stat.sub}</div>
              </div>
            </MotionInView>
          ))}
        </div>

        <MotionInView delay={300}>
          <div className="mt-12 flex items-center justify-center">
            <TrustpilotBadge size="md" />
          </div>
        </MotionInView>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────
// SECTION — Comparatif Typeform + Tally vs Volia (table 4 colonnes)
// ─────────────────────────────────────────────────────────────────────
function ComparisonTableSection() {
  const rows = [
    { feature: 'Form builder drag-drop',                typeform: { ok: true },                 tally: { ok: true },               volia: { ok: true } },
    { feature: 'Multi-step + logique conditionnelle',   typeform: { ok: true },                 tally: { ok: true },               volia: { ok: true } },
    { feature: 'Submissions illimitées',                typeform: { ok: false, label: '10/mo gratuit' }, tally: { ok: true },       volia: { ok: true } },
    { feature: 'Bridges natifs CRM',                    typeform: { ok: false },                tally: { ok: false },              volia: { ok: true } },
    { feature: 'Bridges natifs cold email',             typeform: { ok: false },                tally: { ok: false },              volia: { ok: true } },
    { feature: 'Webhooks sortants (Make, Zapier…)',     typeform: { ok: true },                 tally: { ok: true },               volia: { ok: true } },
    { feature: 'QR code customisable',                  typeform: { ok: false },                tally: { ok: false },              volia: { ok: true } },
    { feature: 'Embed iframe whitelabel',               typeform: { ok: false, label: '+ branding' }, tally: { ok: true },         volia: { ok: true } },
    { feature: 'Hébergement données France/UE',         typeform: { ok: false },                tally: { ok: false },              volia: { ok: true } },
    { feature: 'Tarif point d\'entrée',                 typeform: { ok: false, label: '25 $/mo' }, tally: { ok: false, label: '29 $/mo' }, volia: { ok: true, label: '19 €/mo' } },
  ];

  const Cell = ({ cell, accent }) => {
    if (cell.ok) {
      return (
        <div className="flex flex-col items-center gap-1">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center ${accent ? 'bg-emerald-100' : 'bg-zinc-100'}`}>
            <Check size={14} className={accent ? 'text-emerald-700' : 'text-zinc-700'} strokeWidth={3} />
          </div>
          {cell.label && <span className={`text-[10px] font-semibold ${accent ? 'text-emerald-700' : 'text-content-tertiary'}`}>{cell.label}</span>}
        </div>
      );
    }
    return (
      <div className="flex flex-col items-center gap-1">
        <div className="w-7 h-7 rounded-full bg-rose-100 flex items-center justify-center">
          <X size={14} className="text-rose-600" strokeWidth={3} />
        </div>
        {cell.label && <span className="text-[10px] font-semibold text-rose-600">{cell.label}</span>}
      </div>
    );
  };

  return (
    <section className="py-24 px-4 sm:px-6 border-t border-line bg-gradient-to-b from-white via-pink-50/30 to-white">
      <div className="max-w-6xl mx-auto">
        <MotionInView>
          <div className="text-center mb-14">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-pink-200 bg-pink-100 text-pink-700 text-[11px] font-bold uppercase tracking-wider mb-4">
              Volia vs Typeform vs Tally
            </span>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 tracking-tight bg-gradient-to-b from-zinc-900 to-zinc-600 bg-clip-text text-transparent">
              Typeform 25 $. Tally 29 $.
              <br />
              <span className="bg-gradient-to-br from-pink-600 to-rose-600 bg-clip-text text-transparent">Volia 19 €/mo (et le reste avec).</span>
            </h2>
            <p className="text-content-tertiary text-lg max-w-2xl mx-auto">
              Le seul form builder qui parle nativement à votre CRM et vos cold emails.
            </p>
          </div>
        </MotionInView>

        <MotionInView delay={150}>
          <div className="overflow-x-auto rounded-2xl border-2 border-pink-200 bg-white shadow-xl shadow-pink-500/10">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-pink-200 bg-gradient-to-r from-pink-50 to-rose-50">
                  <th className="px-4 sm:px-6 py-5 text-left text-xs font-bold uppercase tracking-wider text-content-secondary">Feature</th>
                  <th className="px-4 py-5 text-center text-xs font-bold uppercase tracking-wider text-content-secondary">
                    Typeform
                    <div className="text-[10px] font-mono text-content-tertiary normal-case tracking-normal mt-1">25 $/mo</div>
                  </th>
                  <th className="px-4 py-5 text-center text-xs font-bold uppercase tracking-wider text-content-secondary">
                    Tally
                    <div className="text-[10px] font-mono text-content-tertiary normal-case tracking-normal mt-1">29 $/mo</div>
                  </th>
                  <th className="px-4 py-5 text-center text-xs font-bold uppercase tracking-wider bg-gradient-to-b from-pink-100 to-rose-100 text-pink-800 relative">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-gradient-to-r from-pink-600 to-rose-600 text-white text-[9px] font-bold uppercase tracking-wider shadow-md whitespace-nowrap">
                      Recommandé
                    </div>
                    Volia
                    <div className="text-[10px] font-mono text-pink-700 normal-case tracking-normal mt-1">19 €/mo</div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={row.feature} className={`border-b border-line ${i % 2 === 1 ? 'bg-zinc-50/40' : ''}`}>
                    <td className="px-4 sm:px-6 py-4 text-content-primary font-medium">{row.feature}</td>
                    <td className="px-4 py-4 text-center"><Cell cell={row.typeform} /></td>
                    <td className="px-4 py-4 text-center"><Cell cell={row.tally} /></td>
                    <td className="px-4 py-4 text-center bg-gradient-to-b from-pink-50/40 to-rose-50/30"><Cell cell={row.volia} accent /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </MotionInView>

        <MotionInView delay={300}>
          <div className="mt-10 text-center">
            <a
              href="/signup?plan=solo"
              className="group inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-bold shadow-xl shadow-pink-500/30 hover:shadow-2xl hover:shadow-pink-500/40 hover:-translate-y-0.5 transition-all text-base"
            >
              <Sparkles size={18} className="text-amber-200" />
              <span>Démarrer dès 19 €/mois (Solo)</span>
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </a>
            <p className="mt-3 text-xs text-content-tertiary">
              14 jours d&apos;essai · Annulation 1 clic · Données hébergées en France
            </p>
          </div>
        </MotionInView>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────
// SECTION — Cas d'usage (4 personas)
// ─────────────────────────────────────────────────────────────────────
function UseCasesSection() {
  const cases = [
    {
      title: 'Page contact site web',
      desc: 'Le classique : nom, email, message. Embed iframe sur votre site, anti-spam intégré, notification mail à chaque submission.',
      icon: FormInput,
      tone: 'pink',
      stat: '< 5 min de setup',
    },
    {
      title: 'Lead magnet téléchargement',
      desc: 'Capturez les emails pros en échange d\'un livre blanc ou checklist. Le contact alimente automatiquement Volia Campagnes pour le nurturing.',
      icon: FileText,
      tone: 'rose',
      stat: 'Auto-add Campagnes',
    },
    {
      title: 'Demande de devis B2B multi-step',
      desc: '8 champs sur 2 pages avec logique conditionnelle. La submission devient un contact CRM au stage Lead, prêt à être travaillé.',
      icon: ClipboardList,
      tone: 'pink',
      stat: 'Bridge CRM natif',
    },
    {
      title: 'Inscription événement',
      desc: 'Repas, accompagnant, régime alimentaire. QR code à imprimer sur l\'affiche papier. Réponses exportables en 1 clic.',
      icon: QrCode,
      tone: 'rose',
      stat: 'QR + export CSV',
    },
  ];

  return (
    <section className="py-24 px-4 sm:px-6 border-t border-line">
      <div className="max-w-6xl mx-auto">
        <MotionInView>
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-pink-200 bg-pink-100 text-pink-700 text-[11px] font-bold uppercase tracking-wider mb-4">
              4 cas d&apos;usage qui marchent
            </span>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 tracking-tight bg-gradient-to-b from-zinc-900 to-zinc-600 bg-clip-text text-transparent">
              De la page contact au funnel multi-step.
            </h2>
            <p className="text-content-tertiary text-lg max-w-2xl mx-auto">
              Que vous capturiez 10 leads par mois ou 10 000, Volia Formulaires absorbe.
            </p>
          </div>
        </MotionInView>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {cases.map((c, i) => {
            const Icon = c.icon;
            const isPink = c.tone === 'pink';
            return (
              <MotionInView key={c.title} delay={i * 100}>
                <div className={`group h-full p-7 rounded-2xl border-2 ${
                  isPink ? 'border-pink-200 bg-gradient-to-br from-pink-50 via-white to-rose-50/50' : 'border-rose-200 bg-gradient-to-br from-rose-50 via-white to-pink-50/50'
                } shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300`}>
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${
                    isPink ? 'from-pink-500 to-rose-600' : 'from-rose-500 to-pink-600'
                  } flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform`}>
                    <Icon size={22} className="text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-content-primary mb-2">{c.title}</h3>
                  <p className="text-sm text-content-secondary leading-relaxed mb-4">{c.desc}</p>
                  <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-pink-700">
                    <Sparkles size={12} />
                    {c.stat}
                  </div>
                </div>
              </MotionInView>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────
// SECTION — Trust badges (RGPD + Stripe + Made in France)
// ─────────────────────────────────────────────────────────────────────
function TrustBadgesSection() {
  const badges = [
    { icon: Shield, label: 'Conforme RGPD France', sub: 'IP hashée · opt-in explicite · suppression 1 clic' },
    { icon: LockKeyhole, label: 'Données hébergées en UE', sub: 'Supabase EU + Vercel EU edge' },
    { icon: Sparkles, label: 'Made in France', sub: 'Support FR · facturation française' },
  ];
  return (
    <section className="py-16 px-4 sm:px-6 border-t border-line bg-surface-card/30">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {badges.map((b, i) => {
            const Icon = b.icon;
            return (
              <MotionInView key={b.label} delay={i * 80}>
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-white border border-line shadow-sm">
                  <div className="w-10 h-10 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center flex-shrink-0">
                    <Icon size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-content-primary">{b.label}</p>
                    <p className="text-[11px] text-content-tertiary">{b.sub}</p>
                  </div>
                </div>
              </MotionInView>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Données page : features bento (6 features killer)
// ─────────────────────────────────────────────────────────────────────
const FEATURES = {
  headline: 'capturer plus, brancher mieux',
  subline: 'Drag-drop, logique conditionnelle, bridges natifs, RGPD. Tout ce que vous attendez d\'un form builder moderne — connecté à votre stack Volia.',
  items: [
    {
      icon: 'Layers', featured: true,
      title: 'Builder drag-drop intuitif',
      desc: 'Glissez 12 types de champs (text, email, tel, file, rating, hidden…) dans 3 colonnes : palette, canvas, propriétés. Auto-save toutes les 2 sec. Aperçu live dans une nouvelle onglet.',
    },
    {
      icon: 'Workflow',
      title: 'Multi-step + jump logic',
      desc: 'Découpez votre form en pages, branchez la logique conditionnelle AND/OR par champ ET par page (skip-to-page). Idéal pour qualifier un prospect en moins de 8 questions visibles.',
    },
    {
      icon: 'Send',
      title: 'Bridges natifs CRM + Campagnes',
      desc: 'Une submission = un contact CRM créé automatiquement, ou un prospect ajouté à une liste Campagnes. Aucun Zapier, aucun Make. La donnée reste dans Volia, le bridge s\'exécute en moins de 200 ms.',
    },
    {
      icon: 'Shield',
      title: 'Anti-spam intégré',
      desc: 'Honeypot invisible + reCAPTCHA optionnel + rate limit IP (5 submissions / 5 min). Zéro bot dans vos réponses, zéro config à faire.',
    },
    {
      icon: 'LockKeyhole',
      title: 'RGPD by default',
      desc: 'IP et user-agent stockés hashés (SHA-256). Opt-in explicite obligatoire sur les champs sensibles. Suppression 1 clic d\'une réponse (effaces aussi les fichiers Storage).',
    },
    {
      icon: 'Webhook', wide: true,
      title: 'Webhooks sortants — branchez ce que vous voulez',
      desc: '4 events disponibles (form.submitted, form.bridge_succeeded, form.bridge_failed, form.published). Signature HMAC SHA-256 incluse, retry exponentiel automatique (5 tentatives sur 24h). Compatible Make, Zapier, n8n, ou votre endpoint custom HTTPS.',
    },
  ],
};

const HOW_IT_WORKS = [
  { icon: 'FormInput', title: 'Créez en 2 minutes', desc: 'Partez d\'un template (devis B2B, lead magnet, contact…) ou d\'une page blanche. Drag-drop des champs, auto-save permanent.' },
  { icon: 'Workflow',  title: 'Branchez les bridges', desc: 'Cochez 2 cases : auto-create dans le CRM, ajout à une liste Campagnes. Chaque submission alimente votre pipeline sans intervention.' },
  { icon: 'QrCode',    title: 'Partagez partout',     desc: 'URL publique, iframe embed, QR code customisable (PNG/SVG). Mesurez vues, soumissions, conversion dans le dashboard stats.' },
];

const FAQ = [
  {
    q: 'Combien de formulaires puis-je créer ?',
    a: 'Free : 0 (upsell). Solo (19 €/mo) : 1 formulaire, 100 submissions/mois. Pro (49 €/mo) : 5 formulaires, 1 000 submissions/mois. Business (99 €/mo) : illimité. Les submissions sont comptabilisées sur le mois en cours, pas en cumulé à vie.',
  },
  {
    q: 'Comment fonctionnent les bridges natifs vers le CRM et les Campagnes ?',
    a: 'Dans les settings d\'un form, vous cochez « créer automatiquement un contact CRM » et/ou choisissez une liste Volia Campagnes de destination. Dès qu\'une submission arrive, le bridge s\'exécute en moins de 200 ms et upsert le contact (déduplication par email). Si la submission contient email + prénom + société, ces 3 champs sont mappés automatiquement.',
  },
  {
    q: 'Quels types de champs supportez-vous ?',
    a: '12 types : text, email, tel, textarea, number, select, radio, checkbox, date, file (upload), rating (1-10), hidden. Chaque champ a ses validations propres (regex, min/max length, accepted MIME types pour les fichiers). Le builder vous montre uniquement les opérateurs de logique conditionnelle qui ont du sens pour le type choisi.',
  },
  {
    q: 'La logique conditionnelle fonctionne comment ?',
    a: 'Sur chaque champ vous pouvez ajouter une règle « afficher si… » avec combinator AND/OR et plusieurs conditions. Sur chaque page vous pouvez ajouter une règle de saut (skip-to-page) basée sur les réponses précédentes. Exemple : si « budget » < 5 k€, sauter directement à la dernière page avec un message « contactez-nous par email ». Tout est évalué côté client en temps réel + côté serveur pour empêcher tout contournement.',
  },
  {
    q: 'Les formulaires sont vraiment conformes RGPD ?',
    a: 'Oui, by default : (1) IP et user-agent stockés en SHA-256 (16 chars), pas en clair ; (2) opt-in checkbox explicite généré automatiquement sur les templates contact ; (3) page publique /opt-out pour la suppression à la demande ; (4) endpoint DELETE /api/admin/forms/[id]/responses/[responseId] pour la suppression admin (RGPD) ; (5) données hébergées en UE (Supabase EU + Vercel edge EU). Vous gardez la maîtrise complète, vous êtes le responsable de traitement.',
  },
  {
    q: 'Puis-je embarquer le formulaire sur mon site existant ?',
    a: 'Oui, via iframe. Dans les settings du form publié, copiez le code embed (1 ligne iframe + script auto-resize). Compatible avec WordPress, Webflow, Framer, Wix, ou n\'importe quel site HTML. Vous pouvez aussi pointer un sous-domaine vers la page publique /f/[slug] pour un look 100 % whitelabel.',
  },
  {
    q: 'Les webhooks supportent quels events ?',
    a: '4 events : form.submitted (chaque soumission), form.bridge_succeeded (CRM + Campagnes OK), form.bridge_failed (avec le détail de l\'erreur), form.published (changement de status). Chaque webhook est signé HMAC SHA-256 avec un secret par endpoint. En cas d\'échec HTTP du destinataire, retry exponentiel automatique (5 tentatives sur 24 h).',
  },
  {
    q: 'Que se passe-t-il si j\'atteins ma limite mensuelle de submissions ?',
    a: 'Vous recevez une alerte email à 80 % et 100 % d\'utilisation. À 100 %, le formulaire continue d\'accepter les submissions pendant 24h (pour ne pas perdre des leads chauds) puis bascule en mode « limite atteinte » avec un CTA d\'upgrade visible. Aucun frais surprise, aucune coupure brutale.',
  },
  {
    q: 'Puis-je customiser le QR code (couleurs, taille) ?',
    a: 'Oui, depuis les settings du form publié. Trois tailles (256 / 512 / 1024 px), color picker pour le QR et le fond, niveau de correction d\'erreur configurable (L/M/Q/H — H permet d\'ajouter un logo central). Téléchargement PNG ou SVG (vectoriel, idéal pour l\'impression A3/A4).',
  },
  {
    q: 'Migration depuis Typeform ou Tally possible ?',
    a: 'Pas d\'import automatique de schema pour l\'instant (V2). Mais : (1) vous repartez d\'un template Volia proche de votre form existant en 2 min, (2) vous pouvez importer vos contacts existants dans Volia Campagnes via CSV, (3) on conserve la même URL via un redirect 301 si vous changez de domaine. Si vous avez 10+ forms à migrer, écrivez à contact@volia.fr — on fait la migration assistée pour vous.',
  },
];

// ─────────────────────────────────────────────────────────────────────
// JSON-LD
// ─────────────────────────────────────────────────────────────────────
const breadcrumbs = breadcrumbSchema([
  { label: 'Accueil', href: '/' },
  { label: 'Produits', href: '/produits/prospection' },
  { label: 'Formulaires' },
]);

const product = {
  '@context': 'https://schema.org',
  ...productSchema({
    name: 'Volia Formulaires',
    description: 'Form builder B2B drag-drop multi-step avec logique conditionnelle, bridges natifs vers CRM et cold email, RGPD by default. Alternative française à Typeform et Tally. À partir de 19 €/mois.',
    url: PAGE_URL,
    priceFrom: 19,
  }),
};

export default function FormulairesProductPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(product) }} />

      <ProductPageLayout
        module="formulaires"
        status="LIVE"
        hero={{
          eyebrow: 'Typeform + Tally, refait pour la France',
          h1Before: 'Vos leads, attrapés.',
          h1Highlight: 'Direct dans le CRM.',
          h1After: '',
          subtitle: (
            <>
              Le seul form builder qui parle nativement à votre CRM et à vos cold emails. <strong className="text-content-primary font-semibold">Plus jamais de Tally → Zapier → HubSpot</strong>. Dans Volia, <strong className="text-pink-700 font-semibold">dès 19 €/mois</strong>.
            </>
          ),
          ctaPrimary: { label: 'Démarrer gratuitement', href: '/signup?plan=solo' },
          ctaSecondary: { label: 'Voir une démo', href: '#features' },
          trust: [
            (<><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Module LIVE</>),
            '12 types de champs',
            'Multi-step + logique conditionnelle',
            'RGPD by default',
          ],
          mockup: <HeroMockup />,
        }}
        afterHero={<SocialProofSection />}
        features={FEATURES}
        afterFeatures={
          <>
            <ComparisonTableSection />
            <UseCasesSection />
          </>
        }
        howItWorks={HOW_IT_WORKS}
        crossSell={{
          subtitle: 'Les Formulaires alimentent automatiquement votre CRM et vos Campagnes. Boucle complète, zéro copier-coller.',
          otherModules: [
            { module: 'prospection', direction: 'in', desc: 'Pour le cold outbound. 287 k+ entreprises FR, 150+ secteurs, emails enrichis.', cta: 'Découvrir Prospection' },
            { module: 'campagnes', direction: 'out', desc: 'Chaque submission alimente une liste Campagnes. Nurturing automatique, warmup intégré.', cta: 'Découvrir Campagnes' },
            { module: 'crm', direction: 'out', desc: 'Une submission devient un deal au stage Lead. Pipeline Kanban natif.', cta: 'Voir le CRM' },
          ],
        }}
        pricingBanner={<TrustBadgesSection />}
        pricing={{
          label: 'Inclus dans Solo (19 €), Pro (49 €) et Business (99 €)',
          subtext: 'Solo = 1 formulaire / 100 submissions/mois. Pro = 5 formulaires / 1 000 submissions/mois. Business = illimité. Pas d\'add-on, annulation 1 clic.',
          cta: 'Voir le détail des plans',
          ctaHref: '/pricing',
        }}
        beforeFaq={null}
        faq={FAQ}
        finalCta={{
          title: 'Vos prochains leads sont à 2 minutes.',
          subtitle: 'Premier form en 2 min, branché au CRM en 2 clics, partagé partout. Tout dans Volia, pour le prix d\'un café.',
          primary: { label: 'Commencer gratuitement', href: '/signup?plan=solo' },
          secondary: { label: 'Voir les tarifs', href: '/pricing' },
          trust: 'Inclus dans Solo (19 €) · 14 jours d\'essai · Migration assistée · RGPD by default',
        }}
      />
    </>
  );
}
