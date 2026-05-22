// GET /api/status — health check global de la plateforme.
// Vérifie en parallèle les 4 services critiques (Supabase, Stripe, Resend, Vercel).
// Retourne { services: [{ name, status, latency_ms, message }], overall: 'ok' | 'degraded' | 'down' }

import { NextResponse } from 'next/server';
import { cleanEnv } from '@/lib/envClean';

export const dynamic = 'force-dynamic';

async function probe(name, url, opts = {}) {
  const start = Date.now();
  try {
    const ctrl = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), 5000);
    const res = await fetch(url, { ...opts, signal: ctrl.signal });
    clearTimeout(timeout);
    const latency = Date.now() - start;
    if (res.ok || res.status === 401 || res.status === 403) {
      // 401/403 = service répond mais nécessite auth → toujours UP
      return { name, status: 'operational', latency_ms: latency, message: `HTTP ${res.status}` };
    }
    return { name, status: 'degraded', latency_ms: latency, message: `HTTP ${res.status}` };
  } catch (err) {
    return { name, status: 'down', latency_ms: Date.now() - start, message: err.message || 'timeout' };
  }
}

export async function GET() {
  const supabaseUrl = cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const results = await Promise.all([
    // Supabase health endpoint
    supabaseUrl
      ? probe('Supabase', `${supabaseUrl}/auth/v1/health`)
      : Promise.resolve({ name: 'Supabase', status: 'unknown', latency_ms: 0, message: 'NEXT_PUBLIC_SUPABASE_URL missing' }),
    // Stripe API
    probe('Stripe', 'https://api.stripe.com/v1/charges', {
      headers: { Authorization: `Bearer ${cleanEnv(process.env.STRIPE_SECRET_KEY) || 'invalid'}` },
    }),
    // Resend API
    probe('Resend', 'https://api.resend.com/domains', {
      headers: { Authorization: `Bearer ${cleanEnv(process.env.RESEND_API_KEY) || 'invalid'}` },
    }),
    // Vercel (notre propre /api)
    probe('Vercel (App)', 'https://prospectia.cloud/api/places', { method: 'GET' }),
  ]);

  const hasDown = results.some((r) => r.status === 'down');
  const hasDegraded = results.some((r) => r.status === 'degraded');
  const overall = hasDown ? 'down' : hasDegraded ? 'degraded' : 'ok';

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    overall,
    services: results,
  });
}
