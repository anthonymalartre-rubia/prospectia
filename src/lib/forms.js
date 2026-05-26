// ─────────────────────────────────────────────────────────────────
// src/lib/forms.js — Helpers Volia Formulaires
// ─────────────────────────────────────────────────────────────────
// Utilitaires partagés par les routes /api/admin/forms/* et (à venir)
// par le renderer public /f/[slug] (Sprint F2).
//
// Convention : tout helper qui touche la DB prend un client supabase
// en paramètre (jamais d'import direct). Permet d'utiliser soit le
// client RLS (utilisateur connecté), soit le client admin (renderer
// public via service_role).
// ─────────────────────────────────────────────────────────────────

/**
 * Slugifie une string FR-aware : remplace les diacritiques, normalise,
 * trim, lowercase, ne garde que [a-z0-9-], déduplique les tirets.
 *
 * @param {string} input
 * @returns {string}
 */
export function slugify(input) {
  const s = String(input || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip diacritiques
    .toLowerCase()
    .trim()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
  return s || 'form';
}

/**
 * Génère un slug unique en interrogeant la table forms.
 * Si le slug existe déjà, suffixe -2, -3, etc. jusqu'à dispo.
 *
 * @param {object} supabase - client Supabase (admin ou user)
 * @param {string} name - nom du form à slugifier
 * @param {string} [excludeId] - id du form à exclure (pour update)
 * @returns {Promise<string>}
 */
export async function generateUniqueSlug(supabase, name, excludeId = null) {
  const base = slugify(name);
  let candidate = base;
  let suffix = 1;

  // Limite de sécurité : on n'itère pas indéfiniment.
  for (let attempt = 0; attempt < 50; attempt++) {
    let query = supabase.from('forms').select('id').eq('slug', candidate).limit(1);
    if (excludeId) query = query.neq('id', excludeId);
    const { data, error } = await query;
    if (error) {
      // En cas d'erreur DB, on retourne un suffixe random pour ne pas bloquer.
      return `${base}-${Math.random().toString(36).slice(2, 8)}`;
    }
    if (!data || data.length === 0) {
      return candidate;
    }
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }
  // Fallback ultime : random suffix.
  return `${base}-${Math.random().toString(36).slice(2, 8)}`;
}

// ─── Validation du schema JSONB ──────────────────────────────────
// Le schema d'un form a la forme :
//   {
//     pages: [{ id, title?, description? }],
//     fields: [{ key, type, label, required?, page?, ... }],
//     theme?: { ... }
//   }
// Cette validation est volontairement permissive : on autorise schema
// vide (form qui vient d'être créé, builder à venir Sprint F3) mais
// dès qu'il y a des fields, on vérifie qu'ils sont bien-formés.

const ALLOWED_FIELD_TYPES = new Set([
  'text', 'email', 'tel', 'textarea', 'select', 'radio',
  'checkbox', 'number', 'date', 'file', 'rating', 'hidden',
]);

const FIELD_KEY_REGEX = /^[a-z][a-z0-9_]{0,63}$/;

/**
 * Valide un schema JSONB de form.
 * Retourne { valid: boolean, errors: string[] }.
 *
 * @param {any} schema
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateFormSchema(schema) {
  const errors = [];

  // Schema null/undefined → valide (form vide, draft initial)
  if (schema === null || schema === undefined) {
    return { valid: true, errors: [] };
  }

  if (typeof schema !== 'object' || Array.isArray(schema)) {
    return { valid: false, errors: ['schema doit être un objet JSON'] };
  }

  // Schema = {} → valide (form vide)
  const keys = Object.keys(schema);
  if (keys.length === 0) {
    return { valid: true, errors: [] };
  }

  // Pages (optionnel) — si présent doit être array
  if (schema.pages !== undefined) {
    if (!Array.isArray(schema.pages)) {
      errors.push('schema.pages doit être un array');
    } else {
      schema.pages.forEach((p, idx) => {
        if (!p || typeof p !== 'object') {
          errors.push(`schema.pages[${idx}] doit être un objet`);
        }
      });
    }
  }

  // Fields (optionnel) — si présent doit être array de fields valides
  if (schema.fields !== undefined) {
    if (!Array.isArray(schema.fields)) {
      errors.push('schema.fields doit être un array');
    } else {
      const seenKeys = new Set();
      schema.fields.forEach((f, idx) => {
        if (!f || typeof f !== 'object') {
          errors.push(`schema.fields[${idx}] doit être un objet`);
          return;
        }
        if (typeof f.key !== 'string' || !FIELD_KEY_REGEX.test(f.key)) {
          errors.push(`schema.fields[${idx}].key invalide (snake_case, max 64, doit commencer par une lettre)`);
        } else if (seenKeys.has(f.key)) {
          errors.push(`schema.fields[${idx}].key "${f.key}" est dupliquée`);
        } else {
          seenKeys.add(f.key);
        }
        if (!ALLOWED_FIELD_TYPES.has(f.type)) {
          errors.push(`schema.fields[${idx}].type "${f.type}" invalide (autorisés : ${[...ALLOWED_FIELD_TYPES].join(', ')})`);
        }
        if (typeof f.label !== 'string' || f.label.trim().length === 0) {
          errors.push(`schema.fields[${idx}].label requis`);
        }
      });
    }
  }

  // Theme (optionnel) — accepte tout objet
  if (schema.theme !== undefined && (typeof schema.theme !== 'object' || Array.isArray(schema.theme))) {
    errors.push('schema.theme doit être un objet');
  }

  return { valid: errors.length === 0, errors };
}

// ─── Incrémentation atomique via RPC ─────────────────────────────
// Wrappent les fonctions PG public.increment_form_view_count et
// public.increment_form_submission_count créées en migration.

/**
 * Incrémente atomiquement forms.view_count.
 * @param {object} supabase
 * @param {string} formId
 * @returns {Promise<{ ok: boolean, error?: string }>}
 */
export async function incrementViewCount(supabase, formId) {
  if (!supabase || !formId) return { ok: false, error: 'invalid args' };
  const { error } = await supabase.rpc('increment_form_view_count', { p_form_id: formId });
  if (error) {
    console.error('[forms] incrementViewCount RPC error', error);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

/**
 * Incrémente atomiquement forms.submission_count.
 * À appeler uniquement depuis un client admin (RPC gated service_role).
 * @param {object} supabaseAdmin
 * @param {string} formId
 * @returns {Promise<{ ok: boolean, error?: string }>}
 */
export async function incrementSubmissionCount(supabaseAdmin, formId) {
  if (!supabaseAdmin || !formId) return { ok: false, error: 'invalid args' };
  const { error } = await supabaseAdmin.rpc('increment_form_submission_count', { p_form_id: formId });
  if (error) {
    console.error('[forms] incrementSubmissionCount RPC error', error);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}
