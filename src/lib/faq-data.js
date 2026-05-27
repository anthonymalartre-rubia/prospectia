// Source unique des Q/R de la landing — partagée entre le client component
// (FAQSection accordion) et le serveur (JSON-LD FAQPage schema dans page.js).

export const FAQ_ITEMS = [
  {
    question: "Concrètement, c'est quoi Volia ?",
    answer:
      "Apollo + Lemlist + HubSpot, recodés pour le marché français à 19€/mois. On trouve les boites (Google Places, 150+ catégories, 101 départements), on chope leurs emails (waterfall scraping + Google + patterns), on envoie des séquences, on track les réponses dans le CRM. Une seule app au lieu de 4.",
  },
  {
    question: "Les données sont fiables ?",
    answer:
      "Les infos viennent direct de Google Places (nom, adresse, tél, site, avis). Sur chaque email, un score : Vérifié (trouvé sur le site), Google (récupéré via recherche), Probable (deviné par pattern). Vous filtrez selon votre niveau de confort.",
  },
  {
    question: "Combien de prospects par recherche ?",
    answer:
      "Entre 20 et 60 par combo département × catégorie en moyenne. Une recherche Île-de-France toutes catégories B2B : plusieurs centaines de leads qualifiés. Tout dépend de la densité du secteur.",
  },
  {
    question: "L'enrichissement email, ça marche comment ?",
    answer:
      "Cascade waterfall : on scrape le site, puis on cherche sur Google via Serper, puis on devine via patterns courants (contact@, info@…). On s'arrête au premier email trouvé. Chaque email a son score de confiance. Pas de magie, pas d'oracle.",
  },
  {
    question: "J'exporte vers mon CRM ?",
    answer:
      "Oui. Export CSV standard compatible HubSpot, Salesforce, Zoho, Pipedrive, Lemlist, Apollo, Smartlead. Format Zoho dédié dispo. Vous pouvez aussi filtrer avant export pour ne sortir que les bons leads.",
  },
  {
    question: "Le plan gratuit, ça couvre quoi ?",
    answer:
      "Starter = 100 prospects, 20 enrichissements, 5 exports par mois. Pour tester. À 1 000 prospects + 400 enrichissements, c'est Solo à 19€/mois — le moins cher du marché français. Pro à 49€ et Business à 99€ pour les gros volumes.",
  },
  {
    question: "Mes données sont en sécu ?",
    answer:
      "Chiffrement TLS 1.2+ au repos et en transit. RGPD respecté à la lettre : vos leads vous appartiennent, vous exportez ou supprimez quand vous voulez. Aucune donnée revendue, jamais. C'est non négociable.",
  },
  {
    question: "Je peux annuler quand je veux ?",
    answer:
      "Sans engagement. 1 clic dans les paramètres, l'accès reste actif jusqu'à la fin de la période payée. Vos données restent accessibles tant que le compte existe.",
  },
  {
    question: "Quelle différence avec Apollo, Hunter ou Lusha ?",
    answer:
      "Apollo, Hunter, Lusha enrichissent des listes que vous avez déjà. Volia fait les DEUX : on découvre les boites (Google Places, 101 dépts × 150 catégories) ET on chope les emails. À 19€/mois (vs 49€ Hunter, 99€ Apollo), c'est le ticket d'entrée le moins cher du marché français.",
  },
  {
    question: "Et vs HubSpot + Apollo + Lemlist en stack ?",
    answer:
      "Stack classique B2B = HubSpot + Apollo + Lemlist + un email finder. Total : ~270€/mois. Volia c'est les 4 dans une app à 99€/mois (Business). Les données sont partagées en natif : un lead découvert en Prospection devient contact CRM dès qu'il répond à une campagne. Zéro export/import entre outils.",
  },
  {
    question: "Je peux prendre que la Prospection ?",
    answer:
      "Oui. Solo à 19€/mois ne contient que la Prospection — parfait si vous avez déjà Lemlist ou HubSpot. En vrai, 90% de nos clients passent vite sur Business pour les 4 modules connectés : le gain de temps écrase les 80€ d'écart.",
  },
  {
    question: "La recherche en langage naturel, comment ça marche ?",
    answer:
      "Vous tapez en français : « restaurants haut de gamme à Paris et Lyon ». L'IA (Claude) traduit en catégories Google Places + départements, et lance la recherche. Aucune configuration manuelle.",
  },
];
