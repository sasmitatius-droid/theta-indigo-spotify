import { NextResponse } from 'next/server';
import { executeD1 } from '@/lib/cloudflare-db';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { userId, email, name } = await request.json();
    if (!userId) {
      return NextResponse.json({ error: 'userId wajib disertakan.' }, { status: 400 });
    }

    const now = new Date().toISOString();
    await executeD1(
      `INSERT INTO users (id, email, name, createdAt, updatedAt) 
       VALUES (?, ?, ?, ?, ?) 
       ON CONFLICT(id) DO UPDATE SET email = ?, name = ?, updatedAt = ?`,
      [userId, email || '', name || '', now, now, email || '', name || '', now]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('POST /api/user/sync error:', error);
    return NextResponse.json({ error: error.message || 'Gagal menyinkronkan data pengguna.' }, { status: 500 });
  }
}
