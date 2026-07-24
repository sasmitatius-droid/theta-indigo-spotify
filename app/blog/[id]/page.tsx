import { Metadata } from 'next';
import Link from 'next/link';
import { queryD1, executeD1 } from '@/lib/cloudflare-db';
import { getFromR2Json } from '@/lib/r2-client';
import { BlogHtmlContent } from '@/components/blog-html-content';
import { ShareButtons } from '@/components/share-buttons';
import { BlogArticleActions } from '@/components/blog-article-actions';
import { ArrowLeft, Calendar, Tag } from 'lucide-react';
import { DEFAULT_BLOG_CATEGORY, formatBlogDateTime, slugifyCategory } from '@/lib/blog-utils';

interface BlogPost {
  id: string;
  title: string;
  content: string;
  excerpt?: string;
  category: string;
  icon: string;
  bg: string;
  createdAt?: string;
  tags?: string[];
  bannerR2Url?: string;
  views?: number;
}

export const dynamic = 'force-dynamic';

async function getBlogPost(id: string): Promise<BlogPost | null> {
  try {
    const rows = await queryD1('SELECT * FROM blogs WHERE id = ?', [id]);
    const blog = rows[0];
    if (!blog) return null;

    // Increment view counter in background
    executeD1('UPDATE blogs SET views = COALESCE(views, 0) + 1 WHERE id = ?', [id]).catch(() => {});

    let content = '';
    if (blog.contentR2Path) {
      try {
        const payload = await getFromR2Json<{ content: string }>(blog.contentR2Path);
        content = payload.content;
      } catch (err) {
        console.error('Error fetching blog content from R2:', err);
      }
    }

    let tags: string[] = [];
    if (blog.tags) {
      try {
        tags = JSON.parse(blog.tags);
      } catch { /* ignore */ }
    }

    return {
      id: blog.id,
      title: blog.title || 'Tanpa judul',
      content: content || '',
      excerpt: blog.excerpt || '',
      category: blog.category || DEFAULT_BLOG_CATEGORY,
      icon: blog.icon || '📖',
      bg: blog.bg || '1',
      createdAt: blog.createdAt ? String(blog.createdAt) : undefined,
      tags,
      bannerR2Url: blog.bannerR2Url || undefined,
      views: Number(blog.views) || 0,
    };
  } catch (err) {
    console.error('Error getting blog post from D1:', err);
    return null;
  }
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const post = await getBlogPost(params.id);
  if (!post) {
    return {
      title: 'Artikel Tidak Ditemukan - Theta Indigo Blueprint',
    };
  }

  const cleanDescription = (post.excerpt || 'Baca artikel spiritual selengkapnya di Theta Indigo Blueprint.')
    .replace(/<[^>]*>/g, '')
    .slice(0, 150);

  // Dynamic or static banner image URL
  const imageUrl = post.bannerR2Url || `https://www.indigoblueprint.my.id/api/admin/generate-image?title=${encodeURIComponent(
    post.title
  )}&description=${encodeURIComponent(cleanDescription)}&icon=${encodeURIComponent(post.icon)}&bg=${post.bg}`;

  return {
    title: `${post.title} - Theta Indigo`,
    description: cleanDescription,
    alternates: {
      canonical: `https://www.indigoblueprint.my.id/blog/${post.id}`,
    },
    openGraph: {
      type: 'article',
      title: post.title,
      description: cleanDescription,
      url: `https://www.indigoblueprint.my.id/blog/${post.id}`,
      siteName: 'Theta Indigo Blueprint',
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
      publishedTime: post.createdAt,
      authors: ['Theta Indigo Blueprint'],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: cleanDescription,
      images: [imageUrl],
    },
  };
}

export default async function BlogArticlePage({ params }: { params: { id: string } }) {
  const post = await getBlogPost(params.id);

  if (!post) {
    return (
      <main className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-md">
          <h1 className="text-3xl font-bold text-indigo-400">Artikel Tidak Ditemukan</h1>
          <p className="text-slate-400">Artikel spiritual yang Anda cari mungkin telah dipindahkan atau dihapus.</p>
          <Link
            href="/blog"
            className="inline-flex items-center text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 px-6 py-3 rounded-xl transition-colors shadow-md"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Kembali ke Blog
          </Link>
        </div>
      </main>
    );
  }

  const BASE_URL = 'https://www.indigoblueprint.my.id';
  const articleUrl = `${BASE_URL}/blog/${post.id}`;
  const imageUrl = `/api/admin/generate-image?title=${encodeURIComponent(post.title)}&description=${encodeURIComponent(
    post.excerpt || 'Baca artikel spiritual selengkapnya.'
  )}&icon=${encodeURIComponent(post.icon)}&bg=${post.bg}`;

  // JSON-LD Structured Data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        '@id': articleUrl,
        headline: post.title,
        description: post.excerpt || '',
        datePublished: post.createdAt || new Date().toISOString(),
        dateModified: post.createdAt || new Date().toISOString(),
        author: {
          '@type': 'Organization',
          name: 'Theta Indigo Blueprint',
          url: BASE_URL,
        },
        publisher: {
          '@type': 'Organization',
          name: 'Theta Indigo Blueprint',
          url: BASE_URL,
          logo: {
            '@type': 'ImageObject',
            url: `${BASE_URL}/logo.png`,
          },
        },
        image: {
          '@type': 'ImageObject',
          url: `${BASE_URL}${imageUrl}`,
          width: 1200,
          height: 630,
        },
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': articleUrl,
        },
        articleSection: post.category,
        inLanguage: 'id-ID',
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Beranda', item: BASE_URL },
          { '@type': 'ListItem', position: 2, name: 'Blog', item: `${BASE_URL}/blog` },
          { '@type': 'ListItem', position: 3, name: post.title, item: articleUrl },
        ],
      },
    ],
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white pb-24 selection:bg-indigo-500 selection:text-white">
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Background glow effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-indigo-650/10 blur-[100px] pointer-events-none" />

      <article className="max-w-3xl mx-auto px-4 pt-10 md:pt-16 space-y-8 relative z-10">
        <Link
          href="/blog"
          className="inline-flex items-center text-sm text-indigo-400 hover:text-indigo-300 font-semibold transition-colors mb-2"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Semua Artikel
        </Link>

        {/* Action Buttons: Voice to Text (TTS) & Save PDF - Moved to Top */}
        <BlogArticleActions 
          title={post.title} 
          excerpt={post.excerpt || ''} 
          targetId="pdf-content-container" 
        />

        {/* Container for PDF Generation */}
        <div id="pdf-content-container" className="space-y-8 bg-slate-950 p-2 md:p-4 rounded-xl">
          {/* Dynamic Image Banner */}
          <div className="aspect-[1200/630] w-full overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 relative flex items-center justify-center shadow-2xl">
            <img
              src={`/api/admin/generate-image?title=${encodeURIComponent(post.title)}&description=${encodeURIComponent(
                post.excerpt || 'Baca artikel spiritual selengkapnya.'
              )}&icon=${encodeURIComponent(post.icon)}&bg=${post.bg}`}
              alt={post.title}
              className="w-full h-full object-cover"
              crossOrigin="anonymous"
            />
          </div>

          {/* Article Meta */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
              <Link
                href={`/blog?kategori=${slugifyCategory(post.category)}`}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-semibold bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-all border border-indigo-500/20"
              >
                <Tag className="w-3.5 h-3.5" />
                {post.category}
              </Link>
              {post.createdAt && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  {formatBlogDateTime(post.createdAt)}
                </span>
              )}
              {post.views !== undefined && post.views > 0 && (
                <span className="flex items-center gap-1.5 text-slate-400">
                  👁️ {post.views} dibaca
                </span>
              )}
            </div>

            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {post.tags.map((t) => (
                  <Link
                    key={t}
                    href={`/blog?tag=${encodeURIComponent(t)}`}
                    className="text-xs px-2.5 py-0.5 rounded-md bg-slate-800 text-indigo-300 border border-slate-700 hover:border-indigo-500 transition-colors"
                  >
                    #{t}
                  </Link>
                ))}
              </div>
            )}

            <h1 className="text-3xl md:text-5xl font-extrabold text-white leading-tight">{post.title}</h1>
          </div>

          {/* Article Body */}
          <div className="bg-white rounded-2xl p-6 md:p-12 border border-slate-200 text-gray-900 shadow-xl leading-relaxed">
            <BlogHtmlContent content={post.content} />
          </div>
        </div>

        {/* Share Buttons */}
        <ShareButtons id={post.id} title={post.title} excerpt={post.excerpt} />
      </article>
    </main>
  );
}
