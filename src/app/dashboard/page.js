'use client';

import { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react';
import { getSupabase } from '@/lib/supabase';
import { DEPTS, REGIONS, COUNTRIES, getDeptData, getCountryForDept, getRegionsForCountry, getDeptsForCountry } from '@/lib/constants';
import TopBar from '@/components/TopBar';
import Sidebar from '@/components/Sidebar';
import UsageBanner from '@/components/UsageBanner';
import UpgradeBanner from '@/components/UpgradeBanner';
import LimitReachedModal from '@/components/LimitReachedModal';
import { useRouter, useSearchParams } from 'next/navigation';

// Lazy load panels — only loaded when navigated to
const OverviewPanel = lazy(() => import('@/components/OverviewPanel'));
const SearchPanel = lazy(() => import('@/components/SearchPanel'));
const ResultsPanel = lazy(() => import('@/components/ResultsPanel'));
const ExportPanel = lazy(() => import('@/components/ExportPanel'));
const EmailVerifier = lazy(() => import('@/components/EmailVerifier'));
const OnboardingOverlay = lazy(() => import('@/components/OnboardingOverlay'));

const MAX_LOGS = 100;

function addLog(prev, message) {
  const logs = prev.logs.length >= MAX_LOGS
    ? [...prev.logs.slice(-MAX_LOGS + 1), message]
    : [...prev.logs, message];
  return { ...prev, logs };
}

// Extract root domain from a URL for deduplication (e.g. "https://www.road.io/foo" → "road.io")
function extractDomain(url) {
  if (!url) return null;
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, '');
    return hostname || null;
  } catch {
    return null;
  }
}

// Extract French department code from a postal address.
// Handles metropolitan (01-95), Corsica (2A/2B from 200xx/202xx), and DOM-TOM (971-976).
// Returns null if no valid code can be extracted.
function extractDeptFromAddress(addr) {
  if (!addr || typeof addr !== 'string') return null;
  const match = addr.match(/\b(\d{5})\b/);
  if (!match) return null;
  const cp = match[1];
  // DOM-TOM : 971xx-976xx → "971" à "976"
  if (cp.startsWith('97')) {
    const deptCode = cp.slice(0, 3);
    if (['971', '972', '973', '974', '976'].includes(deptCode)) return deptCode;
    return null;
  }
  // Corse : 200xx-201xx → "2A", 202xx-206xx → "2B"
  if (cp.startsWith('20')) {
    const n = parseInt(cp, 10);
    if (n >= 20000 && n <= 20190) return '2A';
    if (n >= 20200 && n <= 20620) return '2B';
    return null;
  }
  // Metropole : les 2 premiers chiffres du CP = code dept (01 à 95)
  const dept = cp.slice(0, 2);
  const n = parseInt(dept, 10);
  if (n >= 1 && n <= 95) return dept;
  return null;
}

// Escape CSV values to prevent injection (quotes, formulas)
function escapeCSV(value) {
  if (value == null) return '';
  let str = String(value);
  // Strip leading formula characters to prevent CSV injection
  str = str.replace(/^[=+\-@\t\r]/, "'$&");
  // Escape double quotes
  str = str.replace(/"/g, '""');
  return `"${str}"`;
}

// Generate a descriptive label for search sessions
function generateSessionLabel(depts, b2bCats, coproCats, customQueries) {
  // Build category part
  let catPart = '';
  const allCats = [...(b2bCats || []), ...(coproCats || [])];
  const customs = customQueries || [];

  if (allCats.length === 0 && customs.length > 0) {
    catPart = customs.length === 1 ? customs[0] : `${customs.length} recherches`;
  } else if (allCats.length === 1) {
    // Capitalize first letter
    catPart = allCats[0].charAt(0).toUpperCase() + allCats[0].slice(1);
  } else if (b2bCats.length > 0 && coproCats.length > 0) {
    catPart = 'B2B + Copro';
  } else if (b2bCats.length > 0) {
    catPart = b2bCats.length <= 2 ? b2bCats.map(c => c.charAt(0).toUpperCase() + c.slice(1)).join(', ') : `B2B (${b2bCats.length} cat.)`;
  } else if (coproCats.length > 0) {
    catPart = coproCats.length <= 2 ? coproCats.map(c => c.charAt(0).toUpperCase() + c.slice(1)).join(', ') : `Copro (${coproCats.length} cat.)`;
  }

  // Build department part — multi-country aware
  let deptPart = '';
  const countryCode = depts.length > 0 ? getCountryForDept(depts[0]) : 'FR';
  const countryDepts = getDeptsForCountry(countryCode);
  const countryRegions = getRegionsForCountry(countryCode);
  const totalDepts = Object.keys(countryDepts).length;
  const countryName = COUNTRIES[countryCode]?.name || 'France';

  if (depts.length >= totalDepts - 2) {
    deptPart = `${countryName} entiere`;
  } else if (depts.length === 1) {
    deptPart = getDeptData(depts[0])?.name || depts[0];
  } else {
    // Check if depts match a region
    const matchedRegion = Object.values(countryRegions).find(r => {
      const rDepts = r.depts.sort();
      const sDepts = [...depts].sort();
      return rDepts.length === sDepts.length && rDepts.every((d, i) => d === sDepts[i]);
    });
    if (matchedRegion) {
      deptPart = matchedRegion.name;
    } else {
      deptPart = `${depts.length} zones`;
    }
  }

  const label = catPart && deptPart
    ? `${catPart} \u2014 ${deptPart}`
    : catPart || deptPart || 'Recherche';

  // Truncate to ~40 chars
  return label.length > 42 ? label.slice(0, 39) + '...' : label;
}

export default function Dashboard() {
  const [prospects, setProspects] = useState([]);
  const [folders, setFolders] = useState([]);
  const [activeFolder, setActiveFolder] = useState('all'); // 'all' | folder id
  const [activeView, setActiveView] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [apiKeySet, setApiKeySet] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isEnriching, setIsEnriching] = useState(false);
  const [user, setUser] = useState(null);
  const [searchProgress, setSearchProgress] = useState({
    current: 0, total: 0, currentQuery: '', logs: [],
  });
  const [enrichProgress, setEnrichProgress] = useState({
    current: 0, total: 0, currentSite: '', logs: [],
    foundScrape: 0, foundGuess: 0,
  });
  const [userPlan, setUserPlan] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userUsage, setUserUsage] = useState(null);
  // Modal "limite atteinte" affichée quand une API renvoie 429
  // { type: 'searches'|'enrichments', current, limit, processed?, total? } | null
  const [limitModal, setLimitModal] = useState(null);
  const [isDeepEnriching, setIsDeepEnriching] = useState(false);
  const [deepEnrichProgress, setDeepEnrichProgress] = useState({
    current: 0, total: 0, currentSite: '', logs: [],
  });
  const [tags, setTags] = useState([]);
  const [prospectTagMap, setProspectTagMap] = useState({});
  const [searchHistory, setSearchHistory] = useState([]);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Refs to avoid stale closures in async loops
  const stopSearchRef = useRef(false);
  const stopEnrichRef = useRef(false);
  const stopDeepEnrichRef = useRef(false);

  const supabase = getSupabase();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get current user and load data on mount
  useEffect(() => {
    const initializeApp = async () => {
      if (!supabase) return;

      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        router.push('/login');
        return;
      }
      setUser(currentUser);

      // Load all data in parallel (instead of sequential — saves ~600ms)
      const month = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
      const { getPlan } = await import('@/lib/plans');

      // Supabase caps at 1000 rows per query — paginate to fetch all prospects
      async function fetchAllProspects() {
        const PAGE_SIZE = 1000;
        let allData = [];
        let from = 0;
        while (true) {
          const { data, error } = await supabase
            .from('prospects')
            .select('id,place_id,nom,adresse,telephone,email,email_method,site_web,note,nb_avis,type,departement,folder_id,search_session_id,created_at,updated_at,archived_at')
            .order('created_at', { ascending: false })
            .range(from, from + PAGE_SIZE - 1);
          if (error || !data || data.length === 0) break;
          allData = allData.concat(data);
          if (data.length < PAGE_SIZE) break;
          from += PAGE_SIZE;
        }
        return { data: allData, error: null };
      }

      const [
        profileRes,
        usageRes,
        healthRes,
        foldersRes,
        tagsRes,
        ptRes,
        prospectsRes,
        sessionsRes,
      ] = await Promise.all([
        supabase.from('user_profiles').select('plan, stripe_customer_id, is_admin').eq('id', currentUser.id).single(),
        supabase.from('usage_tracking').select('searches, enrichments, exports').eq('user_id', currentUser.id).eq('month', month).single(),
        fetch('/api/places').then(r => r.ok).catch(() => false),
        supabase.from('lead_folders').select('*').order('created_at', { ascending: true }),
        supabase.from('lead_tags').select('*').order('name'),
        supabase.from('prospect_tags').select('prospect_id, tag_id'),
        fetchAllProspects(),
        supabase.from('search_sessions').select('*').order('created_at', { ascending: false }).limit(20),
      ]);

      // Apply profile
      if (profileRes.data) {
        setUserPlan(getPlan(profileRes.data.plan));
        setIsAdmin(!!profileRes.data.is_admin);
      }

      // Apply usage
      setUserUsage(usageRes.data || { searches: 0, enrichments: 0, exports: 0 });

      // Apply API health
      setApiKeySet(healthRes);

      // Apply folders
      if (!foldersRes.error && foldersRes.data) setFolders(foldersRes.data);

      // Apply tags
      setTags(tagsRes.data || []);

      // Apply prospect-tag map
      const tagMap = {};
      (ptRes.data || []).forEach(pt => {
        if (!tagMap[pt.prospect_id]) tagMap[pt.prospect_id] = [];
        tagMap[pt.prospect_id].push(pt.tag_id);
      });
      setProspectTagMap(tagMap);

      // Apply prospects
      if (!prospectsRes.error && prospectsRes.data) setProspects(prospectsRes.data);

      // Apply search history
      setSearchHistory(sessionsRes.data || []);

      // Show onboarding for new users, or when triggered from settings (?onboarding=1)
      const loadedProspects = prospectsRes.data || [];
      const forceOnboarding = searchParams.get('onboarding') === '1';
      if (forceOnboarding || (loadedProspects.length === 0 && !localStorage.getItem('onboarding_completed'))) {
        setShowOnboarding(true);
        // Clean up the URL query param without reloading
        if (forceOnboarding) {
          router.replace('/dashboard', { scroll: false });
        }
      }
    };

    initializeApp();
  }, []);

  // Create folder
  const createFolder = useCallback(async (name, color) => {
    if (!supabase) return null;
    try {
      const { data, error } = await supabase
        .from('lead_folders')
        .insert({ name, color, user_id: user?.id })
        .select()
        .single();
      if (error) {
        console.error('Error creating folder:', error);
        return null;
      }
      setFolders((prev) => [...prev, data]);
      return data;
    } catch (error) {
      console.error('Error creating folder:', error);
      return null;
    }
  }, [supabase, user]);

  // Delete folder (moves prospects to unassigned)
  const deleteFolder = useCallback(async (folderId) => {
    if (!supabase) return;
    try {
      // Unassign prospects first
      await supabase
        .from('prospects')
        .update({ folder_id: null })
        .eq('folder_id', folderId);
      // Delete folder
      await supabase
        .from('lead_folders')
        .delete()
        .eq('id', folderId);
      setFolders((prev) => prev.filter((f) => f.id !== folderId));
      setProspects((prev) => prev.map((p) => p.folder_id === folderId ? { ...p, folder_id: null } : p));
      if (activeFolder === folderId) setActiveFolder('all');
    } catch (error) {
      console.error('Error deleting folder:', error);
    }
  }, [supabase, activeFolder]);

  // Tag CRUD
  const createTag = useCallback(async (name, color) => {
    if (!supabase || !user) return null;
    const { data } = await supabase
      .from('lead_tags')
      .insert({ user_id: user.id, name, color })
      .select()
      .single();
    if (data) setTags(prev => [...prev, data]);
    return data;
  }, [supabase, user]);

  const deleteTag = useCallback(async (tagId) => {
    if (!supabase) return;
    await supabase.from('lead_tags').delete().eq('id', tagId);
    setTags(prev => prev.filter(t => t.id !== tagId));
    setProspectTagMap(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(pid => {
        next[pid] = next[pid].filter(tid => tid !== tagId);
      });
      return next;
    });
  }, [supabase]);

  const toggleProspectTag = useCallback(async (prospectId, tagId) => {
    if (!supabase) return;
    setProspectTagMap(prev => {
      const current = prev[prospectId] || [];
      if (current.includes(tagId)) {
        supabase.from('prospect_tags').delete().eq('prospect_id', prospectId).eq('tag_id', tagId);
        return { ...prev, [prospectId]: current.filter(t => t !== tagId) };
      } else {
        supabase.from('prospect_tags').insert({ prospect_id: prospectId, tag_id: tagId });
        return { ...prev, [prospectId]: [...current, tagId] };
      }
    });
  }, [supabase]);

  // Start scraping function — now accepts folderId
  const startScraping = useCallback(async (depts, b2bCats, coproCats, customQueries, folderId) => {
    stopSearchRef.current = false;
    setIsSearching(true);
    setActiveView('search');
    setSearchProgress({ current: 0, total: 0, currentQuery: '', logs: [] });

    const taskList = [];
    for (const dept of depts) {
      const deptName = getDeptData(dept)?.name || dept;
      for (const cat of b2bCats) {
        taskList.push({ dept, deptName, category: cat, type: 'b2b' });
      }
      for (const cat of coproCats) {
        taskList.push({ dept, deptName, category: cat, type: 'copro' });
      }
      // Les recherches custom (langage naturel) doivent aussi tourner sur
      // CHAQUE département sélectionné, pas seulement le premier.
      if (customQueries?.length > 0) {
        for (const query of customQueries) {
          taskList.push({ dept, deptName, query, type: 'custom' });
        }
      }
    }

    const total = taskList.length;
    setSearchProgress((prev) => ({ ...prev, total }));

    // Save search session to DB
    let session = null;
    if (supabase && user) {
      const { data: sessionData } = await supabase.from('search_sessions').insert({
        user_id: user.id,
        departments: depts,
        categories: { b2b: b2bCats, copro: coproCats, custom: customQueries },
        query_count: taskList.length,
        results_count: 0,
        status: 'running',
        label: generateSessionLabel(depts, b2bCats, coproCats, customQueries),
        folder_id: folderId || null,
      }).select().single();
      session = sessionData;
    }

    const newProspects = [];
    const seenPlaceIds = new Set(prospects.map((p) => p.place_id));
    const seenDomains = new Set(prospects.map((p) => extractDomain(p.site_web)).filter(Boolean));

    for (let i = 0; i < taskList.length; i++) {
      if (stopSearchRef.current) break;

      const task = taskList[i];
      const queryStr = task.type === 'custom'
        ? task.query
        : `${task.category} ${task.deptName}`;

      setSearchProgress((prev) => ({
        ...addLog(prev, `Searching: ${queryStr}`),
        current: i + 1,
        currentQuery: queryStr,
      }));

      try {
        // POST to places API with query + dept
        const response = await fetch('/api/places', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: queryStr, dept: task.dept || depts[0] }),
        });
        const data = await response.json();

        if (response.status === 429) {
          setSearchProgress((prev) => addLog(prev, `Limite atteinte: ${data.error || 'Limite atteinte'}`));
          stopSearchRef.current = true;
          setLimitModal({
            type: 'searches',
            current: data.current ?? data.limit ?? 0,
            limit: data.limit ?? 0,
            processed: i,
            total: taskList.length,
          });
          break;
        }

        if (!response.ok) {
          setSearchProgress((prev) => addLog(prev, `API error (${response.status}): ${data.error || 'Unknown'}`));
          continue;
        }

        const placesCount = data.places?.length || 0;
        setSearchProgress((prev) => addLog(prev, `→ ${placesCount} résultats trouvés`));

        if (data.places && Array.isArray(data.places)) {
          let added = 0;
          let dupes = 0;
          for (const place of data.places) {
            if (seenPlaceIds.has(place.place_id)) { dupes++; continue; }

            // Deduplicate by website domain — keep the one with most reviews
            const domain = extractDomain(place.site_web);
            if (domain && seenDomains.has(domain)) {
              // Check if the new one is better (more reviews or higher rating)
              const existing = newProspects.find((p) => extractDomain(p.site_web) === domain);
              if (existing) {
                const existScore = (existing.nb_avis || 0) * 10 + (existing.note || 0);
                const newScore = (place.nb_avis || 0) * 10 + (place.note || 0);
                if (newScore > existScore) {
                  // Replace with the better one
                  Object.assign(existing, {
                    place_id: place.place_id,
                    nom: place.nom,
                    adresse: place.adresse || '',
                    telephone: place.telephone || existing.telephone,
                    site_web: place.site_web || '',
                    note: place.note || null,
                    nb_avis: place.nb_avis || 0,
                  });
                  seenPlaceIds.add(place.place_id);
                }
              }
              dupes++;
              continue;
            }

            seenPlaceIds.add(place.place_id);
            if (domain) seenDomains.add(domain);
            added++;
            newProspects.push({
              user_id: user.id,
              place_id: place.place_id,
              nom: place.nom,
              adresse: place.adresse || '',
              telephone: place.telephone || '',
              site_web: place.site_web || '',
              note: place.note || null,
              nb_avis: place.nb_avis || 0,
              type: task.type,
              // Priorité : code postal extrait de l'adresse Google (source de vérité),
              // sinon le département choisi dans la recherche, sinon null.
              departement: extractDeptFromAddress(place.adresse) || task.dept || null,
              folder_id: folderId || null,
            });
          }
          if (dupes > 0) {
            setSearchProgress((prev) => addLog(prev, `   (${dupes} doublons fusionnés)`));
          }
        }
      } catch (error) {
        setSearchProgress((prev) => addLog(prev, `Error: ${queryStr} - ${error.message}`));
      }

      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    setSearchProgress((prev) => addLog(prev, `Recherche terminée: ${newProspects.length} nouveaux prospects`));

    if (newProspects.length > 0 && supabase) {
      try {
        let saveError = false;
        // Insert in batches of 50 to avoid payload limits
        for (let i = 0; i < newProspects.length; i += 50) {
          const batch = newProspects.slice(i, i + 50);
          const { error } = await supabase
            .from('prospects')
            .insert(batch);

          if (error) {
            setSearchProgress((prev) => addLog(prev, `DB error: ${error.message} (code: ${error.code})`));
            saveError = true;
            break;
          }
        }
        if (!saveError) {
          setProspects((prev) => [...prev, ...newProspects]);
          setSearchProgress((prev) => addLog(prev, `✓ ${newProspects.length} prospects sauvegardés`));
        }
      } catch (error) {
        setSearchProgress((prev) => addLog(prev, `Exception: ${error.message}`));
      }
    } else if (newProspects.length === 0) {
      setSearchProgress((prev) => addLog(prev, `Aucun nouveau prospect (tous déjà existants)`));
    }

    // Update session status
    if (session?.id && supabase) {
      await supabase.from('search_sessions')
        .update({ status: 'completed', results_count: newProspects.length })
        .eq('id', session.id);
      setSearchHistory(prev => [
        { ...session, status: 'completed', results_count: newProspects.length },
        ...prev.slice(0, 19),
      ]);
    }

    setIsSearching(false);
  }, [prospects, user, supabase]);

  const handleUpgrade = async (planId = 'pro') => {
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      });
      const { url, error } = await res.json();
      if (url) window.location.href = url;
      if (error) alert(error);
    } catch (err) {
      alert('Erreur lors de la redirection vers le paiement.');
    }
  };

  const stopScraping = useCallback(() => {
    stopSearchRef.current = true;
    setIsSearching(false);
  }, []);

  // Enrichment
  const startEnrichment = useCallback(async () => {
    stopEnrichRef.current = false;
    setIsEnriching(true);
    setEnrichProgress({ current: 0, total: 0, currentSite: '', logs: [], foundScrape: 0, foundGuess: 0 });

    const prospectsToEnrich = prospects.filter((p) => p.site_web && !p.email);
    const total = prospectsToEnrich.length;
    setEnrichProgress((prev) => ({ ...prev, total }));

    let foundScrape = 0;
    let foundGuess = 0;

    for (let i = 0; i < prospectsToEnrich.length; i++) {
      if (stopEnrichRef.current) break;

      const prospect = prospectsToEnrich[i];
      setEnrichProgress((prev) => ({
        ...addLog(prev, `Enriching: ${prospect.nom}`),
        current: i + 1,
        currentSite: prospect.site_web,
      }));

      try {
        const response = await fetch('/api/enrich', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: prospect.site_web }),
        });
        const data = await response.json();

        if (response.status === 429) {
          setEnrichProgress((prev) => addLog(prev, `Limite atteinte: ${data.error || 'Limite atteinte'}`));
          stopEnrichRef.current = true;
          setLimitModal({
            type: 'enrichments',
            current: data.current ?? data.limit ?? 0,
            limit: data.limit ?? 0,
            processed: i,
            total: prospectsToEnrich.length,
          });
          break;
        }

        if (data.email) {
          const emailMethod = data.method || 'guess';
          if (emailMethod === 'scrape') foundScrape++;
          else if (emailMethod === 'guess') foundGuess++;

          setProspects((prev) =>
            prev.map((p) =>
              p.id === prospect.id
                ? { ...p, email: data.email, email_method: emailMethod }
                : p
            )
          );

          if (supabase) {
            await supabase
              .from('prospects')
              .update({ email: data.email, email_method: emailMethod })
              .eq('id', prospect.id);
          }

          setEnrichProgress((prev) => ({
            ...addLog(prev, `Found: ${data.email} (${emailMethod})`),
            foundScrape,
            foundGuess,
          }));
        } else {
          setEnrichProgress((prev) => addLog(prev, `No email: ${prospect.nom}`));
        }
      } catch (error) {
        setEnrichProgress((prev) => addLog(prev, `Error: ${prospect.nom} - ${error.message}`));
      }

      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    setIsEnriching(false);
  }, [prospects, supabase]);

  // Deep enrichment
  const startDeepEnrichment = useCallback(async () => {
    stopDeepEnrichRef.current = false;
    setIsDeepEnriching(true);
    setDeepEnrichProgress({ current: 0, total: 0, currentSite: '', logs: [] });

    const prospectsToEnrich = prospects.filter((p) => p.site_web);
    const total = prospectsToEnrich.length;
    setDeepEnrichProgress((prev) => ({ ...prev, total }));

    for (let i = 0; i < prospectsToEnrich.length; i++) {
      if (stopDeepEnrichRef.current) break;

      const prospect = prospectsToEnrich[i];
      setDeepEnrichProgress((prev) => ({
        ...addLog(prev, `Deep scan: ${prospect.nom}`),
        current: i + 1,
        currentSite: prospect.site_web,
      }));

      try {
        const response = await fetch('/api/enrich-deep', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: prospect.site_web }),
        });
        const data = await response.json();

        if (response.status === 429) {
          setDeepEnrichProgress((prev) => addLog(prev, `Limite atteinte: ${data.error || 'Limite atteinte'}`));
          stopDeepEnrichRef.current = true;
          setLimitModal({
            type: 'enrichments',
            current: data.current ?? data.limit ?? 0,
            limit: data.limit ?? 0,
            processed: i,
            total: prospectsToEnrich.length,
          });
          break;
        }

        const allEmails = [
          ...(data.scrapedEmails || []).map((e) => ({ ...e, method: 'scrape' })),
          ...(data.generatedEmails || []).map((e) => ({
            email: e.email,
            method: e.verified ? 'deep-verified' : 'deep-pattern',
          })),
        ];

        const bestEmail = allEmails.find((e) => e.type === 'personal') ||
          allEmails.find((e) => e.method === 'deep-verified') ||
          allEmails.find((e) => e.source === 'scrape') ||
          allEmails.find((e) => e.method === 'deep-pattern');

        if (bestEmail?.email) {
          setProspects((prev) =>
            prev.map((p) =>
              p.id === prospect.id
                ? { ...p, email: bestEmail.email, email_method: bestEmail.method }
                : p
            )
          );
          if (supabase) {
            await supabase
              .from('prospects')
              .update({ email: bestEmail.email, email_method: bestEmail.method })
              .eq('id', prospect.id);
          }
          setDeepEnrichProgress((prev) => addLog(prev, `+ ${bestEmail.email} (${bestEmail.method})`));
        } else if (!prospect.email) {
          try {
            const domain = new URL(prospect.site_web).hostname.replace(/^www\./, '');
            const guessEmail = `contact@${domain}`;
            setProspects((prev) =>
              prev.map((p) =>
                p.id === prospect.id
                  ? { ...p, email: guessEmail, email_method: 'guess' }
                  : p
              )
            );
            if (supabase) {
              await supabase
                .from('prospects')
                .update({ email: guessEmail, email_method: 'guess' })
                .eq('id', prospect.id);
            }
          } catch {}
          setDeepEnrichProgress((prev) => addLog(prev, `~ ${prospect.nom} (fallback guess)`));
        } else {
          setDeepEnrichProgress((prev) => addLog(prev, `- ${prospect.nom} (no new email)`));
        }
      } catch (error) {
        setDeepEnrichProgress((prev) => addLog(prev, `x ${prospect.nom}: ${error.message}`));
      }

      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    setIsDeepEnriching(false);
  }, [prospects, supabase]);

  // Waterfall enrichment
  const [isWaterfallEnriching, setIsWaterfallEnriching] = useState(false);
  const [waterfallProgress, setWaterfallProgress] = useState({
    current: 0, total: 0, currentSite: '', logs: [],
    stats: { scrape: 0, serper: 0, guess: 0 },
  });
  const stopWaterfallRef = useRef(false);

  const startWaterfallEnrichment = useCallback(async (customList = null, method = null) => {
    stopWaterfallRef.current = false;
    setIsWaterfallEnriching(true);
    const initStats = { scrape: 0, serper: 0, guess: 0 };
    setWaterfallProgress({ current: 0, total: 0, currentSite: '', logs: [], stats: initStats });

    const prospectsToEnrich = customList || prospects.filter((p) => !p.email && !p.archived_at);
    const total = prospectsToEnrich.length;
    setWaterfallProgress((prev) => ({ ...prev, total }));

    for (let i = 0; i < prospectsToEnrich.length; i++) {
      if (stopWaterfallRef.current) break;

      const prospect = prospectsToEnrich[i];
      let domain = '';
      try {
        domain = new URL(prospect.site_web).hostname.replace(/^www\./, '');
      } catch {}

      setWaterfallProgress((prev) => ({
        ...addLog(prev, `🔍 ${prospect.nom} (${domain})`),
        current: i + 1,
        currentSite: domain,
      }));

      try {
        const response = await fetch('/api/enrich-waterfall', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: prospect.site_web || undefined, name: prospect.nom, method: method || undefined }),
        });
        const data = await response.json();

        if (response.status === 429) {
          setWaterfallProgress((prev) => addLog(prev, `Limite atteinte: ${data.error || 'Limite atteinte'}`));
          stopWaterfallRef.current = true;
          setLimitModal({
            type: 'enrichments',
            current: data.current ?? data.limit ?? 0,
            limit: data.limit ?? 0,
            processed: i,
            total: prospectsToEnrich.length,
          });
          break;
        }

        if (data.email) {
          const method = data.source === 'guess' ? 'guess' : data.source;
          setProspects((prev) =>
            prev.map((p) =>
              p.id === prospect.id
                ? { ...p, email: data.email, email_method: method }
                : p
            )
          );
          if (supabase && user) {
            const { error: saveError } = await supabase
              .from('prospects')
              .update({ email: data.email, email_method: method, updated_at: new Date().toISOString() })
              .eq('id', prospect.id)
              .eq('user_id', user.id);
            if (saveError) {
              console.error('Failed to save email for', prospect.nom, saveError);
              // Retry once after 1s
              await new Promise(r => setTimeout(r, 1000));
              const { error: retryError } = await supabase
                .from('prospects')
                .update({ email: data.email, email_method: method, updated_at: new Date().toISOString() })
                .eq('id', prospect.id)
                .eq('user_id', user.id);
              if (retryError) {
                console.error('Retry failed for', prospect.nom, retryError);
              }
            }
          }

          const steps = (data.waterfall || []).map((s) =>
            `${s.found ? '✓' : '✗'} ${s.label}`
          ).join(' → ');
          setWaterfallProgress((prev) => ({
            ...addLog(prev, `  ${data.source === 'guess' ? '~' : '✓'} ${data.email} (${data.source}) [${steps}]`),
            stats: { ...prev.stats, [data.source]: (prev.stats[data.source] || 0) + 1 },
          }));
        } else {
          // No email found — archive + tag the prospect as "tried via waterfall"
          // so the UI affiche "Non trouvé" (gris) plutôt que "Pas encore enrichi" (ambre).
          const archivedAt = new Date().toISOString();
          setProspects((prev) =>
            prev.map((p) =>
              p.id === prospect.id
                ? { ...p, archived_at: archivedAt, email_method: 'waterfall' }
                : p
            )
          );
          if (supabase && user) {
            await supabase
              .from('prospects')
              .update({ archived_at: archivedAt, email_method: 'waterfall', updated_at: archivedAt })
              .eq('id', prospect.id)
              .eq('user_id', user.id);
          }
          setWaterfallProgress((prev) => addLog(prev, `  — aucun email trouvé, archivé`));
        }
      } catch (error) {
        setWaterfallProgress((prev) => addLog(prev, `  ✗ erreur: ${error.message}`));
      }

      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    setIsWaterfallEnriching(false);
  }, [prospects, supabase]);

  const stopEnrichment = useCallback(() => {
    stopEnrichRef.current = true;
    stopDeepEnrichRef.current = true;
    stopWaterfallRef.current = true;
    setIsEnriching(false);
    setIsDeepEnriching(false);
    setIsWaterfallEnriching(false);
  }, []);

  const handleBulkEnrich = async (folderId, method = null, selectedIds = null) => {
    let toEnrich;
    if (selectedIds && selectedIds.length > 0) {
      // Enrich selected prospects (can include archived — user explicitly selected)
      toEnrich = prospects.filter(p => selectedIds.includes(p.id) && !p.email);
    } else {
      // Exclude archived prospects from bulk enrichment (they already failed once)
      toEnrich = prospects.filter(p => !p.email && !p.archived_at);
      if (folderId) toEnrich = toEnrich.filter(p => p.folder_id === folderId);
    }
    if (toEnrich.length === 0) return;
    startWaterfallEnrichment(toEnrich, method);
  };

  // Delete all prospects (optionally scoped to folder)
  const deleteAllProspects = useCallback(async (folderId) => {
    try {
      if (supabase && user) {
        let query = supabase.from('prospects').delete().eq('user_id', user.id);
        if (folderId && folderId !== 'all') {
          query = query.eq('folder_id', folderId);
        }
        const { error } = await query;
        if (error) console.error('Error deleting prospects:', error);
      }
      if (folderId && folderId !== 'all') {
        setProspects((prev) => prev.filter((p) => p.folder_id !== folderId));
      } else {
        setProspects([]);
      }
    } catch (error) {
      console.error('Error deleting all prospects:', error);
    }
  }, [supabase, user]);

  // Update a single prospect
  const updateProspect = useCallback(async (id, updates) => {
    try {
      setProspects((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
      );
      if (supabase) {
        const { error } = await supabase
          .from('prospects')
          .update(updates)
          .eq('id', id);
        if (error) console.error('Error updating prospect:', error);
      }
    } catch (error) {
      console.error('Error updating prospect:', error);
    }
  }, [supabase]);

  // Delete a single prospect
  const deleteProspect = useCallback(async (id) => {
    try {
      setProspects((prev) => prev.filter((p) => p.id !== id));
      if (supabase) {
        // Delete related tags first
        await supabase.from('prospect_tags').delete().eq('prospect_id', id);
        const { error } = await supabase.from('prospects').delete().eq('id', id);
        if (error) console.error('Error deleting prospect:', error);
      }
    } catch (error) {
      console.error('Error deleting prospect:', error);
    }
  }, [supabase]);

  // CSV export with injection protection
  const downloadCSV = useCallback(async (format, filteredList) => {
    const list = filteredList || prospects;
    if (list.length === 0) return;

    // Check export limit client-side
    if (userPlan && userUsage) {
      const exportLimit = userPlan.limits.exports_per_month;
      const currentExports = userUsage.exports || 0;
      if (exportLimit !== -1 && currentExports >= exportLimit) {
        alert('Limite d\'exports atteinte pour ce mois. Passez au plan Pro pour continuer.');
        return;
      }
    }

    // Note : on accepte encore le param `format` pour rétro-compat (anciens
    // appels qui passent "standard"/"zoho"), mais on génère toujours le CSV
    // standard maintenant. Le format Zoho a été retiré de l'UI.
    const headers = ['nom', 'email', 'telephone', 'site_web', 'adresse', 'departement', 'category'];

    const rows = list.map((prospect) => {
      return [
        escapeCSV(prospect.nom),
        escapeCSV(prospect.email),
        escapeCSV(prospect.telephone),
        escapeCSV(prospect.site_web),
        escapeCSV(prospect.adresse),
        escapeCSV(prospect.departement),
        escapeCSV(prospect.category),
      ].join(',');
    });

    // Add BOM for Excel UTF-8 compatibility
    const csv = '\uFEFF' + headers.join(',') + '\n' + rows.join('\n') + '\n';
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `prospects_${format}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // Increment export usage tracking
    try {
      const sb = getSupabase();
      if (sb && user) {
        const month = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
        const { data: existing } = await sb
          .from('usage_tracking')
          .select('id, exports')
          .eq('user_id', user.id)
          .eq('month', month)
          .single();

        if (existing) {
          await sb
            .from('usage_tracking')
            .update({ exports: (existing.exports || 0) + 1, updated_at: new Date().toISOString() })
            .eq('id', existing.id);
        } else {
          await sb
            .from('usage_tracking')
            .insert({ user_id: user.id, month, exports: 1 });
        }

        // Update local state so the limit check stays current
        setUserUsage((prev) => prev ? { ...prev, exports: (prev.exports || 0) + 1 } : prev);
      }
    } catch (err) {
      console.error('Failed to track export usage:', err);
    }
  }, [prospects, userPlan, userUsage, user]);

  // Panel loading fallback
  const panelFallback = (
    <div className="flex items-center justify-center py-24">
      <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-surface-base text-content-primary">
      <TopBar
        user={user}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        searchProgress={searchProgress}
        isSearching={isSearching}
      />

      <div className="flex">
        <div className="flex flex-col">
          <Sidebar
            activeView={activeView}
            onViewChange={setActiveView}
            onClose={() => setSidebarOpen(false)}
            isOpen={sidebarOpen}
            prospectCount={prospects.length}
            folders={folders}
            searchHistory={searchHistory}
            isAdmin={isAdmin}
            userPlan={userPlan}
          />
          <UsageBanner
            plan={userPlan}
            usage={userUsage}
            onUpgrade={() => handleUpgrade('pro')}
          />
        </div>

        <main className="flex-1 min-w-0 min-h-[calc(100vh-3.5rem)]">
          <UpgradeBanner
            plan={userPlan}
            usage={userUsage}
            onUpgrade={() => handleUpgrade('pro')}
          />
          <div className="p-3 sm:p-4 md:p-6">
          <div className="max-w-6xl mx-auto">
            <Suspense fallback={panelFallback}>
              {activeView === 'overview' && (
                <OverviewPanel
                  prospects={prospects}
                  searchHistory={searchHistory}
                />
              )}
              {activeView === 'search' && (
                <SearchPanel
                  apiKeySet={apiKeySet}
                  isSearching={isSearching}
                  searchProgress={searchProgress}
                  onStartScraping={startScraping}
                  onStopScraping={stopScraping}
                  folders={folders}
                  onCreateFolder={createFolder}
                  onNavigateToLeads={() => setActiveView('results')}
                  totalProspects={prospects.length}
                />
              )}
              {activeView === 'results' && (
                <ResultsPanel
                  prospects={prospects}
                  folders={folders}
                  activeFolder={activeFolder}
                  onActiveFolder={setActiveFolder}
                  onDeleteFolder={deleteFolder}
                  isEnriching={isEnriching}
                  isDeepEnriching={isDeepEnriching}
                  isWaterfallEnriching={isWaterfallEnriching}
                  enrichProgress={enrichProgress}
                  deepEnrichProgress={deepEnrichProgress}
                  waterfallProgress={waterfallProgress}
                  onStartEnrichment={startEnrichment}
                  onStartDeepEnrichment={startDeepEnrichment}
                  onStartWaterfallEnrichment={startWaterfallEnrichment}
                  onStopEnrichment={stopEnrichment}
                  onBulkEnrich={handleBulkEnrich}
                  onDeleteAll={deleteAllProspects}
                  onDownloadCSV={downloadCSV}
                  userPlan={userPlan}
                  onUpdateProspect={updateProspect}
                  onDeleteProspect={deleteProspect}
                  tags={tags}
                  prospectTagMap={prospectTagMap}
                  onCreateTag={createTag}
                  onDeleteTag={deleteTag}
                  onToggleProspectTag={toggleProspectTag}
                />
              )}
              {activeView === 'export' && (
                <ExportPanel prospects={prospects} onDownloadCSV={downloadCSV} />
              )}
              {activeView === 'verify' && (
                <EmailVerifier userPlan={userPlan} />
              )}
            </Suspense>
          </div>
          </div>
        </main>
      </div>

      {showOnboarding && (
        <Suspense fallback={null}>
          <OnboardingOverlay
            onClose={() => setShowOnboarding(false)}
            onStartSearch={() => setActiveView('search')}
          />
        </Suspense>
      )}

      {limitModal && (
        <LimitReachedModal
          type={limitModal.type}
          current={limitModal.current}
          limit={limitModal.limit}
          processed={limitModal.processed}
          total={limitModal.total}
          currentPlanName={userPlan?.name || 'Starter'}
          onClose={() => setLimitModal(null)}
          onUpgrade={() => { setLimitModal(null); handleUpgrade('pro'); }}
        />
      )}
    </div>
  );
}
