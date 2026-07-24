import { NextResponse } from 'next/server';
import { verifyAdminRequest } from '@/lib/ensure-admin';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const auth = await verifyAdminRequest(request);
    return NextResponse.json({ allowed: auth.allowed });
  } catch (error: any) {
    console.error('GET /api/admin/verify error:', error);
    return NextResponse.json({ allowed: false, error: error.message }, { status: 500 });
  }
}
