import { NextResponse } from 'next/server';
import { getFirebaseAdminDb } from '@/lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { executeD1 } from '@/lib/cloudflare-db';
import { FULL_ADMIN_PERMISSIONS } from '@/lib/admin-permissions';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Missing token' }, { status: 401 });
  }

  const token = authHeader.substring(7);
  try {
    const adminDb = getFirebaseAdminDb();
    if (!adminDb) {
      return NextResponse.json({ error: 'Firebase Admin not configured' }, { status: 500 });
    }

    const decodedToken = await getAuth().verifyIdToken(token);
    const { uid, email } = decodedToken;

    const SUPER_ADMIN_EMAILS = ['tiuss168@gmail.com', 'admin@example.com'];
    if (!email || !SUPER_ADMIN_EMAILS.includes(email.toLowerCase())) {
      return NextResponse.json({ error: 'Not a super admin' }, { status: 403 });
    }

    const now = new Date().toISOString();
    
    // 1. Insert into admins
    await executeD1('INSERT INTO admins (id) VALUES (?) ON CONFLICT(id) DO NOTHING', [uid]);

    // 2. Insert into admin_users
    await executeD1(
      'INSERT INTO admin_users (email, permissions, createdAt) VALUES (?, ?, ?) ON CONFLICT(email) DO UPDATE SET permissions = ?',
      [email.toLowerCase(), JSON.stringify(FULL_ADMIN_PERMISSIONS), now, JSON.stringify(FULL_ADMIN_PERMISSIONS)]
    );

    // 3. Sync to users table as unlimited admin
    await executeD1(
      `INSERT INTO users (id, name, email, isAdmin, role, subscription, analysisUnlimited, analysisRemaining, updatedAt, createdAt) 
       VALUES (?, ?, ?, 1, 'admin', 'Admin — Unlimited', 1, NULL, ?, ?) 
       ON CONFLICT(id) DO UPDATE SET isAdmin = 1, role = 'admin', subscription = 'Admin — Unlimited', analysisUnlimited = 1, analysisRemaining = NULL, updatedAt = ?`,
      [uid, email, email.toLowerCase(), now, now, now]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Superadmin setup error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
