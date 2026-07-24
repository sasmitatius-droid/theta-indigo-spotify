import { BaZiResult, BaZiPillar } from '@/types';

// ─── Heavenly Stems (Batang Langit) ───────────────────────────────────────────
const HEAVENLY_STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const STEM_NAMES_ID  = ['Jiǎ','Yǐ','Bǐng','Dīng','Wù','Jǐ','Gēng','Xīn','Rén','Guǐ'];
const STEM_ELEMENTS  = ['Kayu','Kayu','Api','Api','Tanah','Tanah','Logam','Logam','Air','Air'];
const STEM_POLARITY: ('Yang'|'Yin')[] = ['Yang','Yin','Yang','Yin','Yang','Yin','Yang','Yin','Yang','Yin'];

// ─── Earthly Branches (Cabang Bumi) ───────────────────────────────────────────
const EARTHLY_BRANCHES = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
const BRANCH_NAMES_ID  = ['Zǐ','Chǒu','Yín','Mǎo','Chén','Sì','Wǔ','Wèi','Shēn','Yǒu','Xū','Hài'];
const BRANCH_ANIMALS_ID = ['Tikus','Kerbau','Macan','Kelinci','Naga','Ular','Kuda','Kambing','Monyet','Ayam','Anjing','Babi'];
const BRANCH_ELEMENTS  = ['Air','Tanah','Kayu','Kayu','Tanah','Api','Api','Tanah','Logam','Logam','Tanah','Air'];
const BRANCH_POLARITY: ('Yang'|'Yin')[] = ['Yang','Yin','Yang','Yin','Yang','Yin','Yang','Yin','Yang','Yin','Yang','Yin'];

// Hidden stems inside each earthly branch
const HIDDEN_STEMS: string[][] = [
  ['壬'],           // Zǐ  - Tikus
  ['己','癸','辛'], // Chǒu - Kerbau
  ['甲','丙','戊'], // Yín  - Macan
  ['乙'],           // Mǎo  - Kelinci
  ['戊','乙','癸'], // Chén - Naga
  ['丙','庚','戊'], // Sì   - Ular
  ['丁','己'],      // Wǔ   - Kuda
  ['己','丁','乙'], // Wèi  - Kambing
  ['庚','壬','戊'], // Shēn - Monyet
  ['辛'],           // Yǒu  - Ayam
  ['戊','辛','丁'], // Xū   - Anjing
  ['壬','甲'],      // Hài  - Babi
];

// ─── Month Branch based on Solar Term ─────────────────────────────────────────
// Month Branch: Yin (寅) = Feb, Mao (卯) = Mar, ... uses solar month
function getMonthBranchIndex(month: number, day: number): number {
  // Solar term approximate boundaries
  const boundaries = [
    { m: 2, d: 4 },  // Lichun -> Yin (Macan) index 2
    { m: 3, d: 6 },  // Jingzhe -> Mao (Kelinci) index 3
    { m: 4, d: 5 },  // Qingming -> Chen (Naga) index 4
    { m: 5, d: 6 },  // Lixia -> Si (Ular) index 5
    { m: 6, d: 6 },  // Mangzhong -> Wu (Kuda) index 6
    { m: 7, d: 7 },  // Xiaoshu -> Wei (Kambing) index 7
    { m: 8, d: 7 },  // Liqiu -> Shen (Monyet) index 8
    { m: 9, d: 8 },  // Bailu -> You (Ayam) index 9
    { m: 10, d: 8 }, // Hanlu -> Xu (Anjing) index 10
    { m: 11, d: 7 }, // Lidong -> Hai (Babi) index 11
    { m: 12, d: 7 }, // Daxue -> Zi (Tikus) index 0
    { m: 1, d: 6 },  // Xiaohan -> Chou (Kerbau) index 1
  ];

  const current = month * 100 + day;
  let branchIndex = 1; // Default Chou

  if (current >= 204) branchIndex = 2;
  if (current >= 306) branchIndex = 3;
  if (current >= 405) branchIndex = 4;
  if (current >= 506) branchIndex = 5;
  if (current >= 606) branchIndex = 6;
  if (current >= 707) branchIndex = 7;
  if (current >= 807) branchIndex = 8;
  if (current >= 908) branchIndex = 9;
  if (current >= 1008) branchIndex = 10;
  if (current >= 1107) branchIndex = 11;
  if (current >= 1207) branchIndex = 0;

  return branchIndex;
}

// ─── Month Stem via cycle ─────────────────────────────────────────────────────
function getMonthStemIndex(yearStemIdx: number, monthBranchIdx: number): number {
  // Month stem starts at specific offset based on year stem
  const offsets = [2, 4, 6, 8, 0, 2, 4, 6, 8, 0]; // Jiǎ-year starts month at Bǐng
  const base = offsets[yearStemIdx % 10];
  // Each month branch advances stem by 1
  // monthBranchIdx relative to Yin (idx 2) gives month number
  const monthNum = ((monthBranchIdx - 2 + 12) % 12);
  return (base + monthNum) % 10;
}

// ─── Day Pillar (complex calculation) ─────────────────────────────────────────
// Using the Gregorian-to-Jiazi cycle reference
function getDayPillarIndex(date: Date): { stemIdx: number; branchIdx: number } {
  // Reference: Jan 1, 1900 = Jiǎ (0) Zi (0)... actually:
  // Jan 31, 1900 = Jiǎ Zi (0,0) is a known reference in many BaZi systems
  const REF = new Date(1900, 0, 31); // Jan 31, 1900 = Jiǎ Zi
  const diffMs = date.getTime() - REF.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  let stemIdx = ((diffDays % 10) + 10) % 10;
  let branchIdx = ((diffDays % 12) + 12) % 12;

  return { stemIdx, branchIdx };
}

// ─── Hour Pillar ──────────────────────────────────────────────────────────────
function getHourBranchIndex(hour: number): number {
  // 23-01: Zǐ, 01-03: Chǒu, 03-05: Yín, 05-07: Mǎo, 07-09: Chén, 09-11: Sì
  // 11-13: Wǔ, 13-15: Wèi, 15-17: Shēn, 17-19: Yǒu, 19-21: Xū, 21-23: Hài
  if (hour === 23 || hour === 0) return 0;
  return Math.floor((hour + 1) / 2) % 12;
}

function getHourStemIndex(dayStemIdx: number, hourBranchIdx: number): number {
  // Hour stems cycle: Jiǎ-day and Jǐ-day start at Jiǎ (0) for Zǐ hour
  const offsets = [0, 2, 4, 6, 8, 0, 2, 4, 6, 8];
  const base = offsets[dayStemIdx % 10];
  return (base + hourBranchIdx) % 10;
}

// ─── Year Pillar ──────────────────────────────────────────────────────────────
function getYearPillarIndex(year: number, month: number, day: number): { stemIdx: number; branchIdx: number } {
  // Before Feb 4 (approx LiChun), use previous year
  let adjustedYear = year;
  if (month < 2 || (month === 2 && day < 4)) {
    adjustedYear = year - 1;
  }
  const stemIdx = ((adjustedYear - 4) % 10 + 10) % 10;
  const branchIdx = ((adjustedYear - 4) % 12 + 12) % 12;
  return { stemIdx, branchIdx };
}

// ─── Build a pillar object ────────────────────────────────────────────────────
function buildPillar(stemIdx: number, branchIdx: number): BaZiPillar {
  return {
    heavenlyStem: `${HEAVENLY_STEMS[stemIdx]} (${STEM_NAMES_ID[stemIdx]})`,
    earthlyBranch: `${EARTHLY_BRANCHES[branchIdx]} (${BRANCH_NAMES_ID[branchIdx]})`,
    hiddenStems: HIDDEN_STEMS[branchIdx].map(s => {
      const idx = HEAVENLY_STEMS.indexOf(s);
      return idx >= 0 ? `${s} (${STEM_NAMES_ID[idx]} - ${STEM_ELEMENTS[idx]})` : s;
    }),
    element: STEM_ELEMENTS[stemIdx],
    polarity: STEM_POLARITY[stemIdx],
    animal: BRANCH_ANIMALS_ID[branchIdx],
  };
}

// ─── Element count across all pillars ────────────────────────────────────────
function countElements(pillars: BaZiPillar[]): Record<string, number> {
  const count: Record<string, number> = { Kayu: 0, Api: 0, Tanah: 0, Logam: 0, Air: 0 };
  for (const p of pillars) {
    count[p.element] = (count[p.element] || 0) + 1;
    // Count hidden stems
    for (const hs of p.hiddenStems) {
      // Extract element from hidden stem string like "甲 (Jiǎ - Kayu)"
      const match = hs.match(/- (\w+)\)/);
      if (match && count[match[1]] !== undefined) {
        count[match[1]] += 0.5;
      }
    }
    // Count branch element
    const branchEl = BRANCH_ELEMENTS[EARTHLY_BRANCHES.indexOf(p.earthlyBranch.charAt(0))];
    if (branchEl && count[branchEl] !== undefined) {
      count[branchEl] += 0.5;
    }
  }
  return count;
}

// ─── Productive/Controlling cycles ───────────────────────────────────────────
const GENERATES: Record<string, string> = { Kayu: 'Api', Api: 'Tanah', Tanah: 'Logam', Logam: 'Air', Air: 'Kayu' };
const CONTROLS: Record<string, string>  = { Kayu: 'Tanah', Api: 'Logam', Tanah: 'Air', Logam: 'Kayu', Air: 'Api' };

function getFavorableElements(dayMasterEl: string, isStrong: boolean): string[] {
  if (isStrong) {
    // Strong day master: needs draining (generating) and controlling elements
    return [GENERATES[dayMasterEl], CONTROLS[dayMasterEl]];
  } else {
    // Weak day master: needs generating (resource) and same-type (friend) elements
    const resource = Object.keys(GENERATES).find(k => GENERATES[k] === dayMasterEl) || '';
    return [resource, dayMasterEl];
  }
}

// ─── Lucky Cycles (大運 Dà Yùn) ──────────────────────────────────────────────
function calculateLuckCycles(
  yearStemIdx: number,
  monthStemIdx: number,
  monthBranchIdx: number,
  birthYear: number,
  birthMonth: number,
  birthDay: number,
  gender: string,
): { startAge: number; endAge: number; stem: string; branch: string; element: string; theme: string }[] {
  const isYang = STEM_POLARITY[yearStemIdx] === 'Yang';
  const isMale = gender !== 'Perempuan';
  const forward = (isYang && isMale) || (!isYang && !isMale);

  const cycles: { startAge: number; endAge: number; stem: string; branch: string; element: string; theme: string }[] = [];

  // Start age approximation: use 10-year cycles starting around age 3-8
  const startAge = 3 + Math.floor(Math.random() * 5); // Simplified; real calculation uses solar terms

  let curStemIdx = monthStemIdx;
  let curBranchIdx = monthBranchIdx;

  for (let i = 0; i < 8; i++) {
    if (forward) {
      curStemIdx = (curStemIdx + 1) % 10;
      curBranchIdx = (curBranchIdx + 1) % 12;
    } else {
      curStemIdx = (curStemIdx - 1 + 10) % 10;
      curBranchIdx = (curBranchIdx - 1 + 12) % 12;
    }

    const cycleStart = startAge + i * 10;
    cycles.push({
      startAge: cycleStart,
      endAge: cycleStart + 9,
      stem: `${HEAVENLY_STEMS[curStemIdx]} (${STEM_NAMES_ID[curStemIdx]})`,
      branch: `${EARTHLY_BRANCHES[curBranchIdx]} (${BRANCH_NAMES_ID[curBranchIdx]})`,
      element: STEM_ELEMENTS[curStemIdx],
      theme: getLuckCycleTheme(STEM_ELEMENTS[curStemIdx], cycleStart, birthYear),
    });
  }

  return cycles;
}

function getLuckCycleTheme(element: string, age: number, birthYear: number): string {
  const lifePhase = age < 20 ? 'pembentukan karakter' : age < 40 ? 'pertumbuhan karier' : age < 60 ? 'puncak kematangan' : 'kebijaksanaan';
  const themes: Record<string, string> = {
    Kayu: `Pertumbuhan & Kreativitas — fase ${lifePhase}. Energi ekspansif mendorong visi dan proyek baru.`,
    Api:  `Vitalitas & Pengakuan — fase ${lifePhase}. Sorotan sosial, peluang kepemimpinan dan ekspresi diri.`,
    Tanah: `Stabilitas & Pondasi — fase ${lifePhase}. Membangun fondasi kokoh, waktu tepat untuk investasi jangka panjang.`,
    Logam: `Presisi & Transformasi — fase ${lifePhase}. Pemangkasan hal tidak esensial, fokus pada kualitas dan ketegasan.`,
    Air:  `Intuisi & Aliran — fase ${lifePhase}. Kebijaksanaan batin mengalir, cocok untuk spiritual dan akademis.`,
  };
  return themes[element] || `Fase ${lifePhase} dengan energi elemen ${element}.`;
}

// ─── Narrative interpretations ───────────────────────────────────────────────
function interpretPersonality(dayMaster: string, polarity: string): string {
  const traits: Record<string, string> = {
    Kayu: 'Jiwa yang tumbuh dan berkembang — Anda memiliki dorongan kuat untuk berkreasi, berinovasi, dan memberikan dampak positif. Seperti pohon yang merentangkan cabangnya, Anda alami, penuh empati, dan selalu mencari cara untuk membantu lingkungan sekitar. Namun perlu hati-hati agar tidak terlalu idealis hingga mengabaikan realitas praktis.',
    Api:  'Penuh semangat dan kharisma — Anda memancarkan kehangatan alami yang menarik orang lain. Cepat berpikir, ekspresif, dan berani tampil di depan umum. Energi Api Anda mendorong antusiasme, tetapi perlu dijaga agar tidak mudah terbakar oleh konflik atau terlalu impulsif dalam mengambil keputusan.',
    Tanah: 'Teguh, dapat diandalkan, dan penuh kebijaksanaan praktis — Anda adalah pilar yang stabil bagi orang-orang sekitar. Sabar, diplomatik, dan ahli dalam menengahi berbagai pihak. Namun, kecenderungan Anda untuk terlalu berhati-hati kadang menghambat pengambilan risiko yang diperlukan untuk pertumbuhan.',
    Logam: 'Tajam, presisi, dan berprinsip kuat — Anda memiliki standar tinggi dan disiplin diri yang luar biasa. Seperti pedang yang kuat, Anda mampu memotong kebenaran dari kepalsuan. Kelemahan adalah kecenderungan terlalu kritis terhadap diri sendiri dan orang lain, yang dapat menciptakan jarak dalam hubungan.',
    Air:  'Dalam, mengalir, dan penuh kebijaksanaan intuisi — Anda adaptif seperti air yang selalu menemukan jalannya. Cerdas, filosofis, dan memiliki kemampuan membaca situasi yang tajam. Tantangan Anda adalah menjaga fokus dan tidak terlalu banyak merenung hingga mengalami kebimbangan.',
  };
  const pol = polarity === 'Yang' ? ' Dengan polaritas Yang, Anda lebih ekspansif dan berorientasi eksternal.' : ' Dengan polaritas Yin, Anda lebih reflektif, intuitif, dan mendalam.';
  return (traits[dayMaster] || `Elemen ${dayMaster}`) + pol;
}

function interpretCareer(dayMaster: string, favorableElements: string[]): string {
  const careers: Record<string, string> = {
    Kayu: 'Jalur karier terbaik: pendidikan, desain, lingkungan hidup, pertanian, kesehatan holistik, dan bidang kreatif. Elemen Kayu mendorong Anda menuju profesi yang memberi dampak jangka panjang dan pertumbuhan organik.',
    Api:  'Karier yang bersinar: seni pertunjukan, pemasaran, kewirausahaan, teknologi, politik, dan semua bidang yang membutuhkan presentasi publik. Energi Api Anda ideal untuk memimpin tim dan menginspirasi.',
    Tanah: 'Bidang terbaik: properti, perbankan, manajemen, sumber daya manusia, kuliner, dan konsultan. Anda unggul dalam membangun sistem yang tahan lama dan mengelola sumber daya.',
    Logam: 'Profesi ideal: hukum, kedokteran, teknik, keuangan, militer, dan industri manufaktur. Ketepatan dan disiplin Anda sangat dihargai dalam bidang yang menuntut standar tinggi.',
    Air:  'Jalur gemilang: penelitian, psikologi, sastra, diplomasi, spiritual, dan teknologi informasi. Kemampuan berpikir mendalam dan intuitif Anda sangat berharga dalam bidang analitis.',
  };
  return (careers[dayMaster] || '') + ` Elemen menguntungkan Anda (${favorableElements.join(', ')}) memperkuat area industri terkait.`;
}

function interpretRelationships(dayMaster: string): string {
  const rels: Record<string, string> = {
    Kayu: 'Dalam hubungan, Anda adalah pasangan yang penuh perhatian, setia, dan selalu ingin tumbuh bersama. Anda ideal dipasangkan dengan elemen Air (yang memberi nutrisi) atau Api (yang memvalidasi pertumbuhan Anda). Hindari konflik dengan elemen Logam yang cenderung memangkas ekspansi Anda.',
    Api:  'Anda adalah kekasih yang hangat dan penuh gairah. Hubungan terbaik dengan elemen Kayu yang memberi bahan bakar, atau elemen Tanah yang menerima kehangatan Anda. Perlu belajar mengelola intensitas emosi agar tidak membakar hubungan.',
    Tanah: 'Pasangan yang stabil, pengayom, dan setia. Hubungan ideal dengan elemen Api yang menghangatkan, atau elemen Logam yang dihidupi. Perlu menjaga diri dari sifat terlalu mengontrol dalam relasi.',
    Logam: 'Pasangan yang serius, berkomitmen, dan menghargai kualitas. Cocok dengan elemen Tanah yang membentuk dan menguatkan. Tantangan: belajar bersikap lebih fleksibel dan ekspresif dalam cinta.',
    Air:  'Pasangan yang mendalam, romantis, dan penuh kebijaksanaan emosi. Terbaik dengan elemen Logam yang mendefinisikan aliran, atau elemen Kayu yang disemai. Perlu menghindari kebiasaan menarik diri saat menghadapi konflik.',
  };
  return rels[dayMaster] || `Interpretasi hubungan elemen ${dayMaster}.`;
}

function interpretHealth(dayMaster: string): string {
  const health: Record<string, string> = {
    Kayu: 'Organ terkait: Hati dan Kandung Empedu. Perhatikan kesehatan mata, otot, dan sistem saraf. Aktivitas harian di alam terbuka sangat bermanfaat. Hindari stres emosional berkepanjangan yang dapat mempengaruhi hati. Yoga, tai chi, atau berjalan di alam sangat disarankan.',
    Api:  'Organ terkait: Jantung dan Usus Halus. Jaga kesehatan jantung dan sistem peredaran darah. Hindari terlalu banyak stimulan (kafein berlebihan, begadang). Meditasi, pernapasan dalam, dan olahraga kardio moderat sangat membantu.',
    Tanah: 'Organ terkait: Limpa dan Lambung. Perhatikan sistem pencernaan dan tingkat energi. Pola makan teratur dengan makanan hangat sangat penting. Hindari kekhawatiran berlebihan yang dapat melemahkan sistem imun. Tai chi dan qigong sangat cocok.',
    Logam: 'Organ terkait: Paru-paru dan Usus Besar. Jaga kualitas udara dan kesehatan pernapasan. Rentan terhadap alergi musiman. Olahraga moderat, pernapasan dalam, dan menjaga kebersihan lingkungan sangat direkomendasikan.',
    Air:  'Organ terkait: Ginjal dan Kandung Kemih. Jaga hidrasi tubuh dan istirahat cukup. Sistem hormon dan energi vital perlu diperhatikan. Hindari paparan dingin berlebihan. Berenang, meditasi, dan tidur berkualitas adalah kunci kesehatan Anda.',
  };
  return health[dayMaster] || `Panduan kesehatan elemen ${dayMaster}.`;
}

function interpretWealth(dominantElement: string, favorableElements: string[]): string {
  return `Elemen dominan ${dominantElement} dalam pilar BaZi Anda menunjukkan pola keuangan yang unik. Elemen menguntungkan ${favorableElements.join(' dan ')} menjadi kunci dalam membuka aliran kemakmuran. Periode terbaik untuk investasi dan ekspansi finansial biasanya terjadi saat tahun atau siklus keberuntungan besar membawa elemen menguntungkan tersebut. Hindari keputusan finansial besar saat tahun membawa elemen merugikan. Diversifikasi dan kesabaran adalah strategi terbaik berdasarkan pola BaZi Anda.`;
}

function interpretSpiritualPath(dayMaster: string): string {
  const paths: Record<string, string> = {
    Kayu: 'Jalan spiritual Anda adalah jalan Pertumbuhan dan Pelayanan. Anda dipanggil untuk menjadi saluran penyembuhan dan pertumbuhan bagi sesama. Praktik yang resonan: berkebun, ecoSpirituality, meditasi alam, dan pengabdian komunitas.',
    Api:  'Jalan spiritual Anda adalah jalan Pencerahan dan Cinta Universal. Anda dipanggil untuk membawa cahaya ke dalam kegelapan. Praktik yang resonan: bhakti yoga, meditasi cahaya, seni sakral, dan kepemimpinan spiritual.',
    Tanah: 'Jalan spiritual Anda adalah jalan Kebijaksanaan dan Pengabdian. Anda dipanggil untuk menjadi jangkar bagi yang tersesat. Praktik yang resonan: meditasi bumi, pemujaan leluhur, pembuatan mandala, dan pelayanan lansia.',
    Logam: 'Jalan spiritual Anda adalah jalan Pemurnian dan Kebenaran. Anda dipanggil untuk memotong ilusi dan menemukan inti kebenaran. Praktik yang resonan: meditasi Zen, kaligrafi, Taoisme, dan latihan spiritual berstruktur.',
    Air:  'Jalan spiritual Anda adalah jalan Kebijaksanaan dan Kedalaman. Anda dipanggil untuk menyelami misteri kehidupan dan berbagi temuan Anda. Praktik yang resonan: meditasi mendalam, astrologi, numerologi, dan pembelajaran spiritual sepanjang hayat.',
  };
  return paths[dayMaster] || `Jalan spiritual elemen ${dayMaster}.`;
}

// ─── Main BaZi Calculator ─────────────────────────────────────────────────────
export function calculateBaZi(birthDate: Date, birthTime?: string, gender?: string): BaZiResult {
  const year  = birthDate.getFullYear();
  const month = birthDate.getMonth() + 1;
  const day   = birthDate.getDate();
  const hour  = birthTime ? parseInt(birthTime.split(':')[0]) : 12;

  // Year Pillar
  const { stemIdx: yStemIdx, branchIdx: yBranchIdx } = getYearPillarIndex(year, month, day);
  const yearPillar = buildPillar(yStemIdx, yBranchIdx);

  // Month Pillar
  const mBranchIdx = getMonthBranchIndex(month, day);
  const mStemIdx   = getMonthStemIndex(yStemIdx, mBranchIdx);
  const monthPillar = buildPillar(mStemIdx, mBranchIdx);

  // Day Pillar
  const { stemIdx: dStemIdx, branchIdx: dBranchIdx } = getDayPillarIndex(birthDate);
  const dayPillar = buildPillar(dStemIdx, dBranchIdx);

  // Hour Pillar
  const hBranchIdx = getHourBranchIndex(hour);
  const hStemIdx   = getHourStemIndex(dStemIdx, hBranchIdx);
  const hourPillar = buildPillar(hStemIdx, hBranchIdx);

  // Day Master
  const dayMaster  = STEM_ELEMENTS[dStemIdx];
  const dayMasterPolarity = STEM_POLARITY[dStemIdx];

  // Element distribution
  const elementCount = countElements([yearPillar, monthPillar, dayPillar, hourPillar]);
  const sortedEls = Object.entries(elementCount).sort((a, b) => b[1] - a[1]);
  const dominantElement = sortedEls[0][0];
  const weakElement     = sortedEls[sortedEls.length - 1][0];

  // Strength of Day Master
  const dayMasterCount = elementCount[dayMaster] || 0;
  const totalCount = Object.values(elementCount).reduce((a, b) => a + b, 0);
  const isStrong = dayMasterCount / totalCount >= 0.25;
  const dayMasterStrength = isStrong ? 'Kuat (身强 Shēn Qiáng)' : 'Lemah (身弱 Shēn Ruò)';

  // Favorable / Unfavorable
  const favorableElements  = getFavorableElements(dayMaster, isStrong);
  const unfavorableElements = ['Kayu','Api','Tanah','Logam','Air'].filter(
    e => !favorableElements.includes(e) && e !== dayMaster
  );

  // Lucky Cycles
  const luckyCycles = calculateLuckCycles(
    yStemIdx, mStemIdx, mBranchIdx,
    year, month, day,
    gender || 'Laki-laki',
  );

  return {
    yearPillar,
    monthPillar,
    dayPillar,
    hourPillar,
    dayMaster: `${dayMaster} (${dayMasterPolarity})`,
    dayMasterStrength,
    elementCount,
    dominantElement,
    weakElement,
    favorableElements,
    unfavorableElements,
    luckyCycles,
    personality:    interpretPersonality(dayMaster, dayMasterPolarity),
    career:         interpretCareer(dayMaster, favorableElements),
    relationships:  interpretRelationships(dayMaster),
    health:         interpretHealth(dayMaster),
    wealth:         interpretWealth(dominantElement, favorableElements),
    spiritualPath:  interpretSpiritualPath(dayMaster),
    summary:        `Peta BaZi Anda dikendalikan oleh Day Master ${dayMaster} ${dayMasterPolarity} dengan kekuatan ${dayMasterStrength}. Elemen dominan dalam empat pilar Anda adalah ${dominantElement}, sementara ${weakElement} perlu diperkuat. Elemen keberuntungan Anda adalah ${favorableElements.join(' dan ')}.`,
  };
}
