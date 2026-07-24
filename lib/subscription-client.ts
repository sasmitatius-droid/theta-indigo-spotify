import { UserSubscriptionState } from './subscription';

export async function getUserSubscriptionState(
  userId: string,
  email?: string | null,
): Promise<UserSubscriptionState> {
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
    return {
      subscription: 'Tidak Ada',
      analysisRemaining: 1,
      analysesUsed: 0,
      canCreateAnalysis: true,
    };
  }
}
