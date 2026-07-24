import { NextResponse } from 'next/server';
import { executeD1 } from '@/lib/cloudflare-db';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    if (!serverKey) {
      return NextResponse.json({ error: 'MIDTRANS_SERVER_KEY belum diatur.' }, { status: 500 });
    }

    const body = await request.json();
    const { packageId, packageName, price, userId, email, name, analysisQuota, durationDays, unlimited } = body;

    if (!packageId || !packageName || !price || !userId || !email) {
      return NextResponse.json({ error: 'Data transaksi tidak lengkap.' }, { status: 400 });
    }

    const orderId = `THETA-${Date.now()}-${String(userId).slice(0, 8)}`;
    const amount = Number(price);
    const appOrigin = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
    
    const isSandbox = serverKey.startsWith('SB-');
    const MIDTRANS_SNAP_URL = isSandbox
      ? 'https://app.sandbox.midtrans.com/snap/v1/transactions'
      : 'https://app.midtrans.com/snap/v1/transactions';

    const midtransPayload = {
      transaction_details: { order_id: orderId, gross_amount: amount },
      item_details: [{ id: packageId, price: amount, quantity: 1, name: packageName }],
      customer_details: { first_name: name || email, email },
      callbacks: { finish: `${appOrigin}/dashboard?tab=premium` },
    };

    const response = await fetch(MIDTRANS_SNAP_URL, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(`${serverKey}:`).toString('base64')}`,
      },
      body: JSON.stringify(midtransPayload),
    });

    const payload = await response.json();
    if (!response.ok) {
      console.error('Midtrans API Error:', payload);
      return NextResponse.json({ error: payload.error_messages?.[0] || 'Midtrans menolak transaksi.' }, { status: response.status });
    }

    const result = { token: payload.token, redirectUrl: payload.redirect_url, orderId };

    // Save transaction metadata to D1
    try {
      const now = new Date().toISOString();
      await executeD1(
        `INSERT INTO transactions (orderId, packageId, packageName, price, userId, email, analysisQuota, durationDays, unlimited, status, snapToken, redirectUrl, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          orderId,
          packageId,
          packageName,
          amount,
          userId,
          email,
          unlimited ? null : Number(analysisQuota ?? 0),
          Number(durationDays) || 30,
          unlimited ? 1 : 0,
          'created',
          payload.token,
          payload.redirect_url,
          now,
          now,
        ]
      );
    } catch (dbError) {
      console.error('Gagal menyimpan transaksi ke D1:', dbError);
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('⚠️ FATAL ERROR PADA RUTE API MIDTRANS CREATE:', error.message || error);
    return NextResponse.json({ error: error.message || 'Gagal membuat transaksi.' }, { status: 500 });
  }
}