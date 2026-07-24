import { Metadata } from 'next';
import BlogListPage from './blog-list-client';

export const metadata: Metadata = {
  title: 'Lentera Spiritual - Theta Indigo',
  description: 'Temukan rahasia numerologi Anda, getaran chakra, wawasan aura, dan artikel bertenaga AI untuk menuntun pertumbuhan batin Anda.',
  alternates: {
    canonical: 'https://www.indigoblueprint.my.id/blog',
    types: {
      'application/rss+xml': 'https://www.indigoblueprint.my.id/rss.xml',
    },
  },
  openGraph: {
    type: 'website',
    title: 'Lentera Spiritual - Theta Indigo',
    description: 'Temukan rahasia numerologi Anda, getaran chakra, wawasan aura, dan artikel bertenaga AI untuk menuntun pertumbuhan batin Anda.',
    url: 'https://www.indigoblueprint.my.id/blog',
    siteName: 'Theta Indigo Blueprint',
    images: [
      {
        url: 'https://www.indigoblueprint.my.id/logo.png',
        width: 512,
        height: 512,
        alt: 'Lentera Spiritual - Theta Indigo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Lentera Spiritual - Theta Indigo',
    description: 'Temukan rahasia numerologi Anda, getaran chakra, wawasan aura, dan artikel bertenaga AI untuk menuntun pertumbuhan batin Anda.',
    images: ['https://www.indigoblueprint.my.id/logo.png'],
  },
};

const blogJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: 'Lentera Spiritual Theta Indigo',
  description: 'Temukan rahasia numerologi Anda, getaran chakra, wawasan aura, dan artikel bertenaga AI untuk menuntun pertumbuhan batin Anda.',
  url: 'https://www.indigoblueprint.my.id/blog',
  publisher: {
    '@type': 'Organization',
    name: 'Theta Indigo Blueprint',
    url: 'https://www.indigoblueprint.my.id',
    logo: {
      '@type': 'ImageObject',
      url: 'https://www.indigoblueprint.my.id/logo.png',
    },
  },
  inLanguage: 'id-ID',
};

export default function BlogPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogJsonLd) }}
      />
      <BlogListPage />
    </>
  );
}
