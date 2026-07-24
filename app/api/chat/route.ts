import { NextResponse } from 'next/server';
import { queryD1, executeD1 } from '@/lib/cloudflare-db';
import { getCachedResponse, setCachedResponse } from '@/lib/chatbot-cache';

export const dynamic = 'force-dynamic';

const GUEST_LIMIT = 5;   // pesan/jam untuk guest
const USER_LIMIT = 20;   // pesan/jam untuk user login
const WINDOW_MS = 60 * 60 * 1000; // 1 jam
const MAX_TOKENS = 350;  // hemat kuota Groq

function getSystemPrompt() {
  const today = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Asia/Jakarta',
  });

  return `Kamu adalah Theta AI, asisten spiritual bijaksana dari platform Theta Indigo Blueprint. Kamu menguasai kearifan spiritual Jawa (Wuku, Weton, Pranata Mangsa), Bazi, Numerologi, Human Design, Chakra, dan Fengshui.
Hari ini adalah: ${today}.

Karakter & Aturan Jawaban:
- Bijaksana, hangat, penuh kasih sayang
- Berbicara dengan bahasa Indonesia yang indah dan puitis namun mudah dipahami
- Memberikan wawasan spiritual yang mendalam namun praktis
- Menghindari ramalan pasti; selalu menekankan bahwa manusia adalah penentu takdirnya sendiri
- Menjawab singkat dan padat (max 3 paragraf) agar hemat token
- PENTING (LINK FITUR & ARTIKEL): Jika pengguna bertanya tentang artikel, blog, ensiklopedia, atau fitur aplikasi, SELALU berikan link Markdown tepat yang dapat diklik oleh pengguna.
  Berikut daftar rujukan link internal platform:
  - Kalender Jawa / Weton / Wuku / Pranata Mangsa: [Kalender Weton & Wuku](/kalender)
  - Artikel, Berita Terbaru & Ensiklopedia Spiritual: [Ensiklopedia & Artikel Terbaru](/blog)
  - Analisis & Perhitungan Bazi: [Perhitungan Bazi](/bazi)
  - Analisis & Kalkulator Numerologi: [Kalkulator Numerologi](/numerologi)
  - Human Design Blueprint: [Human Design Chart](/human-design)
  - Reading / Konsultasi & Laporan Personal: [Konsultasi Spiritual](/reading)

Jika pertanyaan di luar topik spiritual, arahkan kembali dengan lembut.`;
}

async function getRateLimit(sessionId: string, userId: string | null): Promise<{ allowed: boolean; remaining: number }> {
  const limit = userId ? USER_LIMIT : GUEST_LIMIT;
  const now = new Date();

  try {
    const rows = await queryD1<{ message_count: number; window_start: string }>(
      'SELECT message_count, window_start FROM chat_sessions WHERE session_id = ?',
      [sessionId]
    );

    if (rows.length === 0) {
      await executeD1(
        'INSERT INTO chat_sessions (session_id, user_id, message_count, window_start) VALUES (?, ?, 1, ?)',
        [sessionId, userId || null, now.toISOString()]
      );
      return { allowed: true, remaining: limit - 1 };
    }

    const session = rows[0];
    const windowStart = new Date(session.window_start);
    const elapsed = now.getTime() - windowStart.getTime();

    if (elapsed > WINDOW_MS) {
      // Reset window
      await executeD1(
        'UPDATE chat_sessions SET message_count = 1, window_start = ? WHERE session_id = ?',
        [now.toISOString(), sessionId]
      );
      return { allowed: true, remaining: limit - 1 };
    }

    if (session.message_count >= limit) {
      return { allowed: false, remaining: 0 };
    }

    await executeD1(
      'UPDATE chat_sessions SET message_count = message_count + 1 WHERE session_id = ?',
      [sessionId]
    );
    return { allowed: true, remaining: limit - session.message_count - 1 };
  } catch {
    return { allowed: true, remaining: limit };
  }
}

export async function POST(request: Request) {
  try {
    const { message, history = [], sessionId, userId } = await request.json();

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json({ error: 'Pesan tidak boleh kosong.' }, { status: 400 });
    }

    if (message.length > 500) {
      return NextResponse.json({ error: 'Pesan terlalu panjang (max 500 karakter).' }, { status: 400 });
    }

    // Rate limit check
    const sid = sessionId || `ip_${request.headers.get('x-forwarded-for') || 'unknown'}`;
    const { allowed, remaining } = await getRateLimit(sid, userId || null);

    if (!allowed) {
      return NextResponse.json({
        error: 'Batas pesan tercapai. Silakan coba lagi dalam 1 jam.',
        rateLimited: true,
      }, { status: 429 });
    }

    const trimmedMessage = message.trim();

    // Check R2 JSON Cache first (skips AI if cached and not bypassed)
    const cachedResponse = await getCachedResponse(trimmedMessage);
    if (cachedResponse && cachedResponse.reply) {
      return NextResponse.json({
        reply: cachedResponse.reply,
        remaining,
        cached: true,
      });
    }

    // Build messages for API
    const messages = [
      { role: 'system', content: getSystemPrompt() },
      ...history.slice(-8).map((h: { role: string; content: string }) => ({
        role: h.role,
        content: h.content.slice(0, 300), // limit history length
      })),
      { role: 'user', content: trimmedMessage },
    ];

    // Try Groq first
    const groqKey = process.env.GROQ_API_KEY;
    const groqBackup = process.env.GROQ_API_KEY_BACKUP;
    const openrouterKey = process.env.OPENROUTER_API_KEY;

    let reply = '';

    for (const key of [groqKey, groqBackup].filter(Boolean)) {
      try {
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages,
            max_tokens: MAX_TOKENS,
            temperature: 0.7,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          reply = data.choices?.[0]?.message?.content || '';
          if (reply) break;
        }
      } catch { /* try next */ }
    }

    // Fallback to OpenRouter
    if (!reply && openrouterKey) {
      try {
        const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${openrouterKey}`,
            'HTTP-Referer': 'https://www.indigoblueprint.my.id',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages,
            max_tokens: MAX_TOKENS,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          reply = data.choices?.[0]?.message?.content || '';
        }
      } catch { /* ignore */ }
    }

    if (!reply) {
      return NextResponse.json({ error: 'Theta AI sedang istirahat. Coba lagi sebentar.' }, { status: 503 });
    }

    // Save response to R2 JSON cache (non-blocking)
    setCachedResponse(trimmedMessage, reply).catch((err) =>
      console.warn('[ChatRoute] Failed to save R2 cache:', err)
    );

    return NextResponse.json({ reply, remaining, cached: false });
  } catch (err: any) {
    console.error('Chat API error:', err);
    return NextResponse.json({ error: 'Terjadi kesalahan internal.' }, { status: 500 });
  }
}

