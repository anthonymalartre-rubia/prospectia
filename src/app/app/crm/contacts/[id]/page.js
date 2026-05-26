'use client';

// ─────────────────────────────────────────────────────────────────────
// /app/crm/contacts/[id] — Détail d'un contact CRM (Phase 3).
// ─────────────────────────────────────────────────────────────────────
//
// Layout 2 colonnes :
//   - Gauche (1/3 desktop) : carte contact avec inline-edit
//   - Droite (2/3 desktop) : tabs "Deals" / "Activités"
//
// Inline edit : on commit chaque champ via PATCH au blur (ou Enter pour
// les inputs). Pas de bouton Save global — modèle "Linear-like".
// ─────────────────────────────────────────────────────────────────────

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  Trash2,
  Mail,
  Phone,
  Building2,
  Briefcase,
  Plus,
  KanbanSquare,
  Activity,
  Calendar,
  CheckCircle2,
  Users,
  ExternalLink,
} from 'lucide-react';
import TopBar from '@/components/TopBar';
import CrmSidebar from '@/components/crm/CrmSidebar';
import { getSupabase } from '@/lib/supabase';
import { formatDealValue } from '@/lib/crm';
import {
  initials,
  avatarGradient,
  SourceBadge,
  formatDate,
} from '@/components/crm/ContactsList';
import NewDealModal from '@/components/crm/NewDealModal';
import ActivityForm from '@/components/crm/ActivityForm';

const BUSINESS_PLANS = ['business', 'enterprise'];

// ───────────────────────────────────────────────────────────
// InlineField — input/textarea qui PATCH au blur si modifié.
// ───────────────────────────────────────────────────────────
function InlineField({
  value,
  onSave,
  placeholder,
  multiline,
  type = 'text',
  Icon,
  saving,
}) {
  const [local, setLocal] = useState(value || '');

  useEffect(() => {
    setLocal(value || '');
  }, [value]);

  function commit() {
    const v = local.trim();
    if (v === (value || '').trim()) return;
    onSave?.(v || null);
  }

  const baseClass =
    'w-full text-sm text-content-primary placeholder:text-content-muted bg-transparent border border-transparent hover:border-line focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-md px-2 py-1.5 transition-all focus:bg-surface-card';

  if (multiline) {
    return (
      <div className="relative">
        <textarea
          rows={3}
          value={local}
          onChange={(e) => setLocal(e.target.value)}
          onBlur={commit}
          placeholder={placeholder}
          className={`${baseClass} resize-none`}
        />
        {saving && (
          <Loader2
            size={12}
            className="absolute top-2 right-2 animate-spin text-emerald-600"
          />
        )}
      </div>
    );
  }

  return (
    <div className="relative flex items-center gap-2">
      {Icon && (
        <Icon
          size={14}
          className="text-content-tertiary flex-shrink-0 pointer-events-none"
        />
      )}
      <input
        type={type}
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.currentTarget.blur();
          }
        }}
        placeholder={placeholder}
        className={baseClass}
      />
      {saving && <Loader2 size={12} className="animate-spin text-emerald-600" />}
    </div>
  );
}

// ───────────────────────────────────────────────────────────
// Tabs : Deals / Activities
// ───────────────────────────────────────────────────────────
function DealsTab({ deals, onNewDeal }) {
  if (!deals || deals.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-line bg-surface-card/50 p-8 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 border border-emerald-200 mb-3">
          <KanbanSquare size={20} className="text-emerald-600" />
        </div>
        <p className="text-sm font-semibold text-content-primary mb-1">
          Aucun deal pour ce contact
        </p>
        <p className="text-xs text-content-tertiary mb-4">
          Créez un deal pour suivre une opportunité commerciale liée.
        </p>
        <button
          type="button"
          onClick={onNewDeal}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-md shadow-emerald-500/20 transition-all"
        >
          <Plus size={14} />
          Nouveau deal
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {deals.map((d) => {
        const statusBadge =
          d.status === 'won'
            ? { label: 'Gagné', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' }
            : d.status === 'lost'
            ? { label: 'Perdu', className: 'bg-rose-100 text-rose-700 border-rose-200' }
            : { label: 'Ouvert', className: 'bg-blue-100 text-blue-700 border-blue-200' };

        return (
          <Link
            key={d.id}
            href={`/app/crm`}
            className="block rounded-xl border border-line bg-surface-base hover:border-emerald-200 hover:shadow-sm transition-all p-4 group"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-content-primary truncate">
                    {d.title}
                  </span>
                  <span
                    className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full border ${statusBadge.className}`}
                  >
                    {statusBadge.label}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-content-tertiary">
                  <span className="tabular-nums font-semibold text-content-secondary">
                    {formatDealValue(d.value_cents, d.currency)}
                  </span>
                  {d.expected_close_date && (
                    <span className="inline-flex items-center gap-1">
                      <Calendar size={11} />
                      {formatDate(d.expected_close_date)}
                    </span>
                  )}
                </div>
              </div>
              <ExternalLink
                size={14}
                className="text-content-tertiary opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5"
              />
            </div>
          </Link>
        );
      })}
      <button
        type="button"
        onClick={onNewDeal}
        className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium text-emerald-700 border border-dashed border-emerald-300 hover:bg-emerald-50/50 transition-colors"
      >
        <Plus size={14} />
        Nouveau deal pour ce contact
      </button>
    </div>
  );
}

const ACTIVITY_ICON = {
  note: { icon: Activity, color: 'text-zinc-600 bg-zinc-100' },
  call: { icon: Phone, color: 'text-blue-600 bg-blue-100' },
  email: { icon: Mail, color: 'text-emerald-600 bg-emerald-100' },
  meeting: { icon: Users, color: 'text-violet-600 bg-violet-100' },
  task: { icon: CheckCircle2, color: 'text-amber-600 bg-amber-100' },
};

function ActivitiesTab({ activities, loading, contactId, onCreated }) {
  return (
    <div className="space-y-3">
      {/* Form de création */}
      {contactId && (
        <ActivityForm contactId={contactId} onCreated={onCreated} />
      )}

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 size={20} className="animate-spin text-emerald-600" />
        </div>
      ) : !activities || activities.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-surface-card/50 p-8 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-zinc-100 to-zinc-50 border border-line mb-3">
            <Activity size={20} className="text-content-tertiary" />
          </div>
          <p className="text-sm font-semibold text-content-primary mb-1">
            Aucune activité
          </p>
          <p className="text-xs text-content-tertiary">
            Ajoutez une note, un appel ou un meeting pour suivre l&apos;historique
            de ce contact.
          </p>
        </div>
      ) : (
        <ActivitiesList activities={activities} />
      )}
    </div>
  );
}

function ActivitiesList({ activities }) {
  return (
    <div className="space-y-2">
      {activities.map((a) => {
        const cfg = ACTIVITY_ICON[a.type] || ACTIVITY_ICON.note;
        const Icon = cfg.icon;
        return (
          <div
            key={a.id}
            className="flex items-start gap-3 rounded-xl border border-line bg-surface-base p-3"
          >
            <div className={`p-2 rounded-lg flex-shrink-0 ${cfg.color}`}>
              <Icon size={14} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2 mb-0.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-content-secondary">
                  {a.type}
                </span>
                <span className="text-[10px] text-content-tertiary tabular-nums">
                  {formatDate(a.created_at)}
                </span>
              </div>
              <p className="text-sm text-content-primary whitespace-pre-wrap break-words">
                {a.content}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ───────────────────────────────────────────────────────────
// Main page
// ───────────────────────────────────────────────────────────
export default function CrmContactDetailPage() {
  const router = useRouter();
  const params = useParams();
  const contactId = params?.id;

  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [contact, setContact] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingField, setSavingField] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [tab, setTab] = useState('deals');
  const [activities, setActivities] = useState([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);

  // ─── Deal creation ────────────────────────────────────────
  const [newDealOpen, setNewDealOpen] = useState(false);
  const [defaultPipeline, setDefaultPipeline] = useState(null);

  // ─── Auth + gating ────────────────────────────────────────
  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) {
      setAuthChecked(true);
      return;
    }
    supabase.auth.getUser().then(async ({ data: { user: u } }) => {
      if (!u) {
        router.push('/login');
        return;
      }
      setUser(u);
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('plan')
        .eq('id', u.id)
        .maybeSingle();
      const userPlan = profile?.plan || 'free';
      if (!BUSINESS_PLANS.includes(userPlan)) {
        router.replace('/app/crm');
        return;
      }
      setAuthChecked(true);
    });
  }, [router]);

  // ─── Fetch contact ────────────────────────────────────────
  const fetchContact = useCallback(async () => {
    if (!authChecked || !contactId) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/crm/contacts/${contactId}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erreur chargement contact');
      }
      setContact(data.data);
    } catch (err) {
      console.error('[CRM contact detail] fetch error', err);
      setError(err.message || 'Erreur réseau');
    } finally {
      setLoading(false);
    }
  }, [authChecked, contactId]);

  useEffect(() => {
    fetchContact();
  }, [fetchContact]);

  // ─── Fetch activities quand tab = activities ─────────────
  useEffect(() => {
    if (tab !== 'activities' || !contactId || !authChecked) return;
    setActivitiesLoading(true);
    fetch(`/api/crm/activities?contact_id=${contactId}`)
      .then((r) => r.json())
      .then((d) => {
        setActivities(Array.isArray(d?.data) ? d.data : []);
        setActivitiesLoading(false);
      })
      .catch(() => {
        setActivitiesLoading(false);
      });
  }, [tab, contactId, authChecked]);

  // ─── Fetch pipeline pour "Nouveau deal" ──────────────────
  // On le fait à la demande (au moment où on ouvre le modal)
  async function ensurePipelineLoaded() {
    if (defaultPipeline) return defaultPipeline;
    const res = await fetch('/api/crm/pipelines');
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Erreur chargement pipeline');
      return null;
    }
    const list = Array.isArray(data.data) ? data.data : [];
    const def = list.find((p) => p.is_default) || list[0];
    if (def) setDefaultPipeline(def);
    return def;
  }

  async function handleNewDeal() {
    await ensurePipelineLoaded();
    setNewDealOpen(true);
  }

  function handleDealCreated(deal) {
    // On l'ajoute dans la liste des deals associés
    setContact((prev) => {
      if (!prev) return prev;
      return { ...prev, deals: [deal, ...(prev.deals || [])] };
    });
  }

  // ─── PATCH inline ─────────────────────────────────────────
  async function patchField(field, value) {
    if (!contact) return;
    setSavingField(field);
    try {
      const res = await fetch(`/api/crm/contacts/${contact.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Erreur mise à jour');
        return;
      }
      setContact((prev) => ({ ...prev, ...data.data }));
    } catch (err) {
      console.error('[CRM contact detail] patch error', err);
      setError('Erreur réseau');
    } finally {
      setSavingField(null);
    }
  }

  // ─── Delete ───────────────────────────────────────────────
  async function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 4000);
      return;
    }
    if (!contact || deleting) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/crm/contacts/${contact.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Erreur suppression');
        setDeleting(false);
        return;
      }
      router.push('/app/crm/contacts');
    } catch (err) {
      console.error('[CRM contact detail] delete error', err);
      setError('Erreur réseau');
      setDeleting(false);
    }
  }

  // ─── Render ──────────────────────────────────────────────
  if (!authChecked || loading) {
    return (
      <div className="min-h-screen bg-surface-base flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="min-h-screen bg-surface-base text-content-primary flex flex-col">
        <TopBar user={user} onToggleSidebar={() => setSidebarOpen((v) => !v)} />
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="text-center max-w-sm">
            <AlertCircle size={32} className="mx-auto text-rose-500 mb-3" />
            <p className="text-lg font-bold text-content-primary mb-1">
              Contact introuvable
            </p>
            <p className="text-sm text-content-tertiary mb-5">
              {error || "Ce contact n'existe pas ou a été supprimé."}
            </p>
            <Link
              href="/app/crm/contacts"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-content-secondary border border-line hover:bg-surface-elevated transition-colors"
            >
              <ArrowLeft size={14} />
              Retour aux contacts
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const grad = avatarGradient(contact.name || contact.email || contact.id);

  return (
    <div className="min-h-screen bg-surface-base text-content-primary flex flex-col">
      <TopBar user={user} onToggleSidebar={() => setSidebarOpen((v) => !v)} />

      <div className="flex flex-1">
        <CrmSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="flex-1 min-w-0">
          {/* Sub-header avec back button */}
          <header className="border-b border-line bg-surface-base sticky top-14 z-30">
            <div className="px-4 sm:px-6 py-3">
              <Link
                href="/app/crm/contacts"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-content-tertiary hover:text-content-primary transition-colors"
              >
                <ArrowLeft size={12} />
                Retour aux contacts
              </Link>
            </div>
            {error && (
              <div className="px-4 sm:px-6 pb-3">
                <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-700">
                  <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                  <p className="text-xs font-medium flex-1">{error}</p>
                </div>
              </div>
            )}
          </header>

          <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-3 gap-5 bg-gradient-to-br from-emerald-50/20 via-surface-base to-teal-50/10 min-h-[calc(100vh-7rem)]">
            {/* ─── Colonne gauche : carte contact ──────── */}
            <div className="lg:col-span-1">
              <div className="rounded-2xl border border-line bg-surface-base p-5 sticky top-32">
                {/* Avatar + name */}
                <div className="flex flex-col items-center text-center pb-5 border-b border-line/70">
                  <div
                    className={`w-20 h-20 rounded-full bg-gradient-to-br ${grad} flex items-center justify-center shadow-lg ring-4 ring-white mb-3`}
                  >
                    <span className="text-2xl font-bold text-white tracking-wider">
                      {initials(contact.name)}
                    </span>
                  </div>
                  <div className="w-full">
                    <InlineField
                      value={contact.name}
                      onSave={(v) => patchField('name', v)}
                      placeholder="Nom du contact"
                      saving={savingField === 'name'}
                    />
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <SourceBadge source={contact.source} />
                    <span className="text-[10px] text-content-tertiary tabular-nums">
                      Ajouté le {formatDate(contact.created_at)}
                    </span>
                  </div>
                </div>

                {/* Fields */}
                <div className="pt-4 space-y-3">
                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-content-muted mb-1 px-2">
                      Email
                    </label>
                    <InlineField
                      type="email"
                      Icon={Mail}
                      value={contact.email}
                      onSave={(v) => patchField('email', v)}
                      placeholder="email@exemple.fr"
                      saving={savingField === 'email'}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-content-muted mb-1 px-2">
                      Téléphone
                    </label>
                    <InlineField
                      type="tel"
                      Icon={Phone}
                      value={contact.phone}
                      onSave={(v) => patchField('phone', v)}
                      placeholder="06 12 34 56 78"
                      saving={savingField === 'phone'}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-content-muted mb-1 px-2">
                      Entreprise
                    </label>
                    <InlineField
                      Icon={Building2}
                      value={contact.company}
                      onSave={(v) => patchField('company', v)}
                      placeholder="Nom de l'entreprise"
                      saving={savingField === 'company'}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-content-muted mb-1 px-2">
                      Poste
                    </label>
                    <InlineField
                      Icon={Briefcase}
                      value={contact.position}
                      onSave={(v) => patchField('position', v)}
                      placeholder="CEO, Sales, ..."
                      saving={savingField === 'position'}
                    />
                  </div>

                  {/* Source ref id */}
                  {contact.source_ref_id && (
                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-content-muted mb-1 px-2">
                        Réf. source
                      </label>
                      <div className="px-2 py-1.5 text-[11px] text-content-tertiary font-mono break-all bg-zinc-50 rounded-md border border-line">
                        {contact.source_ref_id}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-content-muted mb-1 px-2">
                      Notes
                    </label>
                    <InlineField
                      multiline
                      value={contact.notes}
                      onSave={(v) => patchField('notes', v)}
                      placeholder="Contexte, historique…"
                      saving={savingField === 'notes'}
                    />
                  </div>
                </div>

                {/* Delete */}
                <div className="pt-5 mt-5 border-t border-line/70">
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleting}
                    className={`w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all disabled:opacity-50 ${
                      confirmDelete
                        ? 'bg-rose-600 text-white hover:bg-rose-700'
                        : 'border border-line text-rose-600 hover:bg-rose-50 hover:border-rose-200'
                    }`}
                  >
                    {deleting ? (
                      <>
                        <Loader2 size={12} className="animate-spin" />
                        Suppression…
                      </>
                    ) : (
                      <>
                        <Trash2 size={12} />
                        {confirmDelete ? 'Confirmer la suppression' : 'Supprimer ce contact'}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* ─── Colonne droite : tabs ──────────────── */}
            <div className="lg:col-span-2">
              {/* Tabs */}
              <div className="inline-flex items-center rounded-lg border border-line bg-surface-card p-0.5 mb-4">
                <button
                  type="button"
                  onClick={() => setTab('deals')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                    tab === 'deals'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'text-content-tertiary hover:text-content-primary'
                  }`}
                >
                  <KanbanSquare size={12} />
                  Deals associés
                  {contact.deals?.length > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 rounded-full bg-white text-[9px] tabular-nums">
                      {contact.deals.length}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setTab('activities')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                    tab === 'activities'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'text-content-tertiary hover:text-content-primary'
                  }`}
                >
                  <Activity size={12} />
                  Activités
                </button>
              </div>

              {/* Tab content */}
              {tab === 'deals' && (
                <DealsTab deals={contact.deals} onNewDeal={handleNewDeal} />
              )}
              {tab === 'activities' && (
                <ActivitiesTab
                  activities={activities}
                  loading={activitiesLoading}
                  contactId={contact.id}
                  onCreated={(act) => setActivities((prev) => [act, ...prev])}
                />
              )}
            </div>
          </div>
        </main>
      </div>

      {/* New deal modal — contact pré-rempli */}
      <NewDealModal
        open={newDealOpen}
        onClose={() => setNewDealOpen(false)}
        onCreated={handleDealCreated}
        pipelineId={defaultPipeline?.id}
        defaultStageId={defaultPipeline?.stages?.[0]?.id}
        defaultContactId={contact?.id}
        stages={defaultPipeline?.stages || []}
        contacts={[contact].filter(Boolean)}
      />
    </div>
  );
}
