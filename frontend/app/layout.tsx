import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, DM_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import OfflineBanner from "@/components/shared/OfflineBanner";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const dmSans = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

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
