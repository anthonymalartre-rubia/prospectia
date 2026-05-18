// Glossary terms — 50 SEO-targeted definitions

export const GLOSSARY = [
  {
    slug: 'cold-emailing',
    term: 'Cold Emailing',
    shortDef: 'Envoi d\'emails commerciaux à des prospects qui n\'ont pas encore manifesté d\'intérêt pour votre produit.',
    longDef: `Le **cold emailing** désigne l'envoi d'emails commerciaux à des prospects "froids", c'est-à-dire qui ne vous connaissent pas et n'ont pas demandé à être contactés. C'est une technique d'**outbound marketing** très utilisée en B2B pour générer des rendez-vous commerciaux.

En 2026, le cold emailing fonctionne toujours mais nécessite une approche très différente d'il y a 5 ans : personnalisation massive, micro-batchs (20-50 emails/jour), warming des domaines, et conformité RGPD stricte. Voir notre [guide complet du cold emailing 2026](/blog/cold-emailing-2026).

**Bonnes pratiques** :
- Sujet court (3-7 mots), pas de majuscules ni d'emojis
- Personnalisation réelle (référence à leur entreprise/poste)
- Soft CTA en bas du mail
- Lien d'opt-out obligatoire (RGPD)
- Suivi 2-3 fois max si pas de réponse`,
    related: ['lead-magnet', 'icp', 'rgpd', 'deliverability', 'warm-up'],
    category: 'Outbound',
  },
  {
    slug: 'lead-magnet',
    term: 'Lead Magnet',
    shortDef: 'Contenu gratuit (ebook, template, calculateur) offert en échange d\'une adresse email de prospect.',
    longDef: `Un **lead magnet** (aimant à prospects) est un contenu gratuit offert en échange des coordonnées d'un prospect, généralement son email. C'est l'outil principal de l'**inbound marketing** pour capturer des leads qualifiés.

**Formats efficaces en B2B** :
- Ebook PDF (15-30 pages)
- Templates Excel/Notion
- Checklist
- Calculateur (ROI, économies)
- Webinar replay
- Audit gratuit
- Mini-cours email (5-7 jours)

**Critères d'un bon lead magnet** :
- Résout un problème **précis** de votre ICP
- Promet un **résultat tangible** (chiffrable)
- Téléchargeable **immédiatement**
- Démontre votre **expertise**

Exemples Prospectia : "Template Excel : Plan de prospection 30 jours" ou "100 sujets cold email B2B testés".`,
    related: ['icp', 'cold-emailing', 'inbound-marketing'],
    category: 'Inbound',
  },
  {
    slug: 'icp',
    term: 'ICP (Ideal Customer Profile)',
    shortDef: 'Description précise du client idéal pour votre produit (secteur, taille, poste, besoin).',
    longDef: `L'**ICP** (*Ideal Customer Profile*) est la description précise du client idéal pour votre produit ou service. C'est la fondation de toute stratégie de prospection B2B efficace : sans ICP clair, vous arrosez large et convertissez peu.

**Composantes d'un ICP B2B** :
- **Firmographie** : secteur, taille (CA, effectifs), maturité, géographie
- **Technographie** : outils/tech stack utilisés
- **Comportemental** : signaux d'achat, événements déclencheurs (levée de fonds, embauche, etc.)
- **Persona décideur** : poste, séniorité, problèmes prioritaires

**Différence ICP vs Buyer Persona** :
- L'ICP décrit l'**entreprise** cible
- Le buyer persona décrit la **personne** dans cette entreprise

**Comment construire son ICP** :
1. Analyser vos 10 meilleurs clients actuels
2. Identifier les points communs (secteur, taille, problèmes résolus)
3. Calculer le **LTV** moyen et le **payback period**
4. Filtrer pour ne garder que les profils rentables`,
    related: ['lead-magnet', 'cold-emailing', 'bant'],
    category: 'Stratégie',
  },
  {
    slug: 'bant',
    term: 'BANT',
    shortDef: 'Framework de qualification commerciale : Budget, Authority, Need, Timing.',
    longDef: `**BANT** est un framework de qualification commerciale créé par IBM dans les années 60. Il sert à évaluer si un prospect est **vraiment qualifié** pour devenir client.

Les 4 critères :
- **B**udget : a-t-il les moyens d'acheter ?
- **A**uthority : est-il décideur ?
- **N**eed : a-t-il un vrai besoin ?
- **T**iming : est-ce le bon moment ?

**Comment l'utiliser dans un discovery call** :

> *"Pour bien comprendre ton besoin, j'aurais 4 questions rapides : quel budget vous avez sur ce sujet (B), qui prend la décision finale (A), quel est ton problème principal aujourd'hui (N), et quand voudrais-tu une solution en place (T) ?"*

**Limites de BANT** :
- Trop directif pour les modèles freemium ou self-serve
- Pas adapté aux ventes complexes multi-décideurs
- Alternatives modernes : **MEDDIC**, **GPCTBA/C&I**, **SPIN Selling**

Mais BANT reste **utile pour qualifier rapidement** un cold email reply ou un lead inbound avant de booker un meeting.`,
    related: ['icp', 'cold-emailing'],
    category: 'Vente',
  },
  {
    slug: 'rgpd',
    term: 'RGPD',
    shortDef: 'Règlement Général sur la Protection des Données. Loi européenne encadrant la collecte et l\'usage des données personnelles.',
    longDef: `Le **RGPD** (Règlement Général sur la Protection des Données) est entré en vigueur en mai 2018 dans toute l'Union Européenne. Il encadre la **collecte**, le **stockage** et l'**usage** des données personnelles.

**En prospection B2B**, le RGPD ne vous interdit PAS la prospection. Vous pouvez utiliser la base légale "intérêt légitime" (article 6.1.f) pour contacter des décideurs B2B sans leur consentement préalable, à 4 conditions :

1. Email **professionnel** (pas Gmail/Hotmail perso)
2. Email **lié à l'activité** du destinataire (pas de B2C déguisé)
3. Opt-out **simple** dans chaque email
4. Données **proportionnées** (pas de scraping massif de données privées)

**Sanctions** :
- Amende CNIL : jusqu'à **4% du CA mondial** ou 20M€
- Plainte civile possible
- Réputation : domain blacklist

**En pratique**, la CNIL ne sanctionne quasiment jamais les TPE/PME qui font du démarchage B2B "raisonnable" et respectent l'opt-out.

Voir notre [guide complet RGPD prospection B2B](/blog/rgpd-prospection-b2b).`,
    related: ['cold-emailing', 'opt-out', 'cnil'],
    category: 'Légal',
  },
  {
    slug: 'opt-out',
    term: 'Opt-out',
    shortDef: 'Possibilité pour un destinataire de se désinscrire d\'une liste d\'emails.',
    longDef: `L'**opt-out** est le droit pour un destinataire d'**arrêter de recevoir** vos emails. C'est une obligation légale en France et en Europe (RGPD).

**Comment implémenter un opt-out conforme** :
- Lien **"Se désinscrire"** dans chaque email (pas caché)
- Page **publique d'opt-out** sur votre site
- Suppression de l'email **sous 30 jours max**
- Ajout à une **blocklist** pour ne plus jamais le contacter (même via autre canal)
- Confirmation écrite si demandée

**Différence opt-out vs opt-in** :
- **Opt-in** : le destinataire **demande** à recevoir (newsletter, lead magnet)
- **Opt-out** : le destinataire peut **refuser** après réception (cold email B2B)

En B2B, l'opt-out est suffisant (base légale "intérêt légitime"). En B2C, l'**opt-in explicite est obligatoire** (consentement préalable).

Prospectia gère l'opt-out automatiquement : page publique [/opt-out](/opt-out) + blocklist + filtrage automatique des futurs enrichissements.`,
    related: ['rgpd', 'cnil', 'cold-emailing'],
    category: 'Légal',
  },
  {
    slug: 'cnil',
    term: 'CNIL',
    shortDef: 'Commission Nationale de l\'Informatique et des Libertés. Autorité française de protection des données.',
    longDef: `La **CNIL** (Commission Nationale de l'Informatique et des Libertés) est l'autorité administrative indépendante française chargée de **faire respecter le RGPD** et la **loi Informatique et Libertés**.

**Rôle de la CNIL** :
- Recevoir les plaintes des particuliers (~14 000/an)
- Contrôler les entreprises (sur place ou sur pièces)
- Prononcer des sanctions (amendes, injonctions)
- Conseiller sur la conformité RGPD

**En prospection B2B**, la CNIL est rarement sollicitée. Les plaintes viennent surtout du B2C (newsletters non sollicitées, démarchage téléphonique abusif).

**Bonnes pratiques pour éviter la CNIL** :
- Respecter opt-out (cause #1 de plaintes)
- Mentions légales claires (nom, SIREN, adresse)
- Pas de scraping de données personnelles (LinkedIn perso, etc.)
- Ne pas acheter de bases de données externes douteuses
- Documenter votre base légale (intérêt légitime)

**Amendes 2024-2025** :
- Médiane TPE/PME : 5 000-50 000€
- Médiane ETI : 100 000-500 000€
- Grandes entreprises : plusieurs millions`,
    related: ['rgpd', 'opt-out', 'cold-emailing'],
    category: 'Légal',
  },
  {
    slug: 'deliverability',
    term: 'Deliverability',
    shortDef: 'Capacité d\'un email à arriver dans l\'inbox du destinataire (vs spam).',
    longDef: `La **deliverability** (délivrabilité) mesure le pourcentage d'emails qui arrivent dans la **boîte de réception principale** du destinataire (vs spam, promotions, ou bouncing).

**Une bonne deliverability = 90%+ d'inbox placement.** En cold emailing, c'est l'**indicateur le plus critique** (avant même le taux d'ouverture).

**Facteurs qui impactent la deliverability** :

1. **Authentification email** :
   - SPF, DKIM, DMARC correctement configurés
   - BIMI (logo dans Gmail)

2. **Réputation domaine** :
   - Âge du domaine (>30 jours)
   - Volume d'envoi régulier (pas de pics)
   - Taux de bounce <2%
   - Taux de plainte <0.1%

3. **Qualité du contenu** :
   - Pas de mots déclencheurs spam ("gratuit !", "argent rapide")
   - Ratio texte/HTML équilibré
   - Pas de liens raccourcis (bit.ly)
   - Pas d'images sans alt text

4. **Engagement** :
   - Taux d'ouverture (signal positif)
   - Réponses (excellent signal)
   - Mark as spam (très mauvais)

**Outils de test** :
- [Mail-tester.com](https://mail-tester.com) : score sur 10
- [GlockApps](https://glockapps.com) : test par provider
- [MXToolbox](https://mxtoolbox.com) : check blacklist`,
    related: ['cold-emailing', 'warm-up', 'spf-dkim-dmarc'],
    category: 'Technique',
  },
  {
    slug: 'warm-up',
    term: 'Warm-up (warming domain)',
    shortDef: 'Période d\'envoi progressif d\'emails pour construire la réputation d\'un nouveau domaine.',
    longDef: `Le **warm-up** (ou *warming*) est la période pendant laquelle on **augmente progressivement** le volume d'envoi d'un nouveau domaine email pour construire sa **réputation** auprès des fournisseurs (Gmail, Outlook, Yahoo).

**Pourquoi c'est nécessaire** :
Un nouveau domaine qui envoie soudainement 100 emails/jour = **comportement de spammer** → blacklist automatique.

**Protocole de warm-up classique** (28 jours) :
- Jour 1-3 : 5 emails/jour
- Jour 4-7 : 10 emails/jour
- Semaine 2 : 25 emails/jour
- Semaine 3 : 50 emails/jour
- Semaine 4 : 75 emails/jour
- Mois 2+ : 100-150/jour (max recommandé)

**Outils de warm-up automatique** :
- **Mailwarm** (~10$/mo)
- **Lemwarm** (intégré à Lemlist)
- **Warmup Inbox** (~9$/mo)
- **Mailreach** (10-30$/mo)

Ces outils simulent des échanges entre boîtes mail (envois + réponses + marquage "non-spam") pour construire artificiellement une réputation positive.

**Important** : même un domaine **chaud** doit être maintenu (envoi régulier d'emails légitimes). Ne pas envoyer pendant 2 mois = perte de réputation.`,
    related: ['deliverability', 'cold-emailing', 'spf-dkim-dmarc'],
    category: 'Technique',
  },
  {
    slug: 'spf-dkim-dmarc',
    term: 'SPF, DKIM, DMARC',
    shortDef: 'Trois protocoles d\'authentification email essentiels pour éviter le spam.',
    longDef: `**SPF**, **DKIM** et **DMARC** sont 3 protocoles DNS qui authentifient vos emails et préviennent l'**usurpation d'identité** (phishing).

**Sans ces 3 protocoles, vos emails finissent quasi-systématiquement en spam en 2026.**

### SPF (Sender Policy Framework)
Autorise certains serveurs à envoyer des emails depuis votre domaine.

Exemple record DNS TXT :
\`\`\`
v=spf1 include:_spf.google.com include:sendgrid.net ~all
\`\`\`

### DKIM (DomainKeys Identified Mail)
Signe cryptographiquement chaque email avec une clé privée. Les destinataires vérifient avec votre clé publique (record DNS).

Exemple record DNS TXT :
\`\`\`
v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQ...
\`\`\`

### DMARC (Domain-based Message Authentication)
Politique qui définit quoi faire si SPF ou DKIM échouent.

Exemple record DNS TXT :
\`\`\`
v=DMARC1; p=quarantine; rua=mailto:dmarc@votre-domaine.com
\`\`\`

**Politiques DMARC** :
- \`p=none\` : monitoring seulement
- \`p=quarantine\` : mettre en spam si échec
- \`p=reject\` : refuser totalement si échec

**Configuration** : 5-10 min via votre registrar DNS (OVH, Cloudflare, Gandi, etc.).

**Test** : [mxtoolbox.com](https://mxtoolbox.com/SuperTool.aspx) pour vérifier vos records.`,
    related: ['deliverability', 'warm-up', 'cold-emailing'],
    category: 'Technique',
  },
  {
    slug: 'b2b',
    term: 'B2B',
    shortDef: 'Business-to-Business : entreprise qui vend à d\'autres entreprises (vs B2C qui vend aux particuliers).',
    longDef: `**B2B** signifie *Business-to-Business* : entreprise qui vend des produits ou services à **d'autres entreprises**, par opposition au **B2C** (Business-to-Consumer) qui vend aux particuliers.

**Caractéristiques du B2B** :
- Cycles de vente plus longs (3-12 mois)
- Décisions multi-personnes (5-7 décideurs en moyenne)
- Ticket moyen plus élevé (5-100k€+)
- Relation long terme (LTV élevée)
- ROI mesurable et chiffré

**Canaux d'acquisition B2B principaux** :
- **Outbound** : cold email, cold call, LinkedIn outreach
- **Inbound** : SEO, content marketing, lead magnets
- **Paid** : Google Ads, LinkedIn Ads
- **Référence** : recommandation client (le plus efficace)
- **Partenariats** : intégrateurs, revendeurs, agences

**Outils B2B essentiels** :
- **CRM** : Pipedrive, HubSpot, Salesforce
- **Prospection** : Prospectia, Apollo, Hunter, Lusha
- **Email marketing** : Lemlist, Instantly, Klenty
- **Analytics** : Mixpanel, Amplitude, GA4`,
    related: ['icp', 'cold-emailing', 'crm'],
    category: 'Vente',
  },
  {
    slug: 'crm',
    term: 'CRM',
    shortDef: 'Customer Relationship Management. Logiciel pour gérer les prospects et clients.',
    longDef: `Un **CRM** (*Customer Relationship Management*) est un logiciel pour gérer toutes les interactions avec vos **prospects** et **clients** : contacts, deals, emails, appels, notes, tâches.

**À quoi sert un CRM** :
- Centraliser les contacts (vs Excel + emails dispersés)
- Suivre le pipeline commercial (où en sont vos deals)
- Automatiser les relances (séquences emails, tâches)
- Mesurer la performance (taux conversion, cycle de vente)
- Collaborer en équipe (assignment, notes partagées)

**CRMs populaires en 2026** :

| CRM | Pour qui ? | Prix |
|---|---|---|
| **Pipedrive** | TPE/PME | 14-99€/user/mo |
| **HubSpot** | Tous, freemium | 0-1200€/mo |
| **Salesforce** | ETI/grandes | 25-300€/user/mo |
| **Zoho CRM** | TPE/PME budget | 12-52€/user/mo |
| **Notion** | Solos/freelances | 8€/user/mo |
| **Folk** | Agences | 19-59€/user/mo |
| **Attio** | Tech-savvy | 29-99€/user/mo |

**Conseil** : commencez **simple**. Notion ou Pipedrive suffisent jusqu'à 10 commerciaux. Migrez vers HubSpot/Salesforce quand vraiment nécessaire.

Prospectia exporte en **CSV standard** (nom, email, téléphone, site web, adresse, département, catégorie) — compatible avec **n'importe quel CRM** : HubSpot, Salesforce, Zoho, Pipedrive, Notion. 1-clic depuis le dashboard.`,
    related: ['b2b', 'icp', 'cold-emailing'],
    category: 'Outils',
  },
  // ... (continuer à compléter pour atteindre 50)
];

export function getGlossaryTerm(slug) {
  return GLOSSARY.find((t) => t.slug === slug) || null;
}

export function getAllGlossaryTerms() {
  return GLOSSARY;
}

export function getGlossaryByCategory() {
  const grouped = {};
  for (const term of GLOSSARY) {
    if (!grouped[term.category]) grouped[term.category] = [];
    grouped[term.category].push(term);
  }
  return grouped;
}
