import { NextResponse } from 'next/server';
import { queryD1 } from '@/lib/cloudflare-db';
import { verifyAdminRequest } from '@/lib/ensure-admin';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const auth = await verifyAdminRequest(request);
  if (!auth.allowed) {
    return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.error?.includes('Forbidden') ? 403 : 401 });
  }

  try {
    const users = await queryD1(
      'SELECT id, name, email, subscription, analysisRemaining, analysesUsed, isAdmin, role FROM users ORDER BY name ASC'
    );
    return NextResponse.json(users);
  } catch (error: any) {
    console.error('GET /api/admin/users error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
