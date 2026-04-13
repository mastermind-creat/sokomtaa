'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import { Loader2, Phone, Lock } from 'lucide-react';

import { ApiResponse, AuthResponse } from '@/types';

interface LoginFormData {
    phone?: string;
    password?: string;
}

export default function LoginPage() {
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormData>();
    const setAuth = useAuthStore((state) => state.setAuth);
    const router = useRouter();
    const [error, setError] = React.useState<string | null>(null);

    const onSubmit = async (data: LoginFormData) => {
        try {
            setError(null);
            const response = await api.post<ApiResponse<AuthResponse>>('/auth/login', data);
            const { user, token } = response.data.data;
            
            setAuth(user, token);
            
            if (user.role === 'admin') router.push('/admin/dashboard');
            else if (user.role === 'trader') router.push('/trader/dashboard');
            else router.push('/');
        } catch (err: unknown) {
            const errorObj = err as { response?: { data?: { message?: string } }, message?: string };
            const errorMsg = errorObj.response?.data?.message || errorObj.message || 'Login failed. Please check your credentials.';
            setError(errorMsg);
        }
    };

    return (
        <div className="flex flex-col min-h-screen p-6 pt-12 animate-fade-up">
            <div className="mb-10 text-center">
                <div className="w-16 h-16 bg-brand-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl mx-auto mb-6 shadow-brand-md">SM</div>
                <h1 className="text-3xl mb-2 text-green-950">Soko Mtaa</h1>
                <p className="text-text-secondary">Karibu tena. Tafadhali ingia ili uendelee.</p>
                <p className="text-xs text-text-muted mt-1">(Welcome back. Please login to continue.)</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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

                <div>
                    <label className="input-label">
                        Nenosiri / Password
                    </label>
                    <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={20} />
                        <input
                            {...register('password', { required: 'Nenosiri linahitajika' })}
                            className="input pl-12"
                            placeholder="••••••••"
                            type="password"
                        />
                    </div>
                    {errors.password && <p className="input-error-msg">{errors.password.message as string}</p>}
                </div>

                {error && (
                    <div className="bg-color-error-bg text-color-error-dark p-4 rounded-xl text-sm border border-color-error/20 animate-scale-in">
                        {error}
                    </div>
                )}

                <button
                    disabled={isSubmitting}
                    className="btn btn-primary w-full mt-4 h-[56px] text-lg"
                    type="submit"
                >
                    {isSubmitting ? <Loader2 className="animate-spin" /> : 'Ingia / Login'}
                </button>
            </form>

            <div className="mt-8 text-center space-y-4">
                <button 
                    onClick={() => router.push('/register')}
                    className="text-brand-600 font-bold text-sm h-12 flex items-center justify-center w-full active:scale-95 transition-all"
                >
                    Huna akaunti? Jisajili hapa (Register here)
                </button>
                <button className="text-text-muted text-sm h-12 flex items-center justify-center w-full">
                    Umesahau nenosiri? (Forgot password?)
                </button>
            </div>
        </div>
    );
}
