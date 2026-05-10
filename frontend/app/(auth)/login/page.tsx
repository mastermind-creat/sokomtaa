'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Phone, Lock, ArrowRight, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { ApiResponse, AuthResponse } from '@/types';

interface LoginFormData {
    phone: string;
    password: string;
}
import { Logo } from '@/components/shared/Logo';

export default function LoginPage() {
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormData>();
    const { user, isAuthenticated, setAuth } = useAuthStore();
    const router = useRouter();
    const [error, setError] = React.useState<string | null>(null);
    const [showPassword, setShowPassword] = React.useState(false);
    const [isRedirecting, setIsRedirecting] = React.useState(false);

    React.useEffect(() => {
        if (isAuthenticated && user) {
            if (user.role === 'admin') router.push('/admin/dashboard');
            else if (user.role === 'trader') router.push('/trader/dashboard');
            else if (user.role === 'resident') router.push('/resident/dashboard');
            else router.push('/');
        }
    }, [isAuthenticated, user, router]);

    const onSubmit = async (data: LoginFormData) => {
        try {
            setError(null);
            const response = await api.post('/auth/login', data) as unknown as ApiResponse<AuthResponse>;
            const { user, token } = response.data;

            setAuth(user, token);
            setIsRedirecting(true); // Keep loading state active during Next.js router transition

            if (!user.phone_verified) {
                router.push('/verify');
            } else if (user.role === 'admin') {
                router.push('/admin/dashboard');
            } else if (user.role === 'trader') {
                router.push('/trader/dashboard');
            } else {
                router.push('/');
            }
        } catch (err: unknown) {
            const errObj = err as { message?: string } | string;
            const msg = typeof errObj === 'string' ? errObj : errObj?.message ?? 'Login failed. Please check your credentials.';
            setError(msg);
            setIsRedirecting(false);
        }
    };

    return (
        <div className="bg-white">
            <div className="min-h-screen w-full flex">
            {/* Left Panel — Branding (desktop only) */}
            <div className="hidden lg:flex flex-col justify-between w-[45%] bg-gradient-to-br from-green-900 via-brand-700 to-green-800 p-14 relative overflow-hidden">
                {/* Background decoration */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-[-20%] right-[-20%] w-[600px] h-[600px] rounded-full bg-white" />
                    <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] rounded-full bg-amber-400" />
                </div>

                <div className="relative z-10">
                    <motion.div 
                        className="mb-16 cursor-pointer inline-block" 
                        onClick={() => router.push('/')}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <Logo variant="green" width={180} />
                    </motion.div>

                    <motion.h2 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="text-4xl font-black text-white leading-tight mb-4"
                    >
                        Kenya&apos;s Neighbourhood<br />Digital Marketplace
                    </motion.h2>
                    <motion.p 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="text-green-200 text-lg leading-relaxed"
                    >
                        Connecting local traders and residents across Kenyan markets — digitally, seamlessly, locally.
                    </motion.p>
                </div>

                <div className="relative z-10 grid grid-cols-2 gap-4">
                    {[
                        { label: 'Active Markets', value: '12+' },
                        { label: 'Registered Traders', value: '500+' },
                        { label: 'Daily Transactions', value: '1,200+' },
                        { label: 'Counties Covered', value: '4' },
                    ].map((stat, idx) => (
                        <motion.div 
                            key={stat.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: 0.2 + (idx * 0.1) }}
                            whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.15)" }}
                            className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10 cursor-pointer transition-colors"
                        >
                            <p className="text-2xl font-black text-white">{stat.value}</p>
                            <p className="text-xs text-green-200 font-medium mt-0.5">{stat.label}</p>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Right Panel — Form */}
            <motion.div
                className="flex-1 flex flex-col justify-center items-center px-6 py-12 lg:px-16 bg-white"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4 }}
            >
                <div className="w-full max-w-md">
                    {/* Mobile logo only */}
                    <div className="lg:hidden flex flex-col items-center mb-10">
                        <Logo variant="icon" width={64} height={64} className="mb-4" />
                        <h1 className="text-2xl font-black text-green-950">Soko Mtaa</h1>
                    </div>

                    <div className="mb-10">
                        <div className="flex items-center gap-2 mb-2">
                            <ShieldCheck size={16} className="text-brand-600" />
                            <span className="text-xs font-bold text-brand-600 uppercase tracking-widest">Secure Login</span>
                        </div>
                        <h2 className="text-3xl font-black text-green-950 mb-2">Welcome back</h2>
                        <p className="text-text-secondary">Sign in to your Soko Mtaa account to continue.</p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        {/* Phone Field */}
                        <div>
                            <label className="block text-sm font-bold text-green-900 mb-2">
                                Phone Number
                            </label>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center w-5 h-5 text-brand-500">
                                    <Phone size={18} />
                                </div>
                                <input
                                    {...register('phone', { required: 'Phone number is required' })}
                                    className="w-full h-[54px] pl-12 pr-4 rounded-xl border border-gray-200 bg-gray-50 text-green-950 placeholder:text-gray-400 text-base font-medium focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent focus:bg-white transition-all"
                                    placeholder="07XXXXXXXX"
                                    type="tel"
                                    autoComplete="tel"
                                />
                            </div>
                            {errors.phone && <p className="text-red-500 text-xs font-medium mt-1.5">{errors.phone.message}</p>}
                        </div>

                        {/* Password Field */}
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-sm font-bold text-green-900">Password</label>
                                <Link href="/forgot-password" className="text-xs text-brand-600 font-bold hover:underline">
                                    Forgot password?
                                </Link>
                            </div>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center w-5 h-5 text-brand-500">
                                    <Lock size={18} />
                                </div>
                                <input
                                    {...register('password', { required: 'Password is required' })}
                                    className="w-full h-[54px] pl-12 pr-12 rounded-xl border border-gray-200 bg-gray-50 text-green-950 placeholder:text-gray-400 text-base font-medium focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent focus:bg-white transition-all"
                                    placeholder="••••••••"
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-bold"
                                >
                                    {showPassword ? 'HIDE' : 'SHOW'}
                                </button>
                            </div>
                            {errors.password && <p className="text-red-500 text-xs font-medium mt-1.5">{errors.password.message}</p>}
                        </div>

                        {/* Error Banner */}
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

                        {/* Submit Button */}
                        <button
                            disabled={isSubmitting || isRedirecting}
                            className="w-full h-[54px] bg-brand-600 hover:bg-brand-700 active:scale-[0.98] text-white font-black text-base rounded-xl shadow-md transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
                            type="submit"
                        >
                            {(isSubmitting || isRedirecting) ? (
                                <Loader2 className="animate-spin" size={20} />
                            ) : (
                                <>
                                    Sign In
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-text-secondary text-sm">
                            Don&apos;t have an account?{' '}
                            <button
                                onClick={() => router.push('/register')}
                                className="text-brand-600 font-black hover:underline"
                            >
                                Register here
                            </button>
                        </p>
                    </div>
                </div>
            </motion.div>
            </div>
        </div>
    );
}
