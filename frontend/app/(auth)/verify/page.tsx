'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import { Loader2, ShieldCheck, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { motion } from 'framer-motion';
import { ApiResponse } from '@/types';

interface VerifyFormData {
    otp: string;
}

import { Logo } from '@/components/shared/Logo';
import { AuthCinematicSide } from '@/components/auth/AuthCinematicSide';

export default function VerifyPage() {
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<VerifyFormData>();
    const { user, refreshUser } = useAuthStore();
    const router = useRouter();
    const [error, setError] = React.useState<string | null>(null);
    const [resendLoading, setResendLoading] = React.useState(false);
    const [resendMessage, setResendMessage] = React.useState<string | null>(null);
    const [cooldown, setCooldown] = React.useState(0);

    React.useEffect(() => {
        if (!user) {
            router.push('/login');
        } else if (user.phone_verified) {
            if (user.role === 'admin') router.push('/admin/dashboard');
            else if (user.role === 'trader') router.push('/trader/dashboard');
            else router.push('/');
        }
    }, [user, router]);

    // Handle Cooldown Timer
    React.useEffect(() => {
        let timer: NodeJS.Timeout;
        if (cooldown > 0) {
            timer = setInterval(() => {
                setCooldown((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [cooldown]);

    const onSubmit = async (data: VerifyFormData) => {
        try {
            setError(null);
            setResendMessage(null);
            await api.post<ApiResponse<void>>('/auth/verify-phone', data);
            await refreshUser();
            
            // Get updated user from store
            const updatedUser = useAuthStore.getState().user;
            if (updatedUser?.role === 'admin') router.push('/admin/dashboard');
            else if (updatedUser?.role === 'trader') router.push('/trader/dashboard');
            else router.push('/');
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || 'Verification failed. Try again.');
        }
    };

    const handleResend = async () => {
        if (cooldown > 0) return;
        
        try {
            setResendLoading(true);
            setError(null);
            setResendMessage(null);
            
            const response = await api.post<never, ApiResponse<any>>('/auth/resend-otp');
            setResendMessage(response.message || 'Verification code resent successfully.');
            setCooldown(60); // 1 minute cooldown
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to resend code. Please try again.');
        } finally {
            setResendLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex">
            {/* Left Panel — Cinematic Branding */}
            <AuthCinematicSide />

            {/* Right Panel — Verification Form */}
            <motion.div 
                className="w-full lg:w-1/2 flex flex-col justify-center items-center px-6 py-12 lg:px-14 bg-[#FAFAF8]"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4 }}
            >
                <div className="w-full max-w-md">
                    {/* Mobile logo only */}
                    <div className="lg:hidden flex flex-col items-center mb-10">
                        <Logo variant="icon" width={64} height={64} className="mb-4" />
                        <h1 className="text-2xl font-black text-green-950 px-2">Soko Mtaa</h1>
                    </div>

                    <div className="mb-10 lg:text-left text-center">
                        <div className="flex items-center lg:justify-start justify-center gap-2 mb-2">
                            <ShieldCheck size={18} className="text-brand-600" />
                            <span className="text-xs font-bold text-brand-600 uppercase tracking-widest">Phone Verification</span>
                        </div>
                        <h2 className="text-3xl font-black text-green-950 mb-3">Check your phone</h2>
                        <p className="text-text-secondary">
                            We&lsquo;ve sent a 6-digit code to <span className="font-bold text-green-900">{user?.phone}</span>. 
                            Please enter it below to verify your account.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                        <div>
                            <label className="block text-sm font-bold text-green-900 mb-4 lg:text-left text-center">
                                Enter 6-digit OTP Code
                            </label>
                            <input
                                {...register('otp', { 
                                    required: 'Please enter the code', 
                                    minLength: { value: 6, message: 'Code must be 6 digits' },
                                    maxLength: 6 
                                })}
                                className="w-full h-20 text-center text-4xl tracking-[1.25rem] font-black rounded-2xl border-2 border-gray-200 bg-white shadow-sm focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none transition-all placeholder:text-gray-200"
                                placeholder="000000"
                                maxLength={6}
                                type="text"
                                inputMode="numeric"
                            />
                            {errors.otp && (
                                <p className="text-red-500 text-xs font-bold mt-2 text-center lg:text-left">
                                    {errors.otp.message as string}
                                </p>
                            )}
                        </div>

                        {error && (
                            <motion.div 
                                initial={{ opacity: 0, y: -8 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-red-50 text-red-700 p-4 rounded-xl text-sm border border-red-100 font-medium flex gap-3"
                            >
                                <span className="text-red-400 mt-0.5">⚠</span>
                                {error}
                            </motion.div>
                        )}

                        {resendMessage && (
                            <motion.div 
                                initial={{ opacity: 0, y: -8 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-green-50 text-green-700 p-4 rounded-xl text-sm border border-green-100 font-medium flex gap-3"
                            >
                                <CheckCircle2 size={18} className="text-green-500 shrink-0" />
                                {resendMessage}
                            </motion.div>
                        )}

                        <button
                            disabled={isSubmitting}
                            className="w-full h-[58px] bg-brand-600 hover:bg-brand-700 active:scale-[0.98] text-white font-black text-lg rounded-xl shadow-lg shadow-brand-600/20 transition-all flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed"
                            type="submit"
                        >
                            {isSubmitting ? (
                                <Loader2 className="animate-spin" size={24} />
                            ) : (
                                <>
                                    Verify Account
                                    <ArrowRight size={20} />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-10 text-center">
                        <p className="text-text-secondary text-sm mb-2">Didn&lsquo;t receive the code?</p>
                        <button 
                            onClick={handleResend}
                            disabled={resendLoading || cooldown > 0}
                            className="text-brand-600 font-black text-sm hover:underline hover:text-brand-700 transition-colors inline-flex items-center gap-1 group disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {resendLoading ? (
                                <Loader2 className="animate-spin" size={16} />
                            ) : cooldown > 0 ? (
                                `Resend in ${cooldown}s`
                            ) : (
                                <>
                                    Resend New SMS Code
                                    <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
