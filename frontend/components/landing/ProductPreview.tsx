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
    queryFn: () => api.get('/recommendations').then(res => res.data),
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
    <section id="product-preview" className="py-24 px-6 bg-surface-base relative overflow-hidden">
      {/* Decorative background blur */}
      <div className="absolute top-40 right-0 w-[500px] h-[500px] bg-brand-500/5 blur-[100px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div>
            <p className="text-brand-600 font-black uppercase tracking-widest text-sm mb-4 flex items-center gap-2">
              <Flame size={16} className="text-amber-500" />
              Fresh & Trending
            </p>
            <h2 className="font-display text-4xl md:text-5xl font-[1000] text-green-950 tracking-tighter">
              Discover Local Produce
            </h2>
          </div>
          <Link
            href={hasHydrated && isAuthenticated ? "/search" : "/login"}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white border border-gray-200 text-green-950 font-black uppercase tracking-widest text-xs rounded-xl shadow-sm group hover:border-brand-300 hover:text-brand-600 transition-all"
          >
            Explore Marketplace
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="aspect-[3/4] bg-gray-100 animate-pulse rounded-[32px]" />
            ))}
          </div>
        ) : popularProducts.length === 0 && boostedProducts.length === 0 ? (
          <div className="text-center py-32 bg-white rounded-[40px] border border-gray-100 shadow-sm">
            <ShoppingBag size={64} className="mx-auto text-gray-200 mb-6" />
            <h3 className="text-2xl font-black text-green-950 mb-2">Market is Quiet</h3>
            <p className="font-medium text-gray-400">Check back later for fresh products.</p>
          </div>
        ) : (
          <div className="space-y-16">
            
            {/* Boosted Products - Featured Horizontal Layout */}
            {boostedProducts.length > 0 && (
              <div>
                <h3 className="text-xl font-black text-green-950 mb-6 flex items-center gap-2">
                  <Star size={20} className="text-amber-400 fill-amber-400" />
                  Premium Picks
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {boostedProducts.slice(0, 3).map((product) => (
                    <motion.div 
                      key={`boosted-${product.id}`}
                      initial={{ opacity: 0, scale: 0.95 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      className="group relative flex bg-white border border-amber-100 rounded-[32px] overflow-hidden shadow-lg shadow-amber-500/5 hover:shadow-2xl hover:shadow-amber-500/20 transition-all duration-500 p-4 gap-4 items-center"
                    >
                      <div className="w-24 h-24 md:w-32 md:h-32 bg-gray-50 rounded-2xl relative overflow-hidden flex-shrink-0">
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
                      </div>
                      
                      <div className="flex-1 min-w-0 py-2">
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-amber-50 rounded-md text-[10px] font-black uppercase tracking-widest text-amber-600 mb-2">
                          <Flame size={10} /> Promoted
                        </div>
                        <h4 className="font-display text-lg font-black text-green-950 tracking-tight mb-1 truncate group-hover:text-brand-600 transition-colors">
                          {product.name}
                        </h4>
                        <p className="text-brand-600 font-black text-sm mb-3">KES {product.price}</p>
                        <Link
                          href={hasHydrated && isAuthenticated ? `/market/${product.trader?.market_id}` : "/login"}
                          className="inline-flex w-full items-center justify-center gap-2 py-2 bg-green-50 text-brand-700 rounded-xl font-bold text-xs hover:bg-brand-600 hover:text-white transition-colors"
                        >
                          Reserve Now
                        </Link>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Popular Products - Masonry-style Grid */}
            {popularProducts.length > 0 && (
              <motion.div 
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
                className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8"
              >
                {popularProducts.map((product) => (
                  <motion.div variants={itemVariants} key={`popular-${product.id}`} className="group flex flex-col bg-white border border-gray-100 rounded-[32px] overflow-hidden hover:shadow-2xl hover:shadow-gray-200/50 hover:-translate-y-1 transition-all duration-500">
                    <div className="aspect-[4/5] bg-gray-50 relative overflow-hidden">
                      {product.image_url ? (
                        <Image
                          src={product.image_url}
                          alt={product.name}
                          fill
                          className="object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-200">
                          <ShoppingBag size={48} />
                        </div>
                      )}
                      
                      {/* Price Badge */}
                      <div className="absolute top-4 right-4">
                        <div className="px-3 py-1.5 bg-white/95 backdrop-blur-md rounded-xl text-xs font-black uppercase tracking-widest text-green-950 shadow-sm border border-white/20">
                          KES {product.price}
                        </div>
                      </div>

                      {/* Quick Action Overlay */}
                      <div className="absolute inset-x-4 bottom-4 translate-y-12 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                        <Link
                          href={hasHydrated && isAuthenticated ? `/market/${product.trader?.market_id}` : "/login"}
                          className="w-full bg-brand-600 text-white py-3 rounded-xl flex items-center justify-center gap-2 font-bold shadow-lg hover:bg-brand-500 transition-colors"
                        >
                          <ShoppingBag size={18} />
                          Quick Reserve
                        </Link>
                      </div>
                    </div>

                    <div className="p-6">
                      <div className="flex items-center gap-2 mb-3">
                        <Tag size={12} className="text-brand-500" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                          {product.category?.name || 'General'}
                        </span>
                      </div>
                      <h3 className="font-display text-lg font-black text-green-950 tracking-tight mb-4 group-hover:text-brand-600 transition-colors line-clamp-1">
                        {product.name}
                      </h3>

                      <div className="flex items-center gap-3 pt-4 border-t border-gray-50">
                        <div className="w-8 h-8 bg-brand-50 rounded-full flex items-center justify-center text-brand-600">
                          <Store size={14} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-gray-600 truncate max-w-[120px]">
                            {product.trader?.business_name || 'Trader'}
                          </span>
                          <span className="text-[10px] text-gray-400 font-medium">Verified Seller</span>
                        </div>
                      </div>
                    </div>
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
