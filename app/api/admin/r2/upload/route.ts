import { NextResponse } from 'next/server';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { s3Client, R2_BUCKET_NAME } from '@/lib/r2-client';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'File tidak ditemukan.' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    let buffer = Buffer.from(bytes);
    let fileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    let contentType = file.type || 'application/octet-stream';
    let size = file.size;

    if (file.type.startsWith('image/')) {
      try {
        // Dynamically require sharp so compile doesn't break if not installed yet
        const sharp = require('sharp');
        buffer = await sharp(buffer)
          .webp({ quality: 75 })
          .toBuffer();

        // Change extension to .webp
        const lastDot = file.name.lastIndexOf('.');
        const baseName = lastDot !== -1 ? file.name.substring(0, lastDot) : file.name;
        const safeBase = baseName.replace(/[^a-zA-Z0-9.-]/g, '_');
        fileName = `${safeBase}.webp`;
        contentType = 'image/webp';
        size = buffer.length;
      } catch (err) {
        console.warn('Sharp compression failed, uploading original image:', err);
      }
    }

    const uniqueKey = `${Date.now()}-${fileName}`;

    const uploadParams = {
      Bucket: R2_BUCKET_NAME,
      Key: uniqueKey,
      Body: buffer,
      ContentType: contentType,
    };

    await s3Client.send(new PutObjectCommand(uploadParams));

    const publicUrlBase = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || '';
    const fileUrl = publicUrlBase
      ? `${publicUrlBase.replace(/\/$/, '')}/${uniqueKey}`
      : `/api/admin/r2/presign?key=${uniqueKey}`;

    return NextResponse.json({
      success: true,
      file: {
        key: uniqueKey,
        name: fileName,
        size: size,
        type: contentType,
        url: fileUrl,
      },
    });
  } catch (error: any) {
    console.error('R2 Upload error:', error);
    return NextResponse.json({ error: error.message || 'Gagal mengunggah file.' }, { status: 500 });
  }
}
