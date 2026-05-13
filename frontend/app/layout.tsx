import React from 'react';
import type { Metadata, Viewport } from "next";
import "./globals.css";
import Providers from "@/components/Providers";
import OfflineBanner from "@/components/shared/OfflineBanner";
import GlobalLoader from "@/components/shared/GlobalLoader";
import AiAssistantFab from "@/components/shared/AiAssistantFab";
import NextTopLoader from 'nextjs-toploader';
import { Toaster } from 'sonner';

// Bypass Google Fonts due to build environment network restrictions
const plusJakarta = { variable: "--font-display" };
const dmSans = { variable: "--font-body" };
const jetbrainsMono = { variable: "--font-mono" };

export const viewport: Viewport = {
  themeColor: "#1B6B3A",
};

export const metadata: Metadata = {
  metadataBase: new URL('https://sokomtaa.co.ke'),
  title: {
    default: "Soko Mtaa | Kenya's Local Neighbourhood Marketplace",
    template: "%s | Soko Mtaa"
  },
  description: "Connect with local traders, reserve fresh products, and support your neighbourhood economy with Soko Mtaa. The premier digital marketplace for Kenya's urban markets.",
  keywords: ["Soko Mtaa", "Kenya Markets", "Local Traders", "Fresh Produce", "Nairobi Markets", "Digital Marketplace", "M-Pesa Shopping"],
  authors: [{ name: "Soko Mtaa Team" }],
  creator: "Soko Mtaa",
  publisher: "Soko Mtaa",
  openGraph: {
    type: "website",
    locale: "en_KE",
    url: "https://sokomtaa.co.ke",
    title: "Soko Mtaa | Kenya's Local Neighbourhood Marketplace",
    description: "Connect with local traders, reserve fresh products, and support your neighbourhood economy with Soko Mtaa.",
    siteName: "Soko Mtaa",
  },
  twitter: {
    card: "summary_large_image",
    title: "Soko Mtaa | Kenya's Local Neighbourhood Marketplace",
    description: "Connect with local traders, reserve fresh products, and support your neighbourhood economy with Soko Mtaa.",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${plusJakarta.variable} ${dmSans.variable} ${jetbrainsMono.variable} h-full antialiased transition-colors duration-500`}>
      <body className="bg-surface-base text-text-primary min-h-full flex flex-col selection:bg-brand-100 selection:text-brand-900 overflow-x-hidden">
        <Providers>
          <NextTopLoader 
            color="#2D9653"
            height={3}
            showSpinner={false}
            shadow={false}
            crawl={true}
            speed={200}
            easing="ease"
            zIndex={9999}
          />
          <Toaster richColors position="top-right" />
          <GlobalLoader />
          {/* TV/Large Screen Background Elements */}
          <div className="hidden lg:block fixed inset-0 z-[-1] bg-[radial-gradient(circle_at_top_right,rgba(45,150,83,0.05),transparent),radial-gradient(circle_at_bottom_left,rgba(245,166,35,0.03),transparent)]" />
          
          <div className="w-full min-h-screen bg-white relative">
            <OfflineBanner />
            {children}
            <AiAssistantFab />
          </div>
        </Providers>
      </body>
    </html>
  );
}
