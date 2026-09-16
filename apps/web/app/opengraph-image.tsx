import { ImageResponse } from 'next/og';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const PRIMARY = '#5b8bd2';
const BACKGROUND = '#0a0a0a';

export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '64px 72px',
        background: BACKGROUND,
        backgroundImage: `radial-gradient(circle at 12% 8%, rgba(91,139,210,0.22), transparent 55%)`,
        border: '1px solid rgba(255,255,255,0.08)',
        fontFamily: 'sans-serif',
        position: 'relative',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <svg width={72} height={72} viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
          <path
            d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"
            stroke={PRIMARY}
            strokeWidth={1.6}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <div style={{ display: 'flex', color: '#ffffff', fontSize: 68, fontWeight: 700 }}>
          NSFW Protect
        </div>
      </div>

      <div style={{ display: 'flex', color: '#a1a1aa', fontSize: 30, marginTop: 28 }}>
        AI-powered content moderation for developers
      </div>

      <div
        style={{
          display: 'flex',
          color: PRIMARY,
          fontSize: 22,
          fontWeight: 700,
          letterSpacing: 4,
          marginTop: 22,
        }}
      >
        SECURE · PRIVATE · REAL-TIME
      </div>

      <div
        style={{
          display: 'flex',
          position: 'absolute',
          right: 72,
          bottom: 48,
          color: '#71717a',
          fontSize: 24,
        }}
      >
        nsfw-protect.com
      </div>
    </div>,
    { ...size },
  );
}
