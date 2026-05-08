'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

export const Hero = () => {
  const { data: stats } = useQuery({
    queryKey: ['global-stats'],
    queryFn: async () => {
      const response = await api.get('/stats');
      return response.data;
    }
  });

  const [hasHydrated, setHasHydrated] = React.useState(false);
  const { isAuthenticated } = useAuthStore();

  React.useEffect(() => {
    setHasHydrated(true);
  }, []);

  const handleScrollTo = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    const target = document.querySelector(targetId);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <section className="relative min-h-[90vh] flex flex-col items-center justify-center pt-32 pb-20 px-6 overflow-hidden bg-[radial-gradient(circle_at_50%_10%,_var(--green-50)_0%,_transparent_50%)]">
      {/* Dynamic Background Elements */}
      <div className="absolute top-1/2 -left-1/4 w-[50%] h-[50%] bg-brand-600/5 blur-[120px] rounded-full animate-pulse" />
      <div className="absolute -top-1/4 -right-1/4 w-[50%] h-[50%] bg-amber-500/5 blur-[120px] rounded-full" />

      <div className="max-w-7xl mx-auto text-center relative z-10">
        <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-brand-50 border border-brand-100 rounded-full text-brand-700 text-sm font-bold shadow-sm mb-12 animate-fade-in">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-brand-600"></span>
          </span>
          {stats?.total_markets || '3'} Markets are live right now
        </div>

        <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-[1000] tracking-tighter text-green-950 leading-[0.95] mb-8">
          Your <span className="text-brand-600 italic">neighbourhood</span> <br className="hidden md:block" />
          market, <span className="text-amber-600 lg:relative">digitized
            <svg className="hidden lg:block absolute -bottom-4 left-0 w-full text-amber-300" viewBox="0 0 400 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 15C100 5 300 5 395 15" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
            </svg>
          </span>
        </h1>

        <p className="max-w-2xl mx-auto text-lg md:text-xl text-gray-500 font-medium leading-relaxed mb-12">
          Discover local traders, browse fresh produce, reserve items, and pay via M-Pesa. All your market needs in one pocket-sized platform.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
          {hasHydrated && isAuthenticated ? (
            <a 
              href="#market-preview" 
              onClick={(e) => handleScrollTo(e, '#market-preview')}
              className="w-full sm:w-auto px-10 py-5 bg-brand-600 text-white font-display font-black text-xl rounded-2xl shadow-2xl shadow-brand-600/30 hover:bg-brand-700 hover:scale-105 transition-all duration-300 group"
            >
              Start Shopping
              <svg className="inline-block ml-3 group-hover:translate-x-1 transition-transform" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </a>
          ) : (
            <Link 
              href="/register" 
              className="w-full sm:w-auto px-10 py-5 bg-brand-600 text-white font-display font-black text-xl rounded-2xl shadow-2xl shadow-brand-600/30 hover:bg-brand-700 hover:scale-105 transition-all duration-300 group"
            >
              Start Shopping
              <svg className="inline-block ml-3 group-hover:translate-x-1 transition-transform" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </Link>
          )}
          <a 
            href="#market-preview" 
            onClick={(e) => handleScrollTo(e, '#market-preview')}
            className="w-full sm:w-auto px-10 py-5 bg-white text-green-950 font-display font-black text-xl rounded-2xl border-2 border-green-100 hover:border-brand-200 hover:bg-green-50/50 transition-all duration-300"
          >
            Browse {stats?.total_traders || ''} Traders
          </a>
        </div>

        <div className="mt-20 flex flex-wrap items-center justify-center gap-x-12 gap-y-6 opacity-60">
          {[
            { label: 'Markets Connected', val: stats?.total_markets },
            { label: 'Verified Traders', val: stats?.total_traders },
            { label: 'Items Reserved', val: stats?.total_reservations }
          ].map((stat) => (
            <div key={stat.label} className="flex items-center gap-2.5 text-sm font-black uppercase tracking-widest text-green-900">
              <div className="w-6 h-6 bg-brand-100 rounded-lg flex items-center justify-center text-brand-700">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <span className="text-brand-600">{stat.val || '...'}</span> {stat.label}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
