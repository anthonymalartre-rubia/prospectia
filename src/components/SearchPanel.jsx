"use client";

import { useState, useRef, useEffect } from "react";
import { DEPTS, REGIONS, B2B_CATS, COPRO_CATS, B2B_GROUPS, COPRO_GROUPS, COUNTRIES, getRegionsForCountry, getDeptsForCountry } from "@/lib/constants";
import { useI18n } from "@/lib/i18n";
import OnboardingHint from "@/components/OnboardingHint";
import {
  Send, Square, Sparkles, MapPin, Building2, Home, Search, PenLine, Loader2,
  Plus, X, Play, RotateCcw, ChevronRight, FolderPlus, Folder, Zap,
  UtensilsCrossed, Briefcase, Building, Hotel, HardHat, ShoppingBag, ArrowRight,
  Globe, User, Users, ExternalLink, Mail, Phone, Crown, Link2,
  CheckCircle2,
} from "lucide-react";

// LinkedIn SVG icon (lucide-react doesn't include brand icons)
function LinkedInIcon({ size = 16, className = '' }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  );
}

// Avatar bot — gradient brand unifié (violet/indigo). Avant : indigo→purple
// (off-palette). Aligne le SearchPanel sur la même identité que la landing.
const BOT_AVATAR_GRADIENT = 'bg-gradient-to-br from-violet-600 to-indigo-600';

function BotMessage({ children, icon: Icon, delay = 0 }) {
  const [visible, setVisible] = useState(delay === 0);
  useEffect(() => {
    if (delay > 0) {
      const t = setTimeout(() => setVisible(true), delay);
      return () => clearTimeout(t);
    }
  }, [delay]);

  if (!visible) {
    return (
      <div className="flex items-start gap-3">
        <div className={`w-7 h-7 rounded-lg ${BOT_AVATAR_GRADIENT} flex items-center justify-center flex-shrink-0`}>
          <Sparkles size={13} className="text-white" />
        </div>
        <div className="flex gap-1 py-3">
          <div className="w-1.5 h-1.5 bg-content-faint rounded-full animate-bounce [animation-delay:0ms]" />
          <div className="w-1.5 h-1.5 bg-content-faint rounded-full animate-bounce [animation-delay:150ms]" />
          <div className="w-1.5 h-1.5 bg-content-faint rounded-full animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className={`w-7 h-7 rounded-lg ${BOT_AVATAR_GRADIENT} flex items-center justify-center flex-shrink-0 mt-0.5`}>
        {Icon ? <Icon size={13} className="text-white" /> : <Sparkles size={13} className="text-white" />}
      </div>
      <div className="flex-1 text-sm text-content-primary leading-relaxed">{children}</div>
    </div>
  );
}

function UserMessage({ children }) {
  // User bubble : violet pour cohérence avec le brand (avant: indigo).
  return (
    <div className="flex justify-end animate-in fade-in slide-in-from-bottom-2 duration-200">
      <div className="bg-violet-600/20 border border-violet-500/20 rounded-xl px-4 py-2 text-sm text-violet-300 max-w-[80%]">
        {children}
      </div>
    </div>
  );
}

// OptionChips : un seul accent (violet) au lieu de 3 couleurs distinctes
// (indigo/blue/purple). Le paramètre colorClass est conservé pour compat
// API mais ignoré — toute la palette utilise désormais violet.
function OptionChips({ options, selected, onToggle, colorClass = "violet" }) {
  const activeClass = 'bg-violet-600/20 border-violet-500/30 text-violet-400';
  const inactiveClass = 'border-line-hover text-content-tertiary hover:border-content-faint hover:text-content-secondary';

  return (
    <div className="flex flex-wrap gap-2 animate-in fade-in duration-300">
      {options.map((opt) => {
        const value = typeof opt === 'string' ? opt : opt.value;
        const label = typeof opt === 'string' ? opt : opt.label;
        const isActive = selected.includes(value);
        return (
          <button
            key={value}
            onClick={() => onToggle(value)}
            className={`px-3.5 py-2.5 sm:py-2 min-h-[44px] sm:min-h-0 rounded-xl text-sm font-medium border transition-all active:scale-[0.97] ${isActive ? activeClass : inactiveClass}`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

const FOLDER_COLORS = [
  { value: 'indigo', label: 'Indigo', class: 'bg-indigo-500' },
  { value: 'blue', label: 'Bleu', class: 'bg-blue-500' },
  { value: 'purple', label: 'Violet', class: 'bg-purple-500' },
  { value: 'green', label: 'Vert', class: 'bg-green-500' },
  { value: 'amber', label: 'Ambre', class: 'bg-amber-500' },
  { value: 'rose', label: 'Rose', class: 'bg-rose-500' },
];

// OnboardingHint a été déplacé dans src/components/OnboardingHint.jsx (P2 cleanup).

const QUICK_SEARCH_PRESETS = [
  {
    id: 'restaurants-paris',
    nameKey: 'search.examples.restaurants',
    subtitleKey: 'search.estimatedExamples.small',
    icon: UtensilsCrossed,
    type: 'b2b',
    depts: ['75'],
    cats: ['restaurant'],
  },
  {
    id: 'b2b-idf',
    nameKey: 'search.examples.b2b',
    subtitleKey: 'search.estimatedExamples.medium',
    icon: Briefcase,
    type: 'b2b',
    depts: ['75', '77', '78', '91', '92', '93', '94', '95'],
    cats: 'ALL_B2B',
  },
  {
    id: 'syndics-france',
    nameKey: 'search.examples.syndics',
    subtitleKey: 'search.estimatedExamples.large',
    icon: Building,
    type: 'copro',
    depts: 'ALL',
    cats: 'ALL_COPRO',
  },
  {
    id: 'hotels-cote-azur',
    nameKey: 'search.examples.hotels',
    subtitleKey: 'search.estimatedExamples.custom',
    icon: Hotel,
    type: 'b2b',
    depts: ['06', '83', '13'],
    cats: ['hôtel', "chambre d'hôtes", 'résidence hôtelière', 'camping'],
  },
  {
    id: 'artisans-btp-lyon',
    nameKey: 'search.examples.artisans',
    subtitleKey: 'search.estimatedExamples.artisans',
    icon: HardHat,
    type: 'b2b',
    depts: ['69'],
    cats: B2B_GROUPS['BTP & Construction'],
  },
  {
    id: 'commerces-bordeaux',
    nameKey: 'search.examples.commerce',
    subtitleKey: 'search.estimatedExamples.commerce',
    icon: ShoppingBag,
    type: 'b2b',
    depts: ['33'],
    cats: B2B_GROUPS['Commerce & Distribution'],
  },
];

export default function SearchPanel({
  onStartScraping,
  onStopScraping,
  isSearching,
  apiKeySet,
  searchProgress,
  folders = [],
  onCreateFolder,
  onNavigateToLeads,
  totalProspects = 0,
}) {
  const { t } = useI18n();
  const [step, setStep] = useState(0);
  const [searchType, setSearchType] = useState(null);
  const [selectedCountry, setSelectedCountry] = useState('FR');
  const [selectedDepts, setSelectedDepts] = useState([]);
  const [selectedCats, setSelectedCats] = useState([]);
  const [customQueries, setCustomQueries] = useState([]);
  const [customInput, setCustomInput] = useState('');
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderColor, setNewFolderColor] = useState('indigo');
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const scrollRef = useRef(null);

  // ─── Company & LinkedIn search state ───────────────────
  const [companySearchMode, setCompanySearchMode] = useState(null); // 'company' | 'linkedin' | null
  const [companyName, setCompanyName] = useState('');
  const [companyDomain, setCompanyDomain] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [companySearching, setCompanySearching] = useState(false);
  const [companyResults, setCompanyResults] = useState(null);
  const [companyError, setCompanyError] = useState('');

  useEffect(() => {
    if (scrollRef.current) {
      setTimeout(() => {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }, 50);
    }
  }, [step, searchType, selectedDepts, selectedCats, customQueries, confirmed, isSearching, showNewFolder, companySearchMode, companyResults]);

  const [deptSearch, setDeptSearch] = useState('');
  const [expandedRegions, setExpandedRegions] = useState(new Set());
  const [catSearch, setCatSearch] = useState('');
  const [expandedCatGroups, setExpandedCatGroups] = useState(new Set());

  // ─── Recherche rapide (1 vue, bypass wizard) ──────────────────
  // Inspiré du retour audit UX : le wizard 5 étapes est trop long pour
  // un user qui sait déjà ce qu'il veut ("des restos à Paris"). Cette
  // bar permet de lancer une recherche cat × dept en 2 clics + 1 bouton.
  const [quickCat, setQuickCat] = useState('');
  const [quickDept, setQuickDept] = useState('');
  const [quickError, setQuickError] = useState('');

  const handleQuickSearch = () => {
    setQuickError('');
    // Normalise l'input cat : on accepte le label exact OU une recherche partielle
    const allCats = [...B2B_CATS, ...COPRO_CATS];
    const matchedCat = allCats.find(c => c.toLowerCase() === quickCat.toLowerCase())
      || allCats.find(c => c.toLowerCase().includes(quickCat.toLowerCase()));
    if (!matchedCat) {
      setQuickError('Catégorie non reconnue. Choisis dans la liste ou utilise la recherche guidée plus bas.');
      return;
    }
    // Normalise le département : on accepte "75", "Paris", "75 - Paris"...
    const allDepts = Object.entries(DEPTS); // [['75', 'Paris'], ...]
    const q = quickDept.trim().toLowerCase();
    const matchedDept = allDepts.find(([code, name]) =>
      code === q || name.toLowerCase() === q || `${code} - ${name.toLowerCase()}` === q || name.toLowerCase().includes(q)
    );
    if (!matchedDept) {
      setQuickError('Département non reconnu. Tape un code (ex: 75) ou un nom (ex: Paris).');
      return;
    }
    // Détermine le type (b2b ou copro) selon la cat trouvée
    const type = COPRO_CATS.includes(matchedCat) ? 'copro' : 'b2b';
    // Reproduit la logique de handlePresetSearch
    setSearchType(type);
    setSelectedDepts([matchedDept[0]]);
    setSelectedCats([matchedCat]);
    setCustomQueries([]);
    setCustomInput('');
    setFreeSearchTerms([]);
    setFreeSearchInput('');
    setNlInput('');
    setNlError('');
    setSelectedFolder(null);
    setNewFolderName('');
    setShowNewFolder(false);
    setConfirmed(false);
    setStep(4); // jump direct au step "confirm" — l'user voit le résumé et lance
  };

  const activeRegions = getRegionsForCountry(selectedCountry);
  const activeDepts = getDeptsForCountry(selectedCountry);

  const toggleRegion = (regionKey) => {
    const region = activeRegions[regionKey];
    if (!region) return;
    const allSelected = region.depts.every(d => selectedDepts.includes(d));
    if (allSelected) {
      setSelectedDepts(prev => prev.filter(d => !region.depts.includes(d)));
    } else {
      setSelectedDepts(prev => [...new Set([...prev, ...region.depts])]);
    }
  };

  const toggleRegionExpand = (regionKey) => {
    setExpandedRegions(prev => {
      const next = new Set(prev);
      if (next.has(regionKey)) next.delete(regionKey); else next.add(regionKey);
      return next;
    });
  };

  const selectAllDepts = () => setSelectedDepts(Object.keys(activeDepts));
  const clearAllDepts = () => setSelectedDepts([]);

  const handleCountryChange = (code) => {
    setSelectedCountry(code);
    setSelectedDepts([]);
    setExpandedRegions(new Set());
    setDeptSearch('');
  };

  const handleTypeSelect = (type) => {
    setSearchType(type);
    setSelectedDepts([]);
    setStep(1);
  };

  const [freeSearchInput, setFreeSearchInput] = useState('');
  const [freeSearchTerms, setFreeSearchTerms] = useState([]);
  const [nlInput, setNlInput] = useState('');
  const [nlParsing, setNlParsing] = useState(false);
  const [nlError, setNlError] = useState('');

  const handleNlSubmit = async () => {
    if (!nlInput.trim() || nlParsing) return;
    setNlParsing(true);
    setNlError('');
    try {
      const res = await fetch('/api/parse-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: nlInput.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t('common.error'));
      if (data.terms && data.terms.length > 0) {
        setFreeSearchTerms(data.terms);
        setSearchType('custom');
        setStep(1);
      }
    } catch (err) {
      setNlError(err.message || t('search.analysisError'));
    } finally {
      setNlParsing(false);
    }
  };

  const addFreeSearch = () => {
    if (freeSearchInput.trim()) {
      setFreeSearchTerms((prev) => [...prev, freeSearchInput.trim()]);
      setFreeSearchInput('');
    }
  };

  const toggleDept = (code) => {
    setSelectedDepts((prev) =>
      prev.includes(code) ? prev.filter((d) => d !== code) : [...prev, code]
    );
  };

  const toggleCat = (cat) => {
    setSelectedCats((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const toggleCatGroupExpand = (groupName) => {
    setExpandedCatGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupName)) next.delete(groupName);
      else next.add(groupName);
      return next;
    });
  };

  const toggleCatGroup = (cats) => {
    setSelectedCats((prev) => {
      const allSelected = cats.every((c) => prev.includes(c));
      if (allSelected) return prev.filter((c) => !cats.includes(c));
      return [...new Set([...prev, ...cats])];
    });
  };

  const selectAllCats = (groups) => {
    const all = Object.values(groups).flat();
    setSelectedCats((prev) => [...new Set([...prev, ...all])]);
  };

  const clearAllCats = (groups) => {
    const all = Object.values(groups).flat();
    setSelectedCats((prev) => prev.filter((c) => !all.includes(c)));
  };

  const confirmDepts = () => {
    if (selectedDepts.length === 0) return;
    if (searchType === 'custom') {
      setSelectedCats([]);
      setStep(2); // goes to free search input
    } else {
      if (searchType === 'b2b') setSelectedCats([...B2B_CATS]);
      else if (searchType === 'copro') setSelectedCats([...COPRO_CATS]);
      else setSelectedCats([...B2B_CATS, ...COPRO_CATS]);
      setStep(2);
    }
  };

  const confirmCats = () => {
    if (searchType === 'custom') {
      if (freeSearchTerms.length === 0) return;
    } else {
      if (selectedCats.length === 0) return;
    }
    setStep(4);
  };

  const selectFolder = (folder) => {
    setSelectedFolder(folder);
    setStep(5);
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    const folder = await onCreateFolder(newFolderName.trim(), newFolderColor);
    if (folder) {
      setSelectedFolder(folder);
      setNewFolderName('');
      setShowNewFolder(false);
      setStep(5);
    }
  };

  const handleLaunch = () => {
    setConfirmed(true);
    const b2b = searchType === 'b2b' || searchType === 'both'
      ? selectedCats.filter((c) => B2B_CATS.includes(c))
      : [];
    const copro = searchType === 'copro' || searchType === 'both'
      ? selectedCats.filter((c) => COPRO_CATS.includes(c))
      : [];
    const allCustom = searchType === 'custom'
      ? [...freeSearchTerms, ...customQueries]
      : customQueries;
    onStartScraping(selectedDepts, b2b, copro, allCustom, selectedFolder?.id);
  };

  const handleReset = () => {
    setStep(0);
    setSearchType(null);
    setSelectedCountry('FR');
    setSelectedDepts([]);
    setSelectedCats([]);
    setCustomQueries([]);
    setCustomInput('');
    setFreeSearchTerms([]);
    setFreeSearchInput('');
    setNlInput('');
    setNlError('');
    setSelectedFolder(null);
    setNewFolderName('');
    setShowNewFolder(false);
    setConfirmed(false);
  };

  // ─── Company contacts / LinkedIn search ─────────────────
  const handleCompanySearch = async () => {
    if (companySearchMode === 'linkedin') {
      if (!linkedinUrl.trim()) return;
      // Validate LinkedIn URL
      if (!linkedinUrl.includes('linkedin.com/in/')) {
        setCompanyError(t('search.linkedinPlaceholder'));
        return;
      }
    } else {
      if (!companyName.trim() && !companyDomain.trim()) return;
    }

    setCompanySearching(true);
    setCompanyError('');
    setCompanyResults(null);

    try {
      const body = companySearchMode === 'linkedin'
        ? { linkedin_url: linkedinUrl.trim() }
        : {
          company_name: companyName.trim() || undefined,
          company_domain: companyDomain.trim() || undefined,
        };

      const res = await fetch('/api/company-contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) {
        setCompanyError(data.error || `${t('common.error')} ${res.status}`);
        return;
      }

      setCompanyResults(data);
    } catch (err) {
      setCompanyError(err.message || t('search.connectionError'));
    } finally {
      setCompanySearching(false);
    }
  };

  const resetCompanySearch = () => {
    setCompanySearchMode(null);
    setCompanyName('');
    setCompanyDomain('');
    setLinkedinUrl('');
    setCompanyResults(null);
    setCompanyError('');
  };

  const handlePresetSearch = (preset) => {
    const depts = preset.depts === 'ALL' ? Object.keys(DEPTS) : preset.depts;
    let cats;
    if (preset.cats === 'ALL_B2B') cats = [...B2B_CATS];
    else if (preset.cats === 'ALL_COPRO') cats = [...COPRO_CATS];
    else cats = [...preset.cats];

    setSearchType(preset.type);
    setSelectedDepts(depts);
    setSelectedCats(cats);
    setCustomQueries([]);
    setCustomInput('');
    setFreeSearchTerms([]);
    setFreeSearchInput('');
    setNlInput('');
    setNlError('');
    setSelectedFolder(null);
    setNewFolderName('');
    setShowNewFolder(false);
    setConfirmed(false);
    setStep(4);
  };

  const b2bCount = selectedCats.filter((c) => B2B_CATS.includes(c)).length;
  const coproCount = selectedCats.filter((c) => COPRO_CATS.includes(c)).length;
  const totalQueries = selectedDepts.length * selectedCats.length + customQueries.length;

  const progress = searchProgress?.total > 0
    ? (searchProgress.current / searchProgress.total) * 100
    : 0;

  const folderColorClass = (color) => {
    const map = { indigo: 'bg-indigo-500', blue: 'bg-blue-500', purple: 'bg-purple-500', green: 'bg-green-500', amber: 'bg-amber-500', rose: 'bg-rose-500' };
    return map[color] || map.indigo;
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-content-primary mb-1">{t('search.title')}</h2>
        <p className="text-sm text-content-muted">{t('search.subtitle')}</p>
      </div>

      {!apiKeySet && (
        <div className="flex items-start gap-3 p-4 rounded-xl border border-amber-300 bg-amber-500/5 mb-6">
          <Sparkles size={18} className="text-amber-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-600">{t('search.configRequired')}</p>
            <p className="text-xs text-content-tertiary mt-1">
              {t('search.configRequiredDesc')}
            </p>
          </div>
        </div>
      )}

      <div
        ref={scrollRef}
        className="rounded-2xl border border-line bg-surface-card overflow-hidden"
      >
        <div className="p-3 sm:p-5 space-y-4 sm:space-y-5 max-h-[calc(100vh-9rem)] overflow-y-auto">

          {/* Step 1: Type */}
          <BotMessage>
            {t('search.whatType')}
          </BotMessage>

          {/* Onboarding hint for new users */}
          {step === 0 && !searchType && (
            <div className="pl-2 sm:pl-10">
              <OnboardingHint storageKey="hint_search_dismissed">
                {t('search.onboardingHint')}
              </OnboardingHint>
            </div>
          )}

          {/* Recherche rapide en 1 vue — bypass le wizard 5 étapes pour
              les users qui savent déjà ce qu'ils veulent. */}
          {step === 0 && !searchType && (
            <div className="pl-2 sm:pl-10 animate-in fade-in duration-300">
              <div className="rounded-xl border border-indigo-500/30 bg-gradient-to-br from-indigo-500/[0.06] to-violet-500/[0.06] p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                    <Zap size={12} className="text-indigo-300" />
                  </div>
                  <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider">Recherche rapide</span>
                  <span className="text-[10px] text-content-muted">— moins de 30 secondes</span>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="flex-1 min-w-0">
                    <input
                      type="text"
                      list="volia-quick-cats"
                      value={quickCat}
                      onChange={(e) => { setQuickCat(e.target.value); setQuickError(''); }}
                      placeholder="Restaurant, avocat, agence web…"
                      className="w-full rounded-lg border border-line bg-surface-card px-3 py-2.5 text-sm text-content-primary placeholder-content-muted focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
                      aria-label="Catégorie d'entreprise"
                    />
                    <datalist id="volia-quick-cats">
                      {[...B2B_CATS, ...COPRO_CATS].slice(0, 100).map((c) => (
                        <option key={c} value={c} />
                      ))}
                    </datalist>
                  </div>
                  <div className="sm:w-40">
                    <input
                      type="text"
                      list="volia-quick-depts"
                      value={quickDept}
                      onChange={(e) => { setQuickDept(e.target.value); setQuickError(''); }}
                      placeholder="Paris, 75, Lyon…"
                      className="w-full rounded-lg border border-line bg-surface-card px-3 py-2.5 text-sm text-content-primary placeholder-content-muted focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
                      aria-label="Département ou ville"
                    />
                    <datalist id="volia-quick-depts">
                      {Object.entries(DEPTS).map(([code, name]) => (
                        <option key={code} value={`${code} - ${name}`} />
                      ))}
                    </datalist>
                  </div>
                  <button
                    type="button"
                    onClick={handleQuickSearch}
                    disabled={!quickCat.trim() || !quickDept.trim()}
                    className="px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all disabled:bg-indigo-600/30 disabled:cursor-not-allowed disabled:text-content-muted flex items-center justify-center gap-2 whitespace-nowrap shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30"
                  >
                    <Search size={14} />
                    Lancer
                  </button>
                </div>
                {quickError && (
                  <p className="text-xs text-red-400 mt-2 flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-red-400" />
                    {quickError}
                  </p>
                )}
                <p className="text-[10px] text-content-muted mt-2 leading-relaxed">
                  Astuce : pour une recherche multi-catégories ou multi-départements, utilise la recherche guidée ci-dessous.
                </p>
              </div>
            </div>
          )}

          {/* Quick search presets */}
          {step === 0 && !searchType && (
            <div className="pl-2 sm:pl-10 space-y-3 animate-in fade-in duration-300">
              <div className="flex items-center gap-2">
                <Zap size={14} className="text-amber-600" />
                <span className="text-xs font-semibold text-amber-600">{t('search.quickSearches')}</span>
              </div>
              <p className="text-[10px] text-content-muted -mt-1">{t('search.quickSearchDesc')}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {QUICK_SEARCH_PRESETS.map((preset) => {
                  const PresetIcon = preset.icon;
                  return (
                    <button
                      key={preset.id}
                      onClick={() => handlePresetSearch(preset)}
                      className="group flex items-center gap-3 px-3.5 py-3 rounded-xl border border-amber-300 bg-amber-500/5 hover:bg-amber-500/10 hover:border-amber-500 transition-all active:scale-[0.97] text-left"
                    >
                      <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-300 flex items-center justify-center flex-shrink-0 group-hover:bg-amber-500/20 transition">
                        <PresetIcon size={15} className="text-amber-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-content-primary truncate">{t(preset.nameKey)}</div>
                        <div className="text-[10px] text-content-muted">{t(preset.subtitleKey)}</div>
                      </div>
                      <ArrowRight size={14} className="text-amber-500/40 group-hover:text-amber-600 transition flex-shrink-0" />
                    </button>
                  );
                })}
              </div>

              {/* Separator */}
              <div className="flex items-center gap-3 pt-1">
                <div className="flex-1 h-px bg-line" />
                <span className="text-[10px] text-content-faint uppercase tracking-wider font-medium">{t('search.orConfigureSearch')}</span>
                <div className="flex-1 h-px bg-line" />
              </div>
            </div>
          )}

          {step === 0 && !searchType && (
            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 pl-2 sm:pl-10 animate-in fade-in duration-300">
              <button
                onClick={() => handleTypeSelect('b2b')}
                className="flex items-center gap-2 px-4 py-3 sm:py-2.5 min-h-[44px] rounded-xl border border-line-hover text-sm font-medium text-content-secondary hover:border-blue-500/30 hover:text-blue-400 hover:bg-blue-600/10 transition-all active:scale-[0.97]"
              >
                <Building2 size={15} />
                {t('search.b2bCompanies')}
              </button>
              <button
                onClick={() => handleTypeSelect('copro')}
                className="flex items-center gap-2 px-4 py-3 sm:py-2.5 min-h-[44px] rounded-xl border border-line-hover text-sm font-medium text-content-secondary hover:border-purple-500/30 hover:text-purple-400 hover:bg-purple-600/10 transition-all active:scale-[0.97]"
              >
                <Home size={15} />
                {t('search.coproSyndics')}
              </button>
              <button
                onClick={() => handleTypeSelect('both')}
                className="flex items-center gap-2 px-4 py-3 sm:py-2.5 min-h-[44px] rounded-xl border border-line-hover text-sm font-medium text-content-secondary hover:border-indigo-500/30 hover:text-indigo-400 hover:bg-indigo-600/10 transition-all active:scale-[0.97]"
              >
                <Sparkles size={15} />
                {t('search.both')}
              </button>
            </div>
          )}

          {step === 0 && !searchType && (
            <div className="pl-2 sm:pl-10 space-y-2 animate-in fade-in duration-500">
              <p className="text-[10px] uppercase tracking-wider text-content-faint font-semibold">{t('search.orDescribe')}</p>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <PenLine size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-content-faint" />
                  <input
                    type="text"
                    value={nlInput}
                    onChange={(e) => setNlInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleNlSubmit()}
                    placeholder={t('search.nlPlaceholder')}
                    disabled={nlParsing}
                    className="w-full pl-9 pr-4 py-3 sm:py-2.5 min-h-[44px] rounded-xl border border-line-hover bg-surface-input text-sm text-content-primary placeholder-content-faint focus:outline-none focus:border-amber-500/40 transition disabled:opacity-50"
                  />
                </div>
                <button
                  onClick={handleNlSubmit}
                  disabled={!nlInput.trim() || nlParsing}
                  className="px-4 py-3 sm:py-2.5 min-h-[44px] rounded-xl bg-amber-500/10 border border-amber-400 text-amber-600 text-sm font-medium hover:bg-amber-500/20 transition disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {nlParsing ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  {nlParsing ? t('search.analyzing') : t('search.analyze')}
                </button>
              </div>
              {nlError && (
                <p className="text-xs text-red-400">{nlError}</p>
              )}
            </div>
          )}

          {/* ─── Company & LinkedIn direct search ─────────────── */}
          {step === 0 && !searchType && (
            <div className="pl-2 sm:pl-10 space-y-3 animate-in fade-in duration-500">
              <div className="flex items-center gap-3 pt-1">
                <div className="flex-1 h-px bg-line" />
                <span className="text-[10px] text-content-faint uppercase tracking-wider font-medium">{t('search.targetedProspecting')}</span>
                <div className="flex-1 h-px bg-line" />
              </div>

              {!companySearchMode && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    onClick={() => setCompanySearchMode('company')}
                    className="group flex items-center gap-3 px-3.5 py-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 hover:border-emerald-500/40 transition-all active:scale-[0.97] text-left"
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-500/20 transition">
                      <Building2 size={15} className="text-emerald-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-content-primary">{t('search.companySearch')}</div>
                      <div className="text-[10px] text-content-muted">{t('search.findKeyContacts')}</div>
                    </div>
                    <ArrowRight size={14} className="text-emerald-500/40 group-hover:text-emerald-400 transition flex-shrink-0" />
                  </button>
                  <button
                    onClick={() => setCompanySearchMode('linkedin')}
                    className="group flex items-center gap-3 px-3.5 py-3 rounded-xl border border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10 hover:border-blue-500/40 transition-all active:scale-[0.97] text-left"
                  >
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-500/20 transition">
                      <LinkedInIcon size={15} className="text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-content-primary">{t('search.linkedinProfile')}</div>
                      <div className="text-[10px] text-content-muted">{t('search.enrichLinkedin')}</div>
                    </div>
                    <ArrowRight size={14} className="text-blue-500/40 group-hover:text-blue-400 transition flex-shrink-0" />
                  </button>
                </div>
              )}

              {/* Company search form */}
              {companySearchMode === 'company' && (
                <div className="space-y-3 animate-in fade-in duration-300">
                  <div className="flex items-center gap-2">
                    <Building2 size={14} className="text-emerald-400" />
                    <span className="text-xs font-semibold text-emerald-400">{t('search.companySearch')}</span>
                  </div>
                  <div className="space-y-2">
                    <div className="relative">
                      <Building2 size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-content-faint" />
                      <input
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleCompanySearch()}
                        placeholder={t('search.companyNamePlaceholder')}
                        className="w-full pl-9 pr-4 py-2.5 min-h-[44px] rounded-xl border border-line-hover bg-surface-input text-sm text-content-primary placeholder-content-faint focus:outline-none focus:border-emerald-500/40 transition"
                      />
                    </div>
                    <div className="relative">
                      <Globe size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-content-faint" />
                      <input
                        type="text"
                        value={companyDomain}
                        onChange={(e) => setCompanyDomain(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleCompanySearch()}
                        placeholder={t('search.domainPlaceholder')}
                        className="w-full pl-9 pr-4 py-2.5 min-h-[44px] rounded-xl border border-line-hover bg-surface-input text-sm text-content-primary placeholder-content-faint focus:outline-none focus:border-emerald-500/40 transition"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleCompanySearch}
                      disabled={(!companyName.trim() && !companyDomain.trim()) || companySearching}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-surface-elevated disabled:text-content-faint text-white text-sm font-semibold transition active:scale-[0.97] disabled:cursor-not-allowed"
                    >
                      {companySearching ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                      {companySearching ? t('search.searching') : t('search.findContacts')}
                    </button>
                    <button
                      onClick={resetCompanySearch}
                      className="px-3 py-2.5 min-h-[44px] rounded-xl border border-line-hover text-content-muted hover:text-content-secondary transition"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              )}

              {/* LinkedIn search form */}
              {companySearchMode === 'linkedin' && (
                <div className="space-y-3 animate-in fade-in duration-300">
                  <div className="flex items-center gap-2">
                    <LinkedInIcon size={14} className="text-blue-400" />
                    <span className="text-xs font-semibold text-blue-400">{t('search.linkedinEnrichment')}</span>
                  </div>
                  <div className="relative">
                    <LinkedInIcon size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-content-faint" />
                    <input
                      type="url"
                      value={linkedinUrl}
                      onChange={(e) => setLinkedinUrl(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleCompanySearch()}
                      placeholder="https://linkedin.com/in/prenom-nom"
                      className="w-full pl-9 pr-4 py-2.5 min-h-[44px] rounded-xl border border-line-hover bg-surface-input text-sm text-content-primary placeholder-content-faint focus:outline-none focus:border-blue-500/40 transition"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleCompanySearch}
                      disabled={!linkedinUrl.trim() || companySearching}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-surface-elevated disabled:text-content-faint text-white text-sm font-semibold transition active:scale-[0.97] disabled:cursor-not-allowed"
                    >
                      {companySearching ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                      {companySearching ? t('search.searching') : t('search.enrichProfile')}
                    </button>
                    <button
                      onClick={resetCompanySearch}
                      className="px-3 py-2.5 min-h-[44px] rounded-xl border border-line-hover text-content-muted hover:text-content-secondary transition"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              )}

              {/* Error */}
              {companyError && (
                <p className="text-xs text-red-400 pl-1">{companyError}</p>
              )}

              {/* Results */}
              {companyResults && (
                <div className="space-y-3 animate-in fade-in duration-300">
                  {/* Company info card */}
                  {companyResults.company && (
                    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <Building2 size={14} className="text-emerald-400" />
                        <span className="text-sm font-semibold text-emerald-400">{companyResults.company.name || t('search.company')}</span>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-content-secondary">
                        {companyResults.company.industry && (
                          <span>{t('search.sector')}: {companyResults.company.industry}</span>
                        )}
                        {companyResults.company.employees && (
                          <span>{t('search.employees')}: ~{companyResults.company.employees}</span>
                        )}
                        {companyResults.company.domain && (
                          <span className="flex items-center gap-1">
                            <Globe size={10} />
                            {companyResults.company.domain}
                          </span>
                        )}
                        {companyResults.company.linkedin_url && (
                          <a
                            href={companyResults.company.linkedin_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-blue-400 hover:text-blue-300 transition"
                          >
                            <LinkedInIcon size={10} />
                            LinkedIn
                            <ExternalLink size={9} />
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Contacts list */}
                  {companyResults.contacts?.length > 0 ? (
                    <>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Users size={13} className="text-content-muted" />
                        <span className="text-[10px] uppercase tracking-wider text-content-faint font-semibold">
                          {t('search.contactsFound', { count: companyResults.contacts.length })}
                        </span>
                      </div>
                      {companyResults.contacts.map((contact, i) => (
                        <div key={i} className="rounded-xl border border-line bg-surface-card p-3 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                                <User size={13} className="text-indigo-400" />
                              </div>
                              <div>
                                <div className="text-sm font-medium text-content-primary">
                                  {contact.name || t('search.contact')}
                                </div>
                                {contact.title && (
                                  <div className="text-[10px] text-content-muted">{contact.title}</div>
                                )}
                              </div>
                            </div>
                            {contact.linkedin_url && (
                              <a
                                href={contact.linkedin_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 rounded-lg text-blue-400 hover:bg-blue-500/10 transition"
                              >
                                <LinkedInIcon size={14} />
                              </a>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-2 text-[11px]">
                            {contact.email && (
                              <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                                <Mail size={10} />
                                {contact.email}
                              </span>
                            )}
                            {contact.phone && (
                              <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-400">
                                <Phone size={10} />
                                {contact.phone}
                              </span>
                            )}
                          </div>
                          {contact.company && (
                            <div className="text-[10px] text-content-faint">
                              {contact.company}{contact.company_domain ? ` (${contact.company_domain})` : ''}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    {companyResults.source && (
                      <div className="text-[10px] text-content-faint text-right">
                        {t('search.source')} : {companyResults.source === 'apollo' ? 'Apollo.io' : companyResults.source === 'serper' ? 'Serper.dev' : companyResults.source.includes('guess') ? t('search.guessedEmail') : companyResults.source}
                      </div>
                    )}
                  </>
                  ) : (
                    <div className="text-center py-4 text-sm text-content-muted">
                      {t('search.noContactsFound')}
                    </div>
                  )}

                  {/* New search button */}
                  <button
                    onClick={resetCompanySearch}
                    className="flex items-center gap-2 text-sm text-content-muted hover:text-content-secondary transition"
                  >
                    <RotateCcw size={13} />
                    {t('search.newSearch')}
                  </button>
                </div>
              )}
            </div>
          )}

          {searchType && (
            <UserMessage>
              {searchType === 'b2b' ? t('search.b2bCompanies') : searchType === 'copro' ? t('search.coproSyndics') : searchType === 'custom' ? `"${nlInput}"` : t('search.b2bAndCopro')}
            </UserMessage>
          )}

          {/* Step 2: Country + Departments */}
          {step >= 1 && (
            <>
              <BotMessage icon={MapPin} delay={step === 1 ? 400 : 0}>
                <div>
                  {t('search.whichCountry')} <span className="text-content-muted">{t('search.selectCountryThenRegions')}</span>
                </div>
              </BotMessage>

              {step === 1 && (
                <div className="pl-2 sm:pl-10 space-y-3">
                  {/* Country selector */}
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(COUNTRIES).map(([code, country]) => (
                      <button
                        key={code}
                        onClick={() => handleCountryChange(code)}
                        className={`flex items-center gap-2 px-3.5 py-2.5 sm:py-2 min-h-[44px] sm:min-h-0 rounded-xl text-sm font-medium border transition-all active:scale-[0.97] ${
                          selectedCountry === code
                            ? 'bg-indigo-600/20 border-indigo-500/30 text-indigo-400'
                            : 'border-line-hover text-content-tertiary hover:border-content-faint hover:text-content-secondary'
                        }`}
                      >
                        <span className="text-base">{country.flag}</span>
                        {country.name}
                        <span className="text-[10px] text-content-faint font-mono">{country.zones}</span>
                      </button>
                    ))}
                  </div>

                  {/* Search + quick actions */}
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-content-faint" />
                      <input
                        type="text"
                        value={deptSearch}
                        onChange={(e) => setDeptSearch(e.target.value)}
                        placeholder={selectedCountry === 'FR' ? t('search.searchDept') : selectedCountry === 'CH' ? t('search.searchCanton') : t('search.searchProvince')}
                        className="w-full pl-8 pr-3 py-2.5 sm:py-2 min-h-[44px] sm:min-h-0 bg-surface-card border border-line rounded-lg text-xs text-content-primary placeholder-content-faint focus:outline-none focus:border-indigo-500/30 transition"
                      />
                    </div>
                    <button onClick={selectAllDepts} className="px-2.5 py-2.5 sm:py-2 min-h-[44px] sm:min-h-0 rounded-lg bg-surface-card border border-line text-[10px] text-content-muted hover:text-content-primary transition whitespace-nowrap">
                      {t('search.selectAll')}
                    </button>
                    <button onClick={clearAllDepts} className="px-2.5 py-2.5 sm:py-2 min-h-[44px] sm:min-h-0 rounded-lg bg-surface-card border border-line text-[10px] text-content-muted hover:text-content-primary transition whitespace-nowrap">
                      {t('search.none')}
                    </button>
                  </div>
                  {/* Selected count */}
                  {selectedDepts.length > 0 && (
                    <div className="text-[10px] text-indigo-400 font-medium">
                      {COUNTRIES[selectedCountry]?.flag} {t('search.zonesSelected', { count: selectedDepts.length })}
                    </div>
                  )}
                  {/* Regions */}
                  <div className="max-h-48 sm:max-h-64 overflow-y-auto space-y-1 pr-1 -webkit-overflow-scrolling-touch">
                    {Object.entries(activeRegions).map(([key, region]) => {
                      const q = deptSearch.toLowerCase();
                      const matchingDepts = region.depts.filter(code => {
                        const d = activeDepts[code];
                        if (!d) return false;
                        if (!q) return true;
                        return code.toLowerCase().includes(q) || d.name.toLowerCase().includes(q) || region.name.toLowerCase().includes(q);
                      });
                      if (matchingDepts.length === 0) return null;
                      const allSelected = matchingDepts.every(d => selectedDepts.includes(d));
                      const someSelected = matchingDepts.some(d => selectedDepts.includes(d));
                      const isExpanded = expandedRegions.has(key) || deptSearch.length > 0;
                      return (
                        <div key={key} className="rounded-lg border border-line overflow-hidden">
                          <div className="flex items-center gap-2 px-3 py-2 bg-surface-card hover:bg-surface-hover transition cursor-pointer"
                            onClick={() => toggleRegionExpand(key)}>
                            <button
                              onClick={(e) => { e.stopPropagation(); toggleRegion(key); }}
                              className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] transition ${
                                allSelected ? 'bg-indigo-600 border-indigo-600 text-white' :
                                someSelected ? 'bg-indigo-600/30 border-indigo-500 text-white' :
                                'border-content-faint bg-transparent'
                              }`}
                            >
                              {allSelected ? '✓' : someSelected ? '−' : ''}
                            </button>
                            <span className="text-xs font-medium text-content-primary flex-1">{region.name}</span>
                            <span className="text-[10px] text-content-muted font-mono">
                              {matchingDepts.filter(d => selectedDepts.includes(d)).length}/{matchingDepts.length}
                            </span>
                            <ChevronRight size={12} className={`text-content-faint transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                          </div>
                          {isExpanded && (
                            <div className="flex flex-wrap gap-1.5 px-3 py-2 bg-surface-base border-t border-line">
                              {matchingDepts.map(code => {
                                const d = activeDepts[code];
                                const isSelected = selectedDepts.includes(code);
                                return (
                                  <button
                                    key={code}
                                    onClick={() => toggleDept(code)}
                                    className={`px-2 py-1 rounded-md border text-[10px] font-medium transition ${
                                      isSelected
                                        ? 'bg-indigo-600/20 border-indigo-500/30 text-indigo-400'
                                        : 'border-line text-content-muted hover:border-content-faint hover:text-content-secondary'
                                    }`}
                                  >
                                    {d.name}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <button
                    onClick={confirmDepts}
                    disabled={selectedDepts.length === 0}
                    className="flex items-center gap-1.5 text-sm font-medium text-indigo-400 hover:text-indigo-300 transition disabled:text-content-faint disabled:cursor-not-allowed min-h-[44px] sm:min-h-0"
                  >
                    {t('search.continue')} <ChevronRight size={14} />
                  </button>
                </div>
              )}

              {step > 1 && (
                <UserMessage>
                  {COUNTRIES[selectedCountry]?.flag} {selectedDepts.length > 10
                    ? t('search.zonesSelectedCount', { count: selectedDepts.length })
                    : selectedDepts.map((d) => activeDepts[d]?.name || d).join(', ')}
                </UserMessage>
              )}
            </>
          )}

          {/* Step 3: Categories or Free Search */}
          {step >= 2 && (
            <>
              {searchType === 'custom' ? (
                <BotMessage icon={PenLine} delay={step === 2 ? 400 : 0}>
                  <div>
                    {t('search.whatBusinessTypes')} <span className="text-content-muted">{t('search.typeSearchTerms')}</span>
                  </div>
                </BotMessage>
              ) : (
                <BotMessage icon={searchType === 'copro' ? Home : Building2} delay={step === 2 ? 400 : 0}>
                  <div>
                    {t('search.whichCategories')} <span className="text-content-muted">{t('search.allSelectedByDefault')}</span>
                  </div>
                </BotMessage>
              )}

              {step === 2 && searchType === 'custom' && (
                <div className="pl-2 sm:pl-10 space-y-3 animate-in fade-in duration-300">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={freeSearchInput}
                      onChange={(e) => setFreeSearchInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addFreeSearch()}
                      placeholder={t('search.freeSearchPlaceholder')}
                      className="flex-1 bg-surface-deep border border-line rounded-xl px-4 py-3 sm:py-2.5 min-h-[44px] text-sm text-content-primary placeholder-content-faint focus:outline-none focus:border-amber-500/40 transition"
                    />
                    <button
                      onClick={addFreeSearch}
                      disabled={!freeSearchInput.trim()}
                      className="px-3 py-3 sm:py-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-surface-elevated hover:bg-line-hover text-content-secondary transition disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  {freeSearchTerms.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {freeSearchTerms.map((t, i) => (
                        <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-300 text-amber-600 text-xs font-medium">
                          {t}
                          <button
                            onClick={() => setFreeSearchTerms((prev) => prev.filter((_, idx) => idx !== i))}
                            className="text-amber-600 hover:text-amber-700"
                            aria-label={`Retirer ${t}`}
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <button
                    onClick={confirmCats}
                    disabled={freeSearchTerms.length === 0}
                    className="flex items-center gap-1.5 text-sm font-medium text-indigo-400 hover:text-indigo-300 transition disabled:text-content-faint disabled:cursor-not-allowed"
                  >
                    {t('search.continue')} <ChevronRight size={14} />
                  </button>
                </div>
              )}

              {step === 2 && searchType !== 'custom' && (
                <div className="pl-2 sm:pl-10 space-y-3">
                  {/* Search + select/deselect */}
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-content-faint" />
                      <input
                        type="text"
                        value={catSearch}
                        onChange={(e) => setCatSearch(e.target.value)}
                        placeholder={t('search.searchCategory')}
                        className="w-full pl-7 pr-3 py-2.5 sm:py-1.5 min-h-[44px] sm:min-h-0 rounded-lg bg-surface-input border border-line text-xs text-content-primary placeholder:text-content-faint focus:outline-none focus:border-indigo-500/50"
                      />
                    </div>
                  </div>

                  {/* B2B groups */}
                  {(searchType === 'b2b' || searchType === 'both') && (
                    <div className="space-y-1">
                      {searchType === 'both' && (
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] uppercase tracking-wider text-blue-400/60 font-semibold">{t('search.b2bCompanies')}</p>
                          <div className="flex gap-2">
                            <button onClick={() => selectAllCats(B2B_GROUPS)} className="text-[10px] text-blue-400/60 hover:text-blue-400 transition">{t('search.selectAll')}</button>
                            <button onClick={() => clearAllCats(B2B_GROUPS)} className="text-[10px] text-content-faint hover:text-content-secondary transition">{t('search.none')}</button>
                          </div>
                        </div>
                      )}
                      {searchType === 'b2b' && (
                        <div className="flex justify-end gap-2">
                          <button onClick={() => selectAllCats(B2B_GROUPS)} className="text-[10px] text-blue-400/60 hover:text-blue-400 transition">{t('search.selectAll')}</button>
                          <button onClick={() => clearAllCats(B2B_GROUPS)} className="text-[10px] text-content-faint hover:text-content-secondary transition">{t('search.deselectAll')}</button>
                        </div>
                      )}
                      {Object.entries(B2B_GROUPS).map(([groupName, cats]) => {
                        const q = catSearch.toLowerCase();
                        const matchingCats = q ? cats.filter((c) => c.toLowerCase().includes(q)) : cats;
                        if (matchingCats.length === 0) return null;
                        const selectedInGroup = matchingCats.filter((c) => selectedCats.includes(c)).length;
                        const isExpanded = expandedCatGroups.has(groupName) || !!catSearch;
                        return (
                          <div key={groupName} className="rounded-lg border border-line overflow-hidden">
                            <button
                              onClick={() => toggleCatGroupExpand(groupName)}
                              className="w-full flex items-center justify-between px-3 py-2 bg-surface-card hover:bg-surface-hover transition"
                            >
                              <div className="flex items-center gap-2">
                                <ChevronRight size={12} className={`text-content-faint transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                                <span className="text-xs font-medium text-content-primary">{groupName}</span>
                                <span className="text-[10px] text-content-faint">({selectedInGroup}/{matchingCats.length})</span>
                              </div>
                              <button
                                onClick={(e) => { e.stopPropagation(); toggleCatGroup(matchingCats); }}
                                className={`text-[10px] px-2 py-0.5 rounded-md transition ${
                                  selectedInGroup === matchingCats.length
                                    ? 'text-blue-400 bg-blue-500/10'
                                    : 'text-content-faint hover:text-content-secondary'
                                }`}
                              >
                                {selectedInGroup === matchingCats.length ? t('search.deselectAll') : t('search.selectAll')}
                              </button>
                            </button>
                            {isExpanded && (
                              <div className="flex flex-wrap gap-1.5 px-3 py-2 bg-surface-base border-t border-line">
                                {matchingCats.map((cat) => {
                                  const isSelected = selectedCats.includes(cat);
                                  return (
                                    <button
                                      key={cat}
                                      onClick={() => toggleCat(cat)}
                                      className={`px-2 py-1 rounded-md border text-[10px] font-medium transition ${
                                        isSelected
                                          ? 'bg-blue-600/20 border-blue-500/30 text-blue-400'
                                          : 'border-line text-content-muted hover:border-content-faint hover:text-content-secondary'
                                      }`}
                                    >
                                      {cat}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Copro groups */}
                  {(searchType === 'copro' || searchType === 'both') && (
                    <div className="space-y-1">
                      {searchType === 'both' && (
                        <div className="flex items-center justify-between pt-2">
                          <p className="text-[10px] uppercase tracking-wider text-purple-400/60 font-semibold">{t('search.coproSyndics')}</p>
                          <div className="flex gap-2">
                            <button onClick={() => selectAllCats(COPRO_GROUPS)} className="text-[10px] text-purple-400/60 hover:text-purple-400 transition">{t('search.selectAll')}</button>
                            <button onClick={() => clearAllCats(COPRO_GROUPS)} className="text-[10px] text-content-faint hover:text-content-secondary transition">{t('search.none')}</button>
                          </div>
                        </div>
                      )}
                      {searchType === 'copro' && (
                        <div className="flex justify-end gap-2">
                          <button onClick={() => selectAllCats(COPRO_GROUPS)} className="text-[10px] text-purple-400/60 hover:text-purple-400 transition">{t('search.selectAll')}</button>
                          <button onClick={() => clearAllCats(COPRO_GROUPS)} className="text-[10px] text-content-faint hover:text-content-secondary transition">{t('search.deselectAll')}</button>
                        </div>
                      )}
                      {Object.entries(COPRO_GROUPS).map(([groupName, cats]) => {
                        const q = catSearch.toLowerCase();
                        const matchingCats = q ? cats.filter((c) => c.toLowerCase().includes(q)) : cats;
                        if (matchingCats.length === 0) return null;
                        const selectedInGroup = matchingCats.filter((c) => selectedCats.includes(c)).length;
                        const isExpanded = expandedCatGroups.has(groupName) || !!catSearch;
                        return (
                          <div key={groupName} className="rounded-lg border border-line overflow-hidden">
                            <button
                              onClick={() => toggleCatGroupExpand(groupName)}
                              className="w-full flex items-center justify-between px-3 py-2 bg-surface-card hover:bg-surface-hover transition"
                            >
                              <div className="flex items-center gap-2">
                                <ChevronRight size={12} className={`text-content-faint transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                                <span className="text-xs font-medium text-content-primary">{groupName}</span>
                                <span className="text-[10px] text-content-faint">({selectedInGroup}/{matchingCats.length})</span>
                              </div>
                              <button
                                onClick={(e) => { e.stopPropagation(); toggleCatGroup(matchingCats); }}
                                className={`text-[10px] px-2 py-0.5 rounded-md transition ${
                                  selectedInGroup === matchingCats.length
                                    ? 'text-purple-400 bg-purple-500/10'
                                    : 'text-content-faint hover:text-content-secondary'
                                }`}
                              >
                                {selectedInGroup === matchingCats.length ? t('search.deselectAll') : t('search.selectAll')}
                              </button>
                            </button>
                            {isExpanded && (
                              <div className="flex flex-wrap gap-1.5 px-3 py-2 bg-surface-base border-t border-line">
                                {matchingCats.map((cat) => {
                                  const isSelected = selectedCats.includes(cat);
                                  return (
                                    <button
                                      key={cat}
                                      onClick={() => toggleCat(cat)}
                                      className={`px-2 py-1 rounded-md border text-[10px] font-medium transition ${
                                        isSelected
                                          ? 'bg-purple-600/20 border-purple-500/30 text-purple-400'
                                          : 'border-line text-content-muted hover:border-content-faint hover:text-content-secondary'
                                      }`}
                                    >
                                      {cat}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <button
                    onClick={confirmCats}
                    disabled={selectedCats.length === 0}
                    className="flex items-center gap-1.5 text-sm font-medium text-indigo-400 hover:text-indigo-300 transition disabled:text-content-faint disabled:cursor-not-allowed"
                  >
                    {t('search.continue')} <ChevronRight size={14} />
                  </button>
                </div>
              )}

              {step > 2 && (
                <UserMessage>
                  {searchType === 'custom'
                    ? t('search.searchTermsCount', { count: freeSearchTerms.length })
                    : <>
                        {t('search.categoriesSelected', { count: selectedCats.length })}
                        {searchType === 'both' && ` (${b2bCount} B2B, ${coproCount} Copro)`}
                      </>
                  }
                </UserMessage>
              )}
            </>
          )}

          {/* Step 4: Folder selection */}
          {step >= 4 && (
            <>
              <BotMessage icon={Folder} delay={step === 4 ? 400 : 0}>
                {t('search.whichList')}
              </BotMessage>

              {step === 4 && (
                <div className="pl-10 space-y-3 animate-in fade-in duration-300">
                  {/* Existing folders */}
                  {folders.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {folders.map((f) => (
                        <button
                          key={f.id}
                          onClick={() => selectFolder(f)}
                          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-line-hover text-sm font-medium text-content-secondary hover:border-indigo-500/30 hover:text-content-primary hover:bg-surface-elevated transition-all active:scale-[0.97]"
                        >
                          <div className={`w-2.5 h-2.5 rounded-full ${folderColorClass(f.color)}`} />
                          {f.name}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Create new folder */}
                  {!showNewFolder ? (
                    <button
                      onClick={() => setShowNewFolder(true)}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-line-hover text-sm font-medium text-content-muted hover:border-indigo-500/30 hover:text-indigo-400 transition-all active:scale-[0.97]"
                    >
                      <FolderPlus size={15} />
                      {t('search.createNewList')}
                    </button>
                  ) : (
                    <div className="rounded-xl bg-surface-deep border border-line p-4 space-y-3">
                      <input
                        type="text"
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
                        placeholder={t('search.listNamePlaceholder')}
                        autoFocus
                        className="w-full bg-transparent border border-line rounded-lg px-3 py-2 text-sm text-content-primary placeholder-content-faint focus:outline-none focus:border-indigo-500/40 transition"
                      />
                      <div className="flex gap-2">
                        {FOLDER_COLORS.map((c) => (
                          <button
                            key={c.value}
                            onClick={() => setNewFolderColor(c.value)}
                            className={`w-6 h-6 rounded-full ${c.class} transition-all ${newFolderColor === c.value ? 'ring-2 ring-offset-2 ring-offset-surface-deep ring-white/30 scale-110' : 'opacity-50 hover:opacity-80'}`}
                            title={c.label}
                          />
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleCreateFolder}
                          disabled={!newFolderName.trim()}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <Plus size={12} />
                          {t('search.create')}
                        </button>
                        <button
                          onClick={() => { setShowNewFolder(false); setNewFolderName(''); }}
                          className="px-3 py-1.5 rounded-lg text-xs text-content-muted hover:text-content-secondary transition"
                        >
                          {t('search.cancel')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {step > 4 && selectedFolder && (
                <UserMessage>
                  <span className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${folderColorClass(selectedFolder.color)}`} />
                    {selectedFolder.name}
                  </span>
                </UserMessage>
              )}
            </>
          )}

          {/* Step 6: Confirm & Launch */}
          {step >= 5 && !confirmed && (
            <BotMessage icon={Sparkles} delay={400}>
              <div className="space-y-3">
                <p>{t('search.searchReady')}</p>
                <div className="rounded-xl bg-surface-deep border border-line p-4 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-content-muted">{t('search.departments')}</span>
                    <span className="text-content-secondary font-mono">{selectedDepts.length}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-content-muted">{t('search.categories')}</span>
                    <span className="text-content-secondary font-mono">{selectedCats.length}</span>
                  </div>
                  {customQueries.length > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-content-muted">Custom</span>
                      <span className="text-content-secondary font-mono">{customQueries.length}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs">
                    <span className="text-content-muted">{t('search.list')}</span>
                    <span className="text-content-secondary flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${folderColorClass(selectedFolder?.color)}`} />
                      {selectedFolder?.name}
                    </span>
                  </div>
                  <div className="border-t border-line pt-2 flex justify-between text-xs">
                    <span className="text-content-tertiary font-medium">{t('search.totalQueries')}</span>
                    <span className="text-indigo-400 font-bold font-mono">{totalQueries}</span>
                  </div>
                </div>
                <div className="flex gap-3 pt-1">
                  <button
                    onClick={handleLaunch}
                    disabled={!apiKeySet}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-surface-elevated disabled:text-content-faint text-white font-semibold text-sm transition-all disabled:cursor-not-allowed shadow-lg shadow-indigo-600/20 disabled:shadow-none active:scale-[0.97]"
                  >
                    <Play size={14} />
                    {t('search.launch')}
                  </button>
                  <button
                    onClick={handleReset}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-line-hover text-sm text-content-muted hover:text-content-secondary hover:border-content-faint transition active:scale-[0.97]"
                  >
                    <RotateCcw size={14} />
                    {t('search.restart')}
                  </button>
                </div>
              </div>
            </BotMessage>
          )}

          {/* Search in progress */}
          {isSearching && (
            <BotMessage icon={Search}>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                  <span className="text-content-secondary">
                    {searchProgress?.currentQuery || t('search.initializing')}
                  </span>
                </div>
                <div className="h-1.5 bg-surface-elevated rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-600 to-purple-500 transition-all duration-300 rounded-full"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] font-mono text-content-faint">
                  <span>{searchProgress?.current}/{searchProgress?.total}</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <button
                  onClick={onStopScraping}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600/10 border border-red-600/20 hover:bg-red-600/20 text-red-400 text-sm font-medium transition active:scale-[0.97]"
                >
                  <Square size={14} />
                  {t('search.stopSearch')}
                </button>
              </div>
            </BotMessage>
          )}

          {/* Search complete — hero success card with primary CTA "Voir mes leads" */}
          {confirmed && !isSearching && (
            <div className="pl-2 sm:pl-10 animate-in fade-in slide-in-from-bottom-2 duration-400">
              <div className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-indigo-500/10 p-5 sm:p-6">
                {/* Decorative glow */}
                <div className="pointer-events-none absolute -top-12 -right-12 w-48 h-48 rounded-full bg-emerald-500/20 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-indigo-500/15 blur-3xl" />

                <div className="relative">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                      <CheckCircle2 size={24} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base sm:text-lg font-semibold text-content-primary leading-tight">
                        {t('search.searchCompleteTitle')}
                      </h3>
                      <p className="mt-1 text-sm text-content-secondary">
                        <span className="font-semibold text-emerald-500">
                          {(searchProgress?.savedCount ?? searchProgress?.current ?? 0).toLocaleString('fr-FR')}
                        </span>{' '}
                        {(searchProgress?.savedCount ?? searchProgress?.current ?? 0) === 1
                          ? t('search.searchCompleteSubtitleSingular')
                          : t('search.searchCompleteSubtitlePlural')}
                      </p>
                      <p className="mt-2 text-xs text-content-muted">
                        {t('search.searchCompleteNextStep')}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-col sm:flex-row gap-2.5">
                    <button
                      onClick={() => onNavigateToLeads && onNavigateToLeads()}
                      disabled={!onNavigateToLeads}
                      className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 hover:from-indigo-500 hover:to-purple-500 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Users size={16} />
                      {totalProspects > 0
                        ? t('search.viewMyLeadsWithCount').replace('{count}', totalProspects.toLocaleString('fr-FR'))
                        : t('search.viewMyLeads')}
                      <ArrowRight size={16} />
                    </button>
                    <button
                      onClick={handleReset}
                      className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-line-hover bg-surface-card text-sm font-medium text-content-secondary hover:text-content-primary hover:border-content-faint hover:bg-surface-elevated transition-all active:scale-[0.98]"
                    >
                      <RotateCcw size={14} />
                      {t('search.newSearch')}
                    </button>
                  </div>

                  {searchProgress?.logs?.length > 0 && (
                    <p className="mt-3 text-[11px] text-content-faint">
                      {searchProgress.logs[searchProgress.logs.length - 1]}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Logs */}
        {isSearching && searchProgress?.logs?.length > 0 && (
          <details className="border-t border-line">
            <summary className="px-5 py-2.5 text-[10px] uppercase tracking-wider text-content-faint font-semibold cursor-pointer hover:text-content-muted">
              {t('search.logs')} ({searchProgress.logs.length})
            </summary>
            <div className="px-5 pb-4 max-h-40 overflow-y-auto">
              <div className="font-mono text-[11px] text-content-faint space-y-0.5">
                {searchProgress.logs.slice(-20).map((log, i) => (
                  <div key={i} className={log.startsWith('Error') ? 'text-red-400/60' : ''}>
                    <span className="text-content-dim mr-2">{String(i + 1).padStart(2, '0')}</span>
                    {log}
                  </div>
                ))}
              </div>
            </div>
          </details>
        )}
      </div>
    </div>
  );
}
