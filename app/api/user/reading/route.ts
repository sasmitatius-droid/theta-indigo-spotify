import { NextResponse } from 'next/server';
import { executeD1, queryD1 } from '@/lib/cloudflare-db';
import { saveToR2Json } from '@/lib/r2-client';
import { getUserSubscriptionState, isAdminUnlimitedAnalysis } from '@/lib/subscription';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId diperlukan.' }, { status: 400 });
    }

    const readings = await queryD1(
      'SELECT * FROM user_readings WHERE userId = ? ORDER BY createdAt DESC',
      [userId]
    );

    return NextResponse.json(readings);
  } catch (error: any) {
    console.error('GET /api/user/reading error:', error);
    return NextResponse.json({ error: error.message || 'Gagal mengambil riwayat pembacaan.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const { id, userId } = payload;

    if (!id || !userId) {
      return NextResponse.json({ error: 'Data reading tidak lengkap.' }, { status: 400 });
    }

    // 1. Save content payload in R2
    const r2Key = `readings/${id}.json`;
    try {
      await saveToR2Json(r2Key, payload);
    } catch (r2Err) {
      console.warn('R2 save warning:', r2Err);
    }

    // 2. Save metadata in D1 user_readings
    const createdAt = new Date().toISOString();
    const blueprintId = payload.blueprintId || `TIB-${id.slice(0, 8)}`;
    const userName = payload.input?.name || 'Pengguna';
    const birthData = JSON.stringify(payload.input || {});

    try {
      await executeD1(
        'INSERT INTO user_readings (id, userId, blueprintId, userName, birthData, resultJsonR2Path, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [id, userId, blueprintId, userName, birthData, r2Key, createdAt]
      );
    } catch (d1Err) {
      console.warn('D1 user_readings insert warning:', d1Err);
    }

    // 3. Increment usage if user is authenticated (not guest)
    if (userId !== 'guest') {
      try {
        const isAdmin = await isAdminUnlimitedAnalysis(userId, undefined);
        if (!isAdmin) {
          const sub = await getUserSubscriptionState(userId, undefined);
          if (sub.analysisRemaining !== null) {
            const remaining = Math.max(0, sub.analysisRemaining - 1);
            await executeD1(
              'INSERT INTO users (id, analysesUsed, analysisRemaining, updatedAt) VALUES (?, 1, ?, ?) ON CONFLICT(id) DO UPDATE SET analysesUsed = analysesUsed + 1, analysisRemaining = ?, updatedAt = ?',
              [userId, remaining, createdAt, remaining, createdAt]
            );
          } else {
            await executeD1(
              'INSERT INTO users (id, analysesUsed, updatedAt) VALUES (?, 1, ?) ON CONFLICT(id) DO UPDATE SET analysesUsed = analysesUsed + 1, updatedAt = ?',
              [userId, createdAt, createdAt]
            );
          }
        }
      } catch (usageErr) {
        console.warn('D1 user usage update warning:', usageErr);
      }
    }

    return NextResponse.json({ success: true, id, blueprintId, r2Key });
  } catch (error: any) {
    console.error('POST /api/user/reading error:', error);
    return NextResponse.json({ error: error.message || 'Gagal menyimpan hasil pembacaan.' }, { status: 500 });
  }
}
