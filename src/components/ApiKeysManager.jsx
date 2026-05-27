'use client';

import { useState, useEffect } from 'react';
import { Check, Copy, Eye, EyeOff, Key, Loader2, Plus, Trash2, AlertCircle } from 'lucide-react';
import { ConfirmModal } from '@/components/ui';

export default function ApiKeysManager() {
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [revealedKey, setRevealedKey] = useState(null); // clé claire fraîchement créée
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);
  // Modale confirmation révocation (remplace confirm() natif)
  const [keyToRevoke, setKeyToRevoke] = useState(null);
  const [revoking, setRevoking] = useState(false);

  const fetchKeys = async () => {
    try {
      const res = await fetch('/api/api-keys');
      if (!res.ok) throw new Error();
      const data = await res.json();
      setKeys(data.keys || []);
    } catch {
      setError('Impossible de charger les clés API.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchKeys(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newLabel.trim() || creating) return;
    setCreating(true);
    setError(null);
    try {
      const res = await fetch('/api/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: newLabel.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Erreur création');
        return;
      }
      setRevealedKey(data); // affiche modale "copiez la clé maintenant"
      setNewLabel('');
      fetchKeys();
    } catch {
      setError('Erreur réseau');
    } finally {
      setCreating(false);
    }
  };

  const performRevoke = async () => {
    if (!keyToRevoke) return;
    setRevoking(true);
    try {
      await fetch(`/api/api-keys?id=${keyToRevoke.id}`, { method: 'DELETE' });
      fetchKeys();
    } catch {
      setError('Erreur révocation');
    } finally {
      setRevoking(false);
      setKeyToRevoke(null);
    }
  };

  const copyKey = () => {
    if (!revealedKey?.key) return;
    navigator.clipboard.writeText(revealedKey.key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-content-tertiary text-sm">
        <Loader2 size={16} className="animate-spin" /> Chargement…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-sm text-red-300 flex items-start gap-2">
          <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {/* Modale de révélation : clé claire affichée 1 fois */}
      {revealedKey && (
        <div className="rounded-xl border border-violet-500/30 bg-violet-500/[0.06] p-4">
          <div className="flex items-start gap-2 mb-3">
            <Key size={16} className="text-violet-300 flex-shrink-0 mt-1" />
            <div>
              <p className="text-sm font-semibold text-content-primary mb-1">Clé créée : {revealedKey.label}</p>
              <p className="text-xs text-content-tertiary leading-relaxed">
                {revealedKey.warning} Stockez-la dans un gestionnaire de mots de passe ou directement dans Zapier/Make.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 px-3 py-2 rounded-lg bg-surface-base border border-line text-xs font-mono text-content-primary overflow-x-auto whitespace-nowrap">
              {revealedKey.key}
            </code>
            <button
              onClick={copyKey}
              className="px-3 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition"
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
              {copied ? 'Copié' : 'Copier'}
            </button>
          </div>
          <button
            onClick={() => setRevealedKey(null)}
            className="mt-3 text-xs text-content-tertiary hover:text-content-secondary"
          >
            J&apos;ai copié la clé, fermer
          </button>
        </div>
      )}

      {/* Formulaire création */}
      <form onSubmit={handleCreate} className="flex gap-2">
        <input
          type="text"
          maxLength={80}
          placeholder="Label (ex: Zapier production)"
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          disabled={creating}
          className="flex-1 px-4 py-2 rounded-lg bg-surface-base border border-line text-sm text-content-primary placeholder:text-content-tertiary focus:outline-none focus:border-violet-500 transition"
        />
        <button
          type="submit"
          disabled={creating || !newLabel.trim()}
          className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-semibold inline-flex items-center gap-1.5 transition"
        >
          {creating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
          Créer
        </button>
      </form>

      {/* Liste des clés existantes */}
      {keys.length === 0 ? (
        <div className="text-center text-content-tertiary text-sm py-6 border border-dashed border-line rounded-xl">
          <Key size={20} className="mx-auto mb-2 opacity-50" />
          Aucune clé API. Crée-en une ci-dessus pour démarrer.
        </div>
      ) : (
        <div className="rounded-xl border border-line overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface-elevated">
              <tr>
                <th className="text-left p-3 font-semibold text-content-secondary">Label</th>
                <th className="text-left p-3 font-semibold text-content-secondary">Préfixe</th>
                <th className="text-left p-3 font-semibold text-content-secondary hidden sm:table-cell">Créée le</th>
                <th className="text-left p-3 font-semibold text-content-secondary hidden md:table-cell">Dernière utilisation</th>
                <th className="text-right p-3 font-semibold text-content-secondary">Actions</th>
              </tr>
            </thead>
            <tbody>
              {keys.map((k) => (
                <tr key={k.id} className={`border-t border-line ${k.revoked_at ? 'opacity-50' : ''}`}>
                  <td className="p-3 text-content-primary">
                    {k.label}
                    {k.revoked_at && <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-red-500/15 text-red-300">Révoquée</span>}
                  </td>
                  <td className="p-3 text-content-tertiary font-mono text-xs">{k.key_prefix}…</td>
                  <td className="p-3 text-content-tertiary text-xs hidden sm:table-cell">
                    {new Date(k.created_at).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="p-3 text-content-tertiary text-xs hidden md:table-cell">
                    {k.last_used_at ? new Date(k.last_used_at).toLocaleDateString('fr-FR') : 'Jamais'}
                  </td>
                  <td className="p-3 text-right">
                    {!k.revoked_at && (
                      <button
                        onClick={() => setKeyToRevoke(k)}
                        className="text-red-400 hover:text-red-300 p-1"
                        aria-label="Révoquer"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-content-tertiary leading-relaxed">
        Les clés API permettent à des intégrations externes (Zapier, Make, scripts custom)
        d&apos;accéder à votre compte Volia.
        <a href="/api" className="text-violet-400 hover:underline ml-1">Voir la documentation</a>.
        Max 5 clés actives par compte.
      </p>

      <ConfirmModal
        open={!!keyToRevoke}
        onClose={() => !revoking && setKeyToRevoke(null)}
        onConfirm={performRevoke}
        title="Révoquer cette clé API ?"
        message={`La clé "${keyToRevoke?.label || ''}" sera révoquée immédiatement. Les intégrations qui l'utilisent (Zapier, Make, scripts custom) cesseront de fonctionner.`}
        confirmLabel="Révoquer"
        variant="danger"
        loading={revoking}
      />
    </div>
  );
}
