import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Volia.fr — Trouvez l\'email de n\'importe quelle entreprise en France';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #08080c 0%, #1a1a2e 50%, #16162a 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, sans-serif',
          position: 'relative',
        }}
      >
        {/* Background gradient circles */}
        <div
          style={{
            position: 'absolute',
            top: '-100px',
            right: '-100px',
            width: '500px',
            height: '500px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-150px',
            left: '-50px',
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)',
          }}
        />

        {/* Logo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '40px',
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="38" height="38" viewBox="0 0 32 32" style={{ display: 'block' }}>
              <path d="M7 6.5 L 15.5 21" stroke="white" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              <path d="M25 6.5 L 16.5 21" stroke="white" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              <rect x="13.5" y="22" width="5" height="5" fill="white" transform="rotate(45 16 24.5)" />
            </svg>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
            <span style={{ fontSize: '36px', fontWeight: 700, color: 'white' }}>
              Volia
            </span>
            <span style={{ fontSize: '24px', fontWeight: 600, color: '#a78bfa' }}>
              .fr
            </span>
          </div>
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: '48px',
            fontWeight: 700,
            color: 'white',
            textAlign: 'center',
            lineHeight: 1.2,
            maxWidth: '900px',
            marginBottom: '24px',
          }}
        >
          Trouvez l&apos;email de n&apos;importe quelle entreprise en France
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: '22px',
            color: '#a1a1aa',
            textAlign: 'center',
            maxWidth: '700px',
            lineHeight: 1.5,
            marginBottom: '40px',
          }}
        >
          Scraping intelligent + recherche Google. 150+ categories, 101 departements.
        </div>

        {/* Stats badges */}
        <div style={{ display: 'flex', gap: '16px' }}>
          {[
            { label: 'Scraping web', color: '#22c55e' },
            { label: 'Recherche Google', color: '#eab308' },
            { label: 'Scoring IA', color: '#a78bfa' },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.05)',
              }}
            >
              <div
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: item.color,
                }}
              />
              <span style={{ fontSize: '16px', color: '#d4d4d8' }}>
                {item.label}
              </span>
            </div>
          ))}
        </div>

        {/* Price */}
        <div
          style={{
            position: 'absolute',
            bottom: '40px',
            fontSize: '18px',
            color: '#a78bfa',
            fontWeight: 600,
          }}
        >
          A partir de 19 €/mois — le moins cher du marche francais
        </div>
      </div>
    ),
    { ...size }
  );
}
