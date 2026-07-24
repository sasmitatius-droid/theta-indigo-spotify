export interface User {
  id: string;
  email?: string;
  displayName?: string;
  photoURL?: string;
  isGuest: boolean;
  createdAt: Date;
}

export interface ReadingInput {
  name: string;
  birthDate: Date;
  birthTime?: string;
  gender?: string;
  country?: string;
  city?: string;
  spiritualGoal?: string;
}

export interface HumanDesignResult {
  type: string;
  profile: string;
  authority: string;
  strategy: string;
  definition: string;
  centers: { defined: string[]; open: string[] };
  summary: string;
}

export interface SpiritualDetailedInsights {
  indigoAnalysis: string;
  numerologyAnalysis: string;
  chakraAnalysis: string;
  auraAnalysis: string;
  humanDesignAnalysis: string;
  psychologyAnalysis: string;
  pranataMangsaAnalysis?: string;
  spiritualReading: string;
}

export interface ReadingResult {
  id: string;
  blueprintId?: string;
  userId: string;
  input: ReadingInput;
  numerology: {
    lifePathNumber: number;
    soulNumber: number;
    destinyNumber: number;
    karmicLesson: number[];
    maturityNumber: number;
    personalYearNumber: number;
  };
  indigoType: {
    type: string;
    description: string;
    traits: string[];
  };
  chakra: {
    crown: number;
    thirdEye: number;
    throat: number;
    heart: number;
    solarPlexus: number;
    sacral: number;
    root: number;
    dominant: string;
    blocked: string[];
  };
  aura: {
    primaryColor: string;
    secondaryColor: string;
    meaning: string;
  };
  pranataMangsa?: {
    name: string;
    headline?: string;
    period: string;
    element: string;
    icon?: string;
    seasonCharacter: string;
    natureEnergy: string;
    psychologicalPattern: string;
    lifePhase: string;
    rechargeMethod: string;
    kontenFull?: string;
  };
  weton?: {
    dayName: string;
    pasaranName: string;
    wetonName: string;
    neptuDay: number;
    neptuPasaran: number;
    totalNeptu: number;
    characterTraits: string;
    strengths: string;
    challenges: string;
  };
  wuku?: {
    name: string;
    deity: string;
    theme: string;
    lifeLesson: string;
    growthEnergy: string;
    deskripsiFull?: string;
    wukuBullets?: string[];
    kebaikan?: string;
    keburukan?: string;
    aral?: string;
    sedekahSesaji?: string;
    keris?: string[];
  };
  bazi?: BaZiResult;
  kua?: {
    kuaNumber: number;
    group: string;
    bestSleepingDirection: string;
    bestWorkingDirection: string;
    bestStudyingDirection: string;
    bestRelationshipDirection: string;
    avoidDirections: string;
    summary: string;
  };
  humanDesign?: HumanDesignResult;
  detailedInsights?: SpiritualDetailedInsights;
  spiritualReading?: string;
  affirmations: {
    text: string;
    category: string;
  }[];
  timeline: {
    phase: string;
    description: string;
    year: number;
  }[];
  createdAt: Date;
}

export interface SpiritualTimeline {
  awakening: { start: number; end: number; description: string };
  transformation: { start: number; end: number; description: string };
  abundance: { start: number; end: number; description: string };
  healing: { start: number; end: number; description: string };
}

export interface BaZiPillar {
  heavenlyStem: string;      // Batang Langit
  earthlyBranch: string;     // Cabang Bumi
  hiddenStems: string[];     // Batang tersembunyi dalam cabang
  element: string;           // Elemen (Kayu, Api, Tanah, Logam, Air)
  polarity: 'Yang' | 'Yin'; // Polaritas
  animal: string;            // Shio / Hewan
}

export interface BaZiResult {
  // Empat pilar (Empat Kolom)
  yearPillar: BaZiPillar;
  monthPillar: BaZiPillar;
  dayPillar: BaZiPillar;
  hourPillar: BaZiPillar;

  // Elemen Hari Tuan (Day Master)
  dayMaster: string;         // Elemen utama si pemilik
  dayMasterStrength: string; // Kuat / Lemah

  // Distribusi elemen
  elementCount: Record<string, number>;  // {Kayu:2, Api:3, ...}
  dominantElement: string;
  weakElement: string;

  // Elemen menguntungkan & merugikan
  favorableElements: string[];
  unfavorableElements: string[];

  // Keberuntungan Besar (大運 Dà Yùn)
  luckyCycles: {
    startAge: number;
    endAge: number;
    stem: string;
    branch: string;
    element: string;
    theme: string;
  }[];

  // Interpretasi naratif
  personality: string;
  career: string;
  relationships: string;
  health: string;
  wealth: string;
  spiritualPath: string;
  summary: string;
}
