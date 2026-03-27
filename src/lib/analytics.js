// src/lib/analytics.js

export function computeAnalytics(prospects, searchHistory) {
  const now = new Date();
  const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

  const recent30 = prospects.filter(p => new Date(p.created_at) >= thirtyDaysAgo);
  const recent7 = prospects.filter(p => new Date(p.created_at) >= sevenDaysAgo);

  // Enrichment rate
  const withEmail = prospects.filter(p => p.email);
  const enrichmentRate = prospects.length > 0
    ? Math.round((withEmail.length / prospects.length) * 100)
    : 0;

  // By department
  const byDept = {};
  prospects.forEach(p => {
    byDept[p.departement] = (byDept[p.departement] || 0) + 1;
  });

  // By email method
  const byMethod = {};
  withEmail.forEach(p => {
    byMethod[p.email_method] = (byMethod[p.email_method] || 0) + 1;
  });

  // By type
  const byType = { b2b: 0, copro: 0, custom: 0 };
  prospects.forEach(p => {
    if (p.type) byType[p.type] = (byType[p.type] || 0) + 1;
  });

  // Weekly trend (last 4 weeks)
  const weeklyTrend = [];
  for (let i = 3; i >= 0; i--) {
    const start = new Date(now - (i + 1) * 7 * 24 * 60 * 60 * 1000);
    const end = new Date(now - i * 7 * 24 * 60 * 60 * 1000);
    const count = prospects.filter(p => {
      const d = new Date(p.created_at);
      return d >= start && d < end;
    }).length;
    weeklyTrend.push({
      label: `S-${i}`,
      count,
    });
  }

  // Score distribution
  const scoreDistribution = { excellent: 0, bon: 0, moyen: 0, faible: 0 };
  prospects.forEach(p => {
    const score = p.lead_score || 0;
    if (score >= 80) scoreDistribution.excellent++;
    else if (score >= 60) scoreDistribution.bon++;
    else if (score >= 40) scoreDistribution.moyen++;
    else scoreDistribution.faible++;
  });

  return {
    total: prospects.length,
    recent30: recent30.length,
    recent7: recent7.length,
    withEmail: withEmail.length,
    enrichmentRate,
    byDept,
    byMethod,
    byType,
    weeklyTrend,
    scoreDistribution,
    searchCount: searchHistory?.length || 0,
  };
}
