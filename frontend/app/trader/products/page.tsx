'use client';

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { 
    Plus, 
    Package, 
    MoreVertical, 
    CheckCircle2, 
    XCircle, 
    AlertTriangle,
    Loader2
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import BottomNav from '@/components/shared/BottomNav';
import { ApiResponse } from '@/types';

interface Product {
    id: number;
    name: string;
    price: string;
    unit: string;
    stock_status: 'available' | 'low' | 'out_of_stock';
    image_url: string;
    category: { name: string };
}

export default function ProductListPage() {
    const router = useRouter();
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery<ApiResponse<{ data: Product[] }>>({
        queryKey: ['my-products'],
        queryFn: () => api.get('/products'),
    });

    const toggleStatusMutation = useMutation({
        mutationFn: ({ id, status }: { id: number, status: string }) => 
            api.patch(`/products/${id}/status`, { stock_status: status }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my-products'] });
        }
    });

    const products = data?.data?.data || [];

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen">
                <Loader2 className="animate-spin text-brand-600" size={40} />
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-surface-base pb-32">
            <header className="p-6 pt-12 flex justify-between items-center sticky top-0 bg-surface-base/80 backdrop-blur-md z-10 border-b border-border-default">
                <div>
                    <h1 className="text-2xl font-black text-green-950">Bidhaa Zangu</h1>
                    <p className="text-xs text-text-muted font-bold uppercase tracking-wider">My Products ({products.length})</p>
                </div>
                <button 
                    onClick={() => router.push('/trader/products/add')}
                    className="w-12 h-12 bg-brand-600 rounded-2xl flex items-center justify-center text-white shadow-brand-md active:scale-95 transition-all"
                    aria-label="Ongeza bidhaa mpya (Add new product)"
                    title="Ongeza bidhaa"
                >
                    <Plus size={24} />
                </button>
            </header>

            <div className="p-6 space-y-4">
                {products.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                        <div className="w-20 h-20 bg-neutral-100 rounded-full flex items-center justify-center text-text-muted">
                            <Package size={40} />
                        </div>
                        <div>
                            <p className="font-bold text-green-950">Huna bidhaa zozote bado</p>
                            <p className="text-sm text-text-muted mt-1">Gusa &quot;+&quot; hapo juu ili kuongeza bidhaa yako ya kwanza.</p>
                        </div>
                    </div>
                ) : (
                    products.map((product: Product) => (
                        <div key={product.id} className="card p-3 flex gap-4 hover:shadow-brand-md transition-all">
                            <div className="w-24 h-24 bg-neutral-100 rounded-xl overflow-hidden relative shadow-inner grow-0 shrink-0">
                                {product.image_url ? (
                                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-text-muted">
                                        <Package size={32} />
                                    </div>
                                )}
                                <div className="absolute top-1 left-1">
                                    {product.stock_status === 'available' && <CheckCircle2 size={16} className="text-success fill-white" />}
                                    {product.stock_status === 'low' && <AlertTriangle size={16} className="text-warning fill-white" />}
                                    {product.stock_status === 'out_of_stock' && <XCircle size={16} className="text-error fill-white" />}
                                </div>
                            </div>
                            
                            <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                                <div>
                                    <div className="flex justify-between items-start">
                                        <h3 className="font-bold text-green-950 truncate pr-2">{product.name}</h3>
                                        <button 
                                            className="text-text-muted p-1 -mt-1"
                                            aria-label="Chaguzi zaidi (More options)"
                                            title="Chaguzi zaidi"
                                        >
                                            <MoreVertical size={18} />
                                        </button>
                                    </div>
                                    <p className="text-xs text-brand-600 font-bold mt-0.5">{product.category?.name || 'Category'}</p>
                                </div>
                                
                                <div className="flex justify-between items-end">
                                    <div className="font-mono text-lg font-black text-green-900">
                                        <span className="text-xs font-bold mr-0.5 text-text-muted">KES</span>
                                        {product.price}
                                        <span className="text-[10px] lowercase text-text-muted ml-1">/{product.unit}</span>
                                    </div>
                                    
                                    <select 
                                        defaultValue={product.stock_status}
                                        onChange={(e) => toggleStatusMutation.mutate({ id: product.id, status: e.target.value })}
                                        className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border-2 appearance-none transition-all cursor-pointer ${
                                            product.stock_status === 'available' ? 'border-brand-500 bg-brand-50 text-brand-700' : 
                                            product.stock_status === 'low' ? 'border-amber-500 bg-amber-50 text-amber-700' : 
                                            'border-error bg-error-bg text-color-error-dark'
                                        }`}
                                        aria-label="Badilisha hali ya akiba (Change stock status)"
                                        title="Hali ya akiba"
                                    >
                                        <option value="available">In Stock</option>
                                        <option value="low">Low stock</option>
                                        <option value="out_of_stock">Out</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <BottomNav />
        </div>
    );
}
