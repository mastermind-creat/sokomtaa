'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { 
    ChevronLeft, 
    Camera, 
    Loader2, 
    Package, 
    Tag, 
    Coins,
    Layers,
    Save,
    Trash2,
    AlertTriangle,
    Eye,
    EyeOff
} from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { ApiResponse, Product, Category } from '@/types';
import { useUIStore } from '@/store/uiStore';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

interface EditProductForm {
    name: string;
    category_id: string;
    price: string;
    unit: string;
    description: string;
    is_active: boolean;
    image: FileList;
}

export default function EditProductPage() {
    const params = useParams();
    const router = useRouter();
    const queryClient = useQueryClient();
    const { setPageTitle } = useUIStore();
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<EditProductForm>();
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    // Fetch Product Data
    const { data: productResponse, isLoading: productLoading } = useQuery<ApiResponse<Product>>({
        queryKey: ['product', params.id],
        queryFn: () => api.get(`/products/${params.id}`),
    });

    const product = productResponse?.data;

    useEffect(() => {
        if (product) {
            setPageTitle(`Editing: ${product.name}`);
            reset({
                name: product.name,
                category_id: String(product.category_id),
                price: String(product.price),
                unit: product.unit,
                description: product.description || '',
                is_active: product.is_active
            });
            if (product.image_url) {
                setImagePreview(product.image_url);
            }
        }
    }, [product, setPageTitle, reset]);

    // Watch image for preview
    const imageFiles = watch('image');
    useEffect(() => {
        if (imageFiles && imageFiles.length > 0) {
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result as string);
            reader.readAsDataURL(imageFiles[0]);
        }
    }, [imageFiles]);

    // Fetch Categories
    const { data: catData, isLoading: categoriesLoading } = useQuery<ApiResponse<Category[]>>({
        queryKey: ['categories'],
        queryFn: () => api.get('/categories'),
    });
    const categories = catData?.data || [];

    // Save Mutation
    const saveMutation = useMutation({
        mutationFn: (formData: FormData) => api.post(`/products/${params.id}?_method=PUT`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my-products'] });
            queryClient.invalidateQueries({ queryKey: ['product', params.id] });
            router.push('/trader/products');
        },
        onError: (error: any) => {
            alert(`Failed to save: ${error.message || 'Server error'}`);
        }
    });

    // Delete Mutation
    const deleteMutation = useMutation({
        mutationFn: () => api.delete(`/products/${params.id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my-products'] });
            router.push('/trader/products');
        },
    });

    const onSubmit = (data: EditProductForm) => {
        const formData = new FormData();
        formData.append('name', data.name);
        formData.append('category_id', data.category_id);
        formData.append('price', data.price);
        formData.append('unit', data.unit);
        formData.append('description', data.description || '');
        formData.append('is_active', data.is_active ? '1' : '0');
        
        if (data.image && data.image[0]) {
            formData.append('image', data.image[0]);
        }
        
        saveMutation.mutate(formData);
    };

    if (productLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Loader2 className="animate-spin text-brand-600" size={48} />
                <p className="mt-4 text-text-secondary font-black uppercase tracking-widest text-xs">Loading product details...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-[#FAFAF8] pb-32 max-w-4xl mx-auto w-full pt-6">
            <div className="p-6 flex items-center justify-between">
                <button 
                    onClick={() => router.back()} 
                    className="p-3 bg-white border border-gray-100 rounded-2xl text-text-secondary hover:text-green-950 transition-all active:scale-95 shadow-sm"
                >
                    <ChevronLeft size={24} />
                </button>

                <button 
                    onClick={() => setShowDeleteConfirm(true)}
                    className="p-3 bg-rose-50 text-rose-600 rounded-2xl hover:bg-rose-100 transition-all active:scale-95 border border-rose-100"
                >
                    <Trash2 size={20} />
                </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-8">
                {/* Photo Section */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-2 bg-brand-50 rounded-xl text-brand-600">
                            <Camera size={18} />
                        </div>
                        <label className="text-sm font-black text-green-950 uppercase tracking-wider">Product Photo</label>
                    </div>
                    
                    <div className="relative aspect-video w-full rounded-[32px] border-2 border-dashed border-neutral-200 bg-white flex flex-col items-center justify-center overflow-hidden group hover:border-brand-500 transition-all shadow-sm">
                        {imagePreview ? (
                            <>
                                <Image src={imagePreview} alt="Preview" fill className="object-cover" />
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className="p-4 bg-white/20 backdrop-blur-md rounded-full border border-white/30">
                                        <Camera size={32} className="text-white" />
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center gap-3 text-neutral-400">
                                <Camera size={40} />
                                <span className="text-[10px] font-black uppercase tracking-widest">Change Photo</span>
                            </div>
                        )}
                        <input type="file" accept="image/*" {...register('image')} className="absolute inset-0 opacity-0 cursor-pointer" />
                    </div>
                </div>

                {/* Name */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
                            <Package size={18} />
                        </div>
                        <label className="text-sm font-black text-green-950 uppercase tracking-wider">Product Name</label>
                    </div>
                    <input 
                        {...register('name', { required: 'Name is required' })}
                        className="w-full h-14 px-6 bg-white border border-gray-100 rounded-2xl text-lg font-bold text-green-950 focus:ring-2 ring-brand-500 outline-none transition-all"
                        placeholder="e.g. Fresh Tomatoes"
                    />
                    {errors.name && <p className="text-xs font-bold text-rose-500">{errors.name.message}</p>}
                </div>

                {/* Categories */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-purple-50 rounded-xl text-purple-600">
                            <Layers size={18} />
                        </div>
                        <label className="text-sm font-black text-green-950 uppercase tracking-wider">Category</label>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {categoriesLoading ? (
                            Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-12 bg-gray-50 rounded-2xl animate-pulse" />)
                        ) : (
                            categories.map((cat: Category) => (
                                <label key={cat.id} className={cn(
                                    "flex items-center justify-center p-4 border-2 rounded-2xl cursor-pointer transition-all",
                                    watch('category_id') === String(cat.id) ? 'border-brand-600 bg-brand-50' : 'border-gray-50 bg-white hover:bg-gray-50'
                                )}>
                                    <input type="radio" value={cat.id} {...register('category_id', { required: true })} className="hidden" />
                                    <span className={cn(
                                        "text-[10px] font-black uppercase tracking-widest",
                                        watch('category_id') === String(cat.id) ? 'text-brand-700' : 'text-text-muted'
                                    )}>{cat.name}</span>
                                </label>
                            ))
                        )}
                    </div>
                </div>

                {/* Pricing & Units */}
                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-amber-50 rounded-xl text-amber-600">
                                <Coins size={18} />
                            </div>
                            <label className="text-sm font-black text-green-950 uppercase tracking-wider">Price (KES)</label>
                        </div>
                        <input 
                            type="number"
                            {...register('price', { required: true })}
                            className="w-full h-14 px-6 bg-white border border-gray-100 rounded-2xl font-black text-lg text-green-950"
                        />
                    </div>
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
                                <Tag size={18} />
                            </div>
                            <label className="text-sm font-black text-green-950 uppercase tracking-wider">Unit</label>
                        </div>
                        <input 
                            {...register('unit', { required: true })}
                            className="w-full h-14 px-6 bg-white border border-gray-100 rounded-2xl font-bold text-green-950"
                            placeholder="kg, piece..."
                        />
                    </div>
                </div>

                {/* Visibility */}
                <div className="p-6 bg-white rounded-[2rem] border border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className={cn(
                            "p-3 rounded-2xl",
                            watch('is_active') ? "bg-emerald-50 text-emerald-600" : "bg-neutral-50 text-neutral-400"
                        )}>
                            {watch('is_active') ? <Eye size={24} /> : <EyeOff size={24} />}
                        </div>
                        <div>
                            <p className="font-black text-green-950">Show on profile</p>
                            <p className="text-xs text-text-secondary font-medium">Toggle visibility for customers</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => setValue('is_active', !watch('is_active'))}
                        className={cn(
                            "relative w-14 h-8 rounded-full transition-colors",
                            watch('is_active') ? "bg-brand-600" : "bg-neutral-200"
                        )}
                    >
                        <motion.div 
                            animate={{ x: watch('is_active') ? 24 : 4 }}
                            className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-sm"
                        />
                    </button>
                </div>

                {/* Fixed Bottom Actions */}
                <div className="fixed bottom-0 left-0 right-0 lg:left-[280px] p-6 bg-white/80 backdrop-blur-xl border-t border-gray-100 z-20">
                    <div className="max-w-4xl mx-auto flex gap-4">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="flex-1 h-14 rounded-2xl border-2 border-gray-100 font-black uppercase text-xs tracking-widest text-text-secondary hover:bg-gray-50 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            disabled={saveMutation.isPending}
                            className="flex-[2] h-14 bg-brand-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-brand-900/10 disabled:opacity-50 hover:bg-brand-700 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                            type="submit"
                        >
                            {saveMutation.isPending ? <Loader2 className="animate-spin" /> : <><Save size={20} /> Save Changes</>}
                        </button>
                    </div>
                </div>
            </form>

            {/* Delete Confirm Bottom Sheet */}
            <AnimatePresence>
                {showDeleteConfirm && (
                    <>
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setShowDeleteConfirm(false)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                        />
                        <motion.div 
                            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[3rem] p-8 z-50 shadow-2xl border-t border-gray-100"
                        >
                            <div className="w-12 h-1.5 bg-neutral-100 rounded-full mx-auto mb-8" />
                            <div className="flex flex-col items-center text-center mb-8">
                                <div className="w-20 h-20 bg-rose-50 rounded-[2rem] flex items-center justify-center text-rose-600 mb-6">
                                    <AlertTriangle size={40} />
                                </div>
                                <h3 className="text-2xl font-black text-green-950 tracking-tight">Delete Product?</h3>
                                <p className="text-text-secondary font-medium mt-2 max-w-xs">
                                    Are you sure you want to remove <span className="font-bold text-green-950">"{product?.name}"</span>? This action cannot be undone.
                                </p>
                            </div>
                            <div className="flex flex-col gap-3">
                                <button 
                                    onClick={() => deleteMutation.mutate()}
                                    disabled={deleteMutation.isPending}
                                    className="w-full h-16 bg-rose-600 text-white rounded-2xl font-black uppercase text-sm tracking-widest shadow-lg shadow-rose-900/20 active:scale-95 transition-all flex items-center justify-center gap-3"
                                >
                                    {deleteMutation.isPending ? <Loader2 className="animate-spin" /> : <><Trash2 size={20} /> Delete Product</>}
                                </button>
                                <button 
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className="w-full h-14 bg-neutral-50 text-text-secondary rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-neutral-100 transition-all"
                                >
                                    Cancel
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
