'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { 
    ChevronLeft, 
    Camera, 
    Loader2, 
    Package, 
    Tag, 
    Coins,
    Layers
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ApiResponse } from '@/types';

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
    const { register, handleSubmit, watch, formState: { errors, isValid } } = useForm<AddProductForm>();
    const [imagePreview, setImagePreview] = React.useState<string | null>(null);

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
    const { data: catData } = useQuery<ApiResponse<Category[]>>({
        queryKey: ['categories'],
        queryFn: () => api.get('/categories'),
    });
    const categories = catData?.data || [];

    const mutation = useMutation({
        mutationFn: (formData: FormData) => api.post('/products', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        }),
        onSuccess: () => {
            router.push('/trader/products');
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
        <div className="flex flex-col min-h-screen bg-surface-base pb-32">
            <header className="p-6 pt-12 flex items-center gap-4 sticky top-0 bg-surface-base/80 backdrop-blur-md z-10 border-b border-border-default">
                <button 
                    onClick={() => router.back()} 
                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-border-default active:scale-90 transition-all"
                    aria-label="Rudi nyuma (Back)"
                    title="Rudi nyuma"
                >
                    <ChevronLeft size={24} />
                </button>
                <h1 className="text-xl font-black text-green-950">Ongeza Bidhaa Mpya</h1>
            </header>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6 animate-fade-up">
                {/* Photo Upload Section */}
                <div className="space-y-3">
                    <label className="input-label block !mb-0">Picha ya Bidhaa / Product Photo</label>
                    <div className="relative aspect-video w-full rounded-3xl border-2 border-dashed border-neutral-300 bg-neutral-100 flex flex-col items-center justify-center overflow-hidden group hover:border-brand-500 transition-all">
                        {imagePreview ? (
                            <>
                                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Camera size={32} className="text-white" />
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center gap-2 text-text-muted">
                                <Camera size={40} />
                                <span className="text-xs font-bold uppercase tracking-wider">Gusa kupakia picha</span>
                            </div>
                        )}
                        <input 
                            type="file" 
                            accept="image/*" 
                            {...register('image', { required: 'Picha inahitajika' })}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                    </div>
                    {errors.image && <p className="input-error-msg">{errors.image.message}</p>}
                </div>

                {/* Name */}
                <div>
                    <label className="input-label">Jina la Bidhaa / Product Name</label>
                    <div className="relative">
                        <Package className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={20} />
                        <input 
                            {...register('name', { required: 'Jina linahitajika' })}
                            className="input pl-12"
                            placeholder="e.g. Nyanya kubwa (Large Tomatoes)"
                        />
                    </div>
                </div>

                {/* Categories - Grid Toggle Style */}
                <div className="space-y-3">
                    <label className="input-label">Kundi / Category</label>
                    <div className="grid grid-cols-2 gap-3">
                        {categories.map((cat: Category) => (
                            <label key={cat.id} className={`flex items-center gap-3 p-3 border-2 rounded-2xl cursor-pointer transition-all ${watch('category_id') === String(cat.id) ? 'border-brand-500 bg-brand-50' : 'border-neutral-200'}`}>
                                <input type="radio" value={cat.id} {...register('category_id', { required: 'Chagua kundi' })} className="hidden" />
                                <Layers size={18} className={watch('category_id') === String(cat.id) ? 'text-brand-600' : 'text-text-muted'} />
                                <span className={`text-xs font-bold ${watch('category_id') === String(cat.id) ? 'text-brand-700' : 'text-text-secondary'}`}>{cat.name}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Price & Unit Row */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="input-label">Bei / Price (KES)</label>
                        <div className="relative">
                            <Coins className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={20} />
                            <input 
                                type="number"
                                {...register('price', { required: 'Inahitajika' })}
                                className="input pl-12 font-mono"
                                placeholder="150"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="input-label">Kipimo / Unit</label>
                        <div className="relative">
                            <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={20} />
                            <input 
                                {...register('unit', { required: 'Inahitajika' })}
                                className="input pl-12"
                                placeholder="kg, piece..."
                            />
                        </div>
                    </div>
                </div>

                <div className="fixed bottom-0 left-0 right-0 p-6 bg-surface-glass backdrop-blur-md border-t border-border-default z-20 max-w-[480px] mx-auto">
                    <button
                        disabled={mutation.isPending}
                        className="btn btn-primary w-full h-[56px] text-lg shadow-brand-lg disabled:opacity-50"
                        type="submit"
                    >
                        {mutation.isPending ? <Loader2 className="animate-spin" /> : 'Hifadhi Bidhaa / Save Product'}
                    </button>
                </div>
            </form>
        </div>
    );
}
