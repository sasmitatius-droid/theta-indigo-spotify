import type { Metadata } from 'next';
import { queryD1 } from '@/lib/cloudflare-db';

const BASE_URL = 'https://www.indigoblueprint.my.id';

export const dynamic = 'force-dynamic';

export default async function sitemap() {
  // Base routes dengan priority yang tepat
  const routes = [
    { url: `${BASE_URL}/`, lastModified: new Date(), changeFrequency: 'daily' as const, priority: 1.0 },
    { url: `${BASE_URL}/blog`, lastModified: new Date(), changeFrequency: 'daily' as const, priority: 0.9 },
    { url: `${BASE_URL}/kalender`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.8 },
    { url: `${BASE_URL}/dashboard`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.8 },
    { url: `${BASE_URL}/podcast-rss-id.xml`, lastModified: new Date(), changeFrequency: 'daily' as const, priority: 0.7 },
    { url: `${BASE_URL}/podcast-rss-en.xml`, lastModified: new Date(), changeFrequency: 'daily' as const, priority: 0.7 },
    { url: `${BASE_URL}/rss.xml`, lastModified: new Date(), changeFrequency: 'daily' as const, priority: 0.7 },
    { url: `${BASE_URL}/auth`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.5 },
    { url: `${BASE_URL}/privacy`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.3 },
    { url: `${BASE_URL}/terms`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.3 },
  ];

  // Fetch blogs dari D1
  try {
    const blogs = await queryD1<{ id: string; slug: string; createdAt: string }>(
      'SELECT id, slug, createdAt FROM blogs WHERE published = 1 OR status = ? ORDER BY createdAt DESC',
      ['published']
    );

    // Artikel terbaru (30 hari) dapat priority lebih tinggi
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const blogRoutes = blogs.map((blog) => {
      const publishedDate = blog.createdAt ? new Date(blog.createdAt) : new Date();
      const isRecent = publishedDate >= thirtyDaysAgo;
      // Gunakan slug jika tersedia, fallback ke id
      const urlPath = blog.slug ? blog.slug : blog.id;
      return {
        url: `${BASE_URL}/blog/${blog.id}`,
        lastModified: publishedDate,
        changeFrequency: 'weekly' as const,
        priority: isRecent ? 0.8 : 0.6,
      };
    });

    return [...routes, ...blogRoutes];
  } catch (err) {
    console.error('Error generating sitemap:', err);
    return routes;
  }
}
