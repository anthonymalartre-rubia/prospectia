import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const revalidate = 86400;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = "Étude exclusive : L'État de la Prospection B2B en France 2026 — Volia";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #08080c 0%, #1a1a2e 50%, #16162a 100%)',
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
        {/* Glow */}
        <div style={{ position: 'absolute', top: '-150px', right: '-100px', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.18) 0%, transparent 70%)' }} />
        <div style={{ position: 'absolute', bottom: '-100px', left: '-100px', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)' }} />

        {/* Top : logo + badge */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
          <div style={{ padding: '10px 18px', borderRadius: '999px', background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.4)', color: '#c4b5fd', fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', display: 'flex' }}>
            ✨ Étude exclusive
          </div>
        </div>

        {/* Middle : title + subtitle */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: '70px', fontWeight: 700, color: 'white', lineHeight: 1.05, marginBottom: '20px', display: 'flex', flexDirection: 'column' }}>
            <span>L&apos;État de la Prospection B2B</span>
            <span style={{ background: 'linear-gradient(135deg, #a78bfa 0%, #818cf8 100%)', backgroundClip: 'text', color: 'transparent', WebkitBackgroundClip: 'text' }}>en France 2026</span>
          </div>
          <div style={{ fontSize: '26px', color: '#a1a1aa', lineHeight: 1.4, maxWidth: '950px' }}>
            38 chiffres clés · Coûts réels · Performance cold email · RGPD · 14 régions · 12 secteurs
          </div>
        </div>

        {/* Bottom : stats highlights */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', gap: '24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#a78bfa' }}>4,8 M</div>
              <div style={{ fontSize: '12px', color: '#71717a', textTransform: 'uppercase', letterSpacing: '1px' }}>entreprises FR</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#a78bfa' }}>8-15 %</div>
              <div style={{ fontSize: '12px', color: '#71717a', textTransform: 'uppercase', letterSpacing: '1px' }}>reply cold email</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#a78bfa' }}>450 €</div>
              <div style={{ fontSize: '12px', color: '#71717a', textTransform: 'uppercase', letterSpacing: '1px' }}>coût / lead B2B</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#a78bfa' }}>101</div>
              <div style={{ fontSize: '12px', color: '#71717a', textTransform: 'uppercase', letterSpacing: '1px' }}>départements</div>
            </div>
          </div>
          <div style={{ fontSize: '18px', color: '#71717a' }}>volia.fr/etude</div>
        </div>
      </div>
    ),
    { ...size }
  );
}
