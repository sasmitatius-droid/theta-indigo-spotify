import { NextResponse } from 'next/server';
import { getUserSubscriptionState } from '@/lib/subscription';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const email = searchParams.get('email');

    if (!userId) {
      return NextResponse.json({ error: 'userId wajib disertakan.' }, { status: 400 });
    }

    const state = await getUserSubscriptionState(userId, email);
    return NextResponse.json(state);
  } catch (error: any) {
    console.error('GET /api/user/subscription error:', error);
    return NextResponse.json({ error: error.message || 'Gagal memproses request.' }, { status: 500 });
  }
}
