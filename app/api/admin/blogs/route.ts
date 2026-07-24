import { NextResponse } from 'next/server';
import { executeD1, queryD1 } from '@/lib/cloudflare-db';
import { saveToR2Json } from '@/lib/r2-client';
import { verifyAdminRequest } from '@/lib/ensure-admin';
import { generateId } from '@/lib/utils';
import { shareToFacebookPage } from '@/lib/facebook-share';
import { sendTelegramReport } from '@/lib/telegram-report';

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

export async function GET(request: Request) {
  const auth = await verifyAdminRequest(request);
  if (!auth.allowed) {
    return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.error?.includes('Forbidden') ? 403 : 401 });
  }

  try {
    const blogs = await queryD1('SELECT * FROM blogs ORDER BY createdAt DESC');
    return NextResponse.json(blogs);
  } catch (error: any) {
    console.error('GET /api/admin/blogs error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await verifyAdminRequest(request);
  if (!auth.allowed) {
    return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.error?.includes('Forbidden') ? 403 : 401 });
  }

  try {
    const body = await request.json();
    const { title, category, icon, bg, excerpt, content, published } = body;

    if (!title || !content) {
      return NextResponse.json({ error: 'Judul dan konten wajib diisi.' }, { status: 400 });
    }

    const id = generateId();
    const slug = `${slugify(title)}-${id.slice(0, 5)}`;
    const r2Key = `blogs/${id}.json`;

    // 1. Save HTML content payload in R2
    await saveToR2Json(r2Key, { content });

    // 2. Save metadata in D1
    const createdAt = new Date().toISOString();
    await executeD1(
      `INSERT INTO blogs (id, title, slug, category, excerpt, icon, bg, published, status, createdAt, contentR2Path) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        title,
        slug,
        category || 'Umum',
        excerpt || title.slice(0, 100),
        icon || '📖',
        bg || '1',
        published === false ? 0 : 1,
        published === false ? 'draft' : 'published',
        createdAt,
        r2Key,
      ]
    );

    // 3. Trigger Facebook share & Telegram report if published
    let fbStatus = 'Disabled / Skip';
    if (published !== false) {
      const bannerUrl = `https://www.indigoblueprint.my.id/api/admin/generate-image?title=${encodeURIComponent(
        title
      )}&description=${encodeURIComponent(excerpt || title)}&icon=${encodeURIComponent(icon || '📖')}&bg=${bg || '1'}`;

      try {
        const fbRes = await shareToFacebookPage({
          title,
          excerpt: excerpt || title.slice(0, 100),
          bannerUrl,
          articleId: id,
        });
        fbStatus = fbRes.success ? 'Success' : `Failed: ${fbRes.error}`;
      } catch (fbErr: any) {
        fbStatus = `Error: ${fbErr.message}`;
      }

      try {
        // Fetch users count for newsletter simulation report
        const usersCountRow = await queryD1('SELECT COUNT(id) as count FROM users');
        const count = usersCountRow[0]?.count || 0;

        await sendTelegramReport({
          title,
          category: category || 'Umum',
          fbStatus,
          newsletterCount: count,
        });
      } catch (tgErr) {
        console.error('Telegram report failed:', tgErr);
      }
    }

    return NextResponse.json({ success: true, id, slug });
  } catch (error: any) {
    console.error('POST /api/admin/blogs error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
