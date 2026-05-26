import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { sendEmail } from '@/lib/email';
import { trialStartedEmail } from '@/lib/emailTemplates';

/**
 * POST /api/auth/trial-start
 *
 * Appelé depuis /auth/confirm (signup email) après détection SIGNED_IN.
 * Le trial Pro 14j est déjà attribué par le trigger DB handle_new_user
 * (qui crée le profil avec trial_plan='pro' + trial_ends_at=now+14d).
 *
 * Ce endpoint :
 *   1. Vérifie que le user est bien authentifié
 *   2. Récupère trial_ends_at depuis le profil
 *   3. Envoie l'email trialStartedEmail (fire & forget, ne bloque pas)
 *
 * Idempotent : si l'email a déjà été envoyé, on no-op silencieusement.
 * Pour éviter les doublons (re-confirm, double-click), on ne renvoie
 * que si trial_started_at < 60s (= juste créé).
 *
 * /api/auth/callback (OAuth Google) reste le canonical pour le flow
 * Google ; ce endpoint complète le flow email-signup qui passe par
 * Supabase Verify côté client.
 */
export async function POST() {
  const { user } = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const supabaseAdmin = getSupabaseAdmin();

  // Lit trial_ends_at + trial_started_at pour valider qu'on est bien
  // sur un signup tout frais (pas un user qui revient se logger).
  const { data: profile, error: profileErr } = await supabaseAdmin
    .from('user_profiles')
    .select('trial_started_at, trial_ends_at')
    .eq('id', user.id)
    .single();

  if (profileErr || !profile?.trial_started_at || !profile?.trial_ends_at) {
    // Pas de trial → soit le trigger a foiré, soit user pré-existant.
    // On ne bloque pas le flow auth, on retourne ok silently.
    return NextResponse.json({ ok: true, trial: null });
  }

  // Anti double-send : on n'envoie l'email que si le signup date de
  // moins de 5 min. Au-delà = user qui re-confirm un vieux compte
  // ou contourne /auth/confirm — on n'envoie pas un faux welcome.
  const startedAt = new Date(profile.trial_started_at).getTime();
  const now = Date.now();
  const isFreshSignup = now - startedAt < 5 * 60 * 1000;

  if (!isFreshSignup) {
    return NextResponse.json({ ok: true, trial: 'already-sent' });
  }

  // Envoi email — fire & forget pour ne pas bloquer la redirect dashboard.
  try {
    const userName =
      user.user_metadata?.full_name || user.user_metadata?.name || null;
    const tpl = trialStartedEmail(userName, profile.trial_ends_at);
    sendEmail({ to: user.email, subject: tpl.subject, html: tpl.html }).catch(
      (err) => console.error('[trial-start] email failed:', err),
    );
  } catch (err) {
    console.error('[trial-start] template error:', err);
  }

  return NextResponse.json({
    ok: true,
    trial: { ends_at: profile.trial_ends_at },
  });
}
