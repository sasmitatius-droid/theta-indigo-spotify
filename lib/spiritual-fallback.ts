import type { SpiritualDetailedInsights } from '@/types';
import type { AuraResult, ChakraResult, IndigoType, NumerologyResult, PranataMangsaResult } from '@/lib/spiritual-engine';
import type { HumanDesignProfile } from '@/lib/human-design';

export interface SpiritualReadingPayload {
  input: {
    name: string;
    birthDate: string;
    birthTime?: string;
    gender?: string;
    country?: string;
    city?: string;
    spiritualGoal?: string;
  };
  blueprintId?: string;
  numerology: NumerologyResult;
  indigoType: IndigoType;
  chakra: ChakraResult;
  aura: AuraResult;
  pranataMangsa?: PranataMangsaResult;
  humanDesign: HumanDesignProfile;
}

export interface SpiritualReadingContent extends SpiritualDetailedInsights {
  pranataMangsaAnalysis: string;
  affirmations: { text: string; category: string }[];
  timeline: { phase: string; description: string; year: number }[];
}

export function buildFallbackReading(payload: SpiritualReadingPayload): SpiritualReadingContent {
  const { input, numerology, indigoType, chakra, aura, pranataMangsa, humanDesign } = payload;
  const name = input.name;
  const birthDate = new Date(input.birthDate);

  const timeline = [
    { phase: 'Awakening', year: birthDate.getFullYear() + 18 },
    { phase: 'Transformation', year: birthDate.getFullYear() + 28 },
    { phase: 'Abundance', year: birthDate.getFullYear() + 38 },
    { phase: 'Healing', year: birthDate.getFullYear() + 48 },
  ].map((item) => ({
    ...item,
    description: `Pada fase ${item.phase}, ${name} mengalami gelombang energi yang selaras dengan Jalan Hidup ${numerology.lifePathNumber} dan chakra dominan ${chakra.dominant}. Ini waktu untuk refleksi, ritual harian, dan pelepasan pola lama agar tujuan "${input.spiritualGoal || 'pertumbuhan batin'}" semakin nyata di dunia materi.`,
  }));

  const mangsaText = pranataMangsa
    ? `Kelahiran Anda dinaungi oleh Mangsa ${pranataMangsa.name} (${pranataMangsa.period}) dengan elemen musim ${pranataMangsa.element}. ${pranataMangsa.seasonCharacter} Energi alam bawaan Anda adalah ${pranataMangsa.natureEnergy}. Pola psikologis bawaan: ${pranataMangsa.psychologicalPattern} Metode terbaik pemulihan energi: ${pranataMangsa.rechargeMethod}.`
    : 'Pranata Mangsa menyelaraskan iklim batin Anda dengan siklus musiman alam Jawa.';

  return {
    indigoAnalysis: `${name}, sebagai ${indigoType.type}, Anda membawa cetak biru yang langka. ${indigoType.description} Kekuatan ${indigoType.traits.join(', ')} menjadi kompas dalam relasi, karier, dan praktik batin. Lindungi energi Anda dengan batasan yang jelas, meditasi rutin, dan lingkungan yang mendukung frekuensi indigo Anda.`,
    numerologyAnalysis: `Angka Jalan Hidup ${numerology.lifePathNumber} adalah tema utama jiwa Anda—menunjukkan arah, pelajaran, dan potensi hidup ini. Nomor Jiwa ${numerology.soulNumber} mengungkap motivasi terdalam saat Anda sendirian dengan hati. Angka Takdir ${numerology.destinyNumber} memperlihatkan bakat yang harus diwujudkan lewat tindakan nyata. Angka Kedewasaan ${numerology.maturityNumber} semakin aktif setelah usia matang, membawa kebijaksanaan baru. Tahun Pribadi ${numerology.personalYearNumber} memberi energi khusus tahun berjalan—manfaatkan untuk keputusan spiritual dan rencana jangka pendek. ${numerology.karmicLesson.length ? `Pelajaran karma pada angka ${numerology.karmicLesson.join(', ')} mengajak Anda melengkapi kualitas yang pernah diabaikan.` : 'Tanpa karma dominan, fokus Anda adalah integrasi penuh dan ekspresi autentik.'}`,
    chakraAnalysis: `Chakra dominan: ${chakra.dominant}. Skor energi—Mahkota ${chakra.crown}%, Ajna ${chakra.thirdEye}%, Tenggorokan ${chakra.throat}%, Hati ${chakra.heart}%, Plexus Surya ${chakra.solarPlexus}%, Sakral ${chakra.sacral}%, Akar ${chakra.root}%. ${chakra.blocked.length ? `Perhatian khusus pada ${chakra.blocked.join(', ')}: praktikkan grounding, napas perut, afirmasi, dan gerakan tubuh untuk membuka aliran.` : 'Aliran chakra relatif harmonis—pertahankan dengan yoga, meditasi, dan istirahat cukup.'} Rekomendasi harian: 10 menit meditasi, jurnal emosi, dan kontak dengan alam.`,
    auraAnalysis: `Aura Anda memancar ${aura.primaryColor} dan ${aura.secondaryColor}. ${aura.meaning} Saat aura terasa berat, beristirahat, mandi ritual, atau waktu sunyi di alam akan memulihkan kejernihan. Jaga kata-kata dan pikiran agar selaras dengan frekuensi tertinggi Anda.`,
    humanDesignAnalysis: `Human Design Anda: *${humanDesign.type}* dengan profil ${humanDesign.profile}. ${humanDesign.summary} Strategi hidup: ${humanDesign.strategy}. Otoritas keputusan: ${humanDesign.authority}. Pusat terdefinisi (${humanDesign.centers.defined.join(', ')}) memberi energi konsisten; pusat terbuka (${humanDesign.centers.open.join(', ')}) adalah area belajar dari lingkungan—bukan kelemahan, melainkan kepekaan.`,
    psychologyAnalysis: `Dari sudut psikologi integratif, ${name} cenderung memproses pengalaman melalui pola ${indigoType.type}—kombinasi intuisi, refleksi, dan kebutuhan makna. Jalan Hidup ${numerology.lifePathNumber} sering berkorelasi dengan motivasi inti: keamanan, pencapaian, atau pelayanan, tergantung fase hidup. Chakra dominan ${chakra.dominant} menandakan gaya regulasi emosi (misalnya melalui ekspresi, kontrol, atau koneksi). Disarankan: jurnal mingguan, batasan digital, dan satu relasi aman untuk verbalisasi perasaan. Jika muncul kecemasan atau trauma berat, kombinasikan wawasan spiritual ini dengan dukungan profesional (psikolog/konselor).`,
    pranataMangsaAnalysis: mangsaText,
    spiritualReading: `Halo ${name}, cetak biru spiritual Anda menyatukan numerologi, Human Design, Pranata Mangsa, chakra, dan aura dalam satu peta perjalanan 5 Lapisan Waktu Terpadu. Jalan Hidup ${numerology.lifePathNumber} dan energi ${indigoType.type} memanggil Anda untuk hidup autentik dan berdampak. ${pranataMangsa ? `Dinaungi Mangsa ${pranataMangsa.name}, ` : ''}Chakra ${chakra.dominant} adalah kunci keseimbangan; aura Anda mengingatkan untuk menjaga kejernihan batin. ${input.spiritualGoal ? `Tujuan "${input.spiritualGoal}" adalah benang merah praktik harian Anda.` : ''} Semesta mendukung langkah Anda berikutnya.`,
    affirmations: [
      { text: `Saya ${name} selaras dengan cahaya Jalan Hidup ${numerology.lifePathNumber}.`, category: 'numerologi' },
      { text: 'Saya mempercayai intuisi dan membuka chakra dengan kasih.', category: 'chakra' },
      { text: `Sebagai ${indigoType.type}, saya menjalani misi dengan keberanian.`, category: 'indigo' },
      { text: `Energi Mangsa ${pranataMangsa?.name || 'Musim'} memperkuat ritme batin saya.`, category: 'pranata-mangsa' },
      { text: 'Aura saya memancarkan kesehatan, kejelasan, dan kedamaian.', category: 'aura' },
      { text: 'Saya melepaskan ketakutan dan menyambut transformasi suci.', category: 'spiritual' },
    ],
    timeline,
  };
}

export function toApiResponse(reading: SpiritualReadingContent, source: 'system' | 'fallback') {
  return {
    detailedInsights: {
      indigoAnalysis: reading.indigoAnalysis,
      numerologyAnalysis: reading.numerologyAnalysis,
      chakraAnalysis: reading.chakraAnalysis,
      auraAnalysis: reading.auraAnalysis,
      humanDesignAnalysis: reading.humanDesignAnalysis,
      psychologyAnalysis: reading.psychologyAnalysis,
      pranataMangsaAnalysis: reading.pranataMangsaAnalysis,
      spiritualReading: reading.spiritualReading,
    },
    spiritualReading: reading.spiritualReading,
    affirmations: reading.affirmations,
    timeline: reading.timeline,
    source,
  };
}
