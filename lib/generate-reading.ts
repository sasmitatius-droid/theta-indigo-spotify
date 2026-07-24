import type { ReadingResult, SpiritualDetailedInsights, BaZiResult } from '@/types';
import {
  getPranataMangsa,
  generateBlueprintId,
  calculateWeton,
  calculateWuku,
  calculateKua,
  type AuraResult,
  type ChakraResult,
  type IndigoType,
  type NumerologyResult,
  type PranataMangsaResult,
  type WetonResult,
  type WukuResult,
  type KuaResult,
} from '@/lib/spiritual-engine';
import { calculateHumanDesign } from '@/lib/human-design';
import { calculateBaZi } from '@/lib/bazi';
import type { HumanDesignProfile } from '@/lib/human-design';
import {
  buildFallbackReading,
  toApiResponse,
  type SpiritualReadingPayload,
} from '@/lib/spiritual-fallback';
import { generateId } from '@/lib/utils';

export interface ReadingFormPayload {
  name: string;
  birthDate: string;
  birthTime?: string;
  gender?: string;
  country?: string;
  city?: string;
  spiritualGoal?: string;
}

interface AiReadingResponse {
  detailedInsights: SpiritualDetailedInsights;
  spiritualReading: string;
  affirmations: { text: string; category: string }[];
  timeline: { phase: string; description: string; year: number }[];
}

function buildPayload(
  data: ReadingFormPayload,
  calculated: {
    numerology: NumerologyResult;
    indigoType: IndigoType;
    chakra: ChakraResult;
    aura: AuraResult;
    pranataMangsa: PranataMangsaResult;
    humanDesign: HumanDesignProfile;
  },
  blueprintId: string,
): SpiritualReadingPayload {
  return {
    input: {
      name: data.name,
      birthDate: data.birthDate,
      birthTime: data.birthTime,
      gender: data.gender,
      country: data.country,
      city: data.city,
      spiritualGoal: data.spiritualGoal,
    },
    blueprintId,
    numerology: calculated.numerology,
    indigoType: calculated.indigoType,
    chakra: calculated.chakra,
    aura: calculated.aura,
    pranataMangsa: calculated.pranataMangsa,
    humanDesign: calculated.humanDesign,
  };
}

async function fetchAiReading(payload: SpiritualReadingPayload): Promise<AiReadingResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch('/api/spiritual-reading', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    const body = await response.json();

    if (!response.ok) {
      throw new Error(body.error || `Server error ${response.status}`);
    }

    return body as AiReadingResponse;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function generateCompleteReading(
  data: ReadingFormPayload,
  calculated: {
    numerology: NumerologyResult;
    indigoType: IndigoType;
    chakra: ChakraResult;
    aura: AuraResult;
    pranataMangsa?: PranataMangsaResult;
    weton?: WetonResult;
    wuku?: WukuResult;
    kua?: KuaResult;
    bazi?: BaZiResult;
    humanDesign?: HumanDesignProfile;
  },
  userId: string,
): Promise<ReadingResult> {
  const birthDate = new Date(data.birthDate);
  const createdAt = new Date();
  const blueprintId = generateBlueprintId(createdAt);
  const pranataMangsa = calculated.pranataMangsa ?? getPranataMangsa(birthDate);
  const weton = calculated.weton ?? calculateWeton(birthDate);
  const wuku = calculated.wuku ?? calculateWuku(birthDate);
  const kua = calculated.kua ?? calculateKua(birthDate, data.gender || 'male');
  const bazi = calculated.bazi ?? calculateBaZi(birthDate, data.birthTime, data.gender);
  const humanDesign =
    calculated.humanDesign ?? calculateHumanDesign(birthDate, data.birthTime);
  const payload = buildPayload(data, { ...calculated, pranataMangsa, humanDesign }, blueprintId);

  let ai: AiReadingResponse;

  try {
    ai = await fetchAiReading(payload);
  } catch (error) {
    console.warn('API spiritual-reading gagal, pakai fallback lokal:', error);
    ai = toApiResponse(buildFallbackReading(payload), 'fallback') as AiReadingResponse;
  }

  const fallbackInsights = buildFallbackReading(payload);
  const baseInsights = ai.detailedInsights || {
    indigoAnalysis: fallbackInsights.indigoAnalysis,
    numerologyAnalysis: fallbackInsights.numerologyAnalysis,
    chakraAnalysis: fallbackInsights.chakraAnalysis,
    auraAnalysis: fallbackInsights.auraAnalysis,
    spiritualReading: fallbackInsights.spiritualReading,
    humanDesignAnalysis: fallbackInsights.humanDesignAnalysis,
    psychologyAnalysis: fallbackInsights.psychologyAnalysis,
    pranataMangsaAnalysis: fallbackInsights.pranataMangsaAnalysis,
  };
  const detailedInsights = {
    ...baseInsights,
    humanDesignAnalysis: baseInsights.humanDesignAnalysis || fallbackInsights.humanDesignAnalysis,
    psychologyAnalysis: baseInsights.psychologyAnalysis || fallbackInsights.psychologyAnalysis,
    pranataMangsaAnalysis: baseInsights.pranataMangsaAnalysis || fallbackInsights.pranataMangsaAnalysis,
  };

  return {
    id: generateId(),
    blueprintId,
    userId,
    input: {
      name: data.name,
      birthDate,
      birthTime: data.birthTime,
      gender: data.gender,
      country: data.country,
      city: data.city,
      spiritualGoal: data.spiritualGoal,
    },
    numerology: calculated.numerology,
    indigoType: calculated.indigoType,
    chakra: calculated.chakra,
    aura: calculated.aura,
    pranataMangsa,
    weton,
    wuku,
    kua,
    bazi,
    humanDesign,
    detailedInsights,
    spiritualReading: ai.spiritualReading,
    affirmations: ai.affirmations,
    timeline: ai.timeline,
    createdAt,
  };
}
