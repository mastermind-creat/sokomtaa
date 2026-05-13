'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, Variants } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Product, ApiResponse } from '@/types';
import { ShoppingBag, ArrowRight, Tag, Store, Star, Flame } from 'lucide-react';

export const ProductPreview = () => {
  const [hasHydrated, setHasHydrated] = React.useState(false);
  const { isAuthenticated } = useAuthStore();

  React.useEffect(() => {
    setHasHydrated(true);
  }, []);

  const { data: response, isLoading } = useQuery<ApiResponse<{ popular_products: Product[], boosted_products: Product[] }>>({
    queryKey: ['recommendations'],
    queryFn: () => api.get('/recommendations'),
  });

  const popularProducts = response?.data?.popular_products || [];
  const boostedProducts = response?.data?.boosted_products || [];

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } }
  };

  return (
    <section id="products" className="py-20 px-6 bg-surface-base relative overflow-hidden">
      {/* Decorative background blur */}
      <div className="absolute top-40 right-0 w-[500px] h-[500px] bg-brand-500/5 blur-[100px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <p className="text-brand-600 font-black uppercase tracking-widest text-[10px] mb-3 flex items-center gap-2">
              <Flame size={14} className="text-amber-500" />
              Fresh & Trending
            </p>
            <h2 className="font-display text-3xl md:text-5xl font-[1000] text-green-950 tracking-tighter">
              Featured Produce
            </h2>
          </div>
          <Link
            href={hasHydrated && isAuthenticated ? "/resident/search" : "/login"}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-green-950 font-black uppercase tracking-widest text-[10px] rounded-xl shadow-sm group hover:border-brand-300 hover:text-brand-600 transition-all"
          >
            Explore Marketplace
            <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="aspect-[4/5] bg-gray-100 animate-pulse rounded-[32px]" />
            ))}
          </div>
        ) : popularProducts.length === 0 && boostedProducts.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-[40px] border border-gray-100 shadow-sm">
            <ShoppingBag size={48} className="mx-auto text-gray-200 mb-4" />
            <h3 className="text-xl font-black text-green-950 mb-1">Market is Quiet</h3>
            <p className="text-sm font-medium text-gray-400">Check back later for fresh products.</p>
          </div>
        ) : (
          <div className="space-y-12">
            
            {/* Boosted Products - Featured Horizontal Layout */}
            {boostedProducts.length > 0 && (
              <div className="bg-amber-50/50 p-6 md:p-8 rounded-[40px] border border-amber-100">
                <h3 className="text-sm font-black text-amber-700 mb-6 flex items-center gap-2 uppercase tracking-widest">
                  <Star size={16} className="text-amber-400 fill-amber-400" />
                  Premium Picks
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {boostedProducts.slice(0, 3).map((product) => (
                    <motion.div 
                      key={`boosted-${product.id}`}
                      initial={{ opacity: 0, scale: 0.95 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      className="group relative"
                    >
                      <Link
                        href={hasHydrated && isAuthenticated ? `/trader/${product.trader_id}` : "/login"}
                        className="flex bg-white border border-amber-100 rounded-[28px] overflow-hidden shadow-lg shadow-amber-500/5 hover:shadow-2xl hover:shadow-amber-500/10 transition-all duration-500 p-3 gap-4 items-center"
                      >
                        <div className="w-24 h-24 bg-gray-50 rounded-2xl relative overflow-hidden flex-shrink-0">
                          {product.image_url ? (
                            <Image
                              src={product.image_url}
                              alt={product.name}
                              fill
                              className="object-cover transition-transform duration-700 group-hover:scale-110"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-200">
                              <ShoppingBag size={24} />
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0 pr-2">
                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-amber-50 rounded-md text-[9px] font-black uppercase tracking-widest text-amber-600 mb-1">
                            Promoted
                          </div>
                          <h4 className="font-display text-base font-black text-green-950 tracking-tight mb-0.5 truncate group-hover:text-brand-600 transition-colors">
                            {product.name}
                          </h4>
                          <p className="text-brand-600 font-black text-sm mb-2">KES {product.price}</p>
                          <div className="inline-flex w-full items-center justify-center gap-2 py-1.5 bg-green-50 text-brand-700 rounded-lg font-bold text-[10px] group-hover:bg-brand-600 group-hover:text-white transition-colors">
                            Reserve
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Popular Products - Grid */}
            {popularProducts.length > 0 && (
              <motion.div 
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6"
              >
                {popularProducts.map((product) => (
                  <motion.div variants={itemVariants} key={`popular-${product.id}`} className="group relative">
                    <Link
                      href={hasHydrated && isAuthenticated ? `/trader/${product.trader_id}` : "/login"}
                      className="flex flex-col h-full bg-white border border-gray-100 rounded-[28px] overflow-hidden hover:shadow-2xl hover:shadow-gray-200/50 hover:-translate-y-1 transition-all duration-500"
                    >
                      <div className="aspect-square bg-gray-50 relative overflow-hidden">
                        {product.image_url ? (
                          <Image
                            src={product.image_url}
                            alt={product.name}
                            fill
                            className="object-cover transition-transform duration-700 group-hover:scale-110"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-200">
                            <ShoppingBag size={32} />
                          </div>
                        )}
                        
                        {/* Price Badge */}
                        <div className="absolute top-3 right-3">
                          <div className="px-2.5 py-1 bg-white/95 backdrop-blur-md rounded-lg text-[10px] font-black uppercase tracking-widest text-green-950 shadow-sm border border-white/20">
                            KES {product.price}
                          </div>
                        </div>

                        {/* Quick Action Overlay (Indicator) */}
                        <div className="absolute inset-x-3 bottom-3 translate-y-12 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                          <div className="w-full bg-brand-600 text-white py-2.5 rounded-lg flex items-center justify-center gap-2 text-xs font-bold shadow-lg hover:bg-brand-500 transition-colors">
                            <ShoppingBag size={14} />
                            Quick Reserve
                          </div>
                        </div>
                      </div>

                      <div className="p-4 flex-1 flex flex-col">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <Tag size={10} className="text-brand-500" />
                          <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">
                            {product.category?.name || 'General'}
                          </span>
                        </div>
                        <h3 className="font-display text-sm font-black text-green-950 tracking-tight mb-3 group-hover:text-brand-600 transition-colors line-clamp-1">
                          {product.name}
                        </h3>

                        <div className="flex items-center gap-2 pt-3 border-t border-gray-50 mt-auto">
                          <div className="w-6 h-6 bg-brand-50 rounded-lg flex items-center justify-center text-brand-600">
                            <Store size={12} />
                          </div>
                          <span className="text-[10px] font-bold text-gray-600 truncate">
                            {product.trader?.business_name || 'Trader'}
                          </span>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
            )}
            
          </div>
        )}
      </div>
    </section>
  );
};
