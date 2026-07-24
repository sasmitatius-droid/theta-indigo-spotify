import { NextResponse } from 'next/server';
import { executeD1 } from '@/lib/cloudflare-db';
import { verifyAdminRequest } from '@/lib/ensure-admin';

export const dynamic = 'force-dynamic';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const auth = await verifyAdminRequest(request);
  if (!auth.allowed) {
    return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.error?.includes('Forbidden') ? 403 : 401 });
  }

  const email = decodeURIComponent(params.id).toLowerCase();

  try {
    const { permissions } = await request.json();
    if (!permissions) {
      return NextResponse.json({ error: 'Permissions required' }, { status: 400 });
    }

    await executeD1('UPDATE admin_users SET permissions = ? WHERE email = ?', [
      JSON.stringify(permissions),
      email,
    ]);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('PUT /api/admin/admins/[id] error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const auth = await verifyAdminRequest(request);
  if (!auth.allowed) {
    return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.error?.includes('Forbidden') ? 403 : 401 });
  }

  const email = decodeURIComponent(params.id).toLowerCase();

  try {
    await executeD1('DELETE FROM admin_users WHERE email = ?', [email]);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('DELETE /api/admin/admins/[id] error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
