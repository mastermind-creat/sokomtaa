'use client';

import React from 'react';
import Link from 'next/link';
import { motion, Variants } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Category, ApiResponse } from '@/types';
import * as Icons from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export const CategoryGrid = () => {
  const { data: response, isLoading } = useQuery<ApiResponse<Category[]>>({
    queryKey: ['categories'],
    queryFn: () => api.get('/categories'),
  });

  const categories = (response?.data || []).slice(0, 6);

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1, 
      transition: { staggerChildren: 0.05 } 
    }
  };

  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1, 
      transition: { type: "spring", stiffness: 120, damping: 12 } 
    }
  };

  // Helper to get icon component from string name
  const getIcon = (name?: string) => {
    if (!name) return <Icons.ShoppingBag size={24} />;
    const IconComponent = (Icons as any)[name];
    return IconComponent ? <IconComponent size={24} /> : <Icons.ShoppingBag size={24} />;
  };

  return (
    <section id="categories" className="py-16 px-6 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <p className="text-brand-600 font-black uppercase tracking-widest text-xs mb-3">Quick Discovery</p>
            <h2 className="font-display text-3xl md:text-4xl font-[1000] text-green-950 tracking-tighter">
              Browse by Category
            </h2>
          </div>
          <Link 
            href="/categories" 
            className="text-brand-600 font-black uppercase tracking-widest text-xs hover:opacity-70 transition-opacity flex items-center gap-2"
          >
            View All Categories <Icons.ArrowRight size={14} />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="aspect-square bg-gray-50 rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6"
          >
            {categories.map((cat) => (
              <motion.div 
                key={cat.id} 
                variants={itemVariants}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
              >
                <Link 
                  href={`/resident/search?category=${cat.id}`}
                  className="group flex flex-col items-center justify-center p-8 bg-gradient-to-br from-white to-gray-50 border border-gray-100/80 shadow-sm rounded-[32px] hover:-translate-y-1 hover:shadow-xl hover:shadow-brand-500/15 hover:border-brand-200 transition-all duration-300 relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-brand-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div 
                    className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6 relative z-10 bg-white shadow-sm border border-gray-100"
                    style={{ 
                      color: cat.color || '#1B6B3A' 
                    }}
                  >
                    {getIcon(cat.icon)}
                  </div>
                  <h3 className="font-bold text-green-950 text-sm text-center group-hover:text-brand-600 transition-colors line-clamp-1">
                    {cat.name}
                  </h3>
                  <span className="text-[10px] font-medium text-gray-400 mt-1">
                    {cat.name_sw}
                  </span>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </section>
  );
};
