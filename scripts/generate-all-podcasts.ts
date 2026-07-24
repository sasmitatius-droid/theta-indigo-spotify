#!/usr/bin/env ts-node
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import * as crypto from 'crypto';

const envFile = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envFile)) {
  dotenv.config({ path: envFile });
} else {
  dotenv.config();
}

import { textToMp3, formatDuration } from '../src/tts-service';
import { uploadMp3, uploadRssXml, R2_BUCKET, s3Client } from '../src/r2-client';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { saveEpisodeToFirestore, getRecentEpisodesFromFirestore, type PodcastEpisode } from '../src/firebase-client';
import { buildRssXml } from '../src/rss-builder';

async function queryD1(sql: string, params: string[] = []): Promise<any[]> {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const databaseId = process.env.CLOUDFLARE_D1_DATABASE_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;

  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ sql, params }),
  });
  const json = (await res.json()) as any;
  return json.result?.[0]?.results ?? [];
}

async function fetchArticleContent(contentR2Path: string): Promise<string> {
  try {
    const res = await s3Client.send(new GetObjectCommand({ Bucket: R2_BUCKET, Key: contentR2Path }));
    const body = await res.Body?.transformToString();
    if (body) {
      const parsed = JSON.parse(body);
      return parsed.content ?? '';
    }
  } catch {}
  return '';
}

async function translateToEnglish(text: string): Promise<string> {
  if (!text) return '';
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=id&tl=en&dt=t&q=${encodeURIComponent(text.trim())}`;
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (res.ok) {
      const json = (await res.json()) as any;
      if (Array.isArray(json?.[0])) {
        const translated = json[0].map((x: any) => x[0]).join('');
        if (translated && translated.length > 0) return translated;
      }
    }
  } catch (err: any) {
    console.warn('Translate API warn:', err?.message || err);
  }
  return text;
}

async function main() {
  console.log('🎙️ Batch TTS Podcast Generator — Generating ID & EN MP3 audio for published blogs...');
  const blogs = await queryD1(
    "SELECT id, title, excerpt, category, contentR2Path FROM blogs WHERE status = 'published' OR published = 1 ORDER BY createdAt DESC LIMIT 15"
  );
  console.log(`Found ${blogs.length} published blogs in D1.`);

  for (let i = 0; i < blogs.length; i++) {
    const blog = blogs[i];
    console.log(`\n[${i + 1}/${blogs.length}] Processing: "${blog.title}" (${blog.id})...`);

    const content = blog.contentR2Path ? await fetchArticleContent(blog.contentR2Path) : blog.excerpt || blog.title;

    // 1. Indonesian Audio
    try {
      const { buffer, durationSec } = await textToMp3(blog.title, blog.excerpt || blog.title, content, 'id');
      const episodeId = crypto.randomUUID();
      const timestamp = Date.now();
      const mp3Key = `podcast/ep-${blog.id}-${timestamp}.mp3`;

      const mp3Url = await uploadMp3(mp3Key, buffer);
      console.log(`   ✅ ID MP3 uploaded: ${mp3Url} (${formatDuration(durationSec)})`);

      const now = new Date();
      const expiresAt = new Date(now.getTime() + 300 * 24 * 60 * 60 * 1000); // 300 days

      const episode: PodcastEpisode = {
        id: episodeId,
        title: blog.title,
        category: blog.category || 'Spiritual',
        excerpt: blog.excerpt || blog.title,
        mp3Key,
        mp3Url,
        durationSec,
        fileSizeBytes: buffer.length,
        publishedAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
        articleId: blog.id,
      };

      await saveEpisodeToFirestore(episode);
    } catch (err: any) {
      console.error(`   ❌ Failed ID audio for ${blog.id}:`, err.message);
    }

    // 2. English Audio
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log(`   🌐 Translating "${blog.title.slice(0, 30)}..." to English...`);
      const enTitle = await translateToEnglish(blog.title);
      const enExcerpt = await translateToEnglish(blog.excerpt || blog.title);
      const enContent = await translateToEnglish(content.slice(0, 3500));

      const { buffer, durationSec } = await textToMp3(enTitle, enExcerpt, enContent, 'en');
      const timestamp = Date.now();
      const mp3Key = `podcast/ep-${blog.id}-en-${timestamp}.mp3`;

      const mp3Url = await uploadMp3(mp3Key, buffer);
      console.log(`   🌐 EN MP3 uploaded: ${mp3Url} (${formatDuration(durationSec)})`);
    } catch (err: any) {
      console.error(`   ❌ Failed EN audio for ${blog.id}:`, err.message);
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  console.log('\n📡 Updating podcast/feed.xml on R2...');
  const recentEpisodes = await getRecentEpisodesFromFirestore(30);
  const rssXml = buildRssXml(recentEpisodes);
  await uploadRssXml(rssXml);
  console.log('✨ ALL DONE! Published blogs now have real ID and EN TTS MP3 audio on R2!');
}

main();
