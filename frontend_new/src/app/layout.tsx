import type { Metadata } from "next";
import { Inter, Playfair_Display, Crimson_Text } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { FacebookPixel } from "@/components/analytics/FacebookPixel";
import { GoogleAnalytics } from "@/components/analytics/GoogleAnalytics";

const inter = Inter({ subsets: ["latin", "cyrillic"] });
const playfair = Playfair_Display({ 
  subsets: ["latin"],
  variable: '--font-playfair',
  display: 'swap'
});
const crimson = Crimson_Text({ 
  subsets: ["latin"],
  weight: ['400', '600'],
  variable: '--font-crimson',
  display: 'swap'
});

export const metadata: Metadata = {
  title: "Moami - Интернет магазин женской одежды",
  description: "Стильная женская одежда высокого качества. Элегантные костюмы, платья, блузы и аксессуары для современной женщины.",
  keywords: "женская одежда, костюмы, платья, блузы, аксессуары, Moami, интернет магазин",
  authors: [{ name: "Moami" }],
  creator: "Moami",
  publisher: "Moami",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  openGraph: {
    title: "Moami - Интернет магазин женской одежды",
    description: "Стильная женская одежда высокого качества. Элегантные костюмы, платья, блузы и аксессуары для современной женщины.",
    url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
    siteName: "Moami",
    images: [
      {
        url: "/images/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Moami - женская одежда",
      },
    ],
    locale: "ru_UA",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Moami - Интернет магазин женской одежды",
    description: "Стильная женская одежда высокого качества",
    images: ["/images/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className={`${inter.className} ${playfair.variable} ${crimson.variable}`} style={{ backgroundColor: 'var(--background)' }}>
        <QueryProvider>
          {children}
        </QueryProvider>
        
        {/* Analytics */}
        <FacebookPixel />
        {process.env.NEXT_PUBLIC_GA_TRACKING_ID && (
          <GoogleAnalytics trackingId={process.env.NEXT_PUBLIC_GA_TRACKING_ID} />
        )}
      </body>
    </html>
  );
}
