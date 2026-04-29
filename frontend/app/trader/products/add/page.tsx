'use client';

import React, { useState } from 'react';
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
    Check
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ApiResponse } from '@/types';
import { useUIStore } from '@/store/uiStore';
import Image from 'next/image';

interface Category {
    id: number;
    name: string;
}

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

    React.useEffect(() => {
        setPageTitle('Ongeza Bidhaa Mpya');
    }, [setPageTitle]);

    const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<AddProductForm>();
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    
    // New Category State
    const [isAddingCategory, setIsAddingCategory] = useState(false);
    const [newCatName, setNewCatName] = useState('');
    const [newCatNameSw, setNewCatNameSw] = useState('');

    // Watch image for preview
    const imageFiles = watch('image');
    React.useEffect(() => {
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

    // Create Category Mutation
    const createCategoryMutation = useMutation({
        mutationFn: (data: { name: string; name_sw: string }) => api.post('/categories', data),
        onSuccess: (response: ApiResponse<Category>) => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            if (response.data?.id) {
                setValue('category_id', String(response.data.id));
            }
            setIsAddingCategory(false);
            setNewCatName('');
            setNewCatNameSw('');
        },
        onError: (error: Error) => {
            alert(`Imeshindikana kuongeza kundi: ${error.message}`);
        }
    });

    const mutation = useMutation({
        mutationFn: (formData: FormData) => api.post('/products', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        }),
        onSuccess: () => {
            router.push('/trader/products');
        },
        onError: (error: Error) => {
            console.error('Submission error:', error);
            alert(`Imeshindikana kuhifadhi: ${error.message || 'Hitilafu ya seva'}`);
        }
    });

    const onSubmit = (data: AddProductForm) => {
        const formData = new FormData();
        formData.append('name', data.name);
        formData.append('category_id', data.category_id);
        formData.append('price', data.price);
        formData.append('unit', data.unit);
        formData.append('description', data.description || '');
        if (data.image[0]) {
            formData.append('image', data.image[0]);
        }
        
        mutation.mutate(formData);
    };

    return (
        <div className="flex flex-col min-h-screen bg-surface-base pb-32 max-w-4xl mx-auto w-full pt-6">
            <div className="p-6 flex items-center justify-start">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full transition-colors bg-white border border-gray-100">
                        <ChevronLeft size={24} className="text-gray-600" />
                    </button>
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-8 animate-fade-up">
                {/* Photo Upload Section */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-2 bg-brand-50 rounded-xl text-brand-600">
                            <Camera size={18} />
                        </div>
                        <label className="text-sm font-black text-green-950 uppercase tracking-wider">Picha ya Bidhaa / Photo</label>
                    </div>
                    
                    <div className="relative aspect-video w-full rounded-[32px] border-2 border-dashed border-neutral-200 bg-neutral-50/50 flex flex-col items-center justify-center overflow-hidden group hover:border-brand-500 transition-all shadow-inner">
                        {imagePreview ? (
                            <>
                                <Image 
                                    src={imagePreview} 
                                    alt="Preview" 
                                    fill
                                    className="object-cover" 
                                />
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className="p-4 bg-white/20 backdrop-blur-md rounded-full border border-white/30">
                                        <Camera size={32} className="text-white" />
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center gap-3 text-text-muted">
                                <div className="p-5 bg-white rounded-full shadow-sm border border-gray-100">
                                    <Camera size={40} className="text-gray-400" />
                                </div>
                                <span className="text-xs font-black uppercase tracking-[0.2em]">Gusa kupakia picha</span>
                            </div>
                        )}
                        <input 
                            type="file" 
                            accept="image/*" 
                            {...register('image', { required: 'Picha inahitajika' })}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                    </div>
                    {errors.image && <p className="text-xs font-bold text-red-500 mt-1">{errors.image.message}</p>}
                </div>

                {/* Name */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
                            <Package size={18} />
                        </div>
                        <label className="text-sm font-black text-green-950 uppercase tracking-wider">Jina la Bidhaa / Name</label>
                    </div>
                    <input 
                        {...register('name', { required: 'Jina linahitajika' })}
                        className="input h-14 rounded-2xl border-gray-100 focus:border-brand-500 transition-all text-lg font-bold"
                        placeholder="e.g. Nyanya kubwa (Large Tomatoes)"
                    />
                    {errors.name && <p className="text-xs font-bold text-red-500 mt-1">{errors.name.message}</p>}
                </div>

                {/* Categories */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-purple-50 rounded-xl text-purple-600">
                                <Layers size={18} />
                            </div>
                            <label className="text-sm font-black text-green-950 uppercase tracking-wider">Kundi / Category</label>
                        </div>
                        
                        {!isAddingCategory ? (
                            <button 
                                type="button"
                                onClick={() => setIsAddingCategory(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-brand-50 text-brand-700 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-brand-100 transition-colors"
                            >
                                <Plus size={14} strokeWidth={3} />
                                New Category
                            </button>
                        ) : (
                            <button 
                                type="button"
                                onClick={() => setIsAddingCategory(false)}
                                className="p-2 bg-gray-50 text-gray-500 rounded-xl hover:bg-gray-100 transition-colors"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    {isAddingCategory && (
                        <div className="p-6 bg-brand-50/50 rounded-3xl border border-brand-100 space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-brand-800">English Name</label>
                                    <input 
                                        value={newCatName}
                                        onChange={(e) => setNewCatName(e.target.value)}
                                        className="input h-10 text-sm rounded-xl border-brand-100"
                                        placeholder="e.g. Fruits"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-brand-800">Swahili Name</label>
                                    <input 
                                        value={newCatNameSw}
                                        onChange={(e) => setNewCatNameSw(e.target.value)}
                                        className="input h-10 text-sm rounded-xl border-brand-100"
                                        placeholder="e.g. Matunda"
                                    />
                                </div>
                            </div>
                            <button 
                                type="button"
                                disabled={!newCatName || !newCatNameSw || createCategoryMutation.isPending}
                                onClick={() => createCategoryMutation.mutate({ name: newCatName, name_sw: newCatNameSw })}
                                className="w-full h-10 bg-brand-600 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-brand-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {createCategoryMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <><Check size={14} strokeWidth={3} /> Save Category</>}
                            </button>
                        </div>
                    )}

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {categoriesLoading ? (
                            Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="h-12 bg-gray-50 rounded-2xl animate-pulse" />
                            ))
                        ) : (
                            categories.map((cat: Category) => (
                                <label key={cat.id} className={`flex items-center justify-center p-3 border-2 rounded-2xl cursor-pointer transition-all ${watch('category_id') === String(cat.id) ? 'border-brand-600 bg-brand-50 shadow-inner' : 'border-neutral-100 bg-white hover:border-neutral-200'}`}>
                                    <input type="radio" value={cat.id} {...register('category_id', { required: 'Chagua kundi' })} className="hidden" />
                                    <span className={`text-[10px] font-black uppercase tracking-wider text-center ${watch('category_id') === String(cat.id) ? 'text-brand-700' : 'text-text-secondary'}`}>{cat.name}</span>
                                </label>
                            ))
                        )}
                    </div>
                    {errors.category_id && <p className="text-xs font-bold text-red-500">{errors.category_id.message}</p>}
                </div>

                {/* Price & Unit Row */}
                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-amber-50 rounded-xl text-amber-600">
                                <Coins size={18} />
                            </div>
                            <label className="text-sm font-black text-green-950 uppercase tracking-wider">Bei / Price</label>
                        </div>
                        <div className="relative">
                            <input 
                                type="number"
                                {...register('price', { required: 'Inahitajika' })}
                                className="input h-14 rounded-2xl border-gray-100 pr-12 font-black text-lg"
                                placeholder="150"
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-400">KES</div>
                        </div>
                    </div>
                    
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
                                <Tag size={18} />
                            </div>
                            <label className="text-sm font-black text-green-950 uppercase tracking-wider">Kipimo / Unit</label>
                        </div>
                        <input 
                            {...register('unit', { required: 'Inahitajika' })}
                            className="input h-14 rounded-2xl border-gray-100 font-bold"
                            placeholder="kg, piece, bunch..."
                        />
                    </div>
                </div>

                {/* Submit Logic */}
                <div className="fixed bottom-0 left-0 right-0 lg:left-[280px] p-6 bg-white/80 backdrop-blur-xl border-t border-gray-100 z-20">
                    <div className="max-w-4xl mx-auto flex gap-4">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="flex-1 h-[56px] rounded-2xl border-2 border-gray-100 font-black uppercase text-xs tracking-widest text-gray-600 hover:bg-gray-50 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            disabled={mutation.isPending}
                            className="flex-[2] btn btn-primary h-[56px] text-lg shadow-brand-lg disabled:opacity-50"
                            type="submit"
                        >
                            {mutation.isPending ? <Loader2 className="animate-spin" /> : 'Hifadhi Bidhaa'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
