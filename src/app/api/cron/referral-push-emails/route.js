import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { sendEmail } from '@/lib/email';
import { referralPushEmail } from '@/lib/emailTemplates';
import { createNotification, NOTIF_TYPES } from '@/lib/notifications';

/**
 * GET /api/cron/referral-push-emails
 *
 * Cron Vercel daily : envoie un email push parrainage aux users qui
 * cochent toutes les cases :
 *   - account créé entre J-14 et J-7 (fenêtre de 7j d'éligibilité)
 *   - au moins 1 search effectuée (engagement minimum — sinon le push
 *     parrainage n'a aucun sens, l'user n'a même pas testé le produit)
 *   - pas encore parrainé personne (referrals.referrer_id IS NULL)
 *   - email pas encore envoyé (referral_push_email_sent_at IS NULL)
 *
 * One-shot par user : on écrit referral_push_email_sent_at dès l'envoi
 * réussi pour garantir 0 doublon même si le cron tourne plusieurs fois.
 *
 * Sécurité : header Authorization: Bearer CRON_SECRET (Vercel cron).
 */
export const dynamic = 'force-dynamic';

function checkCronAuth(request) {
  const auth = request.headers.get('authorization');
  const expected = `Bearer ${process.env.CRON_SECRET || ''}`;
  return process.env.CRON_SECRET && auth === expected;
}

export async function GET(request) {
  if (!checkCronAuth(request)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const startedAt = new Date().toISOString();
  const stats = { eligible: 0, sent: 0, skipped: 0, failed: 0 };

  try {
    // Fenêtre : créé entre 14j et 7j ago
    const fourteenDaysAgo = new Date(Date.now() - 14 * 86400 * 1000).toISOString();
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400 * 1000).toISOString();

    // 1. Récupérer les candidats potentiels (qui n'ont pas encore reçu l'email)
    // Note : on ne select PAS full_name — la colonne n'existe pas sur
    // user_profiles. Le nom complet vient d'auth.users.user_metadata
    // (récupéré plus bas via auth.admin.getUserById).
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('id, created_at, referral_code')
      .gte('created_at', fourteenDaysAgo)
      .lte('created_at', sevenDaysAgo)
      .is('referral_push_email_sent_at', null);

    if (profilesError) {
      console.error('[cron/referral-push-emails] fetch profiles failed:', profilesError);
      return NextResponse.json({ error: 'db error', details: profilesError.message }, { status: 500 });
    }

    if (!profiles || profiles.length === 0) {
      return NextResponse.json({ ok: true, startedAt, ...stats, note: 'no eligible users' });
    }

    console.log(`[cron/referral-push-emails] ${profiles.length} candidates`);

    // 2. Filtrer : doit avoir ≥ 1 search ET ne pas avoir déjà parrainé
    //    On le fait user par user pour pouvoir batcher proprement les checks.
    for (const profile of profiles) {
      try {
        // Check engagement : ≥ 1 prospect créé (= proxy d'une search)
        const { count: prospectCount } = await supabase
          .from('prospects')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', profile.id)
          .limit(1);

        if (!prospectCount || prospectCount === 0) {
          stats.skipped++;
          continue;
        }

        // Check qu'il n'a pas encore parrainé (au moins 1 referral émis)
        const { count: referralCount } = await supabase
          .from('referrals')
          .select('id', { count: 'exact', head: true })
          .eq('referrer_id', profile.id)
          .limit(1);

        if (referralCount && referralCount > 0) {
          stats.skipped++;
          continue;
        }

        stats.eligible++;

        // Récupère l'email auth
        const { data: userData } = await supabase.auth.admin.getUserById(profile.id);
        if (!userData?.user?.email) {
          stats.skipped++;
          continue;
        }
        const email = userData.user.email;
        const fullName =
          userData.user.user_metadata?.full_name ||
          userData.user.user_metadata?.name ||
          email?.split('@')[0] ||
          null;

        if (!profile.referral_code) {
          // Edge-case : profil sans code (le trigger DB devrait toujours en
          // créer un). On skip et on log pour visibilité.
          console.warn(`[cron/referral-push-emails] no referral_code for user ${profile.id}`);
          stats.skipped++;
          continue;
        }

        const tpl = referralPushEmail(fullName, profile.referral_code);
        const result = await sendEmail({ to: email, subject: tpl.subject, html: tpl.html });

        if (result.success) {
          // Marque immédiatement l'envoi comme effectué (one-shot garantie)
          await supabase
            .from('user_profiles')
            .update({ referral_push_email_sent_at: new Date().toISOString() })
            .eq('id', profile.id);

          // Push #4 : crée une notification in-app (visible dans la
          // NotificationBell) au même moment que l'email. Fire & forget —
          // si ça échoue, l'email reste envoyé.
          createNotification(profile.id, {
            type: NOTIF_TYPES.NEW_FEATURE,
            title: 'Parrainez 3 amis = 3 mois gratuits',
            body: `Votre code : ${profile.referral_code}. Pour chaque ami payant, 1 mois Pro offert (cumulable, sans limite).`,
            link: '/parrainage',
            metadata: { kind: 'referral_push' },
          }).catch((err) => console.warn('[cron/referral-push-emails] notif failed:', err));

          stats.sent++;
        } else {
          stats.failed++;
          console.warn(`[cron/referral-push-emails] send failed for ${email}:`, result.error);
        }

        // Throttle léger : 50ms = 20 emails/sec
        await new Promise((r) => setTimeout(r, 50));
      } catch (err) {
        stats.failed++;
        console.error(`[cron/referral-push-emails] error processing user ${profile.id}:`, err);
      }
    }

    const finishedAt = new Date().toISOString();
    console.log('[cron/referral-push-emails] done', { startedAt, finishedAt, ...stats });
    return NextResponse.json({ ok: true, startedAt, finishedAt, ...stats });
  } catch (err) {
    console.error('[cron/referral-push-emails] fatal:', err);
    return NextResponse.json({ error: 'fatal', details: err?.message }, { status: 500 });
  }
}
