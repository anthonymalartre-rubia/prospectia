// ─────────────────────────────────────────────────────────────────────
// Email templates library — bibliothèque pré-faite pour Volia Campagnes
// ─────────────────────────────────────────────────────────────────────
// 20+ templates structurés, mix de catégories B2B, sélectionnables 1-clic
// depuis le formulaire de création de campagne (TemplateLibraryModal).
//
// Chaque template est testé pour fonctionner avec applyTemplate()
// (src/lib/campaign-templates.js) — variables {{first_name}},
// {{last_name}}, {{company}}, {{position_title}} sont auto-remplacées
// par les valeurs du contact à l'envoi.
//
// Conventions :
//   - subject : court (<70 caractères), 1 variable max pour ouvertur perso
//   - body_html : <p>, <strong>, <a> — pas de style inline lourd
//   - estimated_reply_rate : range benchmarké marché (à titre indicatif)
//   - use_case : phrase explicite "pour qui / quand"
// ─────────────────────────────────────────────────────────────────────

export const TEMPLATE_CATEGORIES = [
  { id: 'saas', label: 'SaaS B2B', color: 'blue' },
  { id: 'agence', label: 'Agence & Services', color: 'violet' },
  { id: 'ecommerce', label: 'E-commerce B2B', color: 'emerald' },
  { id: 'conseil', label: 'Cabinet conseil', color: 'amber' },
  { id: 'freelance', label: 'Freelance', color: 'pink' },
  { id: 'recrutement', label: 'Recrutement', color: 'cyan' },
  { id: 'event', label: 'Événementiel', color: 'rose' },
];

export const TEMPLATE_TAGS = [
  'cold', 'follow-up', 'post-demo', 'win-back',
  'demo', 'audit', 'partenariat', 'devis',
  'saas', 'agence', 'tech', 'sales', 'marketing',
];

export const EMAIL_TEMPLATES = [
  // ───── SaaS B2B (5) ─────
  {
    id: 'saas-demo-cold',
    category: 'saas',
    sector: 'tech',
    label: 'Demande de demo (cold outreach SaaS)',
    description: 'Premier contact froid pour proposer une démo de 8 minutes.',
    subject: '{{first_name}}, 8 minutes pour {{company}} ?',
    body_html: `<p>Bonjour {{first_name}},</p>
<p>Je viens de tomber sur {{company}} et j'ai pensé à vous écrire.</p>
<p>Chez Volia, on aide les boîtes SaaS B2B à <strong>générer 3× plus de RDV qualifiés</strong> sans agence ni SDR — directement depuis votre CRM, avec un waterfall multi-sources de 7 enrichisseurs.</p>
<p>Si c'est un sujet pour vous en ce moment, je peux vous envoyer une démo de 8 minutes ?</p>
<p>À très vite,<br>Anthony</p>
<p style="font-size:12px;color:#888;">PS — pas pour vous ? Désolé pour le bruit, je vous laisse tranquille.</p>`,
    tags: ['cold', 'demo', 'saas'],
    use_case: 'Founder SaaS B2B qui prospecte ses clients idéaux (ICP défini)',
    estimated_reply_rate: '8-12%',
  },
  {
    id: 'saas-bant-qualification',
    category: 'saas',
    sector: 'tech',
    label: 'Qualification BANT (post lead inbound)',
    description: 'Réponse à un lead entrant pour qualifier Budget/Authority/Need/Timeline.',
    subject: 'Re: votre demande — {{company}}',
    body_html: `<p>Bonjour {{first_name}},</p>
<p>Merci pour votre intérêt pour notre solution. Avant de caler un échange, j'aimerais comprendre votre contexte pour vous proposer la démo la plus pertinente.</p>
<p>Pourriez-vous me partager :</p>
<ul>
  <li><strong>Le périmètre</strong> que vous cherchez à équiper (taille d'équipe, volume actuel) ?</li>
  <li><strong>Le timing</strong> de votre projet (urgent, T+3 mois, exploratoire) ?</li>
  <li><strong>Les outils</strong> que vous utilisez actuellement (CRM, séquence, etc.) ?</li>
</ul>
<p>Avec ça, je peux vous proposer un créneau de 20 minutes avec la démo la plus alignée à vos besoins.</p>
<p>À très vite,<br>Anthony</p>`,
    tags: ['follow-up', 'demo', 'saas', 'sales'],
    use_case: 'AE SaaS qui veut qualifier rapidement un lead entrant',
    estimated_reply_rate: '40-60%',
  },
  {
    id: 'saas-followup-j3',
    category: 'saas',
    sector: 'tech',
    label: 'Follow-up J+3 (relance silencieuse)',
    description: 'Relance courte 3 jours après le cold outreach sans réponse.',
    subject: 'Petit up — {{company}}',
    body_html: `<p>Bonjour {{first_name}},</p>
<p>Je remonte ma précédente note au cas où elle se serait noyée dans votre boîte.</p>
<p>Pour rappel : on aide les SaaS B2B comme {{company}} à automatiser leur prospection sortante avec un workflow Lists → Campagnes → CRM tout intégré.</p>
<p>Est-ce que c'est un sujet pour vous ce trimestre, ou je vous re-contacte plus tard ?</p>
<p>Bonne journée,<br>Anthony</p>`,
    tags: ['follow-up', 'saas'],
    use_case: 'J+3 après cold email sans réponse — bump court et direct',
    estimated_reply_rate: '5-8%',
  },
  {
    id: 'saas-followup-j7-breakup',
    category: 'saas',
    sector: 'tech',
    label: 'Follow-up J+7 (break-up email)',
    description: 'Dernière relance avec "je vous laisse tranquille" — déclenche souvent une réponse.',
    subject: 'Je clos votre dossier ? — {{company}}',
    body_html: `<p>Bonjour {{first_name}},</p>
<p>Je vous ai écrit deux fois sans nouvelles — ce qui veut souvent dire l'une de ces trois choses :</p>
<ol>
  <li>Ce n'est pas une priorité pour vous → dites-le moi, je vous laisse tranquille.</li>
  <li>Vous êtes débordé(e) → on en reparle dans 3 mois ?</li>
  <li>Vous êtes intéressé(e) mais vous n'avez pas eu le temps de répondre → un simple "oui" suffit.</li>
</ol>
<p>Sans nouvelles, je clos votre dossier de mon côté. Aucun souci.</p>
<p>Bien à vous,<br>Anthony</p>`,
    tags: ['follow-up', 'win-back', 'saas'],
    use_case: 'Dernière chance — souvent meilleur taux de réponse de la séquence',
    estimated_reply_rate: '10-15%',
  },
  {
    id: 'saas-post-demo',
    category: 'saas',
    sector: 'tech',
    label: 'Post-démo (récap + next steps)',
    description: 'Envoyé dans les 30 minutes après la démo — récap clair + CTA.',
    subject: 'Récap de notre échange — {{company}}',
    body_html: `<p>Bonjour {{first_name}},</p>
<p>Merci pour le temps accordé. Comme promis, voici un récap de notre échange :</p>
<ul>
  <li><strong>Votre contexte :</strong> [à compléter manuellement]</li>
  <li><strong>Ce que Volia peut vous apporter :</strong> [à compléter manuellement]</li>
  <li><strong>Vos questions ouvertes :</strong> [à compléter manuellement]</li>
</ul>
<p><strong>Prochaines étapes :</strong> je vous propose qu'on se recale 30 minutes la semaine prochaine pour vous montrer le setup sur votre CRM en live.</p>
<p>Voici mon agenda : <a href="https://cal.com/votre-lien">cal.com/votre-lien</a></p>
<p>À très vite,<br>Anthony</p>`,
    tags: ['post-demo', 'saas', 'sales'],
    use_case: 'AE qui vient de faire une démo et veut closer le next step',
    estimated_reply_rate: '50-70%',
  },

  // ───── Agence & Services (3) ─────
  {
    id: 'agence-audit-gratuit',
    category: 'agence',
    sector: 'agence',
    label: 'Audit gratuit (lead magnet agence)',
    description: 'Propose un audit gratuit de 30 min comme porte d\'entrée.',
    subject: 'Audit gratuit de {{company}} ?',
    body_html: `<p>Bonjour {{first_name}},</p>
<p>Je suis tombé sur {{company}} en cherchant des acteurs sérieux dans votre secteur — et j'ai remarqué quelques points sur votre site qui méritent qu'on en discute.</p>
<p>On propose à nos prospects un <strong>audit gratuit de 30 minutes</strong> : on vous remonte 3-5 quick wins concrets que vous pouvez implémenter immédiatement, sans engagement.</p>
<p>Si ça vous intéresse, voici mon agenda : <a href="https://cal.com/votre-lien">cal.com/votre-lien</a></p>
<p>Bonne journée,<br>Anthony</p>`,
    tags: ['cold', 'audit', 'agence'],
    use_case: 'Agence (SEO, web, ads) qui prospecte des PME avec un audit teaser',
    estimated_reply_rate: '10-15%',
  },
  {
    id: 'agence-refonte-proposition',
    category: 'agence',
    sector: 'agence',
    label: 'Proposition de refonte (site / branding)',
    description: 'Cold email ciblé avec une observation concrète sur leur site.',
    subject: '{{company}} — quelques pistes pour votre site',
    body_html: `<p>Bonjour {{first_name}},</p>
<p>J'ai pris quelques minutes pour regarder votre site, et j'ai noté plusieurs points qui pourraient sensiblement <strong>améliorer votre taux de conversion</strong> :</p>
<ul>
  <li>Hero pas assez "punchline" — perte d'attention dans les 3 premières secondes</li>
  <li>CTA pas assez visibles (couleur trop neutre, position basse)</li>
  <li>Pas de social proof au-dessus de la ligne de flottaison</li>
</ul>
<p>On a refait des sites pour [X clients référence] avec en moyenne +30% de conversion. Je peux vous envoyer 2-3 exemples si ça vous intéresse ?</p>
<p>Bien à vous,<br>Anthony</p>`,
    tags: ['cold', 'agence'],
    use_case: 'Agence web qui prospecte avec observation concrète (haut taux de réponse)',
    estimated_reply_rate: '12-18%',
  },
  {
    id: 'agence-partenariat',
    category: 'agence',
    sector: 'agence',
    label: 'Proposition de partenariat (B2B agence)',
    description: 'Approche partenariat entre deux agences complémentaires.',
    subject: 'Synergie {{company}} × Volia ?',
    body_html: `<p>Bonjour {{first_name}},</p>
<p>Je suis Anthony, fondateur de Volia. On bosse avec une cinquantaine d'agences SEO et growth qui revendent notre suite de prospection B2B à leurs clients en marque blanche ou en sous-traitance.</p>
<p>Le pitch : <strong>vous gardez la relation client, on s'occupe du back-end</strong>. Marge typique 30-40% pour vous.</p>
<p>Si vous cherchez à muscler votre offre acquisition sans devoir développer une plateforme en interne, on peut en discuter 20 minutes ?</p>
<p>À très vite,<br>Anthony</p>`,
    tags: ['cold', 'partenariat', 'agence'],
    use_case: 'Cold outreach vers fondateurs d\'agences (partnership / white-label)',
    estimated_reply_rate: '8-12%',
  },

  // ───── E-commerce B2B (2) ─────
  {
    id: 'ecom-grossiste-prospection',
    category: 'ecommerce',
    sector: 'ecommerce',
    label: 'Prospection grossiste / fournisseur',
    description: 'Cold email pour devenir distributeur ou ouvrir un compte pro.',
    subject: 'Ouverture compte pro {{company}} ?',
    body_html: `<p>Bonjour {{first_name}},</p>
<p>Je suis [votre nom], responsable achats chez [votre marque]. On distribue actuellement [type de produits] dans [zone géo / canal] et on cherche à étoffer notre catalogue avec des marques comme {{company}}.</p>
<p>Quelques infos sur nous :</p>
<ul>
  <li><strong>Volume :</strong> [X k€] de CA annuel</li>
  <li><strong>Canaux :</strong> e-commerce + retail physique [X points de vente]</li>
  <li><strong>Cible :</strong> [votre persona client]</li>
</ul>
<p>Pourriez-vous m'indiquer la procédure pour ouvrir un compte pro et avoir vos conditions B2B ?</p>
<p>Merci d'avance,<br>Anthony</p>`,
    tags: ['cold', 'ecommerce'],
    use_case: 'Acheteur retail qui prospecte de nouvelles marques fournisseurs',
    estimated_reply_rate: '20-35%',
  },
  {
    id: 'ecom-affiliation',
    category: 'ecommerce',
    sector: 'ecommerce',
    label: 'Partenariat affiliation / influence',
    description: 'Approche d\'un média ou créateur pour un programme d\'affiliation.',
    subject: 'Partenariat affiliation — {{company}}',
    body_html: `<p>Bonjour {{first_name}},</p>
<p>Je suis tombé sur {{company}} et votre audience colle parfaitement avec notre cible. On vient de lancer un programme d'affiliation premium avec :</p>
<ul>
  <li><strong>Commission :</strong> 15% sur chaque vente (cookie 60 jours)</li>
  <li><strong>Panier moyen :</strong> 180€ → ~27€ de commission par conversion</li>
  <li><strong>Outils :</strong> dashboard temps réel, codes promo personnalisés, créatives prêtes à l'emploi</li>
</ul>
<p>Si vous voulez tester, je peux vous envoyer le code d'inscription prioritaire avec un bonus de bienvenue ?</p>
<p>Bien à vous,<br>Anthony</p>`,
    tags: ['cold', 'partenariat', 'ecommerce'],
    use_case: 'E-commerce qui recrute des affiliés (blogueurs, créateurs, médias niches)',
    estimated_reply_rate: '15-25%',
  },

  // ───── Cabinet conseil (2) ─────
  {
    id: 'conseil-audit-strategique',
    category: 'conseil',
    sector: 'conseil',
    label: 'Audit stratégique (cold C-level)',
    description: 'Approche C-level avec une question diagnostic forte.',
    subject: '{{first_name}} — votre roadmap 2026 ?',
    body_html: `<p>Bonjour {{first_name}},</p>
<p>Une question simple : sur les 12 prochains mois, quel est le sujet stratégique qui vous empêche de dormir chez {{company}} ?</p>
<p>Je pose la question parce qu'on accompagne actuellement [N] dirigeants du secteur sur ce type d'enjeu, et un pattern revient systématiquement : <strong>[insight sectoriel à compléter]</strong>.</p>
<p>Si ça résonne, je serais ravi d'échanger 30 minutes — sans agenda commercial, juste un partage d'expérience.</p>
<p>Cordialement,<br>Anthony</p>`,
    tags: ['cold', 'conseil'],
    use_case: 'Consultant senior qui prospecte du C-level avec une question ouverte',
    estimated_reply_rate: '12-20%',
  },
  {
    id: 'conseil-accompagnement',
    category: 'conseil',
    sector: 'conseil',
    label: 'Mission d\'accompagnement (post-RDV)',
    description: 'Proposition d\'accompagnement structurée après un premier RDV.',
    subject: 'Proposition mission — {{company}}',
    body_html: `<p>Bonjour {{first_name}},</p>
<p>Suite à notre échange, voici ma proposition d'accompagnement pour {{company}} :</p>
<p><strong>Format :</strong> mission de 3 mois, 2 jours/semaine sur site + suivi remote</p>
<p><strong>Livrables :</strong></p>
<ul>
  <li>Diagnostic complet à J+15 (workshop + restitution écrite)</li>
  <li>Plan d'action priorisé avec quick wins et chantiers structurels</li>
  <li>Mise en place opérationnelle avec votre équipe</li>
  <li>Bilan + roadmap de continuation à M+3</li>
</ul>
<p><strong>Investissement :</strong> [montant] HT, payable à 30/60/30%</p>
<p>Je vous joins le contrat type. On peut caler 30 minutes pour répondre à vos questions et ajuster le périmètre ?</p>
<p>Bien à vous,<br>Anthony</p>`,
    tags: ['post-demo', 'conseil'],
    use_case: 'Consultant qui formalise une proposition après un échange exploratoire',
    estimated_reply_rate: '40-55%',
  },

  // ───── Freelance (2) ─────
  {
    id: 'freelance-candidature',
    category: 'freelance',
    sector: 'freelance',
    label: 'Candidature spontanée freelance',
    description: 'Présentation freelance ciblée avec un cas concret.',
    subject: 'Freelance dispo pour {{company}}',
    body_html: `<p>Bonjour {{first_name}},</p>
<p>Je suis [votre nom], freelance [spécialité] depuis [X ans], et je me permets de vous écrire car j'ai remarqué que {{company}} [observation concrète : recrute, lance un nouveau produit, etc.].</p>
<p>Quelques références récentes :</p>
<ul>
  <li><strong>[Client 1]</strong> : [résultat chiffré]</li>
  <li><strong>[Client 2]</strong> : [résultat chiffré]</li>
  <li><strong>[Client 3]</strong> : [résultat chiffré]</li>
</ul>
<p>Je suis dispo à partir de [date] pour des missions [TJM ou forfait] en remote ou hybride sur Paris.</p>
<p>Si ça matche, je peux vous envoyer mon portfolio et 2-3 références qui peuvent vous parler de moi ?</p>
<p>Bien à vous,<br>Anthony</p>`,
    tags: ['cold', 'freelance'],
    use_case: 'Freelance qui prospecte des prospects ciblés (pas de plateforme)',
    estimated_reply_rate: '10-18%',
  },
  {
    id: 'freelance-devis-spontane',
    category: 'freelance',
    sector: 'freelance',
    label: 'Devis spontané (post-recommandation)',
    description: 'Envoi d\'un devis suite à une recommandation ou un événement.',
    subject: 'Devis comme convenu — {{company}}',
    body_html: `<p>Bonjour {{first_name}},</p>
<p>Comme convenu, voici mon devis pour la mission [intitulé] chez {{company}}.</p>
<p><strong>Périmètre :</strong></p>
<ul>
  <li>[Livrable 1]</li>
  <li>[Livrable 2]</li>
  <li>[Livrable 3]</li>
</ul>
<p><strong>Délai :</strong> [X] semaines à compter du kick-off<br>
<strong>Tarif :</strong> [montant] HT (acompte 40% à la signature, solde à la livraison)</p>
<p>Devis détaillé en pièce jointe. Je reste dispo pour ajuster le périmètre si besoin. On peut signer dès cette semaine si ça vous convient ?</p>
<p>Bien à vous,<br>Anthony</p>`,
    tags: ['devis', 'freelance'],
    use_case: 'Freelance qui formalise un devis post-discussion (recommandation, event)',
    estimated_reply_rate: '60-80%',
  },

  // ───── Recrutement (3) ─────
  {
    id: 'recrutement-sales-passif',
    category: 'recrutement',
    sector: 'recrutement',
    label: 'Approche talent Sales passif',
    description: 'Cold message LinkedIn-style pour AE / SDR en poste.',
    subject: 'Curieux de discuter ? — opportunité Sales',
    body_html: `<p>Bonjour {{first_name}},</p>
<p>Je tombe sur votre profil et votre parcours chez {{company}} m'intrigue — vous semblez gérer un cycle de vente assez complexe avec succès.</p>
<p>On accompagne une scale-up SaaS en hyper-croissance qui cherche son prochain Senior AE pour porter le segment Enterprise France. Quelques infos :</p>
<ul>
  <li><strong>Package :</strong> 80-110k OTE (50/50), uncapped</li>
  <li><strong>Équipe :</strong> Sales team de 12, target moyenne atteinte 130% l'an dernier</li>
  <li><strong>Produit :</strong> leader sur son segment, NRR 130%+</li>
</ul>
<p>Pas urgent, juste curieux : ça vous dirait qu'on en discute 20 min ? Conversation confidentielle bien sûr.</p>
<p>Bien à vous,<br>Anthony</p>`,
    tags: ['cold', 'recrutement', 'sales'],
    use_case: 'Recruteur ou TA qui chasse un Senior AE / SDR en poste',
    estimated_reply_rate: '15-25%',
  },
  {
    id: 'recrutement-tech-passif',
    category: 'recrutement',
    sector: 'recrutement',
    label: 'Approche talent Tech passif',
    description: 'Cold message pour dev senior / lead tech.',
    subject: 'Opportunité tech — stack {{company}}',
    body_html: `<p>Bonjour {{first_name}},</p>
<p>Je suis tombé sur votre GitHub et vos contributions sur [techno] m'ont vraiment intéressé. Bravo pour le travail sur [projet].</p>
<p>Je recrute pour une scale-up Series B (50 personnes, profitable) qui cherche un Lead Backend pour scaler son architecture. Stack : [Node/Go/Rust] + Postgres + Kubernetes.</p>
<p>Ce qui devrait vous parler :</p>
<ul>
  <li>Pas de legacy, codebase clean (3 ans)</li>
  <li>4 jours/semaine en remote possible</li>
  <li>Stock options + package 80-100k</li>
  <li>Équipe tech de 8 (4 seniors)</li>
</ul>
<p>Pas urgent pour vous ? On peut en discuter 20 min juste pour échanger, sans engagement.</p>
<p>À très vite,<br>Anthony</p>`,
    tags: ['cold', 'recrutement', 'tech'],
    use_case: 'TA qui chasse un Lead Dev / Senior Engineer en poste',
    estimated_reply_rate: '12-20%',
  },
  {
    id: 'recrutement-marketing-passif',
    category: 'recrutement',
    sector: 'recrutement',
    label: 'Approche talent Marketing passif',
    description: 'Cold message pour Head of Marketing / Growth Manager.',
    subject: 'Curieux pour {{first_name}} ? Head of Growth',
    body_html: `<p>Bonjour {{first_name}},</p>
<p>Votre parcours chez {{company}} m'a tapé dans l'œil — votre approche [stratégie marketing observée] est exactement ce qu'on cherche pour structurer la croissance d'une scale-up SaaS B2B.</p>
<p>Le contexte :</p>
<ul>
  <li><strong>Stade :</strong> Series A, 2M€ ARR, +200% YoY</li>
  <li><strong>Rôle :</strong> Head of Growth — équipe à construire (1 contenu + 1 ops déjà en place)</li>
  <li><strong>Package :</strong> 70-90k + BSPCE significatifs</li>
  <li><strong>Reporting :</strong> directement au CEO</li>
</ul>
<p>Pas pour tout de suite ? Je le comprends. On peut juste se caler 20 minutes pour que je vous présente le projet — vous décidez après ?</p>
<p>Bien à vous,<br>Anthony</p>`,
    tags: ['cold', 'recrutement', 'marketing'],
    use_case: 'TA qui chasse un Head of Marketing / Growth en poste',
    estimated_reply_rate: '15-22%',
  },

  // ───── Événementiel (3) ─────
  {
    id: 'event-invitation',
    category: 'event',
    sector: 'event',
    label: 'Invitation event (conférence / meetup)',
    description: 'Invitation ciblée à un event B2B avec valeur claire.',
    subject: 'Invitation — {{first_name}} chez {{company}}',
    body_html: `<p>Bonjour {{first_name}},</p>
<p>On organise le <strong>[Nom de l'event]</strong> le [date] à [lieu], avec :</p>
<ul>
  <li>3 keynotes de [intervenants notables]</li>
  <li>2 ateliers pratiques sur [thématiques]</li>
  <li>Networking premium avec une cinquantaine de dirigeants B2B</li>
</ul>
<p>Vu votre rôle chez {{company}}, je pense que ça pourrait vraiment vous intéresser. Je vous réserve une place gratuite (cadeau VIP) si vous me dites oui d'ici vendredi ?</p>
<p>Programme complet : <a href="https://votre-event.com">votre-event.com</a></p>
<p>Au plaisir de vous y voir,<br>Anthony</p>`,
    tags: ['cold', 'event'],
    use_case: 'Event organizer qui remplit une salle avec un ICP ciblé',
    estimated_reply_rate: '15-25%',
  },
  {
    id: 'event-sponsor',
    category: 'event',
    sector: 'event',
    label: 'Proposition sponsoring event',
    description: 'Démarchage sponsor avec ROI clair et chiffres concrets.',
    subject: 'Sponsoring {{first_name}} — [Nom event]',
    body_html: `<p>Bonjour {{first_name}},</p>
<p>On organise le <strong>[Nom event]</strong>, [nème] édition d'un événement référent dans [secteur], avec :</p>
<ul>
  <li><strong>500+ décideurs B2B</strong> attendus (CMO, COO, CEO)</li>
  <li>Couverture média (3 médias partenaires, ~50k impressions)</li>
  <li>Format premium (1 journée, dîner de gala, networking ciblé)</li>
</ul>
<p>Pour {{company}}, ça représenterait :</p>
<ul>
  <li>Visibilité forte sur votre cible ICP exacte</li>
  <li>3-5 leads chauds en moyenne par sponsor</li>
  <li>Possibilité d'intervenir en keynote (slot Gold)</li>
</ul>
<p>Trois formules : Silver (5k€), Gold (12k€), Platinum (25k€). Je vous envoie le dossier complet en PDF si vous voulez creuser ?</p>
<p>Bien à vous,<br>Anthony</p>`,
    tags: ['cold', 'partenariat', 'event'],
    use_case: 'Event organizer qui démarche des sponsors B2B',
    estimated_reply_rate: '10-18%',
  },
  {
    id: 'event-followup-post',
    category: 'event',
    sector: 'event',
    label: 'Follow-up post-event (lead chaud)',
    description: 'Relance à chaud sur des leads collectés pendant un event.',
    subject: 'Ravi de notre échange à [Event] — {{company}}',
    body_html: `<p>Bonjour {{first_name}},</p>
<p>Ravi d'avoir échangé avec vous à <strong>[Nom event]</strong> mardi dernier. Comme convenu, je reviens vers vous pour donner suite à notre discussion sur [sujet abordé].</p>
<p>Pour rappel, on aide des boîtes comme {{company}} à <strong>[bénéfice principal]</strong>. Je vous joins une étude de cas qui correspond à votre contexte : [lien étude de cas].</p>
<p>On se cale 20 minutes la semaine prochaine pour creuser ?</p>
<p>Voici mon agenda : <a href="https://cal.com/votre-lien">cal.com/votre-lien</a></p>
<p>À très vite,<br>Anthony</p>`,
    tags: ['follow-up', 'post-demo', 'event'],
    use_case: 'Sales qui relance les leads collectés sur un salon / conférence',
    estimated_reply_rate: '40-55%',
  },

  // ───── Bonus cross-secteur (2) ─────
  {
    id: 'win-back-ancien-client',
    category: 'saas',
    sector: 'tech',
    label: 'Win-back ancien client (churn)',
    description: 'Reconquête d\'un client perdu il y a 6-12 mois.',
    subject: 'Vous nous manquez — {{company}}',
    body_html: `<p>Bonjour {{first_name}},</p>
<p>Ça fait quelques mois que vous avez quitté Volia, et honnêtement, je voulais juste prendre des nouvelles — sans pitch commercial.</p>
<p>Si vous avez 2 minutes, j'aimerais comprendre ce qui n'a pas fonctionné de votre côté :</p>
<ul>
  <li>Le produit ne correspondait pas à votre besoin ?</li>
  <li>Le tarif était trop élevé pour la valeur perçue ?</li>
  <li>Un concurrent vous a apporté quelque chose qu'on n'avait pas ?</li>
</ul>
<p>PS : on a sorti pas mal de nouveautés depuis (campagnes auto + warmup intégré + CRM natif). Si vous voulez tester gratuitement la nouvelle version pendant 30 jours, dites-moi.</p>
<p>Bien à vous,<br>Anthony</p>`,
    tags: ['win-back', 'saas'],
    use_case: 'Customer Success qui tente de récupérer un ancien client',
    estimated_reply_rate: '20-30%',
  },
  {
    id: 'referral-ask',
    category: 'saas',
    sector: 'tech',
    label: 'Demande de référence (client satisfait)',
    description: 'Demande de mise en relation auprès d\'un client content.',
    subject: 'Un service à vous demander — {{company}}',
    body_html: `<p>Bonjour {{first_name}},</p>
<p>Très content de voir que Volia continue de vous apporter de la valeur chez {{company}} (les chiffres de votre dashboard sont impressionnants !).</p>
<p>J'ai un petit service à vous demander : auriez-vous 1 ou 2 dirigeants dans votre réseau qui pourraient bénéficier de notre solution ? Profil idéal : SaaS B2B France, 10-50 personnes, équipe Sales en place.</p>
<p>En échange, je vous offre un mois gratuit sur votre plan, et une commission de 10% sur la première année pour chaque référence convertie. Win-win.</p>
<p>Vous pouvez juste me forwarder ce mail à la personne avec un mot d'intro, je m'occupe du reste.</p>
<p>Merci d'avance,<br>Anthony</p>`,
    tags: ['follow-up', 'partenariat', 'saas'],
    use_case: 'CSM qui active le bouche-à-oreille sur les clients satisfaits',
    estimated_reply_rate: '25-40%',
  },
];

// Helpers pour la UI ────────────────────────────────────────────────

/**
 * Retourne un template par ID, ou null.
 */
export function getTemplateById(id) {
  return EMAIL_TEMPLATES.find((t) => t.id === id) || null;
}

/**
 * Filtre les templates par catégorie + tags + texte de recherche.
 */
export function filterTemplates({ category, tags, search } = {}) {
  const needle = (search || '').trim().toLowerCase();
  return EMAIL_TEMPLATES.filter((t) => {
    if (category && t.category !== category) return false;
    if (tags && tags.length > 0 && !tags.some((tag) => t.tags.includes(tag))) return false;
    if (needle) {
      const haystack = `${t.label} ${t.description} ${t.use_case} ${t.tags.join(' ')}`.toLowerCase();
      if (!haystack.includes(needle)) return false;
    }
    return true;
  });
}

/**
 * Retourne le label lisible d'une catégorie.
 */
export function getCategoryLabel(categoryId) {
  return TEMPLATE_CATEGORIES.find((c) => c.id === categoryId)?.label || categoryId;
}
