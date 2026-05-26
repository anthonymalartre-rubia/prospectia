'use client';

// ─────────────────────────────────────────────────────────────────────
// /auth/confirm — handler client-side du retour de Supabase Verify
// ─────────────────────────────────────────────────────────────────────
//
// Quand un user clique le lien de confirmation email (signup, magic link),
// Supabase Verify vérifie le token et redirige vers `redirectTo` avec un
// fragment `#access_token=...&refresh_token=...&type=signup`.
//
// Problème : le fragment (#) est CLIENT-ONLY. Le serveur Next.js ne le voit
// pas. Donc si redirectTo pointe directement vers /dashboard (qui check
// la session côté serveur via cookie), le middleware redirige vers /login
// avant que le supabase-js JS détecte le hash.
//
// Solution : on redirige vers /auth/confirm (page client-rendered, donc
// AUCUN check session serveur). supabase-js détecte automatiquement le
// hash, crée la session (cookies + localStorage via @supabase/ssr), puis
// on push() vers la destination finale (/dashboard par défaut, ou `next`
// query param).
//
// Référence : https://supabase.com/docs/guides/auth/sessions#detecting-session
// ─────────────────────────────────────────────────────────────────────

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getSupabase } from '@/lib/supabase';

export default function AuthConfirmPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState('processing'); // 'processing' | 'success' | 'error'
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) {
      setStatus('error');
      setErrorMsg('Configuration Supabase manquante.');
      return;
    }

    // supabase-js (createBrowserClient) détecte automatiquement le hash
    // au moment du init (option detectSessionInUrl=true par défaut).
    // On lui laisse le temps puis on lit la session.
    //
    // On utilise onAuthStateChange pour capter l'évènement INITIAL_SESSION
    // ou SIGNED_IN qui suit la détection du hash. Plus fiable que getSession()
    // dans une race condition.
    let timeoutId;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' || (event === 'INITIAL_SESSION' && session)) {
        clearTimeout(timeoutId);
        subscription?.unsubscribe();

        // Trial Pro 14j : le trigger DB handle_new_user attribue déjà le
        // trial au signup. On appelle /api/auth/trial-start pour envoyer
        // l'email "Bienvenue + 14j Pro inclus" (fire & forget côté API,
        // mais on await pour garantir que la requête est lancée avant
        // que le navigateur change de page).
        try {
          await fetch('/api/auth/trial-start', { method: 'POST' });
        } catch {
          // Silent — ne bloque pas l'auth si l'email échoue
        }

        // Destination par défaut : /dashboard. Override via ?next=...
        const next = searchParams.get('next') || '/dashboard';
        setStatus('success');
        // Petit délai UX pour voir le "✓ Email confirmé" avant le redirect
        setTimeout(() => router.replace(next), 600);
      }
    });

    // Fallback : si après 5s pas de session, on assume que le hash était
    // invalide / expiré / déjà consommé
    timeoutId = setTimeout(async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        subscription?.unsubscribe();
        setStatus('error');
        setErrorMsg(
          'Lien expiré ou invalide. Demandez un nouveau lien depuis la page d\'inscription.'
        );
      }
    }, 5000);

    return () => {
      clearTimeout(timeoutId);
      subscription?.unsubscribe();
    };
  }, [router, searchParams]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 bg-surface-base text-content-primary">
      <div className="max-w-md w-full text-center">
        {status === 'processing' && (
          <>
            <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/30 flex items-center justify-center mb-6 animate-pulse">
              <svg viewBox="0 0 32 32" className="w-10 h-10" aria-hidden="true">
                <path d="M7 6.5 L 15.5 21" stroke="white" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                <path d="M25 6.5 L 16.5 21" stroke="white" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                <rect x="13.5" y="22" width="5" height="5" fill="white" transform="rotate(45 16 24.5)" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold mb-2">Confirmation en cours…</h1>
            <p className="text-content-secondary">
              Vérification de votre email et création de votre session.
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="mx-auto w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mb-6">
              <svg className="w-9 h-9 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold mb-2">Email confirmé !</h1>
            <p className="text-content-secondary">Redirection vers votre dashboard…</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="mx-auto w-16 h-16 rounded-2xl bg-red-500/20 border border-red-500/40 flex items-center justify-center mb-6">
              <svg className="w-9 h-9 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold mb-2">Confirmation échouée</h1>
            <p className="text-content-secondary mb-6">{errorMsg}</p>
            <Link
              href="/login"
              className="inline-block px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold transition"
            >
              Aller à la connexion
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
