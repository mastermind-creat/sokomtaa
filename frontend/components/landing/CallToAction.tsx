'use client';

import React from 'react';
import Link from 'next/link';

export const CallToAction = () => {
  return (
    <section className="py-24 px-6 bg-brand-600 relative overflow-hidden">
      {/* Decorative Light Effects */}
      <div className="absolute -top-1/2 -left-1/4 w-full h-full bg-white/10 blur-[120px] rounded-full" />
      
      <div className="max-w-4xl mx-auto text-center relative z-10">
        <h2 className="font-display text-4xl md:text-6xl font-[1000] text-white tracking-tighter italic leading-[0.9] mb-8 uppercase">
          Ready to join <br/>your market?
        </h2>
        <p className="text-white/70 text-lg md:text-xl font-medium leading-relaxed mb-12">
          Join thousands of local traders and residents in building a smarter, digital market ecosystem for Kisumu.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
          <Link 
            href="/register" 
            className="w-full sm:w-auto px-12 py-5 bg-white text-green-950 font-display font-[1000] text-xl rounded-2xl shadow-2xl hover:bg-green-50 hover:scale-105 transition-all duration-300"
          >
            Create Free Account
          </Link>
          <a 
            href="#market-preview" 
            className="w-full sm:w-auto px-12 py-5 bg-transparent border-2 border-white/20 text-white font-display font-[1000] text-xl rounded-2xl hover:border-white transition-all duration-300"
          >
            Browse Market
          </a>
        </div>
      </div>
    </section>
  );
};
