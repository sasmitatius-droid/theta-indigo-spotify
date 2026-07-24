import { NextResponse } from 'next/server';
import { executeD1, queryD1 } from '@/lib/cloudflare-db';
import { getFromR2Json, saveToR2Json, deleteFromR2 } from '@/lib/r2-client';
import { verifyAdminRequest } from '@/lib/ensure-admin';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const auth = await verifyAdminRequest(request);
  if (!auth.allowed) {
    return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.error?.includes('Forbidden') ? 403 : 401 });
  }

  try {
    const rows = await queryD1('SELECT * FROM blogs WHERE id = ?', [params.id]);
    const blog = rows[0];

    if (!blog) {
      return NextResponse.json({ error: 'Artikel tidak ditemukan.' }, { status: 404 });
    }

    let content = '';
    if (blog.contentR2Path) {
      try {
        const payload = await getFromR2Json<{ content: string }>(blog.contentR2Path);
        content = payload.content;
      } catch (err) {
        console.error('Failed to load content from R2:', err);
      }
    }

    return NextResponse.json({
      ...blog,
      content,
      published: blog.published === 1,
    });
  } catch (error: any) {
    console.error('GET /api/admin/blogs/[id] error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const auth = await verifyAdminRequest(request);
  if (!auth.allowed) {
    return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.error?.includes('Forbidden') ? 403 : 401 });
  }

  try {
    const body = await request.json();
    const { title, category, icon, bg, excerpt, content, published } = body;

    const rows = await queryD1('SELECT * FROM blogs WHERE id = ?', [params.id]);
    const blog = rows[0];

    if (!blog) {
      return NextResponse.json({ error: 'Artikel tidak ditemukan.' }, { status: 404 });
    }

    const r2Key = blog.contentR2Path || `blogs/${params.id}.json`;

    // 1. Update HTML content in R2
    if (content !== undefined) {
      await saveToR2Json(r2Key, { content });
    }

    // 2. Update D1 metadata
    const updatedAt = new Date().toISOString();
    await executeD1(
      `UPDATE blogs 
       SET title = COALESCE(?, title), 
           category = COALESCE(?, category), 
           icon = COALESCE(?, icon), 
           bg = COALESCE(?, bg), 
           excerpt = COALESCE(?, excerpt), 
           published = COALESCE(?, published), 
           status = ?, 
           contentR2Path = ?
       WHERE id = ?`,
      [
        title || null,
        category || null,
        icon || null,
        bg || null,
        excerpt || null,
        published === undefined ? null : (published ? 1 : 0),
        published === false ? 'draft' : 'published',
        r2Key,
        params.id,
      ]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('PUT /api/admin/blogs/[id] error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const auth = await verifyAdminRequest(request);
  if (!auth.allowed) {
    return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.error?.includes('Forbidden') ? 403 : 401 });
  }

  try {
    const rows = await queryD1('SELECT * FROM blogs WHERE id = ?', [params.id]);
    const blog = rows[0];

    if (blog) {
      // 1. Delete R2 content file
      if (blog.contentR2Path) {
        try {
          await deleteFromR2(blog.contentR2Path);
        } catch (err) {
          console.warn('Failed to delete file from R2:', err);
        }
      }

      // 2. Delete D1 row
      await executeD1('DELETE FROM blogs WHERE id = ?', [params.id]);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('DELETE /api/admin/blogs/[id] error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
