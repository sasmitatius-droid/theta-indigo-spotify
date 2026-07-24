import { NextResponse } from 'next/server';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client, R2_BUCKET_NAME } from '@/lib/r2-client';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (!key) {
      return NextResponse.json({ error: 'Key file tidak ditentukan.' }, { status: 400 });
    }

    const command = new GetObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      ResponseContentDisposition: `attachment; filename="${encodeURIComponent(key.replace(/^\d+-/, ''))}"`,
    });

    // Generate signed URL valid for 60 seconds
    const url = await getSignedUrl(s3Client, command, { expiresIn: 60 });

    return NextResponse.json({ success: true, url });
  } catch (error: any) {
    console.error('R2 Presign error:', error);
    return NextResponse.json({ error: error.message || 'Gagal membuat signed URL.' }, { status: 500 });
  }
}
