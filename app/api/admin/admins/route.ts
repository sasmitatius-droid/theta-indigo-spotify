import { NextResponse } from 'next/server';
import { executeD1, queryD1 } from '@/lib/cloudflare-db';
import { verifyAdminRequest } from '@/lib/ensure-admin';
import { DEFAULT_LIMITED_PERMISSIONS, FULL_ADMIN_PERMISSIONS } from '@/lib/admin-permissions';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const auth = await verifyAdminRequest(request);
  if (!auth.allowed) {
    return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.error?.includes('Forbidden') ? 403 : 401 });
  }

  try {
    const adminUsers = await queryD1('SELECT * FROM admin_users ORDER BY email ASC');
    const mapped = adminUsers.map((a) => {
      let parsedPerms = { ...DEFAULT_LIMITED_PERMISSIONS };
      if (a.permissions) {
        try {
          parsedPerms = JSON.parse(a.permissions);
        } catch {
          // Ignore
        }
      }
      return {
        id: a.email, // Use email as identifier in UI
        email: a.email,
        permissions: parsedPerms,
        createdAt: a.createdAt,
      };
    });
    return NextResponse.json(mapped);
  } catch (error: any) {
    console.error('GET /api/admin/admins error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await verifyAdminRequest(request);
  if (!auth.allowed) {
    return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.error?.includes('Forbidden') ? 403 : 401 });
  }

  try {
    const { email, isFullAdmin, permissions } = await request.json();
    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Email tidak valid.' }, { status: 400 });
    }

    const selectedPermissions = permissions || (isFullAdmin ? FULL_ADMIN_PERMISSIONS : DEFAULT_LIMITED_PERMISSIONS);
    const now = new Date().toISOString();
    
    await executeD1(
      `INSERT INTO admin_users (email, permissions, createdAt) 
       VALUES (?, ?, ?) 
       ON CONFLICT(email) DO UPDATE SET permissions = ?`,
      [email.toLowerCase(), JSON.stringify(selectedPermissions), now, JSON.stringify(selectedPermissions)]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('POST /api/admin/admins error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
