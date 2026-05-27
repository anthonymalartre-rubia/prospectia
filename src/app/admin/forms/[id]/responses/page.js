'use client';

// ─────────────────────────────────────────────────────────────────────
// /admin/forms/[id]/responses — Vue admin des soumissions (Sprint F2)
// ─────────────────────────────────────────────────────────────────────
// Tableau des form_responses : date, preview des answers, badge bridge_status,
// pagination 50/page, export CSV.
// ─────────────────────────────────────────────────────────────────────

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Download,
  Inbox,
  Loader2,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Clock,
  MinusCircle,
} from 'lucide-react';

const PAGE_SIZE = 50;

const BRIDGE_BADGES = {
  succeeded: { label: 'Bridges OK', cls: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
  failed: { label: 'Échec', cls: 'bg-rose-100 text-rose-700 border-rose-200', icon: XCircle },
  pending: { label: 'En attente', cls: 'bg-amber-100 text-amber-700 border-amber-200', icon: Clock },
  skipped: { label: 'Aucun bridge', cls: 'bg-zinc-100 text-zinc-600 border-zinc-200', icon: MinusCircle },
};

function preview(answers, max = 80) {
  if (!answers || typeof answers !== 'object') return '—';
  const parts = [];
  for (const [k, v] of Object.entries(answers)) {
    if (k.startsWith('_') || k === 'website') continue;
    let val = v;
    if (v && typeof v === 'object') {
      if (v._file) val = v.name;
      else val = Array.isArray(v) ? v.join(', ') : JSON.stringify(v);
    }
    parts.push(`${k}: ${String(val ?? '').slice(0, 60)}`);
  }
  const joined = parts.join(' · ');
  return joined.length > max ? joined.slice(0, max) + '…' : joined;
}

function formatDate(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export default function FormResponsesPage() {
  const { id } = useParams();
  const [responses, setResponses] = useState([]);
  const [form, setForm] = useState(null);
  const [pagination, setPagination] = useState({ total: 0, offset: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);

  async function loadPage(offset) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/forms/${id}/responses?limit=${PAGE_SIZE}&offset=${offset}`
      );
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || 'Erreur');
      } else {
        setResponses(json.data || []);
        setForm(json.form);
        setPagination(json.pagination);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPage(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleExportCsv() {
    setDownloading(true);
    try {
      const res = await fetch(`/api/admin/forms/${id}/responses?format=csv`);
      if (!res.ok) {
        setError('Export CSV échoué');
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${form?.slug || 'form'}-responses.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e.message);
    } finally {
      setDownloading(false);
    }
  }

  const totalPages = Math.ceil((pagination.total || 0) / PAGE_SIZE);
  const currentPage = Math.floor((pagination.offset || 0) / PAGE_SIZE) + 1;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <Link
        href={`/admin/forms/${id}`}
        className="inline-flex items-center gap-1.5 text-xs text-content-tertiary hover:text-pink-700 transition-colors mb-6"
      >
        <ArrowLeft size={14} /> Retour au formulaire
      </Link>

      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Inbox size={14} className="text-pink-600" />
            <p className="text-[11px] uppercase tracking-wider font-semibold text-content-muted">
              Réponses
            </p>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-content-primary tracking-tight">
            {form?.name || 'Formulaire'}
          </h1>
          <p className="mt-1 text-sm text-content-tertiary">
            {pagination.total} soumission{pagination.total > 1 ? 's' : ''} au total
          </p>
        </div>
        <button
          onClick={handleExportCsv}
          disabled={downloading || (pagination.total || 0) === 0}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-sm font-medium shadow-lg shadow-pink-500/20 active:scale-95 transition-all disabled:opacity-50"
        >
          {downloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
          Export CSV
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-700">
          {error}
        </div>
      )}

      {loading && (
        <div className="flex items-center gap-2 text-content-tertiary text-sm">
          <Loader2 size={16} className="animate-spin" /> Chargement…
        </div>
      )}

      {!loading && responses.length === 0 && !error && (
        <div className="rounded-2xl border border-dashed border-line bg-surface-card/50 p-10 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-pink-100 text-pink-600 mb-4">
            <Inbox size={22} />
          </div>
          <h3 className="text-lg font-semibold text-content-primary">
            Personne n&apos;a répondu. Encore.
          </h3>
          <p className="mt-1 text-sm text-content-tertiary max-w-md mx-auto">
            Partage ton form (lien, iframe, QR) pour commencer à choper des réponses.
          </p>
          {form?.slug && (
            <Link
              href={`/f/${form.slug}`}
              target="_blank"
              className="mt-4 inline-flex items-center gap-1.5 text-sm text-pink-600 hover:text-pink-700"
            >
              Aperçu : /f/{form.slug}
            </Link>
          )}
        </div>
      )}

      {!loading && responses.length > 0 && (
        <>
          <div className="rounded-xl border border-line bg-surface-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-surface-elevated border-b border-line">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-content-tertiary text-xs uppercase tracking-wider">Date</th>
                  <th className="text-left px-4 py-3 font-medium text-content-tertiary text-xs uppercase tracking-wider">Réponses</th>
                  <th className="text-left px-4 py-3 font-medium text-content-tertiary text-xs uppercase tracking-wider">Bridge</th>
                  <th className="px-4 py-3 w-8" />
                </tr>
              </thead>
              <tbody>
                {responses.map((r) => {
                  const status = r.bridge_status || 'skipped';
                  const badge = BRIDGE_BADGES[status] || BRIDGE_BADGES.skipped;
                  const Icon = badge.icon;
                  const detailHref = `/admin/forms/${id}/responses/${r.id}`;
                  return (
                    <tr
                      key={r.id}
                      onClick={() => { window.location.href = detailHref; }}
                      className="border-b border-line last:border-0 hover:bg-surface-elevated/50 transition-colors cursor-pointer"
                    >
                      <td className="px-4 py-3 text-content-secondary whitespace-nowrap">
                        {formatDate(r.submitted_at)}
                      </td>
                      <td className="px-4 py-3 text-content-primary">
                        <code className="text-xs text-content-tertiary">{preview(r.answers)}</code>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${badge.cls}`}>
                          <Icon size={11} /> {badge.label}
                        </span>
                        {r.bridge_error && (
                          <p className="text-[10px] text-rose-600 mt-1 max-w-xs truncate" title={r.bridge_error}>
                            {r.bridge_error}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={detailHref}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center text-xs text-pink-700 hover:underline"
                        >
                          Détail →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between gap-2">
              <p className="text-xs text-content-tertiary">
                Page {currentPage} / {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => loadPage(Math.max(0, pagination.offset - PAGE_SIZE))}
                  disabled={currentPage <= 1 || loading}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface-card border border-line hover:bg-surface-elevated text-sm disabled:opacity-50"
                >
                  <ChevronLeft size={14} /> Précédent
                </button>
                <button
                  onClick={() => loadPage(pagination.offset + PAGE_SIZE)}
                  disabled={!pagination.has_more || loading}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface-card border border-line hover:bg-surface-elevated text-sm disabled:opacity-50"
                >
                  Suivant <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
