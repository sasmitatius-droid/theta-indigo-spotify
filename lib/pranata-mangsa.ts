import ramalanDataRaw from '../ramalan_mangsa.json';

export interface PranataMangsaResult {
  name: string;
  headline: string;
  period: string;
  element: string;
  icon: string;
  seasonCharacter: string;
  natureEnergy: string;
  psychologicalPattern: string;
  lifePhase: string;
  rechargeMethod: string;
  kontenFull?: string;
}

const ramalanData = ramalanDataRaw as Record<string, any>;

const MANGSA_DETAILS: Record<string, { element: string; natureEnergy: string; lifePhase: string; rechargeMethod: string }> = {
  Kasa: {
    element: 'Kayu (Awal Kemarau)',
    natureEnergy: 'Energi Pembaharuan & Penentuan Tujuan',
    lifePhase: 'Fase Sotya Murca Saking Embanan (Permata lepas dari ikatannya, awal pertumbuhan mandiri)',
    rechargeMethod: 'Berada di alam terbuka saat fajar, perenungan di area pepohonan, serta menyusun jurnal niat hidup.',
  },
  Karo: {
    element: 'Tanah (Puncak Kemarau)',
    natureEnergy: 'Energi Ketahanan & Kepemimpinan Teguh',
    lifePhase: 'Fase Wasesa Segara (Bantala Rengka, ketahanan menembus keterbatasan)',
    rechargeMethod: 'Praktik grounding (berjalan tanpa alas kaki di atas tanah), konsumsi air kelapa murni, dan latihan pernapasan dalam.',
  },
  Katelu: {
    element: 'Tanah (Kemarau Akhir)',
    natureEnergy: 'Energi Kasih Sayang & Keadilan',
    lifePhase: 'Fase Suta Manut Ing Bapa (Tunas bersemi kembali, kepatuhan pada hukum alam)',
    rechargeMethod: 'Meditasi rasa syukur, mendengarkan musik instrumen gamelan/alam, serta waktu berkualitas bersama keluarga.',
  },
  Kapat: {
    element: 'Air (Awal Musim Labuh)',
    natureEnergy: 'Energi Keindahan & Harmoni Alam',
    lifePhase: 'Fase Waspo Kumembeng Jroning Kalbu (Tetesan air mata batin, penyucian keindahan)',
    rechargeMethod: 'Menikmati keindahan alam, melukis atau menulis karya seni, dan berendam air hangat garam dapur.',
  },
  Kalima: {
    element: 'Air (Musim Pancuran Emas)',
    natureEnergy: 'Energi Keberanian & Keberlimpahan',
    lifePhase: 'Fase Pancuran Emas Sumawur Ing Jagad (Anugerah berkah mengalir ke bumi)',
    rechargeMethod: 'Terapi suara air mengalir, afirmasi keberlimpahan, dan waktu tenang menyendiri (*solitude*).',
  },
  Kanem: {
    element: 'Air (Puncak Hujan & Kebahagiaan)',
    natureEnergy: 'Energi Integritas & Keikhlasan',
    lifePhase: 'Fase Rasa Mulya Kasucian (Kebahagiaan suci, pembersihan batin)',
    rechargeMethod: 'Puasa sunnah/detoks fisik, mandi air hujan pertama yang segar, serta aksi sosial tanpa pamrih.',
  },
  Kapitu: {
    element: 'Air & Angin (Puncak Musim Penghujan)',
    natureEnergy: 'Energi Kewibawaan & Kejujuran',
    lifePhase: 'Fase Wisa Kentas Ing Maruta (Bisa disapu angin bersih, pembersihan total)',
    rechargeMethod: 'Silence retreat (hening total 1 hari), latihan meditasi pernapasan angin, dan menata ulang ruang pribadi.',
  },
  Kawolu: {
    element: 'Angin & Api (Musim Pembuka Bunga)',
    natureEnergy: 'Energi Wawasan & Pembelajaran Seumur Hidup',
    lifePhase: 'Fase Hajrah Jroning Kayun (Kebangkitan batin melalui pembelajaran sejati)',
    rechargeMethod: 'Membaca literatur kebijaksanaan spiritual, diskusi ide mendalam, dan olah napas prana.',
  },
  Kasanga: {
    element: 'Kayu (Musim Berita Bahagia)',
    natureEnergy: 'Energi Tanggung Jawab & Kebenaran',
    lifePhase: 'Fase Wedharing Wacana Mulya (Kabar bahagia, pematangan buah kehidupan)',
    rechargeMethod: 'Jalan-jalan di kebun buah/taman, mengonsumsi nutrisi buah segar, serta berbagi cerita positif.',
  },
  Kasadasa: {
    element: 'Api (Akhir Musim Hujan / Mareng)',
    natureEnergy: 'Energi Keteguhan & Disiplin Tinggi',
    lifePhase: 'Fase Gedhong Minep Jroning Kayun (Pintu gerbang terpatri dalam ketetapan)',
    rechargeMethod: 'Olahraga teratur, latihan ketegasan niat, dan menjaga pola tidur disiplin.',
  },
  Dhesta: {
    element: 'Api (Awal Kemarau / Udara Hangat)',
    natureEnergy: 'Energi Ketenangan & Pembawaan Halus',
    lifePhase: 'Fase Sotya Sinara Wedi (Permata hati, pancaran kejernihan emosi)',
    rechargeMethod: 'Mandi bunga/aromaterapi mawar, latihan kesabaran emosional, dan istirahat di ruangan sejuk.',
  },
  Sadha: {
    element: 'Udara Dingin (Bediding)',
    natureEnergy: 'Energi Kecerdasan & Intuisi Tajam',
    lifePhase: 'Fase Tirta Sah Saka Sasana (Air lenyap dari tempatnya, kedalaman firasat)',
    rechargeMethod: 'Meditasi keheningan malam, minum teh herbal hangat, dan mencatat mimpi/firasat batin.',
  },
};

/**
 * Menghitung Pranata Mangsa berdasarkan tanggal lahir (Gregorian)
 * Menggunakan tanggal persis dari Sultan Agung / Horoskop Jawa (`ramalan_mangsa.json`)
 */
export function getPranataMangsa(date: Date): PranataMangsaResult {
  const m = date.getMonth() + 1; // 1-12
  const d = date.getDate();

  let name = 'Kasa';
  if ((m === 6 && d >= 22) || m === 7 || (m === 8 && d <= 2)) name = 'Kasa';
  else if (m === 8 && d >= 3 && d <= 24) name = 'Karo';
  else if ((m === 8 && d >= 25) || (m === 9 && d <= 17)) name = 'Katelu';
  else if ((m === 9 && d >= 18) || (m === 10 && d <= 12)) name = 'Kapat';
  else if ((m === 10 && d >= 13) || (m === 11 && d <= 8)) name = 'Kalima';
  else if ((m === 11 && d >= 9) || (m === 12 && d <= 21)) name = 'Kanem';
  else if ((m === 12 && d >= 22) || m === 1 || (m === 2 && d <= 2)) name = 'Kapitu';
  else if (m === 2 && d >= 3) name = 'Kawolu';
  else if (m === 3 && d >= 1 && d <= 25) name = 'Kasanga';
  else if ((m === 3 && d >= 26) || (m === 4 && d <= 18)) name = 'Kasadasa';
  else if ((m === 4 && d >= 19) || (m === 5 && d <= 11)) name = 'Dhesta';
  else if ((m === 5 && d >= 12) || (m === 6 && d <= 21)) name = 'Sadha';

  const keyUpper = name;
  const keyLower = name.toLowerCase() === 'kasanga' ? 'kasongo' : name.toLowerCase();

  const dataObjUpper = ramalanData[keyUpper] || {};
  const dataObjLower = ramalanData[keyLower] || {};

  const headline = dataObjUpper.headline || `Mangsa ${name}`;
  const icon = dataObjUpper.icon || '🌟';
  
  // Extract period from konten
  let period = '22 Juni – 2 Agustus';
  if (name === 'Kasa') period = '22 Juni – 2 Agustus';
  if (name === 'Karo') period = '3 Agustus – 24 Agustus';
  if (name === 'Katelu') period = '25 Agustus – 17 September';
  if (name === 'Kapat') period = '18 September – 12 Oktober';
  if (name === 'Kalima') period = '13 Oktober – 8 November';
  if (name === 'Kanem') period = '9 November – 21 Desember';
  if (name === 'Kapitu') period = '22 Desember – 2 Februari';
  if (name === 'Kawolu') period = '3 Februari – 28 Februari';
  if (name === 'Kasanga') period = '1 Maret – 25 Maret';
  if (name === 'Kasadasa') period = '26 Maret – 18 April';
  if (name === 'Dhesta') period = '19 April – 11 Mei';
  if (name === 'Sadha') period = '12 Mei – 21 Juni';

  const seasonCharacter = dataObjUpper.konten || dataObjLower.konten || '';
  const psychologicalPattern = dataObjLower.konten || dataObjUpper.konten || '';

  const details = MANGSA_DETAILS[name] || MANGSA_DETAILS['Kasa'];

  return {
    name,
    headline,
    period,
    element: details.element,
    icon,
    seasonCharacter: seasonCharacter.replace(/<[^>]*>/g, ' ').slice(0, 300) + '...',
    natureEnergy: details.natureEnergy,
    psychologicalPattern: psychologicalPattern.replace(/<[^>]*>/g, ' ').slice(0, 350) + '...',
    lifePhase: details.lifePhase,
    rechargeMethod: details.rechargeMethod,
    kontenFull: dataObjLower.konten || dataObjUpper.konten || '',
  };
}
