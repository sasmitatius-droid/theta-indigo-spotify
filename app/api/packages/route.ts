import { NextResponse } from 'next/server';
import { queryD1 } from '@/lib/cloudflare-db';
import { normalizePackage } from '@/lib/package-types';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const pkgs = await queryD1(
      'SELECT id, name, price, analysisQuota, durationDays, unlimited, features FROM packages WHERE active = 1'
    );
    const normalized = pkgs.map((pkg) => {
      let featuresList = [];
      if (pkg.features) {
        try {
          featuresList = JSON.parse(pkg.features);
        } catch {
          featuresList = pkg.features;
        }
      }
      return normalizePackage(
        {
          ...pkg,
          features: featuresList,
          unlimited: pkg.unlimited === 1,
        },
        pkg.id
      );
    });
    return NextResponse.json(normalized);
  } catch (error: any) {
    console.error('GET /api/packages error:', error);
    return NextResponse.json({ error: error.message || 'Gagal mengambil paket.' }, { status: 500 });
  }
}
