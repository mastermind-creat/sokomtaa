'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Trash2, Save, AlertTriangle } from 'lucide-react';
import api from '@/lib/api';
import { ApiResponse } from '@/types';

import { useUIStore } from '@/store/uiStore';
import { useTranslation } from '@/hooks/useTranslation';

interface Product {
    id: number;
    name: string;
    name_sw: string | null;
    description: string | null;
    price: string;
    unit: string;
    stock_status: 'available' | 'low' | 'out_of_stock';
    stock_quantity: number | null;
    is_active: boolean;
    category_id: number;
    image_url: string | null;
}

interface Category { id: number; name: string; }

const UNITS = ['piece', 'kg', 'bunch', 'litre', 'bag', 'tray', 'box', 'dozen'];
const STOCK_STATUSES = [
    { value: 'available', label: 'Available' },
    { value: 'low', label: 'Running Low' },
    { value: 'out_of_stock', label: 'Out of Stock' },
];

function Field({ label, id, children }: { label: string; id: string; children: React.ReactNode }) {
    return (
        <div>
            <label htmlFor={id} className="block text-sm font-bold text-text-primary mb-2">{label}</label>
            {children}
        </div>
    );
}

export default function EditProductPage() {
    const params = useParams();
    const router = useRouter();
    const queryClient = useQueryClient();
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const { setPageTitle } = useUIStore();

    React.useEffect(() => {
        if (product) {
            setPageTitle(`Edit: ${product.name}`);
        } else {
            setPageTitle('Edit Product');
        }
    }, [product, setPageTitle]);

    const { data: product, isLoading } = useQuery({
        queryKey: ['product', params.id],
        queryFn: async () => {
            const res = await api.get<never, ApiResponse<Product>>(`/products/${params.id}`);
            return res.data;
        },
    });

    const { data: categories = [] } = useQuery({
        queryKey: ['categories'],
        queryFn: async () => {
            const res = await api.get<never, ApiResponse<Category[]>>('/categories');
            return res.data as Category[];
        },
    });

    const [form, setForm] = useState<Partial<Product>>({});
    const current = { ...product, ...form } as Product;
    const set = (k: keyof Product, v: string | number | boolean | null) => setForm(f => ({ ...f, [k]: v }));

    const { mutate: saveProduct, isPending: isSaving } = useMutation({
        mutationFn: (data: Partial<Product>) => api.put(`/products/${params.id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['trader-products'] });
            router.push('/trader/products');
        },
    });

    const { mutate: deleteProduct, isPending: isDeleting } = useMutation({
        mutationFn: () => api.delete(`/products/${params.id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['trader-products'] });
            router.push('/trader/products');
        },
    });

    if (isLoading || !product) {
        return (
            <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
                {[1, 2, 3].map(i => <div key={i} className="h-32 bg-gray-100 rounded-2xl animate-pulse" />)}
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-5 pb-10">
                {/* Header */}
                {/* Header Back Button */}
                <div className="flex items-center">
                    <button onClick={() => router.back()} className="p-2 rounded-xl hover:bg-white transition-colors bg-white/50 backdrop-blur-sm border border-gray-100 shadow-sm grow-0">
                        <ArrowLeft className="w-5 h-5 text-text-secondary" />
                    </button>
                </div>

                {/* Basic Info */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
                    <h2 className="text-sm font-black text-text-primary uppercase tracking-wider">Product Info</h2>
                    <Field label="Product Name (English)" id="name">
                        <input id="name" type="text" value={current.name ?? ''} onChange={e => set('name', e.target.value)}
                            className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                    </Field>
                    <Field label="Jina (Kiswahili) — optional" id="nameSw">
                        <input id="nameSw" type="text" value={current.name_sw ?? ''} onChange={e => set('name_sw', e.target.value)}
                            placeholder="Optional Swahili name"
                            className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                    </Field>
                    <Field label="Description" id="desc">
                        <textarea id="desc" rows={3} value={current.description ?? ''} onChange={e => set('description', e.target.value)}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                    </Field>
                    <Field label="Category" id="category">
                        <select id="category" title="Product category" aria-label="Select product category"
                            value={current.category_id ?? ''} onChange={e => set('category_id', parseInt(e.target.value))}
                            className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </Field>
                </div>

                {/* Pricing */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
                    <h2 className="text-sm font-black text-text-primary uppercase tracking-wider">Pricing</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <Field label="Price (KES)" id="price">
                            <input id="price" type="number" min="0" value={current.price ?? ''} onChange={e => set('price', e.target.value)}
                                className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                        </Field>
                        <Field label="Unit" id="unit">
                            <select id="unit" title="Unit of measurement" aria-label="Select unit of measurement"
                                value={current.unit ?? 'piece'} onChange={e => set('unit', e.target.value)}
                                className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                            </select>
                        </Field>
                    </div>
                </div>

                {/* Stock */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
                    <h2 className="text-sm font-black text-text-primary uppercase tracking-wider">Stock</h2>
                    <Field label="Stock Status" id="stockStatus">
                        <div className="grid grid-cols-3 gap-2">
                            {STOCK_STATUSES.map(s => (
                                <button key={s.value} onClick={() => set('stock_status', s.value as Product['stock_status'])}
                                    className={`py-2.5 text-xs font-bold rounded-xl border-2 transition-all ${
                                        current.stock_status === s.value
                                            ? s.value === 'available' ? 'border-green-500 bg-green-50 text-green-700'
                                                : s.value === 'low' ? 'border-amber-500 bg-amber-50 text-amber-700'
                                                : 'border-red-500 bg-red-50 text-red-700'
                                            : 'border-gray-200 text-text-secondary hover:border-gray-300'
                                    }`}>
                                    {s.label}
                                </button>
                            ))}
                        </div>
                    </Field>
                    <Field label="Quantity (optional)" id="qty">
                        <input id="qty" type="number" min="0" value={current.stock_quantity ?? ''} onChange={e => set('stock_quantity', e.target.value ? parseInt(e.target.value) : null)}
                            placeholder="Leave blank if not tracking"
                            className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                    </Field>
                    <div className="flex items-center justify-between py-2">
                        <div>
                            <p className="text-sm font-semibold text-text-primary">Show on profile</p>
                            <p className="text-xs text-text-muted">Hidden products won't appear to customers</p>
                        </div>
                        <button
                            onClick={() => set('is_active', !current.is_active)}
                            className={`relative w-12 h-6 rounded-full transition-colors ${current.is_active ? 'bg-primary' : 'bg-gray-200'}`}
                            aria-label="Toggle product visibility"
                            role="switch"
                            aria-checked={!!current.is_active}
                        >
                            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${current.is_active ? 'translate-x-6' : ''}`} />
                        </button>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                    <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={() => saveProduct(form)}
                        disabled={isSaving || Object.keys(form).length === 0}
                        className="w-full flex items-center justify-center gap-2 py-4 bg-primary text-white rounded-2xl font-black text-base min-h-[56px] hover:bg-primary-light transition-colors disabled:opacity-50"
                    >
                        <Save className="w-5 h-5" />
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </motion.button>

                    <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="w-full py-3.5 border border-red-200 text-red-600 rounded-2xl font-bold text-sm hover:bg-red-50 transition-colors min-h-[48px]"
                    >
                        Delete Product
                    </button>
                </div>
            </div>

            {/* Delete Confirm Bottom Sheet */}
            {showDeleteConfirm && (
                <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="fixed inset-0 z-50 bg-black/40 flex items-end justify-center"
                    onClick={e => e.target === e.currentTarget && setShowDeleteConfirm(false)}
                >
                    <motion.div
                        initial={{ y: 100 }} animate={{ y: 0 }}
                        className="w-full max-w-2xl bg-white rounded-t-3xl p-6"
                    >
                        <div className="w-10 h-10 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <AlertTriangle className="w-5 h-5 text-red-600" />
                        </div>
                        <h3 className="text-center font-black text-text-primary text-lg mb-2">Delete Product?</h3>
                        <p className="text-center text-sm text-text-secondary mb-6">
                            "{product.name}" will be permanently removed and can't be recovered.
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => setShowDeleteConfirm(false)}
                                className="py-3.5 border border-gray-200 rounded-2xl font-bold text-sm hover:bg-gray-50 transition-colors">
                                Cancel
                            </button>
                            <button
                                onClick={() => { deleteProduct(); setShowDeleteConfirm(false); }}
                                disabled={isDeleting}
                                className="py-3.5 bg-red-600 text-white rounded-2xl font-bold text-sm hover:bg-red-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                            >
                                <Trash2 className="w-4 h-4" />
                                {isDeleting ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </div>
    );
}
