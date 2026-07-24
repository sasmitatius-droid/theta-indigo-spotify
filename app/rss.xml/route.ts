import { queryD1 } from '@/lib/cloudflare-db';
import { getR2PodcastAudioMap } from '@/lib/r2-client';

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
  const defaultAudioUrl = `${baseUrl}/meditation.mp3`;
  const defaultAudioLength = '4200213';

  try {
    const [blogs, r2AudioMap] = await Promise.all([
      queryD1<{ id: string; title: string; excerpt: string; category: string; createdAt: string }>(
        'SELECT id, title, excerpt, category, createdAt FROM blogs WHERE published = 1 OR status = ? ORDER BY createdAt DESC',
        ['published']
      ),
      getR2PodcastAudioMap(),
    ]);

    const itemsXml = blogs
      .map((blog) => {
        const pubDate = blog.createdAt ? new Date(blog.createdAt).toUTCString() : new Date().toUTCString();
        const articleLink = `${baseUrl}/blog/${blog.id}`;

        const r2Audio = r2AudioMap.idMap.get(blog.id.toLowerCase());
        const audioUrl = r2Audio ? r2Audio.url : defaultAudioUrl;
        const audioLength = r2Audio ? r2Audio.length : defaultAudioLength;
        const duration = '03:15';

        return `
    <item>
      <title>${escapeXml(blog.title)}</title>
      <link>${articleLink}</link>
      <description>${escapeXml(blog.excerpt || '')}</description>
      <enclosure url="${audioUrl}" length="${audioLength}" type="audio/mpeg" />
      <category>${escapeXml(blog.category || 'Umum')}</category>
      <pubDate>${pubDate}</pubDate>
      <guid isPermaLink="true">${articleLink}</guid>
      <itunes:author>Theta Indigo Blueprint</itunes:author>
      <itunes:summary>${escapeXml(blog.excerpt || '')}</itunes:summary>
      <itunes:duration>${duration}</itunes:duration>
      <itunes:explicit>false</itunes:explicit>
      <itunes:image href="${baseUrl}/logo.png" />
    </item>`;
      })
      .join('');

    const rssXml = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd">
<channel>
  <title>Theta Indigo Blueprint - Lentera Spiritual</title>
  <link>${baseUrl}/blog</link>
  <description>Temukan rahasia numerologi Anda, getaran chakra, wawasan aura, dan artikel bertenaga AI untuk menuntun pertumbuhan batin Anda.</description>
  <language>id-ID</language>
  <copyright>© ${new Date().getFullYear()} Theta Indigo Blueprint</copyright>
  <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
  <atom:link href="${feedUrl}" rel="self" type="application/rss+xml" />
  <itunes:type>episodic</itunes:type>
  <itunes:summary>Temukan rahasia numerologi Anda, getaran chakra, wawasan aura, dan artikel bertenaga AI untuk menuntun pertumbuhan batin Anda.</itunes:summary>
  <itunes:image href="${baseUrl}/logo.png" />
  <itunes:category text="Religion &amp; Spirituality">
    <itunes:category text="Spirituality" />
  </itunes:category>
  <itunes:author>Theta Indigo Blueprint</itunes:author>
  <managingEditor>sasmitatius@gmail.com (Theta Indigo Blueprint)</managingEditor>
  <webMaster>sasmitatius@gmail.com (Theta Indigo Blueprint)</webMaster>
  <itunes:owner>
    <itunes:name>Theta Indigo Blueprint</itunes:name>
    <itunes:email>sasmitatius@gmail.com</itunes:email>
  </itunes:owner>
  <itunes:explicit>false</itunes:explicit>
  ${itemsXml}
</channel>
</rss>`.trim();

    return new Response(rssXml, {
      headers: {
        'Content-Type': 'application/rss+xml; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0, s-maxage=0',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (err: any) {
    console.error('Error generating RSS feed:', err);
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Error</title><description>${escapeXml(err.message)}</description></channel></rss>`,
      {
        status: 500,
        headers: {
          'Content-Type': 'application/rss+xml; charset=utf-8',
          'Cache-Control': 'no-cache, no-store',
        },
      }
    );
  }
}
