'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, Variants } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { ArrowRight, ShoppingBag, Store, MapPin } from 'lucide-react';

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

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2, delayChildren: 0.1 }
    }
  };

  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 50 } }
  };

  return (
    <section className="relative min-h-[95vh] flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/hero-market.png"
          alt="Vibrant Kenyan Market"
          fill
          priority
          className="object-cover object-center scale-105 animate-[slow-zoom_20s_ease-in-out_infinite_alternate]"
        />
        {/* Gradients for depth and readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-green-950/80 via-green-950/60 to-surface-base" />
        <div className="absolute inset-0 bg-gradient-to-r from-green-950/90 via-transparent to-green-950/90" />
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10 w-full pt-32 pb-20">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          
          {/* Text Content */}
          <motion.div 
            className="lg:col-span-7 text-left space-y-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={itemVariants} className="inline-flex items-center gap-3 px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white text-sm font-bold shadow-2xl">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-brand-400"></span>
              </span>
              {stats?.total_markets || '3'} Markets are live right now
            </motion.div>

            <motion.h1 variants={itemVariants} className="font-display text-5xl md:text-7xl lg:text-8xl font-[1000] tracking-tighter !text-white leading-[0.95]">
              The freshest <span className="text-brand-400 italic">local</span> <br className="hidden md:block" />
              produce, <span className="text-amber-400 relative inline-block">digitized.
                <svg className="absolute -bottom-4 left-0 w-full text-amber-400 opacity-70" viewBox="0 0 400 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 15C100 5 300 5 395 15" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
                </svg>
              </span>
            </motion.h1>

            <motion.p variants={itemVariants} className="text-lg md:text-xl text-gray-200 font-medium leading-relaxed max-w-2xl">
              Discover local traders, browse fresh produce, reserve items instantly, and pay securely via M-Pesa. Your entire neighbourhood market in your pocket.
            </motion.p>

            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center gap-4 pt-4">
              <Link 
                href={hasHydrated && isAuthenticated ? "/resident" : "/login"} 
                className="w-full sm:w-auto px-8 py-4 bg-brand-500 text-white font-display font-black text-lg rounded-2xl shadow-[0_0_40px_rgba(45,150,83,0.4)] hover:bg-brand-400 hover:scale-105 transition-all duration-300 group flex items-center justify-center gap-3"
              >
                <ShoppingBag size={20} />
                Start Shopping
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              
              <a 
                href="#trader-preview" 
                onClick={(e) => handleScrollTo(e, '#trader-preview')}
                className="w-full sm:w-auto px-8 py-4 bg-white/10 backdrop-blur-md text-white font-display font-black text-lg rounded-2xl border border-white/20 hover:bg-white/20 transition-all duration-300 flex items-center justify-center gap-3"
              >
                <Store size={20} />
                Explore Traders
              </a>
            </motion.div>
          </motion.div>

          {/* Right Side Glass Metrics Panel */}
          <motion.div 
            className="lg:col-span-5 hidden lg:block"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-[3rem] shadow-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-brand-400/20 to-amber-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <h3 className="!text-white font-display font-black text-2xl mb-8 flex items-center gap-3">
                <MapPin className="text-brand-400" />
                Live Market Pulse
              </h3>

              <div className="space-y-6">
                {[
                  { label: 'Markets Connected', val: stats?.total_markets, icon: <MapPin size={20} /> },
                  { label: 'Verified Traders', val: stats?.total_traders, icon: <Store size={20} /> },
                  { label: 'Items Reserved', val: stats?.total_reservations, icon: <ShoppingBag size={20} /> }
                ].map((stat, idx) => (
                  <div key={stat.label} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors">
                    <div className="flex items-center gap-4 text-gray-300">
                      <div className="w-10 h-10 bg-brand-500/20 rounded-xl flex items-center justify-center text-brand-400">
                        {stat.icon}
                      </div>
                      <span className="font-bold text-sm tracking-wide">{stat.label}</span>
                    </div>
                    <span className="font-display font-black text-2xl text-white">{stat.val || '...'}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};
