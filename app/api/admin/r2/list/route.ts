import { NextResponse } from 'next/server';
import { ListObjectsV2Command } from '@aws-sdk/client-s3';
import { s3Client, R2_BUCKET_NAME } from '@/lib/r2-client';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const listParams = {
      Bucket: R2_BUCKET_NAME,
    };

    const data = await s3Client.send(new ListObjectsV2Command(listParams));

    const files = (data.Contents || []).map((item) => {
      const key = item.Key || '';
      const publicUrlBase = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || '';
      const fileUrl = publicUrlBase
        ? `${publicUrlBase.replace(/\/$/, '')}/${key}`
        : `/api/admin/r2/presign?key=${encodeURIComponent(key)}`;

      // Infer type from extension
      const keyLower = key.toLowerCase();
      let type = 'application/octet-stream';
      if (keyLower.endsWith('.jpg') || keyLower.endsWith('.jpeg')) type = 'image/jpeg';
      else if (keyLower.endsWith('.png')) type = 'image/png';
      else if (keyLower.endsWith('.webp')) type = 'image/webp';
      else if (keyLower.endsWith('.gif')) type = 'image/gif';
      else if (keyLower.endsWith('.mp4')) type = 'video/mp4';
      else if (keyLower.endsWith('.mov')) type = 'video/quicktime';
      else if (keyLower.endsWith('.mp3')) type = 'audio/mpeg';

      return {
        key,
        name: key.replace(/^\d+-/, ''), // clean visual name by stripping timestamp prefix
        size: item.Size || 0,
        lastModified: item.LastModified,
        type,
        url: fileUrl,
      };
    });

    // Sort by latest modified first
    files.sort((a, b) => {
      const aTime = a.lastModified ? new Date(a.lastModified).getTime() : 0;
      const bTime = b.lastModified ? new Date(b.lastModified).getTime() : 0;
      return bTime - aTime;
    });

    return NextResponse.json({ success: true, files });
  } catch (error: any) {
    console.error('R2 List error:', error);
    return NextResponse.json({ error: error.message || 'Gagal mengambil daftar file.' }, { status: 500 });
  }
}
