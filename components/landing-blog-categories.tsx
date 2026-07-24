'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { DEFAULT_BLOG_CATEGORY, slugifyCategory } from '@/lib/blog-utils';
import { ArrowRight } from 'lucide-react';

export function LandingBlogCategories() {
  const [categories, setCategories] = useState<{ name: string; count: number }[]>([]);

  useEffect(() => {
    fetch('/api/blogs')
      .then((res) => res.json())
      .then((blogs: any[]) => {
        if (!Array.isArray(blogs)) return;
        const counts = new Map<string, number>();
        blogs.forEach((b) => {
          const cat = String(b.category || DEFAULT_BLOG_CATEGORY).trim() || DEFAULT_BLOG_CATEGORY;
          counts.set(cat, (counts.get(cat) || 0) + 1);
        });
        // Sort by highest count and take top 5
        const sorted = [...counts.entries()]
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);
        setCategories(sorted);
      })
      .catch(() => setCategories([]));
  }, []);

  if (!categories.length) return null;

  return (
    <div className="flex flex-wrap items-center justify-center gap-2.5 py-2">
      <Link
        href="/blog"
        className="px-4 py-2 rounded-full text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all duration-200"
      >
        Semua Topik
      </Link>
      {categories.map(({ name, count }) => (
        <Link
          key={name}
          href={`/blog?kategori=${slugifyCategory(name)}`}
          className="px-4 py-2 rounded-full text-xs font-semibold bg-white hover:bg-indigo-50/60 text-slate-700 hover:text-indigo-700 border border-slate-200 shadow-sm transition-all duration-200 flex items-center gap-1.5"
        >
          <span>{name}</span>
          <span className="rounded-full bg-indigo-50 px-1.5 py-0.5 text-[10px] font-bold text-indigo-600">
            {count}
          </span>
        </Link>
      ))}
      <Link
        href="/blog"
        className="px-4 py-2 rounded-full text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50/80 hover:bg-indigo-100 transition-all duration-200 flex items-center gap-1"
      >
        <span>Topik Lainnya</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}
