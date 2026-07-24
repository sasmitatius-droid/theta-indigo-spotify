'use client';

import { useState } from 'react';
import { getCurrentWuku, getWukuInfo, getWetonHariIni, getWukuCalendarMonth, formatWukuBullets } from '@/lib/wuku-calculator';
import Link from 'next/link';
import { ArrowLeft, Calendar, Star, AlertTriangle, Sword, Info, ChevronLeft, ChevronRight } from 'lucide-react';

const WUKU_COLORS: Record<string, string> = {
  'Sinta': 'from-rose-600 to-rose-900',
  'Landep': 'from-blue-600 to-blue-900',
  'Wukir': 'from-emerald-600 to-emerald-900',
  'Kulantir': 'from-amber-600 to-amber-900',
  'Tolu': 'from-purple-600 to-purple-900',
  'Gumbreg': 'from-teal-600 to-teal-900',
  'Warigalit': 'from-orange-600 to-orange-900',
  'Warigagung': 'from-cyan-600 to-cyan-900',
  'Julungwangi': 'from-indigo-600 to-indigo-900',
  'Sungsang': 'from-red-600 to-red-900',
  'Galungan': 'from-yellow-600 to-yellow-900',
  'Kuningan': 'from-lime-600 to-lime-900',
  'Langkir': 'from-pink-600 to-pink-900',
  'Mandasiya': 'from-violet-600 to-violet-900',
  'Julungpujud': 'from-sky-600 to-sky-900',
  'Pahang': 'from-fuchsia-600 to-fuchsia-900',
  'Kuruwelut': 'from-slate-600 to-slate-900',
  'Marakeh': 'from-green-600 to-green-900',
  'Tambir': 'from-stone-600 to-stone-900',
  'Madangkungan': 'from-zinc-600 to-zinc-900',
  'Maktal': 'from-blue-700 to-indigo-900',
  'Wuye': 'from-emerald-700 to-teal-900',
  'Manahil': 'from-rose-700 to-pink-900',
  'Prangbakat': 'from-amber-700 to-orange-900',
  'Bala': 'from-red-700 to-rose-900',
  'Wugu': 'from-purple-700 to-violet-900',
  'Wayang': 'from-indigo-700 to-blue-900',
  'Kulawu': 'from-teal-700 to-cyan-900',
  'Dukut': 'from-yellow-700 to-amber-900',
  'Watugunung': 'from-slate-700 to-gray-900',
};

export default function KalenderPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [activeYear, setActiveYear] = useState<number>(new Date().getFullYear());
  const [activeMonth, setActiveMonth] = useState<number>(new Date().getMonth() + 1);

  const now = new Date();
  const { wuku: activeWuku, dayInWuku } = getCurrentWuku(selectedDate);
  const wukuInfo = getWukuInfo(activeWuku);
  const weton = getWetonHariIni(selectedDate);

  const calendarData = getWukuCalendarMonth(activeYear, activeMonth);

  const monthNames = ['', 'Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
  const dayNames = ['Min','Sen','Sel','Rab','Kam','Jum','Sab'];

  const firstDayOfMonth = new Date(activeYear, activeMonth - 1, 1).getDay();
  const bgClass = WUKU_COLORS[activeWuku] || 'from-indigo-600 to-indigo-900';

  const handlePrevMonth = () => {
    if (activeMonth === 1) {
      setActiveMonth(12);
      setActiveYear((y) => y - 1);
    } else {
      setActiveMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (activeMonth === 12) {
      setActiveMonth(1);
      setActiveYear((y) => y + 1);
    } else {
      setActiveMonth((m) => m + 1);
    }
  };

  const isTodaySelected = selectedDate.toDateString() === now.toDateString();

  return (
    <main className="min-h-screen bg-slate-950 text-white pb-16 selection:bg-indigo-500 selection:text-white">
      {/* Hero Section */}
      <div className={`bg-gradient-to-br ${bgClass} py-12 px-4 transition-all duration-500`}>
        <div className="max-w-4xl mx-auto">
          <Link href="/" className="inline-flex items-center gap-2 text-white/70 hover:text-white text-sm mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Kembali ke Beranda
          </Link>

          <div className="text-center space-y-3">
            <p className="text-white/60 text-xs tracking-[4px] uppercase font-semibold">🗓️ Kalender Spiritual Jawa</p>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
              Wuku & Weton
            </h1>
            <p className="text-white/90 font-medium text-lg">
              {selectedDate.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              {!isTodaySelected && (
                <button
                  onClick={() => setSelectedDate(new Date())}
                  className="ml-3 text-xs bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full text-white font-semibold transition-colors"
                >
                  Lihat Hari Ini
                </button>
              )}
            </p>
          </div>

          {/* Highlight for Selected Date */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 text-center shadow-lg">
              <p className="text-white/60 text-xs uppercase tracking-widest mb-2">Wuku Ditampilkan</p>
              <p className="text-3xl font-bold">{activeWuku}</p>
              <p className="text-white/70 text-sm mt-1">Hari ke-{dayInWuku} dari 7 (Berganti tiap Minggu)</p>
              <div className="flex justify-center gap-1 mt-3">
                {[1,2,3,4,5,6,7].map((d) => (
                  <div key={d} className={`w-3 h-3 rounded-full ${d <= dayInWuku ? 'bg-white' : 'bg-white/20'}`} />
                ))}
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 text-center shadow-lg">
              <p className="text-white/60 text-xs uppercase tracking-widest mb-2">Weton Ditampilkan</p>
              <p className="text-3xl font-bold">{weton}</p>
              <p className="text-white/70 text-sm mt-1">Hari &amp; Pasaran Jawa</p>
              <p className="text-white/50 text-xs mt-2">Pancawara · Pitulungan</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 mt-10 space-y-8">
        {/* Wuku Detail Info */}
        {wukuInfo && (
          <section className="bg-slate-900 rounded-2xl border border-slate-700 overflow-hidden shadow-xl">
            <div className={`bg-gradient-to-r ${bgClass} px-6 py-4 flex items-center justify-between`}>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-300" /> Wuku {activeWuku} — Karakter &amp; Makna
              </h2>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {wukuInfo.deskripsi && (
                <div className="md:col-span-2 bg-slate-800/50 rounded-xl p-5 border border-slate-700 space-y-2">
                  <p className="text-xs text-indigo-300 font-semibold uppercase tracking-widest flex items-center gap-1">
                    <Info className="w-3.5 h-3.5 text-indigo-400" /> Karakter &amp; Wawasan Lambang Wuku
                  </p>
                  <ul className="space-y-2 text-slate-300 text-sm leading-relaxed pt-1">
                    {formatWukuBullets(wukuInfo.deskripsi).map((bullet, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-indigo-400 font-bold select-none">•</span>
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {wukuInfo.kebaikan && (
                <div className="bg-emerald-900/20 border border-emerald-500/20 rounded-xl p-4">
                  <p className="text-xs text-emerald-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                    <Star className="w-3.5 h-3.5" /> Kebaikan
                  </p>
                  <p className="text-slate-300 text-sm leading-relaxed">{wukuInfo.kebaikan}</p>
                </div>
              )}
              {wukuInfo.keburukan && (
                <div className="bg-red-900/20 border border-red-500/20 rounded-xl p-4">
                  <p className="text-xs text-red-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Keburukan / Pantangan
                  </p>
                  <p className="text-slate-300 text-sm leading-relaxed">{wukuInfo.keburukan}</p>
                </div>
              )}
              {wukuInfo.aralnya && (
                <div className="bg-amber-900/20 border border-amber-500/20 rounded-xl p-4">
                  <p className="text-xs text-amber-400 uppercase tracking-widest mb-2">⚠️ Aral / Bahaya</p>
                  <p className="text-slate-300 text-sm">{wukuInfo.aralnya}</p>
                </div>
              )}
              {wukuInfo.keris && wukuInfo.keris.length > 0 && (
                <div className="bg-violet-900/20 border border-violet-500/20 rounded-xl p-4">
                  <p className="text-xs text-violet-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                    <Sword className="w-3.5 h-3.5" /> Keris yang Sesuai
                  </p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {wukuInfo.keris.map((k) => (
                      <span key={k} className="bg-violet-800/40 text-violet-200 text-xs px-2.5 py-1 rounded-full border border-violet-500/20">
                        {k}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Monthly Interactive Calendar */}
        <section className="bg-slate-900 rounded-2xl border border-slate-700 overflow-hidden shadow-xl">
          <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-400" />
              <h2 className="text-lg font-bold">
                Kalender Wuku — {monthNames[activeMonth]} {activeYear}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                title="Bulan Sebelumnya"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={handleNextMonth}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                title="Bulan Berikutnya"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="p-4">
            <p className="text-xs text-slate-400 mb-3 text-center">
              💡 Klik salah satu tanggal di bawah untuk melihat rincian Wuku &amp; Weton tanggal tersebut.
            </p>
            <div className="grid grid-cols-7 gap-1.5 mb-2">
              {dayNames.map((d) => (
                <div key={d} className="text-center text-xs font-semibold text-indigo-300 py-1">
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {/* Empty cells for first week */}
              {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
              {calendarData.map(({ date, wuku, dayInWuku }) => {
                const isToday = date.toDateString() === now.toDateString();
                const isSelected = date.toDateString() === selectedDate.toDateString();
                const color = WUKU_COLORS[wuku] || 'from-slate-600 to-slate-800';

                return (
                  <button
                    key={date.toISOString()}
                    type="button"
                    onClick={() => {
                      setSelectedDate(date);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className={`relative rounded-xl p-2 text-center transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? `bg-gradient-to-br ${color} ring-4 ring-indigo-400 ring-offset-2 ring-offset-slate-900 shadow-xl scale-105 z-10`
                        : isToday
                        ? 'bg-indigo-600/30 border-2 border-indigo-400 hover:bg-indigo-600/50'
                        : 'bg-slate-800/40 border border-slate-700/60 hover:bg-slate-700/60 hover:border-slate-500'
                    }`}
                    title={`${date.toLocaleDateString('id-ID')} — Wuku ${wuku} (Hari ke-${dayInWuku})`}
                  >
                    <p className={`text-sm font-extrabold ${isSelected || isToday ? 'text-white' : 'text-slate-200'}`}>
                      {date.getDate()}
                    </p>
                    <p className={`text-[10px] leading-tight truncate mt-0.5 ${isSelected ? 'text-white font-bold' : 'text-slate-400'}`}>
                      {wuku}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* All Wuku Legend */}
        <section className="bg-slate-900 rounded-2xl border border-slate-700 p-6 shadow-xl">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-indigo-400" /> 30 Wuku dalam Siklus Pawukon (Rotasi Mulai Minggu)
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {[
              'Sinta','Landep','Wukir','Kulantir','Tolu','Gumbreg','Warigalit','Warigagung','Julungwangi','Sungsang','Galungan','Kuningan','Langkir','Mandasiya','Julungpujud','Pahang','Kuruwelut','Marakeh','Tambir','Madangkungan','Maktal','Wuye','Manahil','Prangbakat','Bala','Wugu','Wayang','Kulawu','Dukut','Watugunung'
            ].map((w, i) => (
              <div
                key={w}
                className={`rounded-xl px-3 py-2 text-center border transition-all ${
                  w === activeWuku
                    ? `bg-gradient-to-br ${WUKU_COLORS[w] || ''} border-white text-white font-bold shadow-md`
                    : 'bg-slate-800/50 border-slate-700 text-slate-300'
                }`}
              >
                <p className="text-xs">{i + 1}. {w}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
