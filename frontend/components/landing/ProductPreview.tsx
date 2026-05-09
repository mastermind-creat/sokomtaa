'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Product, ApiResponse } from '@/types';
import { ShoppingBag, ArrowRight, Tag, Store } from 'lucide-react';

export const ProductPreview = () => {
  const [hasHydrated, setHasHydrated] = React.useState(false);
  const { isAuthenticated } = useAuthStore();

  React.useEffect(() => {
    setHasHydrated(true);
  }, []);

  const { data: response, isLoading } = useQuery<ApiResponse<{ popular_products: Product[] }>>({
    queryKey: ['recommendations'],
    queryFn: () => api.get('/recommendations').then(res => res.data),
  });

  const products = response?.data?.popular_products || [];

  return (
    <section id="product-preview" className="py-24 px-6 bg-surface-base">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <p className="text-brand-600 font-black uppercase tracking-widest text-sm mb-4">Marketplace</p>
            <h2 className="font-display text-4xl md:text-5xl font-[1000] text-green-950 tracking-tighter">
              Trending Products
            </h2>
            <p className="mt-4 text-gray-500 font-medium max-w-xl">
              Discover what&apos;s fresh and popular in your local markets right now.
            </p>
          </div>
          <Link
            href={hasHydrated && isAuthenticated ? "/search" : "/login"}
            className="inline-flex items-center gap-2 text-brand-600 font-black uppercase tracking-widest text-xs group transition-all"
          >
            Explore All Products
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="aspect-[3/4] bg-gray-100 animate-pulse rounded-[32px]" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[40px] border border-gray-100">
            <ShoppingBag size={48} className="mx-auto text-gray-200 mb-4" />
            <p className="font-bold text-gray-400">No trending products found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
            {products.map((product) => (
              <div key={product.id} className="group flex flex-col bg-white border border-gray-100 rounded-[32px] overflow-hidden hover:shadow-2xl hover:shadow-gray-200/50 transition-all duration-500">
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
                      <ShoppingBag size={48} />
                    </div>
                  )}
                  <div className="absolute top-4 right-4">
                    <div className="px-3 py-1 bg-white/90 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest text-green-950 shadow-sm">
                      KES {product.price}
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Tag size={12} className="text-brand-600" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                      {product.category?.name || 'General'}
                    </span>
                  </div>
                  <h3 className="font-display text-lg font-black text-green-950 tracking-tight mb-4 group-hover:text-brand-600 transition-colors line-clamp-1">
                    {product.name}
                  </h3>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-brand-50 rounded-lg flex items-center justify-center">
                        <Store size={12} className="text-brand-600" />
                      </div>
                      <span className="text-[10px] font-bold text-gray-500 truncate max-w-[80px]">
                        {product.trader?.business_name || 'Trader'}
                      </span>
                    </div>
                    <Link
                      href={hasHydrated && isAuthenticated ? `/market/${product.trader?.market_id}` : "/login"}
                      className="w-10 h-10 bg-brand-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-brand-600/20 hover:bg-brand-700 transition-colors"
                    >
                      <ShoppingBag size={18} />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
