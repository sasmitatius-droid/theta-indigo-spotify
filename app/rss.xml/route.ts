import { queryD1 } from '@/lib/cloudflare-db';

export const dynamic = 'force-dynamic';

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

export async function GET() {
  const baseUrl = 'https://www.indigoblueprint.my.id';
  const feedUrl = `${baseUrl}/rss.xml`;

  try {
    const blogs = await queryD1<{ id: string; title: string; excerpt: string; category: string; createdAt: string }>(
      'SELECT id, title, excerpt, category, createdAt FROM blogs WHERE published = 1 OR status = ? ORDER BY createdAt DESC',
      ['published']
    );

    const itemsXml = blogs
      .map((blog) => {
        const pubDate = blog.createdAt ? new Date(blog.createdAt).toUTCString() : new Date().toUTCString();
        const articleLink = `${baseUrl}/blog/${blog.id}`;
        return `
    <item>
      <title>${escapeXml(blog.title)}</title>
      <link>${articleLink}</link>
      <description>${escapeXml(blog.excerpt || '')}</description>
      <category>${escapeXml(blog.category || 'Umum')}</category>
      <pubDate>${pubDate}</pubDate>
      <guid>${articleLink}</guid>
    </item>`;
      })
      .join('');

    const rssXml = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>Theta Indigo Blueprint - Lentera Spiritual</title>
  <link>${baseUrl}/blog</link>
  <description>Temukan rahasia numerologi Anda, getaran chakra, wawasan aura, dan artikel bertenaga AI untuk menuntun pertumbuhan batin Anda.</description>
  <language>id-id</language>
  <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
  <atom:link href="${feedUrl}" rel="self" type="application/rss+xml" />
  ${itemsXml}
</channel>
</rss>`.trim();

    return new Response(rssXml, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
      },
    });
  } catch (err: any) {
    console.error('Error generating RSS feed:', err);
    return new Response(
      `<?xml version="1.5" encoding="UTF-8"?><rss version="2.0"><channel><title>Error</title><description>${err.message}</description></channel></rss>`,
      {
        status: 500,
        headers: {
          'Content-Type': 'application/xml',
        },
      }
    );
  }
}
