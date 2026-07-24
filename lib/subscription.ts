import { isSuperAdminEmail } from '@/lib/admin-auth';
import { queryD1 } from '@/lib/cloudflare-db';

export interface UserSubscriptionState {
  subscription: string;
  packageId?: string;
  analysisRemaining: number | null;
  analysesUsed: number;
  subscriptionExpiresAt?: Date;
  canCreateAnalysis: boolean;
  reason?: string;
}

const FREE_TRIAL_ANALYSES = 1;

/** Admin panel & super admin: analisis tanpa batas di dashboard */
export async function isAdminUnlimitedAnalysis(
  userId: string,
  email: string | null | undefined,
): Promise<boolean> {
  if (isSuperAdminEmail(email)) return true;

  try {
    const adminRows = await queryD1('SELECT id FROM admins WHERE id = ?', [userId]);
    if (adminRows.length > 0) return true;
  } catch (err) {
    console.warn('Gagal membaca admins D1:', err);
  }

  if (email) {
    try {
      const adminUserRows = await queryD1('SELECT email FROM admin_users WHERE email = ?', [
        email.toLowerCase(),
      ]);
      if (adminUserRows.length > 0) return true;
    } catch (err) {
      console.warn('Gagal membaca admin_users D1:', err);
    }
  }

  return false;
}

export async function getUserSubscriptionState(
  userId: string,
  email?: string | null,
): Promise<UserSubscriptionState> {
  // If running in browser, fetch from the API route instead of direct D1 query
  if (typeof window !== 'undefined') {
    try {
      const res = await fetch(
        `/api/user/subscription?userId=${encodeURIComponent(userId)}&email=${encodeURIComponent(
          email || '',
        )}`,
      );
      if (!res.ok) {
        throw new Error('Gagal memuat status langganan dari API');
      }
      const data = await res.json();
      return {
        ...data,
        subscriptionExpiresAt: data.subscriptionExpiresAt
          ? new Date(data.subscriptionExpiresAt)
          : undefined,
      } as UserSubscriptionState;
    } catch (err) {
      console.error('Client-side getUserSubscriptionState error:', err);
      // fallback
      return {
        subscription: 'Tidak Ada',
        analysisRemaining: FREE_TRIAL_ANALYSES,
        analysesUsed: 0,
        canCreateAnalysis: true,
      };
    }
  }

  // Server-side execution: D1 Database queries
  if (await isAdminUnlimitedAnalysis(userId, email)) {
    return {
      subscription: 'Admin — Unlimited',
      analysisRemaining: null,
      analysesUsed: 0,
      canCreateAnalysis: true,
    };
  }

  let data: any = {};
  try {
    const rows = await queryD1('SELECT * FROM users WHERE id = ?', [userId]);
    if (rows && rows.length > 0) {
      data = rows[0];
    }
  } catch (err) {
    console.error('Failed to get user from D1:', err);
  }

  const isAdmin = data.isAdmin === 1 || data.role === 'admin';
  const analysisUnlimited = data.analysisUnlimited === 1 || data.analysisRemaining === null;

  if (isAdmin || analysisUnlimited || data.subscription === 'Admin — Unlimited') {
    return {
      subscription: data.subscription || 'Admin — Unlimited',
      packageId: data.packageId || undefined,
      analysisRemaining: null,
      analysesUsed: Number(data.analysesUsed) || 0,
      canCreateAnalysis: true,
    };
  }

  const subscription = data.subscription || 'Tidak Ada';
  const analysesUsed = Number(data.analysesUsed) || 0;
  const expiresAt = data.subscriptionExpiresAt ? new Date(data.subscriptionExpiresAt) : undefined;

  if (subscription === 'Tidak Ada' || !data.subscription) {
    const remaining = Math.max(0, FREE_TRIAL_ANALYSES - analysesUsed);
    return {
      subscription: 'Tidak Ada',
      analysisRemaining: remaining,
      analysesUsed,
      canCreateAnalysis: remaining > 0,
      reason: remaining <= 0 ? 'Kuota demo habis. Beli paket untuk melanjutkan analisis.' : undefined,
    };
  }

  if (expiresAt && expiresAt < new Date()) {
    return {
      subscription,
      packageId: data.packageId || undefined,
      analysisRemaining: 0,
      analysesUsed,
      subscriptionExpiresAt: expiresAt,
      canCreateAnalysis: false,
      reason: 'Langganan Anda telah berakhir. Perpanjang paket untuk melanjutkan.',
    };
  }

  const remaining = analysisUnlimited ? null : Math.max(0, Number(data.analysisRemaining) || 0);

  if (!analysisUnlimited && (remaining === null || remaining <= 0)) {
    return {
      subscription,
      packageId: data.packageId || undefined,
      analysisRemaining: 0,
      analysesUsed,
      subscriptionExpiresAt: expiresAt,
      canCreateAnalysis: false,
      reason: 'Kuota analisis paket Anda habis. Upgrade atau beli paket baru.',
    };
  }

  return {
    subscription,
    packageId: data.packageId || undefined,
    analysisRemaining: remaining,
    analysesUsed,
    subscriptionExpiresAt: expiresAt,
    canCreateAnalysis: true,
  };
}
