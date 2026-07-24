import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL('https://www.indigoblueprint.my.id'),
  title: "Theta Indigo Blueprint - Platform Spiritual AI",
  description: "Platform spiritual modern bertenaga AI untuk analisis energi, numerologi, chakra, dan jalan hidup",
  manifest: "/manifest.json",
  appleWebApp: {
    statusBarStyle: "black-translucent",
    title: "Theta Indigo",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
  verification: {
    google: "0f7-vxBqjvfEXx9f46gT2ehZ-geYBBoAvTJhXKBXVWY",
  },
  openGraph: {
    type: "website",
    title: "Theta Indigo Blueprint - Platform Spiritual AI",
    description: "Platform spiritual modern bertenaga AI untuk analisis energi, numerologi, chakra, dan jalan hidup",
    url: "https://www.indigoblueprint.my.id/",
    siteName: "Theta Indigo Blueprint",
    images: [
      {
        url: "https://www.indigoblueprint.my.id/logo.png",
        width: 512,
        height: 512,
        alt: "Theta Indigo Blueprint Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Theta Indigo Blueprint - Platform Spiritual AI",
    description: "Platform spiritual modern bertenaga AI untuk analisis energi, numerologi, chakra, dan jalan hidup",
    images: ["https://www.indigoblueprint.my.id/logo.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

import { ChatbotWidget } from "@/components/chatbot-widget";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <head>
        <link rel="apple-touch-icon" href="/logo.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        {/* RSS Autodiscovery */}
        <link
          rel="alternate"
          type="application/rss+xml"
          title="Theta Indigo Blueprint - Lentera Spiritual RSS Feed"
          href="https://www.indigoblueprint.my.id/rss.xml"
        />
        <link
          rel="alternate"
          type="application/rss+xml"
          title="Theta Indigo Podcast (Bahasa Indonesia)"
          href="https://www.indigoblueprint.my.id/podcast-rss-id.xml"
        />
        <link
          rel="alternate"
          type="application/rss+xml"
          title="Theta Indigo Podcast (English Edition)"
          href="https://www.indigoblueprint.my.id/podcast-rss-en.xml"
        />
      </head>
      <body className="font-body antialiased min-h-screen bg-slate-950 text-white mystical-gradient sacred-geometry">
        {children}
        <ChatbotWidget />
      </body>
    </html>
  );
}

