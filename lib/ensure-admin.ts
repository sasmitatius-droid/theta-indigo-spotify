import { getFirebaseAdminDb } from './firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { queryD1 } from './cloudflare-db';

export async function verifyAdminRequest(
  request: Request,
): Promise<{ allowed: boolean; uid?: string; email?: string; error?: string }> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { allowed: false, error: 'Unauthorized: Missing token' };
  }

  const token = authHeader.substring(7);
  try {
    const adminDb = getFirebaseAdminDb();
    if (!adminDb) {
      return { allowed: false, error: 'Firebase Admin SDK not configured' };
    }

    const decodedToken = await getAuth().verifyIdToken(token);
    const { uid, email } = decodedToken;

    // Check if super admin
    const SUPER_ADMIN_EMAILS = ['tiuss168@gmail.com', 'admin@example.com'];
    if (email && SUPER_ADMIN_EMAILS.includes(email.toLowerCase())) {
      return { allowed: true, uid, email };
    }

    // Check D1 admins table
    const adminRows = await queryD1('SELECT id FROM admins WHERE id = ?', [uid]);
    if (adminRows.length > 0) {
      return { allowed: true, uid, email };
    }

    // Check D1 admin_users table
    if (email) {
      const adminUserRows = await queryD1('SELECT email FROM admin_users WHERE email = ?', [
        email.toLowerCase(),
      ]);
      if (adminUserRows.length > 0) {
        return { allowed: true, uid, email };
      }
    }

    return { allowed: false, error: 'Forbidden: Not an admin' };
  } catch (error: any) {
    console.error('Error verifying admin request:', error);
    return { allowed: false, error: `Unauthorized: ${error.message}` };
  }
}
