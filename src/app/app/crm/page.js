'use client';

// ─────────────────────────────────────────────────────────────────────
// /app/crm — Volia CRM Kanban (Phase 4 : sidebar + search + stats améliorées)
// ─────────────────────────────────────────────────────────────────────
//
// Gating Business : seuls les plans 'business' et 'enterprise' (alias
// legacy) accèdent au Kanban. Les autres voient un upgrade CTA + la
// waitlist beta (héritée de la phase 1 du module).
//
// Phase 4 :
//   - Ajout CrmSidebar à côté du content pour cohérence avec /contacts
//   - Search bar avec debounce 300ms (filtre title + contact name/company)
//   - Stats enrichies : gagnés du mois, pipeline pondéré, taux closing 30j
//   - Pipeline switcher si l'user a plusieurs pipelines
//   - Skeleton loading
// ─────────────────────────────────────────────────────────────────────

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  KanbanSquare, Plus, AlertCircle, Sparkles, Lock,
  TrendingUp, Inbox, Search, X, ChevronDown, Target, Percent,
} from 'lucide-react';
import TopBar from '@/components/TopBar';
import { getSupabase } from '@/lib/supabase';
import { formatDealValue, calculatePipelineStats } from '@/lib/crm';
import CrmSidebar from '@/components/crm/CrmSidebar';
import KanbanBoard from '@/components/crm/KanbanBoard';
import NewDealModal from '@/components/crm/NewDealModal';
import DealDetailDrawer from '@/components/crm/DealDetailDrawer';
import WaitlistForm from './WaitlistForm';

const BUSINESS_PLANS = ['business', 'enterprise'];

// ─── Skeleton loader pour le Kanban ──────────────────────────
function KanbanSkeleton() {
  return (
    <div className="flex gap-3 px-1 overflow-hidden">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="flex-shrink-0 w-[300px] rounded-xl border border-line bg-surface-elevated/40"
        >
          <div className="px-3 py-2.5 border-b border-line">
            <div className="h-3 w-24 bg-zinc-200 rounded animate-pulse" />
          </div>
          <div className="px-3 py-1.5 border-b border-line">
            <div className="h-3 w-16 bg-zinc-200 rounded animate-pulse" />
          </div>
          <div className="p-2 space-y-2">
            {[0, 1, 2].map((j) => (
              <div
                key={j}
                className="rounded-lg border border-line bg-surface-card p-3"
              >
                <div className="h-2 w-24 bg-zinc-200 rounded animate-pulse mb-2" />
                <div className="h-3 w-3/4 bg-zinc-200 rounded animate-pulse mb-2" />
                <div className="flex justify-between">
                  <div className="h-2 w-12 bg-zinc-200 rounded animate-pulse" />
                  <div className="h-2 w-12 bg-zinc-200 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function CrmAppPage() {
  const router = useRouter();

  // ─── Auth + plan ──────────────────────────────────────────
  const [user, setUser] = useState(null);
  const [plan, setPlan] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ─── Data ────────────────────────────────────────────────
  const [pipelines, setPipelines] = useState([]);
  const [pipelineId, setPipelineId] = useState(null);
  const [deals, setDeals] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState('');
  const [pipelineMenuOpen, setPipelineMenuOpen] = useState(false);

  // ─── UI state ────────────────────────────────────────────
  const [newDealOpen, setNewDealOpen] = useState(false);
  const [newDealStageId, setNewDealStageId] = useState(null);
  const [selectedDealId, setSelectedDealId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'open' | 'won' | 'lost'

  // ─── Search ──────────────────────────────────────────────
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  // Debounce 300ms
  useEffect(() => {
    const h = setTimeout(() => setSearch(searchInput.trim().toLowerCase()), 300);
    return () => clearTimeout(h);
  }, [searchInput]);

  // ───────────────────────────────────────────────────────────
  // 1. Auth + plan resolution
  // ───────────────────────────────────────────────────────────
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
      setPlan(profile?.plan || 'free');
      setAuthChecked(true);
    });
  }, [router]);

  const hasBusinessAccess = plan && BUSINESS_PLANS.includes(plan);
  const pipeline = useMemo(
    () => pipelines.find((p) => p.id === pipelineId) || null,
    [pipelines, pipelineId]
  );

  // ───────────────────────────────────────────────────────────
  // 2. Fetch pipelines + contacts (une fois)
  // ───────────────────────────────────────────────────────────
  const fetchPipelinesAndContacts = useCallback(async () => {
    if (!hasBusinessAccess) return;
    setDataLoading(true);
    setDataError('');
    try {
      const pipeRes = await fetch('/api/crm/pipelines');
      const pipeData = await pipeRes.json();
      if (!pipeRes.ok) throw new Error(pipeData.error || 'Erreur pipelines');
      const list = Array.isArray(pipeData.data) ? pipeData.data : [];
      setPipelines(list);
      const def = list.find((p) => p.is_default) || list[0];
      if (def) setPipelineId(def.id);

      const contactsRes = await fetch('/api/crm/contacts?limit=100');
      const contactsData = await contactsRes.json();
      if (contactsRes.ok) setContacts(contactsData.data || []);
    } catch (err) {
      console.error('[CRM] fetchPipelinesAndContacts error', err);
      setDataError(err.message || 'Erreur chargement');
    } finally {
      setDataLoading(false);
    }
  }, [hasBusinessAccess]);

  // ───────────────────────────────────────────────────────────
  // 3. Fetch deals (re-fetch quand on change de pipeline)
  // ───────────────────────────────────────────────────────────
  const fetchDeals = useCallback(async () => {
    if (!hasBusinessAccess || !pipelineId) return;
    setDataLoading(true);
    setDataError('');
    try {
      const dealsRes = await fetch(`/api/crm/deals?pipeline_id=${pipelineId}`);
      const dealsData = await dealsRes.json();
      if (!dealsRes.ok) throw new Error(dealsData.error || 'Erreur deals');
      setDeals(dealsData.data || []);
    } catch (err) {
      console.error('[CRM] fetchDeals error', err);
      setDataError(err.message || 'Erreur chargement deals');
    } finally {
      setDataLoading(false);
    }
  }, [hasBusinessAccess, pipelineId]);

  useEffect(() => {
    if (authChecked && hasBusinessAccess) fetchPipelinesAndContacts();
  }, [authChecked, hasBusinessAccess, fetchPipelinesAndContacts]);

  useEffect(() => {
    if (pipelineId) fetchDeals();
  }, [pipelineId, fetchDeals]);

  // ───────────────────────────────────────────────────────────
  // 4. Drag-drop : optimistic update
  // ───────────────────────────────────────────────────────────
  async function handleDealMove(dealId, newStageId, position) {
    if (!pipeline) return;
    const targetStage = pipeline.stages.find((s) => s.id === newStageId);
    if (!targetStage) return;

    const snapshot = [...deals];

    let newStatus = 'open';
    let closedAt = null;
    if (targetStage.closing_type === 'won') {
      newStatus = 'won';
      closedAt = new Date().toISOString();
    } else if (targetStage.closing_type === 'lost') {
      newStatus = 'lost';
      closedAt = new Date().toISOString();
    }

    setDeals((prev) =>
      prev.map((d) =>
        d.id === dealId
          ? {
              ...d,
              stage_id: newStageId,
              position,
              status: newStatus,
              closed_at: closedAt,
              stage: targetStage,
            }
          : d
      )
    );

    try {
      const res = await fetch(`/api/crm/deals/${dealId}/move`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage_id: newStageId, position }),
      });
      const data = await res.json();
      if (!res.ok) {
        console.error('[CRM] move failed', data);
        setDataError(data.error || 'Erreur déplacement');
        setDeals(snapshot);
        return;
      }
      setDeals((prev) => prev.map((d) => (d.id === dealId ? { ...d, ...data.data } : d)));
    } catch (err) {
      console.error('[CRM] move error', err);
      setDataError('Erreur réseau');
      setDeals(snapshot);
    }
  }

  // ───────────────────────────────────────────────────────────
  // 5. Callbacks NewDeal / Detail
  // ───────────────────────────────────────────────────────────
  function handleNewDeal(stageId = null) {
    setNewDealStageId(stageId);
    setNewDealOpen(true);
  }

  function handleDealCreated(newDeal) {
    setDeals((prev) => [newDeal, ...prev]);
  }

  function handleDealUpdated(updatedDeal) {
    setDeals((prev) => prev.map((d) => (d.id === updatedDeal.id ? { ...d, ...updatedDeal } : d)));
  }

  function handleDealDeleted(dealId) {
    setDeals((prev) => prev.filter((d) => d.id !== dealId));
  }

  // ───────────────────────────────────────────────────────────
  // 6. Filtrage : status + search
  // ───────────────────────────────────────────────────────────
  const filteredDeals = useMemo(() => {
    let list = deals;
    if (statusFilter !== 'all') {
      list = list.filter((d) => d.status === statusFilter);
    }
    if (search) {
      list = list.filter((d) => {
        const title = (d.title || '').toLowerCase();
        const cname = (d.contact?.name || '').toLowerCase();
        const ccompany = (d.contact?.company || '').toLowerCase();
        return (
          title.includes(search) ||
          cname.includes(search) ||
          ccompany.includes(search)
        );
      });
    }
    return list;
  }, [deals, statusFilter, search]);

  // ───────────────────────────────────────────────────────────
  // 7. Stats (sur tous les deals, pas le filtre)
  // ───────────────────────────────────────────────────────────
  const stats = useMemo(() => calculatePipelineStats(deals), [deals]);

  // ─────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────

  // Loading auth
  if (!authChecked) {
    return (
      <div className="min-h-screen bg-surface-base flex items-center justify-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center animate-pulse">
          <KanbanSquare size={28} className="text-white" />
        </div>
      </div>
    );
  }

  // ── BRANCHE 1 : pas le bon plan → upgrade CTA + waitlist ─────────
  if (!hasBusinessAccess) {
    return (
      <div className="min-h-screen bg-surface-base text-content-primary">
        <TopBar user={user} onToggleSidebar={() => setSidebarOpen((v) => !v)} />
        <main className="relative overflow-hidden">
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-br from-emerald-200/30 via-teal-100/20 to-green-100/10 rounded-full blur-3xl pointer-events-none -z-0"
            aria-hidden="true"
          />
          <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-2xl shadow-emerald-500/30 mb-6">
                <Lock size={32} className="text-white" />
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 bg-clip-text text-transparent mb-4">
                Volia CRM
              </h1>
              <p className="text-base sm:text-lg text-content-secondary leading-relaxed max-w-xl mx-auto mb-2">
                Le CRM, c&apos;est sur le plan{' '}
                <strong className="text-content-primary">Business</strong>.
              </p>
              <p className="text-sm text-content-tertiary">
                Pipeline Kanban, contacts auto-créés depuis les Campagnes, reporting natif. Zéro saisie manuelle.
              </p>
            </div>

            <div className="rounded-2xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 via-surface-base to-teal-50 p-8 sm:p-10 text-center shadow-xl shadow-emerald-500/10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-700 text-xs font-semibold uppercase tracking-wider mb-4">
                <Sparkles size={11} />
                Plan Business
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold mb-2 text-content-primary">
                Passer en Business
              </h2>
              <p className="text-content-secondary text-sm sm:text-base mb-2">
                <span className="text-3xl font-extrabold text-content-primary">99 €</span>
                <span className="text-content-tertiary"> /mois</span>
              </p>
              <p className="text-xs text-content-tertiary mb-6">
                10 000 prospects/mois · CRM complet · Support prioritaire
              </p>
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:-translate-y-0.5 transition-all"
              >
                Voir le plan Business
              </Link>
            </div>

            <div className="mt-10">
              <div className="text-center mb-4">
                <p className="text-xs text-content-tertiary uppercase tracking-wider font-semibold">
                  Ou rejoins la waitlist beta
                </p>
              </div>
              <WaitlistForm />
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ── BRANCHE 2 : Business plan → Kanban opérationnel ──────────────
  return (
    <div className="min-h-screen bg-surface-base text-content-primary flex flex-col">
      <TopBar user={user} onToggleSidebar={() => setSidebarOpen((v) => !v)} />

      <div className="flex flex-1 overflow-hidden">
        <CrmSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* ─── Pipeline header ──────────────────────────────────── */}
          <header className="border-b border-line bg-surface-base sticky top-14 z-30">
            <div className="px-4 sm:px-6 py-3 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0">
                  <KanbanSquare size={18} className="text-white" />
                </div>
                <div className="min-w-0">
                  {/* Pipeline switcher si > 1 */}
                  {pipelines.length > 1 ? (
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setPipelineMenuOpen((v) => !v)}
                        className="inline-flex items-center gap-1.5 text-base sm:text-lg font-bold text-content-primary hover:text-emerald-700 transition-colors group"
                      >
                        <span className="truncate max-w-[16rem]">
                          {pipeline?.name || 'Pipeline'}
                        </span>
                        <ChevronDown
                          size={14}
                          className={`text-content-tertiary group-hover:text-emerald-600 transition-transform ${
                            pipelineMenuOpen ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                      {pipelineMenuOpen && (
                        <>
                          <div
                            className="fixed inset-0 z-30"
                            onClick={() => setPipelineMenuOpen(false)}
                          />
                          <div className="absolute top-full left-0 mt-1 z-40 min-w-[14rem] rounded-lg border border-line bg-surface-base shadow-lg py-1">
                            {pipelines.map((p) => (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => {
                                  setPipelineId(p.id);
                                  setPipelineMenuOpen(false);
                                }}
                                className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between gap-2 transition-colors ${
                                  p.id === pipelineId
                                    ? 'bg-emerald-50 text-emerald-700 font-semibold'
                                    : 'text-content-primary hover:bg-surface-elevated'
                                }`}
                              >
                                <span className="truncate">{p.name}</span>
                                {p.is_default && (
                                  <span className="text-[9px] uppercase tracking-wider text-content-tertiary font-semibold">
                                    Défaut
                                  </span>
                                )}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    <h1 className="text-base sm:text-lg font-bold text-content-primary truncate">
                      {pipeline?.name || 'Pipeline commercial'}
                    </h1>
                  )}
                  {/* Stats line */}
                  <div className="flex items-center gap-x-3 gap-y-1 text-[11px] sm:text-xs text-content-tertiary mt-0.5 flex-wrap">
                    <span className="inline-flex items-center gap-1">
                      <Inbox size={11} />
                      <span className="tabular-nums font-semibold text-content-secondary">
                        {stats.openCount}
                      </span>
                      <span>deals ouverts</span>
                    </span>
                    <span className="text-content-faint">·</span>
                    <span className="inline-flex items-center gap-1">
                      <TrendingUp size={11} className="text-emerald-600" />
                      <span className="tabular-nums font-semibold text-content-secondary">
                        {formatDealValue(stats.totalOpenValue)}
                      </span>
                    </span>
                    {stats.weightedPipeline > 0 && (
                      <>
                        <span className="text-content-faint">·</span>
                        <span
                          className="inline-flex items-center gap-1"
                          title="Pipeline pondéré : somme des deals × probabilité de leur stage"
                        >
                          <Target size={11} className="text-violet-600" />
                          <span className="tabular-nums font-semibold text-content-secondary">
                            {formatDealValue(stats.weightedPipeline)}
                          </span>
                          <span>pondéré</span>
                        </span>
                      </>
                    )}
                    {stats.wonCountMonth > 0 && (
                      <>
                        <span className="text-content-faint">·</span>
                        <span className="inline-flex items-center gap-1 text-emerald-700">
                          <span className="tabular-nums font-semibold">
                            {stats.wonCountMonth}
                          </span>
                          <span>gagnés ce mois</span>
                          <span className="tabular-nums font-semibold">
                            ({formatDealValue(stats.wonValueMonth)})
                          </span>
                        </span>
                      </>
                    )}
                    {stats.closingRate30d !== null && (
                      <>
                        <span className="text-content-faint">·</span>
                        <span
                          className="inline-flex items-center gap-1"
                          title="Taux de closing sur les 30 derniers jours : gagnés / (gagnés + perdus)"
                        >
                          <Percent size={11} className="text-blue-600" />
                          <span className="tabular-nums font-semibold text-content-secondary">
                            {stats.closingRate30d}%
                          </span>
                          <span>closing 30j</span>
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                {/* Search */}
                <div className="relative flex-1 sm:flex-initial sm:w-60">
                  <Search
                    size={13}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-content-tertiary pointer-events-none"
                  />
                  <input
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Rechercher un deal…"
                    className="w-full pl-8 pr-8 py-1.5 rounded-lg border border-line bg-surface-card text-xs text-content-primary placeholder:text-content-muted focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  />
                  {searchInput && (
                    <button
                      type="button"
                      onClick={() => setSearchInput('')}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-content-tertiary hover:text-content-primary"
                      aria-label="Effacer la recherche"
                    >
                      <X size={11} />
                    </button>
                  )}
                </div>

                {/* Status filter */}
                <div className="inline-flex items-center rounded-lg border border-line bg-surface-card p-0.5">
                  {[
                    { value: 'all', label: 'Tous' },
                    { value: 'open', label: 'Ouverts' },
                    { value: 'won', label: 'Gagnés' },
                    { value: 'lost', label: 'Perdus' },
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

                <button
                  type="button"
                  onClick={() => handleNewDeal(null)}
                  disabled={!pipeline}
                  className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-md shadow-emerald-500/20 hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50"
                >
                  <Plus size={14} />
                  <span className="hidden sm:inline">Nouveau deal</span>
                  <span className="sm:hidden">Deal</span>
                </button>
              </div>
            </div>

            {/* Error banner */}
            {dataError && (
              <div className="px-4 sm:px-6 pb-3">
                <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-700">
                  <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                  <p className="text-xs font-medium flex-1">{dataError}</p>
                  <button
                    type="button"
                    onClick={() => setDataError('')}
                    className="text-rose-500 hover:text-rose-700"
                    aria-label="Fermer"
                  >
                    ×
                  </button>
                </div>
              </div>
            )}
          </header>

          {/* ─── Kanban content ──────────────────────────────────── */}
          <section className="flex-1 px-3 sm:px-5 py-4 bg-gradient-to-br from-emerald-50/30 via-surface-base to-teal-50/20 overflow-hidden">
            {dataLoading && !pipeline ? (
              <KanbanSkeleton />
            ) : !pipeline ? (
              <div className="text-center py-20 text-content-tertiary">
                <p className="text-sm">Aucun pipeline trouvé. Rechargez la page.</p>
              </div>
            ) : deals.length === 0 ? (
              // ─── EMPTY STATE (aucun deal du tout) ──────────────
              <div className="max-w-md mx-auto py-16 text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 border border-emerald-200 mb-5">
                  <KanbanSquare size={32} className="text-emerald-600" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-content-primary mb-2">
                  Ton pipeline est tout neuf.
                </h2>
                <p className="text-sm text-content-secondary mb-6">
                  C&apos;est l&apos;occasion de le remplir. Crée un premier deal et trace-le du lead au closing.
                </p>
                <button
                  type="button"
                  onClick={() => handleNewDeal(null)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:-translate-y-0.5 transition-all"
                >
                  <Plus size={16} />
                  Premier deal
                </button>
                <p className="text-[11px] text-content-tertiary mt-4">
                  Tip : drag-and-drop pour faire avancer les deals d&apos;une étape à l&apos;autre.
                </p>
              </div>
            ) : (
              <KanbanBoard
                pipeline={pipeline}
                deals={filteredDeals}
                onDealMove={handleDealMove}
                onDealClick={(d) => setSelectedDealId(d.id)}
                onNewDeal={handleNewDeal}
              />
            )}
          </section>
        </main>
      </div>

      {/* Modals */}
      <NewDealModal
        open={newDealOpen}
        onClose={() => setNewDealOpen(false)}
        onCreated={handleDealCreated}
        pipelineId={pipeline?.id}
        defaultStageId={newDealStageId || pipeline?.stages?.[0]?.id}
        stages={pipeline?.stages || []}
        contacts={contacts}
      />

      <DealDetailDrawer
        dealId={selectedDealId}
        stages={pipeline?.stages || []}
        onClose={() => setSelectedDealId(null)}
        onUpdate={handleDealUpdated}
        onDelete={handleDealDeleted}
      />
    </div>
  );
}
