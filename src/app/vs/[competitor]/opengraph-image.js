import { ImageResponse } from 'next/og';
import { getCompetitor } from '@/lib/competitors';

export const runtime = 'edge';
// Cache 24h (P1 perf) : sans ça chaque hit crawler/social recompute l'image
// (~200ms edge + facture Vercel). Désormais 1 compute / image / jour.
export const revalidate = 86400;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({ params }) {
  const { competitor: slug } = params;
  const c = getCompetitor(slug);
  if (!c) return new ImageResponse(<div>Not found</div>);

  const savings = Math.max(0, Math.round(((c.pricing - 19) / c.pricing) * 100));

  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #08080c 0%, #1a1a2e 60%, #16162a 100%)',
          width: '100%', height: '100%',
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          padding: '60px', fontFamily: 'system-ui, sans-serif', position: 'relative',
        }}
      >
        <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="32" height="32" viewBox="0 0 32 32" style={{ display: 'block' }}>
              <path d="M7 6.5 L 15.5 21" stroke="white" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              <path d="M25 6.5 L 16.5 21" stroke="white" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              <rect x="13.5" y="22" width="5" height="5" fill="white" transform="rotate(45 16 24.5)" />
            </svg>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px' }}>
            <span style={{ fontSize: '32px', fontWeight: 700, color: 'white' }}>Volia</span>
            <span style={{ fontSize: '20px', fontWeight: 600, color: '#a78bfa' }}>.fr</span>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '950px' }}>
          <div style={{ fontSize: '20px', color: '#a78bfa', fontWeight: 600, marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '2px' }}>
            🥊 Comparatif 2026
          </div>
          <div style={{ fontSize: '72px', fontWeight: 700, color: 'white', lineHeight: 1.05, marginBottom: '24px', display: 'flex' }}>
            Volia <span style={{ color: '#71717a', margin: '0 16px' }}>vs</span> {c.name}
          </div>
          <div style={{ fontSize: '28px', color: '#a1a1aa', lineHeight: 1.3 }}>
            Économisez jusqu'à {savings}% en passant à Volia. À partir de 19 €/mois — le moins cher du marché français.
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ padding: '8px 16px', borderRadius: '8px', background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', color: '#22c55e', fontSize: '14px' }}>✓ {savings}% moins cher</div>
            <div style={{ padding: '8px 16px', borderRadius: '8px', background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', color: '#22c55e', fontSize: '14px' }}>✓ Conforme RGPD</div>
          </div>
          <div style={{ fontSize: '18px', color: '#71717a' }}>volia.fr</div>
        </div>
      </div>
    ),
    { ...size }
  );
}
