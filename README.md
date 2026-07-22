# 🎙️ Theta Indigo Spotify Podcast

Sistem otomatis yang meng-generate episode podcast dari artikel blog Theta Indigo Blueprint, mengkonversi ke MP3, dan mempublikasikannya ke Spotify via RSS feed.

---

## 📦 Arsitektur

```
GitHub Actions Cron (2x/hari: 07:00 & 19:00 WIB)
        │
        ▼
  scripts/run-podcast.ts
        │
        ├── 1. Rotasi kategori  ←→  R2 (podcast/rotation-state.json)
        ├── 2. Ambil artikel    ←→  Cloudflare D1 REST API
        ├── 3. TTS → MP3        ←→  Microsoft Edge TTS (id-ID-ArdiNeural)
        ├── 4. Cleanup R2       ←→  Hapus MP3 > 24 jam
        ├── 5. Upload MP3       ←→  R2 (podcast/ep-{id}-{ts}.mp3)
        ├── 6. Upload Cover     ←→  R2 (podcast/cover.png) [sekali saja]
        ├── 7. Save Firestore   ←→  Firebase (podcast_episodes collection)
        ├── 8. Build & Upload   ←→  R2 (podcast/feed.xml)
        │   RSS XML
        └── 9. Telegram Report  ←→  Bot → Chat ID 5429818332
```

---

## 🔗 URL Penting

| Resource       | URL |
|---------------|-----|
| **RSS Feed**  | `https://pub-3dfac1ebd38a458faff5626cae902ad2.r2.dev/podcast/feed.xml` |
| **Cover Art** | `https://pub-3dfac1ebd38a458faff5626cae902ad2.r2.dev/podcast/cover.png` |

> **RSS URL ini yang didaftarkan ke Spotify for Podcasters** dengan email `timotiusfamily@gmail.com`

---

## 🚀 Setup GitHub Repository

### 1. Buat GitHub Secrets

Di `Settings → Secrets and variables → Actions`, tambahkan semua secrets berikut:

| Secret Name | Nilai |
|-------------|-------|
| `R2_ACCOUNT_ID` | `dd3d0162fefacc8b01a83ca376d06947` |
| `R2_ACCESS_KEY_ID` | `2f0aafcdbb08b5d843ecbd1da3a4edd2` |
| `R2_SECRET_ACCESS_KEY` | (dari .env.local) |
| `R2_BUCKET_NAME` | `theta-indigo` |
| `R2_PUBLIC_URL` | `https://pub-3dfac1ebd38a458faff5626cae902ad2.r2.dev` |
| `TELEGRAM_BOT_TOKEN` | `8734226608:AAH3N4AZ2FvlRLXqBzhO1gbLZEK74W8f5Mg` |
| `TELEGRAM_CHAT_ID` | `5429818332` |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | *(paste seluruh isi file JSON Firebase Admin SDK)* |
| `CLOUDFLARE_ACCOUNT_ID` | `dd3d0162fefacc8b01a83ca376d06947` |
| `CLOUDFLARE_D1_DATABASE_ID` | `1b810cf0-5a0e-4468-813e-c7635af45061` |
| `CLOUDFLARE_API_TOKEN` | (dari .env.local) |

### 2. Jalankan Manual (opsional)

Di GitHub → Actions → "🎙️ Theta Indigo Podcast Generator" → **Run workflow**

---

## 💻 Development Lokal

### Prerequisites
- Node.js 20+
- npm

### Setup
```bash
# Clone repo
git clone https://github.com/sasmitatius-droid/theta-indigo-spotify.git
cd theta-indigo-spotify

# Install dependencies
npm install

# Copy env template
cp .env.example .env.local
# → Edit .env.local dengan credential yang sesuai
```

### Upload Cover Art (sekali saja)
```bash
npm run setup:cover
```

### Dry Run (test tanpa upload)
```bash
npm run podcast:dry
```

### Full Run (lokal)
```bash
npm run podcast
```

---

## 🕒 Jadwal Cron

| Waktu WIB | Waktu UTC | Cron Expression |
|-----------|-----------|-----------------|
| 07:00 WIB | 00:00 UTC | `0 0 * * *`     |
| 19:00 WIB | 12:00 UTC | `0 12 * * *`    |

---

## 🔄 Rotasi Kategori

Kategori berputar secara berurutan setiap run:

```
Umum → Numerologi → Human Design → Chakra & Aura →
Tips Spiritual → Kearifan Lokal → Bazi → Astrologi & Zodiak →
Wuku & Pranata Mangsa → Weton Jawa → Spiritual Jawa → Fengshui → (ulang)
```

State disimpan di: `R2: podcast/rotation-state.json`

---

## 🗑️ Auto-Delete R2 (Transit 24 Jam)

Setiap run, script otomatis menghapus file MP3 yang sudah lebih dari 24 jam.
RSS feed tetap menyimpan metadata episode di Firestore (tidak ikut terhapus).

---

## 📲 Laporan Telegram

**Sukses:**
```
🎙️ PODCAST BARU DITERBITKAN ✅
📌 Judul: [judul episode]
📂 Kategori: [kategori]
🕒 Durasi: [MM:SS]
📦 Ukuran MP3: [xxx] KB
📡 RSS Feed: https://pub-xxx.r2.dev/podcast/feed.xml
```

**Gagal:**
```
❌ PODCAST GAGAL DIGENERATE
🔴 Error: [pesan error]
📂 Kategori Dicoba: [kategori]
```

---

## 📡 Daftarkan ke Spotify

1. Buka [Spotify for Podcasters](https://podcasters.spotify.com)
2. Login dengan akun Spotify
3. Klik **"Get Started"** → **"I have a podcast"**
4. Masukkan RSS URL: `https://pub-3dfac1ebd38a458faff5626cae902ad2.r2.dev/podcast/feed.xml`
5. Verifikasi dengan email: `timotiusfamily@gmail.com`

---

## 🏗️ Struktur Proyek

```
theta-indigo-spotify/
├── .github/workflows/
│   └── podcast-cron.yml      ← Cron 2x/hari
├── scripts/
│   ├── run-podcast.ts        ← Entry point utama
│   └── upload-cover.ts       ← Setup cover art (sekali saja)
├── src/
│   ├── firebase-client.ts    ← Firestore untuk episode metadata
│   ├── r2-client.ts          ← R2 upload/delete/cleanup
│   ├── tts-service.ts        ← Edge TTS → MP3
│   ├── rss-builder.ts        ← Build RSS XML
│   ├── category-rotator.ts   ← Rotasi kategori via R2 state
│   └── telegram-notify.ts    ← Laporan Telegram
├── assets/
│   └── logo-indigo-sp.png    ← Cover art podcast
├── package.json
├── tsconfig.json
└── README.md
```
