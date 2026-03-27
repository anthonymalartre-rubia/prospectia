import { validateUrl } from '@/lib/url-validation';
import { getAuthenticatedUser } from '@/lib/auth';
import { checkLimit, incrementUsage } from '@/lib/usage';

// ─── Timeout helper for external API calls ──────────────
function fetchWithTimeout(url, options = {}, timeoutMs = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timer));
}

// ─── Scraping (free) ────────────────────────────────────

const EMAIL_REGEX = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
const BLOCKED_DOMAINS = new Set([
  'example.com', 'sentry.io', 'wixpress.com', 'googleapis.com',
  'schema.org', 'w3.org', 'gravatar.com', 'wordpress.org',
  'cloudflare.com', 'google.com', 'gstatic.com', 'facebook.com',
  'twitter.com', 'placeholder.com', 'email.com', 'domain.com',
  'yoursite.com', 'test.com', 'sample.com',
]);
const COMMON_PATHS = ['/contact', '/contactez-nous', '/nous-contacter', '/mentions-legales'];

function extractEmails(html) {
  const emails = new Set();
  const mailtoRegex = /mailto:([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})/gi;
  let match;
  while ((match = mailtoRegex.exec(html)) !== null) emails.add(match[1].toLowerCase());
  for (const m of html.matchAll(EMAIL_REGEX)) emails.add(m[0].toLowerCase());
  return Array.from(emails).filter((e) => {
    const [local, domain] = e.split('@');
    if (!local || !domain) return false;
    if (BLOCKED_DOMAINS.has(domain)) return false;
    if (local.includes('noreply') || local.includes('mailer-daemon')) return false;
    if (/\.(png|jpg|jpeg|gif|css|js|svg|pdf)$/i.test(local)) return false;
    return true;
  });
}

function scoreEmail(email, domain) {
  const [local, emailDomain] = email.split('@');
  if (!local || !emailDomain) return 0;
  let score = 0;

  // Domain match is the most important signal
  const domainMatches = emailDomain.toLowerCase().includes(domain.toLowerCase()) ||
    domain.toLowerCase().includes(emailDomain.toLowerCase().replace(/^www\./, ''));

  if (domainMatches) {
    score += 200;
  } else {
    score -= 100; // Penalize emails from other domains (e.g. contact@pierreetvacances.com)
  }

  if (['contact', 'info', 'support', 'hello', 'business', 'accueil', 'reception'].some((p) => local.toLowerCase().startsWith(p))) score += 50;
  if (['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'yahoo.fr', 'orange.fr', 'free.fr'].includes(emailDomain.toLowerCase())) score -= 30;
  return score;
}

async function fetchPage(url, timeout = 8000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      signal: controller.signal,
    });
    if (!res.ok) return null;
    return await res.text();
  } catch { return null; }
  finally { clearTimeout(timeoutId); }
}

function extractDomain(url) {
  try { return new URL(url).hostname.replace(/^www\./, ''); }
  catch { return null; }
}

async function scrapeForEmail(url) {
  const domain = extractDomain(url);
  if (!domain) return null;

  // Try homepage
  let html = await fetchPage(url);
  let emails = html ? extractEmails(html) : [];

  // Try common paths
  if (emails.length === 0) {
    for (const path of COMMON_PATHS) {
      const pathUrl = url.replace(/\/+$/, '') + path;
      html = await fetchPage(pathUrl);
      if (html) {
        emails = extractEmails(html);
        if (emails.length > 0) break;
      }
    }
  }

  if (emails.length > 0) {
    const scored = emails.map((e) => ({ email: e, score: scoreEmail(e, domain) }));
    scored.sort((a, b) => b.score - a.score);
    return { email: scored[0].email, source: 'scrape' };
  }
  return null;
}

// ─── Apollo ($79/mo) ────────────────────────────────────

async function apolloEnrich(domain, name) {
  const apiKey = process.env.APOLLO_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetchWithTimeout('https://api.apollo.io/v1/people/match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
      body: JSON.stringify({
        domain: domain || undefined,
        organization_name: name || undefined,
        reveal_personal_emails: false,
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.person?.email) {
      return {
        email: data.person.email,
        source: 'apollo',
        extra: {
          first_name: data.person.first_name,
          last_name: data.person.last_name,
          title: data.person.title,
          linkedin_url: data.person.linkedin_url,
        },
      };
    }
  } catch {}
  return null;
}

// ─── Serper.dev — email search + LinkedIn matching ──────

async function serperEnrich(name, domain) {
  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) return null;

  try {
    // Search for email addresses associated with the company
    const emailQuery = `"${name}" "${domain}" email contact @${domain}`;
    const res = await fetchWithTimeout('https://google.serper.dev/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-KEY': apiKey },
      body: JSON.stringify({ q: emailQuery, num: 10 }),
    });
    if (!res.ok) return null;
    const data = await res.json();

    // Extract emails from snippets and titles
    const allText = (data.organic || [])
      .map((r) => `${r.title || ''} ${r.snippet || ''}`)
      .join(' ');
    const emailRegex = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
    const foundEmails = [...new Set((allText.match(emailRegex) || []).map((e) => e.toLowerCase()))];

    // Filter: prefer emails matching the domain
    const domainEmails = foundEmails.filter((e) => e.includes(domain));
    const bestEmail = domainEmails[0] || foundEmails.find((e) =>
      !['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'example.com'].includes(e.split('@')[1])
    );

    if (bestEmail) {
      return { email: bestEmail, source: 'serper' };
    }
  } catch {}
  return null;
}

async function serperLinkedinMatch(name, domain) {
  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) return null;

  try {
    const query = `site:linkedin.com/company "${name}" ${domain || ''}`.trim();
    const res = await fetchWithTimeout('https://google.serper.dev/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-KEY': apiKey },
      body: JSON.stringify({ q: query, num: 3 }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const linkedinUrl = data.organic?.find((r) =>
      r.link?.includes('linkedin.com/company/')
    )?.link;
    return linkedinUrl || null;
  } catch { return null; }
}

// ─── Enrichly ($59/mo for 5000) ─────────────────────────

async function enrichlyEnrich(domain, name) {
  const apiKey = process.env.ENRICHLY_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetchWithTimeout('https://api.enrichly.io/v1/enrich', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({ domain, company_name: name }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.email) {
      return { email: data.email, source: 'enrichly' };
    }
  } catch {}
  return null;
}

// ─── Anymail Finder ─────────────────────────────────────

async function anymailEnrich(domain) {
  const apiKey = process.env.ANYMAIL_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetchWithTimeout(`https://api.anymailfinder.com/v5.0/search/company.json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({ domain }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.email) {
      return { email: data.email, source: 'anymail' };
    }
    if (data.emails?.length > 0) {
      return { email: data.emails[0], source: 'anymail' };
    }
  } catch {}
  return null;
}

// ─── Findymail ──────────────────────────────────────────

async function findymailEnrich(domain, name) {
  const apiKey = process.env.FINDYMAIL_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetchWithTimeout('https://app.findymail.com/api/search/company', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({ domain, company_name: name }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.email) {
      return { email: data.email, source: 'findymail' };
    }
  } catch {}
  return null;
}

// ─── Waterfall orchestrator ─────────────────────────────

const WATERFALL_STEPS = [
  { name: 'scrape', label: 'Scraping site web', fn: async (ctx) => scrapeForEmail(ctx.url) },
  { name: 'serper', label: 'Serper.dev', fn: async (ctx) => serperEnrich(ctx.name, ctx.domain) },
  { name: 'apollo', label: 'Apollo.io', fn: async (ctx) => apolloEnrich(ctx.domain, ctx.name) },
  { name: 'enrichly', label: 'Enrichly', fn: async (ctx) => enrichlyEnrich(ctx.domain, ctx.name) },
  { name: 'anymail', label: 'Anymail Finder', fn: async (ctx) => anymailEnrich(ctx.domain) },
  { name: 'findymail', label: 'Findymail', fn: async (ctx) => findymailEnrich(ctx.domain, ctx.name) },
];

export async function POST(request) {
  try {
    const { user, supabase } = await getAuthenticatedUser();

    if (!user) {
      return Response.json({ error: 'Authentification requise' }, { status: 401 });
    }

    const limitCheck = await checkLimit(supabase, user.id, 'enrichments');
    if (!limitCheck.allowed) {
      return Response.json(
        { error: "Limite d'enrichissements atteinte. Passez au plan Pro.", limitReached: true, ...limitCheck },
        { status: 429 }
      );
    }

    const { url, name } = await request.json();

    if (!url) {
      return Response.json({ error: 'url required' }, { status: 400 });
    }

    const validation = validateUrl(url);
    if (!validation.valid) {
      return Response.json({ error: validation.error }, { status: 400 });
    }

    const domain = extractDomain(validation.url);
    const ctx = { url: validation.url, domain, name };
    const tried = [];

    for (const step of WATERFALL_STEPS) {
      try {
        const result = await step.fn(ctx);
        tried.push({ step: step.name, label: step.label, found: !!result?.email });
        if (result?.email) {
          await incrementUsage(supabase, user.id, 'enrichments');
          return Response.json({
            email: result.email,
            source: result.source,
            extra: result.extra || null,
            linkedin_url: null,
            waterfall: tried,
          });
        }
      } catch (error) {
        tried.push({ step: step.name, label: step.label, found: false, error: true });
      }
    }

    // Serper LinkedIn (bonus, not for email but for data enrichment)
    let linkedinUrl = null;
    if (name && domain) {
      linkedinUrl = await serperLinkedinMatch(name, domain);
    }

    // Final fallback: guess
    const guessEmail = domain ? `contact@${domain}` : null;

    await incrementUsage(supabase, user.id, 'enrichments');
    return Response.json({
      email: guessEmail,
      source: 'guess',
      extra: null,
      linkedin_url: linkedinUrl,
      waterfall: [...tried, { step: 'guess', label: 'Email deviné', found: !!guessEmail }],
    });
  } catch (error) {
    console.error('Waterfall enrichment error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
