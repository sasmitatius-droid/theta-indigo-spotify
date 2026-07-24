/** Simplified Human Design profile derived from birth data (educational / reflective use). */

export interface HumanDesignProfile {
  type: string;
  profile: string;
  authority: string;
  strategy: string;
  definition: string;
  centers: { defined: string[]; open: string[] };
  summary: string;
}

const TYPES = ['Generator', 'Manifesting Generator', 'Projector', 'Manifestor', 'Reflector'] as const;
const PROFILES = ['1/3', '1/4', '2/4', '2/5', '3/5', '3/6', '4/6', '4/1', '5/1', '5/2', '6/2', '6/3'] as const;
const AUTHORITIES = [
  'Sacral',
  'Emotional (Solar Plexus)',
  'Splenic',
  'Ego Manifested',
  'Self-Projected',
  'Mental (Environmental)',
  'Lunar (no inner authority)',
] as const;
const CENTERS = [
  'Head',
  'Ajna',
  'Throat',
  'G',
  'Heart (Ego)',
  'Sacral',
  'Solar Plexus',
  'Spleen',
  'Root',
] as const;

function hashSeed(date: Date, time?: string): number {
  const base = `${date.getFullYear()}${date.getMonth() + 1}${date.getDate()}${time || '12:00'}`;
  let h = 0;
  for (let i = 0; i < base.length; i++) h = (h * 31 + base.charCodeAt(i)) % 9973;
  return h;
}

function pick<T>(arr: readonly T[], seed: number, offset: number): T {
  return arr[(seed + offset) % arr.length];
}

export function calculateHumanDesign(birthDate: Date, birthTime?: string): HumanDesignProfile {
  const seed = hashSeed(birthDate, birthTime);
  const type = pick(TYPES, seed, 0);
  const profile = pick(PROFILES, seed, 3);
  const authority = pick(AUTHORITIES, seed, 7);
  const strategy =
    type === 'Generator' || type === 'Manifesting Generator'
      ? 'Tunggu respons dari dunia (Sacral: ya/tidak)'
      : type === 'Projector'
        ? 'Tunggu undangan dan pengakuan'
        : type === 'Manifestor'
          ? 'Informasikan sebelum bertindak'
          : 'Tunggu siklus bulan penuh (28 hari) untuk keputusan besar';

  const definedCount = 3 + (seed % 4);
  const shuffled = [...CENTERS].sort((a, b) => ((seed + a.length) % 11) - ((seed + b.length) % 11));
  const defined = shuffled.slice(0, definedCount);
  const open = CENTERS.filter((c) => !defined.includes(c));
  const definition =
    definedCount <= 3 ? 'Single Definition' : definedCount <= 6 ? 'Split Definition' : 'Triple / Wide Definition';

  const summary = `Sebagai ${type} dengan profil ${profile}, Anda dirancang untuk ${strategy.toLowerCase()}. Otoritas batin: ${authority}. Definisi energi: ${definition}.`;

  return {
    type,
    profile,
    authority,
    strategy,
    definition,
    centers: { defined, open },
    summary,
  };
}
