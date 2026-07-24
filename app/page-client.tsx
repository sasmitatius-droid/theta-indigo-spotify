'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Sparkles, ArrowRight, Star, Moon, Sun, Loader2, Menu, X } from 'lucide-react';
import Link from 'next/link';
import { BlogNav } from '@/components/blog-nav';
import { LandingBlogCategories } from '@/components/landing-blog-categories';

const YoutubeIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

const ApplePodcastIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M5.34 0A5.328 5.328 0 0 0 0 5.34v13.32A5.328 5.328 0 0 0 5.34 24h13.32A5.328 5.328 0 0 0 24 18.66V5.34A5.328 5.328 0 0 0 18.66 0zm7.931 4.602a5.64 5.64 0 0 1 4.007 1.657 5.64 5.64 0 0 1 1.657 4.007 5.64 5.64 0 0 1-1.657 4.007 5.64 5.64 0 0 1-4.007 1.657 5.64 5.64 0 0 1-4.007-1.657 5.64 5.64 0 0 1-1.657-4.007 5.64 5.64 0 0 1 1.657-4.007 5.64 5.64 0 0 1 4.007-1.657zm.002 1.428a4.21 4.21 0 0 0-2.987 1.237 4.21 4.21 0 0 0-1.237 2.987 4.21 4.21 0 0 0 1.237 2.987 4.21 4.21 0 0 0 2.987 1.237 4.21 4.21 0 0 0 2.987-1.237 4.21 4.21 0 0 0 1.237-2.987 4.21 4.21 0 0 0-1.237-2.987 4.21 4.21 0 0 0-2.987-1.237zm.016 1.693c.7 0 1.273.573 1.273 1.273 0 .7-.573 1.273-1.273 1.273-.7 0-1.273-.573-1.273-1.273 0-.7.573-1.273 1.273-1.273zm-.016 3.042c.867 0 1.63.407 2.12 1.038l-2.12 4.66-2.12-4.66c.49-.631 1.253-1.038 2.12-1.038zM12 15.09c.555 0 1.09.124 1.57.345l-.867 1.906H11.3L10.43 15.435c.48-.22 1.015-.344 1.57-.344z"/>
  </svg>
);

const AmazonIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M13.958 10.09c0 1.232.029 2.256-.591 3.351-.502.891-1.301 1.438-2.186 1.438-1.214 0-1.922-.924-1.922-2.292 0-2.692 2.415-3.182 4.699-3.182v.685zm3.186 7.705c-.209.189-.512.201-.745.076-1.051-.872-1.238-1.276-1.814-2.106-1.733 1.769-2.96 2.299-5.208 2.299-2.658 0-4.726-1.641-4.726-4.925 0-2.565 1.391-4.309 3.37-5.164 1.715-.756 4.11-.891 5.942-1.099v-.41c0-.753.06-1.642-.384-2.294-.385-.577-1.124-.815-1.775-.815-1.205 0-2.277.618-2.54 1.897-.054.285-.261.567-.547.581l-3.065-.333c-.259-.056-.548-.267-.473-.663.704-3.716 4.06-4.838 7.066-4.838 1.537 0 3.547.41 4.758 1.574 1.538 1.436 1.392 3.352 1.392 5.441v4.927c0 1.482.614 2.132 1.192 2.931.204.287.249.632-.011.846-.647.54-1.794 1.537-2.424 2.099l-.009-.009zM20.24 18.75c-2.021 1.49-4.952 2.284-7.475 2.284-3.541 0-6.729-1.31-9.138-3.49-.19-.173-.021-.41.208-.276 2.6 1.513 5.814 2.422 9.131 2.422 2.239 0 4.699-.465 6.963-1.429.342-.145.628.224.311.489zm.887-1.009c-.26-.333-1.722-.157-2.376-.079-.199.024-.229-.15-.051-.277.164-.115.432-.302.617-.418.299-.192.499-.501.732-.762.258-.291.488-.6.69-.927.291-.464.425-.993.425-1.541 0-.713-.318-1.379-.845-1.845-.428-.377-.993-.572-1.58-.572-.643 0-1.266.219-1.762.627-.497.407-.817 1.009-.893 1.649-.034.285-.032.574.01.859.048.318.156.607.319.876l.271.451-.352.026c-.473.035-.929.169-1.345.396-.549.3-.977.767-1.214 1.333-.235.563-.269 1.195-.095 1.78.224.757.791 1.371 1.525 1.656.432.168.896.239 1.358.207z"/>
  </svg>
);

const SpotifyIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.899 4.62-1.02 8.52-.6 11.64 1.32.36.18.48.66.301 1.019zm1.441-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141 C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.242 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.18-1.2-.18-1.38-.72-.18-.6.18-1.2.72-1.38 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
  </svg>
);

export default function LandingPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [recentBlogs, setRecentBlogs] = useState<any[]>([]);
  const [blogsLoading, setBlogsLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [podcastDropdownOpen, setPodcastDropdownOpen] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    const fetchRecentBlogs = async () => {
      try {
        const res = await fetch('/api/blogs');
        if (!res.ok) throw new Error('API request failed');
        const items = await res.json();
        setRecentBlogs(items.slice(0, 3));
      } catch (err) {
        console.error('Error fetching recent blogs:', err);
      } finally {
        setBlogsLoading(false);
      }
    };

    fetchRecentBlogs();
  }, []);

  return (
    <div className="min-h-screen">
      <header className="fixed top-0 left-0 right-0 z-50 px-4 py-4 max-w-6xl mx-auto w-full">
        <div className="flex items-center justify-between bg-white/90 backdrop-blur-md px-4 py-3 rounded-2xl border border-gray-200 shadow-sm">
          <Link href="/" className="flex items-center gap-2.5">
            <img src="/logo.png" alt="Theta Indigo Blueprint" className="h-8 w-auto object-contain" />
            <span className="font-bold text-black text-base md:text-lg tracking-tight">Theta Indigo</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-5 text-sm font-medium text-black">
            <BlogNav className="text-black hover:text-indigo-700" />
            <Link href="/kalender" className="hover:text-indigo-700 font-semibold flex items-center gap-1">
              🗓️ Kalender Wuku
            </Link>
            <Link href="/dashboard" className="hover:text-indigo-700">
              Analisis
            </Link>
            <a
              href="https://open.spotify.com/show/033TVuqCIEE58bjay32pzm"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-700 border border-emerald-500/30 hover:bg-emerald-600 hover:text-white font-bold transition-all text-xs"
            >
              <SpotifyIcon className="w-4 h-4 text-emerald-600 group-hover:text-white" />
              Podcast Spotify
            </a>
            <Link href="/auth" className="hover:text-indigo-700">
              Masuk
            </Link>
          </nav>

          {/* Hamburger Button for Mobile */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-black hover:bg-gray-100 transition-colors focus:outline-none"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden mt-2 bg-white rounded-2xl border border-gray-200 p-4 shadow-xl flex flex-col gap-3 text-sm font-medium text-slate-900"
          >
            <div className="py-2 border-b border-gray-100" onClick={() => setMobileMenuOpen(false)}>
              <BlogNav className="text-slate-900 font-semibold" />
            </div>
            <Link
              href="/kalender"
              className="py-2 text-slate-900 hover:text-indigo-600 font-semibold flex items-center gap-2 border-b border-gray-100"
              onClick={() => setMobileMenuOpen(false)}
            >
              🗓️ Kalender Wuku &amp; Weton
            </Link>
            <a
              href="https://open.spotify.com/show/033TVuqCIEE58bjay32pzm"
              target="_blank"
              rel="noopener noreferrer"
              className="py-2 text-emerald-600 hover:text-emerald-700 font-bold border-b border-gray-100 flex items-center gap-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              <SpotifyIcon className="w-5 h-5 text-emerald-600" />
              🎙️ Dengarkan Podcast di Spotify
            </a>
            <Link
              href="/dashboard"
              className="py-2 text-slate-900 hover:text-indigo-600 font-semibold border-b border-gray-100"
              onClick={() => setMobileMenuOpen(false)}
            >
              🔮 Ruang Analisis Spiritual
            </Link>
            <Link
              href="/dashboard?tab=premium"
              className="py-2 text-amber-600 hover:text-amber-700 font-bold border-b border-gray-100"
              onClick={() => setMobileMenuOpen(false)}
            >
              ✨ Beli Paket Premium
            </Link>
            <Link
              href="/auth"
              className="py-2.5 text-center bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors mt-1"
              onClick={() => setMobileMenuOpen(false)}
            >
              Masuk / Daftar
            </Link>
          </motion.div>
        )}
      </header>


      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">

        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
              className="w-24 h-24 mx-auto mb-8 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center shadow-2xl shadow-indigo-500/50"
            >
              <Sparkles className="w-12 h-12 text-white" />
            </motion.div>
            
            <h1 className="font-heading text-6xl md:text-8xl font-bold mb-6 bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Theta Indigo 
            </h1>
            
            <p className="text-xl md:text-2xl text-indigo-400 font-medium mb-8 max-w-3xl mx-auto leading-relaxed">
              Temukan esensi spiritual Anda melalui numerologi bertenaga AI, analisis chakra, dan wawasan energi
            </p>

            <div className="flex flex-col sm:flex-row flex-wrap gap-4 justify-center items-center">
              <Link href="/auth">
                <Button variant="glow" size="lg" className="text-lg px-8 py-6">
                  Mulai Perjalanan Anda
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <a
                href="https://open.spotify.com/show/033TVuqCIEE58bjay32pzm"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button
                  size="lg"
                  className="text-lg px-8 py-6 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-900/40 border-none flex items-center gap-3 transition-all hover:scale-105"
                >
                  <SpotifyIcon className="w-6 h-6 text-white" />
                  Dengarkan Podcast Spotify
                </Button>
              </a>
              <Link href="/dashboard?tab=premium">
                <Button variant="outline" size="lg" className="text-lg px-8 py-6 border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-indigo-900 transition-colors">
                  Beli Paket Premium
                </Button>
              </Link>
              <Link href="/demo">
                <Button variant="outline" size="lg" className="text-lg px-8 py-6">
                  Coba Demo
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>

        {isMounted && (
          <>
            {/* Floating particles */}
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-indigo-400 rounded-full opacity-30"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{
                  y: [0, -100, 0],
                  opacity: [0.3, 0.8, 0.3],
                }}
                transition={{
                  duration: 3 + Math.random() * 2,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                }}
              />
            ))}

            {/* Shooting stars animation */}
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={`star-${i}`}
                className="absolute h-px bg-gradient-to-r from-transparent via-indigo-300 to-transparent shadow-[0_0_8px_2px_rgba(165,180,252,0.8)]"
                style={{
                  width: `${100 + Math.random() * 150}px`,
                  top: `${Math.random() * 40}%`,
                  left: `${40 + Math.random() * 60}%`,
                  rotate: '-45deg',
                }}
                animate={{
                  x: [0, -1500],
                  y: [0, 1500],
                  opacity: [0, 1, 0],
                }}
                transition={{
                  duration: 1.5 + Math.random() * 2,
                  repeat: Infinity,
                  delay: Math.random() * 6,
                  ease: "linear",
                }}
              />
            ))}
          </>
        )}
      </section>

      {/* Features Section */}
      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16 space-y-4"
          >
            <span className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700 border border-indigo-200">
              Integrasi Kebijaksanaan Jawa & AI Modern
            </span>
            <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Buka Kode Jiwa & Energi Hidup Anda
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-base">
              Theta Indigo Blueprint menggabungkan 10 sistem pemetaan jiwa terbaik dunia dalam satu analisis terpadu yang presisi dan reflektif.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              {
                icon: <Sparkles className="w-7 h-7 text-amber-500" />,
                title: 'Pranata Mangsa Jawa',
                description: '12 Musim Batin tradisional Jawa untuk membaca energi iklim kelahiran & metode pemulihan stamina jiwa.',
              },
              {
                icon: <Star className="w-7 h-7 text-indigo-600" />,
                title: 'Weton & Wuku Jawa',
                description: 'Hitung Neptu, Pasaran, dan 30 Wuku Pawukon untuk mengetahui pola karakter & pelajaran karma hidup.',
              },
              {
                icon: <Moon className="w-7 h-7 text-purple-600" />,
                title: 'Bazi Four Pillars',
                description: 'Pemetaan 5 Elemen Kosmis (Wood, Fire, Earth, Metal, Water) & Day Master untuk arah karier dan relasi.',
              },
              {
                icon: <Sun className="w-7 h-7 text-pink-600" />,
                title: 'Human Design & Aura',
                description: 'Sistem BodyGraph 9 Centers, Otoritas keputusan, Profil energi, serta analisis 7 Chakra & Spektrum Aura.',
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
                className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-indigo-300 hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="p-3 w-fit rounded-xl bg-indigo-50 mb-4">{feature.icon}</div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Showcase 5-Lapisan Waktu Jiwa */}
      <section className="py-20 px-4 bg-slate-900 text-white relative overflow-hidden">
        <div className="max-w-6xl mx-auto relative z-10 space-y-12">
          <div className="text-center space-y-4">
            <span className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Inovasi Metode Sintesis AI
            </span>
            <h2 className="text-3xl md:text-5xl font-extrabold bg-gradient-to-r from-white via-indigo-200 to-purple-200 bg-clip-text text-transparent">
              Sintesis 5-Lapisan Waktu Jiwa
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto text-sm md:text-base">
              Setiap manusia dipengaruhi oleh 5 siklus waktu kosmis. AI kami menyatukannya secara holistik:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {[
              { step: '01', title: 'Weton Jawa', subtitle: 'Identitas Harian', desc: 'Respons spontan & Neptu' },
              { step: '02', title: 'Wuku Jawa', subtitle: 'Siklus 210 Hari', desc: 'Tema pelajaran jiwa' },
              { step: '03', title: 'Pranata Mangsa', subtitle: 'Iklim Musim Lahir', desc: 'Energi pemulihan batin' },
              { step: '04', title: 'Bazi Four Pillars', subtitle: 'Struktur Kosmis', desc: '5 Elemen & Day Master' },
              { step: '05', title: 'Human Design', subtitle: 'Mekanisme Tubuh', desc: 'Otoritas & BodyGraph' },
            ].map((layer, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="bg-slate-950/80 border border-indigo-500/20 rounded-2xl p-5 text-center space-y-2 hover:border-indigo-400/50 transition-all shadow-lg"
              >
                <div className="text-xs font-mono font-bold text-indigo-400">{layer.step}</div>
                <h4 className="font-bold text-white text-base">{layer.title}</h4>
                <div className="text-xs font-semibold text-indigo-300">{layer.subtitle}</div>
                <p className="text-slate-400 text-xs">{layer.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pratinjau PDF 16-Bab */}
      <section className="py-24 px-4 bg-gradient-to-b from-slate-950 to-indigo-950 text-white relative">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Laporan Lengkap 16-Bab
            </span>
            <h2 className="text-3xl md:text-5xl font-extrabold leading-tight text-white">
              Laporan &quot;Personal Soul Blueprint&quot; Siap Unduh
            </h2>
            <p className="text-slate-300 leading-relaxed text-sm md:text-base">
              Setiap analisis menghasilkan dokumen PDF profesional dengan **Header ID Blueprint Unik (`TIB-YYYYMMDD-XXXX`)**, ringkasan eksekutif, peta chakra, serta **Roadmap Pertumbuhan 12 Bulan**.
            </p>
            <ul className="space-y-3 text-sm text-slate-300">
              {['Format PDF 16-Bab Terstruktur & Siap Cetak', 'ID Blueprint Unik & Header Metadata Resmi', 'Rekomendasi Pemulihan Energi Musim Mangsa', 'Afirmasi Harian & Linimasa Pertumbuhan Jiwa'].map((item, i) => (
                <li key={i} className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <div className="pt-4">
              <Link href="/dashboard">
                <Button size="lg" className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-8 rounded-xl shadow-lg shadow-indigo-900/40">
                  Coba Analisis Blueprint Sekarang <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
          </div>

          <div className="bg-slate-900 border border-indigo-500/30 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <img src="/logo.png" alt="Theta Indigo" className="h-8 w-auto object-contain" />
                <div>
                  <h4 className="font-bold text-sm text-white">Theta Indigo Blueprint</h4>
                  <p className="text-xs text-indigo-400 font-mono">ID: TIB-20260720-9482</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                16 Bab PDF
              </span>
            </div>

            <div className="space-y-3 text-xs text-slate-300 bg-slate-950/70 p-4 rounded-xl border border-slate-800">
              <div className="flex justify-between border-b border-slate-800/60 pb-2">
                <span className="text-slate-400">Naungan Mangsa</span>
                <span className="font-semibold text-amber-300">Mangsa Kapitu (Air)</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/60 pb-2">
                <span className="text-slate-400">Weton & Neptu</span>
                <span className="font-semibold text-indigo-300">Jumat Kliwon (Neptu 14)</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/60 pb-2">
                <span className="text-slate-400">Human Design</span>
                <span className="font-semibold text-purple-300">Generator (Emotional 4/6)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Pemulihan Energi</span>
                <span className="font-semibold text-emerald-300">Silence Retreat & Meditasi Air</span>
              </div>
            </div>

            <div className="text-center pt-2">
              <span className="text-xs text-slate-400 italic">&ldquo;Sintesis 5-Lapisan Waktu Jiwa Terpadu dengan AI&rdquo;</span>
            </div>
          </div>
        </div>
      </section>

      {/* Artikel Spiritual Terbaru Section */}
      <section className="py-24 px-4 bg-slate-50/50 border-y border-gray-100">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-indigo-650 to-purple-650 bg-indigo-600 bg-clip-text text-transparent"
            >
              Artikel Spiritual Terbaru
            </motion.h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Telusuri wawasan mistis, numerologi, dan panduan energi untuk membimbing transformasi jiwa Anda.
            </p>
          </div>

          <div className="mb-10">
            <LandingBlogCategories />
          </div>

          {blogsLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            </div>
          ) : recentBlogs.length === 0 ? (
            <p className="text-center text-gray-500 py-12 bg-white rounded-2xl border border-gray-100 shadow-sm">
              Belum ada artikel spiritual yang dipublikasikan.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {recentBlogs.map((blog, idx) => (
                <motion.div
                  key={blog.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1, duration: 0.5 }}
                  className="group bg-white border border-gray-200 rounded-2xl overflow-hidden hover:border-indigo-300 hover:shadow-xl transition-all duration-300 flex flex-col"
                >
                  <div className="aspect-[1200/630] overflow-hidden bg-gray-50 relative border-b border-gray-100">
                    <img
                      src={`/api/admin/generate-image?title=${encodeURIComponent(
                        blog.title
                      )}&description=${encodeURIComponent(
                        blog.excerpt
                      )}&icon=${encodeURIComponent(blog.icon)}&bg=${blog.bg}`}
                      alt={blog.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-6 flex flex-col flex-1">
                    <div className="flex items-center gap-3 mb-3 text-xs">
                      <span className="px-2.5 py-0.5 rounded-full font-semibold bg-indigo-50 text-indigo-600">
                        {blog.category}
                      </span>
                      {blog.createdAt && (
                        <span className="text-gray-500">
                          {new Date(blog.createdAt).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                      <Link href={`/blog/${blog.id}`}>{blog.title}</Link>
                    </h3>
                    <p className="text-gray-600 text-sm line-clamp-3 mb-6 flex-1">
                      {blog.excerpt || 'Klik untuk membaca wawasan spiritual mendalam dari artikel ini.'}
                    </p>
                    <Link
                      href={`/blog/${blog.id}`}
                      className="inline-flex items-center text-sm font-semibold text-indigo-650 hover:text-indigo-800 gap-1 mt-auto"
                    >
                      Baca Selengkapnya
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <Link href="/blog">
              <Button
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 py-6 rounded-xl shadow-lg shadow-indigo-150 hover:shadow-xl transition-all border-none"
              >
                Lihat Semua Artikel
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Spotify & Multi-Language Podcast Showcase Section */}
      <section className="py-16 px-4 bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 text-white relative overflow-hidden">
        <div className="max-w-5xl mx-auto relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 p-8 md:p-12 rounded-3xl border border-emerald-500/30 bg-slate-950/60 backdrop-blur-xl shadow-2xl">
          <div className="space-y-4 text-center md:text-left max-w-2xl">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <SpotifyIcon className="w-4 h-4 text-emerald-400" />
              Podcast Audio Otomatis (Bahasa Indonesia &amp; English)
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white">
              Dengarkan Theta Indigo Podcast 🎙️
            </h2>
            <p className="text-slate-300 text-sm md:text-base leading-relaxed">
              Dapatkan wawasan harian seputar Numerologi, Human Design, Wuku &amp; Weton Jawa, Bazi, serta tips spiritual jiwa dalam format audio jernih. Dengarkan melalui Spotify atau berlangganan RSS feed resmi kami di <span className="font-semibold text-emerald-300">www.indigoblueprint.my.id</span>!
            </p>
            <div className="flex flex-wrap gap-3 pt-2 justify-center md:justify-start text-xs font-semibold">
              <a
                href="/podcast-rss-id.xml"
                target="_blank"
                className="px-3 py-1.5 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/30 transition-colors flex items-center gap-1.5"
              >
                📡 RSS Podcast Indonesia
              </a>
              <a
                href="/podcast-rss-en.xml"
                target="_blank"
                className="px-3 py-1.5 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30 transition-colors flex items-center gap-1.5"
              >
                🌐 RSS Podcast English
              </a>
            </div>
          </div>
          <div className="shrink-0 flex flex-col gap-3 w-full sm:w-auto">
            <a
              href="https://open.spotify.com/show/033TVuqCIEE58bjay32pzm"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full"
            >
              <Button
                size="lg"
                className="w-full text-sm md:text-base px-6 py-5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold rounded-2xl shadow-xl shadow-emerald-950/60 flex items-center justify-center gap-2.5 transition-all hover:scale-105 border-none"
              >
                <SpotifyIcon className="w-5 h-5 text-slate-950" />
                Podcast Spotify (ID)
                <ArrowRight className="w-4 h-4" />
              </Button>
            </a>
            <a
              href="https://open.spotify.com/show/033TVuqCIEE58bjay32pzm"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full"
            >
              <Button
                size="lg"
                variant="outline"
                className="w-full text-sm md:text-base px-6 py-5 border-emerald-500/50 text-emerald-300 hover:bg-emerald-500/20 font-bold rounded-2xl flex items-center justify-center gap-2.5 transition-all hover:scale-105"
              >
                <SpotifyIcon className="w-5 h-5 text-emerald-400" />
                Podcast Spotify (EN)
                <ArrowRight className="w-4 h-4" />
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="bg-white rounded-3xl p-12 border border-gray-200 shadow-xl"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Siap untuk Menemukan Jati Diri Anda?
            </h2>
            <p className="text-gray-600 mb-8 text-lg">
            Bergabunglah dengan ribuan pencari yang telah membuka cetak biru spiritual mereka
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/dashboard?tab=premium">
                <Button variant="glow" size="lg" className="text-lg px-8 py-6">
                Mulai Berlangganan Sekarang
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <a
                href="https://open.spotify.com/show/033TVuqCIEE58bjay32pzm"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button
                  variant="outline"
                  size="lg"
                  className="text-lg px-8 py-6 border-emerald-500 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-colors flex items-center gap-2 font-bold"
                >
                  <SpotifyIcon className="w-5 h-5" />
                  Dengarkan Podcast
                </Button>
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      <footer className="border-t border-gray-200 bg-white/80 px-4 py-10">
        <div className="max-w-6xl mx-auto">
          {/* Top row */}
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between text-sm text-black mb-8">
            <div className="max-w-sm">
              <p className="font-bold text-black text-base mb-1">Theta Indigo Blueprint</p>
              <p className="text-gray-600 text-xs leading-relaxed">Platform analisis spiritual AI: Numerologi, Human Design, Weton & Wuku Jawa, Bazi, dan lebih banyak lagi.</p>
              {/* YouTube channel link */}
              <a
                href="https://www.youtube.com/@thetaindigo"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-3 px-3 py-1.5 rounded-full bg-red-50 text-red-600 border border-red-200 hover:bg-red-600 hover:text-white font-semibold text-xs transition-all"
              >
                <YoutubeIcon className="w-4 h-4" />
                Theta Indigo YouTube
              </a>
            </div>
            <div className="flex flex-wrap gap-5 text-black items-start">
              <div className="flex flex-col gap-2">
                <span className="font-bold text-xs uppercase text-gray-400 tracking-wider">Navigasi</span>
                <BlogNav className="hover:text-indigo-700" />
                <Link href="/auth" className="hover:text-indigo-700 transition-colors">Masuk / Daftar</Link>
                <Link href="/dashboard?tab=premium" className="hover:text-indigo-700 transition-colors text-amber-700 font-semibold">✨ Info Paket Premium</Link>
              </div>
              <div className="flex flex-col gap-2">
                <span className="font-bold text-xs uppercase text-gray-400 tracking-wider">YouTube</span>
                <a href="https://www.youtube.com/@thetaindigo" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-red-600 hover:text-red-700 font-semibold transition-colors">
                  <YoutubeIcon className="w-4 h-4" />
                  Channel Utama
                </a>
                <a href="https://youtube.com/playlist?list=PLQCtyQ3JEtlk&si=8wKR1xbfVSVUH033" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-red-500 hover:text-red-600 transition-colors">
                  <YoutubeIcon className="w-4 h-4" />
                  Playlist (ID)
                </a>
                <a href="https://youtube.com/playlist?list=PLD1_q4cvPJlo&si=2QR1ZQqMs0yHyebb" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-red-500 hover:text-red-600 transition-colors">
                  <YoutubeIcon className="w-4 h-4" />
                  Playlist (EN)
                </a>
              </div>
              {/* Podcast Dropdown Column */}
              <div className="flex flex-col gap-2 relative">
                <span className="font-bold text-xs uppercase text-gray-400 tracking-wider">Podcast</span>
                <button
                  id="podcast-dropdown-btn"
                  type="button"
                  onClick={() => setPodcastDropdownOpen(!podcastDropdownOpen)}
                  className="flex items-center gap-1.5 text-emerald-700 hover:text-emerald-800 font-bold transition-colors focus:outline-none"
                >
                  <SpotifyIcon className="w-4 h-4 text-emerald-600" />
                  🎙️ Podcast Platform
                  <span className="ml-1 text-gray-400">{podcastDropdownOpen ? '▲' : '▼'}</span>
                </button>
                {podcastDropdownOpen && (
                  <div
                    id="podcast-dropdown-menu"
                    className="absolute bottom-full left-0 mb-2 w-72 bg-white border border-gray-200 rounded-2xl shadow-2xl p-3 z-50 flex flex-col gap-1"
                  >
                    <div className="px-2 py-1 text-[10px] font-bold uppercase text-gray-400 tracking-wider border-b border-gray-100 mb-1">Spotify</div>
                    <a href="https://open.spotify.com/show/033TVuqCIEE58bjay32pzm" target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-emerald-50 text-sm font-medium text-gray-800 hover:text-emerald-700 transition-colors">
                      <SpotifyIcon className="w-4 h-4 text-emerald-500 shrink-0" />
                      Spotify (ID & EN)
                    </a>
                    <div className="px-2 py-1 text-[10px] font-bold uppercase text-gray-400 tracking-wider border-b border-gray-100 mb-1 mt-1">Apple Podcasts</div>
                    <a href="https://podcasts.apple.com/us/podcast/theta-indigo-podcast-bahasa-indonesia/id6794168863" target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-purple-50 text-sm font-medium text-gray-800 hover:text-purple-700 transition-colors">
                      <ApplePodcastIcon className="w-4 h-4 text-purple-500 shrink-0" />
                      Apple Podcasts (Bahasa Indonesia)
                    </a>
                    <a href="https://podcasts.apple.com/us/podcast/theta-indigo-podcast-english-edition/id6794184827" target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-purple-50 text-sm font-medium text-gray-800 hover:text-purple-700 transition-colors">
                      <ApplePodcastIcon className="w-4 h-4 text-purple-500 shrink-0" />
                      Apple Podcasts (English)
                    </a>
                    <div className="px-2 py-1 text-[10px] font-bold uppercase text-gray-400 tracking-wider border-b border-gray-100 mb-1 mt-1">Amazon Music</div>
                    <a href="https://podcasters.amazon.com/podcasts/9e43cfc2-4570-4221-9480-69f89d88672e" target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-blue-50 text-sm font-medium text-gray-800 hover:text-blue-700 transition-colors">
                      <AmazonIcon className="w-4 h-4 text-blue-500 shrink-0" />
                      Amazon Podcasters
                    </a>
                    <a href="https://music.amazon.com/podcasts/9e43cfc2-4570-4221-9480-69f89d88672e" target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-blue-50 text-sm font-medium text-gray-800 hover:text-blue-700 transition-colors">
                      <AmazonIcon className="w-4 h-4 text-blue-500 shrink-0" />
                      Amazon Music Podcasts
                    </a>
                    <div className="px-2 py-1 text-[10px] font-bold uppercase text-gray-400 tracking-wider border-b border-gray-100 mb-1 mt-1">YouTube Podcast</div>
                    <a href="https://youtube.com/playlist?list=PLQCtyQ3JEtlk&si=8wKR1xbfVSVUH033" target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-red-50 text-sm font-medium text-gray-800 hover:text-red-700 transition-colors">
                      <YoutubeIcon className="w-4 h-4 text-red-500 shrink-0" />
                      YouTube Podcast (Indonesia)
                    </a>
                    <a href="https://youtube.com/playlist?list=PLD1_q4cvPJlo&si=2QR1ZQqMs0yHyebb" target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-red-50 text-sm font-medium text-gray-800 hover:text-red-700 transition-colors">
                      <YoutubeIcon className="w-4 h-4 text-red-500 shrink-0" />
                      YouTube Podcast (English)
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* Bottom bar */}
          <div className="border-t border-gray-100 pt-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
            <span>© {new Date().getFullYear()} Theta Indigo Blueprint. All rights reserved.</span>
            <div className="flex gap-4">
              <Link href="/terms" className="hover:text-indigo-700 transition-colors">Ketentuan Berlaku</Link>
              <Link href="/privacy" className="hover:text-indigo-700 transition-colors">Privasi</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
