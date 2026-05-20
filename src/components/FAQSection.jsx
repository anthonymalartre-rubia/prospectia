"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const FAQ_ITEMS = [
  {
    question: "Comment fonctionne Prospectia.ai ?",
    answer:
      "Prospectia utilise l'API Google Places pour identifier les entreprises correspondant a vos criteres (departement, categorie). Ensuite, notre systeme d'enrichissement en cascade scrape les sites web, pages contact et mentions legales pour extraire les emails professionnels. Tout est automatise : vous selectionnez vos cibles, on fait le reste.",
  },
  {
    question: "Les donnees sont-elles fiables ?",
    answer:
      "Les informations proviennent directement de Google Places (nom, adresse, telephone, site web, avis). Pour les emails, chaque adresse recoit un score de fiabilite : verification de domaine (100 pts), email contact@ (80 pts), email professionnel (60 pts), email generique (20 pts). Vous pouvez filtrer par niveau de confiance.",
  },
  {
    question: "Combien de prospects puis-je trouver ?",
    answer:
      "Cela depend du departement et de la categorie. En moyenne, une recherche retourne entre 20 et 60 prospects par combinaison departement/categorie. Pour une recherche sur l'Ile-de-France avec toutes les categories B2B, vous pouvez obtenir plusieurs centaines de leads qualifies.",
  },
  {
    question: "Comment fonctionne l'enrichissement email ?",
    answer:
      "Notre enrichissement en cascade (waterfall) combine plusieurs methodes : scraping intelligent du site web de l'entreprise, recherche Google pour identifier les emails publics, puis un fallback sur les patterns courants (contact@, info@). Le processus s'arrete des qu'un email est trouve et vous donne un score de confiance (verifie, probable, devine).",
  },
  {
    question: "Puis-je exporter vers mon CRM ?",
    answer:
      "Oui, l'export CSV standard est compatible avec tous les CRM (HubSpot, Salesforce, Zoho, Pipedrive, etc.) et tous les outils d'outreach (Lemlist, Apollo, Smartlead...). Vous pouvez aussi filtrer vos leads avant l'export pour n'obtenir que les prospects pertinents.",
  },
  {
    question: "Quelles sont les limites du plan gratuit ?",
    answer:
      "Le plan Starter (gratuit) vous offre 100 prospects, 20 enrichissements et 5 exports par mois pour decouvrir la plateforme. Pour passer a 1 000 prospects + 400 enrichissements, le plan Solo est a seulement 19€/mois — le ticket d'entree le moins cher du marche. Plans Pro (49€) et Business (99€) disponibles pour volumes plus eleves.",
  },
  {
    question: "Mes donnees sont-elles securisees ?",
    answer:
      "Absolument. Vos donnees sont stockees sur Supabase avec chiffrement au repos et en transit. Nous sommes conformes au RGPD : vos leads vous appartiennent, vous pouvez les supprimer a tout moment. Aucune donnee n'est partagee avec des tiers.",
  },
  {
    question: "Puis-je annuler a tout moment ?",
    answer:
      "Oui, sans engagement. Vous pouvez annuler votre abonnement Pro ou Enterprise a tout moment depuis votre compte. Vos donnees et leads restent accessibles meme apres l'annulation, tant que votre compte existe.",
  },
  {
    question: "Quelle est la difference avec Apollo.io, Hunter ou Lusha ?",
    answer:
      "Apollo, Hunter et Lusha sont des bases de donnees d'enrichissement : vous devez deja avoir une liste de prospects a enrichir. Prospectia fait les DEUX en un : decouverte des prospects via Google Places (150+ categories, 101 departements francais) + enrichissement email automatique. A partir de 19€/mois avec Solo (vs 39€ Snov, 49€ Hunter, 99€ Apollo), c'est le ticket d'entree le moins cher du marche francais.",
  },
  {
    question: "Comment fonctionne la recherche en langage naturel ?",
    answer:
      "Decrivez simplement ce que vous cherchez en francais, par exemple : \"je cherche des restaurants haut de gamme a Paris et Lyon\". Notre IA analyse votre requete, identifie les categories et departements correspondants, puis lance automatiquement la recherche. Pas besoin de configurer manuellement.",
  },
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState(null);

  const toggle = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-24 px-6 border-t border-white/[0.06]">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-sm font-semibold text-violet-400 mb-3">FAQ</p>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Questions frequentes
          </h2>
          <p className="text-zinc-500 text-lg max-w-xl mx-auto">
            Tout ce que vous devez savoir sur Prospectia.ai
          </p>
        </div>

        <div className="space-y-3">
          {FAQ_ITEMS.map((item, index) => (
            <div
              key={index}
              className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm overflow-hidden transition-colors hover:border-white/[0.1]"
            >
              <button
                onClick={() => toggle(index)}
                className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left"
              >
                <span className="text-sm sm:text-base font-medium text-zinc-200">
                  {item.question}
                </span>
                <ChevronDown
                  size={18}
                  className={`text-zinc-500 flex-shrink-0 transition-transform duration-300 ${
                    openIndex === index ? "rotate-180" : ""
                  }`}
                />
              </button>
              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  openIndex === index ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                }`}
              >
                <div className="px-6 pb-5 pt-0">
                  <p className="text-sm text-zinc-400 leading-relaxed">
                    {item.answer}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
