'use client';

// ─────────────────────────────────────────────────────────────────────
// /app/crm/inbound — Audit des réponses entrantes (email + SMS)
//
// Liste les inbound_events récents avec lien vers le contact/deal auto-créé.
// Utile pour debug et pour visualiser le killer feature "zero manual work".
// ─────────────────────────────────────────────────────────────────────

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Inbox, Mail, MessageSquare, RefreshCw, AlertCircle } from 'lucide-react';
import TopBar from '@/components/TopBar';
import CrmSidebar from '@/components/crm/CrmSidebar';
import { getSupabase } from '@/lib/supabase';

function formatDate(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('fr-FR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function ChannelIcon({ channel }) {
  if (channel === 'email') return <Mail className="w-4 h-4" />;
  if (channel === 'sms') return <MessageSquare className="w-4 h-4" />;
  return <Inbox className="w-4 h-4" />;
}

export default function InboundEventsPage() {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = getSupabase();
      if (!supabase) {
        setError('Supabase non disponible');
        setLoading(false);
        return;
      }
      const { data, error: err } = await supabase
        .from('inbound_events')
        .select('id, channel, from_email, from_phone, subject, body, processed_at, contact_id, deal_id, created_at')
        .order('created_at', { ascending: false })
        .limit(100);
      if (err) {
        setError(err.message);
      } else {
        setEvents(data || []);
      }
    } catch (e) {
      setError(e.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <>
      <TopBar showHamburger={false} />
      <main className="min-h-screen bg-surface-base text-content-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex gap-6">
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <CrmSidebar />
          </aside>

          <section className="flex-1 min-w-0">
            <header className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-surface-elevated rounded-lg">
                  <Inbox className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-2xl font-semibold">Réponses entrantes</h1>
                  <p className="text-sm text-content-secondary">
                    Audit des replies email/SMS automatiquement converties en leads CRM.
                  </p>
                </div>
              </div>
              <button
                onClick={load}
                className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-line-default hover:bg-surface-elevated text-sm"
              >
                <RefreshCw className="w-4 h-4" />
                Rafraîchir
              </button>
            </header>

            {error && (
              <div className="mb-4 p-3 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            {loading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="h-20 rounded-lg bg-surface-elevated animate-pulse"
                  />
                ))}
              </div>
            ) : events.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-line-default rounded-lg">
                <Inbox className="w-10 h-10 mx-auto mb-3 text-content-tertiary" />
                <p className="text-content-secondary">
                  Personne n&apos;a répondu. Encore.
                </p>
                <p className="text-xs text-content-tertiary mt-2">
                  Dès qu&apos;un prospect répond à un email ou SMS, un contact + deal
                  se créent ici, tout seuls.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {events.map((ev) => (
                  <article
                    key={ev.id}
                    className="p-4 rounded-lg border border-line-default bg-surface-elevated"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-md bg-surface-base text-content-secondary">
                        <ChannelIcon channel={ev.channel} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                          <div className="flex items-center gap-2 text-sm">
                            <span className="font-medium">
                              {ev.from_email || ev.from_phone || 'Inconnu'}
                            </span>
                            <span className="text-xs px-1.5 py-0.5 rounded bg-surface-base uppercase text-content-tertiary">
                              {ev.channel}
                            </span>
                          </div>
                          <span className="text-xs text-content-tertiary">
                            {formatDate(ev.created_at)}
                          </span>
                        </div>

                        {ev.subject && (
                          <p className="mt-1 text-sm text-content-secondary truncate">
                            {ev.subject}
                          </p>
                        )}

                        {ev.body && (
                          <p className="mt-2 text-sm text-content-primary line-clamp-2">
                            {ev.body}
                          </p>
                        )}

                        <div className="mt-3 flex items-center gap-2 flex-wrap">
                          {ev.contact_id && (
                            <Link
                              href={`/app/crm/contacts?focus=${ev.contact_id}`}
                              className="text-xs px-2 py-1 rounded bg-blue-500/10 text-blue-400 hover:bg-blue-500/20"
                            >
                              → Contact
                            </Link>
                          )}
                          {ev.deal_id && (
                            <Link
                              href={`/app/crm?deal=${ev.deal_id}`}
                              className="text-xs px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                            >
                              → Deal
                            </Link>
                          )}
                          {!ev.contact_id && !ev.deal_id && (
                            <span className="text-xs text-content-tertiary">
                              Non rattaché (sender inconnu)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </>
  );
}
