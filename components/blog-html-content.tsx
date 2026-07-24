'use client';

import ReactMarkdown from 'react-markdown';
import DOMPurify from 'isomorphic-dompurify';

function looksLikeHtml(content: string): boolean {
  return /<[a-z][\s\S]*>/i.test(content.trim());
}

const PURIFY_CONFIG = {
  ADD_TAGS: ['iframe'],
  ADD_ATTR: ['target', 'rel', 'class', 'style', 'allow', 'allowfullscreen', 'frameborder'],
};

export function BlogHtmlContent({ content, className = '' }: { content: string; className?: string }) {
  if (!content?.trim()) {
    return <p className="text-gray-500">Konten kosong.</p>;
  }

  if (looksLikeHtml(content)) {
    const safe = DOMPurify.sanitize(content, PURIFY_CONFIG);
    return (
      <div
        className={`blog-prose prose prose-indigo max-w-none text-gray-800 ${className}`}
        dangerouslySetInnerHTML={{ __html: safe }}
      />
    );
  }

  return (
    <div className={`prose prose-indigo max-w-none text-gray-800 ${className}`}>
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}
