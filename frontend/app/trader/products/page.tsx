'use client';

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { 
    Plus, 
    Search, 
    Filter, 
    TrendingUp, 
    Package, 
    AlertTriangle, 
    XCircle,
    ArrowRight,
    LayoutGrid,
    Inbox,
    Zap,
    Loader2
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ApiResponse, Product, Category } from '@/types';
import { useUIStore } from '@/store/uiStore';
import { StatCard } from '@/components/admin/StatCard';
import TraderProductCard from '@/components/trader/TraderProductCard';
import ProductSkeleton from '@/components/trader/ProductSkeleton';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useMpesa } from '@/hooks/useMpesa';
import { useAuthStore } from '@/store/authStore';

export default function ProductListPage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { setPageTitle } = useUIStore();

    // Filters State
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [boostingId, setBoostingId] = useState<number | null>(null);
    const { user } = useAuthStore();
    const { initiateStk, isPolling, status } = useMpesa();

    React.useEffect(() => {
        setPageTitle('Inventory & Stock');
    }, [setPageTitle]);

    // Fetch Products
    const { data: response, isLoading } = useQuery<ApiResponse<{ data: Product[] }>>({
        queryKey: ['my-products'],
        queryFn: () => api.get('/products'),
    });

    // Fetch Categories for filtering
    const { data: catResponse } = useQuery<ApiResponse<Category[]>>({
        queryKey: ['categories'],
        queryFn: () => api.get('/categories'),
    });

    // Handle both wrapped and unwrapped data formats
    const rawProducts = Array.isArray(response) ? response : (response?.data?.data || response?.data || []);
    const categories = Array.isArray(catResponse) ? catResponse : (catResponse?.data || []);

    // Mutation: Toggle Status
    const toggleStatusMutation = useMutation({
        mutationFn: ({ id, status }: { id: number, status: string }) => 
            api.patch(`/products/${id}/status`, { stock_status: status }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my-products'] });
        }
    });

    // Mutation: Delete
    const deleteMutation = useMutation({
        mutationFn: (id: number) => api.delete(`/products/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my-products'] });
            alert('Product deleted successfully');
        },
        onError: (error: any) => {
            alert(`Error: ${error.message || 'Failed to delete product'}`);
        }
    });

    // Mutation: Boost Product
    const handleBoost = async (id: number) => {
        if (!user?.phone) {
            alert('Please verify your phone number first');
            return;
        }
        
        setBoostingId(id);
        try {
            await initiateStk(user.phone, 'product_boost', id);
        } catch (err: any) {
            alert(err.message || 'Failed to initiate boost payment');
            setBoostingId(null);
        }
    };

    // Watch for boost success
    React.useEffect(() => {
        if (status === 'completed' && boostingId) {
            queryClient.invalidateQueries({ queryKey: ['my-products'] });
            alert('Product boosted successfully! It will now appear at the top for the next 24 hours.');
            setBoostingId(null);
        }
    }, [status, boostingId, queryClient]);

    // Filtering Logic
    const filteredProducts = useMemo(() => {
        return rawProducts.filter((p: Product) => {
            const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === 'all' || p.stock_status === statusFilter;
            const matchesCategory = categoryFilter === 'all' || String(p.category_id) === categoryFilter;
            return matchesSearch && matchesStatus && matchesCategory;
        });
    }, [rawProducts, searchTerm, statusFilter, categoryFilter]);

    // Stats Logic
    const stats = useMemo(() => {
        return {
            total: rawProducts.length,
            low: rawProducts.filter((p: Product) => p.stock_status === 'low').length,
            out: rawProducts.filter((p: Product) => p.stock_status === 'out_of_stock').length,
        };
    }, [rawProducts]);

    return (
        <div className="flex flex-col min-h-screen bg-[#FAFAF8] pb-32 max-w-[1600px] mx-auto w-full px-4 md:px-8 pt-6">
            
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8 lg:mb-12">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <LayoutGrid className="text-brand-600" size={20} />
                        <h1 className="text-3xl font-black text-green-950 tracking-tight">Inventory & Stock</h1>
                    </div>
                    <p className="text-text-secondary font-medium">Manage your products, prices, and inventory levels.</p>
                </div>

                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => router.push('/trader/products/add')}
                        className="flex-1 lg:flex-none h-14 px-8 bg-brand-600 text-white font-black text-sm uppercase tracking-widest rounded-2xl hover:bg-brand-700 transition-all shadow-lg shadow-brand-900/10 active:scale-95 flex items-center justify-center gap-3"
                    >
                        <Plus size={20} strokeWidth={3} />
                        Add Product
                    </button>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                <StatCard 
                    title="Total Items" 
                    value={stats.total} 
                    icon={Package} 
                    color="bg-brand-600" 
                    variant="compact"
                />
                <StatCard 
                    title="Low Stock" 
                    value={stats.low} 
                    icon={AlertTriangle} 
                    color="bg-amber-500" 
                    variant="compact"
                />
                <StatCard 
                    title="Out of Stock" 
                    value={stats.out} 
                    icon={XCircle} 
                    color="bg-rose-500" 
                    variant="compact"
                />
                <div className="hidden lg:block">
                    <StatCard 
                        title="In Stock" 
                        value={stats.total - stats.low - stats.out} 
                        icon={TrendingUp} 
                        color="bg-emerald-600" 
                        variant="compact"
                    />
                </div>
            </div>

            {/* Filters Bar */}
            <div className="bg-white rounded-3xl p-4 md:p-6 shadow-sm border border-neutral-100 mb-8 flex flex-col md:flex-row items-center gap-4">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={20} />
                    <input 
                        type="text"
                        placeholder="Search products by name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full h-12 pl-12 pr-4 bg-neutral-50 border-none rounded-2xl text-sm font-bold text-green-950 placeholder:text-neutral-400 focus:ring-2 ring-brand-500 transition-all"
                    />
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 no-scrollbar">
                    <div className="flex items-center gap-2 bg-neutral-50 p-1 rounded-2xl border border-neutral-100 shrink-0">
                        {['all', 'available', 'low', 'out_of_stock'].map((s) => (
                            <button
                                key={s}
                                onClick={() => setStatusFilter(s)}
                                className={cn(
                                    "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                    statusFilter === s 
                                        ? "bg-white text-brand-700 shadow-sm" 
                                        : "text-text-muted hover:text-green-950"
                                )}
                            >
                                {s === 'out_of_stock' ? 'Out' : s}
                            </button>
                        ))}
                    </div>

                    <select 
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="h-12 px-4 bg-neutral-50 border-none rounded-2xl text-xs font-black uppercase tracking-widest text-text-secondary outline-none cursor-pointer hover:bg-neutral-100 transition-all shrink-0"
                    >
                        <option value="all">All Categories</option>
                        {categories.map((cat: Category) => (
                            <option key={cat.id} value={String(cat.id)}>{cat.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Products Grid */}
            {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <ProductSkeleton key={i} />
                    ))}
                </div>
            ) : filteredProducts.length === 0 ? (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center py-32 text-center space-y-6 bg-white rounded-[3rem] border border-dashed border-neutral-200"
                >
                    <div className="w-24 h-24 bg-neutral-50 rounded-full flex items-center justify-center text-neutral-300">
                        <Inbox size={48} strokeWidth={1} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-green-950">No products found</h3>
                        <p className="text-sm text-text-muted mt-2 max-w-xs mx-auto font-medium">
                            {searchTerm || statusFilter !== 'all' || categoryFilter !== 'all' 
                                ? "Try adjusting your filters or search terms." 
                                : "You haven't added any products yet. Start by adding your first item!"}
                        </p>
                    </div>
                    {!(searchTerm || statusFilter !== 'all' || categoryFilter !== 'all') && (
                        <button 
                            onClick={() => router.push('/trader/products/add')}
                            className="px-8 py-4 bg-brand-600 text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-lg shadow-brand-500/20 active:scale-95 transition-all flex items-center gap-2"
                        >
                            <Plus size={18} strokeWidth={3} />
                            Add First Product
                        </button>
                    )}
                </motion.div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    <AnimatePresence mode="popLayout">
                        {filteredProducts.map((product: Product) => (
                            <TraderProductCard 
                                key={product.id}
                                product={product}
                                onEdit={(p) => router.push(`/trader/products/${p.id}/edit`)}
                                onDelete={(id) => {
                                    if (confirm('Are you sure you want to delete this product?')) {
                                        deleteMutation.mutate(id);
                                    }
                                }}
                                onToggleStatus={(id, status) => toggleStatusMutation.mutate({ id, status })}
                                onBoost={handleBoost}
                                isUpdating={toggleStatusMutation.isPending && toggleStatusMutation.variables?.id === product.id}
                                isBoosting={boostingId === product.id && isPolling}
                            />
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {/* Mobile Sticky Add Button */}
            <div className="lg:hidden fixed bottom-24 right-6 z-30">
                <button 
                    onClick={() => router.push('/trader/products/add')}
                    className="w-16 h-16 bg-brand-600 rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-brand-900/40 active:scale-90 transition-all"
                >
                    <Plus size={32} strokeWidth={3} />
                </button>
            </div>
        </div>
    );
}
