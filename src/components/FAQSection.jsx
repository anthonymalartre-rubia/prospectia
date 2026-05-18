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
      "Notre enrichissement en cascade (waterfall) teste jusqu'a 7 sources dans l'ordre : scraping du site web, recherche Google (Serper), Apollo.io, Enrichly, Anymail Finder, Findymail, puis un fallback intelligent (contact@domaine.com). Le processus s'arrete des qu'un email est trouve, pour minimiser les couts.",
  },
  {
    question: "Puis-je exporter vers mon CRM ?",
    answer:
      "Oui, l'export CSV standard est compatible avec tous les CRM (HubSpot, Salesforce, Zoho, Pipedrive, etc.) et tous les outils d'outreach (Lemlist, Apollo, Smartlead...). Vous pouvez aussi filtrer vos leads avant l'export pour n'obtenir que les prospects pertinents.",
  },
  {
    question: "Quelles sont les limites du plan gratuit ?",
    answer:
      "Le plan gratuit vous permet de tester la plateforme avec un nombre limite de recherches, enrichissements et exports par mois. Le scraping email basique est inclus gratuitement et sans limite. Pour debloquer les sources payantes (Apollo, Enrichly, etc.) et les volumes plus importants, passez au plan Pro.",
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
      "Ces outils ne proposent qu'une seule source d'enrichissement et facturent entre 36€ et 99€/mois. Prospectia est un agregateur : nous combinons 7 sources (dont Apollo lui-meme) en une recherche unique, avec scoring de confiance, pour 49€/mois. En plus, nous proposons la recherche Google Places integree, 150+ categories et la couverture des 101 departements francais — des fonctionnalites absentes chez Apollo, Hunter, Lusha, Snov.io et Dropcontact.",
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
