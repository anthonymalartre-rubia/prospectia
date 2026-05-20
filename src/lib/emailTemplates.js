// src/lib/emailTemplates.js
// HTML email templates pour Prospectia — design refondu (refresh 2026-05).
// Optimisé Gmail, Outlook, Apple Mail. Light-mode + dark-mode compatible.

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://prospectia.cloud';
const DASHBOARD_URL = `${APP_URL}/dashboard`;
const SETTINGS_URL = `${APP_URL}/settings`;
const PRICING_URL = `${APP_URL}/#pricing`;

// ─── Design tokens ──────────────────────────────────────────────────
// On utilise des couleurs qui passent bien en light ET dark mode dans
// la plupart des clients mail. Les fonds gris clair sont safe partout.
const COLORS = {
  bg: '#f5f5f7',          // canvas externe (gris très clair)
  card: '#ffffff',        // card principale
  border: '#e4e4e7',      // bordures discrètes
  text: '#18181b',        // texte primaire (presque noir)
  textMuted: '#71717a',   // texte secondaire
  textFaint: '#a1a1aa',   // hints, footer
  brand: '#7c3aed',       // violet-600 (CTA primaire)
  brandDark: '#6d28d9',   // violet-700 (hover, gradients)
  brandLight: '#f5f3ff',  // violet-50 (backgrounds subtils)
  success: '#10b981',     // emerald-500
  successLight: '#ecfdf5',
  warning: '#f59e0b',     // amber-500
  warningLight: '#fffbeb',
  danger: '#ef4444',      // red-500
  dangerLight: '#fef2f2',
};

// ─── Helpers ────────────────────────────────────────────────────────

/**
 * Layout principal avec :
 * - Preheader (texte aperçu inbox)
 * - Header avec logo
 * - Card centrale (max 560px)
 * - Footer minimaliste
 */
function layout({ preheader = '', content, accent = COLORS.brand }) {
  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="x-apple-disable-message-reformatting" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <title>Prospectia</title>
  <style>
    @media (max-width: 600px) {
      .container { width: 100% !important; padding: 16px !important; }
      .card { padding: 28px 22px !important; border-radius: 12px !important; }
      .hero-title { font-size: 22px !important; line-height: 1.3 !important; }
      .btn { padding: 14px 24px !important; font-size: 15px !important; }
      .stat-grid td { display: block !important; width: 100% !important; padding: 8px 0 !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:${COLORS.bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;color:${COLORS.text};-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
  <!-- Preheader (texte aperçu inbox, invisible) -->
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:${COLORS.bg};">
    ${preheader}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${COLORS.bg};padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" class="container" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;">

          <!-- Header / Logo -->
          <tr>
            <td style="text-align:center;padding:0 0 24px;">
              <a href="${APP_URL}" style="text-decoration:none;">
                <span style="display:inline-block;vertical-align:middle;width:36px;height:36px;background:linear-gradient(135deg,${COLORS.brand} 0%,${COLORS.brandDark} 100%);border-radius:8px;line-height:36px;font-size:18px;font-weight:800;color:#ffffff;text-align:center;margin-right:10px;">P</span>
                <span style="display:inline-block;vertical-align:middle;font-size:22px;font-weight:700;color:${COLORS.text};letter-spacing:-0.3px;">Prospectia</span>
              </a>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td class="card" style="background-color:${COLORS.card};border:1px solid ${COLORS.border};border-radius:16px;padding:40px 36px;box-shadow:0 1px 3px rgba(0,0,0,0.04);">
              <!-- Accent bar du haut -->
              <div style="width:48px;height:4px;background-color:${accent};border-radius:2px;margin:0 auto 28px;"></div>
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="text-align:center;padding:24px 12px 0;">
              <p style="margin:0 0 12px;font-size:13px;color:${COLORS.textMuted};">
                <a href="${DASHBOARD_URL}" style="color:${COLORS.brand};text-decoration:none;font-weight:500;">Dashboard</a>
                &nbsp;&middot;&nbsp;
                <a href="${SETTINGS_URL}" style="color:${COLORS.brand};text-decoration:none;font-weight:500;">Paramètres</a>
                &nbsp;&middot;&nbsp;
                <a href="${APP_URL}/blog" style="color:${COLORS.brand};text-decoration:none;font-weight:500;">Blog</a>
              </p>
              <p style="margin:0 0 6px;font-size:12px;color:${COLORS.textFaint};">
                Prospectia &mdash; Prospection B2B automatisée en France
              </p>
              <p style="margin:0;font-size:11px;color:${COLORS.textFaint};">
                <a href="${APP_URL}/cgu" style="color:${COLORS.textFaint};text-decoration:underline;">CGU</a>
                &nbsp;&middot;&nbsp;
                <a href="${APP_URL}/confidentialite" style="color:${COLORS.textFaint};text-decoration:underline;">Confidentialité</a>
                &nbsp;&middot;&nbsp;
                <a href="${APP_URL}/rgpd" style="color:${COLORS.textFaint};text-decoration:underline;">RGPD</a>
              </p>
              <p style="margin:10px 0 0;font-size:11px;color:${COLORS.textFaint};">
                Pour ne plus recevoir ces emails, modifiez vos préférences dans <a href="${SETTINGS_URL}" style="color:${COLORS.textFaint};text-decoration:underline;">vos paramètres</a>.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Bouton CTA primaire (gradient violet)
 */
function ctaPrimary(text, href) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:32px 0 8px;">
  <tr>
    <td align="center" style="border-radius:10px;background:linear-gradient(135deg,${COLORS.brand} 0%,${COLORS.brandDark} 100%);box-shadow:0 4px 12px rgba(124,58,237,0.25);">
      <a href="${href}" class="btn" style="display:inline-block;padding:14px 32px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:10px;mso-padding-alt:0;">
        <!--[if mso]>&nbsp;&nbsp;&nbsp;<![endif]-->
        ${text}
        <!--[if mso]>&nbsp;&nbsp;&nbsp;<![endif]-->
      </a>
    </td>
  </tr>
</table>`;
}

/**
 * Bouton secondaire (outline)
 */
function ctaSecondary(text, href) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:12px 0 0;">
  <tr>
    <td align="center" style="border-radius:10px;background:${COLORS.card};border:1px solid ${COLORS.border};">
      <a href="${href}" style="display:inline-block;padding:12px 24px;color:${COLORS.text};font-size:14px;font-weight:500;text-decoration:none;border-radius:10px;">
        ${text}
      </a>
    </td>
  </tr>
</table>`;
}

/**
 * Hero greeting (titre + emoji + salutation)
 */
function hero({ emoji, title, greeting }) {
  return `
    ${emoji ? `<div style="text-align:center;font-size:42px;line-height:1;margin:0 0 16px;">${emoji}</div>` : ''}
    <h1 class="hero-title" style="margin:0 0 12px;font-size:24px;font-weight:700;line-height:1.25;color:${COLORS.text};text-align:center;letter-spacing:-0.3px;">
      ${title}
    </h1>
    ${greeting ? `<p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:${COLORS.textMuted};text-align:center;">${greeting}</p>` : ''}
  `;
}

/**
 * Card de stats clé / valeur (style "receipt")
 */
function receiptCard(rows) {
  const rowsHtml = rows.map((r, i) => `
    <tr>
      <td style="padding:14px 0;font-size:14px;color:${COLORS.textMuted};${i > 0 ? `border-top:1px solid ${COLORS.border};` : ''}">${r.label}</td>
      <td style="padding:14px 0;font-size:14px;color:${r.color || COLORS.text};text-align:right;font-weight:600;${i > 0 ? `border-top:1px solid ${COLORS.border};` : ''}">${r.value}</td>
    </tr>
  `).join('');
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;background-color:${COLORS.brandLight};border-radius:12px;padding:8px 20px;margin:0 0 24px;">
    ${rowsHtml}
  </table>`;
}

/**
 * Progress bar (usage indicators)
 */
function progressBar(percent, color = COLORS.brand) {
  const pct = Math.min(100, Math.max(0, percent));
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;margin:8px 0;">
    <tr>
      <td style="background-color:${COLORS.border};border-radius:99px;padding:0;height:8px;line-height:0;font-size:0;">
        <div style="width:${pct}%;background:linear-gradient(90deg,${color} 0%,${color}dd 100%);height:8px;border-radius:99px;line-height:0;font-size:0;">&nbsp;</div>
      </td>
    </tr>
  </table>`;
}

/**
 * Quote / testimonial / signature
 */
function signOff(text = 'L’équipe Prospectia') {
  return `<p style="margin:32px 0 0;font-size:13px;color:${COLORS.textMuted};line-height:1.5;border-top:1px solid ${COLORS.border};padding-top:24px;">
    À bientôt sur Prospectia,<br />
    <strong style="color:${COLORS.text};">${text}</strong>
  </p>`;
}

// ─── TEMPLATES ──────────────────────────────────────────────────────

/**
 * Welcome email (post-signup)
 */
export function welcomeEmail(userName) {
  const name = userName || 'là';
  return {
    subject: 'Bienvenue sur Prospectia 👋',
    html: layout({
      preheader: 'Votre compte est prêt. Lancez votre première recherche en 30 secondes.',
      accent: COLORS.brand,
      content: `
        ${hero({
          emoji: '👋',
          title: `Bienvenue ${name} !`,
          greeting: 'Votre compte Prospectia est prêt. Voici 3 choses à essayer dès maintenant.',
        })}

        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;margin:0 0 8px;">
          <tr>
            <td style="padding:16px 18px;background-color:${COLORS.brandLight};border-radius:10px;margin-bottom:8px;">
              <p style="margin:0;font-size:15px;font-weight:600;color:${COLORS.text};">🔍 Lancez une recherche en 1 clic</p>
              <p style="margin:6px 0 0;font-size:13px;color:${COLORS.textMuted};line-height:1.5;">Restaurants Paris, BTP Lyon, syndics France entière… ou décrivez votre cible en langage naturel.</p>
            </td>
          </tr>
        </table>
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;margin:8px 0;">
          <tr>
            <td style="padding:16px 18px;background-color:${COLORS.brandLight};border-radius:10px;">
              <p style="margin:0;font-size:15px;font-weight:600;color:${COLORS.text};">✉️ Enrichissez les emails automatiquement</p>
              <p style="margin:6px 0 0;font-size:13px;color:${COLORS.textMuted};line-height:1.5;">Notre cascade waterfall teste 7 sources (scraping, Apollo, Findymail…) jusqu'à trouver le bon email.</p>
            </td>
          </tr>
        </table>
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;margin:8px 0;">
          <tr>
            <td style="padding:16px 18px;background-color:${COLORS.brandLight};border-radius:10px;">
              <p style="margin:0;font-size:15px;font-weight:600;color:${COLORS.text};">📥 Exportez en CSV vers n'importe quel CRM</p>
              <p style="margin:6px 0 0;font-size:13px;color:${COLORS.textMuted};line-height:1.5;">HubSpot, Salesforce, Zoho, Pipedrive… ou directement dans votre outil d'outreach.</p>
            </td>
          </tr>
        </table>

        <div align="center">${ctaPrimary('Lancer ma première recherche', DASHBOARD_URL)}</div>

        <p style="margin:20px 0 0;font-size:13px;color:${COLORS.textMuted};text-align:center;line-height:1.5;">
          Plan Starter offert : <strong style="color:${COLORS.text};">100 prospects/mois</strong>, sans carte bancaire requise.
        </p>

        ${signOff()}
      `,
    }),
  };
}

/**
 * Usage warning email (80% atteint)
 */
export function usageWarningEmail(userName, usagePercent, planName, limitType) {
  const name = userName || 'là';
  const limitLabel = limitType === 'searches' ? 'prospects' : limitType === 'enrichments' ? 'enrichissements' : 'exports';
  return {
    subject: `⚠️ ${usagePercent}% de vos ${limitLabel} utilisés ce mois`,
    html: layout({
      preheader: `Plus que ${100 - usagePercent}% restants sur votre plan ${planName}. Pensez à upgrader pour éviter la coupure.`,
      accent: COLORS.warning,
      content: `
        ${hero({
          emoji: '⚠️',
          title: `${usagePercent}% atteints`,
          greeting: `Bonjour ${name}, vous approchez de la limite mensuelle de votre plan <strong style="color:${COLORS.text};">${planName}</strong>.`,
        })}

        <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:${COLORS.text};text-align:center;">
          ${limitLabel.charAt(0).toUpperCase() + limitLabel.slice(1)} ce mois
        </p>
        ${progressBar(usagePercent, COLORS.warning)}
        <p style="margin:8px 0 24px;font-size:12px;color:${COLORS.textMuted};text-align:center;">${usagePercent}% utilisés &middot; ${100 - usagePercent}% restants</p>

        <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:${COLORS.textMuted};text-align:center;">
          Pour continuer à prospecter sans interruption, le plan <strong style="color:${COLORS.text};">Pro à 49€/mois</strong> vous offre des <strong style="color:${COLORS.text};">prospects illimités</strong> et la cascade waterfall complète.
        </p>

        <div align="center">${ctaPrimary('Passer Pro maintenant', SETTINGS_URL)}</div>
        <div align="center">${ctaSecondary('Voir mon dashboard', DASHBOARD_URL)}</div>

        ${signOff()}
      `,
    }),
  };
}

/**
 * Usage limit reached (100%)
 */
export function usageLimitReachedEmail(userName, planName, limitType) {
  const name = userName || 'là';
  const limitLabel = limitType === 'searches' ? 'prospects' : limitType === 'enrichments' ? 'enrichissements' : 'exports';
  return {
    subject: `🛑 Limite de ${limitLabel} atteinte`,
    html: layout({
      preheader: `Vous avez atteint 100% de votre quota ${limitLabel}. Upgradez pour reprendre dès maintenant.`,
      accent: COLORS.danger,
      content: `
        ${hero({
          emoji: '🛑',
          title: `Limite atteinte`,
          greeting: `Bonjour ${name}, vous avez atteint 100% de votre quota mensuel de ${limitLabel} sur le plan <strong style="color:${COLORS.text};">${planName}</strong>.`,
        })}

        <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:${COLORS.text};text-align:center;">${limitLabel.charAt(0).toUpperCase() + limitLabel.slice(1)} ce mois</p>
        ${progressBar(100, COLORS.danger)}
        <p style="margin:8px 0 24px;font-size:12px;color:${COLORS.danger};text-align:center;font-weight:600;">100% utilisés &middot; 0% restants</p>

        <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:${COLORS.textMuted};text-align:center;">
          Vos données et leads existants restent accessibles. Pour reprendre la prospection <strong style="color:${COLORS.text};">immédiatement</strong>, passez Pro. Sinon vos quotas se renouvellent en début de mois prochain.
        </p>

        <div align="center">${ctaPrimary('Passer Pro pour 49€/mois', SETTINGS_URL)}</div>
        <div align="center">${ctaSecondary('Attendre le renouvellement', DASHBOARD_URL)}</div>

        ${signOff()}
      `,
    }),
  };
}

/**
 * Payment success (premier paiement).
 * @param {string} userName
 * @param {string} planName - 'Solo' | 'Pro' | 'Business'
 * @param {number} amount - montant payé en centimes
 * @param {'monthly'|'yearly'} [period='monthly']
 * @param {string[]} [features] - features débloqués (sinon liste générique)
 */
export function paymentSuccessEmail(userName, planName, amount, period = 'monthly', features = null) {
  const name = userName || 'là';
  const formattedAmount = (amount / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
  const date = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  const periodLabel = period === 'yearly' ? '/ an' : '/ mois';
  const defaultFeatures = [
    'Tous les départements de France (101)',
    'Cascade multi-sources (scraping intelligent + recherche Google)',
    'Exports CSV sans limite',
    'Dossiers et tags illimités',
    'Support email prioritaire',
  ];
  const featureList = features && features.length > 0 ? features : defaultFeatures;
  return {
    subject: `✅ Bienvenue sur le plan ${planName} !`,
    html: layout({
      preheader: `Votre paiement de ${formattedAmount} est confirmé. Toutes les fonctionnalités ${planName} sont actives.`,
      accent: COLORS.success,
      content: `
        ${hero({
          emoji: '🎉',
          title: `Bienvenue sur ${planName} !`,
          greeting: `Bonjour ${name}, votre paiement est confirmé et toutes les fonctionnalités sont actives.`,
        })}

        ${receiptCard([
          { label: 'Plan', value: planName, color: COLORS.brand },
          { label: 'Montant', value: `${formattedAmount} ${periodLabel}` },
          { label: 'Facturation', value: period === 'yearly' ? 'Annuelle' : 'Mensuelle' },
          { label: 'Date', value: date },
          { label: 'Statut', value: '✓ Actif', color: COLORS.success },
        ])}

        <p style="margin:24px 0 16px;font-size:13px;font-weight:600;color:${COLORS.text};">Ce qui est maintenant débloqué :</p>
        <ul style="margin:0 0 24px;padding:0 0 0 20px;color:${COLORS.textMuted};font-size:14px;line-height:1.8;">
          ${featureList.map((f) => `<li>${f}</li>`).join('\n          ')}
        </ul>

        <div align="center">${ctaPrimary('Accéder au dashboard', DASHBOARD_URL)}</div>

        <p style="margin:20px 0 0;font-size:12px;color:${COLORS.textMuted};text-align:center;line-height:1.5;">
          Une facture Stripe vous sera envoyée séparément. Pour gérer votre abonnement ou télécharger vos factures : <a href="${SETTINGS_URL}" style="color:${COLORS.brand};text-decoration:none;">Paramètres → Plan & Usage</a>.
        </p>

        ${signOff()}
      `,
    }),
  };
}

/**
 * Subscription cancelled
 */
export function subscriptionCancelledEmail(userName) {
  const name = userName || 'là';
  return {
    subject: 'Votre abonnement a été annulé',
    html: layout({
      preheader: 'Aucune action requise. Vos données sont conservées.',
      accent: COLORS.textMuted,
      content: `
        ${hero({
          emoji: '👋',
          title: 'Abonnement annulé',
          greeting: `Bonjour ${name}, votre abonnement Prospectia est désormais annulé. Votre compte est repassé sur le plan <strong style="color:${COLORS.text};">Starter (gratuit)</strong>.`,
        })}

        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;background-color:${COLORS.brandLight};border-radius:12px;padding:18px 20px;margin:0 0 24px;">
          <tr>
            <td>
              <p style="margin:0 0 8px;font-size:14px;font-weight:600;color:${COLORS.text};">📦 Vos données sont conservées</p>
              <p style="margin:0;font-size:13px;color:${COLORS.textMuted};line-height:1.6;">
                Tous vos prospects, dossiers et tags restent accessibles. Vous pouvez continuer à les exporter et à les enrichir dans les limites du plan gratuit.
              </p>
            </td>
          </tr>
        </table>

        <p style="margin:0 0 24px;font-size:14px;color:${COLORS.textMuted};line-height:1.6;text-align:center;">
          Si vous changez d'avis, vous pouvez réactiver votre abonnement à tout moment. <strong style="color:${COLORS.text};">Les outils que vous aimiez sont toujours là.</strong>
        </p>

        <div align="center">${ctaPrimary('Reprendre un abonnement', SETTINGS_URL)}</div>
        <div align="center">${ctaSecondary('Continuer en gratuit', DASHBOARD_URL)}</div>

        <p style="margin:24px 0 0;font-size:13px;color:${COLORS.textMuted};text-align:center;line-height:1.5;">
          On peut faire mieux ? <a href="mailto:hello@prospectia.cloud?subject=Feedback%20annulation" style="color:${COLORS.brand};text-decoration:none;">Dites-nous pourquoi</a> — on lit chaque message.
        </p>

        ${signOff()}
      `,
    }),
  };
}

/**
 * Plan changed (Pro ↔ Enterprise)
 */
export function planChangedEmail(userName, oldPlanName, newPlanName) {
  const name = userName || 'là';
  return {
    subject: `Votre plan est maintenant ${newPlanName}`,
    html: layout({
      preheader: `Vous êtes passé du plan ${oldPlanName} au plan ${newPlanName}. Les nouvelles limites sont actives.`,
      accent: COLORS.brand,
      content: `
        ${hero({
          emoji: '🔄',
          title: 'Changement de plan',
          greeting: `Bonjour ${name}, votre abonnement Prospectia a été mis à jour avec succès.`,
        })}

        ${receiptCard([
          { label: 'Ancien plan', value: oldPlanName, color: COLORS.textMuted },
          { label: 'Nouveau plan', value: newPlanName, color: COLORS.brand },
        ])}

        <p style="margin:0 0 24px;font-size:14px;color:${COLORS.textMuted};line-height:1.6;text-align:center;">
          Les nouvelles limites sont actives <strong style="color:${COLORS.text};">immédiatement</strong>. Une facture au prorata vous sera envoyée par Stripe pour la différence.
        </p>

        <div align="center">${ctaPrimary('Voir mon dashboard', DASHBOARD_URL)}</div>

        ${signOff()}
      `,
    }),
  };
}

/**
 * Payment failed (renouvellement raté)
 */
export function paymentFailedEmail(userName, amountCents, hostedInvoiceUrl) {
  const name = userName || 'là';
  const formattedAmount = (amountCents / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
  return {
    subject: `⚠️ Échec du paiement de votre abonnement`,
    html: layout({
      preheader: `Le renouvellement de ${formattedAmount} n'a pas pu être effectué. Mettez à jour votre moyen de paiement.`,
      accent: COLORS.danger,
      content: `
        ${hero({
          emoji: '⚠️',
          title: 'Paiement échoué',
          greeting: `Bonjour ${name}, le renouvellement de votre abonnement Prospectia (<strong style="color:${COLORS.text};">${formattedAmount}</strong>) n'a pas pu être effectué.`,
        })}

        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;background-color:${COLORS.dangerLight};border:1px solid ${COLORS.danger}30;border-radius:12px;padding:18px 20px;margin:0 0 20px;">
          <tr>
            <td>
              <p style="margin:0 0 8px;font-size:14px;font-weight:600;color:${COLORS.danger};">Causes fréquentes</p>
              <ul style="margin:0;padding:0 0 0 18px;color:${COLORS.textMuted};font-size:13px;line-height:1.7;">
                <li>Carte bancaire expirée</li>
                <li>Plafond atteint ou virement insuffisant</li>
                <li>Banque qui a bloqué la transaction (3DS, sécurité)</li>
                <li>Changement de RIB / coordonnées bancaires</li>
              </ul>
            </td>
          </tr>
        </table>

        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;background-color:${COLORS.warningLight};border-radius:12px;padding:18px 20px;margin:0 0 24px;">
          <tr>
            <td>
              <p style="margin:0 0 8px;font-size:14px;font-weight:600;color:${COLORS.text};">⏱️ Que faire maintenant</p>
              <p style="margin:0;font-size:13px;color:${COLORS.textMuted};line-height:1.6;">
                Mettez à jour votre moyen de paiement <strong style="color:${COLORS.text};">dans les 7 jours</strong>. Sans action, votre abonnement sera annulé et votre compte repassera en plan gratuit (vos données seront conservées).
              </p>
            </td>
          </tr>
        </table>

        <div align="center">${ctaPrimary(hostedInvoiceUrl ? 'Régler la facture' : 'Mettre à jour mon paiement', hostedInvoiceUrl || SETTINGS_URL)}</div>

        ${signOff()}
      `,
    }),
  };
}

/**
 * 🆕 Monthly upgrade nudge — pour les users free, envoyé 1× par mois
 */
export function monthlyUpgradeNudgeEmail(userName, stats = {}) {
  const name = userName || 'là';
  const {
    monthName = new Date().toLocaleDateString('fr-FR', { month: 'long' }),
    prospectsFound = 0,
    emailsEnriched = 0,
    daysActive = 0,
  } = stats;

  const isActive = prospectsFound > 0 || emailsEnriched > 0;
  const subject = isActive
    ? `${prospectsFound > 0 ? prospectsFound : emailsEnriched}× plus de prospects ce mois avec Pro ?`
    : `Vous n'avez pas encore essayé Prospectia ?`;

  return {
    subject,
    html: layout({
      preheader: isActive
        ? `${prospectsFound} prospects récupérés ce mois en gratuit. Avec Pro, c'est illimité pour 49€/mois.`
        : `Lancez votre première recherche en 30 secondes. 100 prospects offerts.`,
      accent: COLORS.brand,
      content: `
        ${hero({
          emoji: isActive ? '🚀' : '👋',
          title: isActive ? `Bilan de ${monthName}` : 'On vous attend !',
          greeting: isActive
            ? `Bonjour ${name}, voici ce que vous avez accompli ce mois-ci sur le plan gratuit.`
            : `Bonjour ${name}, votre compte Prospectia est prêt mais vous n'avez pas encore lancé de recherche. Voici comment démarrer en 30 secondes.`,
        })}

        ${isActive ? `
          <!-- Stats grid -->
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" class="stat-grid" style="width:100%;margin:0 0 28px;">
            <tr>
              <td width="33%" style="padding:0 4px;">
                <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:${COLORS.brandLight};border-radius:10px;padding:16px 12px;">
                  <tr>
                    <td style="text-align:center;">
                      <div style="font-size:26px;font-weight:700;color:${COLORS.brand};line-height:1;">${prospectsFound}</div>
                      <div style="font-size:11px;color:${COLORS.textMuted};text-transform:uppercase;letter-spacing:0.5px;margin-top:4px;font-weight:500;">Prospects</div>
                    </td>
                  </tr>
                </table>
              </td>
              <td width="33%" style="padding:0 4px;">
                <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:${COLORS.successLight};border-radius:10px;padding:16px 12px;">
                  <tr>
                    <td style="text-align:center;">
                      <div style="font-size:26px;font-weight:700;color:${COLORS.success};line-height:1;">${emailsEnriched}</div>
                      <div style="font-size:11px;color:${COLORS.textMuted};text-transform:uppercase;letter-spacing:0.5px;margin-top:4px;font-weight:500;">Emails trouvés</div>
                    </td>
                  </tr>
                </table>
              </td>
              <td width="33%" style="padding:0 4px;">
                <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:${COLORS.warningLight};border-radius:10px;padding:16px 12px;">
                  <tr>
                    <td style="text-align:center;">
                      <div style="font-size:26px;font-weight:700;color:${COLORS.warning};line-height:1;">${daysActive}j</div>
                      <div style="font-size:11px;color:${COLORS.textMuted};text-transform:uppercase;letter-spacing:0.5px;margin-top:4px;font-weight:500;">Actif sur 30</div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>

          <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;background:linear-gradient(135deg,${COLORS.brandLight} 0%,#ffffff 100%);border:1px solid ${COLORS.brand}30;border-radius:14px;padding:20px;margin:0 0 24px;">
            <tr>
              <td>
                <p style="margin:0 0 12px;font-size:15px;font-weight:600;color:${COLORS.text};">
                  ⚡ Avec Pro à 49€/mois vous auriez pu :
                </p>
                <ul style="margin:0;padding:0 0 0 18px;color:${COLORS.textMuted};font-size:13px;line-height:1.8;">
                  <li>Trouver des <strong style="color:${COLORS.text};">prospects illimités</strong> (vs 100/mois gratuit)</li>
                  <li>Lancer la cascade waterfall complète (Apollo, Findymail, +5 sources)</li>
                  <li>Enrichir <strong style="color:${COLORS.text};">500 emails/mois</strong> (vs 20 gratuit)</li>
                  <li>Exporter sans limite vers votre CRM</li>
                </ul>
              </td>
            </tr>
          </table>
        ` : `
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;margin:0 0 28px;">
            <tr>
              <td style="padding:14px 16px;background-color:${COLORS.brandLight};border-radius:10px;">
                <p style="margin:0;font-size:14px;font-weight:600;color:${COLORS.text};">1. Choisissez un secteur et une zone</p>
                <p style="margin:4px 0 0;font-size:13px;color:${COLORS.textMuted};line-height:1.5;">Ex: "Restaurants à Paris" ou cliquez sur les presets.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:14px 16px;background-color:${COLORS.brandLight};border-radius:10px;margin-top:8px;">
                <p style="margin:8px 0 0;font-size:14px;font-weight:600;color:${COLORS.text};">2. Lancez la recherche</p>
                <p style="margin:4px 0 0;font-size:13px;color:${COLORS.textMuted};line-height:1.5;">Prospectia interroge Google Places et ramène les prospects en 1-2 minutes.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:14px 16px;background-color:${COLORS.brandLight};border-radius:10px;margin-top:8px;">
                <p style="margin:8px 0 0;font-size:14px;font-weight:600;color:${COLORS.text};">3. Enrichissez et exportez</p>
                <p style="margin:4px 0 0;font-size:13px;color:${COLORS.textMuted};line-height:1.5;">Récupérez les emails, exportez en CSV, importez dans votre CRM ou outil d'outreach.</p>
              </td>
            </tr>
          </table>
        `}

        <div align="center">${ctaPrimary(isActive ? 'Passer Pro maintenant' : 'Lancer ma première recherche', isActive ? SETTINGS_URL : DASHBOARD_URL)}</div>
        <div align="center">${ctaSecondary(isActive ? 'Voir mon dashboard' : 'Comparer les plans', isActive ? DASHBOARD_URL : PRICING_URL)}</div>

        <p style="margin:24px 0 0;font-size:12px;color:${COLORS.textMuted};text-align:center;line-height:1.5;">
          Vous recevez cet email une fois par mois car vous êtes sur le plan gratuit. <a href="${SETTINGS_URL}" style="color:${COLORS.brand};text-decoration:none;">Préférences email</a>
        </p>

        ${signOff()}
      `,
    }),
  };
}
