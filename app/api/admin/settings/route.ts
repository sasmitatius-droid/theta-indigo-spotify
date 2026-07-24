import { NextResponse } from 'next/server';
import { executeD1, queryD1 } from '@/lib/cloudflare-db';
import { verifyAdminRequest } from '@/lib/ensure-admin';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const auth = await verifyAdminRequest(request);
  if (!auth.allowed) {
    return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.error?.includes('Forbidden') ? 403 : 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    if (!key) {
      return NextResponse.json({ error: 'Key required' }, { status: 400 });
    }

    const rows = await queryD1('SELECT value FROM settings WHERE key = ?', [key]);
    const val = rows[0]?.value ? JSON.parse(rows[0].value) : null;
    return NextResponse.json({ value: val });
  } catch (error: any) {
    console.error('GET /api/admin/settings error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await verifyAdminRequest(request);
  if (!auth.allowed) {
    return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.error?.includes('Forbidden') ? 403 : 401 });
  }

  try {
    const { key, value } = await request.json();
    if (!key) {
      return NextResponse.json({ error: 'Key required' }, { status: 400 });
    }

    await executeD1(
      'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = ?',
      [key, JSON.stringify(value), JSON.stringify(value)]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('POST /api/admin/settings error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
