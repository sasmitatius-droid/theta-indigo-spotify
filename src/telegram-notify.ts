// ─── Config ────────────────────────────────────────────────────────────────────

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const CHAT_ID   = process.env.TELEGRAM_CHAT_ID   || '';

const R2_PUBLIC_URL = (
  process.env.R2_PUBLIC_URL ||
  'https://pub-3dfac1ebd38a458faff5626cae902ad2.r2.dev'
).replace(/\/$/, '');

const RSS_FEED_URL = `${R2_PUBLIC_URL}/podcast/feed.xml`;

// ─── Helpers ───────────────────────────────────────────────────────────────────

function nowWib(): string {
  return new Date().toLocaleString('id-ID', {
    timeZone: 'Asia/Jakarta',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

async function sendMessage(text: string): Promise<void> {
  if (!BOT_TOKEN || !CHAT_ID) {
    console.warn('⚠️  Telegram not configured — skipping notification.');
    return;
  }

  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });

    const json = (await res.json()) as { ok: boolean; description?: string };

    if (!json.ok) {
      console.error('❌ Telegram API error:', json.description);
    } else {
      console.log('✅ Telegram notification sent');
    }
  } catch (err) {
    console.error('❌ Failed to send Telegram message:', (err as Error).message);
  }
}

// ─── Public API ────────────────────────────────────────────────────────────────

export interface SuccessPayload {
  episodeTitle: string;
  category: string;
  durationFormatted: string;
  mp3SizeKb: number;
  episodeId: string;
  runCount?: number;
}

export async function notifySuccess(payload: SuccessPayload): Promise<void> {
  const text =
`🎙️ <b>PODCAST BARU DITERBITKAN</b> ✅

📌 <b>Judul:</b> ${payload.episodeTitle}
📂 <b>Kategori:</b> ${payload.category}
🕒 <b>Durasi:</b> ${payload.durationFormatted}
📦 <b>Ukuran MP3:</b> ${payload.mp3SizeKb} KB
🆔 <b>Episode ID:</b> <code>${payload.episodeId}</code>
${payload.runCount !== undefined ? `🔢 <b>Total Run:</b> #${payload.runCount}` : ''}

📡 <b>RSS Feed Spotify:</b>
<code>${RSS_FEED_URL}</code>

⏰ <i>${nowWib()} WIB</i>
🤖 <i>Theta Indigo Spotify Bot</i>`;

  await sendMessage(text);
}

export async function notifyFailure(
  error: string,
  category: string
): Promise<void> {
  // Truncate very long errors
  const errTxt = error.length > 600 ? error.slice(0, 600) + '…' : error;

  const text =
`❌ <b>PODCAST GAGAL DIGENERATE</b>

🔴 <b>Error:</b>
<code>${errTxt}</code>

📂 <b>Kategori Dicoba:</b> ${category}

⏰ <i>${nowWib()} WIB</i>
🤖 <i>Theta Indigo Spotify Bot</i>`;

  await sendMessage(text);
}
