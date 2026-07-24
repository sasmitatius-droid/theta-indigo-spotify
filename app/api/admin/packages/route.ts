import { NextResponse } from 'next/server';
import { executeD1, queryD1 } from '@/lib/cloudflare-db';
import { verifyAdminRequest } from '@/lib/ensure-admin';
import { generateId } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const auth = await verifyAdminRequest(request);
  if (!auth.allowed) {
    return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.error?.includes('Forbidden') ? 403 : 401 });
  }

  try {
    const pkgs = await queryD1('SELECT * FROM packages ORDER BY price ASC');
    const mapped = pkgs.map((p) => {
      let parsedFeatures = [];
      if (p.features) {
        try {
          parsedFeatures = JSON.parse(p.features);
        } catch {
          parsedFeatures = p.features;
        }
      }
      return {
        ...p,
        features: parsedFeatures,
        unlimited: p.unlimited === 1,
        active: p.active === 1,
      };
    });
    return NextResponse.json(mapped);
  } catch (error: any) {
    console.error('GET /api/admin/packages error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await verifyAdminRequest(request);
  if (!auth.allowed) {
    return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.error?.includes('Forbidden') ? 403 : 401 });
  }

  try {
    const body = await request.json();
    const { name, price, analysisQuota, durationDays, unlimited, features } = body;

    const id = generateId();
    await executeD1(
      'INSERT INTO packages (id, name, price, analysisQuota, durationDays, unlimited, features, active) VALUES (?, ?, ?, ?, ?, ?, ?, 1)',
      [
        id,
        name || 'Paket Baru',
        Number(price) || 0,
        unlimited ? null : (analysisQuota === '' || analysisQuota === null ? null : Number(analysisQuota)),
        Number(durationDays) || 30,
        unlimited ? 1 : 0,
        JSON.stringify(Array.isArray(features) ? features : []),
      ]
    );

    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    console.error('POST /api/admin/packages error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
