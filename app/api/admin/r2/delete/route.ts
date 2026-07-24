import { NextResponse } from 'next/server';
import { DeleteObjectsCommand } from '@aws-sdk/client-s3';
import { s3Client, R2_BUCKET_NAME } from '@/lib/r2-client';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { keys } = await request.json();

    if (!keys || !Array.isArray(keys) || keys.length === 0) {
      return NextResponse.json({ error: 'Daftar key file tidak valid.' }, { status: 400 });
    }

    const deleteParams = {
      Bucket: R2_BUCKET_NAME,
      Delete: {
        Objects: keys.map((key) => ({ Key: key })),
        Quiet: true,
      },
    };

    await s3Client.send(new DeleteObjectsCommand(deleteParams));

    return NextResponse.json({
      success: true,
      message: `${keys.length} file berhasil dihapus dari Cloudflare R2.`,
    });
  } catch (error: any) {
    console.error('R2 Delete error:', error);
    return NextResponse.json({ error: error.message || 'Gagal menghapus file.' }, { status: 500 });
  }
}
