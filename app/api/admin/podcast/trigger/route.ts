import { NextResponse } from 'next/server';
import { verifyAdminRequest } from '@/lib/ensure-admin';
import { textToMp3, formatDuration } from '@/src/tts-service';
import {
  uploadMp3,
  uploadRssXml,
  objectExists,
  uploadCoverArt,
  s3Client,
  R2_BUCKET,
  R2_PUBLIC_URL,
} from '@/src/r2-client';
import {
  saveEpisodeToFirestore,
  getRecentEpisodesFromFirestore,
  type PodcastEpisode,
} from '@/src/firebase-client';
import { buildRssXml } from '@/src/rss-builder';
import { notifySuccess } from '@/src/telegram-notify';
import { queryD1 } from '@/lib/cloudflare-db';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60s timeout for Next.js API routes

interface D1BlogRow {
  id: string;
  title: string;
  excerpt: string | null;
  category: string;
  contentR2Path: string | null;
}

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
    console.warn('⚠️ Could not fetch article content from R2:', (err as Error).message);
  }
  return '';
}

async function ensureCoverArt(): Promise<string> {
  const coverKey = 'podcast/cover.png';
  const coverUrl = `${R2_PUBLIC_URL}/${coverKey}`;

  if (await objectExists(coverKey)) {
    return coverUrl;
  }

  const candidates = [
    path.resolve(process.cwd(), 'assets/logo-indigo-sp.png'),
    path.resolve(process.cwd(), 'assets/cover.png'),
    path.resolve(process.cwd(), 'public/logo-indigo-sp.png'),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      const buffer = fs.readFileSync(candidate);
      await uploadCoverArt(buffer);
      return coverUrl;
    }
  }

  return coverUrl;
}

export async function POST(request: Request) {
  const auth = await verifyAdminRequest(request);
  if (!auth.allowed) {
    return NextResponse.json(
      { error: auth.error || 'Unauthorized' },
      { status: auth.error?.includes('Forbidden') ? 403 : 401 }
    );
  }

  try {
    let action = 'generate';
    try {
      const body = await request.json();
      if (body?.action) action = body.action;
    } catch {
      // JSON optional
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Action 1: Rebuild RSS XML feed from Firestore
    // ──────────────────────────────────────────────────────────────────────────
    if (action === 'rebuild-rss') {
      console.log('📡 [Admin] Rebuilding Podcast RSS XML from Firestore...');
      const recentEpisodes = await getRecentEpisodesFromFirestore(30);
      const rssXml = buildRssXml(recentEpisodes);
      const feedUrl = await uploadRssXml(rssXml);

      return NextResponse.json({
        success: true,
        action: 'rebuild-rss',
        episodesCount: recentEpisodes.length,
        feedUrl,
        message: `RSS Feed XML berhasil diperbarui dari Firestore (${recentEpisodes.length} episode).`,
      });
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Action 2: Generate Full Podcast Episode + Update RSS
    // ──────────────────────────────────────────────────────────────────────────
    console.log('🎙️ [Admin] Starting manual podcast generation pipeline...');

    // 1. Fetch latest article from Cloudflare D1
    const rows = await queryD1<D1BlogRow>(
      `SELECT id, title, excerpt, category, contentR2Path
       FROM blogs
       WHERE status = 'published' OR published = 1
       ORDER BY createdAt DESC
       LIMIT 1`
    );

    if (!rows || rows.length === 0) {
      return NextResponse.json(
        { error: 'Tidak ada artikel yang dipublikasikan di D1.' },
        { status: 404 }
      );
    }

    const row = rows[0];
    const category = row.category || 'Spiritual';
    const content = row.contentR2Path
      ? await fetchArticleContent(row.contentR2Path)
      : (row.excerpt ?? row.title);

    console.log(`📝 [Admin] Article selected: "${row.title}" (ID: ${row.id})`);

    // 2. Generate Audio MP3 via TTS
    const { buffer, durationSec } = await textToMp3(
      row.title,
      row.excerpt ?? row.title,
      content,
      'id'
    );
    const durationFormatted = formatDuration(durationSec);

    // 3. Upload MP3 to R2
    const episodeId = crypto.randomUUID();
    const timestamp = Date.now();
    const mp3Key = `podcast/ep-${row.id}-${timestamp}.mp3`;
    const mp3Url = await uploadMp3(mp3Key, buffer);

    // 4. Ensure cover art
    await ensureCoverArt();

    // 5. Save metadata to Firestore
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 300 * 24 * 60 * 60 * 1000);

    const episode: PodcastEpisode = {
      id: episodeId,
      title: row.title,
      category,
      excerpt: row.excerpt || row.title,
      mp3Key,
      mp3Url,
      durationSec,
      fileSizeBytes: buffer.length,
      publishedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      articleId: row.id,
    };

    await saveEpisodeToFirestore(episode);

    // 6. Build and upload RSS XML to R2
    const recentEpisodes = await getRecentEpisodesFromFirestore(30);
    const rssXml = buildRssXml(recentEpisodes);
    const feedUrl = await uploadRssXml(rssXml);

    // 7. Telegram Notification (non-blocking)
    try {
      await notifySuccess({
        episodeTitle: row.title,
        category,
        durationFormatted,
        mp3SizeKb: Math.round(buffer.length / 1024),
        episodeId,
      });
    } catch (tgErr) {
      console.warn('Telegram notify error:', tgErr);
    }

    return NextResponse.json({
      success: true,
      action: 'generate',
      episodeId,
      title: row.title,
      category,
      duration: durationFormatted,
      mp3SizeKb: Math.round(buffer.length / 1024),
      feedUrl,
      message: `Episode podcast "${row.title}" berhasil dibuat dan RSS Feed di-update!`,
    });
  } catch (error: any) {
    console.error('Error in /api/admin/podcast/trigger:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal memproses podcast trigger.' },
      { status: 500 }
    );
  }
}
