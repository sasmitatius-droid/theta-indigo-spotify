'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, BookOpen, Calendar, Loader2, Search, Sparkles, ArrowRight, Mic } from 'lucide-react';
import { motion } from 'framer-motion';
// Removed Firestore imports
import { DEFAULT_BLOG_CATEGORY, formatBlogDateTime, slugifyCategory } from '@/lib/blog-utils';

// Types for Speech Recognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

type BlogPost = {
  id: string;
  title: string;
  content: string;
  excerpt?: string;
  category: string;
  icon?: string;
  bg?: string;
  createdAt?: string;
};

function BlogListContent() {
  const searchParams = useSearchParams();
  const kategoriSlug = searchParams.get('kategori');
  const tagParam = searchParams.get('tag');
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (!('SpeechRecognition' in window) && !('webkitSpeechRecognition' in window)) {
        setSpeechSupported(false);
      }
    }
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [kategoriSlug, tagParam, searchQuery]);

  const handleVoiceSearch = () => {
    if (!speechSupported) return;
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'id-ID';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const speechResult = event.results[0][0].transcript;
      setSearchQuery(speechResult);
      setIsListening(false);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  useEffect(() => {
    fetch('/api/blogs')
      .then((res) => {
        if (!res.ok) throw new Error('Gagal mengambil artikel');
        return res.json();
      })
      .then((items) => {
        setBlogs(items);
      })
      .catch((err) => console.error('Error fetching blogs:', err))
      .finally(() => setLoading(false));
  }, []);

  // Compute categories and their article counts dynamically
  const categoriesList = useMemo(() => {
    const counts = new Map<string, number>();
    blogs.forEach((b) => {
      if (!b.category) return; // skip entri tanpa kategori
      counts.set(b.category, (counts.get(b.category) || 0) + 1);
    });
    return [...counts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '', 'id'));
  }, [blogs]);

  // Filter based on category, tag, and search query
  const filtered = useMemo(() => {
    return blogs.filter((b) => {
      const matchCat = !kategoriSlug || slugifyCategory(b.category ?? '') === kategoriSlug;
      const matchTag = !tagParam || (Array.isArray((b as any).tags) && (b as any).tags.some((t: string) => (t ?? '').toLowerCase() === (tagParam ?? '').toLowerCase()));
      const matchSearch =
        !searchQuery.trim() ||
        (b.title ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (b.content ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (b.category ?? '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchTag && matchSearch;
    });
  }, [blogs, kategoriSlug, tagParam, searchQuery]);


  // Featured Post: Show absolute latest post when there is no filter/search active
  const { featuredPost, gridPosts } = useMemo(() => {
    if (filtered.length === 0) return { featuredPost: null, gridPosts: [] };
    
    // If user is searching or viewing a specific category, don't separate a featured post
    if (kategoriSlug || searchQuery.trim()) {
      return { featuredPost: null, gridPosts: filtered };
    }

    return {
      featuredPost: filtered[0],
      gridPosts: filtered.slice(1),
    };
  }, [filtered, kategoriSlug, searchQuery]);

  return (
    <main className="min-h-screen bg-slate-950 text-white pb-24 selection:bg-indigo-500 selection:text-white">
      {/* Mystical Hero Header */}
      <section className="relative overflow-hidden bg-slate-900 border-b border-indigo-500/10 py-16 md:py-24 px-4">
        {/* Glow Effects */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none" />
        <div className="absolute top-0 right-10 w-[300px] h-[300px] rounded-full bg-purple-600/10 blur-[80px] pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative z-10 space-y-6">
          <Link
            href="/"
            className="inline-flex items-center text-sm text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali ke Landing Page
          </Link>
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-950/40 text-indigo-300 text-xs font-semibold"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Jendela Wawasan & Kebijaksanaan
          </motion.div>
          <h1 className="text-4xl md:text-6xl font-extrabold bg-gradient-to-r from-white via-indigo-250 to-purple-250 bg-indigo-250 bg-clip-text text-transparent leading-tight">
            Lentera Spiritual Theta Indigo
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto text-sm md:text-base leading-relaxed">
            Temukan rahasia numerologi Anda, getaran chakra, wawasan aura, dan artikel bertenaga AI untuk menuntun pertumbuhan batin Anda.
          </p>

          {/* Search bar */}
          <div className="max-w-md mx-auto pt-4 relative">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="text"
                placeholder="Cari artikel spiritual..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-full pl-11 pr-12 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm shadow-inner"
              />
              {speechSupported && (
                <button
                  type="button"
                  onClick={handleVoiceSearch}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full transition-colors ${
                    isListening 
                      ? 'bg-red-500/20 text-red-400 animate-pulse' 
                      : 'text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10'
                  }`}
                  title="Pencarian Suara"
                >
                  <Mic className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="max-w-6xl mx-auto px-4 mt-12 space-y-12">
        {/* Category Pill Filters */}
        <div className="flex flex-wrap items-center justify-center gap-2 py-4 border-b border-slate-900">
          <Link
            href="/blog"
            className={`px-4 py-2 rounded-full text-xs font-semibold border transition-all duration-300 ${
              !kategoriSlug
                ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-950'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Semua Topik
          </Link>
          {categoriesList.map((cat) => {
            const isSelected = slugifyCategory(cat.name) === kategoriSlug;
            return (
              <Link
                key={cat.name}
                href={`/blog?kategori=${slugifyCategory(cat.name)}`}
                className={`px-4 py-2 rounded-full text-xs font-semibold border transition-all duration-300 flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-950'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <span>{cat.name}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                    isSelected ? 'bg-indigo-500 text-white' : 'bg-slate-950 text-slate-550'
                  }`}
                >
                  {cat.count}
                </span>
              </Link>
            );
          })}
        </div>

        {/* Loading Spinner */}
        {loading && (
          <div className="text-center py-20">
            <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mx-auto mb-4" />
            <p className="text-slate-400 font-medium">Menyelaraskan wawasan spiritual...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-20 bg-slate-900/20 border border-slate-900 rounded-3xl p-8 max-w-xl mx-auto">
            <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Tidak Ada Artikel Ditemukan</h3>
            <p className="text-slate-400 text-sm">
              Kami tidak dapat menemukan artikel spiritual yang cocok dengan pencarian Anda. Coba topik atau kata kunci lainnya.
            </p>
          </div>
        )}

        {/* Featured Post (Highlight) */}
        {!loading && featuredPost && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="group bg-slate-900/30 border border-slate-900 hover:border-indigo-500/20 rounded-3xl overflow-hidden shadow-xl hover:shadow-indigo-950/10 transition-all duration-300"
          >
            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="aspect-[1200/630] md:aspect-auto overflow-hidden bg-slate-950 relative border-b md:border-b-0 md:border-r border-slate-800">
                <img
                  src={`/api/admin/generate-image?title=${encodeURIComponent(
                    featuredPost.title
                  )}&description=${encodeURIComponent(
                    featuredPost.excerpt || featuredPost.title
                  )}&icon=${encodeURIComponent(featuredPost.icon || '📖')}&bg=${featuredPost.bg || '2'}`}
                  alt={featuredPost.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                />
              </div>
              <div className="p-8 md:p-12 flex flex-col justify-center space-y-4">
                <div className="flex items-center gap-3 text-xs">
                  <span className="px-3 py-1 rounded-full font-semibold bg-indigo-500/10 text-indigo-400">
                    {featuredPost.category}
                  </span>
                  {featuredPost.createdAt && (
                    <span className="text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatBlogDateTime(featuredPost.createdAt)}
                    </span>
                  )}
                </div>
                <h2 className="text-2xl md:text-4xl font-extrabold text-white group-hover:text-indigo-400 transition-colors leading-tight">
                  <Link href={`/blog/${featuredPost.id}`}>{featuredPost.title}</Link>
                </h2>
                <p className="text-slate-400 text-sm md:text-base leading-relaxed line-clamp-4">
                  {featuredPost.excerpt || 'Klik untuk membaca wawasan spiritual mendalam dari artikel ini.'}
                </p>
                <div className="pt-4">
                  <Link
                    href={`/blog/${featuredPost.id}`}
                    className="inline-flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-6 py-3 rounded-xl gap-2 transition-all group-hover:shadow-lg shadow-indigo-950"
                  >
                    Mulai Membaca <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Remaining Grid Posts */}
        {!loading && gridPosts.length > 0 && (() => {
          const ITEMS_PER_PAGE = 20;
          const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
          const paginatedGridPosts = gridPosts.slice(startIndex, startIndex + ITEMS_PER_PAGE);
          const totalPages = Math.ceil(gridPosts.length / ITEMS_PER_PAGE);

          return (
            <div className="space-y-12">
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-slate-200 border-b border-slate-900 pb-3 flex items-center gap-2">
                  <BookOpen className="w-6 h-6 text-indigo-400" /> Artikel Terkait
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {paginatedGridPosts.map((blog, idx) => (
                    <motion.div
                      key={blog.id}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03, duration: 0.4 }}
                      className="group bg-slate-900/20 border border-slate-900 hover:border-indigo-500/20 rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col"
                    >
                      <div className="aspect-[1200/630] overflow-hidden bg-slate-950 relative border-b border-slate-900">
                        <img
                          src={`/api/admin/generate-image?title=${encodeURIComponent(
                            blog.title
                          )}&description=${encodeURIComponent(
                            blog.excerpt || blog.title
                          )}&icon=${encodeURIComponent(blog.icon || '📖')}&bg=${blog.bg || '1'}`}
                          alt={blog.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                      </div>
                      <div className="p-6 flex flex-col flex-1">
                        <div className="flex items-center gap-3 mb-3 text-xs">
                          <span className="px-2.5 py-0.5 rounded-full font-semibold bg-indigo-50/10 text-indigo-400">
                            {blog.category}
                          </span>
                          {blog.createdAt && (
                            <span className="text-slate-500 flex items-center gap-1">
                              {new Date(blog.createdAt).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                              })}
                            </span>
                          )}
                        </div>
                        <h4 className="text-lg font-bold text-white mb-2 line-clamp-2 group-hover:text-indigo-400 transition-colors">
                          <Link href={`/blog/${blog.id}`}>{blog.title}</Link>
                        </h4>
                        <p className="text-slate-400 text-xs line-clamp-3 mb-6 flex-1">
                          {blog.excerpt || 'Klik untuk membaca wawasan spiritual mendalam dari artikel ini.'}
                        </p>
                        <Link
                          href={`/blog/${blog.id}`}
                          className="inline-flex items-center text-xs font-semibold text-indigo-400 hover:text-indigo-300 gap-1 mt-auto"
                        >
                          Baca Selengkapnya
                          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                        </Link>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 border-t border-slate-900 pt-8">
                  <button
                    onClick={() => {
                      setCurrentPage((p) => Math.max(1, p - 1));
                      window.scrollTo({ top: 400, behavior: 'smooth' });
                    }}
                    disabled={currentPage === 1}
                    className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sm font-semibold text-slate-400 hover:text-indigo-400 disabled:opacity-30 disabled:hover:text-slate-400 transition-all shadow-inner"
                  >
                    Sebelumnya
                  </button>
                  <span className="text-slate-400 text-sm font-semibold">
                    Halaman <span className="text-indigo-400">{currentPage}</span> dari {totalPages}
                  </span>
                  <button
                    onClick={() => {
                      setCurrentPage((p) => Math.min(totalPages, p + 1));
                      window.scrollTo({ top: 400, behavior: 'smooth' });
                    }}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sm font-semibold text-slate-400 hover:text-indigo-400 disabled:opacity-30 disabled:hover:text-slate-400 transition-all shadow-inner"
                  >
                    Berikutnya
                  </button>
                </div>
              )}
            </div>
          );
        })()}
      </div>
    </main>
  );
}

export default function BlogListPage() {
  return (
    <Suspense fallback={<main className="min-h-screen px-4 py-10 text-gray-650 bg-slate-950">Memuat blog...</main>}>
      <BlogListContent />
    </Suspense>
  );
}
