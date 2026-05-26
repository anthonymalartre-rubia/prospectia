// POST /api/webhooks/resend/inbound
//
// Webhook Resend Inbound : reçoit les réponses à un email envoyé depuis
// Volia Campagnes. Quand un prospect répond, on auto-crée :
//   - un crm_contacts (si absent)
//   - un crm_deals au stage "Lead" (10%) dans le pipeline par défaut
//   - une crm_activities (type=email) avec le body
// Puis on met à jour email_sends.replied_at si on retrouve le message originel.
//
// Endpoint TOUJOURS 200 (sinon Resend retry à l'infini). L'auto-création
// est fire-and-forget, isolée par try/catch.
//
// Sécurité : signature Svix vérifiée via lib/webhooks/resend-verify.js.
// Env requis : RESEND_INBOUND_WEBHOOK_SECRET (whsec_xxx).

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { cleanEnv } from '@/lib/envClean';
import { verifyResendSignature } from '@/lib/webhooks/resend-verify';
import { autoCreateFromReply } from '@/lib/crm-auto-create';
import { parseCampaignReplyAddress, parseSequenceReplyAddress, isInboundDomain } from '@/lib/inbound-domain';
import { parsePeerEmailAddress } from '@/lib/warmup-peer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function extractDomain(emailLike) {
  if (!emailLike) return null;
  // Resend peut envoyer "Foo <foo@bar.com>" ou "foo@bar.com"
  const m = String(emailLike).match(/<?([^<>\s]+@[^<>\s]+)>?/);
  const email = m?.[1] || String(emailLike);
  const atIdx = email.lastIndexOf('@');
  if (atIdx < 0) return null;
  return email.slice(atIdx + 1).toLowerCase().trim();
}

function extractEmail(emailLike) {
  if (!emailLike) return null;
  const m = String(emailLike).match(/<?([^<>\s]+@[^<>\s]+)>?/);
  return (m?.[1] || String(emailLike)).toLowerCase().trim();
}

function asFirst(value) {
  if (Array.isArray(value)) return value[0];
  return value;
}

export async function POST(request) {
  let rawBody = '';
  try {
    rawBody = await request.text();
  } catch (err) {
    console.warn('[resend-inbound] failed to read body', err?.message);
    return NextResponse.json({ received: true }, { status: 200 });
  }

  // 1) Vérification signature (best-effort si secret absent en dev)
  const secret = cleanEnv(process.env.RESEND_INBOUND_WEBHOOK_SECRET);
  if (secret) {
    try {
      verifyResendSignature({ payload: rawBody, headers: request.headers, secret });
    } catch (err) {
      console.warn('[resend-inbound] signature invalid:', err.message);
      // 200 pour éviter les retries Resend qui n'aident pas
      return NextResponse.json({ received: true, error: 'invalid_signature' }, { status: 200 });
    }
  } else {
    console.warn('[resend-inbound] RESEND_INBOUND_WEBHOOK_SECRET non configuré — verification skip');
  }

  // 2) Parse payload
  let payload = {};
  try {
    payload = JSON.parse(rawBody || '{}');
  } catch {
    return NextResponse.json({ received: true }, { status: 200 });
  }

  // Resend Inbound (basé sur svix + format webhook) : data contient l'email
  // Format attendu : { type: 'email.received', data: { from, to, subject, text, html, headers, message_id, in_reply_to } }
  const data = payload?.data || payload;
  const from = extractEmail(asFirst(data?.from));
  const toRaw = asFirst(data?.to);
  const toDomain = extractDomain(toRaw);
  const subject = data?.subject || null;
  const bodyText = data?.text || data?.plain || data?.body || '';
  const messageId = data?.message_id || data?.messageId || null;
  const inReplyTo = data?.in_reply_to || data?.inReplyTo || data?.headers?.['in-reply-to'] || null;

  // Audit row toujours créée même si la suite échoue
  const supabaseAdmin = (() => {
    try {
      return getSupabaseAdmin();
    } catch (err) {
      console.error('[resend-inbound] no supabase admin', err.message);
      return null;
    }
  })();

  if (!supabaseAdmin) {
    return NextResponse.json({ received: true }, { status: 200 });
  }

  // ───────────────────────────────────────────────────────────────────
  // 3.warmup) PEER-TO-PEER WARMUP — court-circuit prioritaire
  // ───────────────────────────────────────────────────────────────────
  // Si le `to` matche `warmup-{senderId}@reply.volia.fr`, c'est un email
  // de notre cron warmup peer-to-peer (cf /api/cron/process-warmup-peer).
  // On NE DOIT PAS l'auto-créer en CRM (ce n'est pas un vrai reply client) :
  // à la place, on update warmup_exchanges.replied_at + bump compteurs.
  if (toRaw && isInboundDomain(toDomain)) {
    const toSenderId = parsePeerEmailAddress(toRaw);
    const fromSenderId = parsePeerEmailAddress(from); // si auto-reply du peer

    if (toSenderId) {
      try {
        // Récup les peer rows pour from + to (le from peut être absent si
        // c'est un vrai humain qui a répondu par erreur à warmup-xxx)
        const { data: toPeer } = await supabaseAdmin
          .from('warmup_peer_pool')
          .select('id, sender_id')
          .eq('sender_id', toSenderId)
          .maybeSingle();

        let fromPeer = null;
        if (fromSenderId) {
          const { data } = await supabaseAdmin
            .from('warmup_peer_pool')
            .select('id, sender_id')
            .eq('sender_id', fromSenderId)
            .maybeSingle();
          fromPeer = data || null;
        }

        // Si on retrouve un exchange en cours (même from/to, pas encore replied),
        // on le marque replied_at = maintenant.
        if (fromPeer && toPeer) {
          const { data: pending } = await supabaseAdmin
            .from('warmup_exchanges')
            .select('id')
            .eq('from_peer_id', fromPeer.id)
            .eq('to_peer_id', toPeer.id)
            .is('replied_at', null)
            .order('sent_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          if (pending?.id) {
            await supabaseAdmin
              .from('warmup_exchanges')
              .update({ replied_at: new Date().toISOString() })
              .eq('id', pending.id);
            await supabaseAdmin.rpc('bump_warmup_peer_replied', { peer_id: toPeer.id });
          }
        }

        // Audit léger pour debug
        await supabaseAdmin.from('inbound_events').insert({
          user_id: null,
          channel: 'email',
          sender_id: null,
          from_email: from,
          from_phone: null,
          subject,
          body: typeof bodyText === 'string' ? bodyText.slice(0, 2000) : null,
          raw_payload: payload,
          processed_at: new Date().toISOString(),
          contact_id: null,
          deal_id: null,
        });
      } catch (e) {
        console.warn('[resend-inbound] warmup peer handling failed', e.message);
      }
      // Court-circuit : pas d'auto-create CRM, pas de matching campaign.
      return NextResponse.json({ received: true, warmup_peer: true }, { status: 200 });
    }
  }

  let senderRow = null;
  let ownerId = null;
  let matchedCampaignId = null;

  // 3.pre) STOP-ON-REPLY pour les séquences : si le `to` matche le format
  // séquence (s-{32hex}@reply.volia.fr), on identifie directement l'enrollment
  // et on stoppe les follow-ups si la séquence a stop_on_reply=true.
  let matchedSequenceEnrollmentId = null;
  if (toRaw && isInboundDomain(toDomain)) {
    const parsedEnrollmentId = parseSequenceReplyAddress(toRaw);
    if (parsedEnrollmentId) {
      try {
        const { data: enrollRow } = await supabaseAdmin
          .from('sequence_enrollments')
          .select('id, sequence_id, contact_id, status, sequence:email_sequences(owner_id, stop_on_reply, name)')
          .eq('id', parsedEnrollmentId)
          .maybeSingle();
        if (enrollRow?.sequence?.owner_id) {
          matchedSequenceEnrollmentId = enrollRow.id;
          ownerId = enrollRow.sequence.owner_id;
          // Stop-on-reply : on coupe les follow-ups de cet enrollment
          if (enrollRow.sequence.stop_on_reply && enrollRow.status === 'active') {
            await supabaseAdmin
              .from('sequence_enrollments')
              .update({ status: 'replied', replied_at: new Date().toISOString() })
              .eq('id', enrollRow.id);
          }
          // Trace replied_at sur le dernier email_send de cet enrollment
          // (sert au matching analytics du dashboard séquence).
          await supabaseAdmin
            .from('email_sends')
            .update({ replied_at: new Date().toISOString() })
            .eq('sequence_enrollment_id', enrollRow.id)
            .is('replied_at', null);
        }
      } catch (e) {
        console.warn('[resend-inbound] sequence enrollment lookup failed', e.message);
      }
    }
  }

  // 3a) PREMIER MATCH (le plus fiable) : parser le `to` pour extraire le
  // campaign_id encodé dans le local-part. Format défini par
  // lib/inbound-domain.js : `c-{32hex}@reply.volia.fr`. Cette méthode
  // est résistante aux clients mail qui strippent les headers In-Reply-To.
  if (!ownerId && toRaw && isInboundDomain(toDomain)) {
    const parsedCampaignId = parseCampaignReplyAddress(toRaw);
    if (parsedCampaignId) {
      try {
        const { data: camp } = await supabaseAdmin
          .from('email_campaigns')
          .select('id, owner_id, name, email_sender_id')
          .eq('id', parsedCampaignId)
          .maybeSingle();
        if (camp?.owner_id) {
          ownerId = camp.owner_id;
          matchedCampaignId = camp.id;
          // Si la campagne a un sender custom, on récupère aussi le sender row
          if (camp.email_sender_id) {
            const { data: s } = await supabaseAdmin
              .from('email_senders')
              .select('id, user_id, domain, status')
              .eq('id', camp.email_sender_id)
              .maybeSingle();
            if (s) senderRow = s;
          }
        }
      } catch (e) {
        console.warn('[resend-inbound] campaign-from-to lookup failed', e.message);
      }
    }
  }

  // 3b) FALLBACK : si on n'a pas réussi à matcher via le `to`, on retombe
  // sur l'ancienne logique (lookup sender par domaine `to`). Utile pour les
  // setups custom où le client a override `campaign.reply_to` avec son
  // propre domaine d'envoi.
  if (!ownerId) {
    try {
      if (toDomain) {
        const { data: sender, error } = await supabaseAdmin
          .from('email_senders')
          .select('id, user_id, domain, status')
          .ilike('domain', toDomain)
          .limit(1)
          .maybeSingle();
        if (error) {
          console.warn('[resend-inbound] sender lookup error', error.message);
        } else if (sender) {
          senderRow = sender;
          ownerId = sender.user_id;
        }
      }
    } catch (e) {
      console.warn('[resend-inbound] sender lookup exception', e.message);
    }
  }

  // 4) Retrouver le send originel — d'abord via le campaign_id matché + from,
  // puis (fallback) via in_reply_to → email_sends.provider_id.
  let originalSend = null;
  if (matchedCampaignId && from) {
    // Most reliable : on a déjà le campaign, on cherche le send pour cet
    // email destinataire (le `from` du reply = le `email` de notre send).
    try {
      const { data: send } = await supabaseAdmin
        .from('email_sends')
        .select('id, campaign_id, contact_id, email, provider_id')
        .eq('campaign_id', matchedCampaignId)
        .ilike('email', from)
        .order('sent_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (send) {
        originalSend = send;
        await supabaseAdmin
          .from('email_sends')
          .update({ replied_at: new Date().toISOString() })
          .eq('id', send.id);
      }
    } catch (e) {
      console.warn('[resend-inbound] send lookup by campaign+from failed', e.message);
    }
  }
  if (!originalSend && inReplyTo) {
    try {
      // Resend inclut souvent les chevrons <abcd@resend.dev>
      const cleanInReply = String(inReplyTo).replace(/[<>]/g, '').trim();
      const { data: send } = await supabaseAdmin
        .from('email_sends')
        .select('id, campaign_id, contact_id, email, provider_id')
        .eq('provider_id', cleanInReply)
        .limit(1)
        .maybeSingle();
      if (send) {
        originalSend = send;
        await supabaseAdmin
          .from('email_sends')
          .update({ replied_at: new Date().toISOString() })
          .eq('id', send.id);
        if (!ownerId && send.campaign_id) {
          const { data: camp } = await supabaseAdmin
            .from('email_campaigns')
            .select('owner_id')
            .eq('id', send.campaign_id)
            .maybeSingle();
          if (camp?.owner_id) ownerId = camp.owner_id;
        }
      }
    } catch (e) {
      console.warn('[resend-inbound] original send lookup error', e.message);
    }
  }

  // 5) Auto-create CRM (fire-and-forget)
  let autoResult = null;
  if (ownerId && from) {
    try {
      autoResult = await autoCreateFromReply({
        supabaseAdmin,
        ownerId,
        channel: 'email',
        from,
        body: bodyText,
        subject,
        replyToProviderId: originalSend?.provider_id || inReplyTo || null,
      });
    } catch (e) {
      console.error('[resend-inbound] autoCreate exception', e.message);
    }
  } else {
    console.warn('[resend-inbound] missing ownerId or from — skip auto-create', {
      hasOwner: !!ownerId,
      hasFrom: !!from,
      toDomain,
    });
  }

  // 6) Insert audit inbound_events
  try {
    await supabaseAdmin.from('inbound_events').insert({
      user_id: ownerId,
      channel: 'email',
      sender_id: senderRow?.id || null,
      from_email: from,
      from_phone: null,
      subject,
      body: typeof bodyText === 'string' ? bodyText.slice(0, 10000) : null,
      raw_payload: payload,
      processed_at: new Date().toISOString(),
      contact_id: autoResult?.contact_id || null,
      deal_id: autoResult?.deal_id || null,
    });
  } catch (e) {
    console.warn('[resend-inbound] inbound_events insert failed', e?.message);
  }

  return NextResponse.json(
    {
      received: true,
      processed: !!autoResult && !autoResult.error,
      contact_created: !!autoResult?.contact_created,
      deal_created: !!autoResult?.deal_created,
    },
    { status: 200 }
  );
}

// Resend test pings sometimes use GET
export async function GET() {
  return NextResponse.json({ ok: true, endpoint: 'resend-inbound' });
}
