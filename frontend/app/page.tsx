'use client';

import React from 'react';

// Components
import { Navbar } from '@/components/landing/Navbar';
import { Hero } from '@/components/landing/Hero';
import { CategoryGrid } from '@/components/landing/CategoryGrid';
import { ProductPreview } from '@/components/landing/ProductPreview';
import { MarketPreview } from '@/components/landing/MarketPreview';
import { TopTradersPreview } from '@/components/landing/TopTradersPreview';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { CallToAction } from '@/components/landing/CallToAction';
import { Footer } from '@/components/landing/Footer';

/**
 * Public Landing Page
 * Streamlined for high conversion and dynamic discovery.
 */
export default function PublicLandingPage() {
  return (
    <div className="w-full block relative bg-surface-base text-text-primary z-0 min-h-screen overflow-x-hidden flex-1">
      <Navbar />
      
      <main>
        <Hero />
        <CategoryGrid />
        <ProductPreview />
        <MarketPreview />
        <HowItWorks />
        <TopTradersPreview />
        <CallToAction />
      </main>

      <Footer />
    </div>
  );
}
