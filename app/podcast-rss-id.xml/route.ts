import { queryD1 } from '@/lib/cloudflare-db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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

async function getR2AudioMap(): Promise<Map<string, { url: string; length: string; duration: string }>> {
  const map = new Map<string, { url: string; length: string; duration: string }>();
  try {
    const res = await fetch('https://pub-3dfac1ebd38a458faff5626cae902ad2.r2.dev/podcast/feed.xml', {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      cache: 'no-store',
    });
    if (res.ok) {
      const xml = await res.text();
      const itemMatches = xml.match(/<item>[\s\S]*?<\/item>/gi) || [];
      for (const itemXml of itemMatches) {
        const titleMatch = itemXml.match(/<title>([\s\S]*?)<\/title>/i);
        const encMatch = itemXml.match(/<enclosure[\s\S]*?url="([^"]+)"[\s\S]*?length="([^"]+)"/i);
        const durMatch = itemXml.match(/<itunes:duration>([^<]+)<\/itunes:duration>/i);

        if (encMatch) {
          const audioUrl = encMatch[1];
          const audioLength = encMatch[2];
          const duration = durMatch ? durMatch[1].trim() : '03:00';
          const audioData = { url: audioUrl, length: audioLength, duration };

          if (titleMatch) {
            const rawTitle = titleMatch[1].trim().replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
            map.set(rawTitle.toLowerCase(), audioData);
          }

          const idMatch = audioUrl.match(/ep-([a-z0-9\-]+)-\d+\.mp3/i);
          if (idMatch) {
            map.set(idMatch[1].toLowerCase(), audioData);
          }
        }
      }
    }
  } catch (err) {
    console.warn('Could not fetch R2 podcast feed:', err);
  }
  return map;
}

export async function GET() {
  const baseUrl = 'https://www.indigoblueprint.my.id';
  const feedUrl = `${baseUrl}/podcast-rss-id.xml`;
  const defaultAudioUrl = `${baseUrl}/meditation.mp3`;
  const defaultAudioLength = '4200213';

  try {
    const [blogs, r2AudioMap] = await Promise.all([
      queryD1<{ id: string; title: string; excerpt: string; category: string; createdAt: string }>(
        'SELECT id, title, excerpt, category, createdAt FROM blogs WHERE published = 1 OR status = ? ORDER BY createdAt DESC LIMIT 50',
        ['published']
      ),
      getR2AudioMap(),
    ]);

    const itemsXml = blogs
      .map((blog) => {
        const pubDate = blog.createdAt ? new Date(blog.createdAt).toUTCString() : new Date().toUTCString();
        const articleLink = `${baseUrl}/blog/${blog.id}`;

        const r2Audio = r2AudioMap.get(blog.id.toLowerCase()) || r2AudioMap.get((blog.title || '').toLowerCase());
        const audioUrl = r2Audio ? r2Audio.url : defaultAudioUrl;
        const audioLength = r2Audio ? r2Audio.length : defaultAudioLength;
        const duration = r2Audio ? r2Audio.duration : '05:00';

        return `
    <item>
      <title>${escapeXml(blog.title)}</title>
      <link>${articleLink}</link>
      <description>${escapeXml(blog.excerpt || '')}</description>
      <enclosure url="${audioUrl}" length="${audioLength}" type="audio/mpeg" />
      <category>${escapeXml(blog.category || 'Spiritual')}</category>
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
  <title>Theta Indigo Podcast (Bahasa Indonesia)</title>
  <link>${baseUrl}</link>
  <description>Podcast wawasan spiritual harian tentang Numerologi, Human Design, Wuku &amp; Weton Jawa, Bazi, serta panduan energi jiwa oleh Theta Indigo Blueprint.</description>
  <language>id-ID</language>
  <copyright>© ${new Date().getFullYear()} Theta Indigo Blueprint</copyright>
  <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
  <atom:link href="${feedUrl}" rel="self" type="application/rss+xml" />
  <itunes:type>episodic</itunes:type>
  <itunes:summary>Podcast wawasan spiritual harian tentang Numerologi, Human Design, Wuku &amp; Weton Jawa, Bazi, serta panduan energi jiwa oleh Theta Indigo Blueprint.</itunes:summary>
  <itunes:image href="${baseUrl}/logo.png" />
  <itunes:category text="Religion &amp; Spirituality">
    <itunes:category text="Spirituality" />
  </itunes:category>
  <itunes:author>Theta Indigo Blueprint</itunes:author>
  <itunes:owner>
    <itunes:name>Theta Indigo Blueprint</itunes:name>
    <itunes:email>admin@indigoblueprint.my.id</itunes:email>
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
    console.error('Error generating Indonesian Podcast RSS feed:', err);
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
