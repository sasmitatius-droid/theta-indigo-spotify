import { NextResponse } from 'next/server';
import { queryD1 } from '@/lib/cloudflare-db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Total stats
    const [totalBlogs, totalUsers, totalTransactions, premiumUsers] = await Promise.all([
      queryD1<{ count: number }>('SELECT COUNT(*) as count FROM blogs'),
      queryD1<{ count: number }>('SELECT COUNT(*) as count FROM users'),
      queryD1<{ total: number }>('SELECT COALESCE(SUM(CAST(amount AS REAL)),0) as total FROM transactions WHERE status = "settlement"'),
      queryD1<{ count: number }>('SELECT COUNT(*) as count FROM users WHERE subscription != "Tidak Ada" AND subscription IS NOT NULL AND (subscriptionExpiresAt IS NULL OR subscriptionExpiresAt > datetime("now"))'),
    ]);

    // Blogs today
    const blogsToday = await queryD1<{ count: number }>(
      'SELECT COUNT(*) as count FROM blogs WHERE date(createdAt) = date("now")'
    );

    // Blogs per category
    const blogsPerCategory = await queryD1<{ category: string; count: number }>(
      'SELECT category, COUNT(*) as count FROM blogs GROUP BY category ORDER BY count DESC LIMIT 15'
    );

    // Recent 10 articles
    const recentBlogs = await queryD1<{ id: string; title: string; category: string; createdAt: string; generatorSource: string; views: number }>(
      'SELECT id, title, category, createdAt, generatorSource, COALESCE(views, 0) as views FROM blogs ORDER BY createdAt DESC LIMIT 10'
    );

    // Recent transactions
    const recentTransactions = await queryD1<{ id: string; userId: string; amount: number; status: string; createdAt: string }>(
      'SELECT id, userId, amount, status, createdAt FROM transactions ORDER BY createdAt DESC LIMIT 10'
    ).catch(() => []);

    // Premium users list
    const premiumUsersList = await queryD1<{ id: string; name: string; email: string; subscription: string; subscriptionExpiresAt: string }>(
      'SELECT id, name, email, subscription, subscriptionExpiresAt FROM users WHERE subscription != "Tidak Ada" AND subscription IS NOT NULL ORDER BY subscriptionExpiresAt DESC LIMIT 20'
    );

    // Cron activity (last 7 days from blogs with generatorSource)
    const cronActivity = await queryD1<{ date: string; count: number }>(
      'SELECT date(createdAt) as date, COUNT(*) as count FROM blogs WHERE createdAt >= datetime("now", "-7 days") GROUP BY date(createdAt) ORDER BY date DESC'
    );

    return NextResponse.json({
      totalBlogs: totalBlogs[0]?.count || 0,
      totalUsers: totalUsers[0]?.count || 0,
      totalRevenue: totalTransactions[0]?.total || 0,
      premiumUsers: premiumUsers[0]?.count || 0,
      blogsToday: blogsToday[0]?.count || 0,
      blogsPerCategory,
      recentBlogs,
      recentTransactions,
      premiumUsersList,
      cronActivity,
    });
  } catch (err: any) {
    console.error('Stats API error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
