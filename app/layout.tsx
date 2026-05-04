import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#111827" },
  ],
};

export const metadata: Metadata = {
  title: {
    default: "IPL TeamCraft – IPL Player Stats & Dream Team Builder",
    template: "%s | IPL TeamCraft",
  },
  description:
    "Browse, search, filter and compare IPL player statistics across seasons. Build your fantasy Dream XI, explore champions leaderboards and track performance trends.",
  keywords: [
    "IPL",
    "IPL stats",
    "cricket",
    "fantasy cricket",
    "Dream XI",
    "IPL player statistics",
    "champions leaderboard",
    "IPL 2024",
    "IPL 2025",
    "TeamCraft",
  ],
  authors: [{ name: "Utkarsh Chaturvedi", url: "https://guidezy.in" }],
  creator: "Utkarsh Chaturvedi",
  publisher: "Guidezy",
  metadataBase: new URL("https://ipl-teamcraft.vercel.app"),
  openGraph: {
    type: "website",
    locale: "en_IN",
    title: "IPL TeamCraft – IPL Player Stats & Dream Team Builder",
    description:
      "Browse, search, filter and compare IPL player statistics across seasons. Build your fantasy Dream XI and explore champions leaderboards.",
    siteName: "IPL TeamCraft",
  },
  twitter: {
    card: "summary_large_image",
    title: "IPL TeamCraft – IPL Player Stats & Dream Team Builder",
    description:
      "Browse, search, filter and compare IPL player statistics. Build your Dream XI!",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
