'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import { Loader2, Phone, User as UserIcon, Lock } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { ApiResponse, AuthResponse } from '@/types';

interface RegisterFormData {
    name: string;
    phone: string;
    role: 'resident' | 'trader';
    password: string;
    password_confirmation: string;
    preferred_language: string;
}

export default function RegisterPage() {
    const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<RegisterFormData>({
        defaultValues: {
            preferred_language: 'sw',
            role: 'resident'
        } as RegisterFormData
    });
    const setAuth = useAuthStore((state) => state.setAuth);
    const router = useRouter();
    const [error, setError] = React.useState<string | null>(null);

    const selectedRole = watch('role');

    const onSubmit = async (data: RegisterFormData) => {
        try {
            setError(null);
            const response = await api.post<ApiResponse<AuthResponse>>('/auth/register', data) as unknown as ApiResponse<AuthResponse>;
            setAuth(response.data.user, response.data.token);
            router.push('/verify');
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } }, message?: string };
            setError(error.response?.data?.message || error.message || 'Registration failed. Check your details.');
        }
    };

    return (
        <div className="flex flex-col min-h-screen p-6 pt-12 animate-fade-up">
            <div className="mb-8 text-center">
                <h1 className="text-3xl mb-2 text-green-950 font-bold">Jiunge na Soko Mtaa</h1>
                <p className="text-text-secondary">Unda akaunti yako ili kuanza safari yako.</p>
                <p className="text-xs text-text-muted mt-1">(Create your account to start your journey.)</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pb-32">
                {/* Full Name */}
                <div>
                    <label className="input-label">
                        Jina Kamili / Full Name
                    </label>
                    <div className="relative">
                        <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={20} />
                        <input
                            {...register('name', { required: 'Jina linahitajika' })}
                            className="input pl-12"
                            placeholder="John Doe"
                        />
                    </div>
                    {errors.name && <p className="input-error-msg">{errors.name.message as string}</p>}
                </div>

                {/* Phone */}
                <div>
                    <label className="input-label">
                        Namba ya Simu / Phone Number
                    </label>
                    <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={20} />
                        <input
                            {...register('phone', { required: 'Namba ya simu inahitajika' })}
                            className="input pl-12"
                            placeholder="07XXXXXXXX"
                            type="tel"
                        />
                    </div>
                    {errors.phone && <p className="input-error-msg">{errors.phone.message as string}</p>}
                </div>

                {/* Role Selection */}
                <div>
                    <label className="input-label">
                        Wewe ni nani? / Who are you?
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                        <label className={`card p-4 flex flex-col items-center justify-center cursor-pointer transition-all ${selectedRole === 'resident' ? 'border-brand-500 bg-brand-50 bg-noise ring-2 ring-brand-500/20' : 'border-border'}`}>
                            <input {...register('role')} type="radio" value="resident" className="hidden" />
                            <span className={`font-bold text-sm ${selectedRole === 'resident' ? 'text-brand-700' : 'text-text-primary'}`}>Mkazi</span>
                            <span className="text-[10px] text-text-secondary uppercase tracking-wider font-bold">Resident</span>
                        </label>
                        <label className={`card p-4 flex flex-col items-center justify-center cursor-pointer transition-all ${selectedRole === 'trader' ? 'border-brand-500 bg-brand-50 bg-noise ring-2 ring-brand-500/20' : 'border-border'}`}>
                            <input {...register('role')} type="radio" value="trader" className="hidden" />
                            <span className={`font-bold text-sm ${selectedRole === 'trader' ? 'text-brand-700' : 'text-text-primary'}`}>Mfanyabiashara</span>
                            <span className="text-[10px] text-text-secondary uppercase tracking-wider font-bold">Trader</span>
                        </label>
                    </div>
                </div>

                {/* Password */}
                <div>
                    <label className="input-label">
                        Nenosiri / Password
                    </label>
                    <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={20} />
                        <input
                            {...register('password', { required: 'Nenosiri linahitajika', minLength: { value: 8, message: 'Nenosiri lazima liwe na herufi 8+' } })}
                            className="input pl-12"
                            placeholder="••••••••"
                            type="password"
                        />
                    </div>
                    {errors.password && <p className="input-error-msg">{errors.password.message as string}</p>}
                </div>

                {/* Confirm Password */}
                <div>
                    <label className="input-label">
                        Thibitisha Nenosiri / Confirm Password
                    </label>
                    <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={20} />
                        <input
                            {...register('password_confirmation', { required: 'Thibitisha nenosiri' })}
                            className="input pl-12"
                            placeholder="••••••••"
                            type="password"
                        />
                    </div>
                </div>

                {error && (
                    <div className="bg-color-error-bg text-color-error-dark p-4 rounded-xl text-sm border border-color-error/10">
                        {error}
                    </div>
                )}

                <div className="fixed bottom-0 left-0 right-0 p-6 bg-surface-glass backdrop-blur-md border-t border-border lg:absolute max-w-[480px] mx-auto z-20">
                    <button
                        disabled={isSubmitting}
                        className="btn btn-primary w-full h-[56px] text-lg shadow-brand-lg"
                        type="submit"
                    >
                        {isSubmitting ? <Loader2 className="animate-spin" /> : 'Jisajili / Register'}
                    </button>
                    <button
                        type="button"
                        onClick={() => router.push('/login')}
                        className="w-full text-center text-sm font-bold text-brand-700 mt-4 h-10"
                    >
                        Tayari nina akaunti (I have an account)
                    </button>
                </div>
            </form>
        </div>
    );
}
