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
    <html lang="sw" className={`${plusJakarta.variable} ${dmSans.variable} ${jetbrainsMono.variable} h-full antialiased`}>
      <body className="bg-surface-base text-text-primary min-h-full flex flex-col items-center">
        <Providers>
          <div className="w-full max-w-[1100px] mx-auto min-h-screen bg-surface-base lg:flex lg:flex-row relative">
            <OfflineBanner />
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
