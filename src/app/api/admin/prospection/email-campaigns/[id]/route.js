// GET /api/admin/prospection/email-campaigns/[id]    → détails + stats
// POST /api/admin/prospection/email-campaigns/[id]/send → lance l'envoi (queue toutes les lignes en pending)
// DELETE /api/admin/prospection/email-campaigns/[id]  → supprime (seulement si draft / paused)

import { NextResponse } from 'next/server';
import { requireCampagnesAccess } from '@/lib/campagnes-access-server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export async function GET(request, { params }) {
  const auth = await requireCampagnesAccess();
  if (auth instanceof NextResponse) return auth;
  const { user, supabase } = auth;
  const { id } = await params;

  const { data: campaign } = await supabase
    .from('email_campaigns')
    .select('*')
    .eq('id', id)
    .eq('owner_id', user.id)
    .maybeSingle();
  if (!campaign) return NextResponse.json({ error: 'Campagne introuvable' }, { status: 404 });

  // Liste des 50 derniers sends (échantillon pour debug)
  const { data: sends } = await supabase
    .from('email_sends')
    .select('id, email, status, error, provider_id, sent_at, delivered_at, opened_at, clicked_at, bounced_at, replied_at, subject_variant')
    .eq('campaign_id', id)
    .order('created_at', { ascending: false })
    .limit(50);

  const samples = sends || [];

  // ───────── Phase 2 — stats engagement & CRM ─────────
  // Replies totales pour cette campagne (count exact).
  let replies_count = 0;
  try {
    const { count } = await supabase
      .from('email_sends')
      .select('id', { count: 'exact', head: true })
      .eq('campaign_id', id)
      .not('replied_at', 'is', null);
    replies_count = count || 0;
  } catch (e) {
    console.warn('[email-campaigns/[id]] replies count error', e?.message);
  }

  // Auto-created deals pour cette campagne. On matche via
  // metadata->>'source_provider_id' qui correspond au provider_id des sends.
  // Optimisation : un seul query, on récupère tous les provider_ids des sends
  // de la campagne puis on filtre les deals auto-créés appartenant à l'owner.
  let auto_created_deals_count = 0;
  // Map provider_id → crm contact id (par email).
  const sendCrmContactByEmail = {};
  try {
    const { data: allSends } = await supabase
      .from('email_sends')
      .select('email, provider_id')
      .eq('campaign_id', id)
      .not('provider_id', 'is', null);

    const providerIds = (allSends || [])
      .map((s) => s.provider_id)
      .filter(Boolean);

    if (providerIds.length > 0) {
      // Batche par 200 pour éviter d'exploser la longueur d'URL côté PostgREST.
      // On somme les comptages.
      const BATCH = 200;
      let total = 0;
      for (let i = 0; i < providerIds.length; i += BATCH) {
        const chunk = providerIds.slice(i, i + BATCH);
        const { count } = await supabase
          .from('crm_deals')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .in('metadata->>source_provider_id', chunk);
        total += count || 0;
      }
      auto_created_deals_count = total;
    }

    // Mapping email → crm_contact_id pour le bouton "→ CRM" sur les samples.
    const sampleEmails = [
      ...new Set(samples.map((s) => (s.email || '').toLowerCase()).filter(Boolean)),
    ];
    if (sampleEmails.length > 0) {
      const { data: contactRows } = await supabase
        .from('crm_contacts')
        .select('id, email')
        .eq('user_id', user.id)
        .in('email', sampleEmails);
      for (const c of contactRows || []) {
        if (c.email) sendCrmContactByEmail[c.email.toLowerCase()] = c.id;
      }
    }
  } catch (e) {
    console.warn('[email-campaigns/[id]] CRM stats error', e?.message);
  }

  // Hydrate les sample sends avec crm_contact_id (null si pas de contact).
  const sample_sends = samples.map((s) => ({
    ...s,
    crm_contact_id: sendCrmContactByEmail[(s.email || '').toLowerCase()] || null,
  }));

  // ───────── A/B testing — stats par variant ─────────
  // Si la campagne a au moins subject_variant_2, on agrège opens/sent par variant.
  let ab_test = null;
  if (campaign.subject_variant_2) {
    try {
      const { data: variantRows } = await supabase
        .from('email_sends')
        .select('subject_variant, status, opened_at')
        .eq('campaign_id', id)
        .in('status', ['sent', 'delivered', 'opened', 'clicked', 'bounced', 'replied']);

      const agg = { 1: { sent: 0, opened: 0 }, 2: { sent: 0, opened: 0 } };
      if (campaign.subject_variant_3) agg[3] = { sent: 0, opened: 0 };
      for (const row of variantRows || []) {
        const v = row.subject_variant || 1;
        if (!agg[v]) agg[v] = { sent: 0, opened: 0 };
        agg[v].sent += 1;
        if (row.opened_at) agg[v].opened += 1;
      }

      const subjectByVariant = {
        1: campaign.subject,
        2: campaign.subject_variant_2,
        3: campaign.subject_variant_3,
      };
      const variants = Object.keys(agg)
        .map((k) => parseInt(k, 10))
        .sort((a, b) => a - b)
        .map((vid) => ({
          id: vid,
          subject: subjectByVariant[vid] || null,
          sent: agg[vid].sent,
          opened: agg[vid].opened,
          open_rate: agg[vid].sent > 0 ? agg[vid].opened / agg[vid].sent : 0,
        }));

      ab_test = {
        enabled: true,
        sample_size: campaign.ab_test_sample_size || 100,
        winner_variant: campaign.ab_test_winner_variant || null,
        picked_at: campaign.ab_test_picked_at || null,
        variants,
      };
    } catch (e) {
      console.warn('[email-campaigns/[id]] ab_test stats error', e?.message);
    }
  }

  return NextResponse.json({
    campaign,
    sample_sends,
    crm: {
      replies_count,
      auto_created_deals_count,
    },
    ab_test,
  });
}

export async function DELETE(request, { params }) {
  const auth = await requireCampagnesAccess();
  if (auth instanceof NextResponse) return auth;
  const { user, supabase } = auth;
  const { id } = await params;

  // Sécurité : ne pas pouvoir supprimer une campagne déjà partie
  const { data: c } = await supabase
    .from('email_campaigns').select('status').eq('id', id).eq('owner_id', user.id).maybeSingle();
  if (!c) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });
  if (['sending', 'sent'].includes(c.status)) {
    return NextResponse.json({ error: 'Impossible : campagne déjà envoyée. Vous pouvez la mettre en pause.' }, { status: 400 });
  }

  const { error } = await supabase.from('email_campaigns').delete().eq('id', id).eq('owner_id', user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
