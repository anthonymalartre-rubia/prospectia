// src/lib/emailTemplates.js
// HTML email templates for Prospectia.ai transactional emails

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://scraping-dom-ezdrive.vercel.app';
const DASHBOARD_URL = `${APP_URL}/dashboard`;
const PRICING_URL = `${APP_URL}/#pricing`;

// ─── Shared layout wrapper ─────────────────────────────────────────────────────

function layout(content) {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Prospectia.ai</title>
</head>
<body style="margin:0;padding:0;background-color:#09090b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#09090b;padding:40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          <!-- Header -->
          <tr>
            <td style="text-align:center;padding:0 0 32px;">
              <span style="font-size:28px;font-weight:700;color:#fafafa;letter-spacing:-0.5px;">Prospectia<span style="color:#6366f1;">.ai</span></span>
            </td>
          </tr>
          <!-- Card -->
          <tr>
            <td style="background-color:#111114;border:1px solid #1e1e24;border-radius:12px;padding:40px 36px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="text-align:center;padding:32px 0 0;">
              <p style="margin:0 0 8px;font-size:12px;color:#52525b;">
                Prospectia.ai &mdash; Prospection B2B automatis&eacute;e en France
              </p>
              <p style="margin:0;font-size:11px;color:#3f3f46;">
                <a href="${APP_URL}/legal/mentions-legales" style="color:#3f3f46;text-decoration:underline;">Mentions l&eacute;gales</a>
                &nbsp;&middot;&nbsp;
                <a href="${APP_URL}/legal/confidentialite" style="color:#3f3f46;text-decoration:underline;">Politique de confidentialit&eacute;</a>
                &nbsp;&middot;&nbsp;
                <a href="${APP_URL}/legal/cgu" style="color:#3f3f46;text-decoration:underline;">CGU</a>
              </p>
              <p style="margin:8px 0 0;font-size:11px;color:#3f3f46;">
                Si vous ne souhaitez plus recevoir ces emails, vous pouvez modifier vos pr&eacute;f&eacute;rences dans votre espace client.
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

function ctaButton(text, href) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px auto 0;">
  <tr>
    <td style="background-color:#6366f1;border-radius:8px;padding:14px 32px;">
      <a href="${href}" style="color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;display:inline-block;">${text}</a>
    </td>
  </tr>
</table>`;
}

// ─── Templates ──────────────────────────────────────────────────────────────────

/**
 * Welcome email after signup
 */
export function welcomeEmail(userName) {
  const name = userName || 'there';
  return {
    subject: 'Bienvenue sur Prospectia.ai !',
    html: layout(`
      <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#fafafa;">
        Bienvenue ${name} &#x1f44b;
      </h1>
      <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#a1a1aa;">
        Votre compte Prospectia.ai est pr&ecirc;t. Vous pouvez d&egrave;s maintenant commencer &agrave; prospecter sur toute la France.
      </p>
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 24px;width:100%;">
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #1e1e24;">
            <span style="color:#6366f1;font-weight:600;font-size:14px;">&#x1f50d; Recherche Google Places</span>
            <p style="margin:4px 0 0;font-size:13px;color:#71717a;">101 d&eacute;partements, 150+ cat&eacute;gories B2B et copropri&eacute;t&eacute;</p>
          </td>
        </tr>
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #1e1e24;">
            <span style="color:#6366f1;font-weight:600;font-size:14px;">&#x2709; Enrichissement email</span>
            <p style="margin:4px 0 0;font-size:13px;color:#71717a;">Extraction automatique depuis les sites web des prospects</p>
          </td>
        </tr>
        <tr>
          <td style="padding:12px 0;">
            <span style="color:#6366f1;font-weight:600;font-size:14px;">&#x1f4e5; Export CSV &amp; Zoho CRM</span>
            <p style="margin:4px 0 0;font-size:13px;color:#71717a;">Exportez vos leads en un clic dans le format de votre choix</p>
          </td>
        </tr>
      </table>
      ${ctaButton('Acc&eacute;der au dashboard', DASHBOARD_URL)}
    `),
  };
}

/**
 * Usage warning email (e.g. 80% usage reached)
 */
export function usageWarningEmail(userName, usagePercent, planName, limitType) {
  const name = userName || 'there';
  const limitLabel = limitType === 'searches' ? 'prospects' : limitType === 'enrichments' ? 'enrichissements' : 'exports';
  return {
    subject: `Vous avez utilis\u00e9 ${usagePercent}% de vos ${limitLabel}`,
    html: layout(`
      <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#fafafa;">
        &#x26a0;&#xfe0f; ${usagePercent}% de vos ${limitLabel} utilis&eacute;s
      </h1>
      <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#a1a1aa;">
        Bonjour ${name}, vous avez utilis&eacute; <strong style="color:#fafafa;">${usagePercent}%</strong> de vos ${limitLabel} mensuels sur votre plan <strong style="color:#fafafa;">${planName}</strong>.
      </p>
      <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#a1a1aa;">
        Pour continuer &agrave; prospecter sans interruption, pensez &agrave; passer au plan sup&eacute;rieur.
      </p>
      <!-- Progress bar -->
      <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin:0 0 8px;">
        <tr>
          <td style="background-color:#1e1e24;border-radius:6px;padding:0;height:12px;">
            <div style="width:${usagePercent}%;background-color:#f59e0b;height:12px;border-radius:6px;"></div>
          </td>
        </tr>
      </table>
      <p style="margin:0 0 4px;font-size:12px;color:#71717a;text-align:right;">${usagePercent}% utilis&eacute;s</p>
      ${ctaButton('Passer au plan sup&eacute;rieur', PRICING_URL)}
    `),
  };
}

/**
 * Usage limit reached email (100%)
 */
export function usageLimitReachedEmail(userName, planName, limitType) {
  const name = userName || 'there';
  const limitLabel = limitType === 'searches' ? 'prospects' : limitType === 'enrichments' ? 'enrichissements' : 'exports';
  return {
    subject: `Limite de ${limitLabel} atteinte`,
    html: layout(`
      <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#fafafa;">
        &#x1f6d1; Limite de ${limitLabel} atteinte
      </h1>
      <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#a1a1aa;">
        Bonjour ${name}, vous avez atteint la limite de ${limitLabel} mensuels de votre plan <strong style="color:#fafafa;">${planName}</strong>.
      </p>
      <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#a1a1aa;">
        Vos donn&eacute;es existantes restent accessibles. Pour reprendre la prospection, passez &agrave; un plan sup&eacute;rieur ou attendez le renouvellement mensuel de vos quotas.
      </p>
      <!-- Progress bar full -->
      <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin:0 0 8px;">
        <tr>
          <td style="background-color:#1e1e24;border-radius:6px;padding:0;height:12px;">
            <div style="width:100%;background-color:#ef4444;height:12px;border-radius:6px;"></div>
          </td>
        </tr>
      </table>
      <p style="margin:0 0 4px;font-size:12px;color:#71717a;text-align:right;">100% utilis&eacute;s</p>
      ${ctaButton('Changer de plan', PRICING_URL)}
    `),
  };
}

/**
 * Payment success / subscription confirmation email
 */
export function paymentSuccessEmail(userName, planName, amount) {
  const name = userName || 'there';
  const formattedAmount = (amount / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
  return {
    subject: `Merci pour votre abonnement ${planName} !`,
    html: layout(`
      <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#fafafa;">
        &#x2705; Paiement confirm&eacute;
      </h1>
      <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#a1a1aa;">
        Bonjour ${name}, merci pour votre abonnement ! Votre plan <strong style="color:#fafafa;">${planName}</strong> est maintenant actif.
      </p>
      <!-- Receipt -->
      <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;background-color:#1e1e24;border-radius:8px;padding:20px;margin:0 0 24px;">
        <tr>
          <td style="padding:8px 16px;font-size:14px;color:#a1a1aa;">Plan</td>
          <td style="padding:8px 16px;font-size:14px;color:#fafafa;text-align:right;font-weight:600;">${planName}</td>
        </tr>
        <tr>
          <td style="padding:8px 16px;font-size:14px;color:#a1a1aa;border-top:1px solid #2a2a35;">Montant</td>
          <td style="padding:8px 16px;font-size:14px;color:#fafafa;text-align:right;font-weight:600;border-top:1px solid #2a2a35;">${formattedAmount} / mois</td>
        </tr>
        <tr>
          <td style="padding:8px 16px;font-size:14px;color:#a1a1aa;border-top:1px solid #2a2a35;">Statut</td>
          <td style="padding:8px 16px;font-size:14px;color:#22c55e;text-align:right;font-weight:600;border-top:1px solid #2a2a35;">Actif</td>
        </tr>
      </table>
      <p style="margin:0 0 20px;font-size:13px;line-height:1.6;color:#71717a;">
        Vous recevrez une facture par email de la part de Stripe. Vous pouvez g&eacute;rer votre abonnement depuis votre espace client.
      </p>
      ${ctaButton('Acc&eacute;der au dashboard', DASHBOARD_URL)}
    `),
  };
}

/**
 * Subscription cancelled email
 */
export function subscriptionCancelledEmail(userName) {
  const name = userName || 'there';
  return {
    subject: 'Votre abonnement a \u00e9t\u00e9 annul\u00e9',
    html: layout(`
      <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#fafafa;">
        Abonnement annul&eacute;
      </h1>
      <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#a1a1aa;">
        Bonjour ${name}, votre abonnement Prospectia.ai a &eacute;t&eacute; annul&eacute;. Votre compte est maintenant sur le plan <strong style="color:#fafafa;">Starter (gratuit)</strong>.
      </p>
      <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#a1a1aa;">
        Vos donn&eacute;es et leads existants sont conserv&eacute;s. Vous pouvez continuer &agrave; utiliser Prospectia.ai avec les limites du plan gratuit.
      </p>
      <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#a1a1aa;">
        Si vous changez d&apos;avis, vous pouvez r&eacute;activer un abonnement &agrave; tout moment.
      </p>
      ${ctaButton('Voir les plans', PRICING_URL)}
    `),
  };
}
