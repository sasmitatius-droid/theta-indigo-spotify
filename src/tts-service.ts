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
  content: string,
  lang: 'id' | 'en' = 'id'
): string {
  const cleanContent = stripHtml(content);

  const body =
    cleanContent.length > 4000
      ? cleanContent.slice(0, 3980) + '...'
      : cleanContent;

  const lines =
    lang === 'en'
      ? [
          'Theta Indigo Podcast.',
          '',
          `${title}.`,
          '',
          excerpt ? `${excerpt}` : '',
          '',
          body,
          '',
          'Thank you for listening to Theta Indigo Podcast.',
          'Discover more spiritual insights at theta-indigo-blueprint.vercel.app',
        ]
      : [
          'Theta Indigo Podcast.',
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

export function estimateDurationSec(text: string): number {
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  return Math.max(30, Math.ceil((wordCount / 130) * 60));
}

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

const VOICES_ID = ['id-ID-ArdiNeural', 'id-ID-GadisNeural'] as const;
const VOICES_EN = ['en-US-AnaNeural', 'en-US-JennyNeural', 'en-US-GuyNeural'] as const;

function streamToBuffer(readable: import('stream').Readable): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    readable.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    const done = () => resolve(Buffer.concat(chunks));
    readable.once('end', done);
    readable.once('close', done);
    readable.on('error', (err) => reject(err));
  });
}

async function ttsWithVoice(text: string, voice: string): Promise<Buffer> {
  const tts = new MsEdgeTTS();
  await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);

  const CHUNK_SIZE = 2800;
  const chunks: string[] = [];
  let pos = 0;
  while (pos < text.length) {
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
    const readable = tts.toStream(chunk);
    const audioBuffer = await streamToBuffer(readable);
    if (audioBuffer && audioBuffer.length > 100) {
      buffers.push(audioBuffer);
    }
  }

  try {
    tts.close();
  } catch {}

  if (buffers.length === 0) {
    throw new Error('Edge TTS returned empty audio for all chunks');
  }

  return Buffer.concat(buffers);
}

import * as googleTTS from 'google-tts-api';

async function ttsWithGoogle(text: string, lang: 'id' | 'en' = 'id'): Promise<Buffer> {
  const base64List = await googleTTS.getAllAudioBase64(text, {
    lang,
    slow: false,
    host: 'https://translate.google.com',
    timeout: 15000,
    splitPunct: '.,!?',
  });

  const buffers = base64List.map((item) => Buffer.from(item.base64, 'base64'));
  return Buffer.concat(buffers);
}

export async function textToMp3(
  title: string,
  excerpt: string,
  content: string,
  lang: 'id' | 'en' = 'id'
): Promise<TtsResult> {
  const script = prepareNarrationScript(title, excerpt, content, lang);
  const durationSec = estimateDurationSec(script);

  let lastErr: unknown;
  const voices = lang === 'en' ? VOICES_EN : VOICES_ID;

  for (const voice of voices) {
    try {
      console.log(`🔊 TTS attempt with Edge TTS voice (${lang}): ${voice}`);
      const buffer = await ttsWithVoice(script, voice);

      if (buffer.length < 1000) {
        throw new Error(`Audio buffer too small (${buffer.length} bytes)`);
      }

      console.log(
        `✅ TTS success (Edge TTS ${voice}): ${(buffer.length / 1024).toFixed(0)} KB, ` +
        `~${formatDuration(durationSec)}`
      );

      return { buffer, durationSec, script };
    } catch (err) {
      lastErr = err;
      const errMsg = typeof err === 'object' ? JSON.stringify(err) : String(err);
      console.warn(`⚠️ Edge TTS voice ${voice} failed: ${errMsg}`);
    }
  }

  try {
    console.log(`🔊 Fallback attempt with Google TTS (${lang})...`);
    const buffer = await ttsWithGoogle(script, lang);

    if (buffer.length < 1000) {
      throw new Error(`Google TTS audio buffer too small (${buffer.length} bytes)`);
    }

    console.log(
      `✅ TTS success (Google TTS ${lang}): ${(buffer.length / 1024).toFixed(0)} KB, ` +
      `~${formatDuration(durationSec)}`
    );

    return { buffer, durationSec, script };
  } catch (gErr) {
    console.warn(`⚠️ Google TTS failed:`, (gErr as Error)?.message || gErr);
  }

  const finalErr = typeof lastErr === 'object' ? JSON.stringify(lastErr) : String(lastErr);
  throw new Error(`All TTS engines failed. Last error: ${finalErr}`);
}
