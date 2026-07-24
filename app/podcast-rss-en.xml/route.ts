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

function smartTranslateToEnglish(text: string, isTitle = false): string {
  if (!text) return isTitle ? 'Spiritual Insight' : 'Daily spiritual insight and soul energy guidance by Theta Indigo Blueprint.';
  let t = text.trim();

  const phraseReplacements: [RegExp, string][] = [
    [/Menggapai Kedamaian Sejati:\s*Tips Spiritual untuk Hidup Lebih Berkualitas/gi, 'Attaining True Peace: Spiritual Tips for a Fulfilling Life'],
    [/Menggapai kedamaian sejati dalam hidup memerlukan pemahaman mendalam tentang diri sendiri dan alam semesta\. Berikut beberapa tips spiritual untuk hidup lebih berkualitas dan damai\./gi, 'Attaining true peace in life requires a deep understanding of oneself and the universe. Here are key spiritual tips for living a more peaceful and fulfilling life.'],
    [/Bazi:\s*Kunci Mengungkap Rahasia Hidup dan Masa Depan/gi, 'Bazi: Key to Unlocking Secrets of Life and Future'],
    [/Bazi adalah sebuah sistem astrologi Tiongkok kuno yang membantu kita memahami diri sendiri dan masa depan\. Dengan mempelajari Bazi, kita dapat mengungkap rahasia hidup dan membuat keputusan yang lebih tepat\./gi, 'Bazi is an ancient Chinese astrological system that helps us understand ourselves and the future. By studying Bazi, we can unlock the secrets of life and make more aligned decisions.'],
    [/Mengenal Lebih Dalam/gi, 'In-Depth Guide to'],
    [/Tips Spiritual untuk/gi, 'Spiritual Tips for'],
    [/Tips Spiritual/gi, 'Spiritual Tips'],
    [/Kedamaian Sejati/gi, 'True Peace'],
    [/Hidup Lebih Berkualitas/gi, 'A More Fulfilling Life'],
    [/Menggapai kedamaian/gi, 'Attaining peace'],
    [/Panduan Lengkap/gi, 'Complete Guide to'],
    [/Panduan Praktis/gi, 'Practical Guide to'],
    [/Panduan/gi, 'Guide to'],
    [/Energi Hari Ini/gi, "Today's Energy"],
    [/Energi Jiwa/gi, 'Soul Energy'],
    [/Energi Batin/gi, 'Inner Energy'],
    [/Energi/gi, 'Energy of'],
    [/Transformasi Jiwa/gi, 'Soul Transformation'],
    [/Pola Karma/gi, 'Karmic Patterns'],
    [/Pesan Semesta/gi, 'Messages from the Universe'],
    [/Pesan Jiwa/gi, 'Soul Message'],
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
    [/Takdir Jiwa/gi, 'Soul Destiny'],
    [/Takdir/gi, 'Destiny & Soul Path'],
    [/Pembersihan Chakra/gi, 'Chakra Cleansing'],
    [/Keseimbangan Energi/gi, 'Energy Balance'],
    [/Keseimbangan/gi, 'Balance of'],
    [/Penyembuhan Batin/gi, 'Inner Healing'],
    [/Penyembuhan/gi, 'Healing'],
    [/Jiwa Anda/gi, 'Your Soul'],
    [/Batin Anda/gi, 'Your Inner Spirit'],
    [/Diri Sendiri/gi, 'Oneself'],
    [/Alam Semesta/gi, 'The Universe'],
    [/Masa Depan/gi, 'The Future'],
    [/Hidup Anda/gi, 'Your Life'],
    [/Hidup/gi, 'Life'],
    [/Artikel ini membahas/gi, 'This episode explores'],
    [/Temukan bagaimana/gi, 'Discover how'],
    [/Pelajari cara/gi, 'Learn how to'],
    [/Pahami energi/gi, 'Understand the energy of'],
    [/Simak wawasan/gi, 'Listen to spiritual insights on'],
  ];

  for (const [regex, replacement] of phraseReplacements) {
    t = t.replace(regex, replacement);
  }

  const wordReplacements: [RegExp, string][] = [
    [/\bmenggapai\b/gi, 'attaining'],
    [/\bkedamaian\b/gi, 'peace'],
    [/\bsejati\b/gi, 'true'],
    [/\bberkualitas\b/gi, 'fulfilling'],
    [/\bmemerlukan\b/gi, 'requires'],
    [/\bpemahaman\b/gi, 'understanding'],
    [/\bmendalam\b/gi, 'deep'],
    [/\btentang\b/gi, 'about'],
    [/\bberikut\b/gi, 'here are'],
    [/\bbeberapa\b/gi, 'several'],
    [/\bdamai\b/gi, 'peaceful'],
    [/\badalah\b/gi, 'is'],
    [/\bsebuah\b/gi, 'a'],
    [/\bsistem\b/gi, 'system'],
    [/\bastrologi\b/gi, 'astrology'],
    [/\btiongkok\b/gi, 'chinese'],
    [/\bkuno\b/gi, 'ancient'],
    [/\byang\b/gi, 'that'],
    [/\bmembantu\b/gi, 'helps'],
    [/\bkita\b/gi, 'us'],
    [/\bmemahami\b/gi, 'understand'],
    [/\bdengan\b/gi, 'with'],
    [/\bmempelajari\b/gi, 'studying'],
    [/\bdapat\b/gi, 'can'],
    [/\bmengungkap\b/gi, 'unlock'],
    [/\brahasia\b/gi, 'secrets'],
    [/\bmembuat\b/gi, 'make'],
    [/\bkeputusan\b/gi, 'decisions'],
    [/\blebih\b/gi, 'more'],
    [/\btepat\b/gi, 'aligned'],
    [/\bdan\b/gi, 'and'],
    [/\bdi\b/gi, 'in'],
    [/\buntuk\b/gi, 'for'],
    [/\bdalam\b/gi, 'within'],
    [/\bserta\b/gi, 'and'],
  ];

  for (const [regex, replacement] of wordReplacements) {
    t = t.replace(regex, replacement);
  }

  if (isTitle && t.length > 0) {
    t = t.charAt(0).toUpperCase() + t.slice(1);
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
    console.warn('[EN RSS] AI translation failed/timed out, using smart phrase dictionary:', err);
  }

  return resultMap;
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
  const feedUrl = `${baseUrl}/podcast-rss-en.xml`;
  const defaultAudioUrl = `${baseUrl}/meditation.mp3`;
  const defaultAudioLength = '4200213';

  try {
    const [blogs, r2AudioMap] = await Promise.all([
      queryD1<{ id: string; title: string; excerpt: string; category: string; createdAt: string }>(
        'SELECT id, title, excerpt, category, createdAt FROM blogs WHERE published = 1 OR status = ? ORDER BY createdAt DESC LIMIT 30',
        ['published']
      ),
      getR2AudioMap(),
    ]);

    const translatedMap = await translateBlogsWithAI(blogs);

    const itemsXml = blogs
      .map((blog) => {
        const pubDate = blog.createdAt ? new Date(blog.createdAt).toUTCString() : new Date().toUTCString();
        const articleLink = `${baseUrl}/blog/${blog.id}`;

        const aiTrans = translatedMap.get(blog.id);
        const enTitle = aiTrans?.title || smartTranslateToEnglish(blog.title, true);
        const enExcerpt = aiTrans?.excerpt || smartTranslateToEnglish(blog.excerpt, false);
        const enCategory = translateCategoryToEnglish(blog.category);

        const r2Audio = r2AudioMap.get(blog.id.toLowerCase()) || r2AudioMap.get((blog.title || '').toLowerCase());
        const audioUrl = r2Audio ? r2Audio.url : defaultAudioUrl;
        const audioLength = r2Audio ? r2Audio.length : defaultAudioLength;
        const duration = r2Audio ? r2Audio.duration : '05:00';

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
  <itunes:summary>Daily spiritual insights podcast covering AI Numerology, Human Design, Javanese Wuku &amp; Weton, Bazi, and Soul Energy Guidance by Theta Indigo Blueprint.</itunes:summary>
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
