"use client";

import { useState, useMemo, useCallback, useEffect, useRef, memo, lazy, Suspense } from "react";
import { createPortal } from "react-dom";
import {
  Download,
  Trash2,
  Zap,
  Square,
  Search,
  ExternalLink,
  Mail,
  Phone,
  Globe,
  ChevronLeft,
  ChevronRight,
  Inbox,
  Copy,
  Check,
  AlertTriangle,
  Folder,
  FolderOpen,
  Archive,
  X,
  Pencil,
  Save,
  MoreVertical,
  Columns3,
  CheckSquare,
  SquareIcon,
  CheckCircle,
  ShieldCheck,
  Eye,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  KanbanSquare,
  Lock,
  Send,
} from "lucide-react";
import { DEPTS } from "@/lib/constants";
import { computeLeadScore, getScoreLabel } from "@/lib/scoring";
import { useI18n } from "@/lib/i18n";
import { Info } from "lucide-react";
import OnboardingHint from "@/components/OnboardingHint";
// Modal Prospection → Campagnes (lazy : non-critique au render initial)
const SendToCampagneModal = lazy(() => import("@/components/SendToCampagneModal"));

// Reusable tooltip on hover — rendered via portal into document.body to escape all overflow containers
function InfoTooltip({ text, wide }) {
  const [show, setShow] = useState(false);
  const [style, setStyle] = useState({});
  const wrapRef = useRef(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  function handleEnter() {
    if (!wrapRef.current) return;
    const rect = wrapRef.current.getBoundingClientRect();
    const tipW = wide ? 224 : 176; // w-56 = 224px, w-44 = 176px
    const tipH = 60; // approximate height
    // Clamp horizontal so tooltip stays in viewport
    let left = Math.min(Math.max(rect.left + rect.width / 2, tipW / 2 + 8), window.innerWidth - tipW / 2 - 8);
    // Show above if not enough room below (e.g. near bottom of viewport)
    const showAbove = rect.bottom + tipH + 8 > window.innerHeight;
    const top = showAbove ? rect.top - tipH - 6 : rect.bottom + 6;
    setStyle({ position: 'fixed', top, left, transform: 'translateX(-50%)' });
    setShow(true);
  }

  return (
    <span ref={wrapRef} className="inline-flex ml-1 cursor-help" onMouseEnter={handleEnter} onMouseLeave={() => setShow(false)}>
      <Info size={11} className="text-content-faint hover:text-content-tertiary transition-colors" />
      {show && mounted && createPortal(
        <div
          style={style}
          className={`px-2.5 py-1.5 bg-surface-card border border-line-hover rounded-lg text-[10px] text-content-secondary leading-relaxed pointer-events-none z-[99999] shadow-2xl whitespace-normal ${wide ? 'w-56' : 'w-44'}`}
        >
          {text}
        </div>,
        document.body
      )}
    </span>
  );
}

function EnrichmentProgressBanner({
  isEnriching, isDeepEnriching, isWaterfallEnriching,
  enrichProgress, deepEnrichProgress, waterfallProgress,
  onStopEnrichment,
  enrichStartTime, justFinished, onDismissFinished,
}) {
  const { t } = useI18n();
  const isRunning = isEnriching || isDeepEnriching || isWaterfallEnriching;
  if (!isRunning && !justFinished) return null;

  // Tous les modes d'enrichissement partagent la même couleur d'accent
  // (violet/indigo brand) — le LABEL change, pas la palette. Évite le bruit
  // visuel d'un système 3-couleurs anxiogène pendant les opérations longues.
  let progress, methodLabel;
  if (isWaterfallEnriching || (justFinished && justFinished.type === "waterfall")) {
    progress = waterfallProgress;
    methodLabel = t('results.waterfallPro');
  } else if (isDeepEnriching || (justFinished && justFinished.type === "deep")) {
    progress = deepEnrichProgress;
    methodLabel = t('results.deepEnrich');
  } else {
    progress = enrichProgress;
    methodLabel = "Scraping";
  }
  // Gradient brand unifié (violet → indigo)
  const accentFrom = "from-violet-600";
  const accentTo = "to-indigo-600";

  const current = progress?.current || 0;
  const total = progress?.total || 0;
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;
  const currentSite = progress?.currentSite || "";

  const logs = progress?.logs || [];
  const successCount = logs.filter(function (l) {
    return l.startsWith("Found:") || l.startsWith("+ ") || /^\s+[~\u2713]/.test(l);
  }).length;
  const errorCount = logs.filter(function (l) {
    return l.startsWith("Error:") || l.startsWith("x ") || /^\s+\u2717/.test(l);
  }).length;

  const waterfallStats = waterfallProgress?.stats || {};
  const waterfallFound = Object.values(waterfallStats).reduce(function (a, b) { return a + b; }, 0);

  const emailsFound = (isWaterfallEnriching || (justFinished && justFinished.type === "waterfall"))
    ? waterfallFound
    : (progress?.foundScrape || 0) + (progress?.foundGuess || 0) || successCount;

  let etaStr = "";
  if (isRunning && current > 0 && total > 0 && enrichStartTime) {
    const elapsed = (Date.now() - enrichStartTime) / 1000;
    const rate = current / elapsed;
    const remaining = total - current;
    const etaSeconds = Math.round(remaining / rate);
    if (etaSeconds < 60) {
      etaStr = "~" + etaSeconds + "s";
    } else if (etaSeconds < 3600) {
      const mins = Math.floor(etaSeconds / 60);
      const secs = etaSeconds % 60;
      etaStr = "~" + mins + "m" + (secs > 0 ? " " + secs + "s" : "");
    } else {
      const hrs = Math.floor(etaSeconds / 3600);
      const mins = Math.floor((etaSeconds % 3600) / 60);
      etaStr = "~" + hrs + "h " + mins + "m";
    }
  }

  if (justFinished && !isRunning) {
    const totalEmails = justFinished.emailsFound || 0;
    const totalProspects = justFinished.total || 0;
    return (
      <div className="fixed bottom-0 left-0 right-0 z-[60] md:left-64">
        <div className="mx-auto max-w-6xl px-4 pb-4">
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-emerald-500/30 bg-surface-card shadow-2xl shadow-emerald-900/10 backdrop-blur-xl">
            <div className="p-2 rounded-lg bg-emerald-500/10">
              <CheckCircle2 size={18} className="text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-content-primary">{t('results.enrichmentDone')}</div>
              <div className="text-xs text-content-muted mt-0.5">
                {t('results.emailFoundCount', { count: totalEmails, plural: totalEmails > 1 ? 's' : '', plural2: totalEmails > 1 ? 's' : '', total: totalProspects, plural3: totalProspects > 1 ? 's' : '' })}
                {justFinished.errors > 0 && (
                  <span className="text-red-400 ml-2">({t('results.errorCount', { count: justFinished.errors, plural: justFinished.errors > 1 ? 's' : '' })})</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-right hidden sm:block">
                <div className="text-lg font-bold font-mono text-emerald-400 tabular-nums">
                  {totalProspects > 0 ? Math.round((totalEmails / totalProspects) * 100) : 0}%
                </div>
                <div className="text-[10px] text-content-faint">{t('results.successRate')}</div>
              </div>
              <button onClick={onDismissFinished} className="p-2 rounded-lg text-content-faint hover:text-content-secondary hover:bg-surface-elevated transition" aria-label={t('results.close')}>
                <X size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[60] md:left-64">
      <div className="mx-auto max-w-6xl px-4 pb-4">
        <div className="rounded-2xl border border-line-hover bg-surface-card shadow-2xl backdrop-blur-xl overflow-hidden">
          <div className="h-1.5 bg-surface-elevated">
            <div className={`h-full bg-gradient-to-r ${accentFrom} ${accentTo} transition-all duration-500 ease-out`} style={{ width: pct + "%" }} />
          </div>
          <div className="px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 shrink-0">
                <Loader2 size={16} className="text-violet-400 animate-spin" />
                <span className="text-xs font-semibold text-content-primary">{methodLabel}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-mono text-content-secondary tabular-nums">{current}{" / "}{total}{" "}{t('results.prospectsEnriched')}</span>
                <span className="text-[10px] font-mono text-content-muted tabular-nums">{"("}{pct}{"%)"}</span>
              </div>
              {currentSite && (
                <div className="hidden sm:flex items-center gap-1.5 min-w-0 flex-1">
                  <Globe size={11} className="text-content-faint shrink-0" />
                  <span className="text-[11px] text-content-muted truncate font-mono">{currentSite}</span>
                </div>
              )}
              <div className="flex items-center gap-3 ml-auto shrink-0">
                <div className="hidden sm:flex items-center gap-2.5">
                  <div className="flex items-center gap-1" title={t('results.emailsFound')}>
                    <CheckCircle2 size={12} className="text-emerald-400" />
                    <span className="text-[11px] font-mono text-emerald-400 tabular-nums">{emailsFound}</span>
                  </div>
                  {errorCount > 0 && (
                    <div className="flex items-center gap-1" title={t('results.errors')}>
                      <XCircle size={12} className="text-red-400/70" />
                      <span className="text-[11px] font-mono text-red-400/70 tabular-nums">{errorCount}</span>
                    </div>
                  )}
                </div>
                {etaStr && (
                  <div className="hidden md:flex items-center gap-1 text-content-muted" title={t('results.estimatedTime')}>
                    <Clock size={11} />
                    <span className="text-[11px] font-mono tabular-nums">{etaStr}</span>
                  </div>
                )}
                <button onClick={onStopEnrichment} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600/10 border border-red-600/20 text-red-400 text-xs font-semibold transition hover:bg-red-600/20 active:scale-[0.98]">
                  <Square size={12} />
                  <span className="hidden sm:inline">{t('results.stop')}</span>
                </button>
              </div>
            </div>
            <div className="sm:hidden flex items-center gap-3 mt-2 text-[11px]">
              <div className="flex items-center gap-1">
                <CheckCircle2 size={11} className="text-emerald-400" />
                <span className="font-mono text-emerald-400 tabular-nums">{emailsFound}</span>
              </div>
              {errorCount > 0 && (
                <div className="flex items-center gap-1">
                  <XCircle size={11} className="text-red-400/70" />
                  <span className="font-mono text-red-400/70 tabular-nums">{errorCount}</span>
                </div>
              )}
              {etaStr && (
                <div className="flex items-center gap-1 text-content-muted">
                  <Clock size={11} />
                  <span className="font-mono tabular-nums">{etaStr}</span>
                </div>
              )}
              {currentSite && (
                <span className="text-content-muted truncate font-mono flex-1 min-w-0">{currentSite}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// OnboardingHint a été déplacé dans src/components/OnboardingHint.jsx (P2 cleanup).

const shortUrl = (url) => {
  if (!url) return "";
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
};

const PAGE_SIZE = 50;

const EMAIL_METHOD_INFO_KEYS = {
  scrape: { labelKey: "results.badges.siteFound", color: "text-green-400", tipKey: "results.badges.siteFoundDesc" },
  "deep-verified": { labelKey: "results.badges.verified", color: "text-purple-400", tipKey: "results.badges.verifiedDesc" },
  "deep-pattern": { labelKey: "results.badges.guessed", color: "text-purple-400/70", tipKey: "results.badges.guessedDesc" },
  serper: { labelKey: "results.badges.serper", color: "text-yellow-400", tipKey: "results.badges.serperDesc" },
  apollo: { labelKey: "results.badges.apollo", color: "text-orange-600", tipKey: "results.badges.apolloDesc" },
  apollo_org: { labelKey: "results.badges.apolloOrg", color: "text-indigo-400", tipKey: "results.badges.apolloOrgDesc" },
  guess: { labelKey: "results.badges.fallback", color: "text-amber-600", tipKey: "results.badges.fallbackDesc" },
};

// Helper to resolve EMAIL_METHOD_INFO with t()
function getEmailMethodInfo(method, t) {
  const info = EMAIL_METHOD_INFO_KEYS[method];
  if (!info) return null;
  return { label: t(info.labelKey), color: info.color, tip: t(info.tipKey) };
}

// Email quality badge component
function EmailBadge({ method }) {
  const { t } = useI18n();
  if (!method) return null;

  // Group methods into quality tiers
  if (method === 'scrape' || method === 'deep-verified') {
    return (
      <span className="inline-flex items-center gap-0.5 px-1.5 py-[1px] rounded-full text-[9px] font-semibold bg-green-500/15 text-green-400 border border-green-500/20 whitespace-nowrap">
        <CheckCircle size={8} className="flex-shrink-0" />
        {t('results.badges.verifiedShort')}
      </span>
    );
  }

  if (method === 'apollo') {
    return (
      <span className="inline-flex items-center gap-0.5 px-1.5 py-[1px] rounded-full text-[9px] font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/20 whitespace-nowrap">
        <Zap size={8} className="flex-shrink-0" />
        Apollo
      </span>
    );
  }

  if (method === 'serper') {
    return (
      <span className="inline-flex items-center gap-0.5 px-1.5 py-[1px] rounded-full text-[9px] font-semibold bg-cyan-500/15 text-cyan-400 border border-cyan-500/20 whitespace-nowrap">
        <ShieldCheck size={8} className="flex-shrink-0" />
        Google
      </span>
    );
  }

  if (method === 'deep-pattern') {
    return (
      <span className="inline-flex items-center gap-0.5 px-1.5 py-[1px] rounded-full text-[9px] font-semibold bg-purple-500/15 text-purple-400 border border-purple-500/20 whitespace-nowrap">
        <ShieldCheck size={8} className="flex-shrink-0" />
        Pattern
      </span>
    );
  }

  if (method === 'guess') {
    return (
      <span className="inline-flex items-center gap-0.5 px-1.5 py-[1px] rounded-full text-[9px] font-semibold bg-amber-100 text-amber-600 border border-amber-300 whitespace-nowrap">
        <AlertTriangle size={8} className="flex-shrink-0" />
        {t('results.badges.probableShort')}
      </span>
    );
  }

  return null;
}

const folderColorClass = (color) => {
  const map = { indigo: 'bg-indigo-500', blue: 'bg-blue-500', purple: 'bg-purple-500', green: 'bg-green-500', amber: 'bg-amber-500', rose: 'bg-rose-500' };
  return map[color] || map.indigo;
};

function TagDropdown({ tags, activeTags, onToggle, onCreate }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState('');

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-5 h-5 rounded-full bg-surface-elevated hover:bg-surface-active text-content-tertiary hover:text-content-primary flex items-center justify-center text-xs transition-colors"
      >
        +
      </button>
      {open && (
        <div className="absolute z-50 top-7 left-0 w-48 rounded-lg border border-line bg-surface-card shadow-xl p-2 space-y-1">
          {tags.map(tag => (
            <button
              key={tag.id}
              onClick={() => { onToggle(tag.id); setOpen(false); }}
              className={`w-full text-left px-2 py-1.5 rounded text-xs flex items-center gap-2 hover:bg-surface-elevated transition-colors ${
                activeTags.includes(tag.id) ? 'text-content-primary' : 'text-content-secondary'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-violet-500" />
              {tag.name}
              {activeTags.includes(tag.id) && <span className="ml-auto text-violet-400">&#10003;</span>}
            </button>
          ))}
          <div className="border-t border-line pt-1 mt-1">
            <form onSubmit={(e) => {
              e.preventDefault();
              if (newName.trim()) {
                onCreate?.(newName.trim(), 'violet');
                setNewName('');
                setOpen(false);
              }
            }}>
              <input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder={t('results.newTag')}
                className="w-full px-2 py-1.5 rounded text-xs bg-surface-base border border-line text-content-primary placeholder-content-muted focus:outline-none focus:border-violet-500"
              />
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(function ResultsPanel({
  prospects = [],
  folders = [],
  activeFolder = 'all',
  onActiveFolder,
  onDeleteFolder,
  onStartEnrichment,
  onStopEnrichment,
  onStartDeepEnrichment,
  onStartWaterfallEnrichment,
  isEnriching,
  isDeepEnriching,
  isWaterfallEnriching,
  enrichProgress,
  deepEnrichProgress,
  waterfallProgress,
  onDownloadCSV,
  onDeleteAll,
  tags,
  prospectTagMap,
  onCreateTag,
  onDeleteTag,
  onToggleProspectTag,
  onBulkEnrich,
  userPlan,
  onUpdateProspect,
  onDeleteProspect,
  onBulkDeleteProspects,
  onBulkUpdateProspects,
  onStartSearch,
  onSendToCrm,           // Phase 3 : ({ prospects: [...] }) => void
  hasCrmAccess = false,  // Phase 3 : true si user.plan ∈ {business, enterprise}
}) {
  const { t } = useI18n();
  const [searchText, setSearchText] = useState("");
  const [selectedDept, setSelectedDept] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [page, setPage] = useState(0);
  const [copiedEmail, setCopiedEmail] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [tooltipId, setTooltipId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [actionMenuId, setActionMenuId] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  // Modal "Lancer une campagne" (pont Prospection → Campagnes)
  const [showCampagneModal, setShowCampagneModal] = useState(false);
  const [showColumnPicker, setShowColumnPicker] = useState(false);
  const [showExportPreview, setShowExportPreview] = useState(false);
  // ⚠️ Ce useState DOIT rester avant tout early-return conditionnel.
  // Avant le fix audit P0 #8, il était déclaré ligne 708, après le
  // `if (prospects.length === 0) return ...`. Quand prospects passait de
  // 0 à >0 sans reload, React jetait "Rendered more hooks than during
  // the previous render" → page blanche.
  const [showFolderDelete, setShowFolderDelete] = useState(null);
  const [visibleCols, setVisibleCols] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('leadColumns');
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return { type: true, nom: true, telephone: true, email: true, site: true, note: true, dept: true, score: true, tags: true };
  });

  // Enrichment progress tracking
  const enrichStartTimeRef = useRef(null);
  const [justFinished, setJustFinished] = useState(null);
  const prevEnrichingRef = useRef(false);

  const isAnyEnriching = isEnriching || isDeepEnriching || isWaterfallEnriching;

  useEffect(() => {
    // Detect start: was not enriching, now is
    if (isAnyEnriching && !prevEnrichingRef.current) {
      enrichStartTimeRef.current = Date.now();
      setJustFinished(null);
    }
    // Detect end: was enriching, now is not
    if (!isAnyEnriching && prevEnrichingRef.current) {
      const progress = prevEnrichingRef.wasWaterfall ? waterfallProgress
        : prevEnrichingRef.wasDeep ? deepEnrichProgress
        : enrichProgress;
      const logs = progress?.logs || [];
      const found = logs.filter(function (l) {
        return l.startsWith("Found:") || l.startsWith("+ ") || /^\s+[~\u2713]/.test(l);
      }).length;
      const errors = logs.filter(function (l) {
        return l.startsWith("Error:") || l.startsWith("x ") || /^\s+\u2717/.test(l);
      }).length;
      const waterfallStats = waterfallProgress?.stats || {};
      const waterfallFoundCount = Object.values(waterfallStats).reduce(function (a, b) { return a + b; }, 0);
      const emailsFound = prevEnrichingRef.wasWaterfall
        ? waterfallFoundCount
        : (progress?.foundScrape || 0) + (progress?.foundGuess || 0) || found;

      setJustFinished({
        type: prevEnrichingRef.wasWaterfall ? "waterfall" : prevEnrichingRef.wasDeep ? "deep" : "basic",
        total: progress?.total || 0,
        emailsFound: emailsFound,
        errors: errors,
      });
      enrichStartTimeRef.current = null;
      // Auto-dismiss after 15 seconds
      setTimeout(function () { setJustFinished(null); }, 15000);
    }
    prevEnrichingRef.current = isAnyEnriching;
    prevEnrichingRef.wasWaterfall = isWaterfallEnriching;
    prevEnrichingRef.wasDeep = isDeepEnriching;
  }, [isAnyEnriching, isWaterfallEnriching, isDeepEnriching, enrichProgress, deepEnrichProgress, waterfallProgress]);

  const COLUMNS = [
    { key: 'type', label: t('results.columns.type'), required: false },
    { key: 'nom', label: t('results.columns.name'), required: true },
    { key: 'telephone', label: t('results.columns.phone'), required: false },
    { key: 'email', label: t('results.columns.email'), required: true },
    { key: 'site', label: t('results.columns.website'), required: false },
    { key: 'note', label: t('results.columns.googleRating'), required: false },
    { key: 'dept', label: t('results.columns.department'), required: false },
    { key: 'score', label: t('results.columns.score'), required: false },
    { key: 'tags', label: t('results.columns.tags'), required: false },
  ];

  const toggleColumn = (key) => {
    const col = COLUMNS.find(c => c.key === key);
    if (col?.required) return;
    const next = { ...visibleCols, [key]: !visibleCols[key] };
    setVisibleCols(next);
    try { localStorage.setItem('leadColumns', JSON.stringify(next)); } catch {}
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    // Bug fix P1 #7 (cross-page) : avant on comparait selectedIds.size avec
    // displayProspects.length (50 max par page). Cocher la page 1 puis aller
    // en page 2 affichait à tort "tout coché" et clic = désélection globale.
    // Maintenant on vérifie seulement les ids VISIBLES dans la page courante.
    const visibleIds = displayProspects.map(p => p.id);
    const allVisibleSelected = visibleIds.length > 0 && visibleIds.every(id => selectedIds.has(id));
    if (allVisibleSelected) {
      // Décocher uniquement les visibles, garder les autres pages cochées
      setSelectedIds((prev) => {
        const next = new Set(prev);
        for (const id of visibleIds) next.delete(id);
        return next;
      });
    } else {
      // Cocher les visibles en plus de ce qui était déjà coché
      setSelectedIds((prev) => {
        const next = new Set(prev);
        for (const id of visibleIds) next.add(id);
        return next;
      });
    }
  };

  const deleteSelected = () => {
    // 1 seul round-trip Supabase pour N prospects (P1 perf).
    const ids = Array.from(selectedIds);
    if (onBulkDeleteProspects) {
      onBulkDeleteProspects(ids);
    } else {
      // Fallback si la prop n'est pas passée
      for (const id of ids) onDeleteProspect?.(id);
    }
    setSelectedIds(new Set());
  };

  const startEdit = (prospect) => {
    setEditingId(prospect.id);
    setEditData({
      nom: prospect.nom || '',
      email: prospect.email || '',
      telephone: prospect.telephone || '',
      site_web: prospect.site_web || '',
      adresse: prospect.adresse || '',
    });
    setActionMenuId(null);
  };

  const saveEdit = () => {
    if (editingId && onUpdateProspect) {
      onUpdateProspect(editingId, editData);
    }
    setEditingId(null);
    setEditData({});
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  const confirmDelete = (id) => {
    if (onDeleteProspect) {
      onDeleteProspect(id);
    }
    setDeleteConfirmId(null);
    setActionMenuId(null);
  };

  const isEnterprise = userPlan?.id === 'enterprise';


  // Lookup map tag id → tag (P1 perf).
  // Avant : tags.find(t => t.id === tagId) à chaque tag de chaque ligne à
  // chaque re-render → O(P × T) sur 50 prospects × ~10 tags = 500 itérations
  // de tableau par render. Maintenant O(1) sur le hash.
  const tagsById = useMemo(
    () => Object.fromEntries((tags || []).map((t) => [t.id, t])),
    [tags]
  );

  // Liste dynamique des codes dépt présents dans les prospects (P1 bug fix).
  // Avant : le dropdown utilisait DEPTS (FR uniquement, 101 codes), donc un
  // prospect avec dept='BE-BRU' ou 'CH-GE' était impossible à filtrer.
  // Maintenant on dérive la liste des dépts du contenu réel + libellé via DEPTS.
  const availableDepts = useMemo(() => {
    const codes = new Set();
    for (const p of prospects) {
      if (p.departement) codes.add(p.departement);
    }
    return [...codes].sort().map((code) => ({
      code,
      name: DEPTS[code]?.name || code,
    }));
  }, [prospects]);

  const folderProspects = useMemo(() => {
    // When in 'archived' view, show ONLY archived prospects
    if (activeFolder === 'archived') return prospects.filter((p) => p.archived_at);
    // Otherwise, exclude archived prospects from all views
    const active = prospects.filter((p) => !p.archived_at);
    if (activeFolder === 'all') return active;
    if (activeFolder === 'unassigned') return active.filter((p) => !p.folder_id);
    return active.filter((p) => p.folder_id === activeFolder);
  }, [prospects, activeFolder]);

  const filteredProspects = useMemo(() => {
    return folderProspects.filter((prospect) => {
      const q = searchText.toLowerCase();
      const matchesSearch =
        !searchText ||
        prospect.nom?.toLowerCase().includes(q) ||
        prospect.adresse?.toLowerCase().includes(q) ||
        prospect.telephone?.includes(searchText) ||
        prospect.email?.toLowerCase().includes(q);

      const matchesDept = selectedDept === "all" || prospect.departement === selectedDept;
      const matchesType = selectedType === "all" || prospect.type === selectedType;

      return matchesSearch && matchesDept && matchesType;
    });
  }, [folderProspects, searchText, selectedDept, selectedType]);

  // Reset page when filters change (outside useMemo to avoid setState during render)
  useEffect(() => {
    setPage(0);
  }, [searchText, selectedDept, selectedType]);

  const stats = useMemo(() => {
    const total = folderProspects.length;
    const phones = folderProspects.filter((p) => p.telephone).length;
    const emails = folderProspects.filter((p) => p.email).length;
    const verifiedMethods = new Set(['scrape', 'deep-verified']);
    const verifiedEmails = folderProspects.filter((p) => p.email && verifiedMethods.has(p.email_method)).length;
    const googleEmails = folderProspects.filter((p) => p.email && (p.email_method === 'serper' || p.email_method === 'apollo' || p.email_method === 'apollo_org')).length;
    const guessedEmails = folderProspects.filter((p) => p.email && p.email_method === 'guess').length;
    const otherEmails = emails - verifiedEmails - googleEmails - guessedEmails;
    const websites = folderProspects.filter((p) => p.site_web).length;
    const emailPct = total > 0 ? Math.round((emails / total) * 100) : 0;
    return { total, phones, emails, verifiedEmails, googleEmails, guessedEmails, otherEmails, websites, emailPct };
  }, [folderProspects]);

  const prospectsWithoutEmail = useMemo(() => {
    // Count ALL prospects without email — those with a website will use scraping,
    // those without will get domain discovery via Google first
    return folderProspects.filter((p) => !p.email).length;
  }, [folderProspects]);

  const totalPages = Math.ceil(filteredProspects.length / PAGE_SIZE);
  const displayProspects = filteredProspects.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const enrichProgress_pct = enrichProgress?.total > 0
    ? (enrichProgress.current / enrichProgress.total) * 100
    : 0;

  const getTypeStyle = (type) => {
    switch (type) {
      case "b2b": return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "copro": return "bg-purple-500/10 text-purple-400 border-purple-500/20";
      case "custom": return "bg-amber-500/10 text-amber-600 border-amber-300";
      default: return "bg-surface-elevated text-content-muted border-line";
    }
  };

  const copyEmail = useCallback(async (email, id) => {
    try {
      await navigator.clipboard.writeText(email);
      setCopiedEmail(id);
      setTimeout(() => setCopiedEmail(null), 2000);
    } catch {
      // Clipboard API not available
    }
  }, []);

  // Empty state — un user qui atterrit ici sans prospects est au début de
  // son parcours. CTA explicite vers la recherche + 3 chips presets pour
  // l'inspirer sur ce qu'il peut chercher.
  if (prospects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 sm:py-24 px-6 max-w-2xl mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/15 to-violet-500/15 border border-indigo-500/30 flex items-center justify-center mb-6">
          <Inbox size={28} className="text-indigo-400" />
        </div>
        <h3 className="text-xl sm:text-2xl font-bold text-content-primary mb-2 text-center">
          {t('results.noProspects') || 'On va te trouver des prospects.'}
        </h3>
        <p className="text-sm text-content-tertiary text-center max-w-md mb-7 leading-relaxed">
          Dis-moi qui tu cherches et dans quel département. Tu auras une liste avec emails dans 30 secondes.
        </p>
        <button
          type="button"
          onClick={() => onStartSearch && onStartSearch()}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02]"
        >
          <Search size={16} />
          Lancer une recherche
        </button>
        {/* Suggestions de recherches populaires pour inspirer */}
        <div className="mt-7 flex flex-wrap items-center justify-center gap-2">
          <span className="text-[11px] uppercase tracking-wider text-content-muted font-semibold">Inspire-toi :</span>
          {['Restaurants à Paris', 'Avocats à Lyon', 'Agences web 75'].map((idea) => (
            <button
              key={idea}
              type="button"
              onClick={() => onStartSearch && onStartSearch()}
              className="px-3 py-1 rounded-full border border-line bg-surface-card hover:border-indigo-500/40 hover:bg-indigo-500/[0.06] text-xs text-content-secondary hover:text-content-primary transition"
            >
              {idea}
            </button>
          ))}
        </div>
      </div>
    );
  }

  const handleDeleteFolder = (folderId) => {
    if (showFolderDelete === folderId) {
      onDeleteFolder(folderId);
      setShowFolderDelete(null);
    } else {
      setShowFolderDelete(folderId);
      setTimeout(() => setShowFolderDelete(null), 3000);
    }
  };

  const handleExport = (format) => {
    onDownloadCSV(format, folderProspects);
  };

  const handleDeleteAll = () => {
    if (showDeleteConfirm) {
      onDeleteAll(activeFolder !== 'all' ? activeFolder : undefined);
      setShowDeleteConfirm(false);
    } else {
      setShowDeleteConfirm(true);
      setTimeout(() => setShowDeleteConfirm(false), 3000);
    }
  };

  // Count prospects per folder (exclude archived from regular counts)
  const folderCounts = useMemo(() => {
    const counts = { all: 0, unassigned: 0, archived: 0 };
    for (const p of prospects) {
      if (p.archived_at) {
        counts.archived++;
        continue;
      }
      counts.all++;
      if (!p.folder_id) counts.unassigned++;
      else counts[p.folder_id] = (counts[p.folder_id] || 0) + 1;
    }
    return counts;
  }, [prospects]);

  return (
    <div className="space-y-4">
      {/* Folder tabs */}
      {folders.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => onActiveFolder('all')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium border whitespace-nowrap transition-all ${
              activeFolder === 'all'
                ? 'bg-surface-elevated border-line-hover text-content-primary'
                : 'border-transparent text-content-muted hover:text-content-secondary hover:bg-surface-card'
            }`}
          >
            <FolderOpen size={13} />
            {t('results.allFolders')}
            <span className="font-mono text-[10px] opacity-60">{folderCounts.all}</span>
          </button>
          {folders.map((f) => (
            <div key={f.id} className="relative group/folder flex items-center">
              <button
                onClick={() => onActiveFolder(f.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium border whitespace-nowrap transition-all ${
                  activeFolder === f.id
                    ? 'bg-surface-elevated border-line-hover text-content-primary'
                    : 'border-transparent text-content-muted hover:text-content-secondary hover:bg-surface-card'
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${folderColorClass(f.color)}`} />
                {f.name}
                <span className="font-mono text-[10px] opacity-60">{folderCounts[f.id] || 0}</span>
              </button>
              <button
                onClick={() => handleDeleteFolder(f.id)}
                className={`ml-0.5 p-1 rounded-md transition-all ${
                  showFolderDelete === f.id
                    ? 'bg-red-600/20 text-red-400'
                    : 'opacity-0 group-hover/folder:opacity-100 text-content-faint hover:text-red-400 hover:bg-red-600/10'
                }`}
                title={showFolderDelete === f.id ? t('results.confirmDelete') : t('results.deleteList')}
              >
                {showFolderDelete === f.id ? <AlertTriangle size={11} /> : <X size={11} />}
              </button>
            </div>
          ))}
          {prospects.some((p) => !p.archived_at && !p.folder_id) && (
            <button
              onClick={() => onActiveFolder('unassigned')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium border whitespace-nowrap transition-all ${
                activeFolder === 'unassigned'
                  ? 'bg-surface-elevated border-line-hover text-content-primary'
                  : 'border-transparent text-content-faint hover:text-content-tertiary hover:bg-surface-card'
              }`}
            >
              <Folder size={13} />
              {t('results.unclassified')}
              <span className="font-mono text-[10px] opacity-60">{folderCounts.unassigned}</span>
            </button>
          )}
          {folderCounts.archived > 0 && (
            <button
              onClick={() => onActiveFolder('archived')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium border whitespace-nowrap transition-all ${
                activeFolder === 'archived'
                  ? 'bg-zinc-500/10 border-zinc-500/30 text-content-secondary'
                  : 'border-transparent text-content-faint hover:text-content-tertiary hover:bg-surface-card'
              }`}
              title="Prospects enrichis sans email trouve"
            >
              <Archive size={13} />
              Archives
              <span className="font-mono text-[10px] opacity-60">{folderCounts.archived}</span>
            </button>
          )}
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Prospects */}
        <div className="flex items-center gap-3 p-4 rounded-2xl border border-indigo-500/20 bg-surface-card hover:border-indigo-500/30 transition-colors">
          <div className="p-2 rounded-lg bg-indigo-500/10">
            <Search size={16} className="text-indigo-400" />
          </div>
          <div>
            <div className="text-xl font-bold font-mono text-indigo-400 tabular-nums">{stats.total}</div>
            <div className="text-[10px] text-content-faint uppercase tracking-wider flex items-center">{t('results.prospects')}<InfoTooltip text={t('results.totalTooltip')} /></div>
          </div>
        </div>

        {/* Emails — with completion bar and breakdown */}
        <div className="flex items-center gap-3 p-4 rounded-2xl border border-line bg-surface-card hover:border-line-hover transition-colors">
          <div className="p-2 rounded-lg bg-green-500/10">
            <Mail size={16} className="text-green-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold font-mono text-green-400 tabular-nums">{stats.emails}</span>
              <span className="text-[10px] text-content-faint font-mono">({stats.emailPct}%)</span>
            </div>
            <div className="text-[10px] text-content-faint uppercase tracking-wider flex items-center">
              {t('results.emails')}
              <InfoTooltip text={t('results.emailBreakdown', { verified: stats.verifiedEmails, guessed: stats.guessedEmails, other: stats.otherEmails > 0 ? `, ${stats.otherEmails} ${t('results.otherCount', { count: '' }).trim()}` : '' })} wide />
            </div>
            {stats.emails > 0 && (
              <div className="flex flex-wrap gap-x-2 gap-y-0.5 mt-1">
                {stats.verifiedEmails > 0 && (
                  <span className="text-[9px] text-green-400 font-medium">{t('results.verifiedCount', { count: stats.verifiedEmails })}</span>
                )}
                {stats.googleEmails > 0 && (
                  <span className="text-[9px] text-yellow-400 font-medium">{t('results.otherCount', { count: stats.googleEmails })} Google</span>
                )}
                {stats.guessedEmails > 0 && (
                  <span className="text-[9px] text-amber-600 font-medium">{t('results.probableCount', { count: stats.guessedEmails })}</span>
                )}
                {stats.otherEmails > 0 && (
                  <span className="text-[9px] text-cyan-400 font-medium">{t('results.otherCount', { count: stats.otherEmails })}</span>
                )}
              </div>
            )}
            <div className="w-full h-1.5 bg-surface-elevated rounded-full mt-1.5 overflow-hidden flex">
              {stats.verifiedEmails > 0 && (
                <div className="h-full bg-green-500/70 transition-all duration-500" style={{ width: `${(stats.verifiedEmails / stats.total) * 100}%` }} />
              )}
              {stats.googleEmails > 0 && (
                <div className="h-full bg-yellow-500/70 transition-all duration-500" style={{ width: `${(stats.googleEmails / stats.total) * 100}%` }} />
              )}
              {stats.otherEmails > 0 && (
                <div className="h-full bg-cyan-500/70 transition-all duration-500" style={{ width: `${(stats.otherEmails / stats.total) * 100}%` }} />
              )}
              {stats.guessedEmails > 0 && (
                <div className="h-full bg-amber-500/40 transition-all duration-500" style={{ width: `${(stats.guessedEmails / stats.total) * 100}%` }} />
              )}
            </div>
          </div>
        </div>

        {/* Telephones */}
        <div className="flex items-center gap-3 p-4 rounded-2xl border border-line bg-surface-card hover:border-line-hover transition-colors">
          <div className="p-2 rounded-lg bg-surface-elevated">
            <Phone size={16} className="text-content-secondary" />
          </div>
          <div>
            <div className="text-xl font-bold font-mono text-content-secondary tabular-nums">{stats.phones}</div>
            <div className="text-[10px] text-content-faint uppercase tracking-wider flex items-center">{t('results.phones')}<InfoTooltip text={t('results.phoneTooltip')} /></div>
          </div>
        </div>

        {/* Sites web */}
        <div className="flex items-center gap-3 p-4 rounded-2xl border border-line bg-surface-card hover:border-line-hover transition-colors">
          <div className="p-2 rounded-lg bg-blue-500/10">
            <Globe size={16} className="text-blue-400" />
          </div>
          <div>
            <div className="text-xl font-bold font-mono text-blue-400 tabular-nums">{stats.websites}</div>
            <div className="text-[10px] text-content-faint uppercase tracking-wider flex items-center">{t('results.websites')}<InfoTooltip text={t('results.websiteTooltip')} /></div>
          </div>
        </div>
      </div>

      {/* Onboarding hint: enrichment */}
      {folderProspects.length > 0 && stats.emails === 0 && (
        <OnboardingHint storageKey="hint_enrich_dismissed" dismissLabel={t('results.understood')}>
          {t('results.hintEnrich')}
        </OnboardingHint>
      )}

      {/* Onboarding hint: export */}
      {stats.emails > 0 && (
        <OnboardingHint storageKey="hint_export_dismissed" dismissLabel={t('results.understood')}>
          {t('results.hintExport')}
        </OnboardingHint>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 p-2 sm:p-3 rounded-2xl border border-line bg-surface-card">
        {/* Enrichment — bouton selection-aware. Visible uniquement si l'utilisateur
            a coché des prospects. Le bouton "Enrichir tout (N)" juste à côté
            couvre le cas "rien de coché". Ça évite l'ambiguïté qui faisait
            que cliquer "Enrichir" avec 3 cases cochées enrichissait quand
            même les 75 prospects. */}
        {!isWaterfallEnriching ? (
          selectedIds.size > 0 ? (
            <div className="relative group/tip">
              <button
                onClick={() => {
                  const ids = Array.from(selectedIds);
                  const hasUnenriched = prospects.some(p => ids.includes(p.id) && !p.email);
                  if (hasUnenriched) {
                    onBulkEnrich?.(null, null, ids);
                  }
                }}
                disabled={prospects.length === 0}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 min-h-[44px] sm:min-h-0 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:bg-surface-elevated disabled:text-content-faint text-white text-xs font-semibold transition active:scale-[0.98] disabled:cursor-not-allowed"
              >
                <Zap size={14} />
                {t('results.enrichSelection', { count: selectedIds.size })}
              </button>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-surface-elevated border border-line-hover rounded-xl text-[10px] text-content-secondary w-56 opacity-0 group-hover/tip:opacity-100 pointer-events-none transition-opacity z-20 shadow-xl">
                <div className="font-semibold text-violet-400 mb-1">{t('results.cascadeTitle')}</div>
                <div className="space-y-0.5">
                  <div>1. {t('results.cascadeStep1')}</div>
                  <div>2. {t('results.cascadeStep2')}</div>
                  <div>3. {t('results.cascadeStep3')}</div>
                  <div>4. {t('results.cascadeStep4')}</div>
                </div>
                <div className="text-content-faint mt-1">{t('results.stopsWhenFound')}</div>
              </div>
            </div>
          ) : null
        ) : (
          <div className="flex items-center gap-3">
            <button
              onClick={onStopEnrichment}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600/10 border border-red-600/20 text-red-400 text-xs font-semibold transition hover:bg-red-600/20 active:scale-[0.98]"
            >
              <Square size={14} />
              {t('results.stop')}
            </button>
            <div className="flex items-center gap-2">
              <div className="w-24 h-1.5 bg-surface-elevated rounded-full overflow-hidden">
                <div
                  className="h-full transition-all duration-300 rounded-full bg-gradient-to-r from-violet-500 to-indigo-500"
                  style={{ width: `${waterfallProgress?.total > 0 ? (waterfallProgress.current / waterfallProgress.total) * 100 : 0}%` }}
                />
              </div>
              <span className="text-[10px] font-mono text-content-muted tabular-nums">
                {`${waterfallProgress?.current || 0}/${waterfallProgress?.total || 0}`}
              </span>
            </div>
            <span className="text-[10px] truncate max-w-[150px] hidden sm:block text-violet-400">
              {waterfallProgress?.currentSite || ''}
            </span>
          </div>
        )}

        <div className="flex items-center gap-2">
          <button
            onClick={() => onBulkEnrich?.(activeFolder === 'all' ? null : activeFolder, null)}
            disabled={isWaterfallEnriching || prospectsWithoutEmail === 0}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium bg-violet-600 text-white hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <Zap className="h-3.5 w-3.5" />
            {t('results.enrichAll', { count: prospectsWithoutEmail })}
          </button>
          {activeFolder === 'archived' && folderProspects.length > 0 && (
            <button
              onClick={() => {
                if (!confirm(`Desarchiver ${folderProspects.length} prospect(s) ?`)) return;
                // 1 seul round-trip pour N prospects (P1 perf).
                const ids = folderProspects.map((p) => p.id);
                if (onBulkUpdateProspects) {
                  onBulkUpdateProspects(ids, { archived_at: null });
                } else {
                  folderProspects.forEach((p) => onUpdateProspect?.(p.id, { archived_at: null }));
                }
              }}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium bg-surface-elevated text-content-secondary hover:bg-surface-active transition-all"
              title="Remettre ces prospects dans la liste active"
            >
              <Archive className="h-3.5 w-3.5" />
              Desarchiver tout
            </button>
          )}
        </div>

        <div className="flex-1" />

        {/* Column picker */}
        <div className="relative">
          <button
            onClick={() => setShowColumnPicker(!showColumnPicker)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition ${
              showColumnPicker
                ? 'border-indigo-500/30 bg-indigo-500/10 text-indigo-400'
                : 'border-line hover:bg-surface-elevated text-content-tertiary hover:text-content-primary'
            }`}
            title={t('results.chooseColumns')}
          >
            <Columns3 size={14} />
            <span className="hidden sm:inline">{t('results.columnsLabel')}</span>
          </button>
          {showColumnPicker && (
            <div className="absolute z-50 top-full mt-1 right-0 w-52 rounded-lg border border-line bg-surface-card shadow-xl py-1">
              <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-content-muted font-semibold">
                {t('results.visibleColumns')}
              </div>
              {COLUMNS.map((col) => (
                <button
                  key={col.key}
                  onClick={() => toggleColumn(col.key)}
                  disabled={col.required}
                  className={`w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 transition-colors ${
                    col.required
                      ? 'opacity-50 cursor-not-allowed text-content-tertiary'
                      : 'hover:bg-surface-elevated text-content-secondary cursor-pointer'
                  }`}
                >
                  <span className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] ${
                    visibleCols[col.key]
                      ? 'bg-indigo-600 border-indigo-600 text-white'
                      : 'border-content-faint bg-transparent'
                  }`}>
                    {visibleCols[col.key] && '✓'}
                  </span>
                  {col.label}
                  {col.required && <span className="ml-auto text-[9px] text-content-faint">{t('results.required')}</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Export */}
        <button
          onClick={() => handleExport("standard")}
          disabled={folderProspects.length === 0}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-line hover:bg-surface-elevated text-content-tertiary hover:text-content-primary text-xs font-medium transition disabled:opacity-30"
          title={t('results.exportCSV')}
        >
          <Download size={14} />
          <span className="hidden sm:inline">{t('results.csv')}</span>
        </button>
        {/* Export Preview */}
        <div className="relative">
          <button
            onClick={() => setShowExportPreview(!showExportPreview)}
            disabled={folderProspects.length === 0}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition disabled:opacity-30 ${
              showExportPreview
                ? 'border-indigo-500/40 bg-indigo-500/10 text-indigo-400'
                : 'border-line hover:bg-surface-elevated text-content-tertiary hover:text-content-primary'
            }`}
            title={t('results.exportPreview')}
          >
            <Eye size={14} />
            <span className="hidden sm:inline">{t('results.preview')}</span>
          </button>
          {showExportPreview && folderProspects.length > 0 && (
            <div className="absolute right-0 top-full mt-2 z-50 w-[600px] max-w-[90vw] rounded-xl border border-line bg-surface-elevated shadow-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-line flex items-center justify-between">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-content-faint">{t('results.csvPreview')}</h4>
                <button
                  onClick={() => setShowExportPreview(false)}
                  className="p-1 rounded hover:bg-surface-card text-content-muted hover:text-content-primary transition"
                  aria-label="Fermer l'aperçu CSV"
                >
                  <X size={14} />
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-line bg-surface-deep">
                      <th className="px-3 py-2 text-left font-medium text-content-faint uppercase tracking-wider text-[10px]">{t('results.columns.name')}</th>
                      <th className="px-3 py-2 text-left font-medium text-content-faint uppercase tracking-wider text-[10px]">{t('results.columns.address')}</th>
                      <th className="px-3 py-2 text-left font-medium text-content-faint uppercase tracking-wider text-[10px]">{t('results.columns.phone')}</th>
                      <th className="px-3 py-2 text-left font-medium text-content-faint uppercase tracking-wider text-[10px]">{t('results.columns.email')}</th>
                      <th className="px-3 py-2 text-left font-medium text-content-faint uppercase tracking-wider text-[10px]">{t('results.columns.googleRating')}</th>
                      <th className="px-3 py-2 text-left font-medium text-content-faint uppercase tracking-wider text-[10px]">{t('results.columns.type')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {folderProspects.slice(0, 5).map((p) => (
                      <tr key={p.id} className="border-b border-line/50 hover:bg-surface-card/50">
                        <td className="px-3 py-2 text-content-primary truncate max-w-[120px]">{p.nom || '\u2014'}</td>
                        <td className="px-3 py-2 text-content-secondary truncate max-w-[140px]">{p.adresse || '\u2014'}</td>
                        <td className="px-3 py-2 text-content-secondary font-mono">{p.telephone || '\u2014'}</td>
                        <td className="px-3 py-2 text-green-400/70 truncate max-w-[140px]">{p.email || '\u2014'}</td>
                        <td className="px-3 py-2 text-amber-600 font-mono">{p.note != null ? p.note : '\u2014'}</td>
                        <td className="px-3 py-2">
                          {p.type ? (
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${getTypeStyle(p.type)}`}>
                              {p.type}
                            </span>
                          ) : '\u2014'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-2.5 border-t border-line text-[11px] text-content-muted">
                {t('results.firstRowsOf', { total: folderProspects.length })}
              </div>
            </div>
          )}
        </div>
        <button
          onClick={handleDeleteAll}
          disabled={folderProspects.length === 0}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition disabled:opacity-30 ${
            showDeleteConfirm
              ? 'border-red-600/50 bg-red-600/20 text-red-400'
              : 'border-red-600/20 hover:bg-red-600/10 text-red-400/60 hover:text-red-400'
          }`}
          title={showDeleteConfirm ? t('results.clickToConfirm') : t('results.deleteProspects')}
        >
          {showDeleteConfirm ? (
            <>
              <AlertTriangle size={14} />
              <span className="hidden sm:inline">{t('results.confirm')}</span>
            </>
          ) : (
            <Trash2 size={14} />
          )}
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-content-faint" />
          <input
            type="text"
            placeholder={t('results.searchPlaceholder')}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-surface-card border border-line rounded-xl text-sm text-content-primary placeholder-content-faint focus:outline-none focus:border-indigo-500/30 transition"
          />
        </div>
        <select
          value={selectedDept}
          onChange={(e) => setSelectedDept(e.target.value)}
          className="px-3 py-2.5 bg-surface-card border border-line rounded-xl text-xs text-content-tertiary focus:outline-none focus:border-indigo-500/30"
        >
          <option value="all">{t('results.allDepartments')}</option>
          {availableDepts.map(({ code, name }) => (
            <option key={code} value={code}>{code} {name}</option>
          ))}
        </select>
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="px-3 py-2.5 bg-surface-card border border-line rounded-xl text-xs text-content-tertiary focus:outline-none focus:border-indigo-500/30"
        >
          <option value="all">{t('results.allTypes')}</option>
          <option value="b2b">B2B</option>
          <option value="copro">Copro</option>
          <option value="custom">Custom</option>
        </select>
      </div>

      {/* Email quality legend */}
      <div className="hidden sm:flex flex-wrap gap-3 px-3 py-2.5 items-center rounded-xl border border-line/50 bg-surface-card/50">
        <span className="text-[10px] text-content-muted font-semibold uppercase tracking-wider">{t('results.emailQuality')}</span>
        {[
          { method: 'scrape', badge: <EmailBadge method="scrape" /> },
          { method: 'serper', badge: <EmailBadge method="serper" /> },
          { method: 'deep-pattern', badge: <EmailBadge method="deep-pattern" /> },
          { method: 'guess', badge: <EmailBadge method="guess" /> },
        ].map(({ method, badge }) => {
          const info = getEmailMethodInfo(method, t);
          return (
            <div key={method} className="relative group/legend flex items-center gap-1.5 cursor-help">
              {badge}
              <span className="text-[10px] text-content-faint group-hover/legend:text-content-tertiary transition-colors">{info?.label}</span>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2.5 py-1.5 bg-surface-elevated border border-line-hover rounded-lg text-[10px] text-content-secondary leading-relaxed w-56 opacity-0 group-hover/legend:opacity-100 pointer-events-none transition-opacity z-30 shadow-xl">
                {info?.tip}
              </div>
            </div>
          );
        })}
      </div>

      {/* Sticky bulk action bar — fixed at bottom of viewport */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-0 left-0 md:left-64 right-0 z-[50] bg-surface-card border-t border-line px-4 sm:px-6 py-3 shadow-[0_-4px_16px_rgba(0,0,0,0.15)]">
          <div className="max-w-6xl mx-auto flex flex-wrap items-center gap-2 sm:gap-3">
            <span className="text-xs font-medium text-indigo-400">
              {t('results.selected', { count: selectedIds.size, plural: selectedIds.size > 1 ? 's' : '' })}
            </span>
            <button
              onClick={() => {
                const ids = Array.from(selectedIds);
                const withoutEmail = prospects.filter(p => ids.includes(p.id) && !p.email);
                if (withoutEmail.length > 0) {
                  onBulkEnrich?.(null, null, ids);
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-[11px] font-medium transition"
            >
              <Zap size={12} />
              {t('results.enrichBtn')}
            </button>
            <button
              onClick={deleteSelected}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600/10 border border-red-600/20 text-red-400 text-[11px] font-medium hover:bg-red-600/20 transition"
            >
              <Trash2 size={12} />
              {t('results.delete')}
            </button>

            {/* Phase 3 : Send to CRM. Toujours visible (CTA = signal de valeur
                pour les users free → Business). Pour les non-Business on
                affiche le lock icon ; le parent ouvre la modale upgrade.    */}
            {onSendToCrm && (
              <button
                onClick={() => {
                  const ids = Array.from(selectedIds);
                  const list = prospects.filter((p) => ids.includes(p.id));
                  onSendToCrm({ prospects: list });
                }}
                title={hasCrmAccess ? 'Envoyer ces prospects dans votre CRM' : 'Réservé au plan Business'}
                className={`
                  flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition
                  ${hasCrmAccess
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-500 hover:to-teal-500 shadow-sm shadow-emerald-500/20'
                    : 'bg-zinc-100 text-zinc-600 border border-zinc-200 hover:bg-zinc-200'}
                `}
              >
                {hasCrmAccess ? <KanbanSquare size={12} /> : <Lock size={11} />}
                Envoyer vers CRM
              </button>
            )}

            {/* Pont Prospection → Campagnes : ouvre la modale pour pousser
                la sélection dans une liste prospect_lists (cible campagne).
                Même variant visuel que CRM, en violet (couleur Campagnes). */}
            <button
              onClick={() => setShowCampagneModal(true)}
              disabled={selectedIds.size === 0}
              title="Pousser ces prospects dans une liste pour lancer une campagne"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:from-violet-500 hover:to-purple-500 shadow-sm shadow-violet-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={12} />
              Lancer une campagne
            </button>

            <button
              onClick={() => setSelectedIds(new Set())}
              className="ml-auto text-[11px] text-content-muted hover:text-content-secondary transition"
            >
              {t('results.deselect')}
            </button>
          </div>
        </div>
      )}

      {/* Mobile card layout (< md) */}
      <div className="md:hidden space-y-2">
        {displayProspects.map((p) => {
          const methodInfo = getEmailMethodInfo(p.email_method, t);
          const isSelected = selectedIds.has(p.id);
          const score = p.lead_score || computeLeadScore(p);
          const scoreInfo = getScoreLabel(score);
          return (
            <div
              key={p.id}
              className={`rounded-xl border p-3 transition-colors ${
                isSelected
                  ? 'border-indigo-500/30 bg-indigo-500/5'
                  : !p.email
                  ? 'border-red-500/10 bg-red-950/5'
                  : 'border-line bg-surface-card'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <button
                    onClick={() => toggleSelect(p.id)}
                    className="p-1 rounded hover:bg-surface-elevated transition flex-shrink-0"
                  >
                    {isSelected ? (
                      <CheckSquare size={16} className="text-indigo-400" />
                    ) : (
                      <SquareIcon size={16} className="text-content-dim" />
                    )}
                  </button>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-content-primary truncate">{p.nom}</div>
                    <div className="text-[11px] text-content-faint truncate">{p.adresse}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <span className={`inline-block px-2 py-0.5 rounded border text-[10px] font-semibold uppercase ${getTypeStyle(p.type)}`}>
                    {p.type}
                  </span>
                  <span className={`inline-flex items-center justify-center w-8 text-center px-1 py-0.5 rounded-md text-xs font-bold font-mono ${scoreInfo.bg} ${scoreInfo.color}`}>
                    {score}
                  </span>
                </div>
              </div>

              <div className="mt-2 space-y-1.5 pl-8">
                {p.telephone && (
                  <a href={`tel:${p.telephone}`} className="flex items-center gap-2 text-xs text-content-secondary min-h-[32px]">
                    <Phone size={12} className="text-content-faint flex-shrink-0" />
                    <span className="font-mono">{p.telephone}</span>
                  </a>
                )}
                {p.email ? (
                  <div className="flex items-center gap-2 text-xs min-h-[32px] flex-wrap">
                    <Mail size={12} className="text-content-faint flex-shrink-0" />
                    <span className={`truncate ${methodInfo?.color || 'text-content-secondary'}`}>
                      {p.email}
                    </span>
                    <EmailBadge method={p.email_method} />
                    <button
                      onClick={() => copyEmail(p.email, p.id)}
                      className="p-1 rounded hover:bg-surface-elevated transition flex-shrink-0"
                    >
                      {copiedEmail === p.id ? (
                        <Check size={12} className="text-green-400" />
                      ) : (
                        <Copy size={12} className="text-content-faint" />
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-xs min-h-[32px]">
                    <Mail size={12} className="text-content-dim flex-shrink-0" />
                    <span className="text-content-dim">—</span>
                    <span className={`italic text-[10px] ${p.email_method ? 'text-content-faint' : 'text-amber-600'}`}>
                      {p.email_method ? t('results.notFound') : t('results.notEnrichedYet')}
                    </span>
                  </div>
                )}
                {p.site_web && (
                  <a href={p.site_web} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-indigo-400/70 hover:text-indigo-400 transition min-h-[32px]">
                    <Globe size={12} className="flex-shrink-0" />
                    <span className="truncate">{shortUrl(p.site_web)}</span>
                    <ExternalLink size={10} className="flex-shrink-0" />
                  </a>
                )}
                {p.note && (
                  <div className="flex items-center gap-2 text-xs min-h-[32px]">
                    <span className="text-yellow-500 text-sm">&#9733;</span>
                    <span className="text-content-secondary font-mono">{p.note}</span>
                    {p.nb_avis > 0 && <span className="text-content-faint text-[10px]">({p.nb_avis} {t('results.reviews')})</span>}
                  </div>
                )}
              </div>

              <div className="mt-2 pl-8 flex items-center justify-between">
                <div className="flex flex-wrap gap-1 items-center">
                  {(prospectTagMap?.[p.id] || []).map(tagId => {
                    const tag = tagsById[tagId];
                    if (!tag) return null;
                    return (
                      <span
                        key={tagId}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-violet-500/20 text-violet-400"
                        onClick={() => onToggleProspectTag?.(p.id, tagId)}
                      >
                        {tag.name}
                      </span>
                    );
                  })}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => startEdit(p)}
                    className="p-2 rounded-lg hover:bg-surface-elevated text-content-faint hover:text-content-secondary transition min-h-[44px] min-w-[44px] flex items-center justify-center"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => {
                      if (deleteConfirmId === p.id) confirmDelete(p.id);
                      else setDeleteConfirmId(p.id);
                    }}
                    className={`p-2 rounded-lg transition min-h-[44px] min-w-[44px] flex items-center justify-center ${
                      deleteConfirmId === p.id
                        ? 'bg-red-600/20 text-red-400'
                        : 'hover:bg-red-600/10 text-content-faint hover:text-red-400'
                    }`}
                  >
                    {deleteConfirmId === p.id ? <AlertTriangle size={14} /> : <Trash2 size={14} />}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop table (md+) */}
      <div className="hidden md:block rounded-2xl border border-line bg-surface-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-line bg-surface-deep">
                {/* Select all checkbox — indicateur basé UNIQUEMENT sur la page
                    visible (P1 bug fix). Sinon, cocher 50 sur page 1 puis aller
                    en page 2 affichait à tort un check plein. */}
                <th className="px-2 py-3 w-8">
                  <button
                    onClick={toggleSelectAll}
                    className="p-0.5 rounded hover:bg-surface-elevated transition"
                  >
                    {displayProspects.length > 0 && displayProspects.every(p => selectedIds.has(p.id)) ? (
                      <CheckSquare size={14} className="text-indigo-400" />
                    ) : displayProspects.some(p => selectedIds.has(p.id)) ? (
                      <div className="w-3.5 h-3.5 rounded border border-indigo-400 bg-indigo-400/20 flex items-center justify-center">
                        <div className="w-1.5 h-0.5 bg-indigo-400 rounded-full" />
                      </div>
                    ) : (
                      <SquareIcon size={14} className="text-content-faint" />
                    )}
                  </button>
                </th>
                {visibleCols.type && (
                  <th className="px-4 py-3 text-left font-medium text-content-faint uppercase tracking-wider text-[10px]">
                    <span className="flex items-center">{t('results.columns.type')}<InfoTooltip text={t('results.typeTooltip')} /></span>
                  </th>
                )}
                {visibleCols.nom && (
                  <th className="px-4 py-3 text-left font-medium text-content-faint uppercase tracking-wider text-[10px]">{t('results.columns.name')}</th>
                )}
                {visibleCols.telephone && (
                  <th className="px-4 py-3 text-left font-medium text-content-faint uppercase tracking-wider text-[10px]">{t('results.columns.phone')}</th>
                )}
                {visibleCols.email && (
                  <th className="px-4 py-3 text-left font-medium text-content-faint uppercase tracking-wider text-[10px]">
                    <span className="flex items-center">{t('results.columns.email')}<InfoTooltip text={t('results.colorLegend')} wide /></span>
                  </th>
                )}
                {visibleCols.site && (
                  <th className="px-4 py-3 text-left font-medium text-content-faint uppercase tracking-wider text-[10px]">{t('results.columns.website')}</th>
                )}
                {visibleCols.note && (
                  <th className="px-4 py-3 text-left font-medium text-content-faint uppercase tracking-wider text-[10px]">
                    <span className="flex items-center">{t('results.columns.googleRating')}<InfoTooltip text={t('results.ratingTooltip')} wide /></span>
                  </th>
                )}
                {visibleCols.dept && (
                  <th className="px-4 py-3 text-left font-medium text-content-faint uppercase tracking-wider text-[10px]">
                    <span className="flex items-center">{t('results.columns.department')}<InfoTooltip text={t('results.deptTooltip')} /></span>
                  </th>
                )}
                {visibleCols.score && (
                  <th className="px-3 py-2 text-left text-xs font-medium text-content-tertiary">
                    <span className="flex items-center">{t('results.columns.score')}<InfoTooltip text={t('results.scoreTooltip')} wide /></span>
                  </th>
                )}
                {visibleCols.tags && (
                  <th className="px-3 py-2 text-left text-xs font-medium text-content-tertiary">
                    <span className="flex items-center">{t('results.columns.tags')}<InfoTooltip text={t('results.tagsTooltip')} /></span>
                  </th>
                )}
                <th className="px-3 py-2 text-center text-[10px] font-medium text-content-faint uppercase tracking-wider w-10"></th>
              </tr>
            </thead>
            <tbody>
              {displayProspects.map((p, idx) => {
                const methodInfo = getEmailMethodInfo(p.email_method, t);
                const isEditing = editingId === p.id;
                const hasNoEmail = !p.email;
                return (
                  <tr key={p.id} className={`border-b border-line/50 transition-colors ${
                    selectedIds.has(p.id) ? 'bg-indigo-500/5' :
                    isEditing ? 'bg-surface-edit' :
                    hasNoEmail ? 'bg-red-950/5 hover:bg-red-950/10' :
                    idx % 2 === 0 ? 'hover:bg-surface-hover' : 'bg-surface-alt hover:bg-surface-hover'
                  }`}>
                    {/* Checkbox */}
                    <td className="px-2 py-2.5 w-8">
                      <button
                        onClick={() => toggleSelect(p.id)}
                        className="p-0.5 rounded hover:bg-surface-elevated transition"
                      >
                        {selectedIds.has(p.id) ? (
                          <CheckSquare size={14} className="text-indigo-400" />
                        ) : (
                          <SquareIcon size={14} className="text-content-dim hover:text-content-muted" />
                        )}
                      </button>
                    </td>
                    {visibleCols.type && (
                    <td className="px-4 py-2.5">
                      <span className={`inline-block px-2 py-0.5 rounded border text-[10px] font-semibold uppercase ${getTypeStyle(p.type)}`}>
                        {p.type}
                      </span>
                    </td>
                    )}
                    {visibleCols.nom && (
                    <td className="px-4 py-2.5">
                      {isEditing ? (
                        <div className="space-y-1">
                          <input
                            value={editData.nom}
                            onChange={(e) => setEditData({ ...editData, nom: e.target.value })}
                            className="w-full px-2 py-1 bg-surface-base border border-line-hover rounded text-xs text-content-primary focus:outline-none focus:border-indigo-500"
                            placeholder={t('results.columns.name')}
                          />
                          <input
                            value={editData.adresse}
                            onChange={(e) => setEditData({ ...editData, adresse: e.target.value })}
                            className="w-full px-2 py-1 bg-surface-base border border-line-hover rounded text-[10px] text-content-secondary focus:outline-none focus:border-indigo-500"
                            placeholder={t('results.columns.address')}
                          />
                        </div>
                      ) : (
                        <>
                          <div className="text-content-primary font-medium">{p.nom}</div>
                          <div className="text-[10px] text-content-faint truncate max-w-[200px]">{p.adresse}</div>
                        </>
                      )}
                    </td>
                    )}
                    {visibleCols.telephone && (
                    <td className="px-4 py-2.5">
                      {isEditing ? (
                        <input
                          value={editData.telephone}
                          onChange={(e) => setEditData({ ...editData, telephone: e.target.value })}
                          className="w-full px-2 py-1 bg-surface-base border border-line-hover rounded text-xs text-content-secondary font-mono focus:outline-none focus:border-indigo-500"
                          placeholder={t('results.columns.phone')}
                        />
                      ) : (
                        <span className="text-content-secondary font-mono">{p.telephone || <span className="text-content-dim">—</span>}</span>
                      )}
                    </td>
                    )}
                    {visibleCols.email && (
                    <td className="px-4 py-2.5">
                      {isEditing ? (
                        <input
                          value={editData.email}
                          onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                          className="w-full px-2 py-1 bg-surface-base border border-line-hover rounded text-xs text-content-secondary focus:outline-none focus:border-indigo-500"
                          placeholder={t('results.columns.email')}
                        />
                      ) : p.email ? (
                        <div className="group/email relative">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`cursor-default truncate max-w-[180px] ${methodInfo?.color || 'text-content-secondary'}`}
                              onMouseEnter={() => setTooltipId(p.id)}
                              onMouseLeave={() => setTooltipId(null)}
                            >
                              {p.email}
                            </span>
                            <EmailBadge method={p.email_method} />
                            <button
                              onClick={() => copyEmail(p.email, p.id)}
                              className="opacity-0 group-hover/email:opacity-100 p-0.5 rounded hover:bg-surface-elevated transition-all flex-shrink-0"
                              title={t('results.copyEmail')}
                            >
                              {copiedEmail === p.id ? (
                                <Check size={12} className="text-green-400" />
                              ) : (
                                <Copy size={12} className="text-content-faint" />
                              )}
                            </button>
                          </div>
                          {tooltipId === p.id && methodInfo && (
                            <div className="absolute bottom-full left-0 mb-1 px-2.5 py-1.5 bg-surface-elevated border border-line-hover rounded-lg text-[10px] text-content-secondary whitespace-normal max-w-[250px] z-10 shadow-lg leading-relaxed">
                              <div className="font-semibold text-content-primary mb-0.5">{methodInfo.label}</div>
                              {methodInfo.tip}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-[10px] text-content-dim">
                          <span>—</span>
                          <span className={`italic ${p.email_method ? 'text-content-faint' : 'text-amber-600'}`}>
                            {p.email_method ? t('results.notFound') : t('results.notEnrichedYet')}
                          </span>
                        </span>
                      )}
                    </td>
                    )}
                    {visibleCols.site && (
                    <td className="px-4 py-2.5">
                      {isEditing ? (
                        <input
                          value={editData.site_web}
                          onChange={(e) => setEditData({ ...editData, site_web: e.target.value })}
                          className="w-full px-2 py-1 bg-surface-base border border-line-hover rounded text-xs text-content-secondary focus:outline-none focus:border-indigo-500"
                          placeholder="https://..."
                        />
                      ) : p.site_web ? (
                        <a href={p.site_web} target="_blank" rel="noopener noreferrer" className="text-indigo-400/70 hover:text-indigo-400 flex items-center gap-1 transition">
                          {shortUrl(p.site_web)}
                          <ExternalLink size={10} />
                        </a>
                      ) : (
                        <span className="text-content-dim">—</span>
                      )}
                    </td>
                    )}
                    {visibleCols.note && (
                    <td className="px-4 py-2.5">
                      {p.note ? (
                        <div className="flex items-center gap-1">
                          <span className="text-yellow-500 text-[10px]">&#9733;</span>
                          <span className="text-content-secondary font-mono">{p.note}</span>
                          {p.nb_avis > 0 && <span className="text-content-faint text-[10px]">({p.nb_avis})</span>}
                        </div>
                      ) : (
                        <span className="text-content-dim">—</span>
                      )}
                    </td>
                    )}
                    {visibleCols.dept && (
                    <td className="px-4 py-2.5">
                      <span className="font-mono text-content-muted">{p.departement}</span>
                    </td>
                    )}
                    {visibleCols.score && (() => {
                      const score = p.lead_score || computeLeadScore(p);
                      const scoreInfo = getScoreLabel(score);
                      return (
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-1.5">
                            <span className={`inline-flex items-center justify-center w-8 text-center px-1 py-0.5 rounded-md text-xs font-bold font-mono ${scoreInfo.bg} ${scoreInfo.color}`}>
                              {score}
                            </span>
                            <div className="w-10 h-1.5 bg-surface-elevated rounded-full overflow-hidden hidden sm:block">
                              <div className={`h-full rounded-full transition-all ${
                                score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-blue-500' : score >= 40 ? 'bg-amber-500' : 'bg-red-500'
                              }`} style={{ width: `${score}%` }} />
                            </div>
                          </div>
                        </td>
                      );
                    })()}
                    {visibleCols.tags && (
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-1 items-center">
                        {(prospectTagMap?.[p.id] || []).map(tagId => {
                          const tag = tagsById[tagId];
                          if (!tag) return null;
                          return (
                            <span
                              key={tagId}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-violet-500/20 text-violet-400 cursor-pointer hover:opacity-70"
                              onClick={() => onToggleProspectTag?.(p.id, tagId)}
                              title={t('results.clickToRemove')}
                            >
                              {tag.name}
                            </span>
                          );
                        })}
                        <TagDropdown
                          tags={tags || []}
                          activeTags={prospectTagMap?.[p.id] || []}
                          onToggle={(tagId) => onToggleProspectTag?.(p.id, tagId)}
                          onCreate={onCreateTag}
                        />
                      </div>
                    </td>
                    )}
                    {/* Actions */}
                    <td className="px-2 py-2 text-center">
                      {isEditing ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={saveEdit}
                            className="p-1 rounded hover:bg-green-500/20 text-green-400 transition"
                            title={t('results.save')}
                          >
                            <Save size={13} />
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="p-1 rounded hover:bg-surface-elevated text-content-muted transition"
                            title={t('results.cancel')}
                          >
                            <X size={13} />
                          </button>
                        </div>
                      ) : deleteConfirmId === p.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => confirmDelete(p.id)}
                            className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-600/20 text-red-400 hover:bg-red-600/30 transition"
                          >
                            {t('results.yes')}
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-surface-elevated text-content-tertiary hover:bg-line-hover transition"
                          >
                            {t('results.no')}
                          </button>
                        </div>
                      ) : (
                        <div className="relative">
                          <button
                            onClick={() => setActionMenuId(actionMenuId === p.id ? null : p.id)}
                            className="p-1 rounded hover:bg-surface-elevated text-content-faint hover:text-content-secondary transition"
                          >
                            <MoreVertical size={14} />
                          </button>
                          {actionMenuId === p.id && (
                            <div className="absolute z-50 right-0 top-full mt-1 w-36 rounded-lg border border-line bg-surface-card shadow-xl py-1">
                              <button
                                onClick={() => startEdit(p)}
                                className="w-full text-left px-3 py-1.5 text-xs text-content-secondary hover:bg-surface-elevated hover:text-content-primary flex items-center gap-2 transition"
                              >
                                <Pencil size={12} />
                                {t('results.modify')}
                              </button>
                              <button
                                onClick={() => { setDeleteConfirmId(p.id); setActionMenuId(null); }}
                                className="w-full text-left px-3 py-1.5 text-xs text-red-400/70 hover:bg-red-600/10 hover:text-red-400 flex items-center gap-2 transition"
                              >
                                <Trash2 size={12} />
                                {t('results.delete')}
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      </div>

      {/* Pagination (shared between mobile and desktop) */}
      <div className="flex items-center justify-between px-3 sm:px-4 py-3 rounded-xl md:rounded-none border border-line md:border-0 bg-surface-deep md:bg-surface-card">
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="text-[10px] text-content-faint">
            {t('results.resultsCount', { count: filteredProspects.length, plural: filteredProspects.length > 1 ? 's' : '' })}
            {filteredProspects.length !== prospects.length && ` ${t('results.resultsOf', { total: prospects.length })}`}
          </span>
          {prospectsWithoutEmail > 0 && (
            <span className="text-[10px] text-amber-500/70 flex items-center gap-1">
              <Mail size={10} />
              {t('results.withoutEmail', { count: prospectsWithoutEmail })}
            </span>
          )}
        </div>
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="p-2 sm:p-1.5 rounded-lg hover:bg-surface-elevated text-content-muted disabled:opacity-20 transition min-h-[44px] sm:min-h-0 min-w-[44px] sm:min-w-0 flex items-center justify-center"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="text-[10px] font-mono text-content-muted px-2 tabular-nums">
              {page + 1} / {totalPages}
            </span>
            <button
              onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
              disabled={page >= totalPages - 1}
              className="p-2 sm:p-1.5 rounded-lg hover:bg-surface-elevated text-content-muted disabled:opacity-20 transition min-h-[44px] sm:min-h-0 min-w-[44px] sm:min-w-0 flex items-center justify-center"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Enrichment progress sticky banner */}
      <EnrichmentProgressBanner
        isEnriching={isEnriching}
        isDeepEnriching={isDeepEnriching}
        isWaterfallEnriching={isWaterfallEnriching}
        enrichProgress={enrichProgress}
        deepEnrichProgress={deepEnrichProgress}
        waterfallProgress={waterfallProgress}
        onStopEnrichment={onStopEnrichment}
        enrichStartTime={enrichStartTimeRef.current}
        justFinished={justFinished}
        onDismissFinished={() => setJustFinished(null)}
      />

      {/* Bottom padding when banner is visible */}
      {(isAnyEnriching || justFinished) && <div className="h-20" />}

      {/* Modale Prospection → Campagnes (lazy : non chargée tant que
          l'user n'a pas cliqué "Lancer une campagne"). */}
      {showCampagneModal && (
        <Suspense fallback={null}>
          <SendToCampagneModal
            open={true}
            onClose={() => setShowCampagneModal(false)}
            prospects={prospects.filter((p) => selectedIds.has(p.id))}
          />
        </Suspense>
      )}
    </div>
  );
})
