import { NextResponse } from 'next/server';
import { executeD1, queryD1 } from '@/lib/cloudflare-db';
import { saveToR2Json } from '@/lib/r2-client';
import { BLOG_CATEGORY_PRESETS, DEFAULT_BLOG_CATEGORY } from '@/lib/blog-utils';
import { generateId } from '@/lib/utils';
import { shareToFacebookPage } from '@/lib/facebook-share';
import { sendTelegramReport } from '@/lib/telegram-report';
import { sendBulkNewsletter } from '@/lib/resend-email';

export const dynamic = 'force-dynamic';

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

async function getAutoBlogSettings() {
  try {
    const rows = await queryD1('SELECT value FROM settings WHERE key = ?', ['auto_blog']);
    return rows[0]?.value ? JSON.parse(rows[0].value) : null;
  } catch {
    return null;
  }
}

async function getActiveCategories() {
  try {
    const rows = await queryD1('SELECT value FROM settings WHERE key = ?', ['blog_categories']);
    const data = rows[0]?.value ? JSON.parse(rows[0].value) : null;
    if (data && Array.isArray(data.categories)) {
      return data.categories
        .map((c: any) => (typeof c === 'string' ? c : c.active ? c.name : null))
        .filter(Boolean);
    }
  } catch {
    // Ignore
  }
  return [];
}

// Rotasi berurutan: ambil kategori terakhir dari D1, pilih berikutnya
async function getNextCategoryByRotation(categoriesPool: string[]): Promise<string> {
  try {
    const rows = await queryD1('SELECT value FROM settings WHERE key = ?', ['cron_last_category']);
    const lastCategory = rows[0]?.value || null;
    if (lastCategory) {
      const lastIndex = categoriesPool.indexOf(lastCategory);
      const nextIndex = (lastIndex + 1) % categoriesPool.length;
      return categoriesPool[nextIndex];
    }
  } catch {
    // Ignore, fallback to index 0
  }
  return categoriesPool[0];
}

async function saveLastCategory(category: string) {
  try {
    await executeD1(
      `INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      ['cron_last_category', category]
    );
  } catch {
    // Non-critical, ignore
  }
}

// Ambil judul artikel 30 hari terakhir untuk mencegah duplikasi
async function getRecentTitles(): Promise<string[]> {
  try {
    const rows = await queryD1<{ title: string }>(
      `SELECT title FROM blogs WHERE createdAt >= datetime('now', '-30 days') ORDER BY createdAt DESC LIMIT 60`
    );
    return rows.map((r) => r.title.toLowerCase().trim());
  } catch {
    return [];
  }
}


async function saveBlogPost(id: string, post: any) {
  const r2Key = `blogs/${id}.json`;
  await saveToR2Json(r2Key, { content: post.content });
  
  const slug = `${slugify(post.title)}-${id.slice(0, 5)}`;
  const now = new Date().toISOString();
  const tagsJson = Array.isArray(post.tags) ? JSON.stringify(post.tags) : null;

  await executeD1(
    `INSERT INTO blogs (id, title, slug, category, excerpt, icon, bg, published, status, createdAt, contentR2Path, generatorSource, tags, bannerR2Url)
     VALUES (?, ?, ?, ?, ?, ?, ?, 1, 'published', ?, ?, ?, ?, ?)`,
    [
      id,
      post.title,
      slug,
      post.category,
      post.excerpt,
      post.icon || '📖',
      post.bg || '1',
      now,
      r2Key,
      post.generatorSource,
      tagsJson,
      post.bannerR2Url || null,
    ]
  );
}

async function getAllUserEmails() {
  const emails: string[] = [];
  try {
    const rows = await queryD1('SELECT email FROM users');
    rows.forEach((r) => {
      if (r.email) emails.push(r.email);
    });
  } catch (err) {
    console.error('Failed to fetch user emails from D1:', err);
  }
  return emails;
}

function cleanJsonResponse(text: string): string {
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    const match = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (match) cleaned = match[1].trim();
  }
  
  const openBraces = (cleaned.match(/{/g) || []).length;
  const closeBraces = (cleaned.match(/}/g) || []).length;
  if (openBraces > closeBraces) {
    const missingBraces = openBraces - closeBraces;
    cleaned += '}'.repeat(missingBraces);
  }
  return cleaned;
}

async function generateWithGroq(category: string, recentTitles: string[] = []) {
  const keys = [process.env.GROQ_API_KEY, process.env.GROQ_API_KEY_BACKUP].filter(Boolean);
  if (keys.length === 0) throw new Error('Groq API key is missing.');

  const avoidSection = recentTitles.length > 0
    ? `\nHINDARAN: Jangan membuat artikel dengan judul yang mirip atau sama dengan judul-judul ini yang sudah pernah diterbitkan:\n${recentTitles.slice(0, 20).map((t, i) => `${i + 1}. ${t}`).join('\n')}\n`
    : '';

  const prompt = `Tulis sebuah artikel spiritual mendalam dalam Bahasa Indonesia tentang kategori: "${category}".
Artikel harus minimal 500 kata dengan minimal 4-5 paragraf, ditulis dengan gaya bahasa yang bijaksana, modern-mistis, inspiratif, dan menyentuh hati.
${avoidSection}

ATURAN STRUKTUR & FORMAT HTML KONTEN (PENTING):
1. Konten harus ditulis menggunakan format HTML murni.
2. Setiap paragraf WAJIB dibungkus dengan tag <p>...</p>. JANGAN menggunakan teks kosong atau hanya baris baru tanpa tag <p>.
3. Gunakan tag <h3>...</h3> untuk membagi artikel menjadi beberapa sub-pembahasan.
4. Gunakan tag <strong>...</strong> untuk menekankan kata kunci spiritual atau poin penting.
5. JANGAN mencampur format Markdown (seperti #, ##, ###, **, dll.) di dalam nilai "content". Semua teks tebal dan subjudul harus berupa HTML tag murni (<strong> dan <h3>).
6. Susun paragraf dengan alur pembuka, penjelasan detail/inti wawasan spiritual, dan penutup/refleksi yang indah.

Balas HANYA dengan JSON valid dengan format persis seperti ini:
{
  "title": "Judul Artikel Menarik",
  "excerpt": "Ringkasan pendek artikel sebanyak 1-2 kalimat.",
  "tags": ["Tag1", "Tag2", "Tag3"],
  "content": "Isi artikel lengkap dalam format HTML sesuai aturan di atas..."
}`;

  let lastError: any = null;
  for (const apiKey of keys) {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          response_format: { type: 'json_object' },
          messages: [
            {
              role: 'system',
              content: 'Anda adalah asisten AI spiritual yang membalas HANYA dengan format JSON valid.',
            },
            { role: 'user', content: prompt },
          ],
          temperature: 0.7,
          max_tokens: 2000,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Groq API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const contentText = data.choices?.[0]?.message?.content;
      if (!contentText) throw new Error('Groq returned an empty response.');

      const cleaned = cleanJsonResponse(contentText);
      return JSON.parse(cleaned);
    } catch (err: any) {
      console.warn(`Groq key failed: ${err.message}. Trying backup key...`);
      lastError = err;
    }
  }

  throw lastError || new Error('All Groq keys failed.');
}

async function generateWithOpenRouter(category: string, recentTitles: string[] = []) {
  const keys = [
    process.env.DEEPSEEK_API_KEY,
    process.env.OPENROUTER_API_KEY,
    process.env.OPENROUTER_API_KEY_BACKUP,
  ].filter(Boolean);
  if (keys.length === 0) throw new Error('OpenRouter API key is missing.');

  const avoidSection = recentTitles.length > 0
    ? `\nHINDARAN: Jangan membuat artikel dengan judul yang mirip atau sama dengan judul-judul ini yang sudah pernah diterbitkan:\n${recentTitles.slice(0, 20).map((t, i) => `${i + 1}. ${t}`).join('\n')}\n`
    : '';

  const prompt = `Tulis sebuah artikel spiritual mendalam dalam Bahasa Indonesia tentang kategori: "${category}".
Artikel harus minimal 500 kata dengan minimal 4-5 paragraf, ditulis dengan gaya bahasa yang bijaksana, modern-mistis, inspiratif, dan menyentuh hati.
${avoidSection}

ATURAN STRUKTUR & FORMAT HTML KONTEN (PENTING):
1. Konten harus ditulis menggunakan format HTML murni.
2. Setiap paragraf WAJIB dibungkus dengan tag <p>...</p>. JANGAN menggunakan teks kosong atau hanya baris baru tanpa tag <p>.
3. Gunakan tag <h3>...</h3> untuk membagi artikel menjadi beberapa sub-pembahasan.
4. Gunakan tag <strong>...</strong> untuk menekankan kata kunci spiritual atau poin penting.
5. JANGAN mencampur format Markdown (seperti #, ##, ###, **, dll.) di dalam nilai "content". Semua teks tebal dan subjudul harus berupa HTML tag murni (<strong> dan <h3>).
6. Susun paragraf dengan alur pembuka, penjelasan detail/inti wawasan spiritual, dan penutup/refleksi yang indah.

Balas HANYA dengan JSON valid dengan format persis seperti ini:
{
  "title": "Judul Artikel Menarik",
  "excerpt": "Ringkasan pendek artikel sebanyak 1-2 kalimat.",
  "tags": ["Tag1", "Tag2", "Tag3"],
  "content": "Isi artikel lengkap dalam format HTML sesuai aturan di atas..."
}`;

  let lastError: any = null;
  for (const apiKey of keys) {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://www.indigoblueprint.my.id',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          response_format: { type: 'json_object' },
          messages: [
            {
              role: 'system',
              content: 'Anda adalah asisten AI spiritual yang membalas HANYA dengan format JSON valid.',
            },
            { role: 'user', content: prompt },
          ],
          temperature: 0.7,
          max_tokens: 2000,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const contentText = data.choices?.[0]?.message?.content;
      if (!contentText) throw new Error('OpenRouter returned an empty response.');

      const cleaned = cleanJsonResponse(contentText);
      return JSON.parse(cleaned);
    } catch (err: any) {
      console.warn(`OpenRouter key failed: ${err.message}. Trying backup key...`);
      lastError = err;
    }
  }

  throw lastError || new Error('All OpenRouter keys failed.');
}

export async function GET(request: Request) {
  return handleRequest(request);
}

export async function POST(request: Request) {
  return handleRequest(request);
}

async function handleRequest(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const isManual = searchParams.get('manual') === 'true';

    // 🔐 Security: Validate cron secret (skip for Vercel internal cron)
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret) {
      const providedSecret = request.headers.get('x-cron-secret') || searchParams.get('secret');
      const authHeader = request.headers.get('authorization');
      const isVercelCron = authHeader === `Bearer ${cronSecret}`;
      const isCronJobOrg = providedSecret === cronSecret;

      if (!isVercelCron && !isCronJobOrg) {
        // Allow localhost for dev
        const host = request.headers.get('host') || '';
        if (!host.includes('localhost') && !host.includes('127.0.0.1')) {
          return NextResponse.json({ error: 'Unauthorized: provide x-cron-secret header or ?secret=... param' }, { status: 401 });
        }
      }
    }

    // 1. Check if auto-blog is enabled
    const settings = await getAutoBlogSettings();
    const isEnabled = settings ? settings.enabled !== false : true;

    if (!isEnabled && !isManual) {
      return NextResponse.json({
        success: true,
        skipped: true,
        message: 'Otomatisasi generator artikel dinonaktifkan (disabled) di D1 settings.',
      });
    }

    // 2. Determine category — rotasi berurutan
    const activeCats = await getActiveCategories();
    const categoriesPool = activeCats.length > 0 ? activeCats : [...BLOG_CATEGORY_PRESETS];
    const selectedCategory = await getNextCategoryByRotation(categoriesPool) || DEFAULT_BLOG_CATEGORY;

    // 2b. Ambil judul artikel terbaru untuk anti-duplikasi
    const recentTitles = await getRecentTitles();

    // 3. AI Generation - Groq primary, OpenRouter fallback
    let articleData: { title: string; excerpt: string; content: string } | null = null;
    let providerUsed = 'Groq (Llama 3.3 70b)';
    let errorLog = '';

    try {
      articleData = await generateWithGroq(selectedCategory, recentTitles);
    } catch (err: any) {
      console.warn('Primary AI Groq failed. Attempting fallback to OpenRouter...', err.message);
      errorLog += `Groq Error: ${err.message}. `;
      try {
        articleData = await generateWithOpenRouter(selectedCategory, recentTitles);
        providerUsed = 'OpenRouter (Gemini 2.5 Flash)';
      } catch (openrouterErr: any) {
        console.error('Backup AI OpenRouter failed as well.', openrouterErr.message);
        errorLog += `OpenRouter Error: ${openrouterErr.message}.`;
        throw new Error(`Semua provider AI gagal. Log: ${errorLog}`);
      }
    }

    if (!articleData || !articleData.title || !articleData.content) {
      throw new Error('Respons AI tidak menghasilkan format JSON yang valid.');
    }

    // 4. Save to D1 & R2
    const id = generateId();
    // Rotasi warna banner per-artikel (bukan per-hari) agar 2 artikel sehari tetap beda warna
    const bgRows = await queryD1<{ value: string }>('SELECT value FROM settings WHERE key = ?', ['cron_last_bg']);
    const lastBg = parseInt(bgRows[0]?.value || '0', 10);
    const nextBg = (lastBg % 7) + 1; // siklus 1-7
    const bg = String(nextBg);
    await executeD1(
      `INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      ['cron_last_bg', String(nextBg)]
    );
    const icon = '✨';

    const blogPost = {
      title: articleData.title.trim(),
      excerpt: (articleData.excerpt || '').trim() || articleData.title.trim().slice(0, 100),
      category: selectedCategory,
      content: articleData.content,
      tags: (articleData as any).tags || [selectedCategory, 'Spiritual'],
      icon,
      bg,
      generatorSource: providerUsed,
    };

    await saveBlogPost(id, blogPost);

    // Simpan kategori terakhir untuk rotasi berikutnya
    await saveLastCategory(selectedCategory);

    // 5. Real Newsletter Blast via Resend
    const emails = await getAllUserEmails();
    let resendSentCount = 0;
    if (emails.length > 0) {
      const bannerUrlForEmail = `https://www.indigoblueprint.my.id/api/admin/generate-image?title=${encodeURIComponent(
        blogPost.title
      )}&description=${encodeURIComponent(blogPost.excerpt)}&icon=${encodeURIComponent(icon)}&bg=${bg}`;

      const resendResult = await sendBulkNewsletter(emails, {
        articleTitle: blogPost.title,
        articleExcerpt: blogPost.excerpt,
        articleId: id,
        category: selectedCategory,
        bannerUrl: bannerUrlForEmail,
        icon,
      });
      resendSentCount = resendResult.sent;
      console.log(`[Newsletter Blast] Resend dikirim ke ${resendResult.sent} email (${resendResult.failed} gagal).`);
    }

    // 6. Share to Facebook & Telegram Report
    let fbStatus = 'Skipped';
    const bannerUrl = `https://www.indigoblueprint.my.id/api/admin/generate-image?title=${encodeURIComponent(
      blogPost.title
    )}&description=${encodeURIComponent(blogPost.excerpt)}&icon=${encodeURIComponent(icon)}&bg=${bg}`;

    try {
      const fbRes = await shareToFacebookPage({
        title: blogPost.title,
        excerpt: blogPost.excerpt,
        bannerUrl,
        articleId: id,
      });
      fbStatus = fbRes.success ? 'Success' : `Failed: ${fbRes.error}`;
    } catch (fbErr: any) {
      fbStatus = `Error: ${fbErr.message}`;
    }

    try {
      await sendTelegramReport({
        title: blogPost.title,
        category: selectedCategory,
        fbStatus,
        newsletterCount: emails.length,
      });
    } catch (tgErr) {
      console.error('Telegram report failed:', tgErr);
    }

    return NextResponse.json({
      success: true,
      id,
      category: selectedCategory,
      title: blogPost.title,
      provider: providerUsed,
      newsletterBlastedCount: emails.length,
      facebookStatus: fbStatus,
      message: 'Artikel berhasil digenerate, disimpan ke D1/R2, dipublish ke Facebook/Telegram, dan newsletter didistribusikan.',
    });
  } catch (error: any) {
    console.error('Error in generate-blog API:', error);
    return NextResponse.json({ error: error.message || 'Gagal memproses generator blog.' }, { status: 500 });
  }
}
