import { NextResponse } from 'next/server';
import { queryD1, executeD1 } from '@/lib/cloudflare-db';
import { verifyAdminRequest } from '@/lib/ensure-admin';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const auth = await verifyAdminRequest(request);
    if (!auth.allowed) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }

    const { userId, packageId, packageName, durationDays, quota, unlimited } = await request.json();


    if (!userId) {
      return NextResponse.json({ error: 'userId wajib diisi.' }, { status: 400 });
    }

    const now = new Date();
    const expiresAt = durationDays
      ? new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000).toISOString()
      : null;

    await executeD1(
      `UPDATE users SET 
        subscription = ?,
        packageId = ?,
        analysisRemaining = ?,
        analysisUnlimited = ?,
        subscriptionExpiresAt = ?,
        updatedAt = ?
       WHERE id = ?`,
      [
        packageName || 'Premium (Manual)',
        packageId || 'manual',
        unlimited ? null : (quota || 10),
        unlimited ? 1 : 0,
        expiresAt,
        now.toISOString(),
        userId,
      ]
    );

    return NextResponse.json({
      success: true,
      message: `Premium berhasil diberikan ke user ${userId}`,
      expiresAt,
    });
  } catch (err: any) {
    console.error('Grant premium error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = await verifyAdminRequest(request);
    if (!auth.allowed) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }

    const { userId } = await request.json();

    if (!userId) return NextResponse.json({ error: 'userId wajib.' }, { status: 400 });

    await executeD1(
      `UPDATE users SET 
        subscription = 'Tidak Ada',
        packageId = NULL,
        analysisRemaining = 1,
        analysisUnlimited = 0,
        subscriptionExpiresAt = NULL,
        updatedAt = ?
       WHERE id = ?`,
      [new Date().toISOString(), userId]
    );

    return NextResponse.json({ success: true, message: 'Premium dicabut.' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
