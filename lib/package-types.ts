import { parseFeaturesText } from '@/lib/parse-package-features';

export interface SubscriptionPackage {
  id: string;
  name: string;
  price: number;
  features?: string[];
  /** Jumlah analisis yang boleh dibuat; null = unlimited */
  analysisQuota: number | null;
  /** Masa aktif langganan dalam hari */
  durationDays: number;
  unlimited?: boolean;
}

export const DEFAULT_PACKAGE_PRESETS: Omit<SubscriptionPackage, 'id'>[] = [
  {
    name: 'Starter',
    price: 25000,
    analysisQuota: 10,
    durationDays: 30,
    features: ['10 analisis spiritual', 'Berlaku 30 hari', 'Unduh PDF & WhatsApp'],
  },
  {
    name: 'Growth',
    price: 50000,
    analysisQuota: 25,
    durationDays: 30,
    features: ['25 analisis spiritual', 'Berlaku 30 hari', 'Unduh PDF & WhatsApp'],
  },
  {
    name: 'Pro',
    price: 100000,
    analysisQuota: 75,
    durationDays: 30,
    features: ['75 analisis spiritual', 'Berlaku 30 hari', 'Unduh PDF & WhatsApp'],
  },
  {
    name: 'Unlimited',
    price: 250000,
    analysisQuota: null,
    durationDays: 30,
    unlimited: true,
    features: ['Analisis unlimited', 'Berlaku 30 hari', 'Unduh PDF & WhatsApp', 'Prioritas generate'],
  },
];

export function normalizePackage(data: Record<string, unknown>, id: string): SubscriptionPackage {
  const unlimited = Boolean(data.unlimited) || data.analysisQuota === null;
  let features: string[] = [];
  if (Array.isArray(data.features)) {
    features = data.features as string[];
  } else if (typeof data.features === 'string' && data.features.trim()) {
    features = parseFeaturesText(data.features);
  }
  return {
    id,
    name: String(data.name || 'Paket'),
    price: Number(data.price) || 0,
    features,
    analysisQuota: unlimited ? null : Number(data.analysisQuota ?? 0),
    durationDays: Number(data.durationDays) || 30,
    unlimited,
  };
}
