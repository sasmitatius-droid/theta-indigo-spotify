import type { SpiritualDetailedInsights } from '@/types';
import {
  buildFallbackReading,
  type SpiritualReadingContent,
  type SpiritualReadingPayload,
} from '@/lib/spiritual-fallback';

export type { SpiritualReadingPayload };

export interface DeepSeekReadingResponse extends SpiritualDetailedInsights {
  affirmations: { text: string; category: string }[];
  timeline: { phase: string; description: string; year: number }[];
}

/** Batas waktu AI — harus di bawah limit Vercel (10s hobby / 30s edge) */
const AI_TIMEOUT_MS = Number(process.env.DEEPSEEK_TIMEOUT_MS || 6500);

function getDeepSeekConfig() {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new Error('DEEPSEEK_API_KEY belum diatur.');
  }

  const isOpenRouter = apiKey.startsWith('sk-or-');
  const baseUrl =
    process.env.DEEPSEEK_API_BASE_URL ||
    (isOpenRouter ? 'https://openrouter.ai/api/v1' : 'https://api.deepseek.com');
  const model =
    process.env.DEEPSEEK_MODEL ||
    (isOpenRouter ? 'deepseek/deepseek-chat' : 'deepseek-chat');

  return { apiKey, baseUrl, model, isOpenRouter };
}

function buildPrompt(payload: SpiritualReadingPayload): string {
  const { input, numerology, indigoType, chakra, aura, pranataMangsa } = payload;
  const birthDate = new Date(input.birthDate);
  const y = birthDate.getFullYear();

  return `Pembimbing spiritual Indonesia. Bahasa Indonesia. JSON saja.

Nama: ${input.name} | Lahir: ${birthDate.toLocaleDateString('id-ID')}
Jalan Hidup ${numerology.lifePathNumber}, Jiwa ${numerology.soulNumber}, Takdir ${numerology.destinyNumber}, Tahun Pribadi ${numerology.personalYearNumber}
Indigo: ${indigoType.type} | Chakra dominan: ${chakra.dominant} | Blokir: ${chakra.blocked.join(', ') || '-'}
Aura: ${aura.meaning}
Pranata Mangsa: ${pranataMangsa?.name || '-'} (${pranataMangsa?.period || ''}), Elemen ${pranataMangsa?.element || ''}, Pola: ${pranataMangsa?.psychologicalPattern || ''}
Human Design: ${payload.humanDesign.type}, profil ${payload.humanDesign.profile}, otoritas ${payload.humanDesign.authority}, strategi ${payload.humanDesign.strategy}
${input.spiritualGoal ? `Tujuan: ${input.spiritualGoal}` : ''}

{
  "indigoAnalysis": "150-200 kata",
  "numerologyAnalysis": "200-280 kata semua angka",
  "chakraAnalysis": "180-240 kata + saran praktis",
  "auraAnalysis": "120-180 kata",
  "humanDesignAnalysis": "200-280 kata: tipe, profil, otoritas, strategi, pusat terdefinisi/terbuka",
  "pranataMangsaAnalysis": "150-200 kata analisis iklim batin musim Jawa, korelasi elemen & metode pemulihan energi",
  "psychologyAnalysis": "220-300 kata psikologi mendalam: pola attachment, emosi, motivasi",
  "spiritualReading": "250-350 kata holistik 5 Lapisan Waktu",
  "affirmations": [{"text":"...","category":"..."}],
  "timeline": [{"phase":"Awakening","description":"70 kata","year":${y + 18}},{"phase":"Transformation","description":"70 kata","year":${y + 28}},{"phase":"Abundance","description":"70 kata","year":${y + 38}},{"phase":"Healing","description":"70 kata","year":${y + 48}}]
}
6 afirmasi. Padat dan personal.`;
}

function extractJson(text: string): DeepSeekReadingResponse {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenced ? fenced[1].trim() : trimmed;
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start === -1 || end === -1) {
    throw new Error('Respons AI bukan JSON valid.');
  }
  return JSON.parse(raw.slice(start, end + 1)) as DeepSeekReadingResponse;
}

export async function generateDeepSeekReading(
  payload: SpiritualReadingPayload,
): Promise<DeepSeekReadingResponse> {
  const { apiKey, baseUrl, model, isOpenRouter } = getDeepSeekConfig();
  const url = `${baseUrl.replace(/\/$/, '')}/chat/completions`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        ...(isOpenRouter ? { 'HTTP-Referer': 'https://www.indigoblueprint.my.id' } : {}),
      },
      body: JSON.stringify({
        model,
        temperature: 0.65,
        max_tokens: 2800,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: 'Ahli spiritual Indonesia. Balas hanya JSON valid.',
          },
          { role: 'user', content: buildPrompt(payload) },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('System API error:', response.status, errText);
      throw new Error('Gagal menghubungi System.');
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('Respons System kosong.');
    }

    return extractJson(content);
  } finally {
    clearTimeout(timeoutId);
  }
}

/** Panggil System dengan batas waktu keras; selalu selesai sebelum limit Vercel */
export async function generateReadingWithTimeout(
  payload: SpiritualReadingPayload,
  timeoutMs = 7000,
): Promise<{ reading: SpiritualReadingContent; source: 'system' | 'fallback' }> {
  const fallback = buildFallbackReading(payload);

  if (!process.env.DEEPSEEK_API_KEY) {
    return { reading: fallback, source: 'fallback' };
  }

  try {
    const reading = await Promise.race([
      generateDeepSeekReading(payload),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), timeoutMs),
      ),
    ]);
    const mergedReading: SpiritualReadingContent = {
      ...fallback,
      ...reading,
      pranataMangsaAnalysis: reading.pranataMangsaAnalysis || fallback.pranataMangsaAnalysis,
    };
    return { reading: mergedReading, source: 'system' };
  } catch (error) {
    console.error('System timeout/gagal:', error);
    return { reading: fallback, source: 'fallback' };
  }
}

export { buildFallbackReading };
