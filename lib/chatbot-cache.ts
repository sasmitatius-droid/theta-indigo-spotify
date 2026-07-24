import crypto from 'crypto';
import { getFromR2Json, saveToR2Json } from './r2-client';

export interface CachedChatResponse {
  question: string;
  normalizedQuestion: string;
  reply: string;
  cachedAt: string;
}

// Keywords that indicate the user wants live / up-to-date data
const BYPASS_KEYWORDS = [
  'hari ini',
  'sekarang',
  'terbaru',
  'terkini',
  'berita',
  'berita terbaru',
  'topik tren',
  'trending',
  'konten harian',
  'wuku hari ini',
  'weton hari ini',
  'artikel hari ini',
  'ensiklopedia',
  'wuku minggu ini',
  'wuku',
  'weton',
  'ramalan hari ini',
  'tanggal',
  'bulan ini',
  'tahun ini',
  'jam berapa',
];

/**
 * Normalizes user question to maximize cache hit rate for semantically identical questions.
 */
export function normalizeQuery(query: string): string {
  return query
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/gi, '') // remove punctuation
    .replace(/\s+/g, ' ');   // normalize multiple spaces to single space
}

/**
 * Generates an R2 Object Key for the given query.
 */
export function getCacheKey(query: string): string {
  const normalized = normalizeQuery(query);
  const hash = crypto.createHash('sha256').update(normalized).digest('hex').slice(0, 32);
  return `chatbot-cache/q_${hash}.json`;
}

/**
 * Determines whether to bypass R2 cache for time-sensitive / live dynamic requests.
 */
export function shouldBypassCache(query: string): boolean {
  const normalized = query.toLowerCase();
  return BYPASS_KEYWORDS.some((kw) => normalized.includes(kw));
}

/**
 * Attempts to retrieve a cached AI response from Cloudflare R2.
 */
export function getCachedResponse(query: string): Promise<CachedChatResponse | null> {
  if (shouldBypassCache(query)) {
    return Promise.resolve(null);
  }

  const key = getCacheKey(query);
  return getFromR2Json<CachedChatResponse>(key).catch(() => null);
}

/**
 * Saves a new Q&A pair to Cloudflare R2 JSON storage.
 */
export async function setCachedResponse(query: string, reply: string): Promise<void> {
  // Do not cache live/time-sensitive queries
  if (shouldBypassCache(query)) {
    return;
  }

  const key = getCacheKey(query);
  const payload: CachedChatResponse = {
    question: query.trim(),
    normalizedQuestion: normalizeQuery(query),
    reply,
    cachedAt: new Date().toISOString(),
  };

  try {
    await saveToR2Json(key, payload);
  } catch (err) {
    console.warn(`[ChatbotCache] Failed to save cache for key ${key}:`, err);
  }
}
