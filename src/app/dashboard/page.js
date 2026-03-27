'use client';

import { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react';
import { getSupabase } from '@/lib/supabase';
import { DEPTS } from '@/lib/constants';
import TopBar from '@/components/TopBar';
import Sidebar from '@/components/Sidebar';
import UsageBanner from '@/components/UsageBanner';
import { useRouter } from 'next/navigation';

// Lazy load panels — only loaded when navigated to
const OverviewPanel = lazy(() => import('@/components/OverviewPanel'));
const SearchPanel = lazy(() => import('@/components/SearchPanel'));
const ResultsPanel = lazy(() => import('@/components/ResultsPanel'));
const ExportPanel = lazy(() => import('@/components/ExportPanel'));

const MAX_LOGS = 100;

function addLog(prev, message) {
  const logs = prev.logs.length >= MAX_LOGS
    ? [...prev.logs.slice(-MAX_LOGS + 1), message]
    : [...prev.logs, message];
  return { ...prev, logs };
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
  const [userUsage, setUserUsage] = useState(null);
  const [isDeepEnriching, setIsDeepEnriching] = useState(false);
  const [deepEnrichProgress, setDeepEnrichProgress] = useState({
    current: 0, total: 0, currentSite: '', logs: [],
  });
  const [tags, setTags] = useState([]);
  const [prospectTagMap, setProspectTagMap] = useState({});
  const [searchHistory, setSearchHistory] = useState([]);

  // Refs to avoid stale closures in async loops
  const stopSearchRef = useRef(false);
  const stopEnrichRef = useRef(false);
  const stopDeepEnrichRef = useRef(false);

  const supabase = getSupabase();
  const router = useRouter();

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

      // Load plan
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('plan, stripe_customer_id')
        .eq('id', currentUser.id)
        .single();

      if (profile) {
        const { getPlan } = await import('@/lib/plans');
        setUserPlan(getPlan(profile.plan));
      }

      // Load usage
      const month = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
      const { data: usage } = await supabase
        .from('usage_tracking')
        .select('searches, enrichments, exports')
        .eq('user_id', currentUser.id)
        .eq('month', month)
        .single();

      setUserUsage(usage || { searches: 0, enrichments: 0, exports: 0 });

      // Health check (GET is still unauthenticated — just checks config)
      try {
        const response = await fetch('/api/places');
        setApiKeySet(response.ok);
      } catch {
        setApiKeySet(false);
      }

      // Load folders
      try {
        const { data: foldersData, error: foldersError } = await supabase
          .from('lead_folders')
          .select('*')
          .order('created_at', { ascending: true });
        if (!foldersError && foldersData) {
          setFolders(foldersData);
        }
      } catch (error) {
        console.error('Error fetching folders:', error);
      }

      // Load tags
      const { data: tagsData } = await supabase
        .from('lead_tags')
        .select('*')
        .order('name');
      setTags(tagsData || []);

      // Load prospect-tag associations
      const { data: ptData } = await supabase
        .from('prospect_tags')
        .select('prospect_id, tag_id');
      const tagMap = {};
      (ptData || []).forEach(pt => {
        if (!tagMap[pt.prospect_id]) tagMap[pt.prospect_id] = [];
        tagMap[pt.prospect_id].push(pt.tag_id);
      });
      setProspectTagMap(tagMap);

      // Load existing prospects (RLS filters by user)
      try {
        const { data, error } = await supabase
          .from('prospects')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data) {
          setProspects(data);
        }
      } catch (error) {
        console.error('Error fetching prospects:', error);
      }

      // Load search history
      const { data: sessions } = await supabase
        .from('search_sessions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      setSearchHistory(sessions || []);
    };

    initializeApp();
  }, []);

  // Create folder
  const createFolder = useCallback(async (name, color) => {
    if (!supabase) return null;
    try {
      const { data, error } = await supabase
        .from('lead_folders')
        .insert({ name, color })
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
  }, [supabase]);

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
  const createTag = async (name, color) => {
    if (!supabase || !user) return null;
    const { data } = await supabase
      .from('lead_tags')
      .insert({ user_id: user.id, name, color })
      .select()
      .single();
    if (data) setTags(prev => [...prev, data]);
    return data;
  };

  const deleteTag = async (tagId) => {
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
  };

  const toggleProspectTag = async (prospectId, tagId) => {
    if (!supabase) return;
    const current = prospectTagMap[prospectId] || [];
    if (current.includes(tagId)) {
      await supabase.from('prospect_tags').delete().eq('prospect_id', prospectId).eq('tag_id', tagId);
      setProspectTagMap(prev => ({
        ...prev,
        [prospectId]: (prev[prospectId] || []).filter(t => t !== tagId),
      }));
    } else {
      await supabase.from('prospect_tags').insert({ prospect_id: prospectId, tag_id: tagId });
      setProspectTagMap(prev => ({
        ...prev,
        [prospectId]: [...(prev[prospectId] || []), tagId],
      }));
    }
  };

  // Start scraping function — now accepts folderId
  const startScraping = useCallback(async (depts, b2bCats, coproCats, customQueries, folderId) => {
    stopSearchRef.current = false;
    setIsSearching(true);
    setActiveView('search');
    setSearchProgress({ current: 0, total: 0, currentQuery: '', logs: [] });

    const taskList = [];
    for (const dept of depts) {
      const deptName = DEPTS[dept]?.name || dept;
      for (const cat of b2bCats) {
        taskList.push({ dept, deptName, category: cat, type: 'b2b' });
      }
      for (const cat of coproCats) {
        taskList.push({ dept, deptName, category: cat, type: 'copro' });
      }
    }
    if (customQueries?.length > 0) {
      for (const query of customQueries) {
        taskList.push({ query, type: 'custom' });
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
        label: `Recherche ${new Date().toLocaleDateString('fr-FR')}`,
        folder_id: folderId || null,
      }).select().single();
      session = sessionData;
    }

    const newProspects = [];
    const seenPlaceIds = new Set(prospects.map((p) => p.place_id));

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
          for (const place of data.places) {
            if (!seenPlaceIds.has(place.place_id)) {
              seenPlaceIds.add(place.place_id);
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
                departement: task.dept || '971',
                folder_id: folderId || null,
              });
            }
          }
          if (added < placesCount) {
            setSearchProgress((prev) => addLog(prev, `   (${placesCount - added} doublons ignorés)`));
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
    stats: { scrape: 0, serper: 0, apollo: 0, enrichly: 0, anymail: 0, findymail: 0, guess: 0 },
  });
  const stopWaterfallRef = useRef(false);

  const startWaterfallEnrichment = useCallback(async (customList = null) => {
    stopWaterfallRef.current = false;
    setIsWaterfallEnriching(true);
    const initStats = { scrape: 0, serper: 0, apollo: 0, enrichly: 0, anymail: 0, findymail: 0, guess: 0 };
    setWaterfallProgress({ current: 0, total: 0, currentSite: '', logs: [], stats: initStats });

    const prospectsToEnrich = customList || prospects.filter((p) => !p.email && p.site_web);
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
          body: JSON.stringify({ url: prospect.site_web, name: prospect.nom }),
        });
        const data = await response.json();

        if (response.status === 429) {
          setWaterfallProgress((prev) => addLog(prev, `Limite atteinte: ${data.error || 'Limite atteinte'}`));
          stopWaterfallRef.current = true;
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
          if (supabase) {
            await supabase
              .from('prospects')
              .update({ email: data.email, email_method: method })
              .eq('id', prospect.id);
          }

          const steps = (data.waterfall || []).map((s) =>
            `${s.found ? '✓' : '✗'} ${s.label}`
          ).join(' → ');
          setWaterfallProgress((prev) => ({
            ...addLog(prev, `  ${data.source === 'guess' ? '~' : '✓'} ${data.email} (${data.source}) [${steps}]`),
            stats: { ...prev.stats, [data.source]: (prev.stats[data.source] || 0) + 1 },
          }));
        } else {
          setWaterfallProgress((prev) => addLog(prev, `  — aucun email trouvé`));
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

  const handleBulkEnrich = async (folderId) => {
    let toEnrich = prospects.filter(p => !p.email && p.site_web);
    if (folderId) toEnrich = toEnrich.filter(p => p.folder_id === folderId);
    if (toEnrich.length === 0) return;
    startWaterfallEnrichment(toEnrich);
  };

  // Delete all prospects (optionally scoped to folder)
  const deleteAllProspects = useCallback(async (folderId) => {
    try {
      if (supabase && user) {
        let query = supabase.from('prospects').delete();
        if (folderId && folderId !== 'all') {
          query = query.eq('folder_id', folderId);
        } else {
          query = query.neq('id', '00000000-0000-0000-0000-000000000000');
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

  // CSV export with injection protection
  const downloadCSV = useCallback((format, filteredList) => {
    const list = filteredList || prospects;
    if (list.length === 0) return;

    const headers = format === 'zoho'
      ? ['First Name', 'Last Name', 'Email', 'Phone', 'Company', 'Website', 'Address']
      : ['nom', 'email', 'telephone', 'site_web', 'adresse', 'departement', 'category'];

    const rows = list.map((prospect) => {
      if (format === 'zoho') {
        const nameParts = (prospect.nom || '').split(' ');
        return [
          escapeCSV(nameParts[0] || ''),
          escapeCSV(nameParts.slice(1).join(' ') || ''),
          escapeCSV(prospect.email),
          escapeCSV(prospect.telephone),
          escapeCSV(prospect.nom),
          escapeCSV(prospect.site_web),
          escapeCSV(prospect.adresse),
        ].join(',');
      }
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
  }, [prospects]);

  // Panel loading fallback
  const panelFallback = (
    <div className="flex items-center justify-center py-24">
      <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#09090b] text-[#fafafa]">
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
          />
          <UsageBanner
            plan={userPlan}
            usage={userUsage}
            onUpgrade={() => handleUpgrade('pro')}
          />
        </div>

        <main className="flex-1 min-h-[calc(100vh-3.5rem)] p-6">
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
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
}
