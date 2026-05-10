import React from 'react';
import type { Metadata, Viewport } from "next";
import "./globals.css";
import Providers from "@/components/Providers";
import OfflineBanner from "@/components/shared/OfflineBanner";
import GlobalLoader from "@/components/shared/GlobalLoader";
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
  title: "Soko Mtaa | Neighbourhood Digital Marketplace",
  description: "Connecting local traders and residents in Kenya's markets.",
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
          <Toaster richColors position="top-right" />
          <GlobalLoader />
          <React.Suspense fallback={null}>
            <NextTopLoader 
              color="#2D9653"
              height={4}
              showSpinner={false}
              shadow={false}
            />
          </React.Suspense>
          {/* TV/Large Screen Background Elements */}
          <div className="hidden lg:block fixed inset-0 z-[-1] bg-[radial-gradient(circle_at_top_right,rgba(45,150,83,0.05),transparent),radial-gradient(circle_at_bottom_left,rgba(245,166,35,0.03),transparent)]" />
          
          <div className="w-full min-h-screen bg-white lg:flex lg:flex-row relative">
            <OfflineBanner />
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
