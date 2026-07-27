import { NextResponse } from 'next/server';
import { getFromR2Json } from '@/lib/r2-client';

export const dynamic = 'force-dynamic';

async function handleAgregatorRequest(request: Request) {
  try {
    // 1. Security Check: Header "x-agregator-secret" vs process.env.AGREGATOR_SECRET_KEY
    const secretHeader = request.headers.get('x-agregator-secret');
    const expectedSecret = process.env.AGREGATOR_SECRET_KEY;

    if (!expectedSecret || !secretHeader || secretHeader !== expectedSecret) {
      return NextResponse.json(
        { error: 'Akses Ditolak: Secret Key Salah' },
        { status: 401 }
      );
    }

    // 2. Cloudflare D1 Configuration
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const dbId = process.env.CLOUDFLARE_D1_DATABASE_ID || process.env.CLOUDFLARE_D1_ID;
    const apiToken = process.env.CLOUDFLARE_API_TOKEN;

    if (!accountId || !dbId || !apiToken) {
      return NextResponse.json(
        { error: 'Konfigurasi Cloudflare D1 belum lengkap di environment variable server.' },
        { status: 500 }
      );
    }

    const d1Endpoint = `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${dbId}/query`;

    // Support optional limit query parameter (default: 30)
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get('limit');
    let limitSql = 'LIMIT 30';
    if (limitParam === 'all') {
      limitSql = '';
    } else if (limitParam && !isNaN(Number(limitParam))) {
      limitSql = `LIMIT ${Math.min(Math.max(1, parseInt(limitParam, 10)), 500)}`;
    }

    // SQL statements
    const sqlCount = `SELECT COUNT(*) as total FROM blogs WHERE published = 1 OR status = 'published'`;
    const sqlArticles = `SELECT id, title, slug, category, excerpt, icon, bg, createdAt, contentR2Path, bannerR2Url, COALESCE(views, 0) as views FROM blogs WHERE published = 1 OR status = 'published' ORDER BY createdAt DESC ${limitSql}`;

    const headers = {
      Authorization: `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
    };

    // Perform queries in parallel
    const [countRes, articlesRes] = await Promise.all([
      fetch(d1Endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({ sql: sqlCount, params: [] }),
        cache: 'no-store',
      }),
      fetch(d1Endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({ sql: sqlArticles, params: [] }),
        cache: 'no-store',
      }),
    ]);

    const countBody = await countRes.json();
    const articlesBody = await articlesRes.json();

    if (!countRes.ok || !countBody.success) {
      const errMsg = countBody.errors?.[0]?.message || `HTTP ${countRes.status}`;
      throw new Error(`D1 Count Error: ${errMsg}`);
    }

    if (!articlesRes.ok || !articlesBody.success) {
      const errMsg = articlesBody.errors?.[0]?.message || `HTTP ${articlesRes.status}`;
      throw new Error(`D1 Articles Error: ${errMsg}`);
    }

    const totalArticles = Number(countBody.result?.[0]?.results?.[0]?.total || 0);
    const rawArticles = (articlesBody.result?.[0]?.results || []) as any[];

    const baseUrl = 'https://www.indigoblueprint.my.id';

    // Fetch full article content from R2 concurrently
    const articles = await Promise.all(
      rawArticles.map(async (article) => {
        let content = '';
        if (article.contentR2Path) {
          try {
            const r2Payload = await getFromR2Json<{ content: string }>(article.contentR2Path);
            content = r2Payload.content || '';
          } catch (r2Err) {
            console.error(`Gagal mengunduh konten R2 (${article.contentR2Path}):`, r2Err);
          }
        }

        const cleanExcerpt = article.excerpt || (article.title ? article.title.slice(0, 100) : '');
        const imageUrl =
          article.bannerR2Url ||
          `${baseUrl}/api/admin/generate-image?title=${encodeURIComponent(
            article.title || ''
          )}&description=${encodeURIComponent(cleanExcerpt)}&icon=${encodeURIComponent(
            article.icon || '📖'
          )}&bg=${article.bg || '1'}`;

        return {
          id: String(article.id),
          title: article.title || '',
          category: article.category || 'Umum',
          published_at: article.createdAt || new Date().toISOString(),
          url: `${baseUrl}/blog/${article.id}`,
          image_url: imageUrl,
          excerpt: article.excerpt || '',
          content: content,
        };
      })
    );

    return NextResponse.json({
      source: 'Theta Indigo',
      total_articles: totalArticles,
      articles,
    });
  } catch (error: any) {
    console.error('Agregator API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Terjadi kesalahan server pada Agregator API' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  return handleAgregatorRequest(request);
}

export async function POST(request: Request) {
  return handleAgregatorRequest(request);
}
