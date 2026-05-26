// ─────────────────────────────────────────────────────────────────
// Volia CRM — helpers serveur
// Gating Business plan + utilitaires pipeline/stages/deals.
// ─────────────────────────────────────────────────────────────────

// Default pipeline stages template (créé au 1er accès /app/crm)
export const DEFAULT_PIPELINE = {
  name: 'Pipeline commercial',
  color: 'violet',
  stages: [
    { name: 'Lead', color: 'zinc', probability: 10, position: 0 },
    { name: 'Qualifié', color: 'blue', probability: 25, position: 1 },
    { name: 'Démo planifiée', color: 'indigo', probability: 50, position: 2 },
    { name: 'Proposition envoyée', color: 'violet', probability: 75, position: 3 },
    { name: 'Closé gagné', color: 'emerald', probability: 100, position: 4, closing_type: 'won' },
    { name: 'Closé perdu', color: 'rose', probability: 0, position: 5, closing_type: 'lost' },
  ],
};

// Plans autorisés à accéder au module CRM.
// Note : "enterprise" est l'alias legacy de "business" (cf. src/lib/plans.js)
export const CRM_ALLOWED_PLANS = ['business', 'enterprise'];

/**
 * Vérifie que l'utilisateur a accès au module CRM (plan Business).
 * Retourne true / false.
 */
export async function checkCrmAccess(supabase, userId) {
  if (!supabase || !userId) return false;
  const { data: profile, error } = await supabase
    .from('user_profiles')
    .select('plan')
    .eq('id', userId)
    .maybeSingle();
  if (error || !profile) return false;
  return CRM_ALLOWED_PLANS.includes(profile.plan);
}

/**
 * Récupère ou crée le pipeline par défaut pour un user.
 * Retourne le pipeline complet avec ses stages.
 */
export async function getOrCreateDefaultPipeline(supabase, userId) {
  // 1. Cherche un pipeline existant marqué is_default
  const { data: existing } = await supabase
    .from('crm_pipelines')
    .select('id, name, color, position, is_default, created_at, updated_at, stages:crm_stages(*)')
    .eq('user_id', userId)
    .eq('is_default', true)
    .maybeSingle();
  if (existing) return existing;

  // 2. Crée le pipeline
  const { data: pipeline, error: pipelineErr } = await supabase
    .from('crm_pipelines')
    .insert({
      user_id: userId,
      name: DEFAULT_PIPELINE.name,
      color: DEFAULT_PIPELINE.color,
      is_default: true,
      position: 0,
    })
    .select()
    .single();

  if (pipelineErr || !pipeline) {
    throw new Error(`Failed to create default pipeline: ${pipelineErr?.message || 'unknown'}`);
  }

  // 3. Crée les stages associés
  const stages = DEFAULT_PIPELINE.stages.map((s) => ({
    ...s,
    pipeline_id: pipeline.id,
  }));
  const { error: stagesErr } = await supabase.from('crm_stages').insert(stages);
  if (stagesErr) {
    // best-effort cleanup : on ne supprime pas le pipeline (un retry pourra réutiliser)
    throw new Error(`Failed to create default stages: ${stagesErr.message}`);
  }

  // 4. Re-fetch avec stages embarqués
  const { data: full } = await supabase
    .from('crm_pipelines')
    .select('id, name, color, position, is_default, created_at, updated_at, stages:crm_stages(*)')
    .eq('id', pipeline.id)
    .single();
  return full;
}

/**
 * Format la valeur d'un deal (cents → "1 234 €")
 */
export function formatDealValue(cents, currency = 'EUR') {
  const euros = Math.round((cents || 0) / 100);
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(euros);
}

/**
 * Calcule les stats d'un pipeline à partir d'une liste de deals.
 * Chaque deal peut avoir un `stage` joined avec `probability` pour le pipeline pondéré.
 */
export function calculatePipelineStats(deals) {
  const list = Array.isArray(deals) ? deals : [];
  const openDeals = list.filter((d) => d.status === 'open');
  const wonDeals = list.filter((d) => d.status === 'won');
  const totalOpenValue = openDeals.reduce((sum, d) => sum + (d.value_cents || 0), 0);
  const totalWonValue = wonDeals.reduce((sum, d) => sum + (d.value_cents || 0), 0);
  const weightedPipeline = openDeals.reduce(
    (sum, d) => sum + ((d.value_cents || 0) * (d.stage?.probability || 0)) / 100,
    0
  );
  return {
    openCount: openDeals.length,
    wonCount: wonDeals.length,
    totalOpenValue,
    totalWonValue,
    weightedPipeline,
  };
}
