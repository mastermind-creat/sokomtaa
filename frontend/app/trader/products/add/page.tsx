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
    Plus,
    X,
    Check,
    PlusCircle,
    Info,
    AlertTriangle
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ApiResponse, Category } from '@/types';
import { useUIStore } from '@/store/uiStore';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';

interface AddProductForm {
    name: string;
    category_id: string;
    price: string;
    unit: string;
    description: string;
    image: FileList;
}

export default function AddProductPage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { setPageTitle } = useUIStore();

    useEffect(() => {
        setPageTitle('Add New Product');
    }, [setPageTitle]);

    const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<AddProductForm>();
    const { user } = useAuthStore();
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const isMissingProfile = user?.role === 'trader' && !user?.trader;
    const isPendingAllocation = user?.role === 'trader' && user?.trader && !user?.trader.stall_id;
    
    // New Category State
    const [isAddingCategory, setIsAddingCategory] = useState(false);
    const [newCatName, setNewCatName] = useState('');
    const [newCatNameSw, setNewCatNameSw] = useState('');

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
    const categories = Array.isArray(catData) ? catData : (catData?.data || []);

    // Create Category Mutation
    const createCategoryMutation = useMutation({
        mutationFn: (data: { name: string; name_sw: string }) => api.post('/categories', data),
        onSuccess: (response: any) => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            const newCat = Array.isArray(response) ? response[0] : (response.data || response);
            if (newCat?.id) {
                setValue('category_id', String(newCat.id));
            }
            setIsAddingCategory(false);
            setNewCatName('');
            setNewCatNameSw('');
        },
        onError: (error: any) => {
            alert(`Error: ${error.message || 'Failed to create category'}`);
        }
    });

    const mutation = useMutation({
        mutationFn: (formData: FormData) => api.post('/products', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my-products'] });
            router.push('/trader/products');
        },
        onError: (error: any) => {
            console.error('Submission error:', error);
            let errorMessage = 'Server error occurred';
            
            if (typeof error === 'string') {
                errorMessage = error;
            } else if (error?.errors) {
                const firstError = Object.values(error.errors)[0];
                if (Array.isArray(firstError)) {
                    errorMessage = firstError[0];
                } else if (typeof firstError === 'string') {
                    errorMessage = firstError;
                }
            } else if (error?.message) {
                errorMessage = error.message;
            }
            
            alert(`Failed to save: ${errorMessage}`);
        }
    });

    const onSubmit = (data: AddProductForm) => {
        const formData = new FormData();
        formData.append('name', data.name);
        formData.append('category_id', data.category_id);
        formData.append('price', data.price);
        formData.append('unit', data.unit);
        formData.append('description', data.description || '');
        
        if (data.image && data.image[0]) {
            formData.append('image', data.image[0]);
        }
        
        mutation.mutate(formData);
    };

    return (
        <div className="flex flex-col min-h-screen bg-[#FAFAF8] pb-32 max-w-4xl mx-auto w-full pt-6">
            <div className="p-6">
                <button 
                    onClick={() => router.back()} 
                    className="p-3 bg-white border border-gray-100 rounded-2xl text-text-secondary hover:text-green-950 transition-all active:scale-95 shadow-sm"
                >
                    <ChevronLeft size={24} />
                </button>
            </div>

            <div className="px-6 mb-8">
                <h1 className="text-3xl font-black text-green-950 tracking-tight">Add New Product</h1>
                <p className="text-text-secondary font-medium mt-1">List a new item in your stall directory.</p>
            </div>

            <AnimatePresence>
                {isMissingProfile && (
                    <motion.div 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mx-6 mb-8 p-6 bg-rose-50 border border-rose-100 rounded-[2rem] flex items-center gap-4 shadow-sm"
                    >
                        <div className="w-12 h-12 bg-rose-600 rounded-2xl flex items-center justify-center text-white shrink-0">
                            <AlertTriangle size={24} />
                        </div>
                        <div className="flex-1">
                            <h4 className="text-rose-950 font-black text-sm uppercase tracking-tight">Profile Incomplete</h4>
                            <p className="text-rose-700 text-xs font-bold mt-0.5">Please complete your trader profile setup to start listing products.</p>
                        </div>
                        <Link href="/trader/profile" className="px-5 py-3 bg-rose-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-rose-700 transition-colors">Setup Now</Link>
                    </motion.div>
                )}
                {isPendingAllocation && (
                    <motion.div 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mx-6 mb-8 p-6 bg-blue-50 border border-blue-100 rounded-[2rem] flex items-center gap-4 shadow-sm"
                    >
                        <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shrink-0">
                            <Clock size={24} />
                        </div>
                        <div className="flex-1">
                            <h4 className="text-blue-950 font-black text-sm uppercase tracking-tight">Profile Ready • Awaiting Stall</h4>
                            <p className="text-blue-700 text-xs font-bold mt-0.5">Your profile is complete! You will be able to add products as soon as the admin allocates your stall.</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <form onSubmit={handleSubmit(onSubmit)} className="px-6 space-y-10">
                {/* Photo Upload Section */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
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
                            <div className="flex flex-col items-center gap-4 text-neutral-400">
                                <div className="p-6 bg-neutral-50 rounded-full">
                                    <Camera size={48} strokeWidth={1.5} />
                                </div>
                                <div className="text-center">
                                    <span className="text-xs font-black uppercase tracking-widest block mb-1">Tap to upload</span>
                                    <span className="text-[10px] font-bold opacity-60 uppercase">Max size: 5MB</span>
                                </div>
                            </div>
                        )}
                        <input 
                            type="file" 
                            accept="image/*" 
                            {...register('image', { required: 'Product photo is required' })}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                    </div>
                    {errors.image && <p className="text-xs font-bold text-rose-500 flex items-center gap-1"><Info size={12} /> {errors.image.message}</p>}
                </div>

                {/* Name */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
                            <Package size={18} />
                        </div>
                        <label className="text-sm font-black text-green-950 uppercase tracking-wider">Product Name</label>
                    </div>
                    <input 
                        {...register('name', { required: 'Name is required' })}
                        className="w-full h-16 px-6 bg-white border border-gray-100 rounded-2xl text-lg font-bold text-green-950 focus:ring-2 ring-brand-500 outline-none transition-all shadow-sm"
                        placeholder="e.g. Fresh Sukuma Wiki"
                    />
                    {errors.name && <p className="text-xs font-bold text-rose-500 flex items-center gap-1"><Info size={12} /> {errors.name.message}</p>}
                </div>

                {/* Categories */}
                <div className="space-y-5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-purple-50 rounded-xl text-purple-600">
                                <Layers size={18} />
                            </div>
                            <label className="text-sm font-black text-green-950 uppercase tracking-wider">Category</label>
                        </div>
                        
                        <button 
                            type="button"
                            onClick={() => setIsAddingCategory(!isAddingCategory)}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all",
                                isAddingCategory ? "bg-neutral-100 text-neutral-600" : "bg-brand-50 text-brand-700 hover:bg-brand-100"
                            )}
                        >
                            {isAddingCategory ? <><X size={14} /> Close</> : <><Plus size={14} strokeWidth={3} /> New Category</>}
                        </button>
                    </div>

                    <AnimatePresence>
                        {isAddingCategory && (
                            <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="p-6 bg-brand-50/50 rounded-3xl border border-brand-100 space-y-4 mb-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-brand-800">English Name</label>
                                            <input 
                                                value={newCatName}
                                                onChange={(e) => setNewCatName(e.target.value)}
                                                className="w-full h-12 px-4 bg-white border border-brand-100 rounded-xl text-sm font-bold text-green-950 outline-none"
                                                placeholder="e.g. Vegetables"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-brand-800">Swahili Name</label>
                                            <input 
                                                value={newCatNameSw}
                                                onChange={(e) => setNewCatNameSw(e.target.value)}
                                                className="w-full h-12 px-4 bg-white border border-brand-100 rounded-xl text-sm font-bold text-green-950 outline-none"
                                                placeholder="e.g. Mbogamboga"
                                            />
                                        </div>
                                    </div>
                                    <button 
                                        type="button"
                                        disabled={!newCatName || !newCatNameSw || createCategoryMutation.isPending}
                                        onClick={() => createCategoryMutation.mutate({ name: newCatName, name_sw: newCatNameSw })}
                                        className="w-full h-12 bg-brand-600 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-brand-500/20 disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                                    >
                                        {createCategoryMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <><PlusCircle size={16} strokeWidth={3} /> Create Category</>}
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {categoriesLoading ? (
                            Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="h-14 bg-white border border-neutral-50 rounded-2xl animate-pulse" />
                            ))
                        ) : (
                            categories.map((cat: Category) => (
                                <label key={cat.id} className={cn(
                                    "flex items-center justify-center p-4 border-2 rounded-2xl cursor-pointer transition-all shadow-sm",
                                    watch('category_id') === String(cat.id) 
                                        ? 'border-brand-600 bg-brand-50' 
                                        : 'border-white bg-white hover:border-neutral-100'
                                )}>
                                    <input type="radio" value={cat.id} {...register('category_id', { required: 'Please select a category' })} className="hidden" />
                                    <span className={cn(
                                        "text-[10px] font-black uppercase tracking-widest text-center",
                                        watch('category_id') === String(cat.id) ? 'text-brand-700' : 'text-text-muted'
                                    )}>{cat.name}</span>
                                </label>
                            ))
                        )}
                    </div>
                    {errors.category_id && <p className="text-xs font-bold text-rose-500 flex items-center gap-1"><Info size={12} /> {errors.category_id.message}</p>}
                </div>

                {/* Price & Unit Row */}
                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-amber-50 rounded-xl text-amber-600">
                                <Coins size={18} />
                            </div>
                            <label className="text-sm font-black text-green-950 uppercase tracking-wider">Price (KES)</label>
                        </div>
                        <div className="relative">
                            <input 
                                type="number"
                                {...register('price', { required: 'Price is required' })}
                                className="w-full h-16 px-6 bg-white border border-gray-100 rounded-2xl font-black text-xl text-green-950 outline-none focus:ring-2 ring-brand-500 shadow-sm"
                                placeholder="0.00"
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-neutral-400">KES</div>
                        </div>
                    </div>
                    
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
                                <Tag size={18} />
                            </div>
                            <label className="text-sm font-black text-green-950 uppercase tracking-wider">Unit</label>
                        </div>
                        <input 
                            {...register('unit', { required: 'Unit is required' })}
                            className="w-full h-16 px-6 bg-white border border-gray-100 rounded-2xl font-bold text-green-950 outline-none focus:ring-2 ring-brand-500 shadow-sm"
                            placeholder="kg, piece, bunch..."
                        />
                    </div>
                </div>

                {/* Fixed Bottom Action Bar */}
                <div className="fixed bottom-[80px] left-0 right-0 lg:bottom-0 lg:left-[280px] p-6 bg-white/80 backdrop-blur-xl border-t border-gray-100 z-20">
                    <div className="max-w-4xl mx-auto flex gap-4">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="flex-1 h-16 rounded-2xl border-2 border-gray-100 font-black uppercase text-xs tracking-widest text-text-secondary hover:bg-gray-50 transition-all active:scale-95"
                        >
                            Cancel
                        </button>
                        <button
                            disabled={mutation.isPending || isMissingProfile}
                            className="flex-[2] h-16 bg-brand-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-brand-900/10 disabled:opacity-50 hover:bg-brand-700 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                            type="submit"
                        >
                            {mutation.isPending ? <Loader2 className="animate-spin" /> : <><Check size={20} /> {isMissingProfile ? 'Profile Required' : 'Publish Product'}</>}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
