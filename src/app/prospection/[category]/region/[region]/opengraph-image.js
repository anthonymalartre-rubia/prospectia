import { ImageResponse } from 'next/og';
import { getCategoryBySlug, getRegionBySlug } from '@/lib/slugs';

export const runtime = 'edge';
export const revalidate = 86400;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({ params }) {
  const { category: catSlug, region: regionSlug } = params;
  const cat = getCategoryBySlug(catSlug);
  const region = getRegionBySlug(regionSlug);

  const title = cat ? `Email des ${cat.labelPlural}` : 'Prospection B2B';
  const subtitle = region ? region.name : 'France';
  const deptsCount = region ? region.depts.length : 0;

  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #08080c 0%, #1a1a2e 60%, #16162a 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '60px',
          fontFamily: 'system-ui, sans-serif',
          position: 'relative',
        }}
      >
        <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)' }} />

        {/* Header */}
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

        {/* Main */}
        <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '900px' }}>
          <div style={{ fontSize: '20px', color: '#a78bfa', fontWeight: 600, marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '2px' }}>
            🗺️ Région {subtitle}
          </div>
          <div style={{ fontSize: '64px', fontWeight: 700, color: 'white', lineHeight: 1.1, marginBottom: '24px' }}>
            {title}
          </div>
          <div style={{ fontSize: '24px', color: '#a1a1aa', lineHeight: 1.4 }}>
            {deptsCount} départements couverts. Scraping intelligent + recherche Google.
          </div>
        </div>

        {/* Bottom */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ padding: '8px 16px', borderRadius: '8px', background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', color: '#22c55e', fontSize: '14px' }}>
              ✓ {deptsCount} départements
            </div>
            <div style={{ padding: '8px 16px', borderRadius: '8px', background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', color: '#a78bfa', fontSize: '14px' }}>
              💶 À partir de 19 €/mois
            </div>
          </div>
          <div style={{ fontSize: '18px', color: '#71717a' }}>volia.fr</div>
        </div>
      </div>
    ),
    { ...size }
  );
}
