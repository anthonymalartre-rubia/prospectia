"use client";

import { useState, useMemo, useCallback, useEffect, useRef, memo } from "react";
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
  FileSpreadsheet,
  Inbox,
  Radar,
  Copy,
  Check,
  AlertTriangle,
  Crown,
  Folder,
  FolderOpen,
  X,
  ChevronDown,
  Lock,
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
} from "lucide-react";
import { DEPTS } from "@/lib/constants";
import { computeLeadScore, getScoreLabel } from "@/lib/scoring";
import { Info, Lightbulb } from "lucide-react";

// Reusable tooltip on hover — rendered via portal into document.body to escape all overflow containers
function InfoTooltip({ text, wide }) {
  const [show, setShow] = useState(false);
  const [style, setStyle] = useState({});
  const wrapRef = useRef(null);
  const tipRef = useRef(null);
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
          ref={tipRef}
          style={style}
          className={`px-2.5 py-1.5 bg-zinc-900 border border-zinc-700 rounded-lg text-[10px] text-zinc-200 leading-relaxed pointer-events-none z-[99999] shadow-2xl whitespace-normal ${wide ? 'w-56' : 'w-44'}`}
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
  const isRunning = isEnriching || isDeepEnriching || isWaterfallEnriching;
  if (!isRunning && !justFinished) return null;

  let progress, methodLabel, accentFrom, accentTo;
  if (isWaterfallEnriching || (justFinished && justFinished.type === "waterfall")) {
    progress = waterfallProgress;
    methodLabel = "Waterfall Pro";
    accentFrom = "from-orange-500";
    accentTo = "to-amber-500";
  } else if (isDeepEnriching || (justFinished && justFinished.type === "deep")) {
    progress = deepEnrichProgress;
    methodLabel = "Deep Enrich";
    accentFrom = "from-purple-500";
    accentTo = "to-indigo-500";
  } else {
    progress = enrichProgress;
    methodLabel = "Scraping";
    accentFrom = "from-indigo-500";
    accentTo = "to-purple-500";
  }

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
              <div className="text-sm font-semibold text-content-primary">{"Enrichissement termin\u00e9"}</div>
              <div className="text-xs text-content-muted mt-0.5">
                {totalEmails}{" email"}{totalEmails > 1 ? "s" : ""}{" trouv\u00e9"}{totalEmails > 1 ? "s" : ""}{" sur "}{totalProspects}{" prospect"}{totalProspects > 1 ? "s" : ""}
                {justFinished.errors > 0 && (
                  <span className="text-red-400 ml-2">{"("}{justFinished.errors}{" erreur"}{justFinished.errors > 1 ? "s" : ""}{")"}</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-right hidden sm:block">
                <div className="text-lg font-bold font-mono text-emerald-400 tabular-nums">
                  {totalProspects > 0 ? Math.round((totalEmails / totalProspects) * 100) : 0}%
                </div>
                <div className="text-[10px] text-content-faint">{"taux de succ\u00e8s"}</div>
              </div>
              <button onClick={onDismissFinished} className="p-2 rounded-lg text-content-faint hover:text-content-secondary hover:bg-surface-elevated transition" aria-label="Fermer">
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
                <Loader2 size={16} className="text-indigo-400 animate-spin" />
                <span className="text-xs font-semibold text-content-primary">{methodLabel}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-mono text-content-secondary tabular-nums">{current}{" / "}{total}{" prospects enrichis"}</span>
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
                  <div className="flex items-center gap-1" title={"Emails trouv\u00e9s"}>
                    <CheckCircle2 size={12} className="text-emerald-400" />
                    <span className="text-[11px] font-mono text-emerald-400 tabular-nums">{emailsFound}</span>
                  </div>
                  {errorCount > 0 && (
                    <div className="flex items-center gap-1" title="Erreurs">
                      <XCircle size={12} className="text-red-400/70" />
                      <span className="text-[11px] font-mono text-red-400/70 tabular-nums">{errorCount}</span>
                    </div>
                  )}
                </div>
                {etaStr && (
                  <div className="hidden md:flex items-center gap-1 text-content-muted" title={"Temps restant estim\u00e9"}>
                    <Clock size={11} />
                    <span className="text-[11px] font-mono tabular-nums">{etaStr}</span>
                  </div>
                )}
                <button onClick={onStopEnrichment} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600/10 border border-red-600/20 text-red-400 text-xs font-semibold transition hover:bg-red-600/20 active:scale-[0.98]">
                  <Square size={12} />
                  <span className="hidden sm:inline">Stop</span>
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

function OnboardingHint({ storageKey, children }) {
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem(storageKey) === '1' || localStorage.getItem('onboarding_completed') != null;
  });

  if (dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    try { localStorage.setItem(storageKey, '1'); } catch {}
  };

  return (
    <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl border border-indigo-500/25 bg-indigo-500/[0.07] animate-gentle-glow">
      <div className="p-1.5 rounded-lg bg-indigo-500/15 flex-shrink-0 mt-0.5">
        <Lightbulb size={14} className="text-indigo-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-indigo-300 leading-relaxed">{children}</p>
      </div>
      <button
        onClick={handleDismiss}
        className="px-2.5 py-1 rounded-lg text-[10px] font-semibold text-indigo-400 border border-indigo-500/25 hover:bg-indigo-500/15 transition flex-shrink-0"
      >
        Compris
      </button>
    </div>
  );
}

const shortUrl = (url) => {
  if (!url) return "";
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
};

const PAGE_SIZE = 50;

const EMAIL_METHOD_INFO = {
  scrape: { label: "Trouvé sur le site", color: "text-green-400", tip: "Email extrait directement depuis le site web de l'entreprise (pages contact, mentions legales, mailto)" },
  "deep-verified": { label: "Vérifié (MX + pattern)", color: "text-purple-400", tip: "Email genere par pattern (prenom.nom@domaine) puis verifie via les enregistrements MX du serveur mail" },
  "deep-pattern": { label: "Généré par pattern", color: "text-purple-400/70", tip: "Email genere automatiquement par pattern (ex: contact@domaine.com) mais non verifie — fiabilite moyenne" },
  serper: { label: "Serper.dev (Google)", color: "text-yellow-400", tip: "Email trouve dans les resultats de recherche Google via l'API Serper — bonne fiabilite" },
  apollo: { label: "Apollo.io", color: "text-orange-400", tip: "Email du contact principal trouve dans la base Apollo (220M+ contacts professionnels) — haute fiabilite" },
  enrichly: { label: "Enrichly", color: "text-cyan-400", tip: "Email professionnel trouve via l'API Enrichly" },
  anymail: { label: "Anymail Finder", color: "text-teal-400", tip: "Email trouve et verifie par Anymail Finder avec verification MX" },
  findymail: { label: "Findymail", color: "text-sky-400", tip: "Email verifie avec taux de delivrabilite eleve via Findymail" },
  guess: { label: "Email probable (contact@)", color: "text-amber-400", tip: "Aucun email trouve — contact@domaine.com est genere automatiquement. Fiabilite faible, a verifier manuellement" },
};

// Email quality badge component
function EmailBadge({ method }) {
  if (!method) return null;

  // Group methods into quality tiers
  if (method === 'scrape' || method === 'deep-verified' || method === 'anymail' || method === 'findymail') {
    return (
      <span className="inline-flex items-center gap-0.5 px-1.5 py-[1px] rounded-full text-[9px] font-semibold bg-green-500/15 text-green-400 border border-green-500/20 whitespace-nowrap">
        <CheckCircle size={8} className="flex-shrink-0" />
        Verifie
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

  if (method === 'serper' || method === 'enrichly') {
    return (
      <span className="inline-flex items-center gap-0.5 px-1.5 py-[1px] rounded-full text-[9px] font-semibold bg-cyan-500/15 text-cyan-400 border border-cyan-500/20 whitespace-nowrap">
        <ShieldCheck size={8} className="flex-shrink-0" />
        {method === 'serper' ? 'Google' : 'Enrichly'}
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
      <span className="inline-flex items-center gap-0.5 px-1.5 py-[1px] rounded-full text-[9px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/20 whitespace-nowrap">
        <AlertTriangle size={8} className="flex-shrink-0" />
        Probable
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
                placeholder="Nouveau tag..."
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
}) {
  const [searchText, setSearchText] = useState("");
  const [selectedDept, setSelectedDept] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [page, setPage] = useState(0);
  const [copiedEmail, setCopiedEmail] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [tooltipId, setTooltipId] = useState(null);
  const [showEnrichDropdown, setShowEnrichDropdown] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [actionMenuId, setActionMenuId] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showColumnPicker, setShowColumnPicker] = useState(false);
  const [showExportPreview, setShowExportPreview] = useState(false);
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
    { key: 'type', label: 'Type', required: false },
    { key: 'nom', label: 'Nom', required: true },
    { key: 'telephone', label: 'Telephone', required: false },
    { key: 'email', label: 'Email', required: true },
    { key: 'site', label: 'Site web', required: false },
    { key: 'note', label: 'Note Google', required: false },
    { key: 'dept', label: 'Departement', required: false },
    { key: 'score', label: 'Score', required: false },
    { key: 'tags', label: 'Tags', required: false },
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
    if (selectedIds.size === displayProspects.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(displayProspects.map(p => p.id)));
    }
  };

  const deleteSelected = () => {
    for (const id of selectedIds) {
      onDeleteProspect?.(id);
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

  const ENRICH_METHODS = [
    { id: null, label: 'Waterfall (auto)', icon: '🔄', description: 'Teste chaque source une par une jusqu\'a trouver un email', cost: 'Gratuit d\'abord, puis payant si besoin' },
    { id: 'scrape', label: 'Scraping du site', icon: '🌐', description: 'Parcourt le site web et ses pages contact pour extraire les emails visibles', cost: 'Gratuit / illimite' },
    { id: 'serper', label: 'Recherche Google', icon: '🔍', description: 'Cherche l\'email de l\'entreprise dans les resultats Google', cost: '2 500 recherches gratuites/mois' },
    { id: 'apollo', label: 'Apollo.io', icon: '🚀', description: 'Trouve le contact principal de l\'entreprise via la base Apollo (220M+ contacts)', cost: '1 credit/recherche' },
    { id: 'enrichly', label: 'Enrichly', icon: '📧', description: 'Trouve l\'email professionnel via la base de donnees Enrichly', cost: 'Payant' },
    { id: 'anymail', label: 'Anymail Finder', icon: '📬', description: 'Verifie et trouve les emails professionnels avec verification MX', cost: 'Payant' },
    { id: 'findymail', label: 'Findymail', icon: '✉️', description: 'Trouve les emails verifies avec un taux de delivrabilite eleve', cost: 'Payant' },
  ];

  const folderProspects = useMemo(() => {
    if (activeFolder === 'all') return prospects;
    if (activeFolder === 'unassigned') return prospects.filter((p) => !p.folder_id);
    return prospects.filter((p) => p.folder_id === activeFolder);
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
    const verifiedMethods = new Set(['scrape', 'deep-verified', 'anymail', 'findymail']);
    const verifiedEmails = folderProspects.filter((p) => p.email && verifiedMethods.has(p.email_method)).length;
    const apolloEmails = folderProspects.filter((p) => p.email && p.email_method === 'apollo').length;
    const guessedEmails = folderProspects.filter((p) => p.email && p.email_method === 'guess').length;
    const otherEmails = emails - verifiedEmails - apolloEmails - guessedEmails;
    const websites = folderProspects.filter((p) => p.site_web).length;
    const emailPct = total > 0 ? Math.round((emails / total) * 100) : 0;
    return { total, phones, emails, verifiedEmails, apolloEmails, guessedEmails, otherEmails, websites, emailPct };
  }, [folderProspects]);

  const prospectsWithoutEmail = useMemo(() => {
    return folderProspects.filter((p) => p.site_web && !p.email).length;
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
      case "custom": return "bg-amber-500/10 text-amber-400 border-amber-500/20";
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

  // Empty state
  if (prospects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-6">
        <div className="w-16 h-16 rounded-2xl bg-surface-card border border-line flex items-center justify-center mb-6">
          <Inbox size={28} className="text-content-dim" />
        </div>
        <h3 className="text-lg font-semibold text-content-primary mb-2">Aucun prospect</h3>
        <p className="text-sm text-content-muted text-center max-w-xs">
          Lancez une recherche pour commencer à collecter des prospects B2B et copropriétés.
        </p>
      </div>
    );
  }

  const [showFolderDelete, setShowFolderDelete] = useState(null);

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

  // Count prospects per folder
  const folderCounts = useMemo(() => {
    const counts = { all: prospects.length, unassigned: 0 };
    for (const p of prospects) {
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
            Tous
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
                title={showFolderDelete === f.id ? 'Confirmer la suppression' : 'Supprimer la liste'}
              >
                {showFolderDelete === f.id ? <AlertTriangle size={11} /> : <X size={11} />}
              </button>
            </div>
          ))}
          {prospects.some((p) => !p.folder_id) && (
            <button
              onClick={() => onActiveFolder('unassigned')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium border whitespace-nowrap transition-all ${
                activeFolder === 'unassigned'
                  ? 'bg-surface-elevated border-line-hover text-content-primary'
                  : 'border-transparent text-content-faint hover:text-content-tertiary hover:bg-surface-card'
              }`}
            >
              <Folder size={13} />
              Non classes
              <span className="font-mono text-[10px] opacity-60">{folderCounts.unassigned}</span>
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
            <div className="text-[10px] text-content-faint uppercase tracking-wider flex items-center">Prospects<InfoTooltip text="Nombre total d'entreprises trouvees via Google Places" /></div>
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
              Emails
              <InfoTooltip text={`${stats.verifiedEmails} verifies, ${stats.apolloEmails} Apollo, ${stats.guessedEmails} probables${stats.otherEmails > 0 ? `, ${stats.otherEmails} autres` : ''}. Le badge indique la fiabilite de chaque email.`} wide />
            </div>
            {stats.emails > 0 && (
              <div className="flex flex-wrap gap-x-2 gap-y-0.5 mt-1">
                {stats.verifiedEmails > 0 && (
                  <span className="text-[9px] text-green-400 font-medium">{stats.verifiedEmails} verif.</span>
                )}
                {stats.apolloEmails > 0 && (
                  <span className="text-[9px] text-blue-400 font-medium">{stats.apolloEmails} Apollo</span>
                )}
                {stats.guessedEmails > 0 && (
                  <span className="text-[9px] text-amber-400 font-medium">{stats.guessedEmails} prob.</span>
                )}
                {stats.otherEmails > 0 && (
                  <span className="text-[9px] text-cyan-400 font-medium">{stats.otherEmails} autres</span>
                )}
              </div>
            )}
            <div className="w-full h-1.5 bg-surface-elevated rounded-full mt-1.5 overflow-hidden flex">
              {stats.verifiedEmails > 0 && (
                <div className="h-full bg-green-500/70 transition-all duration-500" style={{ width: `${(stats.verifiedEmails / stats.total) * 100}%` }} />
              )}
              {stats.apolloEmails > 0 && (
                <div className="h-full bg-blue-500/70 transition-all duration-500" style={{ width: `${(stats.apolloEmails / stats.total) * 100}%` }} />
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
            <div className="text-[10px] text-content-faint uppercase tracking-wider flex items-center">Telephones<InfoTooltip text="Leads ayant un numero de telephone fourni par Google" /></div>
          </div>
        </div>

        {/* Sites web */}
        <div className="flex items-center gap-3 p-4 rounded-2xl border border-line bg-surface-card hover:border-line-hover transition-colors">
          <div className="p-2 rounded-lg bg-blue-500/10">
            <Globe size={16} className="text-blue-400" />
          </div>
          <div>
            <div className="text-xl font-bold font-mono text-blue-400 tabular-nums">{stats.websites}</div>
            <div className="text-[10px] text-content-faint uppercase tracking-wider flex items-center">Sites web<InfoTooltip text="Leads ayant un site web. Necessaire pour l'enrichissement email" /></div>
          </div>
        </div>
      </div>

      {/* Onboarding hint: enrichment */}
      {folderProspects.length > 0 && stats.emails === 0 && (
        <OnboardingHint storageKey="hint_enrich_dismissed">
          Cliquez ici pour trouver les emails de vos prospects
        </OnboardingHint>
      )}

      {/* Onboarding hint: export */}
      {stats.emails > 0 && (
        <OnboardingHint storageKey="hint_export_dismissed">
          Exportez vos leads en CSV pour votre CRM
        </OnboardingHint>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 p-2 sm:p-3 rounded-2xl border border-line bg-surface-card">
        {/* Enrichment */}
        {!isEnriching && !isDeepEnriching && !isWaterfallEnriching ? (
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative group/tip">
              <button
                onClick={onStartEnrichment}
                disabled={prospects.length === 0}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 min-h-[44px] sm:min-h-0 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:bg-surface-elevated disabled:text-content-faint text-white text-xs font-semibold transition active:scale-[0.98] disabled:cursor-not-allowed"
              >
                <Zap size={14} />
                <span className="hidden sm:inline">Enrichir</span>
                <span className="sm:hidden">Enrichir</span>
              </button>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-surface-elevated border border-line-hover rounded-xl text-[10px] text-content-secondary w-52 opacity-0 group-hover/tip:opacity-100 pointer-events-none transition-opacity z-20 shadow-xl">
                <div className="font-semibold text-content-primary mb-1">Scraping basique</div>
                Parcourt la homepage et les pages contact/mentions légales du site web pour trouver les emails visibles.
                <div className="text-content-faint mt-1">Gratuit • Rapide</div>
              </div>
            </div>
            <div className="relative group/tip">
              <button
                onClick={onStartDeepEnrichment}
                disabled={prospects.length === 0}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 min-h-[44px] sm:min-h-0 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:bg-surface-elevated disabled:text-content-faint text-white text-xs font-semibold transition active:scale-[0.98] disabled:cursor-not-allowed"
              >
                <Radar size={14} />
                <span className="hidden sm:inline">Deep Enrich</span>
                <span className="sm:hidden">Deep</span>
              </button>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-surface-elevated border border-line-hover rounded-xl text-[10px] text-content-secondary w-56 opacity-0 group-hover/tip:opacity-100 pointer-events-none transition-opacity z-20 shadow-xl">
                <div className="font-semibold text-content-primary mb-1">Crawl approfondi</div>
                Explore plusieurs pages du site, détecte les patterns d'emails (prénom.nom@), vérifie les enregistrements MX du domaine.
                <div className="text-content-faint mt-1">Gratuit • Plus lent</div>
              </div>
            </div>
            <div className="relative group/tip">
              <button
                onClick={() => onStartWaterfallEnrichment()}
                disabled={prospects.length === 0}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 min-h-[44px] sm:min-h-0 rounded-lg bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 disabled:bg-surface-elevated disabled:from-surface-elevated disabled:to-surface-elevated disabled:text-content-faint text-white text-xs font-semibold transition active:scale-[0.98] disabled:cursor-not-allowed shadow-lg shadow-orange-600/10"
              >
                <Crown size={14} />
                <span className="hidden sm:inline">Waterfall Pro</span>
                <span className="sm:hidden">Waterfall</span>
              </button>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-surface-elevated border border-line-hover rounded-xl text-[10px] text-content-secondary w-64 opacity-0 group-hover/tip:opacity-100 pointer-events-none transition-opacity z-20 shadow-xl">
                <div className="font-semibold text-orange-400 mb-1">Enrichissement cascade</div>
                <div className="space-y-0.5">
                  <div>1. Scraping site web (gratuit)</div>
                  <div>2. Serper.dev — recherche Google ($0.002/req)</div>
                  <div>3. Apollo.io ($79/mo)</div>
                  <div>4. Enrichly ($59/mo)</div>
                  <div>5. Anymail Finder</div>
                  <div>6. Findymail</div>
                  <div>7. Email deviné (fallback)</div>
                </div>
                <div className="text-content-faint mt-1">S'arrête dès qu'un email est trouvé</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <button
              onClick={onStopEnrichment}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600/10 border border-red-600/20 text-red-400 text-xs font-semibold transition hover:bg-red-600/20 active:scale-[0.98]"
            >
              <Square size={14} />
              Stop
            </button>
            <div className="flex items-center gap-2">
              <div className="w-24 h-1.5 bg-surface-elevated rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 rounded-full ${isWaterfallEnriching ? 'bg-gradient-to-r from-orange-500 to-amber-500' : 'bg-gradient-to-r from-purple-500 to-indigo-500'}`}
                  style={{ width: `${
                    isWaterfallEnriching ? (waterfallProgress?.total > 0 ? (waterfallProgress.current / waterfallProgress.total) * 100 : 0) :
                    isDeepEnriching ? (deepEnrichProgress?.total > 0 ? (deepEnrichProgress.current / deepEnrichProgress.total) * 100 : 0) :
                    enrichProgress_pct
                  }%` }}
                />
              </div>
              <span className="text-[10px] font-mono text-content-muted tabular-nums">
                {isWaterfallEnriching ? `${waterfallProgress?.current || 0}/${waterfallProgress?.total || 0}` :
                 isDeepEnriching ? `${deepEnrichProgress?.current || 0}/${deepEnrichProgress?.total || 0}` :
                 `${enrichProgress?.current}/${enrichProgress?.total}`}
              </span>
            </div>
            <span className="text-[10px] truncate max-w-[150px] hidden sm:block" style={{ color: isWaterfallEnriching ? '#f97316' : '#a78bfa' }}>
              {isWaterfallEnriching ? (waterfallProgress?.currentSite || '') :
               isDeepEnriching ? (deepEnrichProgress?.currentSite || '') :
               (enrichProgress?.currentSite || '')}
            </span>
          </div>
        )}

        <div className="relative">
          <div className="flex">
            <button
              onClick={() => onBulkEnrich?.(activeFolder === 'all' ? null : activeFolder, null)}
              disabled={isWaterfallEnriching || prospectsWithoutEmail === 0}
              className="flex items-center gap-2 px-3 py-2 rounded-l-lg text-xs font-medium bg-violet-600 text-white hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <Zap className="h-3.5 w-3.5" />
              Enrichir tout ({prospectsWithoutEmail})
            </button>
            <button
              onClick={() => setShowEnrichDropdown(!showEnrichDropdown)}
              disabled={isWaterfallEnriching || prospectsWithoutEmail === 0}
              className="flex items-center px-1.5 py-2 rounded-r-lg text-xs font-medium bg-violet-700 text-white hover:bg-violet-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all border-l border-violet-500/30"
            >
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
          </div>

          {showEnrichDropdown && (
            <div className="absolute z-50 top-full mt-1 right-0 w-80 rounded-lg border border-line bg-surface-card shadow-xl py-1">
              <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-content-muted font-semibold">
                Méthode d'enrichissement
              </div>
              {ENRICH_METHODS.map((m) => {
                const isLocked = m.id !== null && !isEnterprise;
                return (
                  <button
                    key={m.id || 'waterfall'}
                    onClick={() => {
                      if (isLocked) return;
                      setShowEnrichDropdown(false);
                      onBulkEnrich?.(activeFolder === 'all' ? null : activeFolder, m.id);
                    }}
                    disabled={isLocked}
                    className={`w-full text-left px-3 py-2 flex items-center gap-2.5 text-xs transition-colors ${
                      isLocked
                        ? 'opacity-40 cursor-not-allowed'
                        : 'hover:bg-surface-elevated cursor-pointer'
                    }`}
                  >
                    <span className="text-base leading-none">{m.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-content-primary font-medium flex items-center gap-1.5">
                        {m.label}
                        {isLocked && <Lock className="h-3 w-3 text-content-muted" />}
                      </div>
                      <div className="text-[10px] text-content-tertiary leading-snug">{m.description}</div>
                      <div className="text-[9px] text-content-faint mt-0.5">{m.cost}</div>
                    </div>
                    {isLocked && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 font-medium whitespace-nowrap">
                        Enterprise
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
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
            title="Choisir les colonnes"
          >
            <Columns3 size={14} />
            <span className="hidden sm:inline">Colonnes</span>
          </button>
          {showColumnPicker && (
            <div className="absolute z-50 top-full mt-1 right-0 w-52 rounded-lg border border-line bg-surface-card shadow-xl py-1">
              <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-content-muted font-semibold">
                Colonnes visibles
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
                  {col.required && <span className="ml-auto text-[9px] text-content-faint">requis</span>}
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
          title="Exporter en CSV standard"
        >
          <Download size={14} />
          <span className="hidden sm:inline">CSV</span>
        </button>
        <button
          onClick={() => handleExport("zoho")}
          disabled={folderProspects.length === 0}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-line hover:bg-surface-elevated text-content-tertiary hover:text-content-primary text-xs font-medium transition disabled:opacity-30"
          title="Exporter au format Zoho CRM"
        >
          <FileSpreadsheet size={14} />
          <span className="hidden sm:inline">Zoho</span>
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
            title="Aperçu de l'export"
          >
            <Eye size={14} />
            <span className="hidden sm:inline">Aperçu</span>
          </button>
          {showExportPreview && folderProspects.length > 0 && (
            <div className="absolute right-0 top-full mt-2 z-50 w-[600px] max-w-[90vw] rounded-xl border border-line bg-surface-elevated shadow-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-line flex items-center justify-between">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-content-faint">Aperçu CSV</h4>
                <button onClick={() => setShowExportPreview(false)} className="p-1 rounded hover:bg-surface-card text-content-muted hover:text-content-primary transition">
                  <X size={14} />
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-line bg-surface-deep">
                      <th className="px-3 py-2 text-left font-medium text-content-faint uppercase tracking-wider text-[10px]">Nom</th>
                      <th className="px-3 py-2 text-left font-medium text-content-faint uppercase tracking-wider text-[10px]">Adresse</th>
                      <th className="px-3 py-2 text-left font-medium text-content-faint uppercase tracking-wider text-[10px]">Telephone</th>
                      <th className="px-3 py-2 text-left font-medium text-content-faint uppercase tracking-wider text-[10px]">Email</th>
                      <th className="px-3 py-2 text-left font-medium text-content-faint uppercase tracking-wider text-[10px]">Note</th>
                      <th className="px-3 py-2 text-left font-medium text-content-faint uppercase tracking-wider text-[10px]">Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {folderProspects.slice(0, 5).map((p) => (
                      <tr key={p.id} className="border-b border-line/50 hover:bg-surface-card/50">
                        <td className="px-3 py-2 text-content-primary truncate max-w-[120px]">{p.nom || '\u2014'}</td>
                        <td className="px-3 py-2 text-content-secondary truncate max-w-[140px]">{p.adresse || '\u2014'}</td>
                        <td className="px-3 py-2 text-content-secondary font-mono">{p.telephone || '\u2014'}</td>
                        <td className="px-3 py-2 text-green-400/70 truncate max-w-[140px]">{p.email || '\u2014'}</td>
                        <td className="px-3 py-2 text-amber-400 font-mono">{p.note != null ? p.note : '\u2014'}</td>
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
                5 premieres lignes sur {folderProspects.length} total
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
          title={showDeleteConfirm ? "Cliquez pour confirmer" : "Supprimer les prospects"}
        >
          {showDeleteConfirm ? (
            <>
              <AlertTriangle size={14} />
              <span className="hidden sm:inline">Confirmer</span>
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
            placeholder="Rechercher par nom, email, téléphone..."
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
          <option value="all">Tous les départements</option>
          {Object.entries(DEPTS).map(([code, dept]) => (
            <option key={code} value={code}>{code} {dept.name}</option>
          ))}
        </select>
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="px-3 py-2.5 bg-surface-card border border-line rounded-xl text-xs text-content-tertiary focus:outline-none focus:border-indigo-500/30"
        >
          <option value="all">Tous les types</option>
          <option value="b2b">B2B</option>
          <option value="copro">Copro</option>
          <option value="custom">Custom</option>
        </select>
      </div>

      {/* Email quality legend */}
      <div className="hidden sm:flex flex-wrap gap-3 px-3 py-2.5 items-center rounded-xl border border-line/50 bg-surface-card/50">
        <span className="text-[10px] text-content-muted font-semibold uppercase tracking-wider">Qualite email :</span>
        {[
          { method: 'scrape', badge: <EmailBadge method="scrape" /> },
          { method: 'apollo', badge: <EmailBadge method="apollo" /> },
          { method: 'serper', badge: <EmailBadge method="serper" /> },
          { method: 'deep-pattern', badge: <EmailBadge method="deep-pattern" /> },
          { method: 'guess', badge: <EmailBadge method="guess" /> },
        ].map(({ method, badge }) => {
          const info = EMAIL_METHOD_INFO[method];
          return (
            <div key={method} className="relative group/legend flex items-center gap-1.5 cursor-help">
              {badge}
              <span className="text-[10px] text-content-faint group-hover/legend:text-content-tertiary transition-colors">{info.label}</span>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2.5 py-1.5 bg-surface-elevated border border-line-hover rounded-lg text-[10px] text-content-secondary leading-relaxed w-56 opacity-0 group-hover/legend:opacity-100 pointer-events-none transition-opacity z-30 shadow-xl">
                {info.tip}
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
              {selectedIds.size} sélectionné{selectedIds.size > 1 ? 's' : ''}
            </span>
            <button
              onClick={() => {
                const ids = Array.from(selectedIds);
                const withoutEmail = prospects.filter(p => ids.includes(p.id) && p.site_web && !p.email);
                if (withoutEmail.length > 0) {
                  onBulkEnrich?.(null, null, ids);
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-[11px] font-medium transition"
            >
              <Zap size={12} />
              Enrichir
            </button>
            <button
              onClick={deleteSelected}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600/10 border border-red-600/20 text-red-400 text-[11px] font-medium hover:bg-red-600/20 transition"
            >
              <Trash2 size={12} />
              Supprimer
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="ml-auto text-[11px] text-content-muted hover:text-content-secondary transition"
            >
              Désélectionner
            </button>
          </div>
        </div>
      )}

      {/* Mobile card layout (< md) */}
      <div className="md:hidden space-y-2">
        {displayProspects.map((p) => {
          const methodInfo = EMAIL_METHOD_INFO[p.email_method];
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
                    <span className="text-content-faint italic text-[10px]">Non trouve</span>
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
                    {p.nb_avis > 0 && <span className="text-content-faint text-[10px]">({p.nb_avis} avis)</span>}
                  </div>
                )}
              </div>

              <div className="mt-2 pl-8 flex items-center justify-between">
                <div className="flex flex-wrap gap-1 items-center">
                  {(prospectTagMap?.[p.id] || []).map(tagId => {
                    const tag = tags?.find(t => t.id === tagId);
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
                {/* Select all checkbox */}
                <th className="px-2 py-3 w-8">
                  <button
                    onClick={toggleSelectAll}
                    className="p-0.5 rounded hover:bg-surface-elevated transition"
                  >
                    {selectedIds.size > 0 && selectedIds.size === displayProspects.length ? (
                      <CheckSquare size={14} className="text-indigo-400" />
                    ) : selectedIds.size > 0 ? (
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
                    <span className="flex items-center">Type<InfoTooltip text="B2B = entreprise, Copro = syndic/gestion immobiliere, Custom = recherche personnalisee" /></span>
                  </th>
                )}
                {visibleCols.nom && (
                  <th className="px-4 py-3 text-left font-medium text-content-faint uppercase tracking-wider text-[10px]">Nom</th>
                )}
                {visibleCols.telephone && (
                  <th className="px-4 py-3 text-left font-medium text-content-faint uppercase tracking-wider text-[10px]">Téléphone</th>
                )}
                {visibleCols.email && (
                  <th className="px-4 py-3 text-left font-medium text-content-faint uppercase tracking-wider text-[10px]">
                    <span className="flex items-center">Email<InfoTooltip text="La couleur indique la source : vert = trouve sur le site, jaune = Google, orange = Apollo, ambre = devine (contact@). Survolez un email pour voir la source." wide /></span>
                  </th>
                )}
                {visibleCols.site && (
                  <th className="px-4 py-3 text-left font-medium text-content-faint uppercase tracking-wider text-[10px]">Site</th>
                )}
                {visibleCols.note && (
                  <th className="px-4 py-3 text-left font-medium text-content-faint uppercase tracking-wider text-[10px]">
                    <span className="flex items-center">Note<InfoTooltip text="Note moyenne Google Maps (sur 5) et nombre d'avis entre parentheses. Une note elevee avec beaucoup d'avis indique une entreprise active." wide /></span>
                  </th>
                )}
                {visibleCols.dept && (
                  <th className="px-4 py-3 text-left font-medium text-content-faint uppercase tracking-wider text-[10px]">
                    <span className="flex items-center">Dept<InfoTooltip text="Departement francais (code INSEE). 101 departements couverts : metropole + outre-mer." /></span>
                  </th>
                )}
                {visibleCols.score && (
                  <th className="px-3 py-2 text-left text-xs font-medium text-content-tertiary">
                    <span className="flex items-center">Score<InfoTooltip text="Score de qualite du lead (0-100). Base sur : email verifie (+30), telephone (+20), site web (+15), bonne note Google (+15), avis (+10), adresse (+10). Plus le score est eleve, plus le lead est exploitable." wide /></span>
                  </th>
                )}
                {visibleCols.tags && (
                  <th className="px-3 py-2 text-left text-xs font-medium text-content-tertiary">
                    <span className="flex items-center">Tags<InfoTooltip text="Etiquettes personnalisees pour organiser vos leads. Cliquez + pour ajouter un tag, cliquez sur un tag pour le retirer." /></span>
                  </th>
                )}
                <th className="px-3 py-2 text-center text-[10px] font-medium text-content-faint uppercase tracking-wider w-10"></th>
              </tr>
            </thead>
            <tbody>
              {displayProspects.map((p, idx) => {
                const methodInfo = EMAIL_METHOD_INFO[p.email_method];
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
                            placeholder="Nom"
                          />
                          <input
                            value={editData.adresse}
                            onChange={(e) => setEditData({ ...editData, adresse: e.target.value })}
                            className="w-full px-2 py-1 bg-surface-base border border-line-hover rounded text-[10px] text-content-secondary focus:outline-none focus:border-indigo-500"
                            placeholder="Adresse"
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
                          placeholder="Telephone"
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
                          placeholder="Email"
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
                              title="Copier l'email"
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
                          <span className="italic text-content-faint">Non trouve</span>
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
                          const tag = tags?.find(t => t.id === tagId);
                          if (!tag) return null;
                          return (
                            <span
                              key={tagId}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-violet-500/20 text-violet-400 cursor-pointer hover:opacity-70"
                              onClick={() => onToggleProspectTag?.(p.id, tagId)}
                              title="Cliquer pour retirer"
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
                            title="Sauvegarder"
                          >
                            <Save size={13} />
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="p-1 rounded hover:bg-surface-elevated text-content-muted transition"
                            title="Annuler"
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
                            Oui
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-surface-elevated text-content-tertiary hover:bg-line-hover transition"
                          >
                            Non
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
                                Modifier
                              </button>
                              <button
                                onClick={() => { setDeleteConfirmId(p.id); setActionMenuId(null); }}
                                className="w-full text-left px-3 py-1.5 text-xs text-red-400/70 hover:bg-red-600/10 hover:text-red-400 flex items-center gap-2 transition"
                              >
                                <Trash2 size={12} />
                                Supprimer
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
            {filteredProspects.length} résultat{filteredProspects.length > 1 ? 's' : ''}
            {filteredProspects.length !== prospects.length && ` sur ${prospects.length}`}
          </span>
          {prospectsWithoutEmail > 0 && (
            <span className="text-[10px] text-amber-500/70 flex items-center gap-1">
              <Mail size={10} />
              {prospectsWithoutEmail} sans email
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
    </div>
  );
})
