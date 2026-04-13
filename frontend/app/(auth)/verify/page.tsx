'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import { Loader2, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { ApiResponse } from '@/types';

interface VerifyFormData {
    otp: string;
}

export default function VerifyPage() {
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<VerifyFormData>();
    const { user, refreshUser } = useAuthStore();
    const router = useRouter();
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        if (!user) {
            router.push('/login');
        } else if (user.phone_verified) {
            router.push('/');
        }
    }, [user, router]);

    const onSubmit = async (data: VerifyFormData) => {
        try {
            setError(null);
            await api.post<never, ApiResponse<void>>('/auth/verify-phone', data);
            await refreshUser();
            router.push('/');
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } }, message?: string };
            setError(error.response?.data?.message || error.message || 'Verification failed. Try again.');
        }
    };

    return (
        <div className="flex flex-col min-h-screen p-6 pt-12 animate-fade-up">
            <div className="mb-10 text-center">
                <div className="w-20 h-20 bg-brand-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-brand-sm">
                    <ShieldCheck className="text-brand-600" size={40} />
                </div>
                <h1 className="text-3xl mb-2 text-green-950 font-bold">Thibitisha Namba</h1>
                <p className="text-text-secondary">Tumekutumia namba ya siri (OTP) kwa <span className="font-bold text-text-primary">{user?.phone}</span>.</p>
                <p className="text-xs text-text-muted mt-1">(We&apos;ve sent an OTP to your phone number.)</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                <div>
                    <label className="input-label text-center">
                        Ingiza namba ya siri / Enter OTP Code
                    </label>
                    <input
                        {...register('otp', { required: 'Namba ya siri inahitajika', minLength: 6, maxLength: 6 })}
                        className="input text-center text-4xl tracking-[1rem] font-black h-20 border-2"
                        placeholder="000000"
                        maxLength={6}
                        type="text"
                        inputMode="numeric"
                    />
                    {errors.otp && <p className="input-error-msg justify-center">{errors.otp.message as string}</p>}
                </div>

                {error && (
                    <div className="bg-color-error-bg text-color-error-dark p-4 rounded-xl text-sm border border-color-error/10">
                        {error}
                    </div>
                )}

                <button
                    disabled={isSubmitting}
                    className="btn btn-primary w-full h-[56px] text-lg shadow-brand-md"
                    type="submit"
                >
                    {isSubmitting ? <Loader2 className="animate-spin" /> : 'Thibitisha / Verify'}
                </button>
            </form>

            <div className="mt-8 text-center">
                <button className="text-brand-600 font-bold text-sm h-12 flex items-center justify-center w-full active:scale-95 transition-all">
                    Hujaipata? Tuma tena (Didn&apos;t get it? Resend)
                </button>
            </div>
        </div>
    );
}
