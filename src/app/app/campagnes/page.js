// ─────────────────────────────────────────────────────────────────────
// /app/campagnes — alias canonique du module Volia Campagnes
// ─────────────────────────────────────────────────────────────────────
//
// /app/campagnes est l'URL canonique 2026+ pour le module Volia
// Campagnes (séquences email + SMS). On redirige vers
// /admin/prospection/campaigns qui héberge actuellement le code des
// campagnes (legacy nommage : "admin/prospection" est en réalité
// le backend Campagnes).
//
// Migration progressive : à terme on déplacera le code de
// /admin/prospection/campaigns ici et on supprimera l'alias.
//
// La détection dans ModuleSwitcher.jsx reconnaît /admin/prospection/
// campaigns, /admin/prospection/sms ET /app/campagnes comme module
// "Campagnes" actif.
// ─────────────────────────────────────────────────────────────────────

import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function CampagnesAppRedirect() {
  redirect('/admin/prospection/campaigns');
}
