import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

const PRESETS = [
  {
    // 1. Facebook Blue (biru facebook)
    background: 'linear-gradient(135deg, #1877F2 0%, #0C4B9E 100%)',
    titleColor: '#FFFFFF',
    descColor: '#D1E8FF',
    accentColor: '#38BDF8',
    borderColor: 'rgba(255, 255, 255, 0.25)',
    watermarkColor: '#93C5FD',
  },
  {
    // 2. Moss Green (hijau lumut)
    background: 'linear-gradient(135deg, #4A5D4E 0%, #2F3E32 100%)',
    titleColor: '#F4F7F6',
    descColor: '#A3B899',
    accentColor: '#E5C158',
    borderColor: 'rgba(229, 193, 88, 0.25)',
    watermarkColor: '#647D6A',
  },
  {
    // 3. Metallic Purple (ungu metalik)
    background: 'linear-gradient(135deg, #7F00FF 0%, #4B0082 100%)',
    titleColor: '#FFFFFF',
    descColor: '#E9D5FF',
    accentColor: '#FCD34D',
    borderColor: 'rgba(253, 211, 77, 0.3)',
    watermarkColor: '#C4B5FD',
  },
  {
    // 4. Spotify Green (hijau spotify)
    background: 'linear-gradient(135deg, #1DB954 0%, #0F6E31 100%)',
    titleColor: '#FFFFFF',
    descColor: '#D1FAE5',
    accentColor: '#FDE68A',
    borderColor: 'rgba(255, 255, 255, 0.25)',
    watermarkColor: '#6EE7B7',
  },
  {
    // 5. Merah Spiritual (crimson red)
    background: 'linear-gradient(135deg, #DC143C 0%, #7B0019 100%)',
    titleColor: '#FFFFFF',
    descColor: '#FFD6DF',
    accentColor: '#FCD34D',
    borderColor: 'rgba(252, 211, 77, 0.3)',
    watermarkColor: '#FCA5A5',
  },
  {
    // 6. Deep Indigo (indigo gelap — sesuai brand)
    background: 'linear-gradient(135deg, #312E81 0%, #1E1B4B 100%)',
    titleColor: '#E0E7FF',
    descColor: '#C7D2FE',
    accentColor: '#A78BFA',
    borderColor: 'rgba(167, 139, 250, 0.3)',
    watermarkColor: '#818CF8',
  },
  {
    // 7. Emas Spiritual (gold spiritual)
    background: 'linear-gradient(135deg, #92400E 0%, #451A03 100%)',
    titleColor: '#FEF3C7',
    descColor: '#FDE68A',
    accentColor: '#F59E0B',
    borderColor: 'rgba(245, 158, 11, 0.35)',
    watermarkColor: '#D97706',
  },
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const title = searchParams.get('title') || 'Wawasan Spiritual';
    const description = searchParams.get('description') || 'Menelusuri cetak biru energi, chakra, dan takdir jiwa.';
    const icon = searchParams.get('icon') || '✨';
    const bgParam = searchParams.get('bg') || '1';

    let bgIndex = parseInt(bgParam, 10) - 1;
    if (isNaN(bgIndex) || bgIndex < 0 || bgIndex >= PRESETS.length) {
      bgIndex = 0; // fallback to cream
    }

    const preset = PRESETS[bgIndex];

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: preset.background,
            padding: '60px 80px',
            fontFamily: 'sans-serif',
            boxSizing: 'border-box',
          }}
        >
          {/* Main Card Frame */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              width: '100%',
              height: '100%',
              border: `2px solid ${preset.borderColor}`,
              borderRadius: '24px',
              padding: '40px 60px',
              justifyContent: 'space-between',
              boxSizing: 'border-box',
              position: 'relative',
            }}
          >
            {/* Top Row: Icon & Brand */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                width: '100%',
              }}
            >
              <div
                style={{
                  fontSize: '54px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {icon}
              </div>
              <div
                style={{
                  fontSize: '18px',
                  fontWeight: 'bold',
                  letterSpacing: '3px',
                  color: preset.accentColor,
                  textTransform: 'uppercase',
                }}
              >
                Theta Indigo
              </div>
            </div>

            {/* Middle: Content */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                marginTop: '20px',
                marginBottom: '20px',
              }}
            >
              <div
                style={{
                  fontSize: '52px',
                  fontWeight: '800',
                  color: preset.titleColor,
                  lineHeight: '1.25',
                  marginBottom: '16px',
                  display: 'block',
                  wordBreak: 'break-word',
                  maxHeight: '135px',
                  overflow: 'hidden',
                }}
              >
                {title}
              </div>
              <div
                style={{
                  fontSize: '22px',
                  fontWeight: '400',
                  color: preset.descColor,
                  lineHeight: '1.5',
                  display: 'block',
                  wordBreak: 'break-word',
                  maxHeight: '75px',
                  overflow: 'hidden',
                }}
              >
                {description}
              </div>
            </div>

            {/* Bottom Row: Footer Watermark */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderTop: `1px solid ${preset.borderColor}`,
                paddingTop: '20px',
                width: '100%',
              }}
            >
              <div
                style={{
                  fontSize: '14px',
                  color: preset.watermarkColor,
                  letterSpacing: '1px',
                }}
              >
                Spiritual AI Blueprint
              </div>
              <div
                style={{
                  fontSize: '14px',
                  color: preset.watermarkColor,
                }}
              >
                www.indigoblueprint.my.id
              </div>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error: any) {
    console.error('OG generation failed:', error);
    return new Response('Failed to generate image', { status: 500 });
  }
}
