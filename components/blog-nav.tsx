'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { DEFAULT_BLOG_CATEGORY, slugifyCategory } from '@/lib/blog-utils';
import { BookOpen, ChevronDown, X } from 'lucide-react';

type BlogItem = { id: string; title: string; category: string };

export function BlogNav({ className = '' }: { className?: string }) {
  const [blogs, setBlogs] = useState<BlogItem[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    getDocs(collection(db, 'blogs'))
      .then((snap) => {
        const items = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            title: String(data.title || 'Artikel'),
            category: String(data.category || DEFAULT_BLOG_CATEGORY).trim() || DEFAULT_BLOG_CATEGORY,
          };
        });
        items.sort((a, b) => a.title.localeCompare(b.title, 'id'));
        setBlogs(items);
      })
      .catch(() => setBlogs([]));
  }, []);

  const byCategory = useMemo(() => {
    const map = new Map<string, BlogItem[]>();
    for (const b of blogs) {
      const list = map.get(b.category) || [];
      list.push(b);
      map.set(b.category, list);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0], 'id'));
  }, [blogs]);

  if (blogs.length === 0) {
    return (
      <Link href="/blog" className={className}>
        Blog
      </Link>
    );
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1 hover:opacity-80 transition-opacity font-medium text-black focus:outline-none"
        aria-expanded={open}
      >
        <BookOpen className="w-4 h-4 text-indigo-600" />
        Blog
        <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[100] transition-opacity duration-200"
            onClick={() => setOpen(false)}
            aria-hidden
          />

          {/* Centered Premium Mega Menu Modal */}
          <div className="fixed inset-x-4 top-[8%] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:top-[12%] z-[101] w-[min(94vw,760px)] max-h-[80vh] overflow-hidden rounded-2xl border border-slate-200 bg-white text-gray-900 shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/40 shrink-0">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-base">Jelajahi Wawasan Spiritual</h3>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors focus:outline-none"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Category horizontal scroll bar */}
            <div className="overflow-x-auto border-b border-slate-100 shrink-0 bg-white">
              <div className="flex min-w-max items-end gap-1 px-4 py-1" role="tablist" aria-label="Kategori blog">
                <Link
                  href="/blog"
                  className="relative inline-flex items-center whitespace-nowrap border-b-2 border-indigo-600 px-4 py-3 font-semibold text-indigo-700 transition-colors hover:bg-indigo-50/40 rounded-t"
                  onClick={() => setOpen(false)}
                  role="tab"
                >
                  Semua Artikel
                </Link>
                <Link
                  href="/kalender"
                  className="relative inline-flex items-center whitespace-nowrap border-b-2 border-amber-500 px-4 py-3 font-semibold text-amber-700 transition-colors hover:bg-amber-50/40 rounded-t"
                  onClick={() => setOpen(false)}
                  role="tab"
                >
                  🗓️ Kalender Wuku &amp; Weton
                </Link>

                {byCategory.map(([category, items]) => (
                  <Link
                    key={category}
                    href={`/blog?kategori=${slugifyCategory(category)}`}
                    className="relative inline-flex items-center gap-2 whitespace-nowrap border-b-2 border-transparent px-4 py-3 font-medium text-slate-650 transition-colors hover:border-indigo-300 hover:bg-indigo-50/40 hover:text-indigo-800 rounded-t"
                    onClick={() => setOpen(false)}
                    role="tab"
                  >
                    <span>{category}</span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">
                      {items.length}
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Articles List Body */}
            <div className="overflow-y-auto p-6 bg-slate-50/30 flex-1">
              <div className="grid gap-4 md:grid-cols-2">
                {byCategory.map(([category, items]) => (
                  <div
                    key={category}
                    className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <Link
                      href={`/blog?kategori=${slugifyCategory(category)}`}
                      className="mb-3 flex items-center justify-between font-bold text-indigo-900 hover:text-indigo-700 border-b border-slate-50 pb-2"
                      onClick={() => setOpen(false)}
                    >
                      <span className="text-sm">{category}</span>
                      <span className="text-xs font-semibold px-2 py-0.5 bg-indigo-50 rounded-full text-indigo-600">
                        {items.length} artikel
                      </span>
                    </Link>
                    <div className="space-y-1.5 max-h-[160px] overflow-y-auto">
                      {items.map((b) => (
                        <Link
                          key={b.id}
                          href={`/blog/${b.id}`}
                          className="block truncate rounded-lg px-2.5 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-indigo-800 transition-colors"
                          onClick={() => setOpen(false)}
                        >
                          • {b.title}
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
