'use client';

// ─────────────────────────────────────────────────────────────────────
// FormRenderer — Client component pour /f/[slug] (Sprint F2)
// ─────────────────────────────────────────────────────────────────────
// Render dynamique des form_fields :
//   - text, email, tel, textarea, select, radio, checkbox, number, date,
//     file, rating, hidden
//   - Validation client : required, validation.regex, min/max length, min/max
//   - Logique conditionnelle (conditional_logic.show_if = {field_key, operator, value})
//     operators : equals, not_equals, contains, is_empty, is_not_empty
//   - Multi-step si schema.pages.length > 1 (progress bar + navigation)
//   - Honeypot caché "website"
//   - Submit POST FormData → /api/public/forms/[slug]/submit
//   - Success state custom (settings.success_message) ou défaut
//   - Redirection auto si settings.redirect_url
//
// Style : ultra-discret, focus pink Volia, plein écran responsive.
// Aucune dépendance lourde (pas de react-hook-form, pas de zod).
// ─────────────────────────────────────────────────────────────────────

import { useEffect, useMemo, useState, useRef } from 'react';
import { Loader2, ChevronLeft, ChevronRight, CheckCircle2, AlertCircle, Star, Upload, Check } from 'lucide-react';
import {
  evaluateConditionalLogic,
  evaluateCondition,
} from '@/lib/forms';

const DEFAULT_SUCCESS = 'Merci pour votre soumission !';

function isFieldVisible(field, answers) {
  // Utilise le helper centralisé (gère AND/OR + tous les 13 opérateurs F4)
  return evaluateConditionalLogic(field.conditional_logic, answers);
}

function validateField(field, value) {
  const errors = [];
  const isEmpty = value == null || value === '' || (Array.isArray(value) && value.length === 0);

  if (field.required && isEmpty && field.field_type !== 'hidden') {
    errors.push('Ce champ est requis');
    return errors;
  }
  if (isEmpty) return errors;

  const v = field.validation || {};
  const strVal = String(value);

  if (field.field_type === 'email') {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(strVal)) {
      errors.push('Email invalide');
    }
  }
  if (field.field_type === 'tel') {
    if (!/^[+\d\s().-]{6,}$/.test(strVal)) {
      errors.push('Numéro invalide');
    }
  }
  if (field.field_type === 'number') {
    const n = Number(strVal);
    if (Number.isNaN(n)) errors.push('Nombre invalide');
    else {
      if (v.min !== undefined && n < Number(v.min)) errors.push(`Minimum : ${v.min}`);
      if (v.max !== undefined && n > Number(v.max)) errors.push(`Maximum : ${v.max}`);
    }
  }
  if (typeof v.minLength === 'number' && strVal.length < v.minLength) {
    errors.push(`Minimum ${v.minLength} caractères`);
  }
  if (typeof v.maxLength === 'number' && strVal.length > v.maxLength) {
    errors.push(`Maximum ${v.maxLength} caractères`);
  }
  if (typeof v.regex === 'string' && v.regex.length > 0) {
    try {
      const re = new RegExp(v.regex);
      if (!re.test(strVal)) errors.push(v.regexMessage || 'Format invalide');
    } catch {}
  }
  return errors;
}

function FieldRenderer({ field, value, onChange, error }) {
  const baseInput =
    'w-full px-4 py-3 rounded-xl bg-white border border-zinc-200 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-pink-500/40 focus:border-pink-500 transition-colors';
  const errorRing = error ? 'border-rose-400 focus:ring-rose-500/40 focus:border-rose-500' : '';
  const inputCls = `${baseInput} ${errorRing}`;

  const id = `field_${field.field_key}`;

  if (field.field_type === 'hidden') {
    return <input type="hidden" name={field.field_key} value={value || ''} />;
  }

  if (field.field_type === 'textarea') {
    return (
      <textarea
        id={id}
        name={field.field_key}
        rows={5}
        placeholder={field.placeholder || ''}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className={inputCls}
        required={field.required}
      />
    );
  }

  if (field.field_type === 'select') {
    const opts = Array.isArray(field.options) ? field.options : [];
    return (
      <select
        id={id}
        name={field.field_key}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className={inputCls}
        required={field.required}
      >
        <option value="">— Choisir —</option>
        {opts.map((opt, i) => {
          const ov = typeof opt === 'object' ? (opt.value ?? opt.label) : opt;
          const ol = typeof opt === 'object' ? (opt.label ?? opt.value) : opt;
          return <option key={i} value={ov}>{ol}</option>;
        })}
      </select>
    );
  }

  if (field.field_type === 'radio') {
    const opts = Array.isArray(field.options) ? field.options : [];
    return (
      <div className="space-y-2">
        {opts.map((opt, i) => {
          const ov = typeof opt === 'object' ? (opt.value ?? opt.label) : opt;
          const ol = typeof opt === 'object' ? (opt.label ?? opt.value) : opt;
          const selected = String(value || '') === String(ov);
          return (
            <label
              key={i}
              className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                selected
                  ? 'bg-pink-50 border-pink-300'
                  : 'bg-white border-zinc-200 hover:border-zinc-300'
              }`}
            >
              <input
                type="radio"
                name={field.field_key}
                value={ov}
                checked={selected}
                onChange={() => onChange(ov)}
                className="accent-pink-600"
                required={field.required}
              />
              <span className="text-sm text-zinc-800">{ol}</span>
            </label>
          );
        })}
      </div>
    );
  }

  if (field.field_type === 'checkbox') {
    // 2 modes : si options[] → multi-checkbox (value = array)
    //           sinon → boolean unique (consentement)
    const opts = Array.isArray(field.options) ? field.options : [];
    if (opts.length === 0) {
      return (
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={!!value}
            onChange={(e) => onChange(e.target.checked)}
            className="mt-1 accent-pink-600"
            required={field.required}
          />
          <span className="text-sm text-zinc-700">{field.label}</span>
        </label>
      );
    }
    const arrVal = Array.isArray(value) ? value : [];
    return (
      <div className="space-y-2">
        {opts.map((opt, i) => {
          const ov = typeof opt === 'object' ? (opt.value ?? opt.label) : opt;
          const ol = typeof opt === 'object' ? (opt.label ?? opt.value) : opt;
          const checked = arrVal.includes(ov);
          return (
            <label
              key={i}
              className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                checked ? 'bg-pink-50 border-pink-300' : 'bg-white border-zinc-200 hover:border-zinc-300'
              }`}
            >
              <input
                type="checkbox"
                value={ov}
                checked={checked}
                onChange={(e) => {
                  const next = e.target.checked
                    ? [...arrVal, ov]
                    : arrVal.filter((x) => x !== ov);
                  onChange(next);
                }}
                className="accent-pink-600"
              />
              <span className="text-sm text-zinc-800">{ol}</span>
            </label>
          );
        })}
      </div>
    );
  }

  if (field.field_type === 'file') {
    return (
      <label className="block">
        <div className="flex items-center gap-3 p-4 rounded-xl border-2 border-dashed border-zinc-300 bg-zinc-50 hover:border-pink-300 hover:bg-pink-50/30 transition-colors cursor-pointer">
          <Upload size={18} className="text-zinc-400" />
          <span className="text-sm text-zinc-600">
            {value && value.name ? value.name : 'Choisir un fichier (max 10 Mo)'}
          </span>
        </div>
        <input
          id={id}
          name={field.field_key}
          type="file"
          className="sr-only"
          onChange={(e) => onChange(e.target.files?.[0] || null)}
          required={field.required}
        />
      </label>
    );
  }

  if (field.field_type === 'rating') {
    const max = field.validation?.max || 5;
    const current = Number(value) || 0;
    return (
      <div className="flex items-center gap-1.5">
        {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className="p-1 transition-transform active:scale-90"
            aria-label={`${n} étoile${n > 1 ? 's' : ''}`}
          >
            <Star
              size={28}
              className={n <= current ? 'fill-amber-400 text-amber-400' : 'text-zinc-300'}
            />
          </button>
        ))}
      </div>
    );
  }

  if (field.field_type === 'date') {
    return (
      <input
        id={id}
        name={field.field_key}
        type="date"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className={inputCls}
        required={field.required}
      />
    );
  }

  // text / email / tel / number (default)
  const inputType =
    field.field_type === 'email'
      ? 'email'
      : field.field_type === 'tel'
      ? 'tel'
      : field.field_type === 'number'
      ? 'number'
      : 'text';

  return (
    <input
      id={id}
      name={field.field_key}
      type={inputType}
      placeholder={field.placeholder || ''}
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      className={inputCls}
      required={field.required}
      min={field.validation?.min}
      max={field.validation?.max}
      minLength={field.validation?.minLength}
      maxLength={field.validation?.maxLength}
    />
  );
}

export default function FormRenderer({ form, slug, isEmbed = false }) {
  const settings = form.settings || {};
  const schema = form.schema || {};
  const pages = Array.isArray(schema.pages) && schema.pages.length > 0
    ? [...schema.pages].sort((a, b) => (a.position || 0) - (b.position || 0))
    : [{ id: 'page-1', title: form.name, position: 0 }];
  const allFields = useMemo(
    () => (Array.isArray(form.fields) ? form.fields : []),
    [form.fields]
  );

  const [currentPage, setCurrentPage] = useState(0);
  const [answers, setAnswers] = useState({});
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [direction, setDirection] = useState('forward'); // forward | backward — pour transitions
  const [pageAnnouncement, setPageAnnouncement] = useState('');
  const [completedPages, setCompletedPages] = useState(() => new Set());
  const startedAtRef = useRef(Date.now());
  const formContainerRef = useRef(null);

  const isMultiStep = pages.length > 1;
  const pageNumber = currentPage + 1;

  // Helper : compare field.page vs page identifier — supporte page_id (F4)
  // ou page numéro (legacy F2/F3). Mappe en utilisant l'index.
  function fieldsOnPage(pageIdx) {
    const pageObj = pages[pageIdx];
    const pageId = pageObj?.id;
    const pageNum = pageIdx + 1;
    return allFields.filter((f) => {
      if (f.page_id && pageId) return f.page_id === pageId;
      return (f.page || 1) === pageNum || f.page === pageId;
    });
  }

  // Filtre les fields visibles à la page courante (avec logique conditionnelle)
  const visibleFields = fieldsOnPage(currentPage).filter((f) => isFieldVisible(f, answers));

  function updateAnswer(key, val) {
    setAnswers((prev) => ({ ...prev, [key]: val }));
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  }

  function validatePage(pageIdx) {
    const pageFields = fieldsOnPage(pageIdx).filter((f) => isFieldVisible(f, answers));
    const next = {};
    let ok = true;
    for (const f of pageFields) {
      const errs = validateField(f, answers[f.field_key]);
      if (errs.length > 0) {
        next[f.field_key] = errs[0];
        ok = false;
      }
    }
    setErrors(next);
    return ok;
  }

  // Page complete = pas d'erreurs sur les fields required visibles
  function isPageComplete(pageIdx) {
    const pageFields = fieldsOnPage(pageIdx).filter((f) => isFieldVisible(f, answers));
    for (const f of pageFields) {
      if (validateField(f, answers[f.field_key]).length > 0) return false;
    }
    return true;
  }

  // ─── Jump logic engine (F4) ───────────────────────────────────────
  // Retourne le pageIdx cible (ou 'submit' pour direct submit, ou null si pas de jump)
  function evaluateJumpLogicForPage(pageIdx) {
    const pageObj = pages[pageIdx];
    const rules = pageObj?.jump_logic?.rules;
    if (!Array.isArray(rules) || rules.length === 0) return null;
    for (const rule of rules) {
      if (rule.action !== 'skip_to_page') continue;
      if (evaluateCondition(rule.condition, answers)) {
        if (rule.target_page_id === 'submit') return 'submit';
        const targetIdx = pages.findIndex((p) => p.id === rule.target_page_id);
        if (targetIdx > pageIdx) return targetIdx;
      }
    }
    return null;
  }

  function navigateToPage(nextIdx, dir = 'forward') {
    setDirection(dir);
    setCurrentPage(nextIdx);
    const p = pages[nextIdx];
    setPageAnnouncement(
      `Page ${nextIdx + 1} sur ${pages.length}${p?.title ? ` : ${p.title}` : ''}`
    );
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  function goNext() {
    if (!validatePage(currentPage)) return;
    setCompletedPages((prev) => {
      const next = new Set(prev);
      next.add(currentPage);
      return next;
    });
    // Jump logic
    const jumpTarget = evaluateJumpLogicForPage(currentPage);
    if (jumpTarget === 'submit') {
      // Trigger submit
      const formEl = formContainerRef.current?.querySelector('form');
      if (formEl) {
        formEl.requestSubmit ? formEl.requestSubmit() : formEl.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
      }
      return;
    }
    if (typeof jumpTarget === 'number') {
      navigateToPage(jumpTarget, 'forward');
      return;
    }
    if (currentPage < pages.length - 1) {
      navigateToPage(currentPage + 1, 'forward');
    }
  }

  function goPrev() {
    if (currentPage > 0) navigateToPage(currentPage - 1, 'backward');
  }

  // Click sur un segment de la progress bar : navigue (uniquement vers pages déjà visitées/complétées)
  function jumpToSegment(targetIdx) {
    if (targetIdx === currentPage) return;
    if (targetIdx < currentPage || completedPages.has(targetIdx)) {
      navigateToPage(targetIdx, targetIdx < currentPage ? 'backward' : 'forward');
    }
  }

  // Auto-focus du 1er input non rempli au changement de page
  useEffect(() => {
    if (!isMultiStep) return;
    const tid = setTimeout(() => {
      const root = formContainerRef.current;
      if (!root) return;
      // Cherche le 1er input/select/textarea non rempli
      const inputs = root.querySelectorAll(
        'input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]):not([readonly]), select, textarea'
      );
      for (const el of inputs) {
        if (!el.value || el.value === '') {
          try { el.focus({ preventScroll: true }); } catch { el.focus(); }
          return;
        }
      }
    }, 280); // après la transition slide
    return () => clearTimeout(tid);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (submitting) return;

    // Validation finale : toutes les pages
    let allOk = true;
    const allErrors = {};
    for (let i = 0; i < pages.length; i++) {
      const pageFields = fieldsOnPage(i).filter((f) => isFieldVisible(f, answers));
      for (const f of pageFields) {
        const errs = validateField(f, answers[f.field_key]);
        if (errs.length > 0) {
          allErrors[f.field_key] = errs[0];
          allOk = false;
        }
      }
    }
    if (!allOk) {
      setErrors(allErrors);
      // Saute à la 1ère page contenant une erreur
      for (let i = 0; i < pages.length; i++) {
        const has = fieldsOnPage(i).some((f) => allErrors[f.field_key]);
        if (has) {
          navigateToPage(i, 'backward');
          break;
        }
      }
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const fd = new FormData();
      // Honeypot (champ caché — si rempli par un bot, le backend rejette)
      fd.append('website', e.target.elements?.website?.value || '');
      // Completion time (ms) → metadata utile pour anti-bot serveur
      fd.append('_completion_time_ms', String(Date.now() - startedAtRef.current));
      // Toutes les answers
      for (const [k, v] of Object.entries(answers)) {
        if (v == null) continue;
        if (v instanceof File) {
          fd.append(`file:${k}`, v);
        } else if (Array.isArray(v)) {
          fd.append(k, JSON.stringify(v));
        } else if (typeof v === 'boolean') {
          fd.append(k, v ? 'true' : 'false');
        } else {
          fd.append(k, String(v));
        }
      }

      const res = await fetch(`/api/public/forms/${slug}/submit`, {
        method: 'POST',
        body: fd,
      });
      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setSubmitError(json.error || `Erreur ${res.status}`);
        setSubmitting(false);
        return;
      }

      setSubmitted(true);
      setSubmitting(false);

      if (settings.redirect_url && /^https?:\/\//.test(settings.redirect_url)) {
        // Délai léger pour laisser voir le success state
        setTimeout(() => {
          window.location.href = settings.redirect_url;
        }, 800);
      }
    } catch (err) {
      console.error('[FormRenderer] submit failed', err);
      setSubmitError(err.message || 'Erreur réseau');
      setSubmitting(false);
    }
  }

  function resetForm() {
    setAnswers({});
    setErrors({});
    setSubmitted(false);
    setSubmitError(null);
    setCurrentPage(0);
    startedAtRef.current = Date.now();
  }

  // ───── Success state ─────
  if (submitted) {
    return (
      <div
        className={`rounded-2xl ${
          isEmbed ? 'bg-transparent border-0' : 'bg-white border border-zinc-200 shadow-sm'
        } p-8 sm:p-10 text-center`}
      >
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 mb-4">
          <CheckCircle2 size={28} />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 mb-2">
          {settings.success_title || 'Soumission reçue'}
        </h2>
        <p className="text-sm text-zinc-600 max-w-md mx-auto">
          {settings.success_message || DEFAULT_SUCCESS}
        </p>
        {settings.redirect_url ? (
          <p className="mt-4 text-xs text-zinc-400">Redirection en cours…</p>
        ) : (
          <button
            type="button"
            onClick={resetForm}
            className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-sm font-medium transition-colors"
          >
            Soumettre une autre réponse
          </button>
        )}
      </div>
    );
  }

  // ───── Form ─────
  return (
    <form
      ref={formContainerRef}
      onSubmit={handleSubmit}
      noValidate
      className={`rounded-2xl ${
        isEmbed ? 'bg-transparent border-0 p-0' : 'bg-white border border-zinc-200 shadow-sm p-6 sm:p-8'
      }`}
    >
      {/* Aria-live region (annonces a11y multi-step) — F4 */}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {pageAnnouncement}
      </div>

      {/* Honeypot (caché en CSS, jamais montré) */}
      <div style={{ position: 'absolute', left: '-9999px', height: 0, overflow: 'hidden' }} aria-hidden="true">
        <label htmlFor="website">Ne pas remplir</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight">
          {form.name}
        </h1>
        {form.description && (
          <p className="mt-2 text-sm text-zinc-600 leading-relaxed">{form.description}</p>
        )}
      </div>

      {/* Progress bar segmentée (F4) */}
      {isMultiStep && (
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs text-zinc-500 mb-2">
            <span aria-live="polite">
              Étape {pageNumber} sur {pages.length}
              {pages[currentPage]?.title ? ` — ${pages[currentPage].title}` : ''}
            </span>
            <span>{Math.round((pageNumber / pages.length) * 100)}%</span>
          </div>
          <div
            className="flex items-center gap-1"
            role="tablist"
            aria-label="Étapes du formulaire"
          >
            {pages.map((p, i) => {
              const isCurrent = i === currentPage;
              const isCompleted = completedPages.has(i) && isPageComplete(i);
              const isVisited = i < currentPage || completedPages.has(i);
              const isClickable = i < currentPage || completedPages.has(i);
              const baseCls = 'h-1.5 flex-1 rounded-full transition-all duration-300';
              const colorCls = isCurrent
                ? 'bg-gradient-to-r from-pink-500 to-rose-500 ring-2 ring-pink-200'
                : isCompleted
                ? 'bg-emerald-500'
                : isVisited
                ? 'bg-pink-300'
                : 'bg-zinc-200';
              return (
                <button
                  key={p.id || i}
                  type="button"
                  role="tab"
                  aria-selected={isCurrent}
                  aria-label={`Étape ${i + 1}${p.title ? ` : ${p.title}` : ''}${isCompleted ? ' (complétée)' : isCurrent ? ' (courante)' : ''}`}
                  disabled={!isClickable && !isCurrent}
                  onClick={() => jumpToSegment(i)}
                  className={`${baseCls} ${colorCls} ${isClickable && !isCurrent ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}
                  title={p.title || `Page ${i + 1}`}
                />
              );
            })}
          </div>
          <div className="mt-3 flex items-center gap-2">
            {pages[currentPage]?.title && pages[currentPage].title !== form.name && (
              <p className="text-sm font-semibold text-zinc-700">
                {pages[currentPage].title}
              </p>
            )}
            {completedPages.has(currentPage) && isPageComplete(currentPage) && (
              <Check size={14} className="text-emerald-500" aria-label="Page complétée" />
            )}
          </div>
          {pages[currentPage]?.description && (
            <p className="mt-1 text-xs text-zinc-500">
              {pages[currentPage].description}
            </p>
          )}
        </div>
      )}

      {/* Fields — wrapper avec slide transition (F4) */}
      <div
        key={`page-${currentPage}-${direction}`}
        className={`space-y-5 transition-all duration-[250ms] ease-in-out animate-in fade-in ${
          direction === 'forward' ? 'slide-in-from-right-4' : 'slide-in-from-left-4'
        }`}
      >
        {visibleFields.length === 0 && (
          <p className="text-sm text-zinc-500 italic">
            Page vide.
          </p>
        )}
        {visibleFields.map((field) => {
          if (field.field_type === 'hidden') {
            return (
              <FieldRenderer
                key={field.id}
                field={field}
                value={answers[field.field_key]}
                onChange={(v) => updateAnswer(field.field_key, v)}
              />
            );
          }
          const err = errors[field.field_key];
          return (
            <div key={field.id} className="space-y-1.5">
              {field.field_type !== 'checkbox' || (Array.isArray(field.options) && field.options.length > 0) ? (
                <label
                  htmlFor={`field_${field.field_key}`}
                  className="block text-sm font-medium text-zinc-800"
                >
                  {field.label}
                  {field.required && <span className="text-rose-500 ml-0.5">*</span>}
                </label>
              ) : null}
              <FieldRenderer
                field={field}
                value={answers[field.field_key]}
                onChange={(v) => updateAnswer(field.field_key, v)}
                error={err}
              />
              {field.help_text && !err && (
                <p className="text-xs text-zinc-500">{field.help_text}</p>
              )}
              {err && (
                <p className="text-xs text-rose-600 flex items-center gap-1">
                  <AlertCircle size={12} /> {err}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Submit error */}
      {submitError && (
        <div className="mt-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-700 flex items-start gap-2">
          <AlertCircle size={16} className="flex-shrink-0 mt-px" />
          <span>{submitError}</span>
        </div>
      )}

      {/* Navigation — bouton précédent toujours visible sauf page 1 (F4) */}
      <div className="mt-7 flex items-center justify-between gap-3">
        {isMultiStep && currentPage > 0 ? (
          <button
            type="button"
            onClick={goPrev}
            disabled={submitting}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-sm font-medium transition-colors disabled:opacity-50"
          >
            <ChevronLeft size={16} /> Page précédente
          </button>
        ) : (
          <div />
        )}

        {isMultiStep && currentPage < pages.length - 1 ? (
          <button
            type="button"
            onClick={goNext}
            disabled={submitting}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-sm font-semibold shadow-lg shadow-pink-500/20 active:scale-95 transition-all disabled:opacity-50"
          >
            Suivante <ChevronRight size={16} />
          </button>
        ) : (
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-sm font-semibold shadow-lg shadow-pink-500/20 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
            {settings.submit_label || 'Envoyer'}
          </button>
        )}
      </div>

      {/*
        Footer RGPD auto-injecté (audit 27 mai 2026).
        Conformité article 13 RGPD : information préalable obligatoire
        sur le traitement des données. Affiche au minimum la mention du
        responsable + lien politique de confidentialité si configuré.
        L'utilisateur du form (= le client Volia) peut désactiver via
        settings.hide_rgpd_footer = true s'il a déjà sa propre mention
        dans un champ texte au-dessus.
      */}
      {!settings.hide_rgpd_footer && (
        <p className="mt-6 pt-4 border-t border-line/60 text-xs text-content-tertiary leading-relaxed">
          En soumettant ce formulaire, vous acceptez que vos données soient
          traitées par {form.owner_name || 'le responsable du formulaire'} pour
          répondre à votre demande.{' '}
          {settings.privacy_url ? (
            <>
              Voir notre{' '}
              <a
                href={settings.privacy_url}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-pink-600 transition-colors"
              >
                politique de confidentialité
              </a>
              .
            </>
          ) : (
            <>Vous pouvez exercer vos droits (accès, rectification, suppression) à tout moment.</>
          )}
        </p>
      )}
    </form>
  );
}
