import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';

// ─── Config ────────────────────────────────────────────────────────────────────

const accountId     = process.env.R2_ACCOUNT_ID     || '';
const accessKeyId   = process.env.R2_ACCESS_KEY_ID  || '';
const secretKey     = process.env.R2_SECRET_ACCESS_KEY || '';
const bucketName    = process.env.R2_BUCKET_NAME    || 'theta-indigo';

export const R2_PUBLIC_URL = (
  process.env.R2_PUBLIC_URL ||
  'https://pub-3dfac1ebd38a458faff5626cae902ad2.r2.dev'
).replace(/\/$/, '');

export const R2_BUCKET = bucketName;

export const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId, secretAccessKey: secretKey },
});

// ─── Upload Helpers ────────────────────────────────────────────────────────────

/** Upload MP3 buffer and return its public URL. */
export async function uploadMp3(key: string, buffer: Buffer): Promise<string> {
  await s3Client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: buffer,
      ContentType: 'audio/mpeg',
      CacheControl: 'public, max-age=86400',
      Metadata: { 'created-at': new Date().toISOString() },
    })
  );
  return `${R2_PUBLIC_URL}/${key}`;
}

/** Upload RSS XML and return its public URL. */
export async function uploadRssXml(xml: string): Promise<string> {
  const key = 'podcast/feed.xml';
  await s3Client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: Buffer.from(xml, 'utf-8'),
      ContentType: 'application/rss+xml; charset=utf-8',
      CacheControl: 'no-cache, no-store, must-revalidate',
    })
  );
  return `${R2_PUBLIC_URL}/${key}`;
}

/** Upload cover art PNG to a permanent key (no expiry). */
export async function uploadCoverArt(buffer: Buffer): Promise<string> {
  const key = 'podcast/cover.png';
  await s3Client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: buffer,
      ContentType: 'image/png',
      CacheControl: 'public, max-age=31536000',
    })
  );
  return `${R2_PUBLIC_URL}/${key}`;
}

/** Upload arbitrary JSON to a given key. */
export async function uploadJson(key: string, data: unknown): Promise<void> {
  await s3Client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: JSON.stringify(data, null, 2),
      ContentType: 'application/json',
    })
  );
}

// ─── Download Helpers ──────────────────────────────────────────────────────────

/** Download and parse a JSON file from R2. Returns null if not found. */
export async function downloadJson<T>(key: string): Promise<T | null> {
  try {
    const res = await s3Client.send(
      new GetObjectCommand({ Bucket: bucketName, Key: key })
    );
    const body = await res.Body?.transformToString();
    return body ? (JSON.parse(body) as T) : null;
  } catch {
    return null;
  }
}

/** Download a binary object from R2. Returns null if not found. */
export async function downloadBuffer(key: string): Promise<Buffer | null> {
  try {
    const res = await s3Client.send(
      new GetObjectCommand({ Bucket: bucketName, Key: key })
    );
    if (!res.Body) return null;
    return Buffer.from(await res.Body.transformToByteArray());
  } catch {
    return null;
  }
}

/** Check if an R2 object exists. */
export async function objectExists(key: string): Promise<boolean> {
  try {
    await s3Client.send(new GetObjectCommand({ Bucket: bucketName, Key: key }));
    return true;
  } catch {
    return false;
  }
}

// ─── Delete Helpers ────────────────────────────────────────────────────────────

/** Delete a single R2 object. */
export async function deleteObject(key: string): Promise<void> {
  await s3Client.send(
    new DeleteObjectCommand({ Bucket: bucketName, Key: key })
  );
}

// ─── Cleanup — 24h Auto-Delete ────────────────────────────────────────────────

/**
 * List all podcast MP3 episodes and delete any older than `olderThanMs` ms.
 * MP3 keys follow the pattern: podcast/ep-{articleId}-{timestampMs}.mp3
 * Returns list of deleted keys.
 */
export async function cleanupOldEpisodes(
  olderThanMs = 24 * 60 * 60 * 1000
): Promise<string[]> {
  const deleted: string[] = [];

  const res = await s3Client.send(
    new ListObjectsV2Command({ Bucket: bucketName, Prefix: 'podcast/ep-' })
  );

  const now = Date.now();

  for (const obj of res.Contents ?? []) {
    if (!obj.Key) continue;

    // Extract timestamp from filename: podcast/ep-{id}-{13-digit-ts}.mp3
    const match = obj.Key.match(/-(\d{13})\.mp3$/);
    if (!match) continue;

    const createdAt = parseInt(match[1], 10);
    const age = now - createdAt;

    if (age > olderThanMs) {
      try {
        await deleteObject(obj.Key);
        deleted.push(obj.Key);
        console.log(`🗑️  Deleted expired episode (${Math.round(age / 3600000)}h old): ${obj.Key}`);
      } catch (err) {
        console.warn(`⚠️  Failed to delete ${obj.Key}:`, err);
      }
    }
  }

  return deleted;
}
