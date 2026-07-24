import { NextResponse } from 'next/server';
import { executeD1 } from '@/lib/cloudflare-db';
import { verifyAdminRequest } from '@/lib/ensure-admin';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const auth = await verifyAdminRequest(request);
  if (!auth.allowed) {
    return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.error?.includes('Forbidden') ? 403 : 401 });
  }

  try {
    const { userId, subscription, analysisRemaining, analysisUnlimited, packageId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'userId wajib disertakan.' }, { status: 400 });
    }

    const now = new Date().toISOString();
    await executeD1(
      `UPDATE users 
       SET subscription = ?, 
           analysisRemaining = ?, 
           analysisUnlimited = ?, 
           packageId = ?,
           updatedAt = ? 
       WHERE id = ?`,
      [
        subscription || 'Tidak Ada',
        analysisRemaining === null || analysisRemaining === undefined ? null : Number(analysisRemaining),
        analysisUnlimited ? 1 : 0,
        packageId || null,
        now,
        userId
      ]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('POST /api/admin/users/update-package error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
