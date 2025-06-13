import type { Metadata } from "next";
import { Inter, Playfair_Display, Crimson_Text } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/components/providers/QueryProvider";

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
  description: "Стильная женская одежда высокого качества",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body className={`${inter.className} ${playfair.variable} ${crimson.variable}`} style={{ backgroundColor: '#fefcf7' }}>
        <QueryProvider>
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}
