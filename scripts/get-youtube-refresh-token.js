/**
 * Script untuk mendapatkan YOUTUBE_REFRESH_TOKEN untuk GitHub Secrets.
 * Jalankan script ini secara lokal dengan environment variable:
 * YOUTUBE_CLIENT_ID="..." YOUTUBE_CLIENT_SECRET="..." PATH=$PATH:/usr/local/bin node scripts/get-youtube-refresh-token.js
 */

const { google } = require('googleapis');
const http = require('http');
const url = require('url');

const CLIENT_ID = process.env.YOUTUBE_CLIENT_ID;
const CLIENT_SECRET = process.env.YOUTUBE_CLIENT_SECRET;
const REDIRECT_URI = process.env.YOUTUBE_REDIRECT_URI || 'http://localhost:3000/oauth2callback';

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('❌ Harap tentukan YOUTUBE_CLIENT_ID dan YOUTUBE_CLIENT_SECRET di environment variables!');
  console.error('Contoh penggunaan:');
  console.error('YOUTUBE_CLIENT_ID="xxx" YOUTUBE_CLIENT_SECRET="yyy" node scripts/get-youtube-refresh-token.js\n');
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

const SCOPES = [
  'https://www.googleapis.com/auth/youtube.upload',
  'https://www.googleapis.com/auth/youtube.readonly'
];

async function main() {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
  });

  console.log('\n======================================================');
  console.log('🔑 YOUTUBE OAUTH2 REFRESH TOKEN GENERATOR');
  console.log('======================================================');
  console.log('1. Buka URL berikut di browser Anda:');
  console.log(`\n${authUrl}\n`);
  console.log('2. Izinkan akses akun YouTube Anda.');
  console.log('3. Script ini akan otomatis menangkap kode callback di port 3000.\n');

  const server = http.createServer(async (req, res) => {
    try {
      if (req.url.startsWith('/oauth2callback')) {
        const queryParams = new url.URL(req.url, 'http://localhost:3000').searchParams;
        const code = queryParams.get('code');

        if (code) {
          res.end('<h1>✅ Autentikasi Berhasil!</h1><p>Anda dapat menutup halaman ini dan kembali ke terminal Anda.</p>');

          const { tokens } = await oauth2Client.getToken(code);
          console.log('======================================================');
          console.log('🎉 REFRESH TOKEN DITEMUKAN!');
          console.log('======================================================');
          console.log('YOUTUBE_REFRESH_TOKEN:\n');
          console.log(tokens.refresh_token);
          console.log('\n======================================================');
          console.log('Silakan tambahkan token di atas ke GitHub Repository Secrets:');
          console.log('Name: YOUTUBE_REFRESH_TOKEN');
          console.log('======================================================\n');
          
          server.close();
          process.exit(0);
        }
      }
    } catch (err) {
      console.error('Error saat menukar kode token:', err);
      res.end('<h1>❌ Gagal memproses token.</h1>');
      server.close();
      process.exit(1);
    }
  });

  server.listen(3000, () => {
    console.log('Menunggu otorisasi di http://localhost:3000/oauth2callback...');
  });
}

main();
