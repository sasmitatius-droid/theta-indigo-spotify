import type { PodcastEpisode } from './firebase-client';

// ─── Podcast Metadata ──────────────────────────────────────────────────────────

const PODCAST_TITLE       = 'Theta Indigo Podcast';
const PODCAST_DESCRIPTION =
  'Wawasan spiritual mendalam tentang numerologi, Human Design, astrologi, ' +
  'kearifan lokal Jawa, Bazi, Chakra & Aura, dan perjalanan jiwa. ' +
  'Dipersembahkan oleh Theta Indigo Blueprint — panduan jiwa modern.';
const PODCAST_AUTHOR  = 'Theta Indigo';
const PODCAST_EMAIL   = 'timotiusfamily@gmail.com';
const PODCAST_WEBSITE = 'https://theta-indigo-blueprint.vercel.app';
const PODCAST_LANG    = 'id';

const R2_PUBLIC_URL = (
  process.env.R2_PUBLIC_URL ||
  'https://pub-3dfac1ebd38a458faff5626cae902ad2.r2.dev'
).replace(/\/$/, '');

const COVER_URL = `${R2_PUBLIC_URL}/podcast/cover.png`;

// ─── Helpers ───────────────────────────────────────────────────────────────────

function xmlEscape(str: string): string {
  return (str ?? '')
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&apos;');
}

function toRfc2822(iso: string): string {
  return new Date(iso).toUTCString();
}

import { formatDuration } from './tts-service';

function buildItem(ep: PodcastEpisode): string {
  return `
    <item>
      <title>${xmlEscape(ep.title)}</title>
      <description>${xmlEscape(ep.excerpt || ep.title)}</description>
      <itunes:summary>${xmlEscape(ep.excerpt || ep.title)}</itunes:summary>
      <itunes:author>${xmlEscape(PODCAST_AUTHOR)}</itunes:author>
      <enclosure
        url="${xmlEscape(ep.mp3Url)}"
        length="${ep.fileSizeBytes}"
        type="audio/mpeg"/>
      <guid isPermaLink="false">theta-indigo-ep-${xmlEscape(ep.id)}</guid>
      <pubDate>${toRfc2822(ep.publishedAt)}</pubDate>
      <itunes:duration>${formatDuration(ep.durationSec)}</itunes:duration>
      <itunes:explicit>no</itunes:explicit>
      <itunes:episodeType>full</itunes:episodeType>
      <itunes:subtitle>${xmlEscape(ep.category)}</itunes:subtitle>
    </item>`;
}

// ─── RSS Builder ───────────────────────────────────────────────────────────────

/**
 * Build a Spotify-compliant RSS 2.0 + iTunes namespace XML.
 * Episodes are sorted newest-first (already expected from Firestore query).
 */
export function buildRssXml(episodes: PodcastEpisode[]): string {
  const now         = new Date().toUTCString();
  const itemsXml    = episodes.map(buildItem).join('');
  const feedUrl     = `${R2_PUBLIC_URL}/podcast/feed.xml`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <!-- ── Channel metadata ── -->
    <title>${xmlEscape(PODCAST_TITLE)}</title>
    <link>${PODCAST_WEBSITE}</link>
    <language>${PODCAST_LANG}</language>
    <description>${xmlEscape(PODCAST_DESCRIPTION)}</description>
    <lastBuildDate>${now}</lastBuildDate>
    <copyright>© ${new Date().getFullYear()} ${PODCAST_AUTHOR}</copyright>

    <!-- Self-referencing atom link (best practice) -->
    <atom:link href="${feedUrl}" rel="self" type="application/rss+xml"/>

    <!-- ── iTunes / Spotify metadata ── -->
    <itunes:title>${xmlEscape(PODCAST_TITLE)}</itunes:title>
    <itunes:author>${xmlEscape(PODCAST_AUTHOR)}</itunes:author>
    <itunes:summary>${xmlEscape(PODCAST_DESCRIPTION)}</itunes:summary>
    <itunes:owner>
      <itunes:name>${xmlEscape(PODCAST_AUTHOR)}</itunes:name>
      <itunes:email>${PODCAST_EMAIL}</itunes:email>
    </itunes:owner>
    <itunes:image href="${COVER_URL}"/>
    <image>
      <url>${COVER_URL}</url>
      <title>${xmlEscape(PODCAST_TITLE)}</title>
      <link>${PODCAST_WEBSITE}</link>
    </image>
    <itunes:category text="Religion &amp; Spirituality">
      <itunes:category text="Spirituality"/>
    </itunes:category>
    <itunes:explicit>no</itunes:explicit>
    <itunes:type>episodic</itunes:type>
    <itunes:complete>no</itunes:complete>
${itemsXml}
  </channel>
</rss>`;
}
