'use client';

// ─────────────────────────────────────────────────────────────────────
// /app/crm/activities — Liste centralisée des activités du user (Phase 4).
// ─────────────────────────────────────────────────────────────────────
//
// Gating Business identique aux autres pages CRM : redirige vers /app/crm
// si l'user n'est pas Business/Enterprise (qui montre l'upgrade CTA).
//
// 3 sections par défaut :
//   - En retard (tasks overdue : due_at < now && !completed_at)
//   - À venir (tasks due_at dans les 7 jours, !completed_at)
//   - Complétées récemment (7 derniers jours)
//
// Filtres :
//   - Type (all/note/call/email/meeting/task)
//   - Status (all/open/completed/overdue)
//
// Chaque activity affiche : icône type, content, lien vers deal/contact,
// due_at, badge overdue, bouton toggle completed (si task).
// ─────────────────────────────────────────────────────────────────────

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Activity,
  Loader2,
  AlertCircle,
  Clock,
  CalendarClock,
  CheckCircle2,
  StickyNote,
  Phone,
  Mail,
  Users as UsersIcon,
  CheckSquare,
  Square,
  ExternalLink,
} from 'lucide-react';
import TopBar from '@/components/TopBar';
import CrmSidebar from '@/components/crm/CrmSidebar';
import { getSupabase } from '@/lib/supabase';

const BUSINESS_PLANS = ['business', 'enterprise'];

const TYPE_META = {
  note: { Icon: StickyNote, color: 'text-zinc-600 bg-zinc-100', label: 'Note' },
  call: { Icon: Phone, color: 'text-blue-600 bg-blue-100', label: 'Appel' },
  email: { Icon: Mail, color: 'text-emerald-600 bg-emerald-100', label: 'Email' },
  meeting: { Icon: UsersIcon, color: 'text-violet-600 bg-violet-100', label: 'Meeting' },
  task: { Icon: CheckSquare, color: 'text-amber-600 bg-amber-100', label: 'Tâche' },
};

function formatDate(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

function isOverdue(act) {
  if (act.type !== 'task') return false;
  if (act.completed_at) return false;
  if (!act.due_at) return false;
  return new Date(act.due_at).getTime() < Date.now();
}

function isUpcoming7d(act) {
  if (act.type !== 'task') return false;
  if (act.completed_at) return false;
  if (!act.due_at) return false;
  const t = new Date(act.due_at).getTime();
  const now = Date.now();
  return t >= now && t <= now + 7 * 24 * 60 * 60 * 1000;
}

function isCompletedRecent(act) {
  if (!act.completed_at) return false;
  const t = new Date(act.completed_at).getTime();
  return t >= Date.now() - 7 * 24 * 60 * 60 * 1000;
}

// ─── Activity row component ─────────────────────────────────────────
function ActivityRow({ activity, onToggle, toggling }) {
  const meta = TYPE_META[activity.type] || TYPE_META.note;
  const Icon = meta.Icon;
  const overdue = isOverdue(activity);
  const completed = !!activity.completed_at;
  const isTask = activity.type === 'task';

  // Construit un lien vers le deal ou le contact
  let linkLabel = null;
  let linkHref = null;
  if (activity.contact) {
    linkLabel = activity.contact.company || activity.contact.name;
    linkHref = `/app/crm/contacts/${activity.contact.id}`;
  } else if (activity.deal) {
    linkLabel = activity.deal.title;
    linkHref = '/app/crm';
  }

  return (
    <div
      className={`flex items-start gap-3 rounded-xl border p-3 transition-colors ${
        overdue
          ? 'border-rose-200 bg-rose-50/40'
          : completed
          ? 'border-line bg-surface-card/40 opacity-75'
          : 'border-line bg-surface-base hover:border-emerald-200'
      }`}
    >
      <div className={`p-2 rounded-lg flex-shrink-0 ${meta.color}`}>
        <Icon size={14} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="text-[10px] font-bold uppercase tracking-wider text-content-tertiary">
            {meta.label}
          </span>
          {overdue && (
            <span className="px-1.5 py-px rounded bg-rose-100 text-rose-700 border border-rose-200 text-[9px] font-bold uppercase tracking-wider">
              En retard
            </span>
          )}
          {completed && (
            <span className="px-1.5 py-px rounded bg-emerald-100 text-emerald-700 border border-emerald-200 text-[9px] font-bold uppercase tracking-wider">
              ✓ Complétée
            </span>
          )}
          <span className="ml-auto text-[10px] text-content-muted tabular-nums">
            {formatDate(activity.created_at)}
          </span>
        </div>

        <p
          className={`text-sm whitespace-pre-wrap break-words ${
            completed ? 'text-content-tertiary line-through' : 'text-content-primary'
          }`}
        >
          {activity.content}
        </p>

        <div className="flex items-center gap-3 mt-1.5 text-[11px] text-content-tertiary flex-wrap">
          {isTask && activity.due_at && (
            <span className="inline-flex items-center gap-1">
              <CalendarClock size={11} />
              Échéance : {formatDate(activity.due_at)}
            </span>
          )}
          {linkHref && (
            <Link
              href={linkHref}
              className="inline-flex items-center gap-1 text-emerald-700 hover:underline"
            >
              <ExternalLink size={11} />
              {linkLabel}
            </Link>
          )}
        </div>
      </div>

      {isTask && (
        <button
          type="button"
          onClick={() => onToggle(activity)}
          disabled={toggling}
          className={`p-1.5 rounded-md transition-colors flex-shrink-0 ${
            completed
              ? 'text-emerald-600 hover:bg-emerald-50'
              : 'text-content-tertiary hover:text-emerald-600 hover:bg-emerald-50'
          } disabled:opacity-50`}
          aria-label={completed ? 'Marquer comme non-complétée' : 'Marquer comme complétée'}
        >
          {toggling ? (
            <Loader2 size={16} className="animate-spin" />
          ) : completed ? (
            <CheckSquare size={16} />
          ) : (
            <Square size={16} />
          )}
        </button>
      )}
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────────────
export default function CrmActivitiesPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [togglingId, setTogglingId] = useState(null);

  const [typeFilter, setTypeFilter] = useState('all'); // all | note | call | email | meeting | task
  const [statusFilter, setStatusFilter] = useState('all'); // all | open | completed | overdue

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

  // ─── Fetch ─────────────────────────────────────────────────
  const fetchActivities = useCallback(async () => {
    if (!authChecked) return;
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      params.set('scope', 'all');
      params.set('with_relations', '1');
      params.set('limit', '200');
      if (typeFilter !== 'all') params.set('type', typeFilter);
      if (statusFilter !== 'all') params.set('status', statusFilter);

      const res = await fetch(`/api/crm/activities?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur chargement activités');
      setActivities(Array.isArray(data.data) ? data.data : []);
    } catch (err) {
      console.error('[CRM activities] fetch error', err);
      setError(err.message || 'Erreur réseau');
    } finally {
      setLoading(false);
    }
  }, [authChecked, typeFilter, statusFilter]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  // ─── Toggle task (optimistic) ─────────────────────────────
  async function handleToggle(activity) {
    if (togglingId) return;
    const willComplete = !activity.completed_at;
    setTogglingId(activity.id);
    setActivities((prev) =>
      prev.map((a) =>
        a.id === activity.id
          ? { ...a, completed_at: willComplete ? new Date().toISOString() : null }
          : a
      )
    );
    try {
      const res = await fetch(`/api/crm/activities/${activity.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed_at: willComplete }),
      });
      const data = await res.json();
      if (!res.ok) {
        // Revert
        setActivities((prev) =>
          prev.map((a) =>
            a.id === activity.id ? { ...a, completed_at: activity.completed_at } : a
          )
        );
        setError(data.error || 'Erreur mise à jour');
      } else {
        setActivities((prev) =>
          prev.map((a) => (a.id === activity.id ? { ...a, ...data.data } : a))
        );
      }
    } catch (err) {
      console.error('[CRM activities] toggle error', err);
      setError('Erreur réseau');
    } finally {
      setTogglingId(null);
    }
  }

  // ─── Groupes ───────────────────────────────────────────────
  const groups = useMemo(() => {
    const overdue = activities.filter(isOverdue);
    const upcoming = activities.filter(isUpcoming7d);
    const recentCompleted = activities.filter(isCompletedRecent);

    // "Autres" = tout ce qui n'entre dans aucune bucket spéciale, pour pas
    // perdre les notes / mails / etc.
    const usedIds = new Set([
      ...overdue.map((a) => a.id),
      ...upcoming.map((a) => a.id),
      ...recentCompleted.map((a) => a.id),
    ]);
    const others = activities.filter((a) => !usedIds.has(a.id));

    return { overdue, upcoming, recentCompleted, others };
  }, [activities]);

  const hasAnyActivity = activities.length > 0;
  const showGroupedView = typeFilter === 'all' && statusFilter === 'all';

  // ─── Render ──────────────────────────────────────────────
  if (!authChecked) {
    return (
      <div className="min-h-screen bg-surface-base flex items-center justify-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center animate-pulse">
          <Activity size={28} className="text-white" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-base text-content-primary flex flex-col">
      <TopBar user={user} onToggleSidebar={() => setSidebarOpen((v) => !v)} />

      <div className="flex flex-1">
        <CrmSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <header className="border-b border-line bg-surface-base sticky top-14 z-30">
            <div className="px-4 sm:px-6 py-4 flex flex-col gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0">
                  <Activity size={18} className="text-white" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-lg sm:text-xl font-bold text-content-primary">
                    Activités
                  </h1>
                  <p className="text-[11px] sm:text-xs text-content-tertiary tabular-nums">
                    {activities.length} activité{activities.length !== 1 ? 's' : ''}
                    {groups.overdue.length > 0 && (
                      <span className="ml-2 text-rose-600 font-semibold">
                        · {groups.overdue.length} en retard
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* Filtres */}
              <div className="flex flex-col sm:flex-row gap-2">
                {/* Type filter */}
                <div className="inline-flex items-center rounded-lg border border-line bg-surface-card p-0.5 flex-wrap">
                  {[
                    { value: 'all', label: 'Tous types' },
                    { value: 'note', label: 'Notes' },
                    { value: 'call', label: 'Appels' },
                    { value: 'email', label: 'Emails' },
                    { value: 'meeting', label: 'Meetings' },
                    { value: 'task', label: 'Tâches' },
                  ].map((f) => (
                    <button
                      key={f.value}
                      type="button"
                      onClick={() => setTypeFilter(f.value)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                        typeFilter === f.value
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'text-content-tertiary hover:text-content-primary'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                {/* Status filter */}
                <div className="inline-flex items-center rounded-lg border border-line bg-surface-card p-0.5">
                  {[
                    { value: 'all', label: 'Tous' },
                    { value: 'open', label: 'Ouvertes' },
                    { value: 'overdue', label: 'En retard' },
                    { value: 'completed', label: 'Complétées' },
                  ].map((f) => (
                    <button
                      key={f.value}
                      type="button"
                      onClick={() => setStatusFilter(f.value)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                        statusFilter === f.value
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'text-content-tertiary hover:text-content-primary'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
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

          {/* Content */}
          <section className="flex-1 p-4 sm:p-6 bg-gradient-to-br from-emerald-50/20 via-surface-base to-teal-50/10">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 size={28} className="animate-spin text-emerald-600" />
              </div>
            ) : !hasAnyActivity ? (
              // ─── Empty state ────────────────────────────────────
              <div className="max-w-md mx-auto py-16 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 border border-emerald-200 mb-4">
                  <Activity size={26} className="text-emerald-600" />
                </div>
                <h3 className="text-lg font-bold text-content-primary mb-1">
                  Le journal est vide.
                </h3>
                <p className="text-sm text-content-tertiary mb-5">
                  Notes, calls, meetings et tâches sur tes deals et contacts atterriront ici.
                </p>
                <Link
                  href="/app/crm"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-md shadow-emerald-500/20 transition-all"
                >
                  Aller au pipeline
                </Link>
              </div>
            ) : showGroupedView ? (
              // ─── Grouped sections (default) ─────────────────────
              <div className="space-y-6 max-w-4xl">
                {groups.overdue.length > 0 && (
                  <section>
                    <h2 className="flex items-center gap-2 text-sm font-bold text-rose-700 mb-2">
                      <Clock size={14} />
                      En retard
                      <span className="text-[11px] font-semibold text-rose-600/80 tabular-nums">
                        ({groups.overdue.length})
                      </span>
                    </h2>
                    <div className="space-y-2">
                      {groups.overdue.map((a) => (
                        <ActivityRow
                          key={a.id}
                          activity={a}
                          onToggle={handleToggle}
                          toggling={togglingId === a.id}
                        />
                      ))}
                    </div>
                  </section>
                )}

                {groups.upcoming.length > 0 && (
                  <section>
                    <h2 className="flex items-center gap-2 text-sm font-bold text-amber-700 mb-2">
                      <CalendarClock size={14} />
                      À venir (7 jours)
                      <span className="text-[11px] font-semibold text-amber-600/80 tabular-nums">
                        ({groups.upcoming.length})
                      </span>
                    </h2>
                    <div className="space-y-2">
                      {groups.upcoming.map((a) => (
                        <ActivityRow
                          key={a.id}
                          activity={a}
                          onToggle={handleToggle}
                          toggling={togglingId === a.id}
                        />
                      ))}
                    </div>
                  </section>
                )}

                {groups.recentCompleted.length > 0 && (
                  <section>
                    <h2 className="flex items-center gap-2 text-sm font-bold text-emerald-700 mb-2">
                      <CheckCircle2 size={14} />
                      Complétées récemment
                      <span className="text-[11px] font-semibold text-emerald-600/80 tabular-nums">
                        ({groups.recentCompleted.length})
                      </span>
                    </h2>
                    <div className="space-y-2">
                      {groups.recentCompleted.map((a) => (
                        <ActivityRow
                          key={a.id}
                          activity={a}
                          onToggle={handleToggle}
                          toggling={togglingId === a.id}
                        />
                      ))}
                    </div>
                  </section>
                )}

                {groups.others.length > 0 && (
                  <section>
                    <h2 className="flex items-center gap-2 text-sm font-bold text-content-secondary mb-2">
                      <Activity size={14} />
                      Autres activités
                      <span className="text-[11px] font-semibold text-content-tertiary tabular-nums">
                        ({groups.others.length})
                      </span>
                    </h2>
                    <div className="space-y-2">
                      {groups.others.map((a) => (
                        <ActivityRow
                          key={a.id}
                          activity={a}
                          onToggle={handleToggle}
                          toggling={togglingId === a.id}
                        />
                      ))}
                    </div>
                  </section>
                )}
              </div>
            ) : (
              // ─── Filtered flat list ────────────────────────────
              <div className="space-y-2 max-w-4xl">
                {activities.length === 0 ? (
                  <div className="text-center py-12 text-content-tertiary">
                    <p className="text-sm">Rien avec ces filtres. Élargis.</p>
                  </div>
                ) : (
                  activities.map((a) => (
                    <ActivityRow
                      key={a.id}
                      activity={a}
                      onToggle={handleToggle}
                      toggling={togglingId === a.id}
                    />
                  ))
                )}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
