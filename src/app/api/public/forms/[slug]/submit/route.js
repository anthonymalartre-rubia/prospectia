// ─────────────────────────────────────────────────────────────────────
// POST /api/public/forms/[slug]/submit (Sprint F2)
// ─────────────────────────────────────────────────────────────────────
// Endpoint public — pas d'auth utilisateur, body en multipart/form-data
// pour supporter les uploads file.
//
// Flow :
//   1. Slug lookup (service_role) → 404 si pas published
//   2. Honeypot check (champ "website" non vide = bot → 200 silencieux)
//   3. Rate limit IP (5 submissions / IP / 5 min)
//   4. Captcha (settings.captcha_enabled) — best-effort si pas configuré
//   5. Validation des answers contre le schema
//   6. Upload des fichiers vers Storage (bucket privé form-uploads)
//   7. INSERT form_responses + form_files
//   8. Increment submission_count (RPC)
//   9. Bridges CRM + Campagnes (best-effort try/catch)
//  10. Email notification admin (best-effort)
//
// Renvoie : 200 { success: true } | 4xx 5xx error
// ─────────────────────────────────────────────────────────────────────

import { NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { incrementSubmissionCount, schemaFieldsToRendererFields, normalizeSchema } from '@/lib/forms';
import { checkRateLimit } from '@/lib/rateLimit';
import { sendEmail } from '@/lib/email';
import { cleanEnv } from '@/lib/envClean';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Rate limit : 5 submissions / IP / 5 min
const SUBMIT_MAX = 5;
const SUBMIT_WINDOW_MS = 5 * 60 * 1000;

// Hard cap pour défense en profondeur (Storage bucket déjà limité à 10MB côté Supabase)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

function getClientIp(request) {
  const fwd = request.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return (
    request.headers.get('x-real-ip') ||
    request.headers.get('cf-connecting-ip') ||
    '127.0.0.1'
  );
}

function sha256(input) {
  return createHash('sha256').update(String(input || '')).digest('hex').slice(0, 32);
}

function normalizeEmail(v) {
  if (!v) return null;
  return String(v).trim().toLowerCase();
}

/**
 * Cherche dans les answers un email/name/phone/company à partir de field_keys
 * conventionnels (plusieurs alias acceptés).
 */
function extractContactInfo(answers, fields) {
  const lookup = (keys) => {
    for (const k of keys) {
      if (answers[k] != null && answers[k] !== '') return answers[k];
    }
    // Fallback : cherche un field de type 'email'/'tel' dans le schema
    return null;
  };

  let email = lookup(['email', 'mail', 'e_mail']);
  if (!email) {
    const emailField = (fields || []).find((f) => f.field_type === 'email');
    if (emailField) email = answers[emailField.field_key];
  }
  let phone = lookup(['phone', 'tel', 'telephone', 'mobile']);
  if (!phone) {
    const telField = (fields || []).find((f) => f.field_type === 'tel');
    if (telField) phone = answers[telField.field_key];
  }
  const name = lookup(['nom', 'name', 'full_name', 'fullname', 'prenom_nom']);
  const firstName = lookup(['prenom', 'first_name', 'firstname']);
  const lastName = lookup(['lastname', 'last_name']);
  const company = lookup(['company', 'societe', 'entreprise', 'organisation']);

  const composedName =
    name ||
    [firstName, lastName].filter(Boolean).join(' ').trim() ||
    null;

  return {
    email: normalizeEmail(email),
    phone: phone ? String(phone).trim() : null,
    name: composedName,
    firstName: firstName ? String(firstName).trim() : null,
    lastName: lastName ? String(lastName).trim() : null,
    company: company ? String(company).trim() : null,
  };
}

// Vérifie reCAPTCHA v2/v3 si secret configuré.
// Retourne true si OK (ou si skip parce que pas configuré), false sinon.
async function verifyCaptcha(token) {
  const secret = cleanEnv(process.env.RECAPTCHA_SECRET_KEY);
  if (!secret) {
    console.warn('[forms/submit] RECAPTCHA_SECRET_KEY not configured — skipping captcha');
    return true;
  }
  if (!token) return false;
  try {
    const res = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${encodeURIComponent(secret)}&response=${encodeURIComponent(token)}`,
    });
    const data = await res.json();
    return !!data.success;
  } catch (err) {
    console.error('[forms/submit] captcha verify error', err);
    return false;
  }
}

// ─── Bridge CRM ───────────────────────────────────────────────────────
async function bridgeCrm({ supabaseAdmin, ownerId, form, responseId, contactInfo }) {
  if (!form.crm_auto_create_contact) return { skipped: true };
  if (!contactInfo.email && !contactInfo.phone) {
    return { skipped: true, reason: 'no_email_or_phone' };
  }

  // Idempotence : on regarde si on a déjà créé un contact pour cette response.
  // On utilise crm_contacts.source_ref_id = response.id pour matcher.
  const { data: existingByRef } = await supabaseAdmin
    .from('crm_contacts')
    .select('id')
    .eq('user_id', ownerId)
    .eq('source_ref_id', responseId)
    .maybeSingle();

  if (existingByRef) {
    return { success: true, contactId: existingByRef.id, deduped: true };
  }

  // Upsert par email (si email présent) pour ne pas dupliquer le même prospect
  let existingContact = null;
  if (contactInfo.email) {
    const { data } = await supabaseAdmin
      .from('crm_contacts')
      .select('id, name, tags')
      .eq('user_id', ownerId)
      .ilike('email', contactInfo.email)
      .limit(1)
      .maybeSingle();
    existingContact = data;
  }

  let contactId;
  if (existingContact) {
    // Update minimal : on ne touche pas au name si déjà set
    contactId = existingContact.id;
  } else {
    const insertRow = {
      user_id: ownerId,
      name: contactInfo.name || contactInfo.email || contactInfo.phone || 'Contact form',
      email: contactInfo.email,
      phone: contactInfo.phone,
      company: contactInfo.company,
      source: 'form_volia',
      source_ref_id: responseId,
      tags: ['form'],
    };
    const { data: inserted, error } = await supabaseAdmin
      .from('crm_contacts')
      .insert(insertRow)
      .select('id')
      .single();
    if (error || !inserted) {
      throw new Error(`crm_insert: ${error?.message || 'unknown'}`);
    }
    contactId = inserted.id;
  }

  // Note : ajoute une activity (best-effort)
  try {
    await supabaseAdmin.from('crm_activities').insert({
      user_id: ownerId,
      contact_id: contactId,
      type: 'note',
      content: `Soumis via formulaire « ${form.name} »`,
      completed_at: new Date().toISOString(),
      metadata: {
        source: 'form_volia',
        form_id: form.id,
        form_slug: form.slug,
        form_response_id: responseId,
      },
    });
  } catch (e) {
    console.warn('[forms/submit] crm activity insert failed', e.message);
  }

  return { success: true, contactId };
}

// ─── Bridge Campagnes ──────────────────────────────────────────────────
async function bridgeCampagnes({ supabaseAdmin, ownerId, form, contactInfo }) {
  if (!form.campagnes_list_id) return { skipped: true };
  if (!contactInfo.email && !contactInfo.phone) {
    return { skipped: true, reason: 'no_email_or_phone' };
  }

  // Vérifier que la liste appartient toujours à l'owner (la FK est SET NULL,
  // donc si la liste a été supprimée campagnes_list_id devient null — mais
  // on a notre fetch d'avant qui le confirme).
  // Check anti-doublon : (list_id, email) déjà présent ?
  if (contactInfo.email) {
    const { data: existing } = await supabaseAdmin
      .from('prospect_contacts')
      .select('id')
      .eq('list_id', form.campagnes_list_id)
      .ilike('email', contactInfo.email)
      .limit(1)
      .maybeSingle();
    if (existing) {
      return { success: true, contactId: existing.id, deduped: true };
    }
  }

  const insertRow = {
    list_id: form.campagnes_list_id,
    email: contactInfo.email,
    phone: contactInfo.phone,
    first_name: contactInfo.firstName,
    last_name: contactInfo.lastName,
    company: contactInfo.company,
    custom_fields: {
      source: 'form_volia',
      form_id: form.id,
      form_slug: form.slug,
    },
  };
  const { data: inserted, error } = await supabaseAdmin
    .from('prospect_contacts')
    .insert(insertRow)
    .select('id')
    .single();
  if (error || !inserted) {
    throw new Error(`campagnes_insert: ${error?.message || 'unknown'}`);
  }

  // Bump contacts_count + email_count sur la liste (best-effort)
  try {
    await supabaseAdmin.rpc('increment_list_contacts_count', {
      p_list_id: form.campagnes_list_id,
    });
  } catch {} // RPC peut ne pas exister — on ignore

  return { success: true, contactId: inserted.id };
}

// ─── Email notification admin ──────────────────────────────────────────
async function notifyAdmin({ form, responseId, answers, ownerEmail }) {
  const notifyTo = form.settings?.notify_email || ownerEmail;
  if (!notifyTo) return { skipped: true };

  const rows = Object.entries(answers || {})
    .filter(([k]) => !k.startsWith('_') && k !== 'website')
    .map(([k, v]) => {
      const val = Array.isArray(v) ? v.join(', ') : String(v ?? '');
      return `<tr><td style="padding:6px 12px;border-bottom:1px solid #eee;color:#555;font-weight:600;">${k}</td><td style="padding:6px 12px;border-bottom:1px solid #eee;">${val.slice(0, 500)}</td></tr>`;
    })
    .join('');

  const baseUrl = cleanEnv(process.env.NEXT_PUBLIC_APP_URL) || 'https://volia.fr';
  const html = `
    <div style="font-family:-apple-system,Segoe UI,sans-serif;max-width:600px;margin:0 auto;color:#222;">
      <h2 style="color:#db2777;">Nouvelle soumission : ${form.name}</h2>
      <p style="color:#666;font-size:14px;">Reçue à ${new Date().toLocaleString('fr-FR')}.</p>
      <table style="width:100%;border-collapse:collapse;margin-top:16px;background:#fafafa;border-radius:8px;overflow:hidden;">
        ${rows || '<tr><td style="padding:12px;color:#999;">Aucune réponse renseignée.</td></tr>'}
      </table>
      <p style="margin-top:24px;">
        <a href="${baseUrl}/admin/forms/${form.id}/responses" style="display:inline-block;padding:10px 20px;background:#db2777;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">
          Voir toutes les réponses
        </a>
      </p>
      <p style="margin-top:24px;color:#999;font-size:11px;">
        Propulsé par <a href="https://volia.fr" style="color:#db2777;">Volia</a> · response #${responseId.slice(0, 8)}
      </p>
    </div>`;

  try {
    await sendEmail({
      to: notifyTo,
      subject: `Nouvelle soumission : ${form.name}`,
      html,
    });
  } catch (e) {
    console.warn('[forms/submit] notify email failed', e.message);
  }
  return { success: true };
}

// ─── Handler ──────────────────────────────────────────────────────────
export async function POST(request, { params }) {
  const { slug } = await params;
  const supabaseAdmin = getSupabaseAdmin();

  // ──── 1. Rate limit (IP only — empêche flood d'un même origin) ────
  const ip = getClientIp(request);
  const rlKey = `form-submit:${ip}:${slug}`;
  const rl = checkRateLimit(rlKey, SUBMIT_MAX, SUBMIT_WINDOW_MS);
  if (!rl.success) {
    return NextResponse.json(
      { success: false, error: 'Trop de soumissions. Réessayez dans quelques minutes.' },
      { status: 429 }
    );
  }

  // ──── 2. Fetch form (Sprint F3 — source of truth = schema JSONB) ────
  const { data: formRow, error: formError } = await supabaseAdmin
    .from('forms')
    .select(
      `id, slug, name, status, user_id, schema, settings,
       crm_auto_create_contact, campagnes_list_id`
    )
    .eq('slug', slug)
    .maybeSingle();

  if (formError) {
    console.error('[forms/submit] form lookup error', formError);
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
  if (!formRow || formRow.status !== 'published') {
    return NextResponse.json({ success: false, error: 'Formulaire introuvable' }, { status: 404 });
  }

  // Aplatit schema.fields[] (shape builder : key/type/page_id) en shape
  // historique (field_key/field_type/page) pour le reste du handler.
  const schema = normalizeSchema(formRow.schema);
  const flatFields = schemaFieldsToRendererFields(schema);
  const form = { ...formRow, fields: flatFields };

  // ──── 3. Parse body (FormData) ────
  let formData;
  try {
    formData = await request.formData();
  } catch (err) {
    return NextResponse.json({ success: false, error: 'Corps de requête invalide' }, { status: 400 });
  }

  // ──── 4. Honeypot ────
  const honeypot = formData.get('website');
  if (honeypot && String(honeypot).trim().length > 0) {
    // Bot détecté — on répond 200 silencieusement (ne pas révéler le piège)
    return NextResponse.json({ success: true });
  }

  // ──── 5. Captcha (optionnel) ────
  if (form.settings?.captcha_enabled) {
    const token = formData.get('g-recaptcha-response') || formData.get('captcha_token');
    const captchaOk = await verifyCaptcha(token);
    if (!captchaOk) {
      return NextResponse.json({ success: false, error: 'Captcha invalide' }, { status: 400 });
    }
  }

  // ──── 6. Parse answers + collect files ────
  const answers = {};
  const filesToUpload = []; // { fieldKey, file }
  const completionTimeMs = parseInt(formData.get('_completion_time_ms') || '0', 10) || null;

  for (const [key, value] of formData.entries()) {
    if (key === 'website' || key === '_completion_time_ms' || key === 'g-recaptcha-response' || key === 'captcha_token') {
      continue;
    }
    if (key.startsWith('file:')) {
      const fieldKey = key.slice(5);
      if (value && typeof value === 'object' && 'size' in value) {
        if (value.size > MAX_FILE_SIZE) {
          return NextResponse.json(
            { success: false, error: `Fichier trop volumineux (max 10 Mo) : ${fieldKey}` },
            { status: 400 }
          );
        }
        if (value.size > 0) {
          filesToUpload.push({ fieldKey, file: value });
          answers[fieldKey] = { _pending_file: true, name: value.name };
        }
      }
      continue;
    }
    if (typeof value === 'string') {
      // Tentative JSON parse pour les arrays (checkbox multi)
      if (value.startsWith('[') || value.startsWith('{')) {
        try {
          answers[key] = JSON.parse(value);
          continue;
        } catch {}
      }
      if (value === 'true') answers[key] = true;
      else if (value === 'false') answers[key] = false;
      else answers[key] = value;
    }
  }

  // ──── 7. Server-side validation ────
  const fields = Array.isArray(form.fields) ? form.fields : [];
  for (const f of fields) {
    const v = answers[f.field_key];
    const isEmpty = v == null || v === '' || (Array.isArray(v) && v.length === 0);
    if (f.required && isEmpty) {
      return NextResponse.json(
        { success: false, error: `Champ requis manquant : ${f.label}` },
        { status: 400 }
      );
    }
    if (!isEmpty && f.field_type === 'email' && typeof v === 'string') {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
        return NextResponse.json(
          { success: false, error: `Email invalide : ${f.label}` },
          { status: 400 }
        );
      }
    }
    if (!isEmpty && f.validation?.maxLength && typeof v === 'string' && v.length > f.validation.maxLength) {
      return NextResponse.json(
        { success: false, error: `Trop long : ${f.label}` },
        { status: 400 }
      );
    }
  }

  // ──── 8. INSERT form_response (placeholder, fichiers upload après) ────
  const userAgent = request.headers.get('user-agent') || '';
  const referer = request.headers.get('referer') || '';
  const metadata = {
    ip_hash: sha256(ip),
    ua_hash: sha256(userAgent),
    ua: userAgent.slice(0, 250),
    referer: referer.slice(0, 500),
    completion_time_ms: completionTimeMs,
  };

  const { data: response, error: respError } = await supabaseAdmin
    .from('form_responses')
    .insert({
      form_id: form.id,
      user_id: form.user_id, // copie de l'owner pour les RLS admin
      answers,
      metadata,
      bridge_status: 'pending',
    })
    .select('id')
    .single();

  if (respError || !response) {
    console.error('[forms/submit] response insert error', respError);
    return NextResponse.json({ success: false, error: 'Impossible d\'enregistrer la réponse' }, { status: 500 });
  }
  const responseId = response.id;

  // ──── 9. Upload fichiers vers Storage + INSERT form_files ────
  if (filesToUpload.length > 0) {
    for (const { fieldKey, file } of filesToUpload) {
      try {
        const safeName = String(file.name || 'file').replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 100);
        const storagePath = `${form.id}/${responseId}/${fieldKey}/${Date.now()}_${safeName}`;
        const arrayBuffer = await file.arrayBuffer();
        const { error: upErr } = await supabaseAdmin.storage
          .from('form-uploads')
          .upload(storagePath, Buffer.from(arrayBuffer), {
            contentType: file.type || 'application/octet-stream',
            upsert: false,
          });
        if (upErr) {
          console.warn('[forms/submit] file upload failed', upErr.message);
          continue;
        }
        await supabaseAdmin.from('form_files').insert({
          form_response_id: responseId,
          field_key: fieldKey,
          file_name: file.name || 'file',
          file_size: file.size,
          mime_type: file.type || 'application/octet-stream',
          storage_path: storagePath,
        });
        // Update answer avec la storage_path
        answers[fieldKey] = {
          _file: true,
          name: file.name,
          size: file.size,
          mime_type: file.type,
          storage_path: storagePath,
        };
      } catch (e) {
        console.warn('[forms/submit] file processing exception', e.message);
      }
    }
    // Update answers avec les paths storage
    await supabaseAdmin
      .from('form_responses')
      .update({ answers })
      .eq('id', responseId);
  }

  // ──── 10. Increment submission_count (RPC) ────
  await incrementSubmissionCount(supabaseAdmin, form.id);

  // ──── 11. Bridges (best-effort try/catch) ────
  const contactInfo = extractContactInfo(answers, fields);
  let bridgeStatus = 'skipped';
  let bridgeError = null;
  let crmContactId = null;
  let campagnesContactId = null;

  const hasBridges = form.crm_auto_create_contact || form.campagnes_list_id;
  if (hasBridges) {
    const results = { crm: null, campagnes: null };
    let crmOk = !form.crm_auto_create_contact;
    let campOk = !form.campagnes_list_id;

    if (form.crm_auto_create_contact) {
      try {
        const r = await bridgeCrm({
          supabaseAdmin,
          ownerId: form.user_id,
          form,
          responseId,
          contactInfo,
        });
        results.crm = r.skipped ? 'skipped' : 'ok';
        if (r.contactId) crmContactId = r.contactId;
        crmOk = true;
      } catch (e) {
        console.error('[forms/submit] CRM bridge failed', e);
        results.crm = `error: ${e.message}`;
        crmOk = false;
      }
    }
    if (form.campagnes_list_id) {
      try {
        const r = await bridgeCampagnes({
          supabaseAdmin,
          ownerId: form.user_id,
          form,
          contactInfo,
        });
        results.campagnes = r.skipped ? 'skipped' : 'ok';
        if (r.contactId) campagnesContactId = r.contactId;
        campOk = true;
      } catch (e) {
        console.error('[forms/submit] Campagnes bridge failed', e);
        results.campagnes = `error: ${e.message}`;
        campOk = false;
      }
    }

    if (crmOk && campOk) {
      bridgeStatus = 'succeeded';
    } else {
      bridgeStatus = 'failed';
      bridgeError = JSON.stringify(results);
    }
  }

  // Update bridge status + ids
  await supabaseAdmin
    .from('form_responses')
    .update({
      bridge_status: bridgeStatus,
      bridge_error: bridgeError,
      crm_contact_id: crmContactId,
      campagnes_contact_id: campagnesContactId,
    })
    .eq('id', responseId);

  // ──── 12. Notification email admin (best-effort) ────
  if (form.settings?.notify_email || (form.settings && form.settings.notify_owner)) {
    // Récupère l'email owner si notify_owner=true
    let ownerEmail = null;
    if (form.settings.notify_owner && !form.settings.notify_email) {
      try {
        const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(form.user_id);
        ownerEmail = user?.email || null;
      } catch {}
    }
    try {
      await notifyAdmin({ form, responseId, answers, ownerEmail });
    } catch (e) {
      console.warn('[forms/submit] notify failed', e.message);
    }
  }

  return NextResponse.json({
    success: true,
    response_id: responseId,
    bridge_status: bridgeStatus,
  });
}
