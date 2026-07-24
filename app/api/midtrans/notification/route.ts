import { NextResponse } from 'next/server';
import { executeD1, queryD1 } from '@/lib/cloudflare-db';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { order_id, transaction_status, fraud_status } = body;

    if (!order_id) {
      return NextResponse.json({ error: 'Order ID tidak ditemukan.' }, { status: 400 });
    }

    const rows = await queryD1('SELECT * FROM transactions WHERE orderId = ?', [order_id]);
    const txData = rows[0];

    if (!txData) {
      return NextResponse.json({ error: 'Transaksi tidak terdaftar di database.' }, { status: 404 });
    }

    let updatedStatus = 'pending';

    if (transaction_status === 'capture') {
      if (fraud_status === 'challenge') {
        updatedStatus = 'challenge';
      } else if (fraud_status === 'accept') {
        updatedStatus = 'success';
      }
    } else if (transaction_status === 'settlement') {
      updatedStatus = 'success';
    } else if (transaction_status === 'cancel' || transaction_status === 'deny' || transaction_status === 'expire') {
      updatedStatus = 'failed';
    } else if (transaction_status === 'pending') {
      updatedStatus = 'pending';
    }

    const now = new Date().toISOString();

    await executeD1('UPDATE transactions SET status = ?, updatedAt = ? WHERE orderId = ?', [
      updatedStatus,
      now,
      order_id,
    ]);

    if (updatedStatus === 'success' && txData.userId) {
      const durationDays = Number(txData.durationDays) || 30;
      const expires = new Date();
      expires.setDate(expires.getDate() + durationDays);

      const unlimited = txData.unlimited === 1 || txData.analysisQuota === null;
      const quota = unlimited ? null : Number(txData.analysisQuota) || 0;

      await executeD1(
        `INSERT INTO users (id, subscription, packageId, analysisRemaining, analysisUnlimited, subscriptionExpiresAt, updatedAt) 
         VALUES (?, ?, ?, ?, ?, ?, ?) 
         ON CONFLICT(id) DO UPDATE SET 
           subscription = ?, 
           packageId = ?, 
           analysisRemaining = ?, 
           analysisUnlimited = ?, 
           subscriptionExpiresAt = ?, 
           updatedAt = ?`,
        [
          String(txData.userId),
          txData.packageName || 'Premium',
          txData.packageId,
          quota,
          unlimited ? 1 : 0,
          expires.toISOString(),
          now,
          txData.packageName || 'Premium',
          txData.packageId,
          quota,
          unlimited ? 1 : 0,
          expires.toISOString(),
          now,
        ]
      );
    }

    return NextResponse.json({ message: 'Status transaksi berhasil diperbarui.' }, { status: 200 });
  } catch (error: any) {
    console.error('⚠️ FATAL ERROR PADA RUTE API MIDTRANS NOTIFICATION:', error.message || error);
    return NextResponse.json({ error: error.message || 'Gagal memproses notifikasi.' }, { status: 500 });
  }
}
