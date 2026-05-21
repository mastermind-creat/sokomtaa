import React, { useState, useEffect } from 'react';
import { MapPin, Image as ImageIcon, Loader2, Save, X } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { User } from '@/types';
import Image from 'next/image';
import { useAuthStore } from '@/store/authStore';

export default function DeliveryDefaultsCard({ user }: { user?: User }) {
    const queryClient = useQueryClient();
    const [isUpdating, setIsUpdating] = useState(false);
    const [address, setAddress] = useState('');
    const [latitude, setLatitude] = useState('');
    const [longitude, setLongitude] = useState('');
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    useEffect(() => {
        if (user && !isUpdating) {
            setAddress(user.default_delivery_address || '');
            setLatitude(user.default_delivery_latitude?.toString() || '');
            setLongitude(user.default_delivery_longitude?.toString() || '');
            setImagePreview(user.default_delivery_image_url || null);
        }
    }, [user, isUpdating]);

    const updateDefaultsMutation = useMutation({
        mutationFn: async () => {
            const formData = new FormData();
            formData.append('default_delivery_address', address);
            if (latitude) formData.append('default_delivery_latitude', latitude);
            if (longitude) formData.append('default_delivery_longitude', longitude);
            if (selectedFile) formData.append('delivery_image', selectedFile);

            return api.post('/profile/default-delivery', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['profile'] });
            useAuthStore.getState().refreshUser();
            setIsUpdating(false);
            setSelectedFile(null);
        },
        onError: (err: any) => {
            alert(err.response?.data?.message || err.message || 'Failed to update delivery defaults.');
        }
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    return (
        <div className="bg-white p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] border border-gray-100 shadow-brand-sm space-y-8 mt-8">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-green-950 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                        <MapPin size={18} />
                    </div>
                    Delivery Defaults
                </h3>
                {!isUpdating ? (
                    <button 
                        onClick={() => setIsUpdating(true)}
                        className="text-[10px] font-black uppercase tracking-widest text-brand-600 hover:text-brand-700"
                    >
                        Edit Details
                    </button>
                ) : (
                    <button 
                        onClick={() => {
                            setIsUpdating(false);
                            setSelectedFile(null);
                            setImagePreview(user?.default_delivery_image_url || null);
                        }}
                        className="text-[10px] font-black uppercase tracking-widest text-text-muted hover:text-text-primary"
                    >
                        Cancel
                    </button>
                )}
            </div>

            <p className="text-xs text-text-secondary leading-relaxed">
                Set your default delivery location and optionally provide a photo of your gate or door to help riders find you faster.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4 md:col-span-2">
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] pl-1">Full Delivery Address</label>
                    <div className="relative group">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-brand-600 transition-colors" size={18} />
                        <input 
                            value={address}
                            disabled={!isUpdating}
                            onChange={(e) => setAddress(e.target.value)}
                            className={`w-full h-14 pl-12 pr-4 bg-neutral-50 rounded-2xl border-2 transition-all font-bold text-sm outline-none ${
                                isUpdating ? 'border-brand-100 bg-white focus:border-brand-500 shadow-inner' : 'border-transparent'
                            }`}
                            placeholder="e.g. Block A, Apartment 12, Sunrise Estate"
                        />
                    </div>
                </div>

                <div className="space-y-2.5">
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] pl-1">Latitude</label>
                    <input 
                        value={latitude}
                        disabled={!isUpdating}
                        onChange={(e) => setLatitude(e.target.value)}
                        className={`w-full h-14 px-4 bg-neutral-50 rounded-2xl border-2 transition-all font-bold text-sm outline-none ${
                            isUpdating ? 'border-brand-100 bg-white focus:border-brand-500 shadow-inner' : 'border-transparent'
                        }`}
                        placeholder="-1.2921"
                    />
                </div>

                <div className="space-y-2.5">
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] pl-1">Longitude</label>
                    <input 
                        value={longitude}
                        disabled={!isUpdating}
                        onChange={(e) => setLongitude(e.target.value)}
                        className={`w-full h-14 px-4 bg-neutral-50 rounded-2xl border-2 transition-all font-bold text-sm outline-none ${
                            isUpdating ? 'border-brand-100 bg-white focus:border-brand-500 shadow-inner' : 'border-transparent'
                        }`}
                        placeholder="36.8219"
                    />
                </div>

                <div className="space-y-4 md:col-span-2">
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] pl-1">Door / Gate Image (Optional)</label>
                    
                    {imagePreview ? (
                        <div className="relative w-full h-48 md:h-64 rounded-2xl overflow-hidden border-2 border-dashed border-gray-200">
                            <Image src={imagePreview} alt="Delivery Location" fill className="object-cover" unoptimized />
                            {isUpdating && (
                                <button 
                                    onClick={() => {
                                        setImagePreview(null);
                                        setSelectedFile(null);
                                    }}
                                    className="absolute top-4 right-4 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-rose-500 transition-colors backdrop-blur-sm"
                                >
                                    <X size={16} />
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className={`w-full h-48 md:h-64 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-4 transition-colors ${isUpdating ? 'border-brand-300 bg-brand-50 hover:bg-brand-100 cursor-pointer' : 'border-gray-200 bg-gray-50 opacity-60'}`}>
                            {isUpdating ? (
                                <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer">
                                    <ImageIcon size={32} className="text-brand-400 mb-2" />
                                    <span className="text-sm font-bold text-brand-700">Tap to upload image</span>
                                    <span className="text-[10px] text-brand-500 uppercase tracking-widest mt-1">JPG, PNG up to 5MB</span>
                                    <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                                </label>
                            ) : (
                                <>
                                    <ImageIcon size={32} className="text-gray-400 mb-2" />
                                    <span className="text-sm font-bold text-gray-500">No image provided</span>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {isUpdating && (
                <button 
                    onClick={() => updateDefaultsMutation.mutate()}
                    disabled={updateDefaultsMutation.isPending}
                    className="w-full h-16 bg-brand-600 text-white rounded-2xl flex items-center justify-center gap-3 text-sm font-black uppercase tracking-[0.2em] shadow-2xl shadow-brand-200 active:scale-95 transition-all"
                >
                    {updateDefaultsMutation.isPending ? <Loader2 className="animate-spin" /> : 'Save Delivery Defaults'}
                </button>
            )}
        </div>
    );
}
