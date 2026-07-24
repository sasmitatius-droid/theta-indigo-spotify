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

function translateCategoryToEnglish(cat: string): string {
  const map: Record<string, string> = {
    'Numerologi': 'AI Numerology',
    'Spiritual': 'Spiritual Wisdom',
    'Wuku & Weton': 'Javanese Wuku & Weton',
    'Pranata Mangsa': 'Javanese Seasons (Pranata Mangsa)',
    'Bazi': 'Bazi Four Pillars',
    'Chakra & Aura': 'Chakra & Aura Energy',
    'Human Design': 'Human Design',
    'Umum': 'General Spirituality',
  };
  return map[cat] || cat || 'Spirituality';
}

function translateTitleToEnglish(text: string): string {
  if (!text) return 'Spiritual Insight';
  let t = text;
  // Common phrase replacements for spiritual blog titles
  const replacements: [RegExp, string][] = [
    [/Mengenal Lebih Dalam/gi, 'In-Depth Guide to'],
    [/Mengenal/gi, 'Understanding'],
    [/Rahasia/gi, 'The Secrets of'],
    [/Panduan Lengkap/gi, 'Complete Guide to'],
    [/Panduan/gi, 'Guide to'],
    [/Energi Hari Ini/gi, "Today's Energy"],
    [/Energi/gi, 'Energy of'],
    [/Transformasi Jiwa/gi, 'Soul Transformation'],
    [/Pola Karma/gi, 'Karmic Patterns'],
    [/Pesan Semesta/gi, 'Messages from the Universe'],
    [/Pesan/gi, 'Message on'],
    [/Menemukan Jati Diri/gi, 'Discovering True Self'],
    [/Menemukan/gi, 'Discovering'],
    [/Kekuatan Batin/gi, 'Inner Power'],
    [/Kekuatan/gi, 'The Power of'],
    [/Kebijaksanaan/gi, 'Wisdom of'],
    [/Langkah Membuka/gi, 'Steps to Unlocking'],
    [/Langkah/gi, 'Steps for'],
    [/Cara Membuka/gi, 'How to Unlock'],
    [/Cara/gi, 'How to'],
    [/Kunci Utama/gi, 'Key Principles of'],
    [/Kunci/gi, 'Key to'],
    [/Arti/gi, 'Meaning of'],
    [/Makna/gi, 'Significance of'],
    [/Takdir/gi, 'Destiny & Soul Path'],
    [/Pembersihan Chakra/gi, 'Chakra Cleansing'],
    [/Keseimbangan/gi, 'Balance of'],
    [/Penyembuhan/gi, 'Healing'],
    [/Jiwa/gi, 'Soul'],
    [/Batin/gi, 'Inner Spirit'],
    [/Tahun/gi, 'Year'],
    [/Bulan/gi, 'Month'],
    [/Hari/gi, 'Day'],
    [/dan/gi, 'and'],
    [/di/gi, 'in'],
    [/untuk/gi, 'for'],
    [/dalam/gi, 'within'],
  ];

  for (const [regex, replacement] of replacements) {
    t = t.replace(regex, replacement);
  }
  return t;
}

function translateExcerptToEnglish(text: string): string {
  if (!text) return 'Daily spiritual insight and soul energy guidance by Theta Indigo Blueprint.';
  let t = text;
  const replacements: [RegExp, string][] = [
    [/Artikel ini membahas/gi, 'This episode explores'],
    [/Temukan bagaimana/gi, 'Discover how'],
    [/Pelajari cara/gi, 'Learn how to'],
    [/Pahami energi/gi, 'Understand the energy of'],
    [/Simak wawasan/gi, 'Listen to spiritual insights on'],
    [/batin Anda/gi, 'your inner spirit'],
    [/jiwa Anda/gi, 'your soul'],
    [/jalan hidup/gi, 'life path'],
    [/kehidupan/gi, 'life'],
    [/dan/gi, 'and'],
    [/serta/gi, 'as well as'],
    [/dengan/gi, 'with'],
    [/untuk/gi, 'for'],
  ];

  for (const [regex, replacement] of replacements) {
    t = t.replace(regex, replacement);
  }
  return t;
}

export async function GET() {
  const baseUrl = 'https://www.indigoblueprint.my.id';
  const feedUrl = `${baseUrl}/podcast-rss-en.xml`;

  try {
    const blogs = await queryD1<{ id: string; title: string; excerpt: string; category: string; createdAt: string }>(
      'SELECT id, title, excerpt, category, createdAt FROM blogs WHERE published = 1 OR status = ? ORDER BY createdAt DESC LIMIT 50',
      ['published']
    );

    const itemsXml = blogs
      .map((blog) => {
        const pubDate = blog.createdAt ? new Date(blog.createdAt).toUTCString() : new Date().toUTCString();
        const articleLink = `${baseUrl}/blog/${blog.id}`;
        const enTitle = translateTitleToEnglish(blog.title);
        const enExcerpt = translateExcerptToEnglish(blog.excerpt);
        const enCategory = translateCategoryToEnglish(blog.category);

        return `
    <item>
      <title>${escapeXml(enTitle)}</title>
      <link>${articleLink}</link>
      <description>${escapeXml(enExcerpt)}</description>
      <category>${escapeXml(enCategory)}</category>
      <pubDate>${pubDate}</pubDate>
      <guid isPermaLink="true">${articleLink}</guid>
      <itunes:author>Theta Indigo Blueprint</itunes:author>
      <itunes:summary>${escapeXml(enExcerpt)}</itunes:summary>
      <itunes:explicit>no</itunes:explicit>
    </item>`;
      })
      .join('');

    const rssXml = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd">
<channel>
  <title>Theta Indigo Podcast (English Edition)</title>
  <link>${baseUrl}</link>
  <description>Daily spiritual insights podcast covering AI Numerology, Human Design, Javanese Wuku &amp; Weton, Bazi, and Soul Energy Guidance by Theta Indigo Blueprint.</description>
  <language>en-US</language>
  <copyright>© ${new Date().getFullYear()} Theta Indigo Blueprint</copyright>
  <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
  <atom:link href="${feedUrl}" rel="self" type="application/rss+xml" />
  <itunes:image href="${baseUrl}/logo.png" />
  <itunes:category text="Religion &amp; Spirituality">
    <itunes:category text="Spirituality" />
  </itunes:category>
  <itunes:author>Theta Indigo Blueprint</itunes:author>
  <itunes:explicit>no</itunes:explicit>
  ${itemsXml}
</channel>
</rss>`.trim();

    return new Response(rssXml, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
      },
    });
  } catch (err: any) {
    console.error('Error generating English Podcast RSS feed:', err);
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Error</title><description>${escapeXml(err.message)}</description></channel></rss>`,
      {
        status: 500,
        headers: {
          'Content-Type': 'application/xml',
        },
      }
    );
  }
}
