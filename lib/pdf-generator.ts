import jsPDF from 'jspdf';
import { ReadingResult } from '@/types';
import { formatParagraphsForPrint } from '@/lib/format-text';

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return [139, 92, 246];
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16),
  ];
}

export async function generatePDFReport(result: ReadingResult): Promise<void> {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  let yPosition = 20;
  const insights = result.detailedInsights;
  const blueprintId = result.blueprintId || `TIB-${result.id.slice(0, 8)}`;

  const addSection = (title: string, body: string, titleSize = 15) => {
    const formattedBody = formatParagraphsForPrint(body);
    const required = 40 + Math.ceil(formattedBody.length / 80) * 5;
    if (yPosition + required > pageHeight - 25) {
      pdf.addPage();
      pdf.setFillColor(10, 10, 26);
      pdf.rect(0, 0, pageWidth, pageHeight, 'F');
      yPosition = 20;
    }

    pdf.setTextColor(139, 92, 246);
    pdf.setFontSize(titleSize);
    pdf.text(title, 20, yPosition);
    yPosition += 8;

    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(10.5);
    const lines = pdf.splitTextToSize(formattedBody, pageWidth - 40);
    pdf.text(lines, 20, yPosition);
    yPosition += lines.length * 5.2 + 10;
  };

  // 1. Cover
  pdf.setFillColor(10, 10, 26);
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');

  pdf.setTextColor(139, 92, 246);
  pdf.setFontSize(26);
  pdf.text('THETA INDIGO BLUEPRINT', pageWidth / 2, 50, { align: 'center' });

  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(18);
  pdf.text('PERSONAL SOUL BLUEPRINT', pageWidth / 2, 66, { align: 'center' });
  
  pdf.setFontSize(12);
  pdf.setTextColor(190, 190, 220);
  pdf.text(`ID Blueprint: ${blueprintId}`, pageWidth / 2, 78, { align: 'center' });

  pdf.setFontSize(14);
  pdf.setTextColor(255, 255, 255);
  pdf.text(result.input.name, pageWidth / 2, 96, { align: 'center' });
  pdf.setFontSize(11);
  pdf.text(`Tanggal Analisis: ${new Date(result.createdAt).toLocaleDateString('id-ID')}`, pageWidth / 2, 108, { align: 'center' });

  // Load Theta Logo for Cover Page
  let logoDataUrl: string | null = null;
  if (typeof window !== 'undefined') {
    try {
      logoDataUrl = await new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.src = '/logo.png';
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth || 512;
          canvas.height = img.naturalHeight || 512;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL('image/png'));
          } else {
            resolve(null);
          }
        };
        img.onerror = () => resolve(null);
      });
    } catch {
      logoDataUrl = null;
    }
  }

  if (logoDataUrl) {
    const logoSize = 48; // mm
    pdf.addImage(logoDataUrl, 'PNG', (pageWidth - logoSize) / 2, 118, logoSize, logoSize);
  } else {
    const primaryColor = result.aura?.primaryColor || '#9370DB';
    const [r, g, b] = hexToRgb(primaryColor);
    pdf.setFillColor(r, g, b);
    pdf.circle(pageWidth / 2, 140, 24, 'F');
  }

  pdf.setFontSize(10);
  pdf.setTextColor(180, 180, 200);
  pdf.text('Platform Spiritual-Tech Berbasis AI & Kebijaksanaan Jawa', pageWidth / 2, 185, { align: 'center' });


  // 2. Data Profil & Identitas Header Standar
  pdf.addPage();
  pdf.setFillColor(10, 10, 26);
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');
  yPosition = 20;

  const headerMetadataLines = [
    `ID Blueprint: ${blueprintId}`,
    `Nama Lengkap: ${result.input.name}`,
    `Tanggal Lahir: ${new Date(result.input.birthDate).toLocaleDateString('id-ID')}`,
    result.input.birthTime ? `Jam Lahir: ${result.input.birthTime}` : 'Jam Lahir: Tidak ditentukan',
    result.input.gender ? `Jenis Kelamin: ${result.input.gender}` : '',
    result.input.city || result.input.country
      ? `Kota/Negara Lahir: ${[result.input.city, result.input.country].filter(Boolean).join(', ')}`
      : '',
    `Tanggal Analisis: ${new Date(result.createdAt).toLocaleDateString('id-ID')}`,
    result.input.spiritualGoal ? `Tujuan Analisis: ${result.input.spiritualGoal}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  addSection('Bab 1 — Identitas Blueprint Jiwa', headerMetadataLines);

  // Weton & Wuku Jawa
  if (result.weton) {
    const w = result.weton;
    const wuku = result.wuku;
    const wetonLines = [
      `Weton Kelahiran: ${w.wetonName}`,
      `Total Neptu: ${w.totalNeptu} (Hari ${w.neptuDay} + Pasaran ${w.neptuPasaran})`,
      wuku ? `Siklus Wuku Pawukon: Wuku ${wuku.name} (Dewa: ${wuku.deity})` : '',
      wuku?.deskripsiFull ? `Deskripsi Wuku ${wuku.name}:\n${wuku.deskripsiFull}` : '',
      wuku?.kebaikan ? `Rekomendasi Kebaikan:\n${wuku.kebaikan}` : '',
      wuku?.keburukan ? `Pantangan Keburukan:\n${wuku.keburukan}` : '',
      wuku?.aral ? `Aral Kehidupan:\n${wuku.aral}` : '',
      wuku?.sedekahSesaji ? `Sedekah/Sesaji:\n${wuku.sedekahSesaji}` : '',
      wuku?.keris && wuku.keris.length > 0 ? `Pencocokan Pusaka Keris:\n${wuku.keris.join(', ')}` : '',
      `Karakter Dasar Primbon: ${w.characterTraits}`,
      `Kekuatan Utama: ${w.strengths}`,
      `Tantangan Jiwa: ${w.challenges}`,
    ]
      .filter(Boolean)
      .join('\n\n');

    addSection('Bab 2 — Weton & Wuku Jawa (Primbon & Pawukon Data `wukuList.json`)', wetonLines);
  }

  // Kua & Feng Shui Arah Ruang
  if (result.kua) {
    const k = result.kua;
    const kuaLines = [
      `Angka Kua: Kua ${k.kuaNumber} (${k.group})`,
      `Arah Tidur Ideal: ${k.bestSleepingDirection}`,
      `Arah Kerja Ideal: ${k.bestWorkingDirection}`,
      `Arah Belajar Ideal: ${k.bestStudyingDirection}`,
      `Arah Relasi Harmonistik: ${k.bestRelationshipDirection}`,
      `Arah Yang Sebaiknya Dihindari: ${k.avoidDirections}`,
      `\n${k.summary}`,
    ].join('\n\n');

    addSection('Bab 3 — Angka Kua & Feng Shui Arah Ruang (Ba Zhai)', kuaLines);
  }

  // 3. Pranata Mangsa Jawa (Jika ada)
  if (result.pranataMangsa) {
    const pm = result.pranataMangsa;
    const pmLines = [
      `Nama Mangsa: Mangsa ${pm.name} (${pm.period})`,
      `Elemen Musim: ${pm.element}`,
      `Energi Alam: ${pm.natureEnergy}`,
      `Fase Kehidupan Batin: ${pm.lifePhase}`,
      `Karakter Musim: ${pm.seasonCharacter}`,
      `Pola Psikologis Bawaan: ${pm.psychologicalPattern}`,
      `Metode Pemulihan Energi: ${pm.rechargeMethod}`,
    ].join('\n\n');

    addSection('Bab 4 — Pranata Mangsa Jawa (12 Musim Batin)', `${pmLines}\n\n${insights?.pranataMangsaAnalysis || ''}`);
  }

  // 4. Numerologi
  addSection(
    'Bab 3 — Sintesis Numerologi',
    [
      `Jalan Hidup: ${result.numerology.lifePathNumber}`,
      `Nomor Jiwa: ${result.numerology.soulNumber}`,
      `Takdir: ${result.numerology.destinyNumber}`,
      `Kedewasaan: ${result.numerology.maturityNumber}`,
      `Tahun Pribadi: ${result.numerology.personalYearNumber}`,
      `Pelajaran Karma: ${result.numerology.karmicLesson.length ? result.numerology.karmicLesson.join(', ') : 'Tidak ada'}`,
      `\n${insights?.numerologyAnalysis || ''}`,
    ].join('\n'),
  );

  // 5. Tipe Indigo & Karakter
  addSection(
    `Bab 4 — Tipe Energi: ${result.indigoType.type}`,
    `${result.indigoType.description}\n\nKekuatan Utama: ${result.indigoType.traits.join(', ')}\n\n${insights?.indigoAnalysis || ''}`,
  );

  // 6. Chakra & Aura
  const chakraSummary = [
    `Chakra Dominan: ${result.chakra.dominant}`,
    `Area Perhatian/Terblokir: ${result.chakra.blocked.length ? result.chakra.blocked.join(', ') : 'Tidak ada'}`,
    `Tingkat Energi: Mahkota ${result.chakra.crown}% | Ajna ${result.chakra.thirdEye}% | Tenggorokan ${result.chakra.throat}% | Hati ${result.chakra.heart}% | Plexus ${result.chakra.solarPlexus}% | Sakral ${result.chakra.sacral}% | Akar ${result.chakra.root}%`,
  ].join('\n');

  addSection(
    'Bab 5 — Vibrasi Chakra & Pancaran Aura',
    `${chakraSummary}\n\nMakna Aura (${result.aura.primaryColor} & ${result.aura.secondaryColor}): ${result.aura.meaning}\n\n${insights?.chakraAnalysis || ''}\n\n${insights?.auraAnalysis || ''}`,
  );

  // 7. Human Design
  if (result.humanDesign) {
    const hd = result.humanDesign;
    addSection(
      `Bab 6 — Desain Energi (Human Design: ${hd.type})`,
      `${hd.summary}\n\nProfil: ${hd.profile}\nOtoritas Keputusan: ${hd.authority}\nStrategi Hidup: ${hd.strategy}\n\n${insights?.humanDesignAnalysis || ''}`,
    );
  }

  // 8. Psikologi & Dinamika Batin
  if (insights?.psychologyAnalysis) {
    addSection('Bab 7 — Dinamika Psikologi Integratif', insights.psychologyAnalysis);
  }

  // 9. Afirmasi
  const affirmationText = result.affirmations
    .map((a, i) => `${i + 1}. [${a.category}] "${a.text}"`)
    .join('\n\n');
  addSection('Bab 8 — Afirmasi Penyelarasan Energi', affirmationText);

  // 10. Linimasa
  const timelineText = result.timeline
    .map((t) => {
      const age = t.year - new Date(result.input.birthDate).getFullYear();
      return `${t.phase} (Usia ±${age}, Tahun ${t.year}):\n${t.description}`;
    })
    .join('\n\n');
  addSection('Bab 9 — Linimasa Pertumbuhan Jiwa', timelineText);

  // 11. Bacaan Utama Blueprint
  addSection(
    'Bab 10 — Sintesis Blueprint Jiwa Terpadu',
    insights?.spiritualReading || result.spiritualReading || 'Sintesis spiritual tidak tersedia.',
  );

  // Footer penomoran halaman
  const totalPages = pdf.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8.5);
    pdf.setTextColor(130, 130, 150);
    pdf.text(
      `Theta Indigo Blueprint (${blueprintId}) — Halaman ${i} dari ${totalPages}`,
      pageWidth / 2,
      pageHeight - 8,
      { align: 'center' },
    );
  }

  pdf.save(`${result.input.name.replace(/\s+/g, '_')}_Blueprint_Jiwa.pdf`);
}
