'use client';

import React from 'react';

// Components
import { Navbar } from '@/components/landing/Navbar';
import { Hero } from '@/components/landing/Hero';
import { ProductPreview } from '@/components/landing/ProductPreview';
import { MarketPreview } from '@/components/landing/MarketPreview';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { Features } from '@/components/landing/Features';
import { RoleCards } from '@/components/landing/RoleCards';
import { CallToAction } from '@/components/landing/CallToAction';
import { Footer } from '@/components/landing/Footer';

/**
 * Public Landing Page
 * Refactored into modular components for scalability.
 */
export default function PublicLandingPage() {
  return (
    <div className="w-full block relative bg-surface-base text-text-primary z-0 min-h-screen overflow-x-hidden flex-1">
      <Navbar />
      
      <main>
        <Hero />
        <ProductPreview />
        <MarketPreview />
        <HowItWorks />
        <Features />
        <RoleCards />
        <CallToAction />
      </main>

      <Footer />
    </div>
  );
}
