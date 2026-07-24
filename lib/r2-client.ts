import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucketName = process.env.R2_BUCKET_NAME || 'theta-indigo';

if (!accountId || !accessKeyId || !secretAccessKey) {
  console.warn('⚠️ Cloudflare R2 credentials are not fully configured in environment variables.');
}

export const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: accessKeyId || '',
    secretAccessKey: secretAccessKey || '',
  },
});

export const R2_BUCKET_NAME = bucketName;
export const R2_PUBLIC_URL = (process.env.R2_PUBLIC_URL || 'https://pub-3dfac1ebd38a458faff5626cae902ad2.r2.dev').replace(/\/$/, '');

export async function getR2PodcastAudioMap(): Promise<Map<string, { url: string; length: string }>> {
  const map = new Map<string, { url: string; length: string }>();
  try {
    const res = await s3Client.send(
      new ListObjectsV2Command({
        Bucket: R2_BUCKET_NAME,
        Prefix: 'podcast/ep-',
      })
    );
    for (const obj of res.Contents || []) {
      if (!obj.Key) continue;
      const match = obj.Key.match(/ep-(.+)-[0-9]+\.mp3$/i);
      if (match) {
        const blogId = match[1].toLowerCase();
        const url = `${R2_PUBLIC_URL}/${obj.Key}`;
        const length = String(obj.Size || '1922304');
        map.set(blogId, { url, length });
      }
    }
  } catch (err) {
    console.warn('Failed to list R2 podcast audio files:', err);
  }
  return map;
}

export async function saveToR2Json(key: string, data: any): Promise<void> {
  const body = JSON.stringify(data);
  await s3Client.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: body,
      ContentType: 'application/json',
    })
  );
}

export async function saveToR2Buffer(key: string, buffer: Buffer, contentType: string = 'image/png'): Promise<void> {
  await s3Client.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  );
}

export async function getFromR2Json<T>(key: string): Promise<T> {
  const response = await s3Client.send(
    new GetObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    })
  );
  const body = await response.Body?.transformToString();
  if (!body) {
    throw new Error(`Empty body returned for R2 key ${key}`);
  }
  return JSON.parse(body) as T;
}

export async function deleteFromR2(key: string): Promise<void> {
  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    })
  );
}
