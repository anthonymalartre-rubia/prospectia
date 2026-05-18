import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Conditions Générales d\'Utilisation — Prospectia.ai',
  description: 'Conditions Générales d\'Utilisation de la plateforme Prospectia.ai, service de prospection B2B automatisée en France.',
};

export default function CGUPage() {
  return (
    <div className="min-h-screen bg-surface-base text-content-primary">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-content-secondary hover:text-content-primary transition mb-10">
          <ArrowLeft size={16} />
          Retour à l&apos;accueil
        </Link>

        <h1 className="text-3xl sm:text-4xl font-bold mb-2">Conditions Générales d&apos;Utilisation</h1>
        <p className="text-content-secondary text-sm mb-10">Dernière mise à jour : 28 mars 2026</p>

        <div className="space-y-10 text-content-secondary leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-content-primary mb-3">1. Présentation du service</h2>
            <p>
              Prospectia.ai (ci-après « le Service ») est une plateforme d&apos;agrégation de données B2B
              éditée et exploitée par Prospectia.ai. Le Service est accessible à l&apos;adresse
              <span className="text-content-primary font-medium"> scraping-dom-ezdrive.vercel.app</span>.
            </p>
            <p className="mt-3">
              Le Service permet aux utilisateurs de rechercher des prospects professionnels sur l&apos;ensemble
              du territoire français (101 départements), d&apos;enrichir ces prospects avec des informations
              de contact professionnel (email d&apos;entreprise, téléphone), et de les exporter au format CSV.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-content-primary mb-3">2. Éditeur</h2>
            <p>
              Le Service est édité par Prospectia.ai.<br />
              Contact : <span className="text-content-primary">contact@prospectia.ai</span>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-content-primary mb-3">3. Acceptation des conditions</h2>
            <p>
              L&apos;utilisation du Service implique l&apos;acceptation pleine et entière des présentes
              Conditions Générales d&apos;Utilisation (CGU). En créant un compte ou en utilisant le Service,
              l&apos;utilisateur reconnaît avoir pris connaissance des présentes CGU et les accepte sans réserve.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-content-primary mb-3">4. Nature d&apos;agrégateur — Rôle de Prospectia.ai</h2>
            <p>
              Prospectia.ai agit en qualité d&apos;<span className="text-content-primary font-medium">agrégateur technique</span> de
              données professionnelles publiquement accessibles. Le Service interroge et consolide des informations
              provenant de sources tierces via leurs APIs respectives :
            </p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li><span className="text-content-primary font-medium">Google Places API</span> — Découverte d&apos;établissements professionnels (nom, adresse, téléphone, site web, avis)</li>
              <li><span className="text-content-primary font-medium">Apollo.io</span> — Enrichissement de contacts professionnels B2B</li>
              <li><span className="text-content-primary font-medium">Serper.dev</span> — Recherche d&apos;informations publiques via moteur de recherche</li>
              <li><span className="text-content-primary font-medium">Enrichly</span> — Enrichissement d&apos;emails professionnels</li>
              <li><span className="text-content-primary font-medium">Anymail Finder</span> — Recherche et vérification d&apos;emails professionnels</li>
              <li><span className="text-content-primary font-medium">Findymail</span> — Recherche et vérification d&apos;emails professionnels</li>
              <li><span className="text-content-primary font-medium">Scraping de sites web</span> — Extraction d&apos;emails depuis les pages publiques des entreprises (page d&apos;accueil, contact, mentions légales)</li>
            </ul>
            <p className="mt-4">
              <span className="text-content-primary font-medium">Prospectia.ai ne constitue pas et ne maintient pas de base de données
              de données personnelles.</span> Le Service agit comme un intermédiaire technique qui agrège, en temps réel ou quasi-réel,
              des données déjà publiquement accessibles via les sources ci-dessus. Prospectia.ai n&apos;est pas
              le collecteur primaire des données ; les données sont collectées et mises à disposition par les fournisseurs
              tiers mentionnés, chacun opérant selon ses propres conditions d&apos;utilisation et politiques de confidentialité.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-content-primary mb-3">5. Description des fonctionnalités</h2>
            <p>Le Service propose les fonctionnalités suivantes :</p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li>Recherche de prospects via l&apos;API Google Places (New) sur 101 départements français</li>
              <li>Enrichissement email en cascade (waterfall) via plusieurs sources tierces (Apollo.io, Serper, Enrichly, Anymail Finder, Findymail)</li>
              <li>Scraping d&apos;emails professionnels depuis les sites web publics des entreprises</li>
              <li>Déduplication automatique des résultats par identifiant Google Place</li>
              <li>Filtrage automatique des emails personnels (exclusion des domaines @gmail, @hotmail, @yahoo, etc.)</li>
              <li>Scoring de confiance des emails trouvés</li>
              <li>Export des données au format CSV standard</li>
              <li>Organisation des leads par dossiers, filtres et tags</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-content-primary mb-3">6. Utilisation autorisée</h2>
            <p>
              Le Service est <span className="text-content-primary font-medium">exclusivement destiné à la prospection commerciale B2B
              (Business-to-Business)</span> entre professionnels. L&apos;utilisateur s&apos;engage à utiliser le Service uniquement
              pour contacter des entreprises et des professionnels dans le cadre d&apos;une démarche commerciale légitime.
            </p>

            <h3 className="text-lg font-medium text-content-primary mt-5 mb-2">6.1 Usages autorisés</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Prospection commerciale B2B auprès d&apos;entreprises identifiées</li>
              <li>Recherche de partenaires commerciaux professionnels</li>
              <li>Constitution de fichiers de prospection B2B conformes au RGPD</li>
              <li>Enrichissement de bases de données clients/prospects existantes avec des données professionnelles</li>
            </ul>

            <h3 className="text-lg font-medium text-content-primary mt-5 mb-2">6.2 Usages strictement interdits</h3>
            <p>L&apos;utilisateur s&apos;interdit expressément de :</p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li><span className="text-content-primary font-medium">Spamming</span> : envoyer des emails en masse non sollicités, en particulier sans lien de désinscription fonctionnel ou sans identification claire de l&apos;expéditeur</li>
              <li><span className="text-content-primary font-medium">Collecte de données personnelles</span> : utiliser le Service pour collecter des emails personnels (adresses @gmail.com, @hotmail.com, @yahoo.fr, etc.) ou des données relatives à des personnes physiques en dehors de leur activité professionnelle</li>
              <li><span className="text-content-primary font-medium">Usage B2C</span> : utiliser les données obtenues pour de la prospection auprès de particuliers (consommateurs)</li>
              <li><span className="text-content-primary font-medium">Revente de données</span> : revendre, redistribuer, sous-licencier ou mettre à disposition de tiers les données obtenues via le Service, que ce soit à titre gratuit ou onéreux</li>
              <li><span className="text-content-primary font-medium">Harcèlement</span> : contacter de manière répétée des professionnels ayant expressément refusé d&apos;être contactés ou ayant exercé leur droit d&apos;opposition</li>
              <li><span className="text-content-primary font-medium">Usurpation d&apos;identité</span> : se faire passer pour une autre entreprise ou personne dans le cadre de la prospection</li>
              <li><span className="text-content-primary font-medium">Activités illégales</span> : utiliser le Service à des fins contraires à la loi, frauduleuses ou portant atteinte aux droits des tiers</li>
            </ul>
            <p className="mt-4">
              Tout manquement à ces obligations pourra entraîner la suspension ou la résiliation immédiate du compte,
              sans préavis ni remboursement, et sans préjudice des dommages et intérêts que Prospectia.ai pourrait réclamer.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-content-primary mb-3">7. Responsabilité de l&apos;utilisateur — Qualité de responsable de traitement</h2>
            <p>
              L&apos;utilisateur reconnaît et accepte qu&apos;il agit en qualité de
              <span className="text-content-primary font-medium"> responsable de traitement </span>
              au sens de l&apos;article 4(7) du RGPD pour l&apos;ensemble des traitements qu&apos;il effectue
              à partir des données obtenues via le Service. À ce titre, l&apos;utilisateur est seul responsable de :
            </p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li>
                <span className="text-content-primary font-medium">Conformité RGPD de ses campagnes</span> : l&apos;utilisateur
                doit s&apos;assurer que ses traitements reposent sur une base légale valide (intérêt légitime pour la prospection B2B,
                conformément à l&apos;article 6.1.f du RGPD et aux lignes directrices de la CNIL sur la prospection commerciale)
              </li>
              <li>
                <span className="text-content-primary font-medium">Information des personnes prospectées</span> : l&apos;utilisateur
                doit informer les personnes contactées de l&apos;origine des données, de la finalité du traitement et de leurs droits,
                conformément aux articles 13 et 14 du RGPD
              </li>
              <li>
                <span className="text-content-primary font-medium">Lien de désinscription</span> : tout email de prospection envoyé
                par l&apos;utilisateur doit contenir un mécanisme de désinscription fonctionnel et gratuit (conformément à
                l&apos;article L. 34-5 du CPCE et aux recommandations de la CNIL)
              </li>
              <li>
                <span className="text-content-primary font-medium">Respect des opt-outs</span> : l&apos;utilisateur doit
                immédiatement cesser de contacter toute personne ayant exercé son droit d&apos;opposition et supprimer
                ses données de ses fichiers de prospection
              </li>
              <li>
                <span className="text-content-primary font-medium">Tenue du registre des traitements</span> : l&apos;utilisateur
                doit documenter ses traitements dans son propre registre des activités de traitement (article 30 du RGPD)
              </li>
              <li>
                <span className="text-content-primary font-medium">Analyse d&apos;impact</span> : le cas échéant, l&apos;utilisateur
                doit réaliser une analyse d&apos;impact relative à la protection des données (AIPD) si ses traitements
                présentent un risque élevé pour les droits et libertés des personnes concernées
              </li>
            </ul>
            <p className="mt-4">
              Prospectia.ai décline toute responsabilité quant à l&apos;utilisation que l&apos;utilisateur fait des données
              obtenues via le Service. L&apos;utilisateur s&apos;engage à indemniser et garantir Prospectia.ai contre
              toute réclamation, plainte (y compris auprès de la CNIL) ou action résultant de son utilisation non conforme
              des données.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-content-primary mb-3">8. Utilisation des données et conformité RGPD</h2>
            <p>
              Le Service collecte et traite exclusivement des données professionnelles publiquement accessibles
              provenant de sources tierces. Le traitement est encadré comme suit :
            </p>

            <h3 className="text-lg font-medium text-content-primary mt-5 mb-2">8.1 Nature des données traitées</h3>
            <p>Le Service traite uniquement des données à caractère professionnel :</p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>Raison sociale et nom commercial de l&apos;entreprise</li>
              <li>Adresse professionnelle de l&apos;établissement</li>
              <li>Numéro de téléphone professionnel</li>
              <li>Adresse email professionnelle (domaine de l&apos;entreprise)</li>
              <li>Site web de l&apos;entreprise</li>
              <li>Avis et note Google</li>
              <li>Catégorie d&apos;activité</li>
            </ul>

            <h3 className="text-lg font-medium text-content-primary mt-5 mb-2">8.2 Base légale</h3>
            <p>
              Le traitement des données de prospects B2B par Prospectia.ai repose sur l&apos;<span className="text-content-primary font-medium">intérêt
              légitime</span> (article 6.1.f du RGPD), conformément aux lignes directrices de la CNIL concernant
              la prospection commerciale B2B. Les professionnels qui publient leurs coordonnées à des fins
              commerciales peuvent raisonnablement s&apos;attendre à être contactés dans le cadre de leur activité.
            </p>

            <h3 className="text-lg font-medium text-content-primary mt-5 mb-2">8.3 Droits des personnes prospectées</h3>
            <p>
              Toute personne dont les données professionnelles sont traitées via le Service dispose des droits suivants :
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li><span className="text-content-primary font-medium">Droit d&apos;opposition (opt-out)</span> : via notre page dédiée <Link href="/opt-out" className="text-violet-400 hover:text-violet-300 transition">/opt-out</Link> ou par email à contact@prospectia.ai</li>
              <li><span className="text-content-primary font-medium">Droit d&apos;accès</span> : savoir quelles données sont traitées</li>
              <li><span className="text-content-primary font-medium">Droit de suppression</span> : demander l&apos;effacement de ses données</li>
              <li><span className="text-content-primary font-medium">Droit de rectification</span> : corriger des données inexactes</li>
            </ul>
            <p className="mt-3">
              Pour plus de détails, consultez notre <Link href="/confidentialite" className="text-violet-400 hover:text-violet-300 transition">Politique de Confidentialité</Link> et
              notre <Link href="/rgpd" className="text-violet-400 hover:text-violet-300 transition">page RGPD</Link>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-content-primary mb-3">9. Filtrage et mesures de conformité</h2>
            <p>
              Prospectia.ai met en place des mesures techniques proactives pour garantir la conformité des données traitées :
            </p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li>
                <span className="text-content-primary font-medium">Filtrage des emails personnels</span> : le Service exclut
                automatiquement les adresses email hébergées sur des domaines grand public (@gmail.com, @hotmail.com, @yahoo.fr,
                @outlook.com, @orange.fr, @free.fr, etc.) afin de ne conserver que les emails professionnels rattachés au
                domaine de l&apos;entreprise
              </li>
              <li>
                <span className="text-content-primary font-medium">Scoring de confiance</span> : chaque email trouvé est évalué
                selon un score de confiance (domain match = 100, contact@ = 80, email professionnel = 60, email générique = 20),
                permettant à l&apos;utilisateur de prioriser les données les plus fiables
              </li>
              <li>
                <span className="text-content-primary font-medium">Liste d&apos;opt-out centralisée</span> : Prospectia.ai maintient
                une liste de personnes et d&apos;entreprises ayant exercé leur droit d&apos;opposition. Ces entrées sont
                automatiquement exclues des résultats de recherche pour tous les utilisateurs
              </li>
              <li>
                <span className="text-content-primary font-medium">Minimisation des données</span> : seules les données strictement
                nécessaires à la prospection B2B sont collectées et présentées
              </li>
              <li>
                <span className="text-content-primary font-medium">Déduplication</span> : les résultats sont dédupliqués par
                identifiant unique (Google Place ID) pour éviter les doublons et le traitement excessif
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-content-primary mb-3">10. Offres et tarification</h2>
            <p>Le Service est proposé selon les plans suivants :</p>
            <div className="mt-4 rounded-xl border border-line overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line bg-surface-card">
                    <th className="text-left py-3 px-4 font-semibold text-content-primary">Plan</th>
                    <th className="text-left py-3 px-4 font-semibold text-content-primary">Prix</th>
                    <th className="text-left py-3 px-4 font-semibold text-content-primary">Inclus</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-line">
                    <td className="py-3 px-4 font-medium text-content-primary">Starter</td>
                    <td className="py-3 px-4">Gratuit</td>
                    <td className="py-3 px-4">Recherches limitées, scraping email, export CSV standard</td>
                  </tr>
                  <tr className="border-b border-line">
                    <td className="py-3 px-4 font-medium text-content-primary">Pro</td>
                    <td className="py-3 px-4">49&euro;/mois</td>
                    <td className="py-3 px-4">Prospects illimités, waterfall complet (7 sources), export CSV illimité, support prioritaire</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium text-content-primary">Enterprise</td>
                    <td className="py-3 px-4">149&euro;/mois</td>
                    <td className="py-3 px-4">Enrichissements illimités, API access, utilisateurs illimités, webhooks, SLA & support dédié</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-4">
              Les prix sont indiqués en euros, hors taxes. Prospectia.ai se réserve le droit de modifier
              ses tarifs à tout moment. Les utilisateurs seront informés de toute modification tarifaire
              au moins 30 jours avant son entrée en vigueur.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-content-primary mb-3">11. Paiement</h2>
            <p>
              Les paiements sont traités de manière sécurisée par <span className="text-content-primary font-medium">Stripe</span>.
              Les abonnements sont facturés mensuellement. Le paiement est dû au début de chaque période
              de facturation. Prospectia.ai ne stocke aucune information bancaire ; celles-ci sont
              gérées exclusivement par Stripe.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-content-primary mb-3">12. Limitation de responsabilité</h2>
            <p>
              Prospectia.ai fournit le Service « en l&apos;état » et ne garantit pas l&apos;exactitude,
              l&apos;exhaustivité ou l&apos;actualité des données collectées. En particulier :
            </p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li>Les résultats de recherche dépendent de la disponibilité et de la qualité des données fournies par les sources tierces (Google Places, Apollo.io, Serper, Enrichly, Anymail Finder, Findymail)</li>
              <li>Les emails trouvés par enrichissement ne sont pas garantis comme valides ou à jour</li>
              <li>Le scoring des emails est indicatif et ne constitue pas une garantie de délivrabilité</li>
              <li>Prospectia.ai ne saurait être tenu responsable des dommages directs ou indirects résultant de l&apos;utilisation du Service</li>
              <li>Prospectia.ai ne saurait être tenu responsable de l&apos;utilisation non conforme des données par l&apos;utilisateur, notamment en cas de non-respect du RGPD, de la loi Informatique et Libertés ou du CPCE</li>
              <li>En tant qu&apos;agrégateur, Prospectia.ai ne saurait être tenu responsable des données fournies par les services tiers qu&apos;il interroge</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-content-primary mb-3">13. Disponibilité du service</h2>
            <p>
              Prospectia.ai s&apos;efforce d&apos;assurer la disponibilité du Service 24h/24, 7j/7.
              Toutefois, le Service peut être temporairement interrompu pour des raisons de maintenance,
              de mise à jour ou en cas de force majeure. Prospectia.ai ne saurait être tenu responsable
              des interruptions du Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-content-primary mb-3">14. Résiliation</h2>
            <p>
              L&apos;utilisateur peut résilier son abonnement à tout moment depuis les paramètres de son
              compte. La résiliation prend effet à la fin de la période de facturation en cours.
              Aucun remboursement au prorata ne sera effectué pour la période restante.
            </p>
            <p className="mt-3">
              Prospectia.ai se réserve le droit de suspendre ou de résilier un compte en cas de
              violation des présentes CGU, notamment en cas d&apos;utilisation non conforme (spamming, usage B2C,
              revente de données), sans préavis ni indemnité.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-content-primary mb-3">15. Propriété intellectuelle</h2>
            <p>
              L&apos;ensemble des éléments du Service (interface, design, code, marque, logo) sont la
              propriété exclusive de Prospectia.ai et sont protégés par le droit de la propriété
              intellectuelle. Toute reproduction, représentation ou exploitation non autorisée est interdite.
            </p>
            <p className="mt-3">
              Les données agrégées par le Service proviennent de sources tierces et restent soumises aux
              conditions d&apos;utilisation de leurs fournisseurs respectifs. L&apos;utilisateur ne peut
              en aucun cas revendiquer un droit de propriété sur les données brutes obtenues via le Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-content-primary mb-3">16. Droit applicable et juridiction</h2>
            <p>
              Les présentes CGU sont régies par le droit français. En cas de litige, et après tentative
              de résolution amiable, compétence exclusive est attribuée aux tribunaux de Paris.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-content-primary mb-3">17. Contact</h2>
            <p>
              Pour toute question relative aux présentes CGU, vous pouvez nous contacter à l&apos;adresse :
              <span className="text-content-primary font-medium"> contact@prospectia.ai</span>
            </p>
          </section>
        </div>

        <div className="mt-16 pt-8 border-t border-line flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-content-secondary">
          <div className="flex gap-6">
            <Link href="/confidentialite" className="hover:text-content-primary transition">Politique de confidentialité</Link>
            <Link href="/rgpd" className="hover:text-content-primary transition">RGPD</Link>
          </div>
          <p className="text-content-tertiary text-xs">&copy; 2026 Prospectia.ai</p>
        </div>
      </div>
    </div>
  );
}
