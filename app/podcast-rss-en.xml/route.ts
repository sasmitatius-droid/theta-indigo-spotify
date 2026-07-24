import { queryD1 } from '@/lib/cloudflare-db';
import { getR2PodcastAudioMap } from '@/lib/r2-client';

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

function translateCategoryToEnglish(cat: string): string {
  const map: Record<string, string> = {
    'Numerologi': 'AI Numerology',
    'Spiritual': 'Spiritual Wisdom',
    'Tips Spiritual': 'Spiritual Tips & Wisdom',
    'Wuku & Weton': 'Javanese Wuku & Weton',
    'Pranata Mangsa': 'Javanese Seasons (Pranata Mangsa)',
    'Bazi': 'Bazi Four Pillars',
    'Chakra & Aura': 'Chakra & Aura Energy',
    'Human Design': 'Human Design',
    'Umum': 'General Spirituality',
  };
  return map[cat] || cat || 'Spirituality';
}

async function translateToEnglish(text: string): Promise<string> {
  if (!text) return '';
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=id&tl=en&dt=t&q=${encodeURIComponent(text.trim())}`;
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json?.[0])) {
        const translated = json[0].map((x: any) => x[0]).join('');
        if (translated && translated.length > 0) return translated;
      }
    }
  } catch (err) {
    console.warn('Google Translate error:', err);
  }
  return text;
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
    console.warn('[EN RSS] AI translation failed/timed out, using smart phrase dictionary:', err);
  }

  return resultMap;
}

export async function GET() {
  const baseUrl = 'https://www.indigoblueprint.my.id';
  const feedUrl = `${baseUrl}/podcast-rss-en.xml`;
  const defaultAudioUrl = `${baseUrl}/meditation.mp3`;
  const defaultAudioLength = '4200213';

  try {
    const [blogs, r2AudioMap] = await Promise.all([
      queryD1<{ id: string; title: string; excerpt: string; category: string; createdAt: string }>(
        'SELECT id, title, excerpt, category, createdAt FROM blogs WHERE published = 1 OR status = ? ORDER BY createdAt DESC LIMIT 30',
        ['published']
      ),
      getR2PodcastAudioMap(),
    ]);

    const translatedMap = await translateBlogsWithAI(blogs);

    const itemsXmlArr = await Promise.all(
      blogs.map(async (blog) => {
        const pubDate = blog.createdAt ? new Date(blog.createdAt).toUTCString() : new Date().toUTCString();
        const articleLink = `${baseUrl}/blog/${blog.id}`;

        const aiTrans = translatedMap.get(blog.id);
        const enTitle = aiTrans?.title || (await translateToEnglish(blog.title));
        const enExcerpt = aiTrans?.excerpt || (await translateToEnglish(blog.excerpt));
        const enCategory = translateCategoryToEnglish(blog.category);

        const r2Audio = r2AudioMap.enMap.get(blog.id.toLowerCase());
        const audioUrl = r2Audio ? r2Audio.url : defaultAudioUrl;
        const audioLength = r2Audio ? r2Audio.length : defaultAudioLength;
        const duration = '03:15';

        return `
    <item>
      <title>${escapeXml(enTitle)}</title>
      <link>${articleLink}</link>
      <description>${escapeXml(enExcerpt)}</description>
      <enclosure url="${audioUrl}" length="${audioLength}" type="audio/mpeg" />
      <category>${escapeXml(enCategory)}</category>
      <pubDate>${pubDate}</pubDate>
      <guid isPermaLink="true">${articleLink}</guid>
      <itunes:author>Theta Indigo Blueprint</itunes:author>
      <itunes:summary>${escapeXml(enExcerpt)}</itunes:summary>
      <itunes:duration>${duration}</itunes:duration>
      <itunes:explicit>false</itunes:explicit>
      <itunes:image href="${baseUrl}/logo.png" />
    </item>`;
      })
    );

    const itemsXml = itemsXmlArr.join('');

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
  <itunes:summary>Daily spiritual insights podcast covering AI Numerology, Human Design, Javanese Wuku &amp; Weton, Bazi, and Soul Energy Guidance by Theta Indigo Blueprint.</itunes:summary>
  <itunes:image href="${baseUrl}/logo.png" />
  <itunes:category text="Religion &amp; Spirituality">
    <itunes:category text="Spirituality" />
  </itunes:category>
  <itunes:author>Theta Indigo Blueprint</itunes:author>
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
    console.error('Error generating English Podcast RSS feed:', err);
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
