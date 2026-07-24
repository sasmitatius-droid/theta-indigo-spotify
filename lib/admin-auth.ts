import type { User } from 'firebase/auth';
import {
  type AdminPermissions,
  DEFAULT_LIMITED_PERMISSIONS,
  FULL_ADMIN_PERMISSIONS,
} from '@/lib/admin-permissions';
import { queryD1 } from '@/lib/cloudflare-db';

export const SUPER_ADMIN_EMAILS = ['tiuss168@gmail.com', 'admin@example.com'];

export function isSuperAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return SUPER_ADMIN_EMAILS.includes(email.toLowerCase());
}

export async function resolveAdminAccess(
  user: User,
): Promise<{ allowed: boolean; permissions: AdminPermissions; error?: string }> {
  if (!user.email) {
    return { allowed: false, permissions: DEFAULT_LIMITED_PERMISSIONS };
  }

  if (isSuperAdminEmail(user.email)) {
    return { allowed: true, permissions: FULL_ADMIN_PERMISSIONS };
  }

  // Client-side execution
  if (typeof window !== 'undefined') {
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/admin/verify', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error('API failed');
      const data = await res.json();
      return {
        allowed: data.allowed,
        permissions: data.allowed ? FULL_ADMIN_PERMISSIONS : DEFAULT_LIMITED_PERMISSIONS,
      };
    } catch (err: any) {
      console.error('Client-side resolveAdminAccess error:', err);
      return { allowed: false, permissions: DEFAULT_LIMITED_PERMISSIONS, error: err.message };
    }
  }

  // Server-side D1 Database execution
  try {
    const adminRows = await queryD1('SELECT id FROM admins WHERE id = ?', [user.uid]);
    if (adminRows.length > 0) {
      return { allowed: true, permissions: FULL_ADMIN_PERMISSIONS };
    }
  } catch (err) {
    console.warn('Gagal membaca admins D1:', err);
  }

  try {
    const emailRows = await queryD1('SELECT email, permissions FROM admin_users WHERE email = ?', [
      user.email.toLowerCase(),
    ]);
    if (emailRows.length > 0) {
      const data = emailRows[0];
      let perms = { ...DEFAULT_LIMITED_PERMISSIONS };
      if (data.permissions) {
        try {
          perms = JSON.parse(data.permissions);
        } catch {
          // Ignore
        }
      }
      return {
        allowed: true,
        permissions: perms,
      };
    }
  } catch (err) {
    console.warn('Gagal membaca admin_users D1:', err);
    return {
      allowed: false,
      permissions: DEFAULT_LIMITED_PERMISSIONS,
      error: 'Izin D1 ditolak.',
    };
  }

  return { allowed: false, permissions: DEFAULT_LIMITED_PERMISSIONS };
}
