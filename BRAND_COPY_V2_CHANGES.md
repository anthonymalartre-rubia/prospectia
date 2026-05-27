# Brand Sprint 1 V2 — Refonte copy complete

Worktree: `worktree-agent-a366ffb78f6ff7944`
Date: 2026-05-27

## Objectif

Continuer le Brand Sprint 1 (qui a plante apres 3 fichiers) en refondant
tout le reste de la copy dans le ton "punchy direct" type Plausible /
Cal.com :

- Tutoiement dans l'app (dashboard, empty states, onboarding).
- Vouvoiement sur pages publiques, legal, auth, settings.
- Phrases courtes, verbes d'action.
- Pas de bullshit corporate (leverage, ROI exponentiel, synergie...).
- Honnetete radicale OK ("On a recodé Apollo + Lemlist pour 19€/mois.").

## Files modifies par categorie

### Empty states (CRITIQUE)
- `src/components/forms/builder/EmptyCanvas.jsx`
- `src/components/forms/builder/JumpLogicDrawer.jsx`
- `src/components/forms/stats/TopFormsTable.jsx`
- `src/app/admin/forms/page.js` (hero + empty state hub)
- `src/app/admin/forms/[id]/responses/page.js`
- `src/app/admin/prospection/page.js` (hero + empty + RGPD footer)
- `src/app/admin/prospection/campaigns/page.js`
- `src/app/admin/prospection/campaigns/new/page.js` (empty liste)
- `src/app/admin/prospection/sequences/page.js`
- `src/app/admin/prospection/sequences/[id]/page.js`
- `src/app/admin/prospection/sms/page.js`
- `src/app/admin/prospection/lists/[id]/page.js`
- `src/app/admin/leads/page.js`
- `src/app/app/crm/page.js` (gating + empty pipeline)
- `src/app/app/crm/contacts/page.js`
- `src/app/app/crm/activities/page.js`
- `src/app/app/crm/inbound/page.js`
- `src/components/ResultsPanel.jsx` (empty recherche)
- `src/components/crm/ContactsList.jsx`
- `src/components/lists/ImportFromCrmModal.jsx`
- `src/components/lists/ImportFromProspectionModal.jsx`
- `src/components/SendToCampagneModal.jsx`
- `src/components/crm/SendToCrmModal.jsx`
- `src/components/ApiKeysManager.jsx`
- `src/components/NotificationBell.jsx`
- `src/locales/fr.js` (results.noProspects + descs)

### Pricing
- `src/components/PricingContent.jsx` :
  - Hero refondu : "On a recodé Apollo + Lemlist pour 19€/mois."
  - Tagline pricing : "Les prix. Sans bullshit."
  - Refonte 12 FAQ (ton "voici la vraie raison", honnetete radicale)
  - Refonte titres comparatif + guide de choix
- `src/locales/fr.js` (settings.upgrade*, settings.dangerZone*)

### FAQ
- `src/components/FAQSection.jsx` (titre "Les vraies questions.")
- `src/lib/faq-data.js` (refonte 12 items, ton direct + honnete)

### Auth pages
- Login / signup / forgot / reset = deja refondus via locales/fr.js
  par le Brand Sprint 1 precedent (auth.* keys)

### Pages produits commerciales
- `src/app/produits/prospection/page.js` (titres sections)
- `src/app/produits/campagnes/page.js` (final CTA + section)
- `src/app/produits/crm/page.js` (final CTA)
- `src/app/produits/formulaires/page.js` (hero + final CTA)

### Emails transactionnels (lib/emailTemplates.js)
- welcomeEmail : subject "Bienvenue. On commence ?" + tutoiement
- usageWarningEmail : "X% utilises. Heads up." + greeting "Salut"
- usageLimitReachedEmail : "Limite atteinte. On fait quoi ?"
- paymentSuccessEmail : "Plan, c'est fait. Bienvenue."
- subscriptionCancelledEmail : "Abonnement annule. Vos donnees restent."
- planChangedEmail : "Vous etes maintenant sur X"
- paymentFailedEmail : "Le paiement n'est pas passe"
- trialStartedEmail : "14 jours de Pro. Sans CB. Go."
- trialExpiringEmail : "X jours de Pro restants"
- trialExpiredEmail : "Trial terminé. Bilan rapide."
- authSignupConfirm : "Confirmez votre email — Volia" + "Bienvenue. Un dernier truc."
- authPasswordReset : "Nouveau mot de passe — Volia"
- authResendConfirmation : "Voilà, le nouveau lien."
- monthlyUpgradeNudgeEmail : sujets + greeting refondus
- referralPushEmail : "3 mois Pro offerts. Voici comment."
- referralRewardEmail : "+1 mois Pro offert. Merci pour l'invitation."

### Toasts
- `src/app/settings/email-senders/page.js` : 3 messages clés refondus
  (domaine verifie, warmup demarre, vérif échouée)

### Pages erreur
- `src/app/not-found.js` : "Cette page n'existe pas. Mais on peut t'aider."
- `src/app/error.js` : "Ça a planté. On regarde, retentez dans 30 sec."
- `src/app/dashboard/error.js` : "Le dashboard a planté. Tes données sont en sécu."

### Settings + profil
- `src/locales/fr.js` : settings.upgrade*, settings.dangerZone*

### Onboarding
- `src/app/onboarding/page.js` : "30 secondes. Promis."
- `src/components/OnboardingChecklist.jsx` : 6 etapes en tutoiement direct

### Trial + Banners
- `src/components/TrialBanner.jsx` : 3 variants (active/urgent/expired)

### Sidebar + Topbar
- `src/components/Sidebar.jsx` : PLAN_META hints en tutoiement direct

### Cookie consent + RGPD
- `src/components/CookieConsent.jsx` : "Cookies : on vous demande."
  (vouvoiement legal preserve)
- Pages RGPD/CGU/CGV/DPA : laissées en l'état (deja vouvoyees, legales)

## Stats finales

- **Files modifies : ~40 fichiers** (estimation visee atteinte)
- **Build : OK** (npm run build passe sans erreur)
- **Lignes locales/fr.js : 840 (inchange en taille, contenu refondu)**

## BRAND TODO restants pour V3

- Pages /en/* : pages anglaises pas touchees (en dehors du scope V2 FR)
- Pages /docs/* : documentation tech non refondue (tone neutre OK)
- 30+ chaines "Aucun X" restantes dans des coins peripheriques
  (NotesModule, OverviewPanel detail, custom-fields, etc.)
- Pages CGU/CGV/DPA : verifier paragraphe par paragraphe (gros volume,
  necessite relecture juridique aussi)
- src/app/admin/page.js : admin dashboard (UI interne, low priority)
- Newsletter monthly email : copy editorial (`newsletterMonthlyEmail`)
- Persona pages (`src/app/pour/*`) : titres marketing existants OK
- Comparatif pages (`src/app/vs/*`) : titres dynamiques OK
