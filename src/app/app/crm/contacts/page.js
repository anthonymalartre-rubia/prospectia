'use client';

// ─────────────────────────────────────────────────────────────────────
// /app/crm/contacts — Liste des contacts CRM (Phase 3).
// ─────────────────────────────────────────────────────────────────────
//
// Gating Business :
//   - Auth : si pas user, redirect /login.
//   - Plan : si pas business/enterprise, redirect /app/crm (qui affiche
//     déjà l'upgrade CTA — on ne duplique pas).
//
// Data flow :
//   - GET /api/crm/contacts?q=&limit=20&offset=N
//   - Debounce 300ms sur la search.
//   - Pagination "Charger plus" (offset cumulé).
//
// ─────────────────────────────────────────────────────────────────────

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  Plus,
  Search,
  Loader2,
  AlertCircle,
  X,
  KanbanSquare,
  Megaphone,
  Columns,
  Check,
} from 'lucide-react';
import TopBar from '@/components/TopBar';
import CrmSidebar from '@/components/crm/CrmSidebar';
import ContactsList from '@/components/crm/ContactsList';
import NewContactModal from '@/components/crm/NewContactModal';
import AddToCampagneModal from '@/components/crm/AddToCampagneModal';
import { getSupabase } from '@/lib/supabase';
import { ConfirmModal } from '@/components/ui';

const BUSINESS_PLANS = ['business', 'enterprise'];
const PAGE_SIZE = 20;
const COLUMNS_STORAGE_KEY = 'volia.crm.contacts.customCols.v1';

export default function CrmContactsPage() {
  const router = useRouter();

  // ─── Auth + plan ─────────────────────────────────────────
  const [user, setUser] = useState(null);
  const [plan, setPlan] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ─── Data ────────────────────────────────────────────────
  const [contacts, setContacts] = useState([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');

  // ─── Search + pagination + sort ──────────────────────────
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [offset, setOffset] = useState(0);
  // sort : 'created' (par défaut) | 'engagement'. dir : 'asc' | 'desc'.
  const [sortKey, setSortKey] = useState('created');
  const [sortDir, setSortDir] = useState('desc');

  // ─── UI ───────────────────────────────────────────────────
  const [newContactOpen, setNewContactOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  // Modale de confirmation suppression (remplace confirm() natif)
  const [contactToDelete, setContactToDelete] = useState(null);

  // ─── Bulk selection (CRM → Campagnes) ─────────────────────
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [campagneOpen, setCampagneOpen] = useState(false);
  const [campagneToast, setCampagneToast] = useState('');

  // ─── Custom fields columns selector ──────────────────────
  const [customFields, setCustomFields] = useState([]);
  const [selectedColumnIds, setSelectedColumnIds] = useState(() => new Set());
  const [columnsMenuOpen, setColumnsMenuOpen] = useState(false);

  function toggleSelect(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  function toggleSelectAll(checked, visibleIds) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        visibleIds.forEach((id) => next.add(id));
      } else {
        visibleIds.forEach((id) => next.delete(id));
      }
      return next;
    });
  }
  function clearSelection() {
    setSelectedIds(new Set());
  }

  // ─── Auth check ──────────────────────────────────────────
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
      setPlan(userPlan);
      if (!BUSINESS_PLANS.includes(userPlan)) {
        // Pas Business → on renvoie sur /app/crm qui montre l'upgrade CTA
        router.replace('/app/crm');
        return;
      }
      setAuthChecked(true);
    });
  }, [router]);

  // ─── Charge defs custom fields + restore préférence colonnes ─────
  useEffect(() => {
    if (!authChecked) return;
    fetch('/api/crm/custom-fields?entity=contact')
      .then((r) => r.json())
      .then((d) => {
        if (!d?.success) return;
        const list = Array.isArray(d.data) ? d.data : [];
        setCustomFields(list);
        // Restore préférence localStorage
        try {
          const raw = window.localStorage.getItem(COLUMNS_STORAGE_KEY);
          if (raw) {
            const ids = JSON.parse(raw);
            if (Array.isArray(ids)) {
              const valid = new Set(ids.filter((id) => list.some((f) => f.id === id)));
              setSelectedColumnIds(valid);
            }
          }
        } catch {
          /* noop */
        }
      })
      .catch(() => {
        /* silent */
      });
  }, [authChecked]);

  function toggleColumn(fieldId) {
    setSelectedColumnIds((prev) => {
      const next = new Set(prev);
      if (next.has(fieldId)) next.delete(fieldId);
      else next.add(fieldId);
      try {
        window.localStorage.setItem(COLUMNS_STORAGE_KEY, JSON.stringify(Array.from(next)));
      } catch {
        /* noop */
      }
      return next;
    });
  }

  const customColumns = customFields.filter((f) => selectedColumnIds.has(f.id));

  // ─── Debounce search ────────────────────────────────────
  useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setOffset(0);
    }, 300);
    return () => clearTimeout(handle);
  }, [search]);

  // ─── Fetch (initial + search change) ────────────────────
  const fetchContacts = useCallback(
    async ({ append = false, currentOffset = 0 } = {}) => {
      if (!authChecked) return;
      if (append) setLoadingMore(true);
      else setLoading(true);
      setError('');

      try {
        const params = new URLSearchParams();
        params.set('limit', String(PAGE_SIZE));
        params.set('offset', String(currentOffset));
        if (debouncedSearch) params.set('q', debouncedSearch);
        params.set('sort', sortKey);
        params.set('dir', sortDir);

        const res = await fetch(`/api/crm/contacts?${params.toString()}`);
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Erreur chargement contacts');
        }
        const list = Array.isArray(data.data) ? data.data : [];
        if (append) {
          setContacts((prev) => [...prev, ...list]);
        } else {
          setContacts(list);
        }
        setTotal(data.pagination?.total || 0);
        setHasMore(!!data.pagination?.has_more);
      } catch (err) {
        console.error('[CRM contacts] fetch error', err);
        setError(err.message || 'Erreur réseau');
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [authChecked, debouncedSearch, sortKey, sortDir]
  );

  // Re-fetch quand la search OU le tri change OU au mount après auth
  useEffect(() => {
    if (!authChecked) return;
    setOffset(0);
    fetchContacts({ append: false, currentOffset: 0 });
  }, [authChecked, debouncedSearch, sortKey, sortDir, fetchContacts]);

  function handleSortChange(nextKey, nextDir) {
    setSortKey(nextKey);
    setSortDir(nextDir);
  }

  function handleLoadMore() {
    const next = offset + PAGE_SIZE;
    setOffset(next);
    fetchContacts({ append: true, currentOffset: next });
  }

  // ─── Callbacks ────────────────────────────────────────────
  function handleContactCreated(contact) {
    // On insère en tête (créé le plus récent en premier)
    setContacts((prev) => [contact, ...prev]);
    setTotal((t) => t + 1);
  }

  function handleContactClick(contact) {
    router.push(`/app/crm/contacts/${contact.id}`);
  }

  function handleContactEdit(contact) {
    router.push(`/app/crm/contacts/${contact.id}`);
  }

  function handleContactDelete(contact) {
    if (deletingId) return;
    setContactToDelete(contact);
  }

  async function performContactDelete() {
    if (!contactToDelete) return;
    const contact = contactToDelete;
    setDeletingId(contact.id);
    try {
      const res = await fetch(`/api/crm/contacts/${contact.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Erreur suppression');
        return;
      }
      setContacts((prev) => prev.filter((c) => c.id !== contact.id));
      setTotal((t) => Math.max(0, t - 1));
      setSelectedIds((prev) => {
        if (!prev.has(contact.id)) return prev;
        const next = new Set(prev);
        next.delete(contact.id);
        return next;
      });
    } catch (err) {
      console.error('[CRM contacts] delete error', err);
      setError('Erreur réseau');
    } finally {
      setDeletingId(null);
      setContactToDelete(null);
    }
  }

  // ─── Render ──────────────────────────────────────────────
  if (!authChecked) {
    return (
      <div className="min-h-screen bg-surface-base flex items-center justify-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center animate-pulse">
          <Users size={28} className="text-white" />
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
            <div className="px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0">
                  <Users size={18} className="text-white" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-lg sm:text-xl font-bold text-content-primary">
                    Contacts
                  </h1>
                  <p className="text-[11px] sm:text-xs text-content-tertiary tabular-nums">
                    {total} contact{total !== 1 ? 's' : ''}
                    {debouncedSearch ? ` correspondant à "${debouncedSearch}"` : ''}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Search input */}
                <div className="relative flex-1 sm:flex-initial sm:w-72">
                  <Search
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-content-tertiary pointer-events-none"
                  />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Rechercher un contact…"
                    className="w-full pl-9 pr-9 py-2 rounded-lg border border-line bg-surface-card text-sm text-content-primary placeholder:text-content-muted focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  />
                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-content-tertiary hover:text-content-primary"
                      aria-label="Effacer la recherche"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>

                {/* Column selector (custom fields) */}
                {customFields.length > 0 && (
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setColumnsMenuOpen((v) => !v)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-medium text-content-secondary border border-line bg-surface-card hover:bg-surface-elevated transition-colors"
                      title="Choisir les colonnes à afficher"
                      aria-haspopup="true"
                      aria-expanded={columnsMenuOpen}
                    >
                      <Columns size={13} />
                      <span className="hidden sm:inline">Colonnes</span>
                      {selectedColumnIds.size > 0 && (
                        <span className="ml-0.5 px-1 py-0 rounded text-[9px] tabular-nums bg-emerald-100 text-emerald-700">
                          {selectedColumnIds.size}
                        </span>
                      )}
                    </button>
                    {columnsMenuOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setColumnsMenuOpen(false)}
                          aria-hidden="true"
                        />
                        <div className="absolute right-0 top-full mt-1 z-50 w-64 max-h-80 overflow-y-auto rounded-lg border border-line bg-surface-base shadow-lg p-1.5">
                          <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-content-tertiary border-b border-line mb-1">
                            Colonnes custom
                          </div>
                          {customFields.map((f) => {
                            const active = selectedColumnIds.has(f.id);
                            return (
                              <button
                                key={f.id}
                                type="button"
                                onClick={() => toggleColumn(f.id)}
                                className={`w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-md text-left text-xs transition-colors ${
                                  active
                                    ? 'bg-emerald-50 text-emerald-900'
                                    : 'text-content-secondary hover:bg-surface-elevated'
                                }`}
                              >
                                <div className="min-w-0 flex-1">
                                  <div className="font-medium truncate">{f.field_label}</div>
                                  <div className="text-[10px] text-content-tertiary truncate">
                                    {f.field_type}
                                  </div>
                                </div>
                                {active && <Check size={12} className="text-emerald-600 flex-shrink-0" />}
                              </button>
                            );
                          })}
                          <div className="px-2 py-1.5 mt-1 border-t border-line">
                            <a
                              href="/app/crm/custom-fields"
                              className="text-[10px] text-emerald-700 hover:underline"
                            >
                              Gérer les champs personnalisés →
                            </a>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setNewContactOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-md shadow-emerald-500/20 hover:shadow-lg hover:-translate-y-0.5 transition-all whitespace-nowrap"
                >
                  <Plus size={14} />
                  <span className="hidden sm:inline">Nouveau contact</span>
                  <span className="sm:hidden">Contact</span>
                </button>
              </div>
            </div>

            {error && (
              <div className="px-4 sm:px-6 pb-3">
                <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-700">
                  <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                  <p className="text-xs font-medium flex-1">{error}</p>
                  <button
                    type="button"
                    onClick={() => setError('')}
                    className="text-rose-500 hover:text-rose-700"
                    aria-label="Fermer"
                  >
                    <X size={12} />
                  </button>
                </div>
              </div>
            )}
          </header>

          {/* Bulk toolbar */}
          {selectedIds.size > 0 && (
            <div className="sticky top-[7.5rem] z-20 px-4 sm:px-6 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-md">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <span className="tabular-nums">{selectedIds.size}</span>
                  contact{selectedIds.size > 1 ? 's' : ''} sélectionné
                  {selectedIds.size > 1 ? 's' : ''}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCampagneOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-violet-700 bg-white hover:bg-violet-50 shadow-sm transition-colors"
                  >
                    <Megaphone size={13} />
                    Ajouter à séquence
                  </button>
                  <button
                    type="button"
                    onClick={clearSelection}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-white/90 hover:text-white hover:bg-white/10 transition-colors"
                    aria-label="Désélectionner tout"
                  >
                    <X size={13} />
                    Annuler
                  </button>
                </div>
              </div>
            </div>
          )}

          {campagneToast && (
            <div className="px-4 sm:px-6 pt-3">
              <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-violet-50 border border-violet-200 text-violet-700">
                <Megaphone size={14} className="flex-shrink-0 mt-0.5" />
                <p className="text-xs font-medium flex-1">{campagneToast}</p>
                <button
                  type="button"
                  onClick={() => setCampagneToast('')}
                  className="text-violet-500 hover:text-violet-700"
                  aria-label="Fermer"
                >
                  <X size={12} />
                </button>
              </div>
            </div>
          )}

          {/* Content */}
          <section className="flex-1 p-4 sm:p-6 bg-gradient-to-br from-emerald-50/20 via-surface-base to-teal-50/10">
            <ContactsList
              contacts={contacts}
              loading={loading}
              onClick={handleContactClick}
              onEdit={handleContactEdit}
              onDelete={handleContactDelete}
              selectable
              selectedIds={selectedIds}
              onToggleSelect={toggleSelect}
              onToggleSelectAll={toggleSelectAll}
              sortKey={sortKey}
              sortDir={sortDir}
              onSortChange={handleSortChange}
              customColumns={customColumns}
              emptyState={
                debouncedSearch ? (
                  <div className="max-w-sm mx-auto">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-zinc-100 border border-line mb-4">
                      <Search size={22} className="text-content-tertiary" />
                    </div>
                    <h3 className="text-base font-bold text-content-primary mb-1">
                      Rien trouvé.
                    </h3>
                    <p className="text-sm text-content-tertiary">
                      Essaie un autre mot-clé ou crée un nouveau contact.
                    </p>
                  </div>
                ) : (
                  <div className="max-w-sm mx-auto">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 border border-emerald-200 mb-4">
                      <Users size={26} className="text-emerald-600" />
                    </div>
                    <h3 className="text-lg font-bold text-content-primary mb-1">
                      Ton carnet est vide.
                    </h3>
                    <p className="text-sm text-content-tertiary mb-5">
                      Crée un premier contact ou pousse tes prospects depuis Prospection.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => setNewContactOpen(true)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-md shadow-emerald-500/20 transition-all"
                      >
                        <Plus size={14} />
                        Nouveau contact
                      </button>
                      <a
                        href="/dashboard"
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-content-secondary border border-line hover:bg-surface-elevated transition-colors"
                      >
                        <KanbanSquare size={14} />
                        Aller à la Prospection
                      </a>
                    </div>
                  </div>
                )
              }
            />

            {/* Load more */}
            {hasMore && !loading && (
              <div className="flex justify-center mt-6">
                <button
                  type="button"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-content-secondary border border-line hover:bg-surface-elevated transition-colors disabled:opacity-50"
                >
                  {loadingMore ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Chargement…
                    </>
                  ) : (
                    <>Charger plus ({total - contacts.length} restants)</>
                  )}
                </button>
              </div>
            )}
          </section>
        </main>
      </div>

      <NewContactModal
        open={newContactOpen}
        onClose={() => setNewContactOpen(false)}
        onCreated={handleContactCreated}
      />

      <AddToCampagneModal
        open={campagneOpen}
        onClose={() => setCampagneOpen(false)}
        contactIds={Array.from(selectedIds)}
        onSuccess={(data) => {
          const inserted = data?.inserted || 0;
          const skipped = data?.skipped || 0;
          const parts = [`${inserted} ajouté${inserted > 1 ? 's' : ''} à « ${data?.list_name} »`];
          if (skipped > 0) parts.push(`${skipped} doublon${skipped > 1 ? 's' : ''}`);
          setCampagneToast(parts.join(' · '));
          clearSelection();
        }}
      />

      <ConfirmModal
        open={!!contactToDelete}
        onClose={() => !deletingId && setContactToDelete(null)}
        onConfirm={performContactDelete}
        title={`Supprimer "${contactToDelete?.name || ''}" ?`}
        message="Le contact, ses notes et son historique d'engagement seront définitivement supprimés."
        confirmLabel="Supprimer"
        variant="danger"
        loading={!!deletingId}
      />
    </div>
  );
}
