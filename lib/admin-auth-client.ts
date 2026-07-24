import type { User } from 'firebase/auth';
import {
  type AdminPermissions,
  DEFAULT_LIMITED_PERMISSIONS,
  FULL_ADMIN_PERMISSIONS,
} from '@/lib/admin-permissions';

export async function ensureSuperAdminSetup(user: User): Promise<void> {
  const SUPER_ADMIN_EMAILS = ['tiuss168@gmail.com', 'admin@example.com'];
  if (!user.email || !SUPER_ADMIN_EMAILS.includes(user.email.toLowerCase())) return;

  try {
    const token = await (user as any).getIdToken();
    await fetch('/api/admin/setup-superadmin', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (err) {
    console.error('Failed to sync super admin setup to D1:', err);
  }
}

export async function resolveAdminAccess(
  user: User,
): Promise<{ allowed: boolean; permissions: AdminPermissions; error?: string }> {
  if (!user.email) {
    return { allowed: false, permissions: DEFAULT_LIMITED_PERMISSIONS };
  }

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
