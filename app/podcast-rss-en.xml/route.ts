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

function fallbackTranslateTitle(text: string): string {
  if (!text) return 'Spiritual Insight';
  let t = text;
  const replacements: [RegExp, string][] = [
    [/Bazi: Kunci Mengungkap Rahasia Hidup dan Masa Depan/gi, 'Bazi: Key to Unlocking Secrets of Life and Future'],
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
    [/Kunci Mengungkap/gi, 'Key to Unlocking'],
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
    [/Masa Depan/gi, 'the Future'],
    [/Hidup/gi, 'Life'],
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

function fallbackTranslateExcerpt(text: string): string {
  if (!text) return 'Daily spiritual insight and soul energy guidance by Theta Indigo Blueprint.';
  let t = text;
  const replacements: [RegExp, string][] = [
    [/Bazi adalah sebuah sistem astrologi Tiongkok kuno yang membantu kita memahami diri sendiri dan masa depan\. Dengan mempelajari Bazi, kita dapat mengungkap rahasia hidup dan membuat keputusan yang lebih tepat\./gi, 'Bazi is an ancient Chinese astrological system that helps us understand ourselves and the future. By studying Bazi, we can unlock the secrets of life and make more aligned decisions.'],
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

async function translateBlogsWithAI(
  items: { id: string; title: string; excerpt: string }[]
): Promise<Map<string, { title: string; excerpt: string }>> {
  const resultMap = new Map<string, { title: string; excerpt: string }>();
  const apiKey = process.env.GROQ_API_KEY || process.env.GROQ_API_KEY_BACKUP || process.env.OPENROUTER_API_KEY || process.env.DEEPSEEK_API_KEY;

  if (!apiKey || items.length === 0) return resultMap;

  const isGroq = apiKey.startsWith('gsk_') || process.env.GROQ_API_KEY;
  const url = isGroq
    ? 'https://api.groq.com/openai/v1/chat/completions'
    : 'https://openrouter.ai/api/v1/chat/completions';
  const model = isGroq ? 'llama-3.3-70b-versatile' : 'google/gemini-2.5-flash';

  const prompt = `Translate the following list of Indonesian blog titles and excerpts into natural, fluent English for an English Podcast RSS feed.
Return HANYA JSON array tanpa markdown/formatting lain, dengan format persis:
[
  { "id": "item_id", "title": "English Title", "excerpt": "English Excerpt" }
]

Daftar Artikel:
${JSON.stringify(items.map(i => ({ id: i.id, title: i.title, excerpt: i.excerpt })))}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(url, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        ...(isGroq ? {} : { 'HTTP-Referer': 'https://www.indigoblueprint.my.id' }),
      },
      body: JSON.stringify({
        model,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: 'You are a professional translator converting Indonesian spiritual blog content to English JSON.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 2500,
      }),
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (content) {
        let clean = content.trim();
        if (clean.startsWith('```')) {
          clean = clean.replace(/```(?:json)?/g, '').replace(/```/g, '').trim();
        }
        const parsed = JSON.parse(clean);
        const list = Array.isArray(parsed) ? parsed : parsed.items || parsed.data || [];
        list.forEach((item: any) => {
          if (item.id && item.title) {
            resultMap.set(item.id, { title: item.title, excerpt: item.excerpt || item.title });
          }
        });
      }
    }
  } catch (err) {
    console.warn('[EN RSS] AI translation failed/timed out, using fallback dictionary:', err);
  }

  return resultMap;
}

export async function GET() {
  const baseUrl = 'https://www.indigoblueprint.my.id';
  const feedUrl = `${baseUrl}/podcast-rss-en.xml`;
  const defaultAudioUrl = `${baseUrl}/meditation.mp3`;
  const defaultAudioLength = '4200213'; // ~4.2 MB mp3 audio file

  try {
    const blogs = await queryD1<{ id: string; title: string; excerpt: string; category: string; createdAt: string }>(
      'SELECT id, title, excerpt, category, createdAt FROM blogs WHERE published = 1 OR status = ? ORDER BY createdAt DESC LIMIT 30',
      ['published']
    );

    const translatedMap = await translateBlogsWithAI(blogs);

    const itemsXml = blogs
      .map((blog) => {
        const pubDate = blog.createdAt ? new Date(blog.createdAt).toUTCString() : new Date().toUTCString();
        const articleLink = `${baseUrl}/blog/${blog.id}`;

        const aiTrans = translatedMap.get(blog.id);
        const enTitle = aiTrans?.title || fallbackTranslateTitle(blog.title);
        const enExcerpt = aiTrans?.excerpt || fallbackTranslateExcerpt(blog.excerpt);
        const enCategory = translateCategoryToEnglish(blog.category);

        return `
    <item>
      <title>${escapeXml(enTitle)}</title>
      <link>${articleLink}</link>
      <description>${escapeXml(enExcerpt)}</description>
      <enclosure url="${defaultAudioUrl}" length="${defaultAudioLength}" type="audio/mpeg" />
      <category>${escapeXml(enCategory)}</category>
      <pubDate>${pubDate}</pubDate>
      <guid isPermaLink="true">${articleLink}</guid>
      <itunes:author>Theta Indigo Blueprint</itunes:author>
      <itunes:summary>${escapeXml(enExcerpt)}</itunes:summary>
      <itunes:duration>05:00</itunes:duration>
      <itunes:explicit>no</itunes:explicit>
      <itunes:image href="${baseUrl}/logo.png" />
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
  <itunes:type>episodic</itunes:type>
  <itunes:image href="${baseUrl}/logo.png" />
  <itunes:category text="Religion &amp; Spirituality">
    <itunes:category text="Spirituality" />
  </itunes:category>
  <itunes:author>Theta Indigo Blueprint</itunes:author>
  <itunes:owner>
    <itunes:name>Theta Indigo Blueprint</itunes:name>
    <itunes:email>admin@indigoblueprint.my.id</itunes:email>
  </itunes:owner>
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
