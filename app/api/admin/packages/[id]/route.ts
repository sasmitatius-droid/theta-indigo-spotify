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
    const body = await request.json();
    const { name, price, analysisQuota, durationDays, unlimited, features } = body;

    await executeD1(
      `UPDATE packages 
       SET name = ?, 
           price = ?, 
           analysisQuota = ?, 
           durationDays = ?, 
           unlimited = ?, 
           features = ? 
       WHERE id = ?`,
      [
        name,
        Number(price) || 0,
        unlimited ? null : (analysisQuota === '' || analysisQuota === null ? null : Number(analysisQuota)),
        Number(durationDays) || 30,
        unlimited ? 1 : 0,
        JSON.stringify(Array.isArray(features) ? features : []),
        params.id,
      ]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('PUT /api/admin/packages/[id] error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const auth = await verifyAdminRequest(request);
  if (!auth.allowed) {
    return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.error?.includes('Forbidden') ? 403 : 401 });
  }

  try {
    await executeD1('DELETE FROM packages WHERE id = ?', [params.id]);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('DELETE /api/admin/packages/[id] error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
