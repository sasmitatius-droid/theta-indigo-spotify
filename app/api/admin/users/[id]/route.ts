import { NextResponse } from 'next/server';
import { executeD1 } from '@/lib/cloudflare-db';
import { verifyAdminRequest } from '@/lib/ensure-admin';

export const dynamic = 'force-dynamic';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const auth = await verifyAdminRequest(request);
  if (!auth.allowed) {
    return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.error?.includes('Forbidden') ? 403 : 401 });
  }

  try {
    const { name } = await request.json();
    if (!name) {
      return NextResponse.json({ error: 'Nama wajib diisi' }, { status: 400 });
    }

    await executeD1('UPDATE users SET name = ?, updatedAt = ? WHERE id = ?', [
      name,
      new Date().toISOString(),
      params.id,
    ]);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('PUT /api/admin/users/[id] error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const auth = await verifyAdminRequest(request);
  if (!auth.allowed) {
    return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.error?.includes('Forbidden') ? 403 : 401 });
  }

  try {
    await executeD1('DELETE FROM users WHERE id = ?', [params.id]);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('DELETE /api/admin/users/[id] error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
