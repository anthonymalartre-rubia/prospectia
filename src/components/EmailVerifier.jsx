'use client';

import { useState, useRef, useCallback } from 'react';
import {
  Upload,
  Play,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  HelpCircle,
  Trash2,
  Download,
  ShieldCheck,
  Mail,
  BarChart3,
  FileSpreadsheet,
} from 'lucide-react';
import { useI18n } from '@/lib/i18n';

const STATUS_CONFIG = {
  ok: { labelKey: 'verifier.statuses.ok', color: 'emerald', icon: CheckCircle2 },
  catch_all: { labelKey: 'verifier.statuses.catch_all', color: 'amber', icon: AlertTriangle },
  invalid: { labelKey: 'verifier.statuses.invalid', color: 'red', icon: XCircle },
  disposable: { labelKey: 'verifier.statuses.disposable', color: 'orange', icon: Trash2 },
  unknown: { labelKey: 'verifier.statuses.unknown', color: 'zinc', icon: HelpCircle },
};

function parseCSVEmails(text) {
  const emails = new Set();
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const matches = text.match(emailRegex);
  if (matches) {
    matches.forEach(e => emails.add(e.toLowerCase().trim()));
  }
  return [...emails];
}

export default function EmailVerifier({ userPlan }) {
  const { t } = useI18n();
  const [emails, setEmails] = useState([]);
  const [results, setResults] = useState(null);
  const [stats, setStats] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [error, setError] = useState(null);
  const [manualInput, setManualInput] = useState('');
  const [filter, setFilter] = useState('all');
  const fileInputRef = useRef(null);

  const hasPaidPlan = userPlan?.id === 'pro' || userPlan?.id === 'enterprise';

  const handleFileUpload = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const parsed = parseCSVEmails(text);
      if (parsed.length === 0) {
        setError(t('verifier.noEmailsFound'));
        return;
      }
      setEmails(parsed);
      setResults(null);
      setStats(null);
      setError(null);
    };
    reader.readAsText(file);
    // Reset input so same file can be re-uploaded
    e.target.value = '';
  }, [t]);

  const handleManualAdd = useCallback(() => {
    if (!manualInput.trim()) return;
    const parsed = parseCSVEmails(manualInput);
    if (parsed.length === 0) {
      setError(t('verifier.noValidEmails'));
      return;
    }
    setEmails(prev => {
      const existing = new Set(prev);
      parsed.forEach(e => existing.add(e));
      return [...existing];
    });
    setManualInput('');
    setResults(null);
    setStats(null);
    setError(null);
  }, [manualInput, t]);

  const handleVerify = useCallback(async () => {
    if (emails.length === 0) return;
    setIsVerifying(true);
    setError(null);
    setResults(null);
    setStats(null);

    const allResults = [];
    const batchSize = 100;
    const total = emails.length;
    setProgress({ done: 0, total });

    try {
      for (let i = 0; i < total; i += batchSize) {
        const batch = emails.slice(i, i + batchSize);
        const res = await fetch('/api/verify-emails', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ emails: batch }),
        });

        if (!res.ok) {
          const data = await res.json();
          if (res.status === 403) {
            setError(t('verifier.upgradeMsg'));
            setIsVerifying(false);
            return;
          }
          if (res.status === 429) {
            setError(t('verifier.limitReached'));
            break;
          }
          throw new Error(data.error || 'Erreur serveur');
        }

        const data = await res.json();
        allResults.push(...data.results);
        setProgress({ done: Math.min(i + batchSize, total), total });
      }

      setResults(allResults);

      // Compute overall stats
      const s = {
        total: allResults.length,
        valid: allResults.filter(r => r.result === 'ok').length,
        catch_all: allResults.filter(r => r.result === 'catch_all').length,
        invalid: allResults.filter(r => r.result === 'invalid').length,
        disposable: allResults.filter(r => r.result === 'disposable').length,
        unknown: allResults.filter(r => r.result === 'unknown').length,
      };
      setStats(s);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsVerifying(false);
    }
  }, [emails, t]);

  const handleExportResults = useCallback(() => {
    if (!results || results.length === 0) return;
    const header = 'Email,Statut,Sous-statut,Free,Role\n';
    const rows = results.map(r =>
      `"${r.email}","${t(STATUS_CONFIG[r.result]?.labelKey) || r.result}","${r.subresult || ''}","${r.free ? 'Oui' : 'Non'}","${r.role ? 'Oui' : 'Non'}"`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `verification-emails-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [results, t]);

  const handleClear = useCallback(() => {
    setEmails([]);
    setResults(null);
    setStats(null);
    setError(null);
    setManualInput('');
    setProgress({ done: 0, total: 0 });
  }, []);

  const filteredResults = results?.filter(r => filter === 'all' || r.result === filter) || [];

  // ─── Enterprise gate ─────────────────────────────────────
  if (!hasPaidPlan) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
          <ShieldCheck size={28} className="text-violet-400" />
        </div>
        <h2 className="text-xl font-semibold text-content-primary">{t('verifier.title')}</h2>
        <p className="text-sm text-content-muted max-w-md">
          {t('verifier.subtitle')}
          {' '}{t('verifier.upgradeMsg')}
        </p>
        <a
          href="/settings"
          className="mt-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition"
        >
          {t('verifier.upgradeBtn')}
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-content-primary flex items-center gap-2">
          <ShieldCheck size={22} className="text-violet-400" />
          {t('verifier.title')}
        </h2>
        <p className="text-sm text-content-muted mt-1">
          {t('verifier.importSubtitle')}
        </p>
      </div>

      {/* Import section */}
      <div className="rounded-xl border border-line bg-surface-card p-5 space-y-4">
        <h3 className="text-sm font-semibold text-content-secondary flex items-center gap-2">
          <FileSpreadsheet size={15} className="text-content-muted" />
          {t('verifier.importTitle')}
        </h3>

        {/* File upload */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-line-hover bg-surface-alt hover:bg-surface-elevated text-sm text-content-secondary transition"
          >
            <Upload size={15} />
            {t('verifier.importFile')}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.txt,.xlsx"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>

        {/* Manual input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleManualAdd()}
            placeholder={t('verifier.pasteLabel')}
            className="flex-1 px-3 py-2.5 rounded-xl border border-line bg-surface-base text-sm text-content-primary placeholder:text-content-faint focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500/50 transition"
          />
          <button
            onClick={handleManualAdd}
            disabled={!manualInput.trim()}
            className="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition"
          >
            {t('verifier.addBtn')}
          </button>
        </div>

        {/* Email count + actions */}
        {emails.length > 0 && (
          <div className="flex items-center justify-between pt-2 border-t border-line">
            <div className="flex items-center gap-2 text-sm text-content-secondary">
              <Mail size={14} className="text-violet-400" />
              <span className="font-medium">{emails.length}</span> {t('verifier.readyCount', { count: emails.length })}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleClear}
                className="px-3 py-1.5 rounded-lg text-xs text-content-muted hover:text-red-400 hover:bg-red-500/10 transition"
              >
                {t('verifier.clearAll')}
              </button>
              <button
                onClick={handleVerify}
                disabled={isVerifying}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-60 text-white text-sm font-medium transition"
              >
                {isVerifying ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    {t('verifier.verifying')} ({progress.done}/{progress.total})
                  </>
                ) : (
                  <>
                    <Play size={14} />
                    {t('verifier.startVerify')}
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Stats dashboard */}
      {stats && (
        <div className="rounded-xl border border-line bg-surface-card p-5 space-y-4">
          <h3 className="text-sm font-semibold text-content-secondary flex items-center gap-2">
            <BarChart3 size={15} className="text-content-muted" />
            {t('verifier.resultsTitle')}
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { key: 'valid', value: stats.valid, label: t('verifier.statsLabels.valid'), color: 'emerald' },
              { key: 'catch_all', value: stats.catch_all, label: t('verifier.statsLabels.catchAll'), color: 'amber' },
              { key: 'invalid', value: stats.invalid, label: t('verifier.statsLabels.invalid'), color: 'red' },
              { key: 'disposable', value: stats.disposable, label: t('verifier.statsLabels.disposable'), color: 'orange' },
              { key: 'unknown', value: stats.unknown, label: t('verifier.statsLabels.unknown'), color: 'zinc' },
            ].map(({ key, value, label, color }) => (
              <button
                key={key}
                onClick={() => setFilter(filter === key ? 'all' : key)}
                className={`rounded-xl border p-3 text-center transition ${
                  filter === key
                    ? `border-${color}-500/40 bg-${color}-500/10`
                    : 'border-line bg-surface-alt hover:bg-surface-elevated'
                }`}
              >
                <div className={`text-2xl font-bold text-${color}-400`}>{value}</div>
                <div className="text-[10px] uppercase tracking-wider text-content-faint mt-1">{label}</div>
                <div className="text-[10px] text-content-muted">
                  {stats.total > 0 ? Math.round((value / stats.total) * 100) : 0}%
                </div>
              </button>
            ))}
          </div>

          {/* Progress bar */}
          <div className="space-y-1">
            <div className="flex h-3 rounded-full overflow-hidden bg-surface-alt border border-line">
              {stats.valid > 0 && (
                <div className="bg-emerald-500 transition-all" style={{ width: `${(stats.valid / stats.total) * 100}%` }} />
              )}
              {stats.catch_all > 0 && (
                <div className="bg-amber-500 transition-all" style={{ width: `${(stats.catch_all / stats.total) * 100}%` }} />
              )}
              {stats.invalid > 0 && (
                <div className="bg-red-500 transition-all" style={{ width: `${(stats.invalid / stats.total) * 100}%` }} />
              )}
              {stats.disposable > 0 && (
                <div className="bg-orange-500 transition-all" style={{ width: `${(stats.disposable / stats.total) * 100}%` }} />
              )}
              {stats.unknown > 0 && (
                <div className="bg-zinc-500 transition-all" style={{ width: `${(stats.unknown / stats.total) * 100}%` }} />
              )}
            </div>
            <div className="flex justify-between text-[10px] text-content-faint">
              <span>{stats.total} emails verifies</span>
              <span>{stats.valid} exploitables ({stats.total > 0 ? Math.round((stats.valid / stats.total) * 100) : 0}%)</span>
            </div>
          </div>

          {/* Export button */}
          <button
            onClick={handleExportResults}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-line hover:bg-surface-elevated text-sm text-content-secondary transition"
          >
            <Download size={14} />
            {t('verifier.exportResults')}
          </button>
        </div>
      )}

      {/* Results table */}
      {results && results.length > 0 && (
        <div className="rounded-xl border border-line bg-surface-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line bg-surface-alt">
                  <th className="px-4 py-3 text-left text-[10px] uppercase tracking-wider text-content-faint font-semibold">Email</th>
                  <th className="px-4 py-3 text-left text-[10px] uppercase tracking-wider text-content-faint font-semibold">Statut</th>
                  <th className="px-4 py-3 text-left text-[10px] uppercase tracking-wider text-content-faint font-semibold hidden sm:table-cell">Detail</th>
                  <th className="px-4 py-3 text-left text-[10px] uppercase tracking-wider text-content-faint font-semibold hidden md:table-cell">Type</th>
                </tr>
              </thead>
              <tbody>
                {filteredResults.map((r, i) => {
                  const cfg = STATUS_CONFIG[r.result] || STATUS_CONFIG.unknown;
                  const Icon = cfg.icon;
                  return (
                    <tr key={i} className="border-b border-line last:border-0 hover:bg-surface-elevated/50 transition">
                      <td className="px-4 py-2.5 font-mono text-xs text-content-primary">{r.email}</td>
                      <td className="px-4 py-2.5">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-${cfg.color}-500/10 text-${cfg.color}-400 border border-${cfg.color}-500/20`}>
                          <Icon size={11} />
                          {t(cfg.labelKey)}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-content-muted hidden sm:table-cell">
                        {r.subresult || '—'}
                      </td>
                      <td className="px-4 py-2.5 hidden md:table-cell">
                        <div className="flex gap-1.5">
                          {r.free && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20">{t('verifier.free')}</span>
                          )}
                          {r.role && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-purple-500/10 text-purple-400 border border-purple-500/20">{t('verifier.role')}</span>
                          )}
                          {!r.free && !r.role && (
                            <span className="text-xs text-content-faint">—</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filter !== 'all' && (
            <div className="px-4 py-2 bg-surface-alt border-t border-line text-[11px] text-content-muted">
              {t('verifier.activeFilter')} : {t(STATUS_CONFIG[filter]?.labelKey)} ({filteredResults.length} / {results.length})
              <button onClick={() => setFilter('all')} className="ml-2 text-violet-400 hover:underline">{t('verifier.showAll')}</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
