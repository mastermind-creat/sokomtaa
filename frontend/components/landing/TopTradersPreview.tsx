'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, Variants } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Trader, ApiResponse } from '@/types';
import { Store, Star, Award, MapPin, ArrowRight } from 'lucide-react';

export const TopTradersPreview = () => {
  const [hasHydrated, setHasHydrated] = React.useState(false);
  const { isAuthenticated } = useAuthStore();

  React.useEffect(() => {
    setHasHydrated(true);
  }, []);

  const { data: response, isLoading } = useQuery<ApiResponse<{ top_traders: Trader[] }>>({
    queryKey: ['recommendations-traders'],
    queryFn: () => api.get('/recommendations'),
  });

  const traders = response?.data?.top_traders || [];

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } }
  };

  if (!isLoading && traders.length === 0) return null;

  return (
    <section id="trader-preview" className="py-24 px-6 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto relative z-10">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div>
            <p className="text-brand-600 font-black uppercase tracking-widest text-sm mb-4 flex items-center gap-2">
              <Award size={16} className="text-brand-600" />
              Community Favorites
            </p>
            <h2 className="font-display text-4xl md:text-5xl font-[1000] text-green-950 tracking-tighter">
              Top Rated Traders
            </h2>
            <p className="mt-4 text-gray-500 font-medium max-w-xl">
              Meet the most reliable, highly-rated sellers powering our local markets.
            </p>
          </div>
          <Link
            href={hasHydrated && isAuthenticated ? "/search" : "/login"}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-surface-base border border-gray-200 text-green-950 font-black uppercase tracking-widest text-xs rounded-xl shadow-sm group hover:border-brand-300 hover:text-brand-600 transition-all"
          >
            Find More Traders
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 bg-gray-100 animate-pulse rounded-[32px]" />
            ))}
          </div>
        ) : (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
          >
            {traders.map((trader) => (
              <motion.div variants={itemVariants} key={`trader-${trader.id}`} className="group relative bg-white border border-gray-100 rounded-[32px] overflow-hidden hover:shadow-2xl hover:shadow-brand-500/10 hover:-translate-y-1 transition-all duration-500">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-gray-50 relative overflow-hidden flex-shrink-0 border-2 border-white shadow-md">
                        {trader.avatar_url ? (
                          <Image
                            src={trader.avatar_url}
                            alt={trader.business_name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300 bg-brand-50">
                            <Store size={24} className="text-brand-400" />
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-display text-xl font-black text-green-950 tracking-tight group-hover:text-brand-600 transition-colors line-clamp-1">
                          {trader.business_name}
                        </h3>
                        <div className="flex items-center gap-1.5 mt-1 text-sm text-gray-500">
                          <MapPin size={14} className="text-brand-400" />
                          <span className="truncate max-w-[150px]">{trader.market?.name || 'Local Market'}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end">
                      <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg">
                        <Star size={14} className="text-amber-500 fill-amber-500" />
                        <span className="font-black text-amber-600 text-sm">{Number(trader.average_rating || 0).toFixed(1)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-gray-50 flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-400 flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      Currently Open
                    </span>
                    <Link
                      href={hasHydrated && isAuthenticated ? `/trader/${trader.id}` : "/login"}
                      className="px-4 py-2 bg-brand-50 text-brand-700 rounded-xl font-bold text-xs hover:bg-brand-600 hover:text-white transition-colors flex items-center gap-2"
                    >
                      Visit Store <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
        
      </div>
    </section>
  );
};
