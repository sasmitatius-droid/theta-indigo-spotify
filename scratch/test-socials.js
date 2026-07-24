const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach((line) => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.substring(1, value.length - 1);
      } else if (value.startsWith("'") && value.endsWith("'")) {
        value = value.substring(1, value.length - 1);
      }
      process.env[key] = value.trim();
    }
  });
}

const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
const telegramChatId = process.env.TELEGRAM_CHAT_ID;
const fbPageId = process.env.FACEBOOK_PAGE_ID;
const fbAccessToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;

console.log('--- KREDENSIAL AKTIF ---');
console.log('Telegram Token:', telegramToken ? `${telegramToken.slice(0, 10)}...` : 'KOSONG');
console.log('Telegram Chat ID:', telegramChatId);
console.log('FB Page ID:', fbPageId);
console.log('FB Access Token:', fbAccessToken ? `${fbAccessToken.slice(0, 15)}...` : 'KOSONG');
console.log('------------------------\n');

async function testTelegram() {
  console.log('Menguji Telegram Notification...');
  if (!telegramToken || !telegramChatId) {
    console.error('Kredensial Telegram tidak lengkap di .env.local');
    return false;
  }

  const text = `
<b>🔔 UJI COBA NOTIFIKASI TELEGRAM 🔔</b>

Uji coba integrasi bot Telegram dari <b>Theta Indigo Blueprint</b> berhasil disimulasikan secara langsung.

<i>Waktu: ${new Date().toLocaleString('id-ID')}</i>
`.trim();

  const url = `https://api.telegram.org/bot${telegramToken}/sendMessage`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: telegramChatId,
        text,
        parse_mode: 'HTML',
      }),
    });
    const data = await res.json();
    if (res.ok && data.ok) {
      console.log('✅ Uji coba Telegram sukses! Pesan terkirim.');
      return true;
    } else {
      console.error('❌ Uji coba Telegram gagal:', data);
      return false;
    }
  } catch (err) {
    console.error('❌ Terjadi error pada Telegram:', err.message);
    return false;
  }
}

async function testFacebook() {
  console.log('\nMenguji Facebook Page Share...');
  if (!fbPageId || !fbAccessToken) {
    console.error('Kredensial Facebook tidak lengkap di .env.local');
    return false;
  }

  const title = 'Uji Coba Integrasi Facebook';
  const excerpt = 'Ini adalah pesan uji coba terautomasi dari sistem integrasi Theta Indigo Blueprint.';
  const testArticleUrl = 'https://theta-indigo-blueprint.vercel.app/blog';
  const testBannerUrl = 'https://theta-indigo-blueprint.vercel.app/logo.png';

  const message = `${title}\n\n${excerpt}\n\nBaca selengkapnya di: ${testArticleUrl}`;
  const photoUrl = `https://graph.facebook.com/v19.0/${fbPageId}/photos`;

  try {
    const res = await fetch(photoUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: testBannerUrl,
        caption: message,
        access_token: fbAccessToken,
      }),
    });
    const data = await res.json();
    if (res.ok && (data.id || data.post_id)) {
      console.log('✅ Uji coba Facebook Share sukses! Postingan foto terbit di halaman.');
      return true;
    }

    console.warn('Facebook photo share gagal, mencoba fallback link post. Detail error:', data);

    const feedUrl = `https://graph.facebook.com/v19.0/${fbPageId}/feed`;
    const fallbackRes = await fetch(feedUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: `${title}\n\n${excerpt}`,
        link: testArticleUrl,
        access_token: fbAccessToken,
      }),
    });
    const fallbackData = await fallbackRes.json();
    if (fallbackRes.ok && fallbackData.id) {
      console.log('✅ Uji coba Facebook Share sukses! Postingan link terbit di halaman.');
      return true;
    }

    console.error('❌ Uji coba Facebook Share gagal total:', fallbackData);
    return false;
  } catch (err) {
    console.error('❌ Terjadi error pada Facebook:', err.message);
    return false;
  }
}

async function main() {
  const tgOk = await testTelegram();
  const fbOk = await testFacebook();
  console.log('\n--- RINGKASAN UJI COBA ---');
  console.log('Telegram:', tgOk ? 'SUKSES' : 'GAGAL');
  console.log('Facebook:', fbOk ? 'SUKSES' : 'GAGAL');
}

main();
