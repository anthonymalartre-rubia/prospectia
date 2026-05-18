import Link from 'next/link';
import { ArrowLeft, UserCheck, Pencil, Trash2, Download, ShieldCheck, Ban, Eye, AlertTriangle, Filter } from 'lucide-react';

export const metadata = {
  title: 'RGPD — Vos droits — Prospectia.ai',
  description: 'Informations sur vos droits en matière de protection des données personnelles (RGPD) sur Prospectia.ai.',
};

const USER_RIGHTS = [
  {
    icon: UserCheck,
    title: 'Droit d\'accès',
    description: 'Vous avez le droit d\'obtenir la confirmation que des données vous concernant sont ou ne sont pas traitées. Si elles le sont, vous pouvez obtenir une copie de l\'ensemble de vos données personnelles.',
    how: 'Envoyez un email à contact@prospectia.ai avec l\'objet « Demande d\'accès aux données ». Nous vous répondrons sous 30 jours.',
  },
  {
    icon: Pencil,
    title: 'Droit de rectification',
    description: 'Vous pouvez demander la correction de données personnelles inexactes ou incomplètes vous concernant.',
    how: 'Modifiez vos informations directement depuis les paramètres de votre compte, ou contactez-nous par email.',
  },
  {
    icon: Trash2,
    title: 'Droit de suppression',
    description: 'Vous pouvez demander l\'effacement de vos données personnelles. Ce droit s\'applique notamment lorsque les données ne sont plus nécessaires, que vous retirez votre consentement, ou que le traitement est illicite.',
    how: 'Depuis votre compte : Settings > Supprimer le compte. Toutes vos données seront effacées sous 30 jours. Vous pouvez également nous contacter par email.',
  },
  {
    icon: Download,
    title: 'Droit à la portabilité',
    description: 'Vous avez le droit de recevoir vos données personnelles dans un format structuré, couramment utilisé et lisible par machine.',
    how: 'Utilisez la fonctionnalité d\'export CSV disponible dans le tableau de leads pour exporter vos prospects. Pour les autres données, contactez-nous par email.',
  },
  {
    icon: ShieldCheck,
    title: 'Droit à la limitation',
    description: 'Vous pouvez demander la limitation du traitement de vos données dans certains cas : contestation de l\'exactitude des données, traitement illicite, données nécessaires à la constatation de droits en justice.',
    how: 'Contactez notre DPO par email en précisant les données concernées et le motif de votre demande.',
  },
  {
    icon: Ban,
    title: 'Droit d\'opposition',
    description: 'Vous pouvez vous opposer à tout moment au traitement de vos données personnelles fondé sur l\'intérêt légitime, y compris le profilage. Vous pouvez également vous opposer au traitement à des fins de prospection commerciale.',
    how: 'Contactez-nous par email à contact@prospectia.ai. Pour la prospection commerciale, cliquez sur le lien de désinscription dans nos emails.',
  },
];

const PROSPECT_RIGHTS = [
  {
    icon: Ban,
    title: 'Droit d\'opposition (opt-out)',
    description: 'En tant que professionnel, vous pouvez demander à ne plus apparaître dans les résultats de recherche de Prospectia.ai. Votre demande sera appliquée pour l\'ensemble des utilisateurs du Service, de manière définitive.',
    how: 'Rendez-vous sur notre page /opt-out ou envoyez un email à contact@prospectia.ai avec l\'objet « Opt-out ». Traitement sous 72 heures.',
  },
  {
    icon: Eye,
    title: 'Droit de savoir qui a vos données',
    description: 'Vous avez le droit de savoir quels utilisateurs de Prospectia.ai ont accédé à vos données professionnelles et dans quel cadre. Nous maintenons des journaux d\'accès permettant de répondre à cette demande.',
    how: 'Envoyez un email à contact@prospectia.ai avec l\'objet « Demande d\'information sur l\'accès à mes données ». Nous vous répondrons sous 30 jours.',
  },
  {
    icon: Trash2,
    title: 'Droit de suppression',
    description: 'Vous pouvez demander la suppression complète de vos données professionnelles de notre système. Cette suppression sera effective dans toutes les bases de données de Prospectia.ai et vous serez ajouté à notre liste d\'opt-out pour empêcher toute collecte future.',
    how: 'Via la page /opt-out ou par email à contact@prospectia.ai. Suppression effective sous 72 heures.',
  },
  {
    icon: Pencil,
    title: 'Droit de rectification',
    description: 'Si les données professionnelles vous concernant sont inexactes (mauvais email, mauvais téléphone, mauvaise adresse), vous pouvez demander leur correction.',
    how: 'Envoyez un email à contact@prospectia.ai en précisant les données à corriger.',
  },
  {
    icon: UserCheck,
    title: 'Droit d\'accès',
    description: 'Vous pouvez demander une copie de toutes les données professionnelles vous concernant traitées par Prospectia.ai, ainsi que les informations relatives aux traitements effectués (finalité, base légale, destinataires, durée de conservation).',
    how: 'Envoyez un email à contact@prospectia.ai avec l\'objet « Demande d\'accès — personne prospectée ». Réponse sous 30 jours.',
  },
];

export default function RGPDPage() {
  return (
    <div className="min-h-screen bg-surface-base text-content-primary">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-content-secondary hover:text-content-primary transition mb-10">
          <ArrowLeft size={16} />
          Retour à l&apos;accueil
        </Link>

        <h1 className="text-3xl sm:text-4xl font-bold mb-2">Protection des données (RGPD)</h1>
        <p className="text-content-secondary text-sm mb-4">Dernière mise à jour : 28 mars 2026</p>
        <p className="text-content-secondary leading-relaxed mb-10">
          Chez Prospectia.ai, nous prenons la protection des données personnelles très au sérieux.
          Cette page détaille les droits de toutes les personnes concernées — utilisateurs du Service
          et personnes dont les données professionnelles sont traitées — ainsi que les mesures de
          protection mises en place.
        </p>

        {/* ===== SECTION 1 : DROITS DES UTILISATEURS ===== */}
        <div className="p-4 rounded-xl bg-surface-card border border-line mb-8">
          <p className="text-content-primary font-semibold text-lg">Droits des utilisateurs du Service</p>
          <p className="text-content-secondary text-sm mt-1">
            Vous êtes inscrit(e) sur Prospectia.ai ? Voici vos droits en vertu du RGPD.
          </p>
        </div>

        <div className="space-y-6">
          {USER_RIGHTS.map((right) => (
            <div key={right.title} className="p-6 rounded-xl border border-line bg-surface-card">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center flex-shrink-0">
                  <right.icon size={18} className="text-violet-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-semibold text-content-primary mb-2">{right.title}</h2>
                  <p className="text-content-secondary text-sm leading-relaxed mb-3">{right.description}</p>
                  <div className="p-3 rounded-lg bg-surface-elevated text-sm">
                    <span className="font-medium text-content-primary">Comment faire : </span>
                    <span className="text-content-secondary">{right.how}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ===== SECTION 2 : DROITS DES PERSONNES PROSPECTÉES ===== */}
        <div className="p-4 rounded-xl bg-surface-card border border-line mb-8 mt-14">
          <p className="text-content-primary font-semibold text-lg">Droits des personnes prospectées</p>
          <p className="text-content-secondary text-sm mt-1">
            Vous êtes un professionnel dont les données apparaissent dans Prospectia.ai ? Vous n&apos;avez pas de
            compte mais vos coordonnées professionnelles sont traitées ? Voici vos droits.
          </p>
        </div>

        <div className="space-y-6">
          {PROSPECT_RIGHTS.map((right) => (
            <div key={right.title + '-prospect'} className="p-6 rounded-xl border border-line bg-surface-card">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
                  <right.icon size={18} className="text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-semibold text-content-primary mb-2">{right.title}</h2>
                  <p className="text-content-secondary text-sm leading-relaxed mb-3">{right.description}</p>
                  <div className="p-3 rounded-lg bg-surface-elevated text-sm">
                    <span className="font-medium text-content-primary">Comment faire : </span>
                    <span className="text-content-secondary">{right.how}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ===== SECTION 3 : ANALYSE D'INTÉRÊT LÉGITIME ===== */}
        <div className="mt-14 space-y-10 text-content-secondary leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-content-primary mb-3">Analyse d&apos;intérêt légitime (article 6.1.f RGPD)</h2>
            <p>
              Le traitement des données professionnelles B2B par Prospectia.ai repose sur l&apos;intérêt légitime.
              Conformément aux exigences du RGPD et aux lignes directrices de la CNIL, nous avons réalisé
              l&apos;analyse de mise en balance suivante :
            </p>

            <div className="mt-6 space-y-4">
              <div className="p-5 rounded-xl border border-line bg-surface-card">
                <h3 className="text-content-primary font-semibold mb-2">1. Identification de l&apos;intérêt légitime</h3>
                <p className="text-sm">
                  Prospectia.ai poursuit un intérêt légitime commercial : permettre la prospection commerciale B2B
                  en facilitant l&apos;identification et la prise de contact entre professionnels. La CNIL reconnaît
                  explicitement la légitimité de la prospection B2B dans ses recommandations (délibération n°2020-091
                  du 17 septembre 2020), sous réserve que les données utilisées soient professionnelles et que
                  la sollicitation soit en rapport avec l&apos;activité du professionnel contacté.
                </p>
              </div>

              <div className="p-5 rounded-xl border border-line bg-surface-card">
                <h3 className="text-content-primary font-semibold mb-2">2. Nécessité du traitement</h3>
                <p className="text-sm">
                  L&apos;agrégation de données professionnelles publiquement accessibles est nécessaire pour fournir
                  le Service. Les alternatives (recherche manuelle sur chaque source) aboutiraient au même résultat
                  pour les personnes concernées, sans réduire l&apos;impact sur leur vie privée. L&apos;agrégation
                  automatisée permet en revanche d&apos;appliquer des mesures de protection systématiques (filtrage,
                  opt-out, minimisation) qui ne seraient pas possibles en recherche manuelle.
                </p>
              </div>

              <div className="p-5 rounded-xl border border-line bg-surface-card">
                <h3 className="text-content-primary font-semibold mb-2">3. Attentes raisonnables des personnes concernées</h3>
                <p className="text-sm">
                  Les professionnels et entreprises dont les données sont traitées ont volontairement publié leurs
                  coordonnées professionnelles dans un contexte commercial : fiche Google Maps, site web d&apos;entreprise,
                  annuaires professionnels. Ces publications ont pour finalité d&apos;être trouvé et contacté par des
                  prospects, clients et partenaires. Il est donc raisonnable de s&apos;attendre à recevoir des
                  sollicitations commerciales B2B en lien avec son activité.
                </p>
              </div>

              <div className="p-5 rounded-xl border border-line bg-surface-card">
                <h3 className="text-content-primary font-semibold mb-2">4. Impact sur les personnes concernées</h3>
                <p className="text-sm">
                  L&apos;impact est limité car : (i) seules des données professionnelles publiques sont traitées
                  (jamais de données personnelles ou sensibles), (ii) la finalité du traitement (prospection B2B)
                  est cohérente avec la raison pour laquelle ces données ont été publiées, (iii) les personnes
                  disposent d&apos;un mécanisme d&apos;opt-out simple, gratuit et facilement accessible,
                  (iv) les données sont automatiquement supprimées après 12 mois d&apos;inactivité.
                </p>
              </div>

              <div className="p-5 rounded-xl border border-line bg-surface-card">
                <h3 className="text-content-primary font-semibold mb-2">5. Conclusion de la mise en balance</h3>
                <p className="text-sm">
                  L&apos;intérêt légitime de la prospection B2B prévaut sur les droits et libertés des personnes
                  concernées, compte tenu : du caractère exclusivement professionnel des données, des attentes
                  raisonnables des professionnels, des mesures de protection technique mises en place, et de
                  la facilité d&apos;exercice du droit d&apos;opposition. Cette analyse est réévaluée annuellement.
                </p>
              </div>
            </div>
          </section>

          {/* ===== SECTION 4 : MESURES DE PROTECTION ===== */}
          <section>
            <h2 className="text-xl font-semibold text-content-primary mb-3">Mesures de protection des données</h2>
            <p>
              Prospectia.ai met en place des mesures techniques et organisationnelles proactives pour protéger
              les données des personnes concernées :
            </p>

            <div className="mt-6 space-y-4">
              <div className="p-5 rounded-xl border border-line bg-surface-card">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Filter size={16} className="text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-content-primary font-semibold mb-1">Filtrage automatique des emails personnels</h3>
                    <p className="text-sm">
                      Le Service exclut automatiquement les adresses email hébergées sur des domaines grand public
                      (@gmail.com, @hotmail.com, @yahoo.fr, @outlook.com, @orange.fr, @free.fr, @laposte.net,
                      @wanadoo.fr, etc.). Seuls les emails professionnels rattachés au domaine de l&apos;entreprise
                      sont conservés, garantissant le caractère strictement B2B des données traitées.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-xl border border-line bg-surface-card">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <ShieldCheck size={16} className="text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-content-primary font-semibold mb-1">Scoring de confiance</h3>
                    <p className="text-sm">
                      Chaque email trouvé est évalué selon un score de confiance multi-critères :
                      correspondance avec le domaine de l&apos;entreprise (score 100), adresse de type contact@ (score 80),
                      email professionnel vérifié (score 60), email générique (score 20). Ce scoring permet aux utilisateurs
                      de prioriser les données les plus fiables et de minimiser le risque d&apos;erreur.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-xl border border-line bg-surface-card">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Ban size={16} className="text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-content-primary font-semibold mb-1">Mécanisme d&apos;opt-out centralisé</h3>
                    <p className="text-sm">
                      Prospectia.ai maintient une liste centralisée d&apos;opt-out. Toute personne ou entreprise
                      ayant exercé son droit d&apos;opposition est automatiquement et définitivement exclue des
                      résultats de recherche pour l&apos;ensemble des utilisateurs du Service. La demande d&apos;opt-out
                      est traitée sous 72 heures maximum. Page dédiée :
                      <Link href="/opt-out" className="text-violet-400 hover:text-violet-300 transition ml-1">/opt-out</Link>.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-xl border border-line bg-surface-card">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <AlertTriangle size={16} className="text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-content-primary font-semibold mb-1">Minimisation et limitation de la conservation</h3>
                    <p className="text-sm">
                      Seules les données strictement nécessaires à la prospection B2B sont collectées (raison sociale,
                      adresse, téléphone professionnel, email professionnel, site web). Aucune donnée sensible n&apos;est
                      traitée. Les données de prospects sont automatiquement supprimées après 12 mois d&apos;inactivité.
                      Les résultats sont dédupliqués par identifiant unique pour éviter tout traitement excessif.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-xl border border-line bg-surface-card">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <ShieldCheck size={16} className="text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-content-primary font-semibold mb-1">Sécurité technique</h3>
                    <p className="text-sm">
                      Chiffrement des données en transit (TLS 1.2+), authentification sécurisée (Supabase Auth),
                      mots de passe hashés, hébergement sécurisé avec protection DDoS (Vercel), paiements PCI DSS (Stripe),
                      accès restreint au personnel autorisé, journalisation des accès.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-content-primary mb-3">Export de vos données</h2>
            <p>
              Prospectia.ai vous permet d&apos;exporter facilement vos données :
            </p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li>
                <span className="text-content-primary font-medium">Export CSV</span> : depuis le tableau de leads,
                exportez l&apos;ensemble de vos prospects au format CSV standard
              </li>
              <li>
                <span className="text-content-primary font-medium">Données de compte</span> : sur demande,
                nous vous fournirons l&apos;intégralité de vos données personnelles dans un format lisible par machine (JSON)
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-content-primary mb-3">Suppression de compte</h2>
            <p>
              Vous pouvez supprimer votre compte à tout moment depuis les paramètres de votre compte
              (Settings &gt; Supprimer le compte). La suppression entraîne :
            </p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li>L&apos;effacement de toutes vos données personnelles (email, mot de passe)</li>
              <li>La suppression de tous vos prospects et résultats de recherche</li>
              <li>La suppression de votre historique de recherche</li>
              <li>L&apos;annulation de votre abonnement le cas échéant</li>
            </ul>
            <p className="mt-3">
              Les données sont définitivement supprimées sous 30 jours. Les données de facturation sont
              conservées 10 ans conformément aux obligations légales.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-content-primary mb-3">Délégué à la protection des données (DPO)</h2>
            <p>
              Pour toute question relative à la protection de vos données ou pour exercer vos droits,
              vous pouvez contacter notre DPO :
            </p>
            <div className="mt-4 p-4 rounded-xl border border-line bg-surface-card">
              <p className="text-content-primary font-medium">Contact DPO</p>
              <p className="text-sm mt-1">Email : <span className="text-content-primary">contact@prospectia.ai</span></p>
              <p className="text-sm mt-1">Délai de réponse : 30 jours maximum (72 heures pour les demandes d&apos;opt-out)</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-content-primary mb-3">Réclamation auprès de la CNIL</h2>
            <p>
              Si vous estimez que vos droits ne sont pas respectés malgré votre demande, vous pouvez
              introduire une réclamation auprès de la Commission Nationale de l&apos;Informatique et
              des Libertés (CNIL) :
            </p>
            <div className="mt-4 p-4 rounded-xl border border-line bg-surface-card">
              <p className="text-content-primary font-medium">CNIL</p>
              <p className="text-sm mt-1">3 Place de Fontenoy, TSA 80715, 75334 Paris Cedex 07</p>
              <p className="text-sm mt-1">Site web : <span className="text-content-primary">www.cnil.fr</span></p>
            </div>
          </section>
        </div>

        <div className="mt-16 pt-8 border-t border-line flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-content-secondary">
          <div className="flex gap-6">
            <Link href="/cgu" className="hover:text-content-primary transition">CGU</Link>
            <Link href="/confidentialite" className="hover:text-content-primary transition">Politique de confidentialité</Link>
          </div>
          <p className="text-content-tertiary text-xs">&copy; 2026 Prospectia.ai</p>
        </div>
      </div>
    </div>
  );
}
