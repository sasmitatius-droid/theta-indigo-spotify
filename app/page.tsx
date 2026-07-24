import type { Metadata } from 'next';
import LandingPage from './page-client';

const BASE_URL = 'https://www.indigoblueprint.my.id';

export const metadata: Metadata = {
  title: 'Theta Indigo Blueprint - Platform Spiritual AI',
  description: 'Platform spiritual modern bertenaga AI untuk analisis energi, numerologi, chakra, dan jalan hidup',
  alternates: {
    canonical: BASE_URL,
    types: {
      'application/rss+xml': `${BASE_URL}/rss.xml`,
    },
  },
  openGraph: {
    type: 'website',
    title: 'Theta Indigo Blueprint - Platform Spiritual AI',
    description: 'Platform spiritual modern bertenaga AI untuk analisis energi, numerologi, chakra, dan jalan hidup',
    url: `${BASE_URL}/`,
    siteName: 'Theta Indigo Blueprint',
    images: [
      {
        url: `${BASE_URL}/logo.png`,
        width: 512,
        height: 512,
        alt: 'Theta Indigo Blueprint',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Theta Indigo Blueprint - Platform Spiritual AI',
    description: 'Platform spiritual modern bertenaga AI untuk analisis energi, numerologi, chakra, dan jalan hidup',
    images: [`${BASE_URL}/logo.png`],
  },
};

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${BASE_URL}/#organization`,
      name: 'Theta Indigo Blueprint',
      url: BASE_URL,
      logo: {
        '@type': 'ImageObject',
        url: `${BASE_URL}/logo.png`,
      },
      sameAs: [],
      description: 'Platform spiritual modern bertenaga AI untuk analisis energi, numerologi, chakra, dan jalan hidup',
      inLanguage: 'id-ID',
    },
    {
      '@type': 'WebSite',
      '@id': `${BASE_URL}/#website`,
      url: BASE_URL,
      name: 'Theta Indigo Blueprint',
      description: 'Platform spiritual modern bertenaga AI untuk analisis energi, numerologi, chakra, dan jalan hidup',
      publisher: { '@id': `${BASE_URL}/#organization` },
      inLanguage: 'id-ID',
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${BASE_URL}/blog?q={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
      },
    },
  ],
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <LandingPage />
    </>
  );
}
