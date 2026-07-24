/**
 * Script Otomatisasi Video YouTube & Facebook untuk Theta Indigo Blueprint
 * - Mengambil artikel dari Cloudflare D1
 * - Menggunakan TTS Engine Podcast (MsEdgeTTS id-ID-ArdiNeural / GadisNeural + fallback google-tts)
 * - Membaca KESELURUHAN isi artikel (hingga 4000 karakter, durasi 3-8 menit)
 * - Mengunduh Gambar Banner Artikel Resmi (bannerR2Url / API generate-image)
 * - Menggabungkan suara TTS dengan musik latar meditasi (public/meditation.mp3)
 * - Merender Video MP4 (1080p) via FFmpeg
 * - Mengunggah ke Cloudflare R2 untuk transit
 * - Mengunggah ke YouTube Data API v3 (OAuth2)
 * - Membagikan Video YouTube ke Facebook Page
 * - Menghapus video dari R2 secara otomatis setelah berhasil terunggah
 * - Mengirimkan laporan ke Telegram Chat ID
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const { google } = require('googleapis');
const { MsEdgeTTS, OUTPUT_FORMAT } = require('msedge-tts');
const googleTTS = require('google-tts-api');

// --- Konfigurasi Environment ---
const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const CLOUDFLARE_D1_DATABASE_ID = process.env.CLOUDFLARE_D1_DATABASE_ID;
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'theta-indigo';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

const YOUTUBE_CLIENT_ID = process.env.YOUTUBE_CLIENT_ID;
const YOUTUBE_CLIENT_SECRET = process.env.YOUTUBE_CLIENT_SECRET;
const YOUTUBE_REFRESH_TOKEN = process.env.YOUTUBE_REFRESH_TOKEN;

const FACEBOOK_PAGE_ID = process.env.FACEBOOK_PAGE_ID || '1176323298906078';
const FACEBOOK_PAGE_ACCESS_TOKEN = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;

// Inisialisasi S3 Client untuk R2
const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID || 'dd3d0162fefacc8b01a83ca376d06947'}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID || '',
    secretAccessKey: R2_SECRET_ACCESS_KEY || '',
  },
});

// Helper: Query D1 Database
async function queryD1(sql, params = []) {
  if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_D1_DATABASE_ID || !CLOUDFLARE_API_TOKEN) {
    throw new Error('❌ Kredensial Cloudflare D1 tidak lengkap di environment variables.');
  }

  const url = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/d1/database/${CLOUDFLARE_D1_DATABASE_ID}/query`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sql, params }),
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(`D1 Query Error: ${JSON.stringify(data.errors || data)}`);
  }
  return data.result[0]?.results || [];
}

// Helper: Bersihkan Teks HTML dari Konten Artikel
function stripHtml(html) {
  if (!html) return '';
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

// Helper: Susun Naskah Narasi Lengkap Artikel untuk Podcast
// Membaca: Judul + Isi Artikel Lengkap
// TIDAK membaca: Excerpt / Deskripsi Banner (sesuai permintaan)
function prepareNarrationScript(title, content) {
  const cleanContent = stripHtml(content);

  // Batasi isi artikel hingga 4000 karakter agar durasi wajar (3-8 menit)
  const body =
    cleanContent.length > 4000
      ? cleanContent.slice(0, 3980) + '...'
      : cleanContent;

  const lines = [
    'Theta Indigo Podcast.',
    '',
    `${title}.`,  // Judul artikel dibacakan
    '',
    body,          // Isi artikel lengkap (bukan excerpt/banner)
    '',
    'Terima kasih telah mendengarkan Theta Indigo Podcast.',
    'Temukan lebih banyak wawasan spiritual di website kami: indigoblueprint.my.id',
  ];

  return lines.filter(Boolean).join('\n').trim();
}

const execEnv = {
  ...process.env,
  PATH: `${process.env.PATH || ''}:/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin`,
};

async function streamToBuffer(stream) {
  if (!stream) return Buffer.alloc(0);
  if (Buffer.isBuffer(stream)) return stream;
  if (typeof stream.then === 'function') {
    const res = await stream;
    if (Buffer.isBuffer(res)) return res;
    stream = res;
  }
  const chunks = [];
  try {
    for await (const chunk of stream) {
      chunks.push(Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
  } catch {
    return Buffer.alloc(0);
  }
}

// MsEdgeTTS - Podcast Engine utama dengan id-ID-ArdiNeural / id-ID-GadisNeural
async function ttsWithEdgeVoice(text, voice = 'id-ID-ArdiNeural') {
  const tts = new MsEdgeTTS();
  await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);

  const CHUNK_SIZE = 2500;
  const chunks = [];
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

  const buffers = [];
  for (const chunk of chunks) {
    if (!chunk) continue;
    try {
      const stream = tts.toStream(chunk);
      const audioBuffer = await streamToBuffer(stream);
      if (audioBuffer && audioBuffer.length > 100) {
        buffers.push(audioBuffer);
      }
    } catch (chunkErr) {
      console.warn('Chunk processing warning:', chunkErr.message);
    }
  }

  try {
    tts.close();
  } catch {}

  if (buffers.length === 0) {
    throw new Error('Edge TTS returned empty audio');
  }

  return Buffer.concat(buffers);
}

// Fallback ke google-tts-api jika Edge TTS berhalangan
async function ttsWithGoogle(text) {
  const base64List = await googleTTS.getAllAudioBase64(text, {
    lang: 'id',
    slow: false,
    host: 'https://translate.google.com',
    timeout: 15000,
    splitPunct: '.,!?',
  });

  const buffers = base64List.map((item) => Buffer.from(item.base64, 'base64'));
  return Buffer.concat(buffers);
}

// Helper: Generate Full Article Narration Speech Audio MP3
async function generateSpeechAudio(script, outputPath) {
  console.log('🎙️ Menghasilkan audio narasi TTS LENGKAP untuk artikel podcast...');
  const voices = ['id-ID-ArdiNeural', 'id-ID-GadisNeural'];

  for (const voice of voices) {
    try {
      console.log(`🔊 Mencoba Edge TTS Neural Voice (${voice})...`);
      const buffer = await ttsWithEdgeVoice(script, voice);
      if (buffer && buffer.length > 1000) {
        fs.writeFileSync(outputPath, buffer);
        console.log(`✅ TTS Podcast berhasil (MsEdgeTTS ${voice}): ${(buffer.length / 1024).toFixed(0)} KB`);
        return;
      }
    } catch (err) {
      console.warn(`⚠️ Edge TTS voice ${voice} gagal:`, err.message || err);
    }
  }

  console.log('🔊 Menggunakan fallback Google TTS...');
  try {
    const buffer = await ttsWithGoogle(script);
    if (buffer && buffer.length > 1000) {
      fs.writeFileSync(outputPath, buffer);
      console.log(`✅ TTS Podcast berhasil (Google TTS): ${(buffer.length / 1024).toFixed(0)} KB`);
      return;
    }
  } catch (gErr) {
    console.error('❌ Google TTS fallback gagal:', gErr.message || gErr);
  }

  throw new Error('Semua TTS engine gagal menghasilkan audio.');
}

// Helper: Cari & Download Audio Podcast BAHASA INDONESIA dari R2
// Format key:  ID  → podcast/ep-{articleId}-{timestamp}.mp3
//              EN  → podcast/ep-{articleId}-en-{timestamp}.mp3
// Kita filter hanya key yang TIDAK mengandung '-en-' agar selalu ambil versi Indonesia.
async function fetchPodcastAudioFromR2(articleId, outputPath) {
  console.log(`🎧 Mencari audio podcast BAHASA INDONESIA di R2 untuk artikel: ${articleId}...`);
  try {
    // List semua episode podcast untuk articleId ini
    const listRes = await s3Client.send(
      new ListObjectsV2Command({
        Bucket: R2_BUCKET_NAME,
        Prefix: `podcast/ep-${articleId}-`,
      })
    );

    const allObjects = listRes.Contents || [];
    if (allObjects.length === 0) {
      console.log('⚠️  Tidak ada audio podcast di R2 untuk artikel ini.');
      return false;
    }

    // Filter: HANYA ambil file Indonesia (tidak mengandung '-en-' di nama key)
    const idObjects = allObjects.filter(obj => !obj.Key.includes('-en-'));
    console.log(`   Total file ditemukan: ${allObjects.length}, versi ID: ${idObjects.length}, versi EN: ${allObjects.length - idObjects.length}`);

    if (idObjects.length === 0) {
      console.log('⚠️  Tidak ada audio podcast Bahasa Indonesia di R2. Hanya ada versi English.');
      return false;
    }

    // Ambil yang terbaru (timestamp terbesar di nama file)
    idObjects.sort((a, b) => {
      const tsA = parseInt((a.Key.match(/-(\d{13})\.mp3$/) || [])[1] || '0', 10);
      const tsB = parseInt((b.Key.match(/-(\d{13})\.mp3$/) || [])[1] || '0', 10);
      return tsB - tsA; // descending — terbaru dulu
    });

    const latestKey = idObjects[0].Key;
    console.log(`📥 Download audio podcast ID dari R2: ${latestKey}`);

    const getRes = await s3Client.send(
      new GetObjectCommand({ Bucket: R2_BUCKET_NAME, Key: latestKey })
    );

    if (!getRes.Body) {
      console.warn('⚠️  Body kosong dari R2.');
      return false;
    }

    // Stream → Buffer → File
    const chunks = [];
    for await (const chunk of getRes.Body) {
      chunks.push(Buffer.from(chunk));
    }
    const buffer = Buffer.concat(chunks);

    if (buffer.length < 1000) {
      console.warn('⚠️  File audio podcast terlalu kecil, mungkin corrupt.');
      return false;
    }

    fs.writeFileSync(outputPath, buffer);
    console.log(`✅ Audio podcast berhasil diunduh dari R2! (${(buffer.length / 1024).toFixed(0)} KB) → ${latestKey}`);
    return true;
  } catch (err) {
    console.warn('⚠️  Gagal mengunduh audio podcast dari R2:', err.message || err);
    return false;
  }
}

function mixAudioWithBackgroundMusic(speechPath, musicPath, outputPath) {
  console.log('🎵 Menggabungkan suara TTS dengan musik meditasi...');
  const command = `ffmpeg -y -i "${speechPath}" -i "${musicPath}" -filter_complex "[0:a]volume=1.2[speech];[1:a]volume=0.15[bg];[speech][bg]amix=inputs=2:duration=first:dropout_transition=2[aout]" -map "[aout]" -c:a mp3 -b:a 192k "${outputPath}"`;
  execSync(command, { env: execEnv });
  console.log(`✅ Mixing audio selesai: ${outputPath}`);
}

// Helper: Download/Fetch Gambar Banner Artikel Resmi
async function prepareBannerImage(article, outputPath) {
  console.log('🖼️ Menyiapkan GAMBAR BANNER ARTIKEL RESMI...');
  
  if (article.bannerR2Url) {
    try {
      console.log(`📥 Mengunduh banner R2: ${article.bannerR2Url}`);
      const res = await fetch(article.bannerR2Url);
      if (res.ok) {
        const buffer = Buffer.from(await res.arrayBuffer());
        fs.writeFileSync(outputPath, buffer);
        console.log('✅ Gambar Banner Artikel berhasil diunduh dari R2!');
        return;
      }
    } catch (err) {
      console.warn('⚠️ Gagal mengunduh bannerR2Url, mencoba generator banner dinamis...');
    }
  }

  const dynamicBannerUrl = `https://www.indigoblueprint.my.id/api/admin/generate-image?title=${encodeURIComponent(
    article.title
  )}&description=${encodeURIComponent(article.excerpt || '')}&icon=${encodeURIComponent(
    article.icon || '✨'
  )}&bg=${encodeURIComponent(article.bg || '1')}`;

  try {
    console.log(`🎨 Mengunduh gambar banner artikel dinamis: ${dynamicBannerUrl}`);
    const res = await fetch(dynamicBannerUrl);
    if (res.ok) {
      const buffer = Buffer.from(await res.arrayBuffer());
      fs.writeFileSync(outputPath, buffer);
      console.log('✅ Gambar Banner Artikel Resmi berhasil digenerate & diunduh!');
      return;
    }
  } catch (err) {
    console.warn('⚠️ Gagal mengambil banner dari API generate-image:', err.message);
  }

  const localLogo = path.join(process.cwd(), 'public', 'logo.png');
  if (fs.existsSync(localLogo)) {
    fs.copyFileSync(localLogo, outputPath);
    console.log('✅ Fallback gambar menggunakan logo.png.');
  } else {
    throw new Error('Banner image tidak ditemukan.');
  }
}

// Helper: Render 1080p MP4 Video
function renderVideo(imagePath, audioPath, outputPath) {
  console.log('🎬 Merender Video 1080p MP4 via FFmpeg...');
  const command = `ffmpeg -y -loop 1 -i "${imagePath}" -i "${audioPath}" -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-ih)/2:(oh-ih)/2:black" -c:v libx264 -tune stillimage -c:a copy -pix_fmt yuv420p -shortest "${outputPath}"`;
  execSync(command, { env: execEnv });
  console.log(`✅ Video berhasil dirender: ${outputPath}`);
}

// Helper: Upload Video ke Cloudflare R2
async function uploadToR2(filePath, r2Key) {
  console.log(`☁️ Mengunggah video ke Cloudflare R2 transit (${r2Key})...`);
  const fileBuffer = fs.readFileSync(filePath);
  await s3Client.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: r2Key,
      Body: fileBuffer,
      ContentType: 'video/mp4',
    })
  );
  console.log('✅ Video berhasil terunggah ke Cloudflare R2.');
}

// Helper: Delete Video dari Cloudflare R2
async function deleteFromR2(r2Key) {
  console.log(`🗑️ Menghapus video dari Cloudflare R2 (${r2Key})...`);
  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: r2Key,
    })
  );
  console.log('✅ Video di Cloudflare R2 berhasil dihapus (Cleaned).');
}

// Helper: Upload Video ke YouTube Data API v3
async function uploadToYouTube(filePath, title, description, tags) {
  console.log('🚀 Menyiapkan koneksi ke YouTube Data API v3...');
  if (!YOUTUBE_REFRESH_TOKEN || !YOUTUBE_CLIENT_ID || !YOUTUBE_CLIENT_SECRET) {
    throw new Error('❌ Kredensial YouTube (YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET, YOUTUBE_REFRESH_TOKEN) belum lengkap.');
  }

  const oauth2Client = new google.auth.OAuth2(
    YOUTUBE_CLIENT_ID,
    YOUTUBE_CLIENT_SECRET,
    'http://localhost:3000/oauth2callback'
  );

  oauth2Client.setCredentials({ refresh_token: YOUTUBE_REFRESH_TOKEN });

  const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

  console.log('📤 Mengunggah video ke YouTube...');
  try {
    const res = await youtube.videos.insert({
      part: ['snippet', 'status'],
      requestBody: {
        snippet: {
          title: title.slice(0, 100),
          description: description.slice(0, 5000),
          tags: tags.slice(0, 15),
          categoryId: '22',
          defaultLanguage: 'id',
          defaultAudioLanguage: 'id',
        },
        status: {
          privacyStatus: 'public',
          embeddable: true,
          selfDeclaredMadeForKids: false,
        },
      },
      media: {
        body: fs.createReadStream(filePath),
      },
    });

    const videoId = res.data.id;
    const youtubeUrl = `https://youtu.be/${videoId}`;
    console.log(`🎉 Berhasil mengunggah video ke YouTube: ${youtubeUrl}`);
    return { videoId, youtubeUrl };
  } catch (ytErr) {
    const errDetails = ytErr.response?.data?.error || ytErr.message || ytErr;
    console.error('❌ Gagal mengunggah video ke YouTube Data API:', JSON.stringify(errDetails, null, 2));
    throw new Error(`YouTube API Error: ${typeof errDetails === 'object' ? JSON.stringify(errDetails) : errDetails}`);
  }
}

// Helper: Share Video ke Facebook Page
async function shareToFacebookPage(title, excerpt, youtubeUrl, articleId) {
  if (!FACEBOOK_PAGE_ID || !FACEBOOK_PAGE_ACCESS_TOKEN) {
    console.warn('⚠️ Kredensial Facebook Page (FACEBOOK_PAGE_ID / FACEBOOK_PAGE_ACCESS_TOKEN) tidak ditemukan. Melewati share ke Facebook.');
    return { success: false, error: 'Facebook credentials missing' };
  }

  console.log('📘 Membagikan video YouTube ke Facebook Page...');
  const message = `🎬 VIDEO BARU THETA INDIGO PODCAST 🎬\n\n✨ ${title} ✨\n\n${excerpt}\n\n📺 Tonton video di YouTube:\n${youtubeUrl}\n\n📖 Baca artikel selengkapnya:\nhttps://www.indigoblueprint.my.id/blog/${articleId}`;

  try {
    const feedUrl = `https://graph.facebook.com/v19.0/${FACEBOOK_PAGE_ID}/feed`;
    const res = await fetch(feedUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        link: youtubeUrl,
        access_token: FACEBOOK_PAGE_ACCESS_TOKEN,
      }),
    });

    const data = await res.json();
    if (res.ok && data.id) {
      console.log(`✅ Berhasil membagikan video ke Facebook Page (Post ID: ${data.id})`);
      return { success: true, postId: data.id };
    }
    console.warn('⚠️ Gagal membagikan ke Facebook Page:', data);
    return { success: false, error: data.error?.message || JSON.stringify(data) };
  } catch (err) {
    console.error('❌ Error membagikan ke Facebook Page:', err);
    return { success: false, error: err.message };
  }
}

// Helper: Send Telegram Report Notification
async function sendTelegramReport(payload) {
  console.log('📲 Mengirimkan laporan ke Telegram...');
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.warn('⚠️ Kredensial Telegram (TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID) tidak ditemukan.');
    return;
  }

  const text = `
<b>🎬 VIDEO YOUTUBE DITERBITKAN OTOMATIS 🎬</b>

<b>Judul Video:</b> ${payload.title}
<b>Link YouTube:</b> <a href="${payload.youtubeUrl}">${payload.youtubeUrl}</a>
<b>Kategori:</b> ${payload.category}
<b>Link Artikel:</b> <a href="https://www.indigoblueprint.my.id/blog/${payload.articleId}">Lihat Artikel</a>
<b>Facebook Page Share:</b> ${payload.fbStatus}
<b>Transit Cloudflare R2:</b> Terunggah & Otomatis Dihapus (Cleaned) ✅
<b>Waktu Pembuatan:</b> ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB

<i>Dilaporkan secara otomatis oleh Theta Indigo Blueprint GitHub Action Workflows.</i>
`.trim();

  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: false,
    }),
  });

  const data = await response.json();
  if (response.ok && data.ok) {
    console.log('✅ Telegram report berhasil dikirim.');
  } else {
    console.error('❌ Gagal mengirim laporan Telegram:', data);
  }
}

// --- MAIN EXECUTION PIPELINE ---
async function main() {
  const args = process.argv.slice(2);
  const requestedId = args.find(a => a.startsWith('=') ? a.split('=')[1] : null) || args.find(a => a.startsWith('--article-id='))?.split('=')[1];
  const isDryRun = args.includes('--dry-run');

  try {
    console.log('\n======================================================');
    console.log('🎬 THETA INDIGO YOUTUBE VIDEO GENERATOR (FULL PODCAST ENGINE)');
    console.log('======================================================\n');

    // 1. Cari podcast terbaru (Bahasa Indonesia) di R2
    //    Dari nama file: podcast/ep-{articleId}-{timestamp}.mp3
    //    Kita ekstrak articleId → query D1 untuk artikel yang sama → banner pasti cocok
    let article;

    if (requestedId) {
      // Mode manual: artikel spesifik diminta lewat --article-id=
      console.log(`📥 Mode Manual: Mengambil artikel ID=${requestedId} dari D1...`);
      const articles = await queryD1('SELECT * FROM blogs WHERE id = ? LIMIT 1', [requestedId]);
      if (!articles || articles.length === 0) {
        console.log('ℹ️ Artikel tidak ditemukan di D1.');
        return;
      }
      article = articles[0];
    } else {
      // Mode otomatis: cari podcast ID terbaru di R2, lalu ambil artikel yang sama dari D1
      console.log('🔍 Mencari podcast Bahasa Indonesia terbaru di R2...');
      const listRes = await s3Client.send(
        new ListObjectsV2Command({
          Bucket: R2_BUCKET_NAME,
          Prefix: 'podcast/ep-',
        })
      );

      // Filter hanya file Indonesia (tidak ada '-en-'), sort by timestamp descending
      const idFiles = (listRes.Contents || [])
        .filter(obj => obj.Key && !obj.Key.includes('-en-'))
        .sort((a, b) => {
          const tsA = parseInt((a.Key.match(/-(\d{13})\.mp3$/) || [])[1] || '0', 10);
          const tsB = parseInt((b.Key.match(/-(\d{13})\.mp3$/) || [])[1] || '0', 10);
          return tsB - tsA;
        });

      if (idFiles.length === 0) {
        console.log('⚠️ Tidak ada podcast ID di R2. Fallback ke artikel terbaru dari D1...');
        const articles = await queryD1('SELECT * FROM blogs WHERE published = 1 ORDER BY createdAt DESC LIMIT 1');
        if (!articles || articles.length === 0) {
          console.log('ℹ️ Tidak ada artikel untuk diproses.');
          return;
        }
        article = articles[0];
      } else {
        // Ekstrak articleId dari nama file podcast: podcast/ep-{articleId}-{timestamp}.mp3
        const latestPodcastKey = idFiles[0].Key;
        // Key format: podcast/ep-ARTICLEID-1234567890123.mp3
        // ArticleId bisa mengandung huruf, angka, dan tanda hubung — ambil bagian setelah "ep-" dan sebelum timestamp 13 digit
        const keyBasename = latestPodcastKey.replace('podcast/ep-', '').replace(/\.mp3$/, '');
        // Hapus timestamp 13 digit di akhir (plus tanda hubung sebelumnya)
        const articleId = keyBasename.replace(/-\d{13}$/, '');

        console.log(`\n🎯 Podcast ID terbaru: ${latestPodcastKey}`);
        console.log(`   → ArticleId diekstrak: "${articleId}"`);
        console.log(`📥 Mengambil data artikel dari D1 berdasarkan articleId podcast...`);

        const articles = await queryD1('SELECT * FROM blogs WHERE id = ? LIMIT 1', [articleId]);
        if (!articles || articles.length === 0) {
          console.warn(`⚠️ Artikel "${articleId}" tidak ditemukan di D1. Fallback ke artikel terbaru...`);
          const fallback = await queryD1('SELECT * FROM blogs WHERE published = 1 ORDER BY createdAt DESC LIMIT 1');
          if (!fallback || fallback.length === 0) {
            console.log('ℹ️ Tidak ada artikel untuk diproses.');
            return;
          }
          article = fallback[0];
        } else {
          article = articles[0];
        }
      }
    }

    console.log(`\n📌 Artikel: [${article.id}] "${article.title}"`);
    console.log(`   Kategori: ${article.category}`);

    // 2. Susun Naskah Narasi: Judul + Isi Artikel (BUKAN excerpt/banner)
    const narrationScript = prepareNarrationScript(article.title, article.content);
    
    const youtubeTitle = `${article.title} | Theta Indigo Spiritual Podcast`;
    const youtubeTags = ['Theta Indigo', 'Spiritual', 'Meditasi', 'Wawasan Jiwa', 'Numerologi', 'Weton Jawa', article.category];
    const youtubeDescription = `✨ ${article.title} ✨

${article.excerpt}

📖 Baca artikel selengkapnya & analisis spiritual Anda di:
https://www.indigoblueprint.my.id/blog/${article.id}

🎧 Dengarkan podcast audio & ramalan harian:
https://www.indigoblueprint.my.id

--------------------------------------------------
Kategori: ${article.category}
Hak Cipta: © ${new Date().getFullYear()} Theta Indigo Blueprint
Musik Latar: Royalty-Free Meditation Instrumental
--------------------------------------------------
#Spiritual #ThetaIndigo #Meditasi #Weton #Numerologi #SelfHealing`;

    // 3. Menyiapkan File Temporary
    const tempTtsPath = path.join('/tmp', `tts_${article.id}.mp3`);
    const tempMixedAudioPath = path.join('/tmp', `mixed_${article.id}.mp3`);
    const tempBannerPath = path.join('/tmp', `banner_${article.id}.jpg`);
    const tempVideoPath = path.join('/tmp', `video_${article.id}.mp4`);
    const bgMusicPath = path.join(process.cwd(), 'public', 'meditation.mp3');

    // 4. Ambil Audio Podcast ID dari R2 (audio & artikel sudah dijamin sinkron di step 1)
    //    Fallback ke TTS sendiri hanya jika audio tidak ada di R2
    const podcastAudioFound = await fetchPodcastAudioFromR2(article.id, tempTtsPath);
    if (!podcastAudioFound) {
      console.log('🔄 Fallback: Generate TTS sendiri karena audio podcast tidak ditemukan di R2...');
      await generateSpeechAudio(narrationScript, tempTtsPath);
    }
    mixAudioWithBackgroundMusic(tempTtsPath, bgMusicPath, tempMixedAudioPath);

    // 5. Banner artikel diambil berdasarkan artikel yang SAMA dengan audio podcast → selalu cocok ✅
    await prepareBannerImage(article, tempBannerPath);
    renderVideo(tempBannerPath, tempMixedAudioPath, tempVideoPath);

    if (isDryRun) {
      console.log('\n🔍 [DRY RUN] Pembuatan video selesai. Melewati upload R2, YouTube, Facebook, dan Telegram.');
      console.log(`Hasil Video: ${tempVideoPath}`);
      return;
    }

    // 6. Transit ke Cloudflare R2
    const r2Key = `videos/transit-${article.id}-${Date.now()}.mp4`;
    await uploadToR2(tempVideoPath, r2Key);

    // 7. Upload ke YouTube Data API v3
    const { videoId, youtubeUrl } = await uploadToYouTube(
      tempVideoPath,
      youtubeTitle,
      youtubeDescription,
      youtubeTags
    );

    // 8. Bagikan Video ke Facebook Page
    let fbStatus = 'Skipped';
    try {
      const fbResult = await shareToFacebookPage(article.title, article.excerpt, youtubeUrl, article.id);
      fbStatus = fbResult.success ? 'Success ✅' : `Failed: ${fbResult.error} ❌`;
    } catch (fbErr) {
      fbStatus = `Error: ${fbErr.message} ❌`;
    }

    // 9. Hapus dari Cloudflare R2 setelah sukses upload YouTube & Facebook
    await deleteFromR2(r2Key);

    // 10. Kirim Telegram Report
    await sendTelegramReport({
      title: youtubeTitle,
      youtubeUrl,
      category: article.category,
      articleId: article.id,
      fbStatus,
    });

    // Clean up temporary local files
    [tempTtsPath, tempMixedAudioPath, tempBannerPath, tempVideoPath].forEach(f => {
      if (fs.existsSync(f)) fs.unlinkSync(f);
    });

    console.log('\n======================================================');
    console.log('✅ ALUR PEMBUATAN & UNGGAH VIDEO YOUTUBE & FACEBOOK SELESAI SUKSES!');
    console.log('======================================================\n');
  } catch (err) {
    console.error('\n❌ ERROR DALAM PIPELINE PEMBUATAN VIDEO YOUTUBE:', err);
    process.exit(1);
  }
}

main();
