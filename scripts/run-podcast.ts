#!/usr/bin/env ts-node
/**
 * run-podcast.ts
 * ──────────────────────────────────────────────────────────────────────────────
 * Main entry point for Theta Indigo Podcast automation.
 *
 * Pipeline:
 *  1. Rotate category (R2 state)
 *  2. Fetch latest article from Cloudflare D1 via REST API
 *  3. Convert article to MP3 (Microsoft Edge TTS, id-ID-ArdiNeural)
 *  4. Cleanup R2 episodes older than 24h
 *  5. Upload new MP3 to R2  (key: podcast/ep-{id}-{ts}.mp3)
 *  6. Save episode metadata to Firestore (permanent record)
 *  7. Build RSS XML from Firestore episodes → upload to R2 (podcast/feed.xml)
 *  8. Ensure cover art is in R2 (uploaded once, permanent)
 *  9. Telegram success / failure report
 *
 * Usage:
 *   npm run podcast          ← normal run
 *   npm run podcast:dry      ← dry-run (no uploads, no writes)
 */

import * as fs   from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import * as crypto from 'crypto';
import { GetObjectCommand } from '@aws-sdk/client-s3';

// ── Load env (local dev uses .env.local, CI uses secrets injected as env vars) ─
const envFile = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envFile)) {
  dotenv.config({ path: envFile });
  console.log('📄 Loaded .env.local for local development');
} else {
  dotenv.config();
}

import { getNextCategory, saveLastCategory } from '../src/category-rotator';
import { textToMp3, formatDuration }          from '../src/tts-service';
import {
  uploadMp3,
  uploadRssXml,
  uploadCoverArt,
  cleanupOldEpisodes,
  objectExists,
  s3Client,
  R2_BUCKET,
  R2_PUBLIC_URL,
  downloadJson,
} from '../src/r2-client';
import { buildRssXml }                        from '../src/rss-builder';
import {
  saveEpisodeToFirestore,
  getRecentEpisodesFromFirestore,
  type PodcastEpisode,
} from '../src/firebase-client';
import { notifySuccess, notifyFailure }       from '../src/telegram-notify';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface D1Row {
  id: string;
  title: string;
  excerpt: string | null;
  category: string;
  contentR2Path: string | null;
}

interface Article {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
}

// ─── Cloudflare D1 helper ──────────────────────────────────────────────────────

async function queryD1(sql: string, params: string[]): Promise<D1Row[]> {
  const accountId  = process.env.CLOUDFLARE_ACCOUNT_ID;
  const databaseId = process.env.CLOUDFLARE_D1_DATABASE_ID;
  const apiToken   = process.env.CLOUDFLARE_API_TOKEN;

  if (!accountId || !databaseId || !apiToken) {
    throw new Error(
      'Cloudflare D1 credentials missing. ' +
      'Set CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_D1_DATABASE_ID, CLOUDFLARE_API_TOKEN.'
    );
  }

  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sql, params }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`D1 API error ${res.status}: ${errText.slice(0, 300)}`);
  }

  const json = (await res.json()) as {
    success: boolean;
    result: { results: D1Row[] }[];
    errors?: { message: string }[];
  };

  if (!json.success) {
    const msg = json.errors?.map((e) => e.message).join(', ') ?? 'Unknown D1 error';
    throw new Error(`D1 query failed: ${msg}`);
  }

  return json.result?.[0]?.results ?? [];
}

// ─── Article fetcher ───────────────────────────────────────────────────────────

async function fetchArticleContent(contentR2Path: string): Promise<string> {
  try {
    const res = await s3Client.send(
      new GetObjectCommand({ Bucket: R2_BUCKET, Key: contentR2Path })
    );
    const body = await res.Body?.transformToString();
    if (body) {
      const parsed = JSON.parse(body) as { content?: string };
      return parsed.content ?? '';
    }
  } catch (err) {
    console.warn('⚠️  Could not fetch article content from R2:', (err as Error).message);
  }
  return '';
}

async function fetchLatestArticle(category: string): Promise<Article> {
  console.log(`🔍 Searching D1 for category: "${category}"...`);

  // Try category-specific query first
  let rows = await queryD1(
    `SELECT id, title, excerpt, category, contentR2Path
     FROM blogs
     WHERE category = ? AND status = 'published'
     ORDER BY createdAt DESC
     LIMIT 1`,
    [category]
  );

  // Fallback: any latest published article
  if (rows.length === 0) {
    console.log(`⚠️  No article for "${category}" — falling back to latest published article.`);
    rows = await queryD1(
      `SELECT id, title, excerpt, category, contentR2Path
       FROM blogs
       WHERE status = 'published'
       ORDER BY createdAt DESC
       LIMIT 1`,
      []
    );
  }

  if (rows.length === 0) {
    throw new Error('No published articles found in the D1 database.');
  }

  const row = rows[0];
  console.log(`📝 Found article: "${row.title}" (ID: ${row.id})`);

  // Fetch full HTML content from R2 storage
  const content = row.contentR2Path
    ? await fetchArticleContent(row.contentR2Path)
    : (row.excerpt ?? '');

  return {
    id: row.id,
    title: row.title,
    excerpt: row.excerpt ?? '',
    content: content || row.excerpt ?? row.title,
    category: row.category,
  };
}

// ─── Cover art ─────────────────────────────────────────────────────────────────

async function ensureCoverArt(): Promise<string> {
  const coverKey = 'podcast/cover.png';
  const coverUrl = `${R2_PUBLIC_URL}/${coverKey}`;

  // Check if already exists in R2
  if (await objectExists(coverKey)) {
    console.log(`✅ Cover art already in R2: ${coverUrl}`);
    return coverUrl;
  }

  // Look for local asset in repo
  const candidates = [
    path.resolve(__dirname, '../assets/logo-indigo-sp.png'),
    path.resolve(__dirname, '../assets/cover.png'),
    path.resolve(process.cwd(), 'assets/logo-indigo-sp.png'),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      const buffer = fs.readFileSync(candidate);
      await uploadCoverArt(buffer);
      console.log(`✅ Cover art uploaded to R2 from: ${candidate}`);
      return coverUrl;
    }
  }

  console.warn('⚠️  Cover art not found locally — using URL as-is (may 404 on first Spotify crawl).');
  return coverUrl;
}

// ─── Main ──────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const isDryRun = process.argv.includes('--dry-run');

  const banner = isDryRun ? ' (DRY RUN — no uploads)' : '';
  console.log(`\n🎙️  Theta Indigo Podcast Generator${banner}`);
  console.log(`⏰  Start: ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB`);
  console.log('─'.repeat(60));

  let selectedCategory = 'Umum';

  try {
    // ── Step 1: Category rotation ──────────────────────────────────────────────
    selectedCategory = await getNextCategory();
    console.log(`\n📂 Step 1 — Category: "${selectedCategory}"`);

    // ── Step 2: Fetch article from D1 ─────────────────────────────────────────
    console.log('\n📥 Step 2 — Fetching article from Cloudflare D1...');
    const article = await fetchLatestArticle(selectedCategory);

    // ── Step 3: Text → MP3 ────────────────────────────────────────────────────
    console.log('\n🔊 Step 3 — Generating audio (Edge TTS)...');
    const { buffer, durationSec, script } = await textToMp3(
      article.title,
      article.excerpt,
      article.content
    );
    const durationFormatted = formatDuration(durationSec);

    if (isDryRun) {
      console.log('\n🔵 DRY RUN complete. Skipping all writes.');
      console.log(`   Title    : ${article.title}`);
      console.log(`   Category : ${article.category}`);
      console.log(`   Duration : ~${durationFormatted}`);
      console.log(`   MP3 size : ${Math.round(buffer.length / 1024)} KB`);
      console.log('\nScript preview (first 400 chars):\n');
      console.log(script.slice(0, 400) + '...\n');
      return;
    }

    // ── Step 4: Cleanup old episodes ──────────────────────────────────────────
    console.log('\n🗑️  Step 4 — Cleaning up expired R2 episodes (>24h)...');
    const deleted = await cleanupOldEpisodes();
    console.log(
      deleted.length > 0
        ? `   Deleted ${deleted.length} expired episode(s).`
        : '   No expired episodes found.'
    );

    // ── Step 5: Upload MP3 ────────────────────────────────────────────────────
    const episodeId = crypto.randomUUID();
    const timestamp = Date.now();
    const mp3Key    = `podcast/ep-${article.id}-${timestamp}.mp3`;

    console.log(`\n☁️  Step 5 — Uploading MP3 to R2...`);
    console.log(`   Key: ${mp3Key}`);
    const mp3Url = await uploadMp3(mp3Key, buffer);
    console.log(`   ✅ URL: ${mp3Url}`);

    // ── Step 6: Cover art ─────────────────────────────────────────────────────
    console.log('\n🖼️  Step 6 — Ensuring cover art in R2...');
    await ensureCoverArt();

    // ── Step 7: Save to Firestore ─────────────────────────────────────────────
    const now       = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const episode: PodcastEpisode = {
      id:            episodeId,
      title:         article.title,
      category:      selectedCategory,
      excerpt:       article.excerpt || article.title,
      mp3Key,
      mp3Url,
      durationSec,
      fileSizeBytes: buffer.length,
      publishedAt:   now.toISOString(),
      expiresAt:     expiresAt.toISOString(),
      articleId:     article.id,
    };

    console.log('\n💾 Step 7 — Saving episode to Firestore...');
    await saveEpisodeToFirestore(episode);

    // ── Step 8: Build & upload RSS ────────────────────────────────────────────
    console.log('\n📡 Step 8 — Building RSS feed from Firestore...');
    const recentEpisodes = await getRecentEpisodesFromFirestore(20);
    console.log(`   Including ${recentEpisodes.length} episode(s) in feed.`);

    const rssXml = buildRssXml(recentEpisodes);
    const feedUrl = await uploadRssXml(rssXml);
    console.log(`   ✅ RSS uploaded: ${feedUrl}`);

    // ── Step 9: Save category rotation state ──────────────────────────────────
    await saveLastCategory(selectedCategory);

    // ── Step 10: Telegram success report ──────────────────────────────────────
    console.log('\n📲 Step 10 — Sending Telegram report...');
    const rotState = await downloadJson<{ runCount?: number }>('podcast/rotation-state.json');
    await notifySuccess({
      episodeTitle:      article.title,
      category:          selectedCategory,
      durationFormatted,
      mp3SizeKb:         Math.round(buffer.length / 1024),
      episodeId,
      runCount:          rotState?.runCount,
    });

    // ── Done ──────────────────────────────────────────────────────────────────
    console.log('\n' + '═'.repeat(60));
    console.log('✨  SUCCESS!');
    console.log(`   Episode  : "${article.title}"`);
    console.log(`   Category : ${selectedCategory}`);
    console.log(`   Duration : ${durationFormatted}`);
    console.log(`   RSS Feed : ${feedUrl}`);
    console.log('═'.repeat(60) + '\n');

  } catch (error: unknown) {
    const err = error as Error;
    console.error('\n' + '═'.repeat(60));
    console.error('❌  FATAL ERROR:', err.message);
    console.error('═'.repeat(60) + '\n');

    // Telegram failure notification
    try {
      await notifyFailure(err.message ?? String(error), selectedCategory);
    } catch (tgErr) {
      console.error('Also failed to send Telegram error report:', (tgErr as Error).message);
    }

    process.exit(1);
  }
}

main();
