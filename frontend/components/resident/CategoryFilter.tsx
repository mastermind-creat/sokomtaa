"use client";

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { ApiResponse } from '@/types';

interface Category {
    id: number;
    name: string;
    name_sw: string;
    icon: string;
    color: string;
}

interface CategoryFilterProps {
    onSelectCategory: (categoryId: number | null) => void;
    selectedCategoryId: number | null;
}

const ICON_TO_EMOJI: Record<string, string> = {
    'Beef': '🥩',
    'Apple': '🍎',
    'Fish': '🐟',
    'Wheat': '🌾',
    'Leaf': '🥬',
    'Carrot': '🥕',
    'Shirt': '👕',
    'ShoppingBag': '🛍️',
    'Smartphone': '📱',
    'Heart': '❤️',
    'Coffee': '☕',
    'Tag': '🏷️'
};

export default function CategoryFilter({ onSelectCategory, selectedCategoryId }: CategoryFilterProps) {
    const { data: catData, isLoading } = useQuery<ApiResponse<Category[]>>({
        queryKey: ['categories'],
        queryFn: () => api.get('/categories'),
    });

    const categories = catData?.data || [];

    if (isLoading) {
        const dummySkeletons = [
            { emoji: '🥬', color: '#22A34A' },
            { emoji: '🍎', color: '#EF4444' },
            { emoji: '🐟', color: '#3B82F6' },
            { emoji: '🌾', color: '#F59E0B' }
        ];
        
        return (
            <div className="flex gap-4 overflow-x-auto px-6 py-2 no-scrollbar animate-pulse">
                {dummySkeletons.map((dummy, idx) => (
                    <div key={idx} className="flex flex-col items-center gap-2 min-w-[72px]">
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center relative overflow-hidden">
                           <div className="absolute inset-0" style={{ backgroundColor: dummy.color, opacity: 0.15 }} />
                           <span className="relative z-10 text-2xl opacity-50">{dummy.emoji}</span>
                        </div>
                        <div className="w-12 h-3 bg-neutral-200 rounded-md"></div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="flex gap-4 overflow-x-auto px-6 py-2 no-scrollbar snap-x snap-mandatory">
            <button 
                onClick={() => onSelectCategory(null)}
                className={`flex flex-col items-center gap-1.5 min-w-[64px] snap-center transition-all ${selectedCategoryId === null ? 'scale-105 opacity-100' : 'opacity-60 hover:opacity-100'}`}
            >
                <div 
                    className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all relative overflow-hidden shadow-sm"
                    style={{ borderColor: selectedCategoryId === null ? 'transparent' : '#F3F4F6', borderWidth: selectedCategoryId === null ? 0 : 2 }}
                >
                    <div 
                        className="absolute inset-0"
                        style={{
                            backgroundColor: '#1B6B3A', 
                            opacity: selectedCategoryId === null ? 1 : 0.08
                        }}
                    />
                    <span 
                        className={`relative z-10 text-xl filter drop-shadow-sm ${selectedCategoryId === null ? 'brightness-0 invert' : ''}`}
                    >
                        ✨
                    </span>
                </div>
                <span className={`text-[10px] font-black uppercase tracking-widest ${selectedCategoryId === null ? 'text-brand-700' : 'text-text-muted'}`}>All</span>
            </button>

            {categories.map((cat) => {
                const emoji = ICON_TO_EMOJI[cat.icon] || '🏷️';
                const isSelected = selectedCategoryId === cat.id;

                return (
                    <button 
                        key={cat.id}
                        onClick={() => onSelectCategory(cat.id)}
                        className={`flex flex-col items-center gap-1.5 min-w-[64px] snap-center transition-all ${isSelected ? 'scale-105 opacity-100' : 'opacity-60 hover:opacity-100'}`}
                    >
                        <div 
                            className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all relative overflow-hidden shadow-sm"
                            style={{ borderColor: isSelected ? 'transparent' : '#F3F4F6', borderWidth: isSelected ? 0 : 2 }}
                        >
                            <div 
                                className="absolute inset-0"
                                style={{
                                    backgroundColor: cat.color || '#F5A623',
                                    opacity: isSelected ? 1 : 0.1
                                }}
                            />
                            <span 
                                className={`relative z-10 text-xl filter drop-shadow-sm ${isSelected ? 'brightness-110 saturate-150' : ''}`}
                            >
                                {emoji}
                            </span>
                        </div>
                        <span className={`text-[10px] font-black uppercase tracking-widest truncate w-full text-center px-1 ${isSelected ? 'text-brand-700' : 'text-text-muted'}`}>
                            {cat.name}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}
