// ─────────────────────────────────────────────────────────────────────
// /app/prospection — alias canonique du dashboard Prospection
// ─────────────────────────────────────────────────────────────────────
//
// /app/prospection est l'URL canonique 2026+ pour le module Volia
// Prospection. On redirige vers /dashboard (qui héberge le vrai code
// Prospection actuel) pour préserver les bookmarks, l'historique
// navigateur et les liens existants pendant la migration.
//
// Migration progressive prévue : on déplacera à terme le code de
// /dashboard ici, et /dashboard deviendra à son tour un alias.
//
// La détection du module actif dans ModuleSwitcher.jsx reconnaît les
// deux URLs (/dashboard ET /app/prospection) comme "Prospection".
// ─────────────────────────────────────────────────────────────────────

import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function ProspectionAppRedirect() {
  redirect('/dashboard');
}
