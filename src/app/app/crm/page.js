'use client';

// ─────────────────────────────────────────────────────────────────────
// /app/crm — Coming Soon (in-app placeholder)
// ─────────────────────────────────────────────────────────────────────
//
// Page interne authentifiée. Le middleware protège déjà /app/* (voir
// middleware.js). Look-and-feel cohérent avec le dashboard : TopBar
// en haut + contenu centré avec accent emerald (couleur module CRM).
//
// CTA : waitlist form qui réutilise /api/newsletter/subscribe avec
// source='crm-waitlist-app' (séparé de 'crm-waitlist' utilisé par la
// landing /produits/crm pour différencier les sources d'analytics).
//
// Note volontaire : pas de Sidebar ici (la sidebar du dashboard est
// hardcodée pour Prospection avec ses nav items search/results/export).
// Pour la CRM placeholder, on garde une UX épurée centrée sur la
// waitlist — pas la peine d'introduire une nav module-spécifique
// avant que le produit n'existe.
// ─────────────────────────────────────────────────────────────────────

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getSupabase } from '@/lib/supabase';
import {
  KanbanSquare,
  Users,
  BarChart3,
  Smartphone,
  Rocket,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';
import TopBar from '@/components/TopBar';
import MotionInView from '@/components/MotionInView';
import WaitlistForm from './WaitlistForm';

const FEATURES = [
  {
    icon: Users,
    title: 'Contacts auto',
    desc: 'Chaque réponse à une séquence Volia Campagnes crée automatiquement un contact CRM avec son historique complet.',
  },
  {
    icon: KanbanSquare,
    title: 'Pipeline Kanban',
    desc: 'Lead → Qualifié → Démo → Closé. Personnalisez les étapes, drag & drop des deals, valeur estimée par carte.',
  },
  {
    icon: BarChart3,
    title: 'Reporting natif',
    desc: 'Closing rate par segment, cycle de vente moyen, valeur pipeline pondérée, prévisions M+1/M+3.',
  },
  {
    icon: Smartphone,
    title: 'Mobile-first',
    desc: "Interface tactile pensée pour le terrain : actions en 1 tap, notifications push, hors-ligne basique.",
  },
];

export default function CrmAppPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push('/login');
        return;
      }
      setUser(user);
    });
  }, [router]);

  // Skeleton loading pendant la résolution de l'auth (évite le flash)
  if (!user) {
    return (
      <div className="min-h-screen bg-surface-base flex items-center justify-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center animate-pulse">
          <KanbanSquare size={28} className="text-white" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-base text-content-primary">
      <TopBar user={user} onToggleSidebar={() => setSidebarOpen((v) => !v)} />

      <main className="relative overflow-hidden">
        {/* Background decor emerald discret */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-br from-emerald-200/30 via-teal-100/20 to-green-100/10 rounded-full blur-3xl pointer-events-none -z-0"
          aria-hidden="true"
        />
        <div
          className="absolute top-32 right-[10%] w-72 h-72 bg-emerald-300/15 rounded-full blur-3xl pointer-events-none -z-0 animate-pulse"
          style={{ animationDuration: '6s' }}
          aria-hidden="true"
        />
        <div
          className="absolute top-48 left-[8%] w-64 h-64 bg-teal-200/20 rounded-full blur-3xl pointer-events-none -z-0 animate-pulse"
          style={{ animationDuration: '8s' }}
          aria-hidden="true"
        />

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
          {/* Breadcrumb retour Prospection */}
          <div className="mb-8">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-xs text-content-tertiary hover:text-content-primary transition-colors"
            >
              <ArrowLeft size={12} />
              Retour à Prospection
            </Link>
          </div>

          {/* Hero */}
          <div className="text-center mb-16">
            <MotionInView>
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-2xl shadow-emerald-500/30 mb-6">
                <KanbanSquare size={36} className="text-white" />
              </div>
            </MotionInView>

            <MotionInView delay={100}>
              <div className="flex items-center justify-center gap-3 mb-5 flex-wrap">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 bg-clip-text text-transparent">
                  Volia CRM
                </h1>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border bg-amber-100 text-amber-700 border-amber-300">
                  <Rocket size={11} />
                  Bientôt disponible
                </span>
              </div>
            </MotionInView>

            <MotionInView delay={200}>
              <p className="text-base sm:text-lg text-content-secondary leading-relaxed max-w-2xl mx-auto">
                Le module CRM est en construction. Prévu{' '}
                <strong className="text-content-primary font-semibold">
                  Q4 2026
                </strong>{' '}
                : pipeline Kanban natif, contacts auto-créés depuis Campagnes,
                reporting closing rate. Beta privée ouverte en priorité aux
                utilisateurs Pro et Business.
              </p>
            </MotionInView>
          </div>

          {/* Features prévues — 4 cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-14">
            {FEATURES.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <MotionInView key={feature.title} delay={300 + i * 80}>
                  <div className="group h-full p-6 rounded-2xl border border-emerald-200/60 bg-gradient-to-br from-emerald-50/80 via-surface-base to-teal-50/40 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-4 shadow-md group-hover:scale-110 transition-transform">
                      <Icon size={18} className="text-white" />
                    </div>
                    <h3 className="font-bold text-base mb-1.5 text-content-primary">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-content-secondary leading-relaxed">
                      {feature.desc}
                    </p>
                  </div>
                </MotionInView>
              );
            })}
          </div>

          {/* Waitlist CTA */}
          <MotionInView delay={600}>
            <div className="relative rounded-2xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 via-surface-base to-teal-50 p-8 sm:p-10 text-center shadow-xl shadow-emerald-500/10 overflow-hidden">
              {/* Mini blob décoratif */}
              <div
                className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-emerald-300/20 blur-3xl pointer-events-none"
                aria-hidden="true"
              />
              <div
                className="absolute -bottom-12 -left-12 w-40 h-40 rounded-full bg-teal-300/20 blur-3xl pointer-events-none"
                aria-hidden="true"
              />

              <div className="relative">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-700 text-xs font-semibold uppercase tracking-wider mb-4">
                  <Sparkles size={11} />
                  Beta privée
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold mb-3 text-content-primary">
                  Rejoindre la beta privée
                </h2>
                <p className="text-content-secondary mb-6 max-w-md mx-auto text-sm sm:text-base">
                  100 premiers comptes seulement. 3 mois gratuits + accès
                  Discord direct à l'équipe produit.
                </p>

                <WaitlistForm />

                <p className="text-xs text-content-tertiary mt-5">
                  Si tu es{' '}
                  <strong className="text-content-secondary font-semibold">
                    Pro ou Business
                  </strong>
                  , tu seras prioritaire pour la beta.
                </p>
              </div>
            </div>
          </MotionInView>

          {/* Lien complémentaire vers la page produit publique */}
          <div className="mt-10 text-center">
            <Link
              href="/produits/crm"
              className="text-xs text-content-tertiary hover:text-emerald-600 transition-colors"
            >
              Voir la page produit complète et la roadmap →
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
