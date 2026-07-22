import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';

// ─── Text Prep ─────────────────────────────────────────────────────────────────

/** Strip HTML tags and decode common entities. */
function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/h[1-6]>/gi, '.\n')
    .replace(/<\/li>/gi, '.\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Build the TTS narration script from article fields.
 * Keeps episode under ~8 min (~3500 words).
 */
export function prepareNarrationScript(
  title: string,
  excerpt: string,
  content: string
): string {
  const cleanContent = stripHtml(content);

  // Limit content to ~4000 chars to keep episode length manageable
  const body =
    cleanContent.length > 4000
      ? cleanContent.slice(0, 3980) + '...'
      : cleanContent;

  const lines = [
    `Theta Indigo Podcast.`,
    '',
    `${title}.`,
    '',
    excerpt ? `${excerpt}` : '',
    '',
    body,
    '',
    'Terima kasih telah mendengarkan Theta Indigo Podcast.',
    'Temukan lebih banyak wawasan spiritual di website kami: theta-indigo-blueprint.vercel.app',
  ];

  return lines.filter((l) => l !== undefined).join('\n').trim();
}

// ─── Duration Helpers ──────────────────────────────────────────────────────────

/**
 * Estimate duration in seconds based on Indonesian speaking pace (~130 wpm).
 */
export function estimateDurationSec(text: string): number {
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  return Math.max(30, Math.ceil((wordCount / 130) * 60));
}

/** Format seconds as HH:MM:SS or MM:SS. */
export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${m}:${ss}`;
}

// ─── TTS Engine ────────────────────────────────────────────────────────────────

export interface TtsResult {
  buffer: Buffer;
  durationSec: number;
  script: string;
}

/**
 * Primary voice: id-ID-ArdiNeural (male, Indonesian).
 * Fallback voice: id-ID-GadisNeural (female, Indonesian).
 */
const VOICES = ['id-ID-ArdiNeural', 'id-ID-GadisNeural'] as const;

async function ttsWithVoice(text: string, voice: string): Promise<Buffer> {
  const tts = new MsEdgeTTS();
  await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);

  // Split text into chunks ≤ 3000 chars (Edge TTS limit per request)
  const CHUNK_SIZE = 2800;
  const chunks: string[] = [];
  let pos = 0;
  while (pos < text.length) {
    // Try to break at sentence boundary
    let end = Math.min(pos + CHUNK_SIZE, text.length);
    if (end < text.length) {
      const lastPeriod = text.lastIndexOf('.', end);
      if (lastPeriod > pos + 500) end = lastPeriod + 1;
    }
    chunks.push(text.slice(pos, end).trim());
    pos = end;
  }

  const buffers: Buffer[] = [];
  for (const chunk of chunks) {
    if (!chunk) continue;
    const { audioBuffer } = await tts.toBuffer(chunk);
    if (audioBuffer && audioBuffer.length > 100) {
      buffers.push(audioBuffer);
    }
  }

  if (buffers.length === 0) {
    throw new Error('Edge TTS returned empty audio for all chunks');
  }

  return Buffer.concat(buffers);
}

/**
 * Convert article text to an MP3 buffer using Microsoft Edge TTS.
 * Tries primary voice first, then falls back to secondary voice.
 */
export async function textToMp3(
  title: string,
  excerpt: string,
  content: string
): Promise<TtsResult> {
  const script = prepareNarrationScript(title, excerpt, content);
  const durationSec = estimateDurationSec(script);

  let lastErr: unknown;

  for (const voice of VOICES) {
    try {
      console.log(`🔊 TTS attempt with voice: ${voice}`);
      const buffer = await ttsWithVoice(script, voice);

      if (buffer.length < 1000) {
        throw new Error(`Audio buffer too small (${buffer.length} bytes), likely empty`);
      }

      console.log(
        `✅ TTS success: ${(buffer.length / 1024).toFixed(0)} KB, ` +
        `~${formatDuration(durationSec)} (voice: ${voice})`
      );

      return { buffer, durationSec, script };
    } catch (err) {
      lastErr = err;
      console.warn(`⚠️  Voice ${voice} failed:`, (err as Error).message);
    }
  }

  throw new Error(`All TTS voices failed. Last error: ${(lastErr as Error)?.message}`);
}
