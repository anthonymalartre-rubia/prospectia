import { ImageResponse } from 'next/og';
import { getCompetitor } from '@/lib/competitors';

export const runtime = 'edge';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({ params }) {
  const { competitor: slug } = params;
  const c = getCompetitor(slug);
  if (!c) return new ImageResponse(<div>Not found</div>);

  const savings = Math.round(((c.pricing - 49) / c.pricing) * 100);

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
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 700, color: 'white' }}>P</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px' }}>
            <span style={{ fontSize: '32px', fontWeight: 700, color: 'white' }}>Prospectia</span>
            <span style={{ fontSize: '20px', fontWeight: 600, color: '#a78bfa' }}>.cloud</span>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '950px' }}>
          <div style={{ fontSize: '20px', color: '#a78bfa', fontWeight: 600, marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '2px' }}>
            🥊 Comparatif 2026
          </div>
          <div style={{ fontSize: '72px', fontWeight: 700, color: 'white', lineHeight: 1.05, marginBottom: '24px', display: 'flex' }}>
            Prospectia <span style={{ color: '#71717a', margin: '0 16px' }}>vs</span> {c.name}
          </div>
          <div style={{ fontSize: '28px', color: '#a1a1aa', lineHeight: 1.3 }}>
            Économisez {savings}% en passant à Prospectia. 49€/mois, prospects illimités.
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ padding: '8px 16px', borderRadius: '8px', background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', color: '#22c55e', fontSize: '14px' }}>✓ {savings}% moins cher</div>
            <div style={{ padding: '8px 16px', borderRadius: '8px', background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', color: '#22c55e', fontSize: '14px' }}>✓ Recherches illimitées</div>
          </div>
          <div style={{ fontSize: '18px', color: '#71717a' }}>prospectia.cloud</div>
        </div>
      </div>
    ),
    { ...size }
  );
}
