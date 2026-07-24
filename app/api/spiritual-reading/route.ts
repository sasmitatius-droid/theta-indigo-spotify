import { NextResponse } from 'next/server';
import { calculateHumanDesign } from '@/lib/human-design';
import { generateReadingWithTimeout } from '@/lib/deepseek-service';
import { toApiResponse, type SpiritualReadingPayload } from '@/lib/spiritual-fallback';

export const runtime = 'nodejs';
export const maxDuration = 25;

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as SpiritualReadingPayload;

    if (!payload?.input?.name || !payload?.input?.birthDate) {
      return NextResponse.json({ error: 'Data profil tidak lengkap.' }, { status: 400 });
    }

    if (!payload.numerology || !payload.indigoType || !payload.chakra || !payload.aura) {
      return NextResponse.json({ error: 'Data spiritual belum dihitung.' }, { status: 400 });
    }

    if (!payload.humanDesign) {
      payload.humanDesign = calculateHumanDesign(
        new Date(payload.input.birthDate),
        payload.input.birthTime,
      );
    }

    const { reading, source } = await generateReadingWithTimeout(payload, 5500);

    return NextResponse.json(toApiResponse(reading, source));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal membuat bacaan spiritual.';
    console.error('spiritual-reading API:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
