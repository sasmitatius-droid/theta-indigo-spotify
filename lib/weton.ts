import wukuDataRaw from '../wukuList.json';

export interface WetonResult {
  dayName: string; // Misal: Senin
  pasaranName: string; // Misal: Pon
  wetonName: string; // Misal: Senin Pon
  neptuDay: number; // Misal: 4
  neptuPasaran: number; // Misal: 7
  totalNeptu: number; // Misal: 11
  characterTraits: string;
  strengths: string;
  challenges: string;
}

export interface WukuResult {
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
}

const DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const DAY_NEPTU = [5, 4, 3, 7, 8, 6, 9];

const PASARAN = ['Legi', 'Pahing', 'Pon', 'Wage', 'Kliwon'];
const PASARAN_NEPTU = [5, 9, 7, 4, 8];

const wukuData = wukuDataRaw as any[];

// Benchmark Date: 20 July 2026 = Senin Pon, Wuku Pahang (index 15)
// Sunday of Wuku Pahang week = 19 July 2026
// Sunday of Wuku Sinta (index 0) = 19 July 2026 - (15 * 7 days) = 5 April 2026
const REF_SINTA_SUNDAY = new Date(2026, 3, 5); // 5 April 2026

/**
 * Clean and format raw Wuku description string into bullet points.
 * Strategy: find the first known keyword in the text, slice from there,
 * then split into bullets on each subsequent keyword. This eliminates ALL
 * prefix junk (Malihan - senin,Kamis, etc.) regardless of how it is written.
 */
export function formatWukuBullets(text: string): string[] {
  if (!text) return [];

  // Keywords that mark section starts — ordered longest-first to avoid partial matches
  const keywords = [
    'Memanggul tunggul',
    'Memanggul keris',
    'Kaki belakang',
    'Memanggul',
    'Dewanya',
    'Bokornya',
    'Tunggulnya',
    'Kakinya',
    'Kaki',
    'Pohonnya',
    'Burungnya',
    'Burung',
    'Gedungnya',
    'Gedung',
  ];

  // 1. Find the position of the first keyword in the raw text (case-insensitive)
  let firstIdx = text.length;
  for (const kw of keywords) {
    const idx = text.search(new RegExp(`\\b${kw}\\b`, 'i'));
    if (idx >= 0 && idx < firstIdx) firstIdx = idx;
  }

  // 2. Everything before the first keyword is the day-group prefix — discard it
  let cleaned = firstIdx < text.length ? text.slice(firstIdx) : text;

  // 3. Insert markers before each keyword so we can split cleanly
  keywords.forEach((kw) => {
    const regex = new RegExp(`\\b(${kw})\\b`, 'gi');
    cleaned = cleaned.replace(regex, `\n§§§$1`);
  });

  // 4. Split and clean each bullet
  return cleaned
    .split(/\n§§§/)
    .map((p) => p.trim())
    .filter((p) => {
      if (!p || p.length <= 3) return false;
      // Drop any stray fragment that is only day names and commas
      if (/^[\s,]*(Minggu|Senin|Selasa|Rabu|Kamis|Jumat|Sabtu)[\s,]*$/i.test(p)) return false;
      return true;
    });

}

/**
 * Menghitung Weton Jawa (Hari, Pasaran, Neptu)
 */
export function calculateWeton(date: Date): WetonResult {
  const dayIndex = date.getDay(); // 0 (Minggu) - 6 (Sabtu)
  const dayName = DAYS[dayIndex];
  const neptuDay = DAY_NEPTU[dayIndex];

  // Hitung selisih hari relatif terhadap 20 Juli 2026 (Pon = index 2)
  const d1 = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dRef = new Date(2026, 6, 20);
  const diffDays = Math.round((d1.getTime() - dRef.getTime()) / (1000 * 3600 * 24));
  
  let pasaranIndex = (2 + (diffDays % 5)) % 5;
  if (pasaranIndex < 0) pasaranIndex += 5;

  const pasaranName = PASARAN[pasaranIndex];
  const neptuPasaran = PASARAN_NEPTU[pasaranIndex];
  const totalNeptu = neptuDay + neptuPasaran;
  const wetonName = `${dayName} ${pasaranName}`;

  let characterTraits = 'Intuitif, tekun, berpendirian teguh, dan peka terhadap getaran emosi sekitar.';
  let strengths = 'Kepekaan batin tinggi, setia, pekerja keras, dan pandai menjaga rahasia.';
  let challenges = 'Kecenderungan mudah tersinggung atau terlalu memikirkan hal kecil.';

  if (totalNeptu >= 15) {
    characterTraits = 'Wibawa tinggi, karismatik, berjiwa pemimpin, dan memiliki magnetisme sosial yang kuat.';
    strengths = 'Keberanian dalam mengambil keputusan besar, inspiratif, dan tangguh.';
    challenges = 'Perlu menjaga kerendahan hati agar tidak terkesan dominan atau keras kepala.';
  } else if (totalNeptu <= 10) {
    characterTraits = 'Pendiam, perenung mendalam, ramah, dan sangat menyukai kedamaian batin.';
    strengths = 'Daya analisis tajam, tenang menghadapi krisis, dan penyabar.';
    challenges = 'Perlu lebih percaya diri mengekspresikan gagasan dan potensi diri di depan umum.';
  }

  return {
    dayName,
    pasaranName,
    wetonName,
    neptuDay,
    neptuPasaran,
    totalNeptu,
    characterTraits,
    strengths,
    challenges,
  };
}

/**
 * Menghitung Wuku Jawa berdasarkan Pawukon 210-hari & data wukuList.json
 */
export function calculateWuku(date: Date): WukuResult {
  const d1 = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffTime = d1.getTime() - REF_SINTA_SUNDAY.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 3600 * 24));
  const dayOfWeek = d1.getDay(); // 0-6
  const sundayDiff = diffDays - dayOfWeek;
  const sundayWeeks = Math.floor(sundayDiff / 7);

  let wukuIndex = (sundayWeeks % 30);
  if (wukuIndex < 0) wukuIndex += 30;

  const item = wukuData[wukuIndex] || wukuData[0];
  const name = item.wuku || 'Sinta';

  let deity = 'Batara Pawukon';
  const dewaMatch = (item.deskripsi || '').match(/Dewanya\s+([^=,\.]+)/i);
  if (dewaMatch) {
    deity = dewaMatch[1].trim();
  }

  const aralText = item.aral || item.aralnya || 'Penguasaan emosi & kesabaran batin';
  const bullets = formatWukuBullets(item.deskripsi || '');

  return {
    name,
    deity,
    theme: item.kebaikan ? item.kebaikan : (bullets[0] || 'Pelajaran Jiwa Pawukon'),
    lifeLesson: aralText,
    growthEnergy: bullets[1] || item.deskripsi || '',
    deskripsiFull: item.deskripsi || '',
    wukuBullets: bullets,
    kebaikan: item.kebaikan || '',
    keburukan: item.keburukan || '',
    aral: aralText,
    sedekahSesaji: item.sedekahSesaji || '',
    keris: item.keris || [],
  };
}
