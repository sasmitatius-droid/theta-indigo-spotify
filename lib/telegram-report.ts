export interface TelegramReportPayload {
  title: string;
  category: string;
  fbStatus: string;
  newsletterCount: number;
}

export async function sendTelegramReport(payload: TelegramReportPayload): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN || '8734226608:AAH3N4AZ2FvlRLXqBzhO1gbLZEK74W8f5Mg';
  const chatId = process.env.TELEGRAM_CHAT_ID || '-1004458367648';

  if (!token || !chatId) {
    console.warn('⚠️ Telegram configuration keys are missing.');
    return false;
  }

  const text = `
<b>✨ ARTIKEL BARU DITERBITKAN ✨</b>

<b>Judul:</b> ${payload.title}
<b>Kategori:</b> ${payload.category}
<b>Facebook Page Share:</b> ${payload.fbStatus}
<b>Newsletter Terkirim ke:</b> ${payload.newsletterCount} pengguna

<i>Dilaporkan secara otomatis oleh Theta Indigo Blueprint.</i>
`.trim();

  const url = `https://api.telegram.org/bot${token}/sendMessage`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
      }),
    });

    const data = await res.json();
    if (!res.ok || !data.ok) {
      console.error('Failed to send Telegram message:', data);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Error sending Telegram report:', error);
    return false;
  }
}
