import { validateUrl } from '@/lib/url-validation';
import { getAuthenticatedUser } from '@/lib/auth';
import { checkLimit, incrementUsage } from '@/lib/usage';

const BLOCKED_DOMAINS = [
  'example.com',
  'sentry.io',
  'wixpress.com',
  'googleapis.com',
  'schema.org',
  'w3.org',
  'gravatar.com',
  'wordpress.org',
  'cloudflare.com',
  'google.com',
  'gstatic.com',
  'facebook.com',
  'twitter.com',
  'placeholder.com',
  'email.com',
  'domain.com',
  'yoursite.com',
  'test.com',
  'sample.com',
];

const BLOCKED_EXTENSIONS = [
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg',
  '.css', '.js', '.json', '.xml', '.pdf', '.doc',
  '.docx', '.xlsx', '.zip',
];

const EMAIL_REGEX = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;

const COMMON_PATHS = [
  '/contact',
  '/contactez-nous',
  '/nous-contacter',
  '/mentions-legales',
];

function extractEmailsFromHtml(html) {
  const emails = new Set();

  const mailtoRegex = /mailto:([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})/gi;
  let match;
  while ((match = mailtoRegex.exec(html)) !== null) {
    emails.add(match[1].toLowerCase());
  }

  const matches = html.matchAll(EMAIL_REGEX);
  for (const m of matches) {
    emails.add(m[0].toLowerCase());
  }

  const obfuscatedRegex =
    /([a-zA-Z0-9._%+\-]+)\s*[\[\(\{](at|dot)[\]\)\}]\s*([a-zA-Z0-9.\-]+\s*[\[\(\{](com|fr|eu)[\]\)\}])/gi;
  while ((match = obfuscatedRegex.exec(html)) !== null) {
    const localPart = match[1];
    const domain = match[3].replace(/\s*[\[\(\{]|\s*[\]\)\}]/g, '');
    const tld = match[4];
    const email = `${localPart}@${domain}.${tld}`.toLowerCase();
    emails.add(email);
  }

  return Array.from(emails);
}

function isValidEmail(email) {
  if (!email) return false;
  const [localPart, domain] = email.split('@');
  if (!localPart || !domain) return false;
  if (BLOCKED_DOMAINS.includes(domain.toLowerCase())) return false;
  if (BLOCKED_EXTENSIONS.some((ext) => localPart.toLowerCase().endsWith(ext))) return false;
  if (localPart.toLowerCase().includes('noreply') || localPart.toLowerCase().includes('mailer-daemon')) return false;
  return true;
}

function scoreEmail(email, domain) {
  if (!email) return 0;
  const [localPart, emailDomain] = email.split('@');
  if (!localPart || !emailDomain) return 0;
  let score = 0;

  // Domain match is the most important signal
  const domainMatches = emailDomain.toLowerCase().includes(domain.toLowerCase()) ||
    domain.toLowerCase().includes(emailDomain.toLowerCase().replace(/^www\./, ''));

  if (domainMatches) {
    score += 200; // Strong boost for matching domain
  } else {
    score -= 100; // Heavy penalty for non-matching domain (e.g. contact@pierreetvacances.com on hotel-carayou.com)
  }

  // Prefix bonus
  const contactPrefixes = ['contact', 'info', 'support', 'hello', 'business', 'accueil', 'reception'];
  if (contactPrefixes.some((prefix) => localPart.toLowerCase().startsWith(prefix))) score += 50;

  // Generic email providers get lower score
  const genericDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'yahoo.fr', 'orange.fr', 'free.fr', 'sfr.fr', 'laposte.net'];
  if (genericDomains.includes(emailDomain.toLowerCase())) {
    score -= 30;
  }

  return score;
}

async function fetchUrl(url, timeout = 10000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      signal: controller.signal,
    });
    if (!response.ok) return null;
    return await response.text();
  } catch {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

function extractDomain(url) {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return null;
  }
}

async function enrichEmail(url) {
  const domain = extractDomain(url);
  if (!domain) return { email: '', method: '' };

  let html = await fetchUrl(url);
  let emails = html ? extractEmailsFromHtml(html) : [];
  let validEmails = emails.filter(isValidEmail);

  if (validEmails.length === 0) {
    // Fetch all common paths in parallel instead of sequentially (~4x faster)
    const pathUrls = COMMON_PATHS.map(path =>
      url.endsWith('/') ? `${url}${path.slice(1)}` : `${url}${path}`
    );
    const results = await Promise.allSettled(pathUrls.map(fetchUrl));
    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) {
        emails = extractEmailsFromHtml(result.value);
        validEmails = emails.filter(isValidEmail);
        if (validEmails.length > 0) break;
      }
    }
  }

  if (validEmails.length > 0) {
    const scoredEmails = validEmails.map((email) => ({
      email,
      score: scoreEmail(email, domain),
    }));
    scoredEmails.sort((a, b) => b.score - a.score);
    // Only return if the best email has a positive score (domain matches)
    if (scoredEmails[0].score > 0) {
      return { email: scoredEmails[0].email, method: 'scrape' };
    }
  }

  return { email: `contact@${domain}`, method: 'guess' };
}

export async function POST(request) {
  try {
    const { user, supabase } = await getAuthenticatedUser();
    if (!user) return Response.json({ error: 'Non autorise' }, { status: 401 });

    const limitCheck = await checkLimit(supabase, user.id, 'enrichments');
    if (!limitCheck.allowed) {
      return Response.json(
        { error: "Limite d'enrichissements atteinte. Passez au plan Pro.", limitReached: true, ...limitCheck },
        { status: 429 }
      );
    }

    const { url } = await request.json();

    // SSRF validation
    const validation = validateUrl(url);
    if (!validation.valid) {
      return Response.json({ error: validation.error }, { status: 400 });
    }

    const result = await enrichEmail(validation.url);
    await incrementUsage(supabase, user.id, 'enrichments');
    return Response.json(result);
  } catch (error) {
    console.error('Enrich API route error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
