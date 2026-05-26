'use client';

// ─────────────────────────────────────────────────────────────────────
// /admin/forms/templates — Bibliothèque de templates (Sprint F3)
// ─────────────────────────────────────────────────────────────────────
// V1 : 4 templates hardcodés. Click → POST /api/admin/forms avec un
// schema pré-rempli, redirige vers /admin/forms/[id].
// F7 : migration vers Supabase + galerie complète + previews riches.
// ─────────────────────────────────────────────────────────────────────

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LayoutTemplate, ArrowLeft, Plus, Loader2, Mail, Calendar, FileText, UserCheck } from 'lucide-react';

const TEMPLATES = [
  {
    id: 'contact',
    name: 'Formulaire de contact',
    description: 'Le classique : nom, email, message. Parfait pour ton site vitrine.',
    icon: Mail,
    accent: 'from-pink-500/20 to-rose-500/20',
    schema: {
      version: 1,
      pages: [{ id: 'page-1', title: 'Contact', description: '', position: 0 }],
      fields: [
        { id: 'fld-1', key: 'nom', type: 'text', label: 'Nom complet', placeholder: 'Jean Dupont', required: true, page_id: 'page-1', position: 0, options: [], validation: { max_length: 100 }, conditional_logic: null },
        { id: 'fld-2', key: 'email', type: 'email', label: 'Email', placeholder: 'vous@exemple.fr', required: true, page_id: 'page-1', position: 1, options: [], validation: {}, conditional_logic: null },
        { id: 'fld-3', key: 'telephone', type: 'tel', label: 'Téléphone (optionnel)', placeholder: '06 12 34 56 78', required: false, page_id: 'page-1', position: 2, options: [], validation: {}, conditional_logic: null },
        { id: 'fld-4', key: 'message', type: 'textarea', label: 'Votre message', placeholder: 'Comment puis-je vous aider ?', required: true, page_id: 'page-1', position: 3, options: [], validation: { max_length: 2000 }, conditional_logic: null },
      ],
      theme: { accent_color: '#db2777', font: 'inter' },
      settings: { submit_label: 'Envoyer le message' },
    },
  },
  {
    id: 'event',
    name: 'Inscription événement',
    description: 'Collecter inscriptions, repas, accompagnants pour un événement.',
    icon: Calendar,
    accent: 'from-violet-500/20 to-fuchsia-500/20',
    schema: {
      version: 1,
      pages: [{ id: 'page-1', title: 'Inscription', description: '', position: 0 }],
      fields: [
        { id: 'fld-1', key: 'nom', type: 'text', label: 'Nom complet', required: true, page_id: 'page-1', position: 0, options: [], validation: {}, conditional_logic: null },
        { id: 'fld-2', key: 'email', type: 'email', label: 'Email', required: true, page_id: 'page-1', position: 1, options: [], validation: {}, conditional_logic: null },
        { id: 'fld-3', key: 'participation', type: 'radio', label: 'Participerez-vous ?', required: true, page_id: 'page-1', position: 2, options: [{ label: 'Oui, présent', value: 'oui' }, { label: 'Non, désolé', value: 'non' }], validation: {}, conditional_logic: null },
        { id: 'fld-4', key: 'nb_accompagnants', type: 'number', label: 'Nombre d\'accompagnants', required: false, page_id: 'page-1', position: 3, options: [], validation: { min: 0, max: 10 }, conditional_logic: { show_if: { field_key: 'participation', operator: 'equals', value: 'oui' } } },
        { id: 'fld-5', key: 'regime', type: 'select', label: 'Régime alimentaire', required: false, page_id: 'page-1', position: 4, options: [{ label: 'Standard', value: 'standard' }, { label: 'Végétarien', value: 'veggie' }, { label: 'Vegan', value: 'vegan' }, { label: 'Sans gluten', value: 'gluten_free' }], validation: {}, conditional_logic: { show_if: { field_key: 'participation', operator: 'equals', value: 'oui' } } },
      ],
      theme: { accent_color: '#db2777', font: 'inter' },
      settings: { submit_label: 'Je m\'inscris' },
    },
  },
  {
    id: 'devis',
    name: 'Demande de devis',
    description: 'Qualification commerciale en 2 étapes : besoin puis coordonnées.',
    icon: FileText,
    accent: 'from-emerald-500/20 to-teal-500/20',
    schema: {
      version: 1,
      pages: [
        { id: 'page-1', title: 'Votre projet', description: '', position: 0 },
        { id: 'page-2', title: 'Vos coordonnées', description: '', position: 1 },
      ],
      fields: [
        { id: 'fld-1', key: 'type_projet', type: 'select', label: 'Type de projet', required: true, page_id: 'page-1', position: 0, options: [{ label: 'Site web', value: 'site' }, { label: 'Application', value: 'app' }, { label: 'Conseil', value: 'conseil' }, { label: 'Autre', value: 'autre' }], validation: {}, conditional_logic: null },
        { id: 'fld-2', key: 'budget', type: 'select', label: 'Budget envisagé', required: false, page_id: 'page-1', position: 1, options: [{ label: '< 5 000 €', value: 'lt5k' }, { label: '5 000 – 20 000 €', value: '5_20k' }, { label: '20 000 – 50 000 €', value: '20_50k' }, { label: '> 50 000 €', value: 'gt50k' }], validation: {}, conditional_logic: null },
        { id: 'fld-3', key: 'description', type: 'textarea', label: 'Décrivez votre besoin', required: true, page_id: 'page-1', position: 2, options: [], validation: { max_length: 2000 }, conditional_logic: null },
        { id: 'fld-4', key: 'nom', type: 'text', label: 'Nom complet', required: true, page_id: 'page-2', position: 0, options: [], validation: {}, conditional_logic: null },
        { id: 'fld-5', key: 'email', type: 'email', label: 'Email professionnel', required: true, page_id: 'page-2', position: 1, options: [], validation: {}, conditional_logic: null },
        { id: 'fld-6', key: 'entreprise', type: 'text', label: 'Entreprise', required: false, page_id: 'page-2', position: 2, options: [], validation: {}, conditional_logic: null },
        { id: 'fld-7', key: 'telephone', type: 'tel', label: 'Téléphone', required: false, page_id: 'page-2', position: 3, options: [], validation: {}, conditional_logic: null },
      ],
      theme: { accent_color: '#db2777', font: 'inter' },
      settings: { submit_label: 'Demander le devis', show_progress: true },
    },
  },
  {
    id: 'candidature',
    name: 'Candidature',
    description: 'Formulaire de candidature avec upload CV et lettre de motivation.',
    icon: UserCheck,
    accent: 'from-amber-500/20 to-orange-500/20',
    schema: {
      version: 1,
      pages: [{ id: 'page-1', title: 'Candidature', description: '', position: 0 }],
      fields: [
        { id: 'fld-1', key: 'nom', type: 'text', label: 'Nom complet', required: true, page_id: 'page-1', position: 0, options: [], validation: {}, conditional_logic: null },
        { id: 'fld-2', key: 'email', type: 'email', label: 'Email', required: true, page_id: 'page-1', position: 1, options: [], validation: {}, conditional_logic: null },
        { id: 'fld-3', key: 'telephone', type: 'tel', label: 'Téléphone', required: true, page_id: 'page-1', position: 2, options: [], validation: {}, conditional_logic: null },
        { id: 'fld-4', key: 'poste', type: 'text', label: 'Poste convoité', required: true, page_id: 'page-1', position: 3, options: [], validation: {}, conditional_logic: null },
        { id: 'fld-5', key: 'cv', type: 'file', label: 'CV (PDF)', required: true, page_id: 'page-1', position: 4, options: [], validation: { accept: ['application/pdf'] }, conditional_logic: null },
        { id: 'fld-6', key: 'motivation', type: 'textarea', label: 'Pourquoi nous rejoindre ?', required: false, page_id: 'page-1', position: 5, options: [], validation: { max_length: 3000 }, conditional_logic: null },
      ],
      theme: { accent_color: '#db2777', font: 'inter' },
      settings: { submit_label: 'Envoyer ma candidature' },
    },
  },
];

export default function FormsTemplatesPage() {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState(null);
  const [error, setError] = useState(null);

  async function useTemplate(tpl) {
    setLoadingId(tpl.id);
    setError(null);
    try {
      const res = await fetch('/api/admin/forms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: tpl.name, description: tpl.description }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || 'Erreur création');
        setLoadingId(null);
        return;
      }
      // Push le schema du template via PUT
      const formId = json.data.id;
      const putRes = await fetch(`/api/admin/forms/${formId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schema: tpl.schema }),
      });
      if (!putRes.ok) {
        const j = await putRes.json().catch(() => ({}));
        setError(j.error || 'Erreur application template');
        setLoadingId(null);
        return;
      }
      router.push(`/admin/forms/${formId}`);
    } catch (e) {
      setError(e.message);
      setLoadingId(null);
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <Link
        href="/admin/forms"
        className="inline-flex items-center gap-1.5 text-xs text-content-tertiary hover:text-pink-700 transition-colors mb-4"
      >
        <ArrowLeft size={14} /> Mes formulaires
      </Link>

      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <LayoutTemplate size={14} className="text-pink-600" />
          <p className="text-[11px] uppercase tracking-wider font-semibold text-pink-700">
            Bibliothèque · Sprint F3
          </p>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-content-primary tracking-tight">
          Templates
        </h1>
        <p className="mt-2 text-content-tertiary text-sm sm:text-base max-w-2xl">
          Démarre avec un formulaire pré-rempli adapté à ton cas d'usage.
          Tu pourras tout personnaliser ensuite dans le builder.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {TEMPLATES.map((tpl) => {
          const Icon = tpl.icon;
          const isLoading = loadingId === tpl.id;
          return (
            <div
              key={tpl.id}
              className="group rounded-2xl border border-line bg-surface-card hover:bg-surface-elevated hover:border-pink-200 transition-all overflow-hidden flex flex-col"
            >
              {/* Preview area */}
              <div className={`h-32 bg-gradient-to-br ${tpl.accent} flex items-center justify-center border-b border-line`}>
                <div className="p-3 rounded-xl bg-white/80 backdrop-blur shadow-sm">
                  <Icon size={28} className="text-pink-600" />
                </div>
              </div>
              <div className="flex-1 p-4 flex flex-col">
                <h3 className="text-sm font-semibold text-content-primary group-hover:text-pink-700 transition-colors">
                  {tpl.name}
                </h3>
                <p className="mt-1.5 text-xs text-content-tertiary leading-relaxed flex-1">
                  {tpl.description}
                </p>
                <div className="mt-3 flex items-center gap-3 text-[10px] uppercase tracking-wider text-content-faint">
                  <span>{tpl.schema.fields.length} champs</span>
                  <span>·</span>
                  <span>{tpl.schema.pages.length} {tpl.schema.pages.length > 1 ? 'pages' : 'page'}</span>
                </div>
                <button
                  type="button"
                  onClick={() => useTemplate(tpl)}
                  disabled={isLoading || !!loadingId}
                  className="mt-4 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-pink-600 hover:bg-pink-500 text-white text-xs font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                  Utiliser ce template
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
