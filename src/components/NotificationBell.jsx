'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Bell, BellRing, Check, CheckCheck, Loader2, Inbox, X,
  Mail, AlertCircle, TrendingUp, CreditCard, Sparkles, Award, Megaphone,
} from 'lucide-react';

// Mapping type → icône + couleur
const TYPE_META = {
  enrichment_done:        { Icon: Mail,        color: 'text-green-400',   bg: 'bg-green-500/10' },
  search_complete:        { Icon: Mail,        color: 'text-green-400',   bg: 'bg-green-500/10' },
  quota_warning:          { Icon: AlertCircle, color: 'text-amber-600',   bg: 'bg-amber-500/10' },
  quota_reached:          { Icon: AlertCircle, color: 'text-red-400',     bg: 'bg-red-500/10' },
  payment_success:        { Icon: CreditCard,  color: 'text-green-400',   bg: 'bg-green-500/10' },
  payment_failed:         { Icon: CreditCard,  color: 'text-red-400',     bg: 'bg-red-500/10' },
  subscription_cancelled: { Icon: CreditCard,  color: 'text-content-secondary',    bg: 'bg-zinc-500/10' },
  plan_changed:           { Icon: TrendingUp,  color: 'text-violet-400',  bg: 'bg-violet-500/10' },
  new_feature:            { Icon: Sparkles,    color: 'text-violet-400',  bg: 'bg-violet-500/10' },
  study_published:        { Icon: Award,       color: 'text-violet-400',  bg: 'bg-violet-500/10' },
  weekly_digest:          { Icon: Mail,        color: 'text-blue-400',    bg: 'bg-blue-500/10' },
  admin_message:          { Icon: Megaphone,   color: 'text-indigo-400',  bg: 'bg-indigo-500/10' },
};

const DEFAULT_META = { Icon: Bell, color: 'text-content-secondary', bg: 'bg-zinc-500/10' };

function timeAgo(iso) {
  if (!iso) return '';
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return `il y a ${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `il y a ${minutes}min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `il y a ${days}j`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `il y a ${weeks}sem`;
  return new Date(iso).toLocaleDateString('fr-FR');
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef(null);
  const buttonRef = useRef(null);

  // Charge les notifs au mount + toutes les 60s en background
  const fetchNotifs = async () => {
    try {
      const res = await fetch('/api/notifications?limit=30', { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      setItems(data.notifications || []);
      setUnread(data.unread_count || 0);
    } catch {
      // Silence — pas critique en background
    }
  };

  // Polling intelligent : on stoppe l'intervalle quand la tab passe en
  // arrière-plan (document.hidden) et on relance + refresh immédiat au
  // retour. Évite 60 requêtes inutiles/heure × N tabs ouvertes.
  useEffect(() => {
    let interval = null;

    const startPolling = () => {
      if (interval) return;
      interval = setInterval(fetchNotifs, 60_000); // 60s
    };
    const stopPolling = () => {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
    };
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopPolling();
      } else {
        fetchNotifs(); // refresh immédiat au retour
        startPolling();
      }
    };

    // Fetch initial + polling si la tab est active
    fetchNotifs();
    if (!document.hidden) startPolling();

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      stopPolling();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Quand on ouvre le panel, refresh
  useEffect(() => {
    if (open) fetchNotifs();
  }, [open]);

  // Click outside → ferme le panel
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (
        panelRef.current && !panelRef.current.contains(e.target) &&
        buttonRef.current && !buttonRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const markOneRead = async (id) => {
    // Optimistic update
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n)));
    setUnread((u) => Math.max(0, u - 1));
    await fetch('/api/notifications/mark-read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: [id] }),
    });
  };

  const markAllRead = async () => {
    if (unread === 0) return;
    setLoading(true);
    setItems((prev) => prev.map((n) => ({ ...n, read_at: n.read_at || new Date().toISOString() })));
    setUnread(0);
    await fetch('/api/notifications/mark-read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ all: true }),
    });
    setLoading(false);
  };

  const archiveOne = async (id) => {
    setItems((prev) => prev.filter((n) => n.id !== id));
    await fetch('/api/notifications/archive', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: [id] }),
    });
  };

  return (
    <div className="relative">
      {/* Trigger bell */}
      <button
        ref={buttonRef}
        onClick={() => setOpen((o) => !o)}
        aria-label={`${unread} notifications non lues`}
        aria-expanded={open}
        className="relative p-2 rounded-lg hover:bg-surface-elevated transition text-content-secondary hover:text-content-primary"
      >
        {unread > 0 ? <BellRing size={18} /> : <Bell size={18} />}
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-violet-600 text-white text-[10px] font-bold flex items-center justify-center border border-surface-base">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {/* Panel dropdown */}
      {open && (
        <div
          ref={panelRef}
          className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-2xl border border-line bg-surface-card shadow-xl shadow-black/20 backdrop-blur-sm z-50 overflow-hidden"
          role="dialog"
          aria-label="Notifications"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-line">
            <h2 className="text-sm font-semibold text-content-primary">Notifications</h2>
            {unread > 0 && (
              <button
                onClick={markAllRead}
                disabled={loading}
                className="text-xs text-violet-400 hover:text-violet-300 disabled:opacity-50 inline-flex items-center gap-1"
              >
                {loading ? <Loader2 size={11} className="animate-spin" /> : <CheckCheck size={11} />}
                Tout marquer comme lu
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <div className="px-4 py-12 text-center text-content-tertiary">
                <Inbox size={28} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">Tout est calme.</p>
                <p className="text-xs mt-1">Profite.</p>
              </div>
            ) : (
              items.map((n) => {
                const meta = TYPE_META[n.type] || DEFAULT_META;
                const { Icon } = meta;
                const isRead = !!n.read_at;
                const content = (
                  <div className={`relative flex gap-3 px-4 py-3 transition cursor-pointer ${isRead ? '' : 'bg-violet-500/[0.04]'} hover:bg-surface-elevated`}>
                    <div className={`w-8 h-8 rounded-lg ${meta.bg} flex items-center justify-center flex-shrink-0`}>
                      <Icon size={14} className={meta.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm leading-snug ${isRead ? 'text-content-secondary' : 'text-content-primary font-medium'}`}>
                          {n.title}
                        </p>
                        {!isRead && <span className="w-2 h-2 rounded-full bg-violet-500 flex-shrink-0 mt-1.5" aria-label="Non lu" />}
                      </div>
                      {n.body && <p className="text-xs text-content-tertiary mt-0.5 leading-relaxed line-clamp-2">{n.body}</p>}
                      <p className="text-[10px] text-content-tertiary mt-1.5">{timeAgo(n.created_at)}</p>
                    </div>
                    {/* Archive button */}
                    <button
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); archiveOne(n.id); }}
                      aria-label="Archiver"
                      className="text-content-tertiary hover:text-red-400 transition self-start opacity-0 group-hover:opacity-100 focus:opacity-100"
                    >
                      <X size={14} />
                    </button>
                  </div>
                );
                return n.link ? (
                  <Link
                    key={n.id}
                    href={n.link}
                    onClick={() => { if (!isRead) markOneRead(n.id); setOpen(false); }}
                    className="block group"
                  >
                    {content}
                  </Link>
                ) : (
                  <div key={n.id} onClick={() => !isRead && markOneRead(n.id)} className="group">
                    {content}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-line flex items-center justify-between gap-3">
            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              className="text-xs font-medium text-violet-400 hover:text-violet-300 transition"
            >
              Voir toutes les notifications →
            </Link>
            <Link
              href="/settings#notifications"
              onClick={() => setOpen(false)}
              className="text-xs text-content-tertiary hover:text-content-secondary transition"
              aria-label="Préférences notifications"
            >
              Préférences
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
