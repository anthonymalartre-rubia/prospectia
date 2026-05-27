// src/lib/emailTemplates.js
// HTML email templates pour Volia — design refondu (refresh 2026-05).
// Optimisé Gmail, Outlook, Apple Mail. Light-mode + dark-mode compatible.

import { isTrustpilotEnabled, TRUSTPILOT_REVIEW_URL } from './trustpilot-data';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://volia.fr';
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
 * Encart Trustpilot — invitation à laisser un avis, affiché juste
 * au-dessus du footer dans TOUS les emails transactionnels.
 *
 * Affiché UNIQUEMENT si Trustpilot est activé ET qu'on a déjà des avis
 * (isTrustpilotEnabled() === true). Sinon retourne '' → invisible.
 *
 * Stratégie : chaque email transactionnel = un touchpoint de plus pour
 * solliciter un avis sans être intrusif (placé en footer, discret).
 * S'active automatiquement le jour où Anthony mettra TRUSTPILOT_RATING
 * et TRUSTPILOT_REVIEW_COUNT à jour dans lib/trustpilot-data.js.
 */
function trustpilotPrompt() {
  if (!isTrustpilotEnabled()) return '';
  return `
          <!-- Trustpilot review solicitation -->
          <tr>
            <td style="padding:16px 12px 0;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;background-color:#ecfdf5;border:1px solid #a7f3d0;border-radius:12px;">
                <tr>
                  <td style="padding:14px 18px;text-align:center;">
                    <p style="margin:0 0 6px;font-size:13px;color:#047857;font-weight:600;">
                      Vous aimez Volia&nbsp;?
                    </p>
                    <p style="margin:0 0 10px;font-size:12px;color:#065f46;line-height:1.5;">
                      Votre avis Trustpilot nous aide énormément. 30 secondes, pas plus.
                    </p>
                    <a href="${TRUSTPILOT_REVIEW_URL}" style="display:inline-block;padding:8px 18px;background-color:#10b981;color:#ffffff;font-size:13px;font-weight:600;text-decoration:none;border-radius:8px;">
                      ⭐ Laisser un avis sur Trustpilot
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
  `;
}

/**
 * Layout principal avec :
 * - Preheader (texte aperçu inbox)
 * - Header avec logo
 * - Card centrale (max 560px)
 * - Trustpilot prompt (conditionnel, juste au-dessus du footer)
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
  <title>Volia</title>
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
                <span style="display:inline-block;vertical-align:middle;width:36px;height:36px;background:linear-gradient(135deg,${COLORS.brand} 0%,${COLORS.brandDark} 100%);border-radius:8px;line-height:36px;font-size:20px;font-weight:800;color:#ffffff;text-align:center;margin-right:10px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">V</span>
                <span style="display:inline-block;vertical-align:middle;font-size:22px;font-weight:700;color:${COLORS.text};letter-spacing:-0.3px;">Volia</span>
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

          ${trustpilotPrompt()}

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
                Volia &mdash; Prospection B2B automatisée en France
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
function signOff(text = 'L’équipe Volia') {
  return `<p style="margin:32px 0 0;font-size:13px;color:${COLORS.textMuted};line-height:1.5;border-top:1px solid ${COLORS.border};padding-top:24px;">
    À bientôt sur Volia,<br />
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
    subject: 'Bienvenue. On commence ?',
    html: layout({
      preheader: 'Votre compte est prêt. Première recherche dans 30 secondes.',
      accent: COLORS.brand,
      content: `
        ${hero({
          emoji: '👋',
          title: `Bienvenue ${name}.`,
          greeting: 'Votre compte est prêt. Voici 3 trucs à tester maintenant.',
        })}

        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;margin:0 0 8px;">
          <tr>
            <td style="padding:16px 18px;background-color:${COLORS.brandLight};border-radius:10px;margin-bottom:8px;">
              <p style="margin:0;font-size:15px;font-weight:600;color:${COLORS.text};">🔍 Une recherche en 1 clic</p>
              <p style="margin:6px 0 0;font-size:13px;color:${COLORS.textMuted};line-height:1.5;">Restaurants Paris, BTP Lyon, syndics France entière… ou décrivez votre cible en français.</p>
            </td>
          </tr>
        </table>
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;margin:8px 0;">
          <tr>
            <td style="padding:16px 18px;background-color:${COLORS.brandLight};border-radius:10px;">
              <p style="margin:0;font-size:15px;font-weight:600;color:${COLORS.text};">✉️ Les emails arrivent tout seuls</p>
              <p style="margin:6px 0 0;font-size:13px;color:${COLORS.textMuted};line-height:1.5;">Cascade waterfall : on teste 7 sources jusqu'à choper le bon email. Score de confiance à chaque ligne.</p>
            </td>
          </tr>
        </table>
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;margin:8px 0;">
          <tr>
            <td style="padding:16px 18px;background-color:${COLORS.brandLight};border-radius:10px;">
              <p style="margin:0;font-size:15px;font-weight:600;color:${COLORS.text};">📥 Export CSV vers n'importe quel CRM</p>
              <p style="margin:6px 0 0;font-size:13px;color:${COLORS.textMuted};line-height:1.5;">HubSpot, Salesforce, Zoho, Pipedrive… ou direct dans Lemlist / Apollo / Smartlead.</p>
            </td>
          </tr>
        </table>

        <div align="center">${ctaPrimary('Première recherche', DASHBOARD_URL)}</div>

        <p style="margin:20px 0 0;font-size:13px;color:${COLORS.textMuted};text-align:center;line-height:1.5;">
          Plan Starter offert : <strong style="color:${COLORS.text};">100 prospects/mois</strong>, sans CB.
        </p>

        <!-- PS parrainage : touchpoint discret en bas du welcome (push #5) -->
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;margin:24px 0 0;">
          <tr>
            <td style="padding:14px 18px;background-color:${COLORS.brandLight};border-left:3px solid ${COLORS.brand};border-radius:8px;">
              <p style="margin:0;font-size:13px;color:${COLORS.text};line-height:1.5;">
                <strong style="color:${COLORS.brand};">PS</strong> — Vous aimez Volia ? Invitez 3 amis et gagnez
                <strong style="color:${COLORS.text};">3 mois Pro offerts</strong> (et 1 mois bonus pour eux).
                <a href="${APP_URL}/parrainage" style="color:${COLORS.brand};font-weight:600;text-decoration:none;">Voir le programme →</a>
              </p>
            </td>
          </tr>
        </table>

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
    subject: `${usagePercent}% utilisés. Heads up.`,
    html: layout({
      preheader: `Plus que ${100 - usagePercent}% restants sur ${planName}. Upgrade en 1 clic si besoin.`,
      accent: COLORS.warning,
      content: `
        ${hero({
          emoji: '⚠️',
          title: `${usagePercent}% atteints`,
          greeting: `Salut ${name}, vous approchez de la limite mensuelle de votre plan <strong style="color:${COLORS.text};">${planName}</strong>.`,
        })}

        <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:${COLORS.text};text-align:center;">
          ${limitLabel.charAt(0).toUpperCase() + limitLabel.slice(1)} ce mois
        </p>
        ${progressBar(usagePercent, COLORS.warning)}
        <p style="margin:8px 0 24px;font-size:12px;color:${COLORS.textMuted};text-align:center;">${usagePercent}% utilisés &middot; ${100 - usagePercent}% restants</p>

        <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:${COLORS.textMuted};text-align:center;">
          Pour ne pas vous faire couper la prospection, <strong style="color:${COLORS.text};">Pro à 49€/mois</strong> = 5 000 prospects + cascade waterfall complète.
        </p>

        <div align="center">${ctaPrimary('Passer Pro', SETTINGS_URL)}</div>
        <div align="center">${ctaSecondary('Voir le dashboard', DASHBOARD_URL)}</div>

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
    subject: `Limite atteinte. On fait quoi ?`,
    html: layout({
      preheader: `Vous avez taqué 100% du quota ${limitLabel}. Upgrade en 1 clic pour reprendre tout de suite.`,
      accent: COLORS.danger,
      content: `
        ${hero({
          emoji: '🛑',
          title: `Limite atteinte`,
          greeting: `Salut ${name}, vous avez atteint 100% du quota mensuel de ${limitLabel} sur <strong style="color:${COLORS.text};">${planName}</strong>.`,
        })}

        <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:${COLORS.text};text-align:center;">${limitLabel.charAt(0).toUpperCase() + limitLabel.slice(1)} ce mois</p>
        ${progressBar(100, COLORS.danger)}
        <p style="margin:8px 0 24px;font-size:12px;color:${COLORS.danger};text-align:center;font-weight:600;">100% utilisés &middot; 0% restants</p>

        <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:${COLORS.textMuted};text-align:center;">
          Vos leads existants restent intacts. Pour reprendre <strong style="color:${COLORS.text};">tout de suite</strong>, passez Pro. Sinon, le quota se reset au premier du mois prochain.
        </p>

        <div align="center">${ctaPrimary('Passer Pro · 49€/mois', SETTINGS_URL)}</div>
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
    subject: `${planName}, c'est fait. Bienvenue.`,
    html: layout({
      preheader: `Paiement de ${formattedAmount} validé. Toutes les fonctionnalités ${planName} sont actives.`,
      accent: COLORS.success,
      content: `
        ${hero({
          emoji: '🎉',
          title: `Bienvenue sur ${planName}.`,
          greeting: `Salut ${name}, paiement validé. Toutes les fonctionnalités sont actives.`,
        })}

        ${receiptCard([
          { label: 'Plan', value: planName, color: COLORS.brand },
          { label: 'Montant', value: `${formattedAmount} ${periodLabel}` },
          { label: 'Facturation', value: period === 'yearly' ? 'Annuelle' : 'Mensuelle' },
          { label: 'Date', value: date },
          { label: 'Statut', value: '✓ Actif', color: COLORS.success },
        ])}

        <p style="margin:24px 0 16px;font-size:13px;font-weight:600;color:${COLORS.text};">Ce que vous avez débloqué :</p>
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
    subject: 'Abonnement annulé. Vos données restent.',
    html: layout({
      preheader: 'Aucune action requise. Vos leads sont gardés.',
      accent: COLORS.textMuted,
      content: `
        ${hero({
          emoji: '👋',
          title: 'Abonnement annulé',
          greeting: `Salut ${name}, votre abonnement est annulé. Vous repassez sur <strong style="color:${COLORS.text};">Starter (gratuit)</strong>.`,
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
          Si vous changez d'avis, vous reprenez quand vous voulez. <strong style="color:${COLORS.text};">L'outil ne bouge pas, vos données non plus.</strong>
        </p>

        <div align="center">${ctaPrimary('Reprendre un abonnement', SETTINGS_URL)}</div>
        <div align="center">${ctaSecondary('Rester en gratuit', DASHBOARD_URL)}</div>

        <p style="margin:24px 0 0;font-size:13px;color:${COLORS.textMuted};text-align:center;line-height:1.5;">
          On peut faire mieux ? <a href="mailto:hello@volia.fr?subject=Feedback%20annulation" style="color:${COLORS.brand};text-decoration:none;">Dites-nous pourquoi</a> — on lit chaque message.
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
    subject: `Vous êtes maintenant sur ${newPlanName}`,
    html: layout({
      preheader: `Du plan ${oldPlanName} au plan ${newPlanName}. Les nouvelles limites sont actives.`,
      accent: COLORS.brand,
      content: `
        ${hero({
          emoji: '🔄',
          title: 'Changement de plan',
          greeting: `Salut ${name}, c'est fait. Votre abonnement est à jour.`,
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
    subject: `Le paiement n'est pas passé`,
    html: layout({
      preheader: `Renouvellement de ${formattedAmount} échoué. Mettez à jour la CB en 30 secondes.`,
      accent: COLORS.danger,
      content: `
        ${hero({
          emoji: '⚠️',
          title: 'Paiement échoué',
          greeting: `Salut ${name}, le renouvellement de votre abonnement (<strong style="color:${COLORS.text};">${formattedAmount}</strong>) n'est pas passé.`,
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
    ? `${prospectsFound > 0 ? prospectsFound : emailsEnriched} prospects ce mois. Imagine en illimité.`
    : `Tu n'as pas encore essayé. C'est dommage.`;

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
          title: isActive ? `Bilan de ${monthName}` : 'On t\'attend.',
          greeting: isActive
            ? `Salut ${name}, voici ce que tu as fait ce mois en gratuit.`
            : `Salut ${name}, ton compte est prêt mais tu n'as pas encore lancé de recherche. Voici comment démarrer en 30 secondes.`,
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
                <p style="margin:4px 0 0;font-size:13px;color:${COLORS.textMuted};line-height:1.5;">Volia interroge Google Places et ramène les prospects en 1-2 minutes.</p>
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

// ───────────────────────────────────────────────────────────────
// trialStartedEmail — Envoyé immédiatement après le signup confirmé.
// Annonce les 14j de Pro offerts. CTA dashboard. Pas d'agressivité de
// vente — l'idée est de faire ressentir la valeur, l'upsell vient
// naturellement quand le trial approche de sa fin (J-3 et J0).
// ───────────────────────────────────────────────────────────────
export function trialStartedEmail(userName, trialEndsAt) {
  const name = userName || 'là';
  const endDate = new Date(trialEndsAt).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  return {
    subject: '14 jours de Pro. Sans CB. Go.',
    html: layout({
      preheader: `Trial Pro actif jusqu'au ${endDate}. Aucune carte requise.`,
      accent: COLORS.brand,
      content: `
        ${hero({
          emoji: '🎉',
          title: `${name}, 14 jours de Pro. Sans CB.`,
          greeting: `Accès complet au plan Pro pendant 14 jours. Pas de CB demandée, on coupe pas, on relance pas.`,
        })}

        ${receiptCard([
          { label: 'Plan actif', value: 'Pro (trial)', color: COLORS.brand },
          { label: 'Durée', value: '14 jours' },
          { label: 'Expire le', value: endDate },
          { label: 'Carte requise', value: 'Aucune', color: COLORS.success },
        ])}

        <p style="margin:24px 0 16px;font-size:13px;font-weight:600;color:${COLORS.text};">Ce qui est débloqué :</p>
        <ul style="margin:0 0 24px;padding:0 0 0 20px;color:${COLORS.textMuted};font-size:14px;line-height:1.8;">
          <li><strong style="color:${COLORS.text};">5 000 prospects/mois</strong> (vs 100 en gratuit)</li>
          <li>Cascade waterfall complète (Apollo, Findymail, Enrichly…)</li>
          <li>Vérification d'emails (MillionVerifier)</li>
          <li>Module Campagnes email/SMS</li>
          <li>Exports illimités vers HubSpot, Salesforce, Zoho…</li>
        </ul>

        <div align="center">${ctaPrimary('Lancer ma 1ère recherche Pro', DASHBOARD_URL)}</div>

        <p style="margin:20px 0 0;font-size:13px;color:${COLORS.textMuted};text-align:center;line-height:1.5;">
          À la fin des 14 jours, votre compte repasse sur le plan Starter gratuit (vos données sont conservées). Aucun prélèvement, aucune surprise.
        </p>

        ${signOff()}
      `,
    }),
  };
}

// ───────────────────────────────────────────────────────────────
// trialExpiringEmail — Envoyé à J-3 de la fin du trial.
// Crée l'urgence sans agresser. Met en avant ce que le user va PERDRE
// (loss aversion > gain framing) : ses dossiers, ses enrichissements
// en cours, l'accès Campagnes…
// ───────────────────────────────────────────────────────────────
export function trialExpiringEmail(userName, daysRemaining = 3) {
  const name = userName || 'là';
  return {
    subject: `${daysRemaining} jours de Pro restants`,
    html: layout({
      preheader: `Pour garder cascade waterfall, campagnes et 5000 prospects/mois, c'est maintenant.`,
      accent: COLORS.warning,
      content: `
        ${hero({
          emoji: '⏱️',
          title: `${daysRemaining} jours. Après, retour au gratuit.`,
          greeting: `Salut ${name}, votre trial Pro se termine dans <strong style="color:${COLORS.text};">${daysRemaining} jours</strong>. Voici ce que vous gardez ou perdez à l'expiration.`,
        })}

        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;background-color:${COLORS.warningLight};border:1px solid ${COLORS.warning}30;border-radius:12px;padding:18px 20px;margin:0 0 20px;">
          <tr>
            <td>
              <p style="margin:0 0 8px;font-size:14px;font-weight:600;color:${COLORS.text};">⚠️ Ce qui sera désactivé</p>
              <ul style="margin:0;padding:0 0 0 18px;color:${COLORS.textMuted};font-size:13px;line-height:1.7;">
                <li>La cascade waterfall complète (vous reviendrez au scraping simple)</li>
                <li>Le module Campagnes email/SMS</li>
                <li>La vérification d'emails MillionVerifier</li>
                <li>Votre quota repassera à 100 prospects/mois (vs 5 000)</li>
              </ul>
            </td>
          </tr>
        </table>

        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;background-color:${COLORS.successLight};border-radius:12px;padding:18px 20px;margin:0 0 24px;">
          <tr>
            <td>
              <p style="margin:0 0 8px;font-size:14px;font-weight:600;color:${COLORS.text};">✅ Ce qui est gardé dans tous les cas</p>
              <p style="margin:0;font-size:13px;color:${COLORS.textMuted};line-height:1.6;">
                Vos prospects collectés, vos dossiers, vos tags et vos exports restent intacts.
              </p>
            </td>
          </tr>
        </table>

        <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:${COLORS.textMuted};text-align:center;">
          Pour conserver toutes vos features Pro, passez à l'abonnement pour <strong style="color:${COLORS.text};">49€/mois</strong> (ou 490€/an, ~2 mois offerts).
        </p>

        <div align="center">${ctaPrimary('Passer Pro maintenant', `${APP_URL}/pricing?plan=pro`)}</div>
        <div align="center">${ctaSecondary('Comparer les plans', `${APP_URL}/pricing`)}</div>

        ${signOff()}
      `,
    }),
  };
}

// ───────────────────────────────────────────────────────────────
// trialExpiredEmail — Envoyé à J0 (jour de l'expiration) par le cron
// expire-trials, juste après le downgrade automatique vers free.
// ───────────────────────────────────────────────────────────────
export function trialExpiredEmail(userName) {
  const name = userName || 'là';
  return {
    subject: 'Trial Pro terminé. Bilan rapide.',
    html: layout({
      preheader: `Vous repassez sur Starter. Reprendre Pro = 1 clic.`,
      accent: COLORS.danger,
      content: `
        ${hero({
          emoji: '🛑',
          title: 'Trial terminé. Vos données restent.',
          greeting: `Salut ${name}, vos 14 jours de Pro sont écoulés. Vous repassez sur <strong style="color:${COLORS.text};">Starter (gratuit)</strong>.`,
        })}

        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;background-color:${COLORS.brandLight};border-radius:12px;padding:18px 20px;margin:0 0 20px;">
          <tr>
            <td>
              <p style="margin:0 0 8px;font-size:14px;font-weight:600;color:${COLORS.text};">📦 Vos données sont conservées</p>
              <p style="margin:0;font-size:13px;color:${COLORS.textMuted};line-height:1.6;">
                Tous vos prospects, dossiers, tags et historiques de recherche restent accessibles. Vous pouvez continuer à les exporter dans la limite de 5 exports/mois du plan gratuit.
              </p>
            </td>
          </tr>
        </table>

        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;background-color:${COLORS.warningLight};border-radius:12px;padding:18px 20px;margin:0 0 24px;">
          <tr>
            <td>
              <p style="margin:0 0 8px;font-size:14px;font-weight:600;color:${COLORS.text};">⚠️ Features désactivées</p>
              <ul style="margin:0;padding:0 0 0 18px;color:${COLORS.textMuted};font-size:13px;line-height:1.7;">
                <li>Cascade waterfall complète (Apollo, Findymail, +5 sources)</li>
                <li>Module Campagnes email/SMS</li>
                <li>Vérification d'emails MillionVerifier</li>
                <li>Quota mensuel : 100 prospects (vs 5 000 en Pro)</li>
              </ul>
            </td>
          </tr>
        </table>

        <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:${COLORS.textMuted};text-align:center;">
          Pour réactiver toutes vos features <strong style="color:${COLORS.text};">en 30 secondes</strong>, passez à l'abonnement Pro à 49€/mois.
        </p>

        <div align="center">${ctaPrimary('Réactiver Pro', `${APP_URL}/pricing?plan=pro`)}</div>
        <div align="center">${ctaSecondary('Continuer en gratuit', DASHBOARD_URL)}</div>

        <p style="margin:24px 0 0;font-size:13px;color:${COLORS.textMuted};text-align:center;line-height:1.5;">
          Une question ? Répondez simplement à cet email — on lit chaque message.
        </p>

        ${signOff()}
      `,
    }),
  };
}

// ───────────────────────────────────────────────────────────────
// authSignupConfirm — Email de confirmation d'inscription envoyé
// via Resend (remplace l'email plain text de Supabase Auth).
// Supabase admin.generateLink() fournit l'URL, on l'embed dans notre
// design Volia (header + footer + CTA gradient).
// ───────────────────────────────────────────────────────────────
export function authSignupConfirm({ confirmUrl, email }) {
  return {
    subject: 'Confirmez votre email — Volia',
    html: layout({
      preheader: '1 clic pour activer votre compte (lien valide 24h).',
      accent: COLORS.brand,
      content: `
        ${hero({
          emoji: '👋',
          title: 'Bienvenue. Un dernier truc.',
          greeting: `Pour activer le compte <strong style="color:${COLORS.text};">${email}</strong>, cliquez ci-dessous.`,
        })}

        <div align="center">${ctaPrimary('Confirmer mon email', confirmUrl)}</div>

        <p style="margin:20px 0 0;font-size:13px;color:${COLORS.textMuted};text-align:center;line-height:1.6;">
          Ce lien expire dans <strong style="color:${COLORS.text};">24 heures</strong>.<br/>
          Si vous n'êtes pas à l'origine de cette inscription, ignorez simplement cet email — aucun compte ne sera activé.
        </p>

        <p style="margin:24px 0 0;font-size:12px;color:${COLORS.textFaint};text-align:center;line-height:1.5;word-break:break-all;">
          Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur&nbsp;:<br/>
          <a href="${confirmUrl}" style="color:${COLORS.brand};text-decoration:none;">${confirmUrl}</a>
        </p>

        ${signOff()}
      `,
    }),
  };
}

// ───────────────────────────────────────────────────────────────
// authPasswordReset — Email de réinitialisation de mot de passe
// envoyé via Resend. Lien généré par admin.generateLink(type='recovery').
// ───────────────────────────────────────────────────────────────
export function authPasswordReset({ resetUrl, email }) {
  return {
    subject: 'Nouveau mot de passe — Volia',
    html: layout({
      preheader: 'Cliquez pour choisir un nouveau mot de passe (valide 1h).',
      accent: COLORS.warning,
      content: `
        ${hero({
          emoji: '🔐',
          title: 'Nouveau mot de passe',
          greeting: `Vous (on espère) avez demandé un reset pour <strong style="color:${COLORS.text};">${email}</strong>.`,
        })}

        <div align="center">${ctaPrimary('Définir un nouveau mot de passe', resetUrl)}</div>

        <p style="margin:20px 0 0;font-size:13px;color:${COLORS.textMuted};text-align:center;line-height:1.6;">
          Ce lien expire dans <strong style="color:${COLORS.text};">1 heure</strong>.<br/>
          Si vous n'avez rien demandé, ignorez cet email — votre mot de passe ne sera pas changé.
        </p>

        <p style="margin:24px 0 0;font-size:12px;color:${COLORS.textFaint};text-align:center;line-height:1.5;word-break:break-all;">
          Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur&nbsp;:<br/>
          <a href="${resetUrl}" style="color:${COLORS.brand};text-decoration:none;">${resetUrl}</a>
        </p>

        ${signOff()}
      `,
    }),
  };
}

// ───────────────────────────────────────────────────────────────
// authResendConfirmation — Renvoi du lien de confirmation (cas
// où l'utilisateur n'a pas reçu / a supprimé le 1er email).
// ───────────────────────────────────────────────────────────────
export function authResendConfirmation({ confirmUrl, email }) {
  return {
    subject: 'Nouveau lien de confirmation — Volia',
    html: layout({
      preheader: 'Voici votre nouveau lien (valide 24h).',
      accent: COLORS.brand,
      content: `
        ${hero({
          emoji: '✉️',
          title: 'Voilà, le nouveau lien.',
          greeting: `Demandé pour <strong style="color:${COLORS.text};">${email}</strong>.`,
        })}

        <div align="center">${ctaPrimary('Confirmer mon email', confirmUrl)}</div>

        <p style="margin:20px 0 0;font-size:13px;color:${COLORS.textMuted};text-align:center;line-height:1.6;">
          Ce lien expire dans <strong style="color:${COLORS.text};">24 heures</strong>.
        </p>

        <p style="margin:24px 0 0;font-size:12px;color:${COLORS.textFaint};text-align:center;line-height:1.5;word-break:break-all;">
          Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur&nbsp;:<br/>
          <a href="${confirmUrl}" style="color:${COLORS.brand};text-decoration:none;">${confirmUrl}</a>
        </p>

        ${signOff()}
      `,
    }),
  };
}

// ───────────────────────────────────────────────────────────────
// referralPushEmail — Push parrainage J+7. Envoyé une seule fois aux
// users actifs créés entre 7 et 14 jours, qui ont au moins 1 search et
// pas encore parrainé. Goal : faire découvrir le programme à un moment
// où l'user a perçu de la valeur mais n'a pas encore l'habitude de
// partager. CAC payé, mois bonus à gagner, win-win clair.
// ───────────────────────────────────────────────────────────────
export function referralPushEmail(userName, referralCode) {
  const name = userName || 'là';
  const referralUrl = `${APP_URL}/signup?ref=${referralCode}`;
  return {
    subject: '3 mois Pro offerts. Voici comment.',
    html: layout({
      preheader: '3 amis qui passent payant = 3 mois Pro pour vous. Sans plafond.',
      accent: COLORS.brand,
      content: `
        ${hero({
          emoji: '🎁',
          title: `${name}, vos amis adoreraient Volia`,
          greeting: `Pour chaque ami qui devient client payant via votre lien, on vous offre <strong style="color:${COLORS.text};">1 mois gratuit</strong>. Et lui aussi reçoit <strong style="color:${COLORS.text};">+1 mois bonus</strong> à l'inscription.`,
        })}

        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;margin:0 0 20px;">
          <tr>
            <td style="padding:24px 20px;background-color:${COLORS.brandLight};border-radius:12px;text-align:center;">
              <p style="margin:0 0 8px;font-size:11px;color:${COLORS.brand};text-transform:uppercase;letter-spacing:1px;font-weight:600;">Votre lien personnalisé</p>
              <p style="margin:0 0 12px;font-family:Menlo,Monaco,Consolas,monospace;font-size:14px;color:${COLORS.text};font-weight:600;word-break:break-all;">${referralUrl}</p>
              <p style="margin:0;font-size:12px;color:${COLORS.textMuted};">Code parrain : <strong style="color:${COLORS.text};">${referralCode}</strong></p>
            </td>
          </tr>
        </table>

        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;margin:0 0 8px;">
          <tr>
            <td style="padding:14px 18px;background-color:#ffffff;border:1px solid ${COLORS.border};border-radius:10px;">
              <p style="margin:0;font-size:14px;color:${COLORS.text};font-weight:600;">3 amis payants = 3 mois Pro offerts (147 €)</p>
            </td>
          </tr>
        </table>
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;margin:8px 0;">
          <tr>
            <td style="padding:14px 18px;background-color:#ffffff;border:1px solid ${COLORS.border};border-radius:10px;">
              <p style="margin:0;font-size:14px;color:${COLORS.text};font-weight:600;">5 amis = 5 mois (245 €), 10 amis = 10 mois…</p>
            </td>
          </tr>
        </table>
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;margin:8px 0;">
          <tr>
            <td style="padding:14px 18px;background-color:#ffffff;border:1px solid ${COLORS.border};border-radius:10px;">
              <p style="margin:0;font-size:14px;color:${COLORS.text};font-weight:600;">Aucune limite, crédit Stripe automatique</p>
            </td>
          </tr>
        </table>

        <div align="center">${ctaPrimary('Voir mon programme de parrainage', `${APP_URL}/parrainage`)}</div>

        <p style="margin:20px 0 0;font-size:13px;color:${COLORS.textMuted};text-align:center;line-height:1.5;">
          Astuce : ajoutez votre lien dans votre signature email pro. Effort 30s, résultats permanents.
        </p>

        ${signOff()}
      `,
    }),
  };
}

// ───────────────────────────────────────────────────────────────
// referralRewardEmail — Email transactionnel au parrain dont un filleul
// vient de devenir client payant. Lui annonce le bonus de 1 mois.
// ───────────────────────────────────────────────────────────────
export function referralRewardEmail(userName, totalBonusMonths) {
  const name = userName || 'là';
  const m = totalBonusMonths || 1;
  return {
    subject: '+1 mois Pro offert. Merci pour l\'invitation.',
    html: layout({
      preheader: `Total cumulé : ${m} mois bonus. Continuez à inviter, ça monte.`,
      accent: COLORS.brand,
      content: `
        ${hero({
          emoji: '🎉',
          title: `Vous venez de gagner 1 mois gratuit !`,
          greeting: `Bonjour ${name}, un de vos filleuls vient de devenir client payant sur Volia. Votre bonus est crédité.`,
        })}

        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;margin:0 0 16px;">
          <tr>
            <td style="padding:20px;background-color:${COLORS.brandLight};border-radius:10px;text-align:center;">
              <p style="margin:0 0 4px;font-size:13px;color:${COLORS.textMuted};text-transform:uppercase;letter-spacing:1px;">Total bonus accumulés</p>
              <p style="margin:0;font-size:36px;font-weight:700;color:${COLORS.brand};">${m} mois</p>
              <p style="margin:6px 0 0;font-size:13px;color:${COLORS.textMuted};">automatiquement crédités sur votre prochain renouvellement</p>
            </td>
          </tr>
        </table>

        <div align="center">${ctaPrimary('Voir mon programme de parrainage', `${APP_URL}/parrainage`)}</div>

        <p style="margin:20px 0 0;font-size:13px;color:${COLORS.textMuted};text-align:center;line-height:1.5;">
          Aucune limite : pour chaque ami payant, +1 mois. <a href="${APP_URL}/parrainage" style="color:${COLORS.brand};">Partagez votre lien</a>.
        </p>

        ${signOff()}
      `,
    }),
  };
}

// ───────────────────────────────────────────────────────────────
// newsletterMonthlyEmail — Édition mensuelle Volia
// Inclut : 1 article phare, 1 ressource gratuite, 1 stat marché,
//          lien désinscription token-based.
// ───────────────────────────────────────────────────────────────
export function newsletterMonthlyEmail({
  unsubscribeToken,
  featuredArticleTitle = '',
  featuredArticleUrl = '',
  featuredArticleTeaser = '',
  resourceTitle = '20 templates cold email B2B',
  resourceUrl = `${APP_URL}/ressources/templates-cold-email-b2b-fr/telecharger`,
  monthLabel = '',
  statHeadline = '',
  statBody = '',
} = {}) {
  const unsubUrl = `${APP_URL}/api/newsletter/unsubscribe?token=${unsubscribeToken}`;
  return {
    subject: `📬 Volia · L'édition ${monthLabel} · ${featuredArticleTitle || 'le meilleur du mois'}`,
    html: layout({
      preheader: featuredArticleTeaser || 'Stats sectorielles, templates qui convertissent, retours d\'expérience.',
      accent: COLORS.brand,
      content: `
        ${hero({
          emoji: '📬',
          title: `Édition ${monthLabel}`,
          greeting: 'Voici le meilleur du mois pour booster votre prospection B2B.',
        })}

        ${featuredArticleTitle ? `
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;margin:0 0 16px;">
          <tr>
            <td style="padding:18px;background-color:${COLORS.brandLight};border-radius:10px;">
              <p style="margin:0 0 6px;font-size:11px;color:${COLORS.brand};text-transform:uppercase;letter-spacing:1px;font-weight:600;">📖 Article du mois</p>
              <p style="margin:0 0 8px;font-size:17px;font-weight:700;color:${COLORS.text};line-height:1.3;">${featuredArticleTitle}</p>
              ${featuredArticleTeaser ? `<p style="margin:0 0 10px;font-size:13px;color:${COLORS.textMuted};line-height:1.5;">${featuredArticleTeaser}</p>` : ''}
              <a href="${featuredArticleUrl}" style="display:inline-block;padding:8px 14px;background-color:${COLORS.brand};color:#fff;text-decoration:none;border-radius:6px;font-size:13px;font-weight:600;">Lire l'article →</a>
            </td>
          </tr>
        </table>
        ` : ''}

        ${statHeadline ? `
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;margin:0 0 16px;">
          <tr>
            <td style="padding:18px;background-color:#fff;border:1px solid ${COLORS.line};border-radius:10px;">
              <p style="margin:0 0 4px;font-size:11px;color:${COLORS.textMuted};text-transform:uppercase;letter-spacing:1px;font-weight:600;">📊 Chiffre du mois</p>
              <p style="margin:0;font-size:24px;font-weight:700;color:${COLORS.brand};line-height:1.2;">${statHeadline}</p>
              ${statBody ? `<p style="margin:8px 0 0;font-size:13px;color:${COLORS.textMuted};line-height:1.5;">${statBody}</p>` : ''}
            </td>
          </tr>
        </table>
        ` : ''}

        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;margin:0 0 16px;">
          <tr>
            <td style="padding:18px;background-color:${COLORS.brandLight};border-radius:10px;">
              <p style="margin:0 0 6px;font-size:11px;color:${COLORS.brand};text-transform:uppercase;letter-spacing:1px;font-weight:600;">📥 Ressource gratuite</p>
              <p style="margin:0 0 8px;font-size:17px;font-weight:700;color:${COLORS.text};line-height:1.3;">${resourceTitle}</p>
              <a href="${resourceUrl}" style="display:inline-block;padding:8px 14px;background-color:${COLORS.brand};color:#fff;text-decoration:none;border-radius:6px;font-size:13px;font-weight:600;">Télécharger gratuit →</a>
            </td>
          </tr>
        </table>

        <div align="center">${ctaPrimary('Aller sur Volia', DASHBOARD_URL)}</div>

        <p style="margin:24px 0 0;font-size:11px;color:${COLORS.textMuted};text-align:center;line-height:1.6;">
          Vous recevez cet email mensuel car vous êtes inscrit à la newsletter Volia.<br>
          <a href="${unsubUrl}" style="color:${COLORS.brand};text-decoration:underline;">Se désinscrire en 1 clic</a>
        </p>

        ${signOff()}
      `,
    }),
  };
}

// ═══════════════════════════════════════════════════════════════════
// DRIP CAMPAIGN ONBOARDING (J+1, J+3, J+7, J+14)
// ═══════════════════════════════════════════════════════════════════
//
// 4 emails déclenchés par le cron /api/cron/process-drip-emails (daily
// 10h UTC). Le welcome (J+0) est déjà géré par le flux signup. Tous les
// liens portent des UTM `utm_source=email&utm_medium=drip&utm_campaign=<step>`
// pour mesurer la conversion par drip dans Vercel Analytics.
//
// Idempotence : chaque step écrit sa clé dans user_profiles.drip_emails_sent
// pour ne jamais réenvoyer le même email à un même user.
// ═══════════════════════════════════════════════════════════════════

/**
 * Construit une URL avec UTMs drip cohérents.
 * Centralisé ici pour éviter les divergences entre templates.
 */
function utmify(path, campaign) {
  const sep = path.includes('?') ? '&' : '?';
  return `${APP_URL}${path}${sep}utm_source=email&utm_medium=drip&utm_campaign=${campaign}`;
}

/**
 * Drip J+1 — Use case / activation
 *
 * Goal : pousser l'user à lancer SA 1ère recherche dans les 24h.
 * Stat : un user qui n'a pas lancé de search dans les 48h après signup
 * a 70% de chance de churn. Cet email = anti-churn principal.
 */
export function useCaseDay1Email(userName) {
  const name = userName || 'là';
  const ctaUrl = utmify('/dashboard', 'use_case_d1');
  return {
    subject: `${name}, votre 1ère recherche en 30 secondes`,
    html: layout({
      preheader: '3 étapes simples pour récupérer vos premiers prospects qualifiés dès aujourd\'hui.',
      accent: COLORS.brand,
      content: `
        ${hero({
          emoji: '🚀',
          title: 'Lancez votre 1ère recherche',
          greeting: `Bonjour ${name}, hier vous avez créé votre compte Volia. Voici comment récupérer vos <strong style="color:${COLORS.text};">premiers prospects qualifiés</strong> dans les 30 prochaines secondes.`,
        })}

        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;margin:0 0 12px;">
          <tr>
            <td style="padding:16px 18px;background-color:${COLORS.brandLight};border-radius:10px;">
              <p style="margin:0;font-size:14px;font-weight:600;color:${COLORS.text};">1. Décrivez votre cible</p>
              <p style="margin:4px 0 0;font-size:13px;color:${COLORS.textMuted};line-height:1.5;">Ex : "Restaurants à Paris" ou "Syndics de copro Marseille". Ou cliquez sur un preset secteur.</p>
            </td>
          </tr>
        </table>
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;margin:8px 0;">
          <tr>
            <td style="padding:16px 18px;background-color:${COLORS.brandLight};border-radius:10px;">
              <p style="margin:0;font-size:14px;font-weight:600;color:${COLORS.text};">2. Cliquez sur "Lancer"</p>
              <p style="margin:4px 0 0;font-size:13px;color:${COLORS.textMuted};line-height:1.5;">Volia interroge Google Places et la cascade waterfall (7 sources d'emails). Comptez 1-2 minutes.</p>
            </td>
          </tr>
        </table>
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;margin:8px 0 0;">
          <tr>
            <td style="padding:16px 18px;background-color:${COLORS.brandLight};border-radius:10px;">
              <p style="margin:0;font-size:14px;font-weight:600;color:${COLORS.text};">3. Exportez en CSV ou lancez une campagne</p>
              <p style="margin:4px 0 0;font-size:13px;color:${COLORS.textMuted};line-height:1.5;">Importez dans HubSpot, Salesforce, Lemlist… ou utilisez directement Volia Campagnes.</p>
            </td>
          </tr>
        </table>

        <div align="center">${ctaPrimary('Lancer ma recherche', ctaUrl)}</div>

        <p style="margin:20px 0 0;font-size:13px;color:${COLORS.textMuted};text-align:center;line-height:1.5;">
          Bloqué quelque part ? Répondez à cet email, on regarde avec vous.
        </p>

        ${signOff()}
      `,
    }),
  };
}

/**
 * Drip J+3 — Template killer
 *
 * Goal : montrer la valeur du module Campagnes en partageant LE template
 * qui marche le mieux en France (subject "Quick question — {{company}}").
 * Concret, immédiatement actionnable.
 */
export function templateKillerDay3Email(userName) {
  const name = userName || 'là';
  const ctaUrl = utmify('/admin/prospection/campaigns/new', 'template_d3');
  const browseUrl = utmify('/admin/prospection/templates', 'template_d3_browse');
  return {
    subject: 'Le template cold email qui marche le mieux en France',
    html: layout({
      preheader: '8-12% de taux de réponse. Le subject line le plus performant testé sur 50k emails B2B FR.',
      accent: COLORS.brand,
      content: `
        ${hero({
          emoji: '✉️',
          title: `${name}, voici LE template qui convertit`,
          greeting: `Notre équipe a analysé <strong style="color:${COLORS.text};">50 000 cold emails B2B</strong> envoyés via Volia ces 6 derniers mois. Un template ressort très clairement : <strong style="color:${COLORS.text};">8 à 12% de taux de réponse</strong>.`,
        })}

        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;margin:0 0 16px;">
          <tr>
            <td style="padding:18px 20px;background-color:#0f172a;border-radius:12px;">
              <p style="margin:0 0 6px;font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;font-weight:600;">📧 Subject</p>
              <p style="margin:0 0 14px;font-family:Menlo,Monaco,Consolas,monospace;font-size:15px;color:#ffffff;font-weight:600;">Quick question — {{company}}</p>
              <p style="margin:0 0 6px;font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;font-weight:600;">✍️ Body</p>
              <p style="margin:0;font-family:Menlo,Monaco,Consolas,monospace;font-size:13px;color:#e2e8f0;line-height:1.6;">
                Hello {{first_name}},<br/><br/>
                Je suis tombé sur {{company}} en cherchant des [secteur] sur [région].<br/><br/>
                On aide des boîtes comme la vôtre à [résultat tangible] — sans changer d'outil.<br/><br/>
                Question rapide : est-ce que [pain point] est un sujet pour vous en ce moment&nbsp;?<br/><br/>
                Si oui, 15 min en visio cette semaine&nbsp;?<br/><br/>
                — {{sender_first_name}}
              </p>
            </td>
          </tr>
        </table>

        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;margin:0 0 24px;">
          <tr>
            <td style="padding:16px 18px;background-color:${COLORS.successLight};border-radius:10px;">
              <p style="margin:0 0 6px;font-size:13px;font-weight:600;color:${COLORS.text};">Pourquoi ça marche</p>
              <ul style="margin:0;padding:0 0 0 18px;color:${COLORS.textMuted};font-size:13px;line-height:1.7;">
                <li><strong style="color:${COLORS.text};">Subject court</strong> (3 mots) : ouvre à 65%+ sur mobile</li>
                <li><strong style="color:${COLORS.text};">1 question fermée</strong> : friction nulle pour répondre</li>
                <li><strong style="color:${COLORS.text};">Pas de pitch</strong> : on demande, on ne vend pas</li>
              </ul>
            </td>
          </tr>
        </table>

        <div align="center">${ctaPrimary('Créer ma campagne', ctaUrl)}</div>
        <div align="center">${ctaSecondary('Voir tous les templates', browseUrl)}</div>

        ${signOff()}
      `,
    }),
  };
}

/**
 * Drip J+7 — Trial expiration hint
 *
 * Goal : créer l'urgence chez les users en trial Pro. Stats personnalisées
 * pour rendre la perte concrète (loss aversion). Si l'user n'est PAS en
 * trial, le cron skip ce step (cf. process-drip-emails).
 *
 * @param {string} userName
 * @param {{ prospectsFound:number, emailsEnriched:number, daysRemaining:number }} stats
 */
export function trialExpiringDay7Email(userName, stats = {}) {
  const name = userName || 'là';
  const {
    prospectsFound = 0,
    emailsEnriched = 0,
    daysRemaining = 7,
  } = stats;
  const ctaUrl = utmify('/pricing?plan=pro', 'trial_expiring_d7');
  return {
    subject: `Plus que ${daysRemaining} jours de Pro — gardez vos features`,
    html: layout({
      preheader: `${prospectsFound} prospects récupérés, ${emailsEnriched} emails enrichis. Conservez tout en passant Pro.`,
      accent: COLORS.warning,
      content: `
        ${hero({
          emoji: '⏱️',
          title: `Plus que ${daysRemaining} jours de Pro`,
          greeting: `Bonjour ${name}, votre trial Pro se termine bientôt. Voici ce que vous avez accompli en 1 semaine.`,
        })}

        <table role="presentation" cellpadding="0" cellspacing="0" border="0" class="stat-grid" style="width:100%;margin:0 0 24px;">
          <tr>
            <td width="50%" style="padding:0 4px;">
              <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:${COLORS.brandLight};border-radius:10px;padding:18px 12px;">
                <tr>
                  <td style="text-align:center;">
                    <div style="font-size:30px;font-weight:700;color:${COLORS.brand};line-height:1;">${prospectsFound}</div>
                    <div style="font-size:11px;color:${COLORS.textMuted};text-transform:uppercase;letter-spacing:0.5px;margin-top:6px;font-weight:500;">Prospects trouvés</div>
                  </td>
                </tr>
              </table>
            </td>
            <td width="50%" style="padding:0 4px;">
              <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:${COLORS.successLight};border-radius:10px;padding:18px 12px;">
                <tr>
                  <td style="text-align:center;">
                    <div style="font-size:30px;font-weight:700;color:${COLORS.success};line-height:1;">${emailsEnriched}</div>
                    <div style="font-size:11px;color:${COLORS.textMuted};text-transform:uppercase;letter-spacing:0.5px;margin-top:6px;font-weight:500;">Emails enrichis</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:${COLORS.textMuted};text-align:center;">
          Sans upgrade, vous repasserez en plan gratuit dans <strong style="color:${COLORS.text};">${daysRemaining} jours</strong> :
          quota limité à 100 prospects/mois, cascade waterfall désactivée, module Campagnes coupé.
          <br/><br/>
          <strong style="color:${COLORS.text};">Gardez Pro pour 49€/mois</strong> et continuez sur votre lancée.
        </p>

        <div align="center">${ctaPrimary('Garder Pro', ctaUrl)}</div>

        <p style="margin:20px 0 0;font-size:13px;color:${COLORS.textMuted};text-align:center;line-height:1.5;">
          Vous gardez quoi qu'il arrive vos prospects, dossiers et exports déjà réalisés.
        </p>

        ${signOff()}
      `,
    }),
  };
}

/**
 * Drip J+14 — Final push (démo Cal.com)
 *
 * Goal : last touchpoint humain. Court, personnel. Pour les users qui n'ont
 * pas encore converti mais ont un peu utilisé le produit. Filet de sécurité
 * avant qu'ils ne sortent du radar.
 */
export function finalDemoDay14Email(userName) {
  const name = userName || 'là';
  const ctaUrl = utmify('/demo', 'final_demo_d14');
  return {
    subject: 'On se voit en démo ?',
    html: layout({
      preheader: '15 min avec Anthony, fondateur de Volia. On voit ensemble si on peut vous faire gagner du temps.',
      accent: COLORS.brand,
      content: `
        ${hero({
          emoji: '👋',
          title: `${name}, on se voit 15 min ?`,
          greeting: `Bonjour ${name}, vous avez créé votre compte Volia il y a 2 semaines. Je suis Anthony, le fondateur.`,
        })}

        <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:${COLORS.text};">
          Je voulais simplement vous proposer un <strong>échange court (15 min)</strong> en visio pour :
        </p>

        <ul style="margin:0 0 24px;padding:0 0 0 20px;color:${COLORS.textMuted};font-size:14px;line-height:1.8;">
          <li>Voir <strong style="color:${COLORS.text};">votre cas concret</strong> et si Volia peut vous faire gagner du temps</li>
          <li>Vous montrer des features avancées (waterfall, campagnes, automations) si pertinent</li>
          <li>Récolter votre avis — c'est aussi comme ça qu'on s'améliore</li>
        </ul>

        <p style="margin:0 0 24px;font-size:14px;line-height:1.7;color:${COLORS.textMuted};">
          Pas de pitch commercial, pas d'engagement. Juste une vraie discussion entre 2 personnes qui font de la prospection B2B.
        </p>

        <div align="center">${ctaPrimary('Réserver 15 min', ctaUrl)}</div>

        <p style="margin:24px 0 0;font-size:13px;color:${COLORS.textMuted};line-height:1.6;">
          Si la démo n'est pas pertinente pour vous, <strong style="color:${COLORS.text};">répondez juste à cet email</strong> avec vos questions / blocages. Je lis et je réponds personnellement.
        </p>

        <p style="margin:24px 0 0;font-size:14px;color:${COLORS.text};line-height:1.5;">
          À très vite,<br/>
          <strong>Anthony Malartre</strong><br/>
          <span style="color:${COLORS.textMuted};font-size:13px;">Fondateur Volia</span>
        </p>
      `,
    }),
  };
}

/**
 * Invitation à rejoindre une team Volia Business (multi-utilisateurs).
 *
 * Envoyé après POST /api/teams/invite. Le lien token expire à 7 jours.
 */
export function teamInvitationEmail({
  inviterName,
  inviterEmail,
  teamName,
  role,
  acceptUrl,
}) {
  const inviter = inviterName || inviterEmail || 'Un collègue';
  const team = teamName || 'leur équipe';
  const roleLabel = role === 'admin' ? 'Administrateur' : 'Membre';

  return {
    subject: `${inviter} vous invite à rejoindre l'équipe ${team} sur Volia`,
    html: layout({
      preheader: `${inviter} vous a invité à rejoindre ${team} en tant que ${roleLabel}.`,
      accent: COLORS.brand,
      content: `
        ${hero({
          emoji: '👥',
          title: `Rejoignez ${team}`,
          greeting: `<strong style="color:${COLORS.text};">${inviter}</strong> vous a invité à collaborer sur Volia en tant que <strong style="color:${COLORS.text};">${roleLabel}</strong>.`,
        })}

        <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:${COLORS.textMuted};text-align:center;">
          Volia est la suite SaaS française de growth B2B : prospection, campagnes et CRM en un seul outil. En rejoignant l'équipe, vous partagerez le quota Business avec vos collègues.
        </p>

        <div align="center">${ctaPrimary('Accepter l\'invitation', acceptUrl)}</div>

        <p style="margin:20px 0 0;font-size:12px;color:${COLORS.textFaint};text-align:center;line-height:1.6;">
          Ce lien expire dans 7 jours. Si vous n'attendiez pas cette invitation, vous pouvez ignorer ce message.
        </p>

        ${signOff()}
      `,
    }),
  };
}
