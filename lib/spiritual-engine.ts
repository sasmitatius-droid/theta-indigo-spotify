import { reduceToSingleDigit } from './utils';
import { getPranataMangsa, type PranataMangsaResult } from './pranata-mangsa';
import { calculateWeton, calculateWuku, type WetonResult, type WukuResult } from './weton';
import { calculateKua, type KuaResult } from './kua';

export {
  getPranataMangsa,
  type PranataMangsaResult,
  calculateWeton,
  calculateWuku,
  type WetonResult,
  type WukuResult,
  calculateKua,
  type KuaResult,
};

export function generateBlueprintId(date: Date = new Date()): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `TIB-${yyyy}${mm}${dd}-${rand}`;
}

export interface NumerologyResult {
  lifePathNumber: number;
  soulNumber: number;
  destinyNumber: number;
  karmicLesson: number[];
  maturityNumber: number;
  personalYearNumber: number;
}

export interface ChakraResult {
  crown: number;
  thirdEye: number;
  throat: number;
  heart: number;
  solarPlexus: number;
  sacral: number;
  root: number;
  dominant: string;
  blocked: string[];
}

export interface AuraResult {
  primaryColor: string;
  secondaryColor: string;
  meaning: string;
}

export interface IndigoType {
  type: string;
  description: string;
  traits: string[];
}

export function calculateLifePathNumber(birthDate: Date): number {
  const day = birthDate.getDate();
  const month = birthDate.getMonth() + 1;
  const year = birthDate.getFullYear();

  const sum = day + month + year;
  return reduceToSingleDigit(sum);
}

export function calculateSoulNumber(name: string): number {
  const letterValues: { [key: string]: number } = {
    a: 1, b: 2, c: 3, d: 4, e: 5, f: 6, g: 7, h: 8, i: 9,
    j: 1, k: 2, l: 3, m: 4, n: 5, o: 6, p: 7, q: 8, r: 9,
    s: 1, t: 2, u: 3, v: 4, w: 5, x: 6, y: 7, z: 8,
  };

  const vowels = ['a', 'e', 'i', 'o', 'u'];
  const cleanName = name.toLowerCase().replace(/[^a-z]/g, '');
  
  let sum = 0;
  for (const char of cleanName) {
    if (vowels.includes(char)) {
      sum += letterValues[char] || 0;
    }
  }

  return reduceToSingleDigit(sum);
}

export function calculateDestinyNumber(name: string): number {
  const letterValues: { [key: string]: number } = {
    a: 1, b: 2, c: 3, d: 4, e: 5, f: 6, g: 7, h: 8, i: 9,
    j: 1, k: 2, l: 3, m: 4, n: 5, o: 6, p: 7, q: 8, r: 9,
    s: 1, t: 2, u: 3, v: 4, w: 5, x: 6, y: 7, z: 8,
  };

  const cleanName = name.toLowerCase().replace(/[^a-z]/g, '');
  
  let sum = 0;
  for (const char of cleanName) {
    sum += letterValues[char] || 0;
  }

  return reduceToSingleDigit(sum);
}

export function calculateKarmicLessons(name: string): number[] {
  const letterValues: { [key: string]: number } = {
    a: 1, b: 2, c: 3, d: 4, e: 5, f: 6, g: 7, h: 8, i: 9,
    j: 1, k: 2, l: 3, m: 4, n: 5, o: 6, p: 7, q: 8, r: 9,
    s: 1, t: 2, u: 3, v: 4, w: 5, x: 6, y: 7, z: 8,
  };

  const cleanName = name.toLowerCase().replace(/[^a-z]/g, '');
  const presentNumbers = new Set<number>();
  
  for (const char of cleanName) {
    presentNumbers.add(letterValues[char] || 0);
  }

  const lessons: number[] = [];
  for (let i = 1; i <= 9; i++) {
    if (!presentNumbers.has(i)) {
      lessons.push(i);
    }
  }

  return lessons;
}

export function calculateMaturityNumber(birthDate: Date, name: string): number {
  const lifePath = calculateLifePathNumber(birthDate);
  const destiny = calculateDestinyNumber(name);
  
  return reduceToSingleDigit(lifePath + destiny);
}

export function calculatePersonalYearNumber(birthDate: Date, currentDate: Date = new Date()): number {
  const day = birthDate.getDate();
  const month = birthDate.getMonth() + 1;
  const year = currentDate.getFullYear();

  const sum = day + month + year;
  return reduceToSingleDigit(sum);
}

export function calculateNumerology(birthDate: Date, name: string): NumerologyResult {
  return {
    lifePathNumber: calculateLifePathNumber(birthDate),
    soulNumber: calculateSoulNumber(name),
    destinyNumber: calculateDestinyNumber(name),
    karmicLesson: calculateKarmicLessons(name),
    maturityNumber: calculateMaturityNumber(birthDate, name),
    personalYearNumber: calculatePersonalYearNumber(birthDate),
  };
}

export function calculateChakra(birthDate: Date, name: string): ChakraResult {
  const numerology = calculateNumerology(birthDate, name);
  const lifePath = numerology.lifePathNumber;
  
  // Base chakra values based on life path number
  const baseValues = {
    crown: (lifePath * 10) % 100,
    thirdEye: (lifePath * 15) % 100,
    throat: (lifePath * 12) % 100,
    heart: (lifePath * 18) % 100,
    solarPlexus: (lifePath * 14) % 100,
    sacral: (lifePath * 16) % 100,
    root: (lifePath * 13) % 100,
  };

  // Normalize to 0-100 range
  const normalized = {
    crown: Math.min(100, Math.max(20, baseValues.crown)),
    thirdEye: Math.min(100, Math.max(20, baseValues.thirdEye)),
    throat: Math.min(100, Math.max(20, baseValues.throat)),
    heart: Math.min(100, Math.max(20, baseValues.heart)),
    solarPlexus: Math.min(100, Math.max(20, baseValues.solarPlexus)),
    sacral: Math.min(100, Math.max(20, baseValues.sacral)),
    root: Math.min(100, Math.max(20, baseValues.root)),
  };

  // Find dominant chakra
  const chakras = Object.entries(normalized);
  const dominant = chakras.reduce((a, b) => (a[1] > b[1] ? a : b))[0];

  // Find blocked chakras (below 50)
  const blocked = chakras
    .filter(([_, value]) => value < 50)
    .map(([name]) => name);

  return {
    ...normalized,
    dominant,
    blocked,
  };
}

export function calculateAura(birthDate: Date, name: string): AuraResult {
  const numerology = calculateNumerology(birthDate, name);
  const lifePath = numerology.lifePathNumber;
  const soul = numerology.soulNumber;

  const auraColors: { [key: number]: AuraResult } = {
    1: {
      primaryColor: '#FF6B6B',
      secondaryColor: '#FFE66D',
      meaning: 'Aura merah menunjukkan gairah, keberanian, dan kualitas kepemimpinan yang kuat. Anda adalah perintis alami dengan energi tak terbatas.',
    },
    2: {
      primaryColor: '#4ECDC4',
      secondaryColor: '#95E1D3',
      meaning: 'Aura pirus mewakili keseimbangan, harmoni, dan kecerdasan emosional. Anda adalah pembawa kedamaian alami.',
    },
    3: {
      primaryColor: '#FFE66D',
      secondaryColor: '#FF6B6B',
      meaning: 'Aura kuning melambangkan kreativitas, optimisme, dan rasa ingin tahu intelektual. Anda mengekspresikan diri dengan penuh sukacita.',
    },
    4: {
      primaryColor: '#95E1D3',
      secondaryColor: '#4ECDC4',
      meaning: 'Aura hijau mewakili pertumbuhan, penyembuhan, dan stabilitas. Anda sangat membumi dan penuh kasih sayang.',
    },
    5: {
      primaryColor: '#DDA0DD',
      secondaryColor: '#BA55D3',
      meaning: 'Aura plum menunjukkan kebebasan, petualangan, dan keserbagunaan. Anda mudah merangkul perubahan dan pengalaman baru.',
    },
    6: {
      primaryColor: '#87CEEB',
      secondaryColor: '#4169E1',
      meaning: 'Aura biru langit mewakili kasih sayang, tanggung jawab, dan cinta. Anda adalah sosok pengasuh alami.',
    },
    7: {
      primaryColor: '#9370DB',
      secondaryColor: '#8A2BE2',
      meaning: 'Aura ungu melambangkan spiritualitas, intuisi, dan kebijaksanaan. Anda memiliki kemampuan psikis yang mendalam.',
    },
    8: {
      primaryColor: '#C0C0C0',
      secondaryColor: '#A9A9A9',
      meaning: 'Aura perak mewakili ambisi, kesuksesan, dan penguasaan materi. Anda adalah sosok yang berprestasi secara alami.',
    },
    9: {
      primaryColor: '#E6E6FA',
      secondaryColor: '#DDA0DD',
      meaning: 'Aura lavender mewakili rasa kemanusiaan, penyelesaian, dan cinta universal. Anda adalah seorang visioner.',
    },
    11: {
      primaryColor: '#FFD700',
      secondaryColor: '#FFA500',
      meaning: 'Aura emas menunjukkan penguasaan spiritual, pencerahan, dan koneksi ilahi. Anda adalah guru spiritual tingkat tinggi.',
    },
    22: {
      primaryColor: '#F0E68C',
      secondaryColor: '#BDB76B',
      meaning: 'Aura pembangun agung mewakili manifestasi, spiritualitas praktis, dan dampak global.',
    },
    33: {
      primaryColor: '#FFFFFF',
      secondaryColor: '#F5F5F5',
      meaning: 'Aura putih melambangkan penguasaan spiritual murni, cinta tanpa syarat, dan kesadaran yang terangkat.',
    },
  };

  return auraColors[lifePath] || auraColors[1];
}

export function classifyIndigo(birthDate: Date, name: string): IndigoType {
  const numerology = calculateNumerology(birthDate, name);
  const chakra = calculateChakra(birthDate, name);
  const lifePath = numerology.lifePathNumber;
  const soul = numerology.soulNumber;

  const indigoTypes: { [key: string]: IndigoType } = {
    warrior: {
      type: 'Pejuang Indigo',
      description: 'Anda adalah kekuatan besar untuk perubahan, menerobos batasan, dan berjuang untuk kebenaran.',
      traits: ['Berani', 'Penuh Tekad', 'Pelindung', 'Revolusioner'],
    },
    mystic: {
      type: 'Mistikus Indigo',
      description: 'Anda memiliki kebijaksanaan spiritual yang mendalam dan karunia intuitif, mampu menghubungkan alam di luar fisik.',
      traits: ['Intuitif', 'Bijaksana', 'Psikis', 'Meditatif'],
    },
    healer: {
      type: 'Penyembuh Indigo',
      description: 'Anda memiliki kemampuan penyembuhan alami dan dapat menyelaraskan energi bagi orang lain.',
      traits: ['Penuh Kasih', 'Empati', 'Pemulih', 'Memelihara'],
    },
    visionary: {
      type: 'Visioner Indigo',
      description: 'Anda melihat kemungkinan yang dilewatkan orang lain dan dapat mewujudkan realitas masa depan.',
      traits: ['Inovatif', 'Kreatif', 'Profetik', 'Menginspirasi'],
    },
    creator: {
      type: 'Pencipta Indigo',
      description: 'Anda membawa ide dan kreasi baru menjadi kenyataan, memadukan seni dan spiritualitas dengan indah.',
      traits: ['Artistik', 'Ekspresif', 'Orisinal', 'Mewujudkan'],
    },
  };

  // Classification logic based on numerology and chakra
  if (lifePath === 1 || lifePath === 8 || lifePath === 22) {
    return indigoTypes.warrior;
  } else if (lifePath === 7 || lifePath === 9 || lifePath === 11 || lifePath === 33) {
    return indigoTypes.mystic;
  } else if (lifePath === 2 || lifePath === 6 || chakra.heart > 80) {
    return indigoTypes.healer;
  } else if (lifePath === 3 || lifePath === 5 || chakra.thirdEye > 80) {
    return indigoTypes.visionary;
  } else {
    return indigoTypes.creator;
  }
}
