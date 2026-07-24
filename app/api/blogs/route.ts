import { NextResponse } from 'next/server';
import { queryD1 } from '@/lib/cloudflare-db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const rows = await queryD1(
      'SELECT id, title, excerpt, category, icon, bg, createdAt, tags, COALESCE(views, 0) as views FROM blogs WHERE published = 1 ORDER BY createdAt DESC'
    );
    const blogs = rows.map((r: any) => {
      let tags: string[] = [];
      if (r.tags) {
        try { tags = JSON.parse(r.tags); } catch { /* ignore */ }
      }
      return { ...r, tags };
    });
    return NextResponse.json(blogs);
  } catch (error: any) {

    console.error('GET /api/blogs error:', error);
    return NextResponse.json({ error: error.message || 'Gagal mengambil artikel.' }, { status: 500 });
  }
}
