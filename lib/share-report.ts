import type { ReadingResult } from '@/types';
import { formatParagraphsForShare } from '@/lib/format-text';

const WHATSAPP_SAFE_LENGTH = 15000;

function section(title: string, body?: string): string {
  if (!body?.trim()) return '';
  const formatted = formatParagraphsForShare(body.trim());
  return `\n\n━━━━━━━━━━━━━━━━\n*${title}*\n━━━━━━━━━━━━━━━━\n\n${formatted}`;
}

function formatGender(gender?: string): string {
  if (gender === 'male') return 'Laki-laki';
  if (gender === 'female') return 'Perempuan';
  if (gender === 'other') return 'Lainnya';
  return gender || '-';
}

export function buildFullReportText(result: ReadingResult): string {
  const { input, numerology, indigoType, chakra, aura, detailedInsights } = result;
  const insights = detailedInsights;

  const affirmationsText = result.affirmations
    .map((a, i) => `${i + 1}. *${a.category}*\n"${a.text}"`)
    .join('\n\n');

  const timelineText = result.timeline
    .map((t) => {
      const age = t.year - new Date(input.birthDate).getFullYear();
      const desc = formatParagraphsForShare(t.description);
      return `*${t.phase}* (usia ±${age}, ${t.year})\n${desc}`;
    })
    .join('\n\n');

  const chakraScores = [
    `Mahkota ${chakra.crown}%`,
    `Ajna ${chakra.thirdEye}%`,
    `Tenggorokan ${chakra.throat}%`,
    `Hati ${chakra.heart}%`,
    `Plexus Surya ${chakra.solarPlexus}%`,
    `Sakral ${chakra.sacral}%`,
    `Akar ${chakra.root}%`,
  ].join(' | ');

  let text = `✨ *CETAK BIRU SPIRITUAL*
*${input.name.toUpperCase()}*

_Theta Indigo Blueprint_
Tanggal: ${new Date(result.createdAt).toLocaleDateString('id-ID')}

━━━━━━━━━━━━━━━━
*📋 PROFIL*
━━━━━━━━━━━━━━━━

Nama: ${input.name}
Lahir: ${new Date(input.birthDate).toLocaleDateString('id-ID')}${input.birthTime ? `, ${input.birthTime}` : ''}
${input.gender ? `Jenis kelamin: ${formatGender(input.gender)}\n` : ''}${input.city || input.country ? `Lokasi: ${[input.city, input.country].filter(Boolean).join(', ')}\n` : ''}${input.spiritualGoal ? `Tujuan spiritual: ${input.spiritualGoal}\n` : ''}
━━━━━━━━━━━━━━━━
*🔢 RINGKASAN NUMEROLOGI*
━━━━━━━━━━━━━━━━

Jalan Hidup: *${numerology.lifePathNumber}*
Nomor Jiwa: *${numerology.soulNumber}*
Takdir: *${numerology.destinyNumber}*
Kedewasaan: *${numerology.maturityNumber}*
Tahun Pribadi: *${numerology.personalYearNumber}*
Karma: ${numerology.karmicLesson.length ? numerology.karmicLesson.join(', ') : 'Tidak ada'}

━━━━━━━━━━━━━━━━
*💜 TIPE INDIGO*
━━━━━━━━━━━━━━━━

*${indigoType.type}*

${formatParagraphsForShare(indigoType.description)}

Sifat: ${indigoType.traits.join(', ')}`;

  text += section('ANALISIS INDIGO MENDALAM', insights?.indigoAnalysis);
  text += section('PROFIL NUMEROLOGI MENDALAM', insights?.numerologyAnalysis);
  text += section('ANALISIS CHAKRA MENDALAM', insights?.chakraAnalysis || `Chakra dominan: *${chakra.dominant}*.\n\nSkor: ${chakraScores}.\n\nTerblokir: ${chakra.blocked.join(', ') || 'tidak ada'}.`);
  text += section('ANALISIS AURA MENDALAM', insights?.auraAnalysis || aura.meaning);

  if (result.humanDesign) {
    const hd = result.humanDesign;
    text += section(
      'HUMAN DESIGN',
      `${insights?.humanDesignAnalysis || ''}\n\nTipe: ${hd.type}\nProfil: ${hd.profile}\nOtoritas: ${hd.authority}\nStrategi: ${hd.strategy}\nDefinisi: ${hd.definition}`,
    );
  }

  text += section('PENJABARAN PSIKOLOGI', insights?.psychologyAnalysis);
  text += section('AFIRMASI PRIBADI', affirmationsText);
  text += section('LINIMASA HIDUP', timelineText);
  text += section('BACAAN SPIRITUAL', insights?.spiritualReading || result.spiritualReading);

  text += `\n\n— Dibuat dengan Theta Indigo Blueprint (System)`;

  if (text.length > WHATSAPP_SAFE_LENGTH) {
    return `${text.slice(0, WHATSAPP_SAFE_LENGTH - 120)}\n\n_[Laporan dipersingkat. Unduh PDF untuk versi lengkap.]_`;
  }

  return text;
}

export function shareToWhatsApp(result: ReadingResult): void {
  const text = buildFullReportText(result);
  const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}
