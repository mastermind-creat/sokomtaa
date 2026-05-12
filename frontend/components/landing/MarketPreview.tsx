'use client';

import React from 'react';
import Link from 'next/link';
import { motion, Variants } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Market, ApiResponse } from '@/types';
import { MapPin, ArrowRight, Store, Users, ExternalLink } from 'lucide-react';

export const MarketPreview = () => {
  const { data: response, isLoading } = useQuery<ApiResponse<Market[]>>({
    queryKey: ['markets-public'],
    queryFn: () => api.get('/markets'),
  });

  const markets = (response?.data || []).slice(0, 3); // Just show top 3 for landing

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants: Variants = {
    hidden: { x: -20, opacity: 0 },
    visible: { x: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } }
  };

  if (!isLoading && markets.length === 0) return null;

  return (
    <section className="py-24 px-6 bg-surface-base relative overflow-hidden">
      {/* Abstract Background Element */}
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-brand-500/5 blur-[100px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center mb-16">
          <div className="lg:col-span-5">
            <p className="text-brand-600 font-black uppercase tracking-widest text-xs mb-4">Local Neighborhoods</p>
            <h2 className="font-display text-4xl md:text-5xl font-[1000] text-green-950 tracking-tighter leading-none mb-6">
              Markets in your <br />
              <span className="text-brand-600 italic">community</span>
            </h2>
            <p className="text-gray-500 font-medium text-lg leading-relaxed mb-8">
              We&apos;re starting with the heart of our neighborhoods. Find your local market and support traders you know.
            </p>
            <Link
              href="/search"
              className="inline-flex items-center gap-3 px-8 py-4 bg-green-950 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-brand-600 transition-all shadow-xl shadow-green-950/20"
            >
              Explore All Markets <ArrowRight size={16} />
            </Link>
          </div>

          <div className="lg:col-span-7">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2].map(i => (
                  <div key={i} className="h-40 bg-white/50 animate-pulse rounded-[32px] border border-gray-100" />
                ))}
              </div>
            ) : (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="space-y-4"
              >
                {markets.map((market) => (
                  <motion.div
                    key={market.id}
                    variants={itemVariants}
                    className="group relative bg-white border border-gray-100 rounded-[32px] p-6 md:p-8 hover:shadow-2xl hover:shadow-brand-500/10 transition-all duration-500"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center text-brand-600 shrink-0 group-hover:scale-110 transition-transform">
                          <Store size={28} />
                        </div>
                        <div>
                          <h3 className="font-display text-2xl font-black text-green-950 tracking-tight group-hover:text-brand-600 transition-colors">
                            {market.name}
                          </h3>
                          <div className="flex items-center gap-2 mt-1 text-gray-500 font-medium">
                            <MapPin size={14} className="text-brand-400" />
                            <span className="text-sm">{market.estate}, {market.county}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="hidden md:flex flex-col items-end mr-4">
                          <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Status</span>
                          <span className="flex items-center gap-1.5 text-xs font-bold text-green-600">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                            Active Market
                          </span>
                        </div>
                        <Link
                          href={`/market/${market.id}`}
                          className="flex items-center justify-center w-12 h-12 bg-surface-base rounded-xl text-green-950 hover:bg-brand-600 hover:text-white transition-all group-hover:bg-brand-600 group-hover:text-white"
                        >
                          <ExternalLink size={20} />
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
