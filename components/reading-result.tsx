'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { ReadingResult as ReadingResultType } from '@/types';
import { generatePDFReport } from '@/lib/pdf-generator';
import { buildFullReportText, shareToWhatsApp } from '@/lib/share-report';
import { splitIntoParagraphs } from '@/lib/format-text';
import Link from 'next/link';
import { HumanDesignIllustration } from '@/components/human-design-illustration';
import { 
  Sparkles, 
  Download, 
  Share2, 
  Heart, 
  Eye, 
  Zap,
  Circle,
  TrendingUp,
  CheckCircle,
  User,
  Copy,
  ArrowLeft,
  Brain,
  Hexagon,
  Sun,
} from 'lucide-react';
import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis, PolarRadiusAxis, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, Cell } from 'recharts';

interface ReadingResultProps {
  result: ReadingResultType;
  onDownloadPDF?: () => void;
  onShare?: () => void;
  onBackToDashboard?: () => void;
  backToLandingHref?: string;
  backButtonTheme?: 'light' | 'dark';
  isGeneratingPDF?: boolean;
  isPdfDownloaded?: boolean;
}

function FormattedText({ text, className = '' }: { text: string; className?: string }) {
  const paragraphs = splitIntoParagraphs(text);
  return (
    <div className={className}>
      {paragraphs.map((paragraph, index) => (
        <p
          key={index}
          className="text-gray-700 leading-relaxed text-sm md:text-base mb-3 last:mb-0"
        >
          {paragraph}
        </p>
      ))}
    </div>
  );
}

function DetailedSection({ title, content }: { title: string; content?: string }) {
  if (!content?.trim()) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-4 p-4 md:p-5 rounded-xl bg-indigo-50/80 border border-indigo-100"
    >
      <h4 className="font-semibold text-indigo-900 mb-3 text-sm uppercase tracking-wide">{title}</h4>
      <FormattedText text={content} />
    </motion.div>
  );
}

export function ReadingResult({ result, onDownloadPDF, onShare, onBackToDashboard, backToLandingHref, backButtonTheme = 'light', isGeneratingPDF = false, isPdfDownloaded = false }: ReadingResultProps) {
  const [isCopied, setIsCopied] = useState(false);
  const [localGeneratingPdf, setLocalGeneratingPdf] = useState(false);
  const [localPdfDone, setLocalPdfDone] = useState(false);
  const insights = result.detailedInsights;

  const generatingPdf = isGeneratingPDF || localGeneratingPdf;
  const pdfDone = isPdfDownloaded || localPdfDone;

  const chakraData = [
    { name: 'Crown', value: result.chakra.crown, fill: '#9370DB' },
    { name: 'Third Eye', value: result.chakra.thirdEye, fill: '#8A2BE2' },
    { name: 'Throat', value: result.chakra.throat, fill: '#4169E1' },
    { name: 'Heart', value: result.chakra.heart, fill: '#FF6B6B' },
    { name: 'Solar Plexus', value: result.chakra.solarPlexus, fill: '#FFD700' },
    { name: 'Sacral', value: result.chakra.sacral, fill: '#FF8C00' },
    { name: 'Root', value: result.chakra.root, fill: '#8B4513' },
  ];

  const numerologyData = [
    { name: 'Jalan Hidup', value: result.numerology.lifePathNumber, fill: '#4f46e5' },
    { name: 'Jiwa', value: result.numerology.soulNumber, fill: '#9333ea' },
    { name: 'Takdir', value: result.numerology.destinyNumber, fill: '#db2777' },
    { name: 'Kedewasaan', value: result.numerology.maturityNumber, fill: '#0891b2' },
    { name: 'Tahun Pribadi', value: result.numerology.personalYearNumber, fill: '#ca8a04' },
  ];

  const handleCopyText = async () => {
    const fullText = buildFullReportText(result);
    try {
      await navigator.clipboard.writeText(fullText);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Gagal menyalin teks:', err);
    }
  };

  const handleDownloadPDF = async () => {
    if (onDownloadPDF) {
      onDownloadPDF();
      return;
    }
    setLocalGeneratingPdf(true);
    try {
      await generatePDFReport(result);
      setLocalPdfDone(true);
    } catch (err) {
      console.error('Gagal membuat PDF:', err);
      alert('Gagal membuat PDF. Silakan coba lagi.');
    } finally {
      setLocalGeneratingPdf(false);
    }
  };

  const handleShare = () => {
    if (onShare) {
      onShare();
      return;
    }
    shareToWhatsApp(result);
  };

  return (
    <motion.div
      id="reading-result-pdf"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {(onBackToDashboard || backToLandingHref) && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          {onBackToDashboard && (
            <Button
              type="button"
              onClick={onBackToDashboard}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md px-5 py-2.5 rounded-xl transition-all"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Kembali ke Form Analisis Cetak Biru
            </Button>
          )}
          {backToLandingHref && !onBackToDashboard && (
            <Link
              href={backToLandingHref}
              className="inline-flex items-center justify-center rounded-xl border border-indigo-200 px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-50"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali ke Landing Page
            </Link>
          )}
        </div>
      )}

      {/* Header */}
      <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-100 relative overflow-hidden">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-indigo-600 text-white shadow-sm">
              ID: {result.blueprintId || `TIB-${result.id.slice(0, 8)}`}
            </span>
            <span className="text-xs text-gray-500 font-medium">
              Tanggal Analisis: {new Date(result.createdAt).toLocaleDateString('id-ID')}
            </span>
          </div>
          <CardTitle className="text-3xl bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Cetak Biru Spiritual {result.input.name}
          </CardTitle>
          <CardDescription className="text-gray-600">
            Sintesis 5-Lapisan Waktu: Weton, Wuku, Pranata Mangsa, Bazi, & Human Design
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Profil Spiritual (Menampilkan Semua Input) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-black">
            <User className="w-6 h-6 text-blue-600" />
            Data Profil & Header Metadata
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-gray-700 text-sm">
            <div><span className="font-semibold block text-gray-500">ID Blueprint</span> <span className="font-mono text-indigo-700 font-semibold">{result.blueprintId || `TIB-${result.id.slice(0, 8)}`}</span></div>
            <div><span className="font-semibold block text-gray-500">Nama Lengkap</span> {result.input.name}</div>
            <div><span className="font-semibold block text-gray-500">Tanggal Lahir</span> {new Date(result.input.birthDate).toLocaleDateString('id-ID')}</div>
            {result.input.birthTime ? <div><span className="font-semibold block text-gray-500">Waktu Lahir</span> {result.input.birthTime}</div> : null}
            {result.input.gender && <div><span className="font-semibold block text-gray-500">Jenis Kelamin</span> {
              result.input.gender === 'male' ? 'Laki-laki' : result.input.gender === 'female' ? 'Perempuan' : result.input.gender === 'other' ? 'Lainnya' : 'Tidak Menyebutkan'
            }</div>}
            {result.input.city || result.input.country ? (
              <div><span className="font-semibold block text-gray-500">Kota/Negara Lahir</span> {[result.input.city, result.input.country].filter(Boolean).join(', ')}</div>
            ) : null}
          </div>
          {result.input.spiritualGoal && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <span className="font-semibold text-gray-500 text-sm block mb-1">Tujuan Spiritual</span>
              <p className="text-gray-800 italic">&quot;{result.input.spiritualGoal}&quot;</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modul: Weton & Wuku Jawa */}
      {result.weton && (
        <Card className="border-indigo-100 bg-gradient-to-r from-indigo-50/50 via-white to-purple-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-black">
              <Sun className="w-6 h-6 text-amber-600" />
              Weton & Wuku Jawa (Primbon & Pawukon Data `wukuList.json`)
            </CardTitle>
            <CardDescription className="text-gray-600">
              Analisis Neptu Hari, Pasaran Jawa, serta Penjelatan Lengkap Siklus Wuku Pawukon 210 Hari
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="p-4 rounded-xl bg-white border border-indigo-100 shadow-sm">
                <div className="text-xs uppercase font-bold text-gray-500">Weton Kelahiran</div>
                <div className="text-2xl font-extrabold text-indigo-900 mt-1">{result.weton.wetonName}</div>
                <div className="text-xs text-indigo-600 mt-1 font-semibold">Total Neptu: {result.weton.totalNeptu} (Hari {result.weton.neptuDay} + Pasaran {result.weton.neptuPasaran})</div>
              </div>
              {result.wuku && (
                <div className="p-4 rounded-xl bg-white border border-purple-100 shadow-sm">
                  <div className="text-xs uppercase font-bold text-gray-500">Siklus Wuku Pawukon</div>
                  <div className="text-2xl font-extrabold text-purple-900 mt-1">Wuku {result.wuku.name}</div>
                  <div className="text-xs text-purple-600 mt-1 font-semibold">Dewa Naungan: {result.wuku.deity}</div>
                </div>
              )}
              {result.wuku && (
                <div className="p-4 rounded-xl bg-white border border-pink-100 shadow-sm">
                  <div className="text-xs uppercase font-bold text-gray-500">Aral & Kebangkitan Jiwa</div>
                  <div className="text-sm font-bold text-pink-900 mt-1">{result.wuku.aral || result.wuku.lifeLesson}</div>
                </div>
              )}
            </div>

            {/* Deskripsi Lengkap Wuku dari wukuList.json — ditampilkan sebagai bullet points */}
            {result.wuku?.wukuBullets && result.wuku.wukuBullets.length > 0 && (
              <div className="p-5 bg-white rounded-xl border border-indigo-100 shadow-sm space-y-3">
                <span className="font-bold text-indigo-900 text-sm block uppercase tracking-wide">
                  📖 Deskripsi Lengkap Wuku {result.wuku.name} (Primbon Pawukon)
                </span>
                <ul className="space-y-2">
                  {result.wuku.wukuBullets.map((bullet, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700 leading-relaxed">
                      <span className="mt-0.5 w-2 h-2 flex-shrink-0 rounded-full bg-indigo-400" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {result.wuku?.kebaikan && (
                <div className="p-4 bg-emerald-50/60 rounded-lg border border-emerald-200 space-y-1">
                  <span className="font-semibold text-emerald-900 block text-xs uppercase">✨ Rekomendasi & Kebaikan</span>
                  <p className="text-emerald-950 text-xs">{result.wuku.kebaikan}</p>
                </div>
              )}
              {result.wuku?.keburukan && (
                <div className="p-4 bg-rose-50/60 rounded-lg border border-rose-200 space-y-1">
                  <span className="font-semibold text-rose-900 block text-xs uppercase">⚠️ Pantangan & Keburukan</span>
                  <p className="text-rose-950 text-xs">{result.wuku.keburukan}</p>
                </div>
              )}
            </div>

            {result.wuku?.sedekahSesaji && (
              <div className="p-4 bg-amber-50/70 rounded-lg border border-amber-200 text-xs text-amber-950 space-y-1">
                <span className="font-semibold block uppercase text-amber-900">🙏 Sedekah & Sesaji Luhur</span>
                <p>{result.wuku.sedekahSesaji}</p>
              </div>
            )}

            {result.wuku?.keris && result.wuku.keris.length > 0 && (
              <div className="p-4 bg-purple-50/70 rounded-lg border border-purple-200 text-xs text-purple-950 space-y-1">
                <span className="font-semibold block uppercase text-purple-900">🗡️ Pencocokan Pusaka / Keris</span>
                <p>{result.wuku.keris.join(', ')}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          Modul: BaZi (八字) — Empat Pilar Kehidupan
          ══════════════════════════════════════════════════════════════════ */}
      {result.bazi && (() => {
        const b = result.bazi!;
        const pillars = [
          { label: 'Pilar Tahun', subtitle: 'Warisan & Leluhur', data: b.yearPillar, color: 'from-amber-50 to-yellow-50', border: 'border-amber-200', accent: 'text-amber-800' },
          { label: 'Pilar Bulan', subtitle: 'Karier & Orang Tua', data: b.monthPillar, color: 'from-green-50 to-emerald-50', border: 'border-green-200', accent: 'text-green-800' },
          { label: 'Pilar Hari', subtitle: 'Diri & Pasangan', data: b.dayPillar, color: 'from-indigo-50 to-blue-50', border: 'border-indigo-200', accent: 'text-indigo-800' },
          { label: 'Pilar Jam', subtitle: 'Anak & Masa Depan', data: b.hourPillar, color: 'from-rose-50 to-pink-50', border: 'border-rose-200', accent: 'text-rose-800' },
        ];
        const elColors: Record<string, string> = {
          Kayu: 'bg-green-500', Api: 'bg-red-500', Tanah: 'bg-yellow-600',
          Logam: 'bg-slate-400', Air: 'bg-blue-500',
        };
        const elBg: Record<string, string> = {
          Kayu: 'bg-green-50 text-green-800 border-green-200',
          Api: 'bg-red-50 text-red-800 border-red-200',
          Tanah: 'bg-yellow-50 text-yellow-800 border-yellow-200',
          Logam: 'bg-slate-50 text-slate-700 border-slate-200',
          Air: 'bg-blue-50 text-blue-800 border-blue-200',
        };
        const totalElCount = Object.values(b.elementCount).reduce((a, c) => a + c, 0);
        return (
          <Card className="border-amber-100 bg-gradient-to-br from-amber-50/30 via-white to-yellow-50/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-black">
                <span className="text-2xl">八字</span>
                BaZi — Analisis Empat Pilar Kehidupan (四柱命理)
              </CardTitle>
              <CardDescription className="text-gray-600">
                Sistem astrologi Tiongkok kuno berbasis tahun, bulan, hari & jam kelahiran — mengungkap karakter, karier, kesehatan, dan siklus nasib
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">

              {/* Summary Badge */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-amber-100/80 to-yellow-100/80 border border-amber-200 space-y-1">
                <p className="text-sm font-semibold text-amber-900">Day Master (Tuan Hari):</p>
                <p className="text-xl font-extrabold text-amber-800">{b.dayMaster}</p>
                <p className="text-xs text-amber-700">{b.dayMasterStrength}</p>
              </div>

              {/* Four Pillars Table */}
              <div>
                <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">⚙️ Empat Pilar (四柱 Sì Zhù)</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {pillars.map((p) => (
                    <div key={p.label} className={`rounded-xl border ${p.border} bg-gradient-to-b ${p.color} p-3 space-y-1 text-center`}>
                      <div className={`text-xs font-bold uppercase tracking-wide ${p.accent}`}>{p.label}</div>
                      <div className="text-[10px] text-gray-500">{p.subtitle}</div>
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        <div className="text-xs text-gray-500">Batang Langit</div>
                        <div className="font-bold text-sm text-gray-800">{p.data.heavenlyStem}</div>
                        <div className="text-xs text-gray-500 mt-1">{p.data.element} · {p.data.polarity}</div>
                      </div>
                      <div className="mt-1 pt-1 border-t border-gray-200">
                        <div className="text-xs text-gray-500">Cabang Bumi</div>
                        <div className="font-bold text-sm text-gray-800">{p.data.earthlyBranch}</div>
                        <div className="text-xs text-gray-500">{p.data.animal}</div>
                      </div>
                      {p.data.hiddenStems.length > 0 && (
                        <div className="mt-1 pt-1 border-t border-gray-200">
                          <div className="text-[10px] text-gray-400">Batang Tersembunyi</div>
                          {p.data.hiddenStems.map((hs, i) => (
                            <div key={i} className="text-[10px] text-gray-500">{hs}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Element Distribution */}
              <div>
                <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">🌊 Distribusi Lima Elemen (五行 Wǔ Xíng)</h4>
                <div className="space-y-2">
                  {Object.entries(b.elementCount).sort((a, b) => b[1] - a[1]).map(([el, count]) => (
                    <div key={el} className="flex items-center gap-3">
                      <div className={`w-20 text-xs font-semibold text-right ${elColors[el] ? 'text-gray-700' : 'text-gray-600'}`}>{el}</div>
                      <div className="flex-1 bg-gray-100 rounded-full h-2.5">
                        <div
                          className={`h-2.5 rounded-full ${elColors[el] || 'bg-gray-400'}`}
                          style={{ width: `${Math.min(100, Math.round((count / totalElCount) * 100))}%` }}
                        />
                      </div>
                      <div className="w-8 text-xs text-gray-600 text-right">{count.toFixed(1)}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="text-xs text-gray-600">Elemen Dominan:</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${elBg[b.dominantElement]}`}>{b.dominantElement}</span>
                  <span className="text-xs text-gray-600 ml-2">Elemen Lemah:</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${elBg[b.weakElement]}`}>{b.weakElement}</span>
                </div>
              </div>

              {/* Favorable / Unfavorable */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-green-50/70 rounded-xl border border-green-200 space-y-2">
                  <span className="font-bold text-green-800 text-sm block">✅ Elemen Menguntungkan (喜用神)</span>
                  <div className="flex flex-wrap gap-2">
                    {b.favorableElements.map(el => (
                      <span key={el} className={`px-3 py-1 rounded-full text-xs font-semibold border ${elBg[el]}`}>{el}</span>
                    ))}
                  </div>
                </div>
                <div className="p-4 bg-red-50/70 rounded-xl border border-red-200 space-y-2">
                  <span className="font-bold text-red-800 text-sm block">⚠️ Elemen Merugikan (忌神)</span>
                  <div className="flex flex-wrap gap-2">
                    {b.unfavorableElements.map(el => (
                      <span key={el} className={`px-3 py-1 rounded-full text-xs font-semibold border ${elBg[el]}`}>{el}</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Lucky Cycles (大運) */}
              <div>
                <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">🔄 Siklus Keberuntungan Besar (大運 Dà Yùn)</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="bg-amber-50 border-b border-amber-200">
                        <th className="text-left py-2 px-3 text-amber-800 font-bold">Usia</th>
                        <th className="text-left py-2 px-3 text-amber-800 font-bold">Batang Langit</th>
                        <th className="text-left py-2 px-3 text-amber-800 font-bold">Cabang Bumi</th>
                        <th className="text-left py-2 px-3 text-amber-800 font-bold">Elemen</th>
                        <th className="text-left py-2 px-3 text-amber-800 font-bold hidden md:table-cell">Tema Periode</th>
                      </tr>
                    </thead>
                    <tbody>
                      {b.luckyCycles.map((cycle, i) => (
                        <tr key={i} className={`border-b border-gray-100 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                          <td className="py-2 px-3 font-bold text-gray-800">{cycle.startAge}–{cycle.endAge}</td>
                          <td className="py-2 px-3 text-gray-600">{cycle.stem}</td>
                          <td className="py-2 px-3 text-gray-600">{cycle.branch}</td>
                          <td className="py-2 px-3">
                            <span className={`px-2 py-0.5 rounded-full font-semibold border ${elBg[cycle.element] || 'bg-gray-100 text-gray-700'}`}>{cycle.element}</span>
                          </td>
                          <td className="py-2 px-3 text-gray-500 hidden md:table-cell max-w-xs">{cycle.theme.split('—')[0]}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Narrative Sections */}
              <div className="space-y-4">
                {[
                  { icon: '🧠', title: 'Kepribadian & Watak', content: b.personality },
                  { icon: '💼', title: 'Karier & Jalur Profesional', content: b.career },
                  { icon: '❤️', title: 'Hubungan & Asmara', content: b.relationships },
                  { icon: '🌿', title: 'Kesehatan & Vitalitas', content: b.health },
                  { icon: '💰', title: 'Kekayaan & Finansial', content: b.wealth },
                  { icon: '🔮', title: 'Jalan Spiritual BaZi', content: b.spiritualPath },
                ].map(({ icon, title, content }) => (
                  <div key={title} className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm space-y-2">
                    <h5 className="font-bold text-gray-800 text-sm">{icon} {title}</h5>
                    <p className="text-gray-600 text-sm leading-relaxed">{content}</p>
                  </div>
                ))}
              </div>

            </CardContent>
          </Card>
        );
      })()}

      {/* Modul: Kua & Feng Shui Arah Ruang */}
      {result.kua && (
        <Card className="border-emerald-100 bg-gradient-to-r from-emerald-50/40 via-white to-teal-50/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-black">
              <Hexagon className="w-6 h-6 text-emerald-600" />
              Angka Kua & Feng Shui Arah Ruang (Ba Zhai)
            </CardTitle>
            <CardDescription className="text-gray-600">
              Arah mata angin terbaik untuk posisi tidur, meja kerja, belajar, dan relasi keberuntungan
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center justify-between p-4 bg-emerald-100/60 rounded-xl border border-emerald-200 gap-2">
              <div>
                <span className="text-xs uppercase font-bold text-emerald-800">Angka Kua Anda</span>
                <div className="text-3xl font-extrabold text-emerald-950">Kua {result.kua.kuaNumber}</div>
              </div>
              <div className="px-3.5 py-1.5 rounded-full bg-emerald-600 text-white font-semibold text-xs shadow-sm">
                {result.kua.group}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-white rounded-lg border border-gray-200">
                <span className="font-semibold text-gray-500 block">Arah Tidur Ideal</span>
                <span className="font-bold text-emerald-800 text-sm">{result.kua.bestSleepingDirection}</span>
              </div>
              <div className="p-3 bg-white rounded-lg border border-gray-200">
                <span className="font-semibold text-gray-500 block">Arah Kerja Ideal</span>
                <span className="font-bold text-emerald-800 text-sm">{result.kua.bestWorkingDirection}</span>
              </div>
              <div className="p-3 bg-white rounded-lg border border-gray-200">
                <span className="font-semibold text-gray-500 block">Arah Belajar Ideal</span>
                <span className="font-bold text-emerald-800 text-sm">{result.kua.bestStudyingDirection}</span>
              </div>
              <div className="p-3 bg-white rounded-lg border border-gray-200">
                <span className="font-semibold text-gray-500 block">Arah Relasi Harmonistik</span>
                <span className="font-bold text-emerald-800 text-sm">{result.kua.bestRelationshipDirection}</span>
              </div>
            </div>

            <div className="p-3 bg-rose-50 rounded-lg border border-rose-200 text-xs text-rose-800">
              <span className="font-semibold block mb-0.5">Arah Yang Sebaiknya Dihindari:</span>
              <span>{result.kua.avoidDirections}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modul 10: Pranata Mangsa Jawa */}
      {result.pranataMangsa && (
        <Card className="border-amber-200/60 bg-gradient-to-br from-amber-50/40 via-white to-indigo-50/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-black">
              <span className="text-2xl">{result.pranataMangsa.icon || '🌟'}</span>
              {result.pranataMangsa.headline || `Pranata Mangsa Jawa — Mangsa ${result.pranataMangsa.name}`}
            </CardTitle>
            <CardDescription className="text-gray-600">
              Horoskop Tradisional Jawa berdasarkan Sistem Kalender Sultan Agung (`ramalan_mangsa.json`)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200/80 text-center space-y-2">
              <div className="text-xs uppercase font-bold tracking-wider text-amber-800">Naungan Musim Lahir</div>
              <div className="text-3xl font-extrabold text-amber-900">
                Mangsa {result.pranataMangsa.name} <span className="text-base font-medium text-amber-700">({result.pranataMangsa.period})</span>
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-200/60 text-amber-900 text-xs font-semibold">
                Elemen Musim: {result.pranataMangsa.element}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="p-4 rounded-lg bg-white border border-gray-200 space-y-1">
                <span className="font-semibold text-indigo-900 block text-xs uppercase">Karakter Alam</span>
                <p className="text-gray-700">{result.pranataMangsa.seasonCharacter}</p>
              </div>
              <div className="p-4 rounded-lg bg-white border border-gray-200 space-y-1">
                <span className="font-semibold text-indigo-900 block text-xs uppercase">Energi Alam Bawaan</span>
                <p className="text-gray-700">{result.pranataMangsa.natureEnergy}</p>
              </div>
              <div className="p-4 rounded-lg bg-white border border-gray-200 space-y-1">
                <span className="font-semibold text-indigo-900 block text-xs uppercase">Pola Psikologis & Watak Bawaan</span>
                <p className="text-gray-700">{result.pranataMangsa.psychologicalPattern}</p>
              </div>
              <div className="p-4 rounded-lg bg-white border border-gray-200 space-y-1">
                <span className="font-semibold text-indigo-900 block text-xs uppercase">Cara Pemulihan Energi (Recharge)</span>
                <p className="text-gray-700">{result.pranataMangsa.rechargeMethod}</p>
              </div>
            </div>

            <DetailedSection title="Sintesis AI Musim Pranata Mangsa" content={insights?.pranataMangsaAnalysis} />
          </CardContent>
        </Card>
      )}

      {/* Indigo Type */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-black">
            <Sparkles className="w-6 h-6 text-indigo-600" />
            Tipe Indigo Anda
          </CardTitle>
        </CardHeader>
        <CardContent>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="text-center space-y-4"
          >
            <div className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              {result.indigoType.type}
            </div>
            <FormattedText text={result.indigoType.description} className="text-lg text-center" />
            <DetailedSection title="Analisis Mendalam" content={insights?.indigoAnalysis} />
            <div className="flex flex-wrap justify-center gap-2">
              {result.indigoType.traits.map((trait, index) => (
                <span
                  key={index}
                  className="px-4 py-2 rounded-full bg-indigo-100 text-indigo-700 text-sm border border-indigo-200 cursor-default select-none hover:bg-indigo-200 transition-colors"
                >
                  {trait}
                </span>
              ))}
            </div>
          </motion.div>
        </CardContent>
      </Card>

      {/* Numerology */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-black">
            <Circle className="w-6 h-6 text-purple-600" />
            Profil Numerologi
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Grafik Bar Animasi Recharts */}
          <div className="h-64 mb-8">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={numerologyData} margin={{ top: 20, right: 10, left: -20, bottom: 5 }}>
                <XAxis dataKey="name" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} tickCount={5} />
                <RechartsTooltip 
                  cursor={{ fill: '#f3f4f6' }}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={40}>
                  {numerologyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="text-center p-4 rounded-lg bg-gray-50 border border-gray-200">
              <div className="text-3xl font-bold text-indigo-600">{result.numerology.lifePathNumber}</div>
              <div className="text-sm text-gray-500 mt-1">Jalan Hidup</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-gray-50 border border-gray-200">
              <div className="text-3xl font-bold text-purple-600">{result.numerology.soulNumber}</div>
              <div className="text-sm text-gray-500 mt-1">Nomor Jiwa</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-gray-50 border border-gray-200">
              <div className="text-3xl font-bold text-pink-600">{result.numerology.destinyNumber}</div>
              <div className="text-sm text-gray-500 mt-1">Takdir</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-gray-50 border border-gray-200">
              <div className="text-3xl font-bold text-cyan-600">{result.numerology.maturityNumber}</div>
              <div className="text-sm text-gray-500 mt-1">Kedewasaan</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-gray-50 border border-gray-200">
              <div className="text-3xl font-bold text-yellow-600">{result.numerology.personalYearNumber}</div>
              <div className="text-sm text-gray-500 mt-1">Tahun Pribadi</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-gray-50 border border-gray-200">
              <div className="text-3xl font-bold text-green-600">
                {result.numerology.karmicLesson.length > 0 ? result.numerology.karmicLesson.join(', ') : 'Tidak ada'}
              </div>
              <div className="text-sm text-gray-500 mt-1">Pelajaran Karma</div>
            </div>
          </div>
          <DetailedSection title="Penjelasan Numerologi Mendalam" content={insights?.numerologyAnalysis} />
        </CardContent>
      </Card>

      {/* Chakra Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-black">
            <Eye className="w-6 h-6 text-cyan-600" />
            Analisis Chakra
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="80%" data={chakraData}>
                  <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                  <PolarRadiusAxis tick={false} />
                  <RadialBar dataKey="value" cornerRadius={10} fill="#8884d8" />
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                <span className="text-gray-700">Chakra Dominan</span>
                <span className="font-semibold text-indigo-600 capitalize">{result.chakra.dominant}</span>
              </div>
              {result.chakra.blocked.length > 0 && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                  <div className="text-sm text-red-600 mb-2">Chakra yang Terblokir:</div>
                  <div className="flex flex-wrap gap-2">
                    {result.chakra.blocked.map((chakra, index) => (
                      <span key={index} className="text-sm text-red-700 capitalize">{chakra}</span>
                    ))}
                  </div>
                </div>
              )}
              {result.chakra.blocked.length === 0 && (
                <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                  <span className="text-sm text-green-700">Semua chakra seimbang! ✨</span>
                </div>
              )}
              <div className="grid grid-cols-1 gap-1 text-xs text-gray-600 pt-2">
                {chakraData.map((c) => (
                  <div key={c.name} className="flex justify-between">
                    <span>{c.name}</span>
                    <span className="font-medium">{c.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DetailedSection title="Analisis Chakra Mendalam" content={insights?.chakraAnalysis} />
        </CardContent>
      </Card>

      {/* Human Design */}
      {result.humanDesign && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-black">
              <Hexagon className="w-6 h-6 text-violet-600" />
              Human Design
            </CardTitle>
            <CardDescription className="text-gray-600">
              Tipe {result.humanDesign.type} · Profil {result.humanDesign.profile} · {result.humanDesign.definition}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              <HumanDesignIllustration profile={result.humanDesign} />
              <div className="space-y-3 text-sm text-gray-700">
                <p><span className="font-semibold text-gray-900">Strategi:</span> {result.humanDesign.strategy}</p>
                <p><span className="font-semibold text-gray-900">Otoritas:</span> {result.humanDesign.authority}</p>
                <FormattedText text={result.humanDesign.summary} />
              </div>
            </div>
            <DetailedSection title="Analisis Human Design Mendalam" content={insights?.humanDesignAnalysis} />
          </CardContent>
        </Card>
      )}

      {/* Psychology */}
      {insights?.psychologyAnalysis && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-black">
              <Brain className="w-6 h-6 text-rose-600" />
              Penjabaran Psikologi Mendalam
            </CardTitle>
            <CardDescription className="text-gray-600">
              Refleksi pola emosi, motivasi, dan pertumbuhan pribadi (bukan pengganti konseling klinis)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DetailedSection title="Analisis Psikologis" content={insights.psychologyAnalysis} />
          </CardContent>
        </Card>
      )}

      {/* Aura */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-black">
            <Zap className="w-6 h-6 text-yellow-500" />
            Aura Anda
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div
              className="w-24 h-24 rounded-full animate-pulse-slow"
              style={{
                background: `linear-gradient(135deg, ${result.aura.primaryColor}, ${result.aura.secondaryColor})`,
                boxShadow: `0 0 30px ${result.aura.primaryColor}50`,
              }}
            />
            <motion.div className="flex-1">
              <FormattedText text={result.aura.meaning} />
              <DetailedSection title="Analisis Aura Mendalam" content={insights?.auraAnalysis} />
            </motion.div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      {result.timeline.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-black">
              <TrendingUp className="w-6 h-6 text-emerald-600" />
              Linimasa Spiritual
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {result.timeline.map((phase, index) => (
              <div key={index} className="p-4 rounded-lg border border-gray-200 bg-gray-50">
                <div className="font-semibold text-indigo-700">
                  {phase.phase} — {phase.year}
                </div>
                <FormattedText text={phase.description} className="mt-2" />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Affirmations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-black">
            <Heart className="w-6 h-6 text-pink-500" />
            Afirmasi Pribadi Anda
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {result.affirmations.map((affirmation, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 rounded-lg bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200"
              >
                <p className="text-gray-800 italic">"{affirmation.text}"</p>
                <span className="text-xs text-indigo-600 capitalize mt-2 block">{affirmation.category}</span>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Spiritual Reading */}
      {(insights?.spiritualReading || result.spiritualReading) && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-2 text-black font-semibold text-2xl">
              <Sparkles className="w-6 h-6 text-green-600 inline" />
              <span>Bacaan Spiritual</span>
            </div>
            <Button variant="outline" size="sm" onClick={handleCopyText} className="text-gray-600 hover:text-indigo-600">
              {isCopied ? <CheckCircle className="w-4 h-4 mr-2 text-green-500" /> : <Copy className="w-4 h-4 mr-2" />}
              {isCopied ? 'Tersalin' : 'Salin Laporan'}
            </Button>
          </CardHeader>
          <CardContent>
            <FormattedText text={insights?.spiritualReading || result.spiritualReading || ''} />
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-4 justify-center">
        <Button onClick={handleDownloadPDF} variant="outline" size="lg" disabled={generatingPdf}>
          {pdfDone ? (
            <><CheckCircle className="w-4 h-4 mr-2 text-green-400" /> Berhasil Diunduh!</>
          ) : generatingPdf ? (
            <><div className="w-4 h-4 mr-2 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" /> Sedang Membuat PDF...</>
          ) : (
            <><Download className="w-4 h-4 mr-2" /> Unduh PDF Lengkap</>
          )}
        </Button>
        <Button onClick={handleShare} variant="outline" size="lg">
          <Share2 className="w-4 h-4 mr-2" />
          Bagikan ke WhatsApp
        </Button>
      </div>

      {/* Bottom CTA to Calculate Again without returning to landing page */}
      {onBackToDashboard && (
        <Card className="bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 border-indigo-500/30 text-white text-center p-8 shadow-xl mt-8">
          <div className="max-w-2xl mx-auto space-y-4">
            <span className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Analisis Spiritual Ulang
            </span>
            <h3 className="text-2xl md:text-3xl font-extrabold text-white">
              Ingin Menghitung Kembali Cetak Biru Spiritual?
            </h3>
            <p className="text-slate-300 text-sm">
              Klik tombol di bawah untuk kembali ke form &quot;Temukan Cetak Biru Spiritual Anda&quot; tanpa harus keluar atau kembali ke Landing Page.
            </p>
            <div className="pt-2 flex justify-center">
              <Button
                type="button"
                onClick={onBackToDashboard}
                size="lg"
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-8 py-3 rounded-xl shadow-lg shadow-indigo-950/60 transition-all"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Kembali ke Form Analisis Cetak Biru
              </Button>
            </div>
          </div>
        </Card>
      )}
    </motion.div>
  );
}
