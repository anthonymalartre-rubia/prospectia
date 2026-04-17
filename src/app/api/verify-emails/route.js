import { getAuthenticatedUser } from '@/lib/auth';
import { checkLimit, incrementUsage } from '@/lib/usage';
import { getPlan } from '@/lib/plans';

function fetchWithTimeout(url, options = {}, timeoutMs = 15000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timer));
}

// ─── Single email verification via MillionVerifier ──────
async function verifyEmail(email) {
  const apiKey = process.env.MILLIONVERIFIER_API_KEY;
  if (!apiKey) return { email, result: 'unknown', error: 'API key missing' };

  try {
    const params = new URLSearchParams({ api: apiKey, email });
    const res = await fetchWithTimeout(
      `https://api.millionverifier.com/api/v3/?${params.toString()}`
    );
    if (!res.ok) {
      return { email, result: 'unknown', error: `HTTP ${res.status}` };
    }
    const data = await res.json();
    // MillionVerifier returns: result (ok, catch_all, unknown, invalid, disposable, error)
    // and quality score
    return {
      email,
      result: data.result || 'unknown',
      subresult: data.subresult || null,
      free: data.free || false,
      role: data.role || false,
      quality: data.quality_score ?? null,
    };
  } catch (err) {
    return { email, result: 'unknown', error: err.name === 'AbortError' ? 'timeout' : err.message };
  }
}

export async function POST(request) {
  try {
    const { user, supabase } = await getAuthenticatedUser();
    if (!user) {
      return Response.json({ error: 'Authentification requise' }, { status: 401 });
    }

    // Enterprise-only feature
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('plan')
      .eq('id', user.id)
      .single();

    if (profile?.plan === 'free') {
      return Response.json(
        { error: 'Cette fonctionnalite est reservee aux plans Pro et Enterprise.' },
        { status: 403 }
      );
    }

    const { emails } = await request.json();

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return Response.json({ error: 'Liste d\'emails requise' }, { status: 400 });
    }

    // Limit batch size to 100 at a time
    const batch = emails.slice(0, 100);

    // Check usage limit for verifications
    const limitCheck = await checkLimit(supabase, user.id, 'verifications');
    if (!limitCheck.allowed) {
      return Response.json(
        { error: 'Limite de verifications atteinte.', limitReached: true, ...limitCheck },
        { status: 429 }
      );
    }

    // Verify emails in parallel (batches of 10 to avoid rate limits)
    const results = [];
    for (let i = 0; i < batch.length; i += 10) {
      const chunk = batch.slice(i, i + 10);
      const chunkResults = await Promise.all(chunk.map(verifyEmail));
      results.push(...chunkResults);
    }

    // Increment usage by the number of emails verified (single batch call)
    await incrementUsage(supabase, user.id, 'verifications', results.length);

    // Compute summary stats
    const stats = {
      total: results.length,
      valid: results.filter(r => r.result === 'ok').length,
      catch_all: results.filter(r => r.result === 'catch_all').length,
      invalid: results.filter(r => r.result === 'invalid').length,
      disposable: results.filter(r => r.result === 'disposable').length,
      unknown: results.filter(r => r.result === 'unknown').length,
    };

    return Response.json({ results, stats });
  } catch (error) {
    console.error('Email verification error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
