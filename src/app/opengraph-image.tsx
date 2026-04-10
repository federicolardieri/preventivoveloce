import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'Preventivo Veloce — Generatore di Preventivi con AI';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background:
            'radial-gradient(ellipse at 30% 20%, rgba(124, 58, 237, 0.35) 0%, transparent 55%), radial-gradient(ellipse at 75% 80%, rgba(16, 185, 129, 0.18) 0%, transparent 55%), #0a0a0f',
          padding: '80px',
          position: 'relative',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Dot grid decorativo */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'radial-gradient(rgba(255,255,255,0.04) 1.5px, transparent 1.5px)',
            backgroundSize: '32px 32px',
            display: 'flex',
          }}
        />

        {/* Badge in alto */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            background: 'rgba(124, 58, 237, 0.15)',
            border: '1px solid rgba(124, 58, 237, 0.4)',
            borderRadius: 999,
            padding: '12px 24px',
            width: 'fit-content',
            zIndex: 1,
          }}
        >
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: 999,
              background: '#10b981',
              boxShadow: '0 0 16px #10b981',
            }}
          />
          <span
            style={{
              color: '#c4b5fd',
              fontSize: 22,
              fontWeight: 600,
              letterSpacing: '-0.01em',
            }}
          >
            Generatore di preventivi con AI
          </span>
        </div>

        {/* Titolo principale */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            marginTop: 'auto',
            zIndex: 1,
          }}
        >
          <h1
            style={{
              fontSize: 104,
              fontWeight: 900,
              letterSpacing: '-0.035em',
              lineHeight: 1,
              color: '#ffffff',
              margin: 0,
              display: 'flex',
              flexWrap: 'wrap',
            }}
          >
            Preventivi in{' '}
            <span
              style={{
                background: 'linear-gradient(120deg, #a78bfa 0%, #10b981 100%)',
                backgroundClip: 'text',
                color: 'transparent',
                marginLeft: 20,
              }}
            >
              20 secondi
            </span>
          </h1>
          <p
            style={{
              fontSize: 34,
              color: 'rgba(255,255,255,0.55)',
              marginTop: 28,
              marginBottom: 0,
              letterSpacing: '-0.015em',
              fontWeight: 500,
              lineHeight: 1.3,
            }}
          >
            PDF professionali, IVA automatica, 8 template premium.
          </p>
        </div>

        {/* Footer con brand */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 54,
            paddingTop: 32,
            borderTop: '1px solid rgba(255,255,255,0.08)',
            zIndex: 1,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 56,
                height: 56,
                borderRadius: 14,
                background: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)',
                boxShadow: '0 8px 24px rgba(124, 58, 237, 0.4)',
              }}
            >
              <span
                style={{
                  fontSize: 32,
                  fontWeight: 900,
                  color: '#ffffff',
                }}
              >
                P
              </span>
            </div>
            <span
              style={{
                fontSize: 32,
                fontWeight: 800,
                color: '#ffffff',
                letterSpacing: '-0.02em',
              }}
            >
              Preventivo Veloce
            </span>
          </div>
          <span
            style={{
              fontSize: 22,
              color: 'rgba(255,255,255,0.4)',
              fontWeight: 500,
            }}
          >
            ilpreventivoveloce.it
          </span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
