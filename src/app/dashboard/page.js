'use client';

import { useState, useEffect } from 'react';
import { getSupabase } from '@/lib/supabase';
import { DEPTS } from '@/lib/constants';
import TopBar from '@/components/TopBar';
import SearchPanel from '@/components/SearchPanel';
import ResultsPanel from '@/components/ResultsPanel';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [prospects, setProspects] = useState([]);
  const [activeTab, setActiveTab] = useState('search');
  const [apiKeySet, setApiKeySet] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isEnriching, setIsEnriching] = useState(false);
  const [user, setUser] = useState(null);
  const [searchProgress, setSearchProgress] = useState({
    current: 0,
    total: 0,
    currentQuery: '',
    logs: [],
  });
  const [enrichProgress, setEnrichProgress] = useState({
    current: 0,
    total: 0,
    currentSite: '',
    logs: [],
    foundScrape: 0,
    foundGuess: 0,
  });

  const supabase = getSupabase();
  const router = useRouter();

  // Get current user and load data on mount
  useEffect(() => {
    const initializeApp = async () => {
      if (!supabase) return;

      // Get current user
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        router.push('/login');
        return;
      }
      setUser(currentUser);

      // Check if API is configured
      try {
        const response = await fetch('/api/places?health_check=true');
        setApiKeySet(response.ok);
      } catch (error) {
        console.error('API health check failed:', error);
        setApiKeySet(false);
      }

      // Load existing prospects for this user (RLS filters automatically)
      try {
        const { data, error } = await supabase
          .from('prospects')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error loading prospects:', error);
        } else if (data) {
          setProspects(data);
        }
      } catch (error) {
        console.error('Error fetching prospects:', error);
      }
    };

    initializeApp();
  }, []);

  // Start scraping function
  const startScraping = async (depts, b2bCats, coproCats, customQueries) => {
    setIsSearching(true);
    setSearchProgress({
      current: 0,
      total: 0,
      currentQuery: '',
      logs: [],
    });

    const taskList = [];
    const logs = [];

    // Build task list from all combinations
    for (const dept of depts) {
      for (const cat of b2bCats) {
        taskList.push({ dept, category: cat, type: 'b2b' });
      }
      for (const cat of coproCats) {
        taskList.push({ dept, category: cat, type: 'copro' });
      }
    }

    // Add custom queries
    if (customQueries && customQueries.length > 0) {
      for (const query of customQueries) {
        taskList.push({ query, type: 'custom' });
      }
    }

    const total = taskList.length;
    setSearchProgress((prev) => ({ ...prev, total }));

    const newProspects = [];
    const seenPlaceIds = new Set(prospects.map((p) => p.place_id));

    // Process each task
    for (let i = 0; i < taskList.length; i++) {
      if (!isSearching) break;

      const task = taskList[i];
      let queryStr = '';

      if (task.type === 'custom') {
        queryStr = task.query;
      } else {
        queryStr = `${task.category} ${task.dept}`;
      }

      setSearchProgress((prev) => ({
        ...prev,
        current: i + 1,
        currentQuery: queryStr,
        logs: [...prev.logs, `Searching: ${queryStr}`],
      }));

      try {
        const params = new URLSearchParams();
        params.append('query', queryStr);
        if (task.type === 'b2b') {
          params.append('type', 'b2b');
        } else if (task.type === 'copro') {
          params.append('type', 'copro');
        }

        const response = await fetch(`/api/places?${params.toString()}`);
        const data = await response.json();

        if (data.places && Array.isArray(data.places)) {
          for (const place of data.places) {
            if (!seenPlaceIds.has(place.place_id)) {
              seenPlaceIds.add(place.place_id);
              newProspects.push({
                place_id: place.place_id,
                name: place.name,
                address: place.address,
                phone: place.phone,
                site_web: place.website,
                email: null,
                email_method: null,
                dept: task.dept || null,
                category: task.category || null,
                query: queryStr,
                user_id: user?.id,
                created_at: new Date().toISOString(),
              });
            }
          }
        }
      } catch (error) {
        console.error(`Error scraping ${queryStr}:`, error);
        setSearchProgress((prev) => ({
          ...prev,
          logs: [...prev.logs, `Error: ${queryStr} - ${error.message}`],
        }));
      }

      // Add small delay to respect rate limits
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // Save new prospects to state and Supabase
    if (newProspects.length > 0) {
      try {
        const { error } = supabase ? await supabase
          .from('prospects')
          .upsert(newProspects, { onConflict: 'place_id' }) : {};

        if (error) {
          console.error('Error saving prospects to Supabase:', error);
          setSearchProgress((prev) => ({
            ...prev,
            logs: [...prev.logs, `Error saving to database: ${error.message}`],
          }));
        } else {
          setProspects((prev) => [...prev, ...newProspects]);
          setSearchProgress((prev) => ({
            ...prev,
            logs: [...prev.logs, `Saved ${newProspects.length} new prospects`],
          }));
        }
      } catch (error) {
        console.error('Error upserting prospects:', error);
      }
    }

    setIsSearching(false);
  };

  // Stop scraping function
  const stopScraping = () => {
    setIsSearching(false);
  };

  // Start enrichment function
  const startEnrichment = async () => {
    setIsEnriching(true);
    setEnrichProgress({
      current: 0,
      total: 0,
      currentSite: '',
      logs: [],
      foundScrape: 0,
      foundGuess: 0,
    });

    // Filter prospects that need enrichment
    const prospectsToEnrich = prospects.filter((p) => p.site_web && !p.email);

    const total = prospectsToEnrich.length;
    setEnrichProgress((prev) => ({ ...prev, total }));

    let foundScrape = 0;
    let foundGuess = 0;

    for (let i = 0; i < prospectsToEnrich.length; i++) {
      if (!isEnriching) break;

      const prospect = prospectsToEnrich[i];

      setEnrichProgress((prev) => ({
        ...prev,
        current: i + 1,
        currentSite: prospect.site_web,
        logs: [...prev.logs, `Enriching: ${prospect.name}`],
      }));

      try {
        const params = new URLSearchParams();
        params.append('site', prospect.site_web);

        const response = await fetch(`/api/enrich?${params.toString()}`);
        const data = await response.json();

        if (data.email) {
          const emailMethod = data.method || (data.scraped ? 'scraped' : 'guess');

          if (emailMethod === 'scraped') {
            foundScrape += 1;
          } else if (emailMethod === 'guess') {
            foundGuess += 1;
          }

          // Update prospect in state
          setProspects((prev) =>
            prev.map((p) =>
              p.id === prospect.id
                ? { ...p, email: data.email, email_method: emailMethod }
                : p
            )
          );

          // Update in Supabase
          if (supabase) {
            try {
              await supabase
                .from('prospects')
                .update({ email: data.email, email_method: emailMethod })
                .eq('id', prospect.id);
            } catch (error) {
              console.error(`Error updating prospect ${prospect.id}:`, error);
            }
          }

          setEnrichProgress((prev) => ({
            ...prev,
            foundScrape,
            foundGuess,
            logs: [
              ...prev.logs,
              `Found: ${data.email} (${emailMethod})`,
            ],
          }));
        } else {
          setEnrichProgress((prev) => ({
            ...prev,
            logs: [...prev.logs, `No email found: ${prospect.name}`],
          }));
        }
      } catch (error) {
        console.error(`Error enriching ${prospect.name}:`, error);
        setEnrichProgress((prev) => ({
          ...prev,
          logs: [...prev.logs, `Error: ${prospect.name} - ${error.message}`],
        }));
      }

      // Add small delay to respect rate limits
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    setIsEnriching(false);
  };

  // Stop enrichment function
  const stopEnrichment = () => {
    setIsEnriching(false);
  };

  // Delete all prospects function
  const deleteAllProspects = async () => {
    if (!confirm('Are you sure? This will delete all prospects.')) {
      return;
    }

    try {
      if (supabase) {
        const { error } = await supabase
          .from('prospects')
          .delete()
          .neq('id', '');
        if (error) console.error('Error deleting prospects:', error);
      }
      {
        setProspects([]);
      }
    } catch (error) {
      console.error('Error deleting all prospects:', error);
    }
  };

  // Download CSV function
  const downloadCSV = (format) => {
    if (prospects.length === 0) {
      alert('No prospects to download');
      return;
    }

    let csv = '';
    const headers =
      format === 'zoho'
        ? ['First Name', 'Last Name', 'Email', 'Phone', 'Company', 'Website', 'Address']
        : ['name', 'email', 'phone', 'site_web', 'address', 'dept', 'category'];

    csv += headers.join(',') + '\n';

    for (const prospect of prospects) {
      let row = [];

      if (format === 'zoho') {
        const nameParts = prospect.name.split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        row = [
          `"${firstName}"`,
          `"${lastName}"`,
          `"${prospect.email || ''}"`,
          `"${prospect.phone || ''}"`,
          `"${prospect.name}"`,
          `"${prospect.site_web || ''}"`,
          `"${prospect.address || ''}"`,
        ];
      } else {
        row = [
          `"${prospect.name}"`,
          `"${prospect.email || ''}"`,
          `"${prospect.phone || ''}"`,
          `"${prospect.site_web || ''}"`,
          `"${prospect.address || ''}"`,
          `"${prospect.dept || ''}"`,
          `"${prospect.category || ''}"`,
        ];
      }

      csv += row.join(',') + '\n';
    }

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `prospects_${format}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <TopBar user={user} />

      <div className="mx-auto max-w-7xl px-4 py-6">
        {/* Tab Navigation */}
        <div className="mb-6 flex gap-4 border-b border-slate-700">
          <button
            onClick={() => setActiveTab('search')}
            className={`pb-3 px-1 font-medium transition-colors ${
              activeTab === 'search'
                ? 'border-b-2 border-blue-500 text-blue-400'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            Recherche
          </button>
          <button
            onClick={() => setActiveTab('results')}
            className={`pb-3 px-1 font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'results'
                ? 'border-b-2 border-blue-500 text-blue-400'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            Résultats
            {prospects.length > 0 && (
              <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold bg-blue-600 text-white rounded-full">
                {prospects.length}
              </span>
            )}
          </button>
        </div>

        {/* Content Area */}
        {activeTab === 'search' ? (
          <SearchPanel
            apiKeySet={apiKeySet}
            isSearching={isSearching}
            searchProgress={searchProgress}
            onStartScraping={startScraping}
            onStopScraping={stopScraping}
          />
        ) : (
          <ResultsPanel
            prospects={prospects}
            isEnriching={isEnriching}
            enrichProgress={enrichProgress}
            onStartEnrichment={startEnrichment}
            onStopEnrichment={stopEnrichment}
            onDeleteAll={deleteAllProspects}
            onDownloadCSV={downloadCSV}
          />
        )}
      </div>
    </div>
  );
}
