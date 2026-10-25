'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Phone, Home, Store, Package, ArrowRight, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { normalizePhoneNumber, handleApiError } from '@/lib/utils';
import { ApiResponse } from '@/types';
import { Logo } from '@/components/shared/Logo';

interface CompleteProfileForm {
    phone: string;
    role: 'resident' | 'trader' | 'delivery';
}

export default function CompleteProfilePage() {
    const router = useRouter();
    const { user, setAuth } = useAuthStore();
    const { token } = useAuthStore();
    const [error, setError] = useState<string | null>(null);

    const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<CompleteProfileForm>({
        defaultValues: { role: 'resident' },
    });

    const selectedRole = watch('role');

    const onSubmit = async (data: CompleteProfileForm) => {
        try {
            setError(null);
            const res = await api.post<never, ApiResponse<{ user: typeof user }>>('/auth/complete-profile', {
                phone: normalizePhoneNumber(data.phone),
                role: data.role,
            });

            const updatedUser = res.data as unknown as typeof user;
            if (updatedUser && token) {
                setAuth(updatedUser, token);
            }

            router.push('/verify');
        } catch (err) {
            setError(handleApiError(err));
        }
    };

    const roles = [
        { value: 'resident', label: 'Resident', sub: 'Buy produce', Icon: Home },
        { value: 'trader', label: 'Trader', sub: 'Sell at market', Icon: Store },
        { value: 'delivery', label: 'Rider', sub: 'Deliver orders', Icon: Package },
    ] as const;

    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 py-12">
            <motion.div
                className="w-full max-w-md"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
            >
                <div className="flex flex-col items-center mb-8">
                    <Logo variant="icon" width={56} height={56} className="mb-4" />
                    <h2 className="text-2xl font-black text-green-950 text-center">One last step</h2>
                    <p className="text-sm text-gray-500 text-center mt-1">
                        {user?.name ? `Welcome, ${user.name}!` : 'Welcome!'} Add your phone number and select your role.
                    </p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    {/* Phone */}
                    <div>
                        <label className="block text-sm font-bold text-green-900 mb-2">Phone Number</label>
                        <div className="relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-500">
                                <Phone size={18} />
                            </div>
                            <input
                                {...register('phone', {
                                    required: 'Phone number is required',
                                    pattern: {
                                        value: /^(?:\+254|254|0)?([17]\d{8})$/,
                                        message: 'Invalid Kenyan phone number format',
                                    },
                                })}
                                className="w-full h-[54px] pl-12 pr-4 rounded-xl border border-gray-200 bg-gray-50 text-green-950 placeholder:text-gray-400 text-base font-medium focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent focus:bg-white transition-all"
                                placeholder="07XXXXXXXX or +254..."
                                type="tel"
                                autoComplete="tel"
                            />
                        </div>
                        {errors.phone && <p className="text-red-500 text-xs font-medium mt-1.5">{errors.phone.message}</p>}
                    </div>

                    {/* Role */}
                    <div>
                        <label className="block text-sm font-bold text-green-900 mb-3">I am a...</label>
                        <div className="grid grid-cols-3 gap-3">
                            {roles.map(({ value, label, sub, Icon }) => (
                                <label
                                    key={value}
                                    className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedRole === value
                                            ? 'border-brand-500 bg-brand-50'
                                            : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                                        }`}
                                >
                                    <input {...register('role')} type="radio" value={value} className="sr-only" />
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedRole === value ? 'bg-brand-100' : 'bg-gray-100'}`}>
                                        <Icon size={20} className={selectedRole === value ? 'text-brand-600' : 'text-gray-400'} />
                                    </div>
                                    <span className={`font-black text-sm ${selectedRole === value ? 'text-brand-700' : 'text-gray-600'}`}>{label}</span>
                                    <span className="text-[9px] text-gray-400 font-bold text-center leading-tight">{sub}</span>
                                    {selectedRole === value && (
                                        <div className="absolute top-2 right-2 w-4 h-4 bg-brand-600 rounded-full flex items-center justify-center">
                                            <span className="text-white text-[8px]">✓</span>
                                        </div>
                                    )}
                                </label>
                            ))}
                        </div>
                    </div>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-start gap-3 bg-red-50 text-red-700 p-4 rounded-xl text-sm border border-red-100"
                        >
                            <span className="text-red-400 mt-0.5">⚠</span>
                            <span className="font-medium">{error}</span>
                        </motion.div>
                    )}

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full h-[54px] bg-brand-600 hover:bg-brand-700 active:scale-[0.98] text-white font-black text-base rounded-xl shadow-md transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? (
                            <Loader2 className="animate-spin" size={20} />
                        ) : (
                            <>Continue <ArrowRight size={18} /></>
                        )}
                    </button>
                </form>
            </motion.div>
        </div>
    );
}
