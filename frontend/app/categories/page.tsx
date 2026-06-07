'use client';

import React from 'react';
import Link from 'next/link';
import { motion, Variants } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Category, ApiResponse } from '@/types';
import * as Icons from 'lucide-react';
import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';

export default function AllCategoriesPage() {
  const { data: response, isLoading } = useQuery<ApiResponse<Category[]>>({
    queryKey: ['categories'],
    queryFn: () => api.get('/categories'),
  });

  const categories = response?.data || [];

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

  const getIcon = (name?: string) => {
    if (!name) return <Icons.ShoppingBag size={24} />;
    const IconComponent = (Icons as any)[name];
    return IconComponent ? <IconComponent size={24} /> : <Icons.ShoppingBag size={24} />;
  };

  return (
    <div className="w-full block relative bg-surface-base text-text-primary z-0 min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 py-16 px-6 bg-white">
        <div className="max-w-7xl mx-auto mt-10">
          <div className="mb-12">
            <Link href="/" className="text-brand-600 font-bold flex items-center gap-2 mb-4 hover:opacity-80">
              <Icons.ArrowLeft size={16} /> Back to Home
            </Link>
            <h1 className="font-display text-4xl md:text-5xl font-[1000] text-green-950 tracking-tighter">
              All Categories
            </h1>
            <p className="text-gray-500 mt-2 font-medium">Browse our full marketplace directory.</p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {[...Array(18)].map((_, i) => (
                <div key={i} className="aspect-square bg-gray-50 rounded-3xl animate-pulse" />
              ))}
            </div>
          ) : (
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="visible"
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
                    className="group flex flex-col items-center justify-center p-8 bg-surface-base border border-gray-100 rounded-[32px] hover:bg-white hover:shadow-xl hover:shadow-brand-500/10 hover:border-brand-100 transition-all duration-300 h-full"
                  >
                    <div 
                      className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6"
                      style={{ 
                        backgroundColor: cat.color ? `${cat.color}15` : '#1B6B3A15', 
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
      </main>

      <Footer />
    </div>
  );
}
