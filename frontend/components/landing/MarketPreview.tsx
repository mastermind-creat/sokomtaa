'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

interface Market {
  id: number;
  name: string;
  location: string;
  estate: string;
  description: string;
  banner_url: string;
  icon_url: string;
  traders_count: number;
  is_active: boolean;
}

export const MarketPreview = () => {
  const [activeTab, setActiveTab] = useState('all');

  const { data: markets, isLoading, error } = useQuery({
    queryKey: ['markets'],
    queryFn: async () => {
      const response = await api.get('/markets');
      return response.data;
    }
  });

  const handleMarketClick = (e: React.MouseEvent) => {
    // For now, any click on "View Traders" or the card redirects to login as requested
    // except if we want them to see the market details (but the user said redirect to login page)
  };

  const CATEGORIES = [
    { id: 'all', label: 'All Markets' },
    { id: 'nairobi', label: 'Nairobi' },
    { id: 'mombasa', label: 'Mombasa' },
    { id: 'kisumu', label: 'Kisumu' },
  ];

  return (
    <section id="market-preview" className="py-24 px-6 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-brand-600 font-black uppercase tracking-widest text-sm mb-4">Discovery</p>
          <h2 className="font-display text-4xl md:text-5xl font-[1000] text-green-950 tracking-tighter">
            Available Markets
          </h2>
          <p className="mt-4 text-gray-500 font-medium max-w-2xl mx-auto">
            Explore and enter your neighbourhood market to start shopping from local traders.
          </p>
        </div>

        <div className="bg-gray-50 rounded-[40px] border border-gray-100 p-4 md:p-8 shadow-2xl shadow-gray-200/50">
          <div className="flex flex-col lg:flex-row gap-12">
            {/* Sidebar / Filters */}
            <div className="lg:w-64 flex-shrink-0">
              <div className="sticky top-24 space-y-8">
                <div>
                  <h4 className="font-black text-green-950 uppercase tracking-widest text-xs mb-6">Region</h4>
                  <div className="flex flex-col gap-2">
                    {CATEGORIES.map(cat => (
                      <button 
                        key={cat.id}
                        onClick={() => setActiveTab(cat.id)}
                        className={`text-left px-5 py-3 rounded-xl font-bold text-sm transition-all duration-200 ${
                          activeTab === cat.id 
                            ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/20 translate-x-1' 
                            : 'text-gray-500 hover:bg-gray-100'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-6 bg-brand-50 rounded-2xl border border-brand-100/50">
                  <div className="font-black text-brand-700 text-xs uppercase tracking-wider mb-2">Platform Stats</div>
                  <div className="text-2xl font-black text-green-950">{markets?.length || 0} Markets</div>
                  <div className="text-xs font-bold text-brand-600/60 mt-1">Live and active</div>
                </div>
              </div>
            </div>

            {/* Markets Grid */}
            <div className="flex-1">
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-80 bg-gray-100 animate-pulse rounded-[32px]" />
                  ))}
                </div>
              ) : error ? (
                <div className="p-12 text-center bg-red-50 rounded-[32px] border border-red-100">
                  <p className="font-bold text-red-600">Failed to load markets. Please check if the API is running.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-8">
                  {markets?.map((market: Market) => (
                    <div key={market.id} className="group flex flex-col bg-white border border-gray-100 rounded-[40px] overflow-hidden hover:shadow-2xl hover:shadow-gray-200/50 transition-all duration-500 relative">
                      <div className="h-56 bg-gray-200 relative overflow-hidden">
                        {market.banner_url ? (
                          <img 
                            src={market.banner_url} 
                            alt={market.name} 
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-green-900 to-green-700 flex items-center justify-center">
                            <span className="text-white font-black text-4xl opacity-20">{market.name.charAt(0)}</span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
                          <div>
                            <div className="px-3 py-1 bg-brand-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full mb-2 inline-block">
                              {market.estate}
                            </div>
                            <h3 className="font-display text-2xl font-black text-white tracking-tighter">
                              {market.name}
                            </h3>
                          </div>
                          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-xl">
                            {market.icon_url ? (
                                <img src={market.icon_url} alt="" className="w-6 h-6" />
                            ) : (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#166534" strokeWidth="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-8">
                        <p className="text-gray-500 font-medium text-sm leading-relaxed mb-8 h-10 overflow-hidden line-clamp-2">
                          {market.description}
                        </p>
                        
                        <div className="flex items-center justify-between pt-6 border-t border-gray-50">
                          <div className="flex items-center gap-2 font-black text-green-950 text-sm italic">
                            <span className="text-brand-600">{market.traders_count || 0}</span> Verified Traders
                          </div>
                          <Link 
                            href="/login" 
                            className="inline-flex items-center gap-2 px-6 py-3 bg-brand-600 text-white font-black text-sm rounded-xl shadow-lg shadow-brand-600/20 hover:bg-brand-700 transition-all"
                          >
                            Enter Market
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* "View All" placeholder card as requested */}
                  <Link href="/login" className="group p-8 border-4 border-dashed border-gray-200 rounded-[40px] flex flex-col items-center justify-center text-center hover:border-brand-600 transition-all gap-4 min-h-[400px]">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 group-hover:bg-brand-50 group-hover:text-brand-600 transition-colors">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                    </div>
                    <div className="font-black text-xl text-green-950">View all {markets?.length || 'available'} markets</div>
                    <p className="text-sm font-medium text-gray-400">Login to browse the full directory of Kenyan markets</p>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
