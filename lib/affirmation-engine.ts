export interface Affirmation {
  text: string;
  category: 'daily' | 'weekly' | 'healing' | 'abundance' | 'confidence';
}

const affirmations: Affirmation[] = [
  // Daily affirmations
  { text: 'Saya selaras dengan tujuan tertinggi saya hari ini.', category: 'daily' },
  { text: 'Energi saya mengalir dengan bebas dan harmonis.', category: 'daily' },
  { text: 'Saya percaya alam semesta memandu jalan saya.', category: 'daily' },
  { text: 'Saya pantas menerima semua kebaikan yang datang kepada saya.', category: 'daily' },
  { text: 'Saya merangkul karunia spiritual saya yang unik.', category: 'daily' },
  
  // Weekly affirmations
  { text: 'Minggu ini, saya melepaskan hal-hal yang tidak lagi mendukung pertumbuhan saya.', category: 'weekly' },
  { text: 'Saya terbuka untuk menerima bimbingan ilahi di semua bidang kehidupan saya.', category: 'weekly' },
  { text: 'Tindakan saya menciptakan riak positif di dunia.', category: 'weekly' },
  { text: 'Saya berpijak pada kebenaran saya dan berbicara dengan suara otentik saya.', category: 'weekly' },
  
  // Healing affirmations
  { text: 'Saya melepaskan semua sumbatan emosional dan menyambut energi penyembuhan.', category: 'healing' },
  { text: 'Tubuh, pikiran, dan jiwa saya berada dalam harmoni yang sempurna.', category: 'healing' },
  { text: 'Saya memaafkan diri sendiri dan orang lain, membebaskan hati saya untuk mencintai sepenuhnya.', category: 'healing' },
  { text: 'Saya mengubah rasa sakit menjadi kebijaksanaan dan kekuatan.', category: 'healing' },
  
  // Abundance affirmations
  { text: 'Saya adalah magnet bagi kemakmuran dan kesuksesan.', category: 'abundance' },
  { text: 'Alam semesta menyediakan dengan berlimpah untuk kebaikan tertinggi saya.', category: 'abundance' },
  { text: 'Saya pantas mendapatkan kebebasan finansial dan kekayaan spiritual.', category: 'abundance' },
  { text: 'Nilai saya tak terbatas, dan saya dihargai sebagaimana mestinya.', category: 'abundance' },
  
  // Confidence affirmations
  { text: 'Saya mempercayai intuisi saya dan membuat keputusan dengan jelas.', category: 'confidence' },
  { text: 'Saya mampu mencapai apa pun yang saya tetapkan dalam pikiran saya.', category: 'confidence' },
  { text: 'Perspektif unik saya berharga dan dibutuhkan.', category: 'confidence' },
  { text: 'Saya berdiri dalam kekuatan saya dan mengakui kebenaran saya.', category: 'confidence' },
];

export function generateAffirmation(category: 'daily' | 'weekly' | 'healing' | 'abundance' | 'confidence'): Affirmation {
  const categoryAffirmations = affirmations.filter(a => a.category === category);
  const randomIndex = Math.floor(Math.random() * categoryAffirmations.length);
  return categoryAffirmations[randomIndex];
}

export function generateDailyAffirmations(): Affirmation[] {
  return [
    generateAffirmation('daily'),
    generateAffirmation('healing'),
    generateAffirmation('abundance'),
  ];
}

export function generatePersonalizedAffirmations(
  lifePathNumber: number,
  indigoType: string
): Affirmation[] {
  const baseAffirmations = generateDailyAffirmations();
  
  // Add personalized affirmations based on life path
  const lifePathAffirmations: { [key: number]: string } = {
    1: 'Saya memimpin dengan keberanian dan menciptakan jalan saya sendiri.',
    2: 'Saya menyelaraskan hubungan dan membangun jembatan.',
    3: 'Saya mengekspresikan kreativitas saya dan menginspirasi orang lain.',
    4: 'Saya membangun fondasi yang kokoh untuk kesuksesan abadi.',
    5: 'Saya merangkul perubahan dan petualangan dengan anggun.',
    6: 'Saya memelihara orang lain dan menciptakan lingkungan yang penuh kasih.',
    7: 'Saya mencari kebijaksanaan yang mendalam dan memercayai pengetahuan batin saya.',
    8: 'Saya menguasai kelimpahan materi dengan integritas spiritual.',
    9: 'Saya melayani umat manusia dengan belas kasih dan visi.',
    11: 'Saya menerangi jalan bagi orang lain dengan wawasan ilahi.',
    22: 'Saya membangun impian menjadi kenyataan untuk kebaikan tertinggi.',
    33: 'Saya mewujudkan cinta tanpa syarat dan mengangkat umat manusia.',
  };

  const indigoAffirmations: { [key: string]: string } = {
    'Pejuang Indigo': 'Saya berjuang untuk kebenaran dan melindungi cahaya di dalam diri.',
    'Mistikus Indigo': 'Saya menyalurkan kebijaksanaan ilahi dan melihat melampaui tabir.',
    'Penyembuh Indigo': 'Saya mengubah energi dan memulihkan keutuhan.',
    'Visioner Indigo': 'Saya melihat masa depan dan mewujudkan kemungkinan baru.',
    'Pencipta Indigo': 'Saya membawa keindahan dan inovasi ke dalam keberadaan.',
  };

  return [
    ...baseAffirmations,
    {
      text: lifePathAffirmations[lifePathNumber] || 'Saya merangkul perjalanan spiritual unik saya.',
      category: 'daily',
    },
    {
      text: indigoAffirmations[indigoType] || 'Saya menghargai sifat indigo alami saya.',
      category: 'daily',
    },
  ];
}
