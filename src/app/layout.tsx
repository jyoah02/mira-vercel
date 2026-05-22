import type { Metadata } from "next";
import { Inter, DM_Sans } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600", "700", "800"],
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "MIRA — Meeting Intelligence & Report Aggregator",
  description: "Upload a meeting recording and get instant transcription, key decisions, action items, and sentiment analysis powered by Whisper and Claude AI.",
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
  },
  openGraph: {
    title: "MIRA — Meeting Intelligence & Report Aggregator",
    description: "Upload a meeting recording and get instant transcription, key decisions, action items, and sentiment analysis powered by Whisper and Claude AI.",
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "MIRA — Meeting Intelligence & Report Aggregator",
    description: "Upload a meeting recording and get instant transcription, key decisions, action items, and sentiment analysis powered by Whisper and Claude AI.",
    images: ['/og-image.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${dmSans.variable} h-full antialiased dark`}>
      <body className="min-h-full flex flex-col font-inter">{children}</body>
    </html>
  );
}
