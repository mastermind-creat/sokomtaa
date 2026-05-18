'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
    Loader2, 
    Phone, 
    Lock, 
    ArrowRight, 
    ShieldCheck, 
    Store, 
    TrendingUp, 
    Users, 
    ShoppingBag,
    Eye,
    EyeOff
} from 'lucide-react';
import { motion } from 'framer-motion';
import { ApiResponse, AuthResponse } from '@/types';
import { Logo } from '@/components/shared/Logo';
import { AuthCinematicSide } from '@/components/auth/AuthCinematicSide';
import { normalizePhoneNumber, handleApiError } from '@/lib/utils';

interface LoginFormData {
    phone: string;
    password: string;
}

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
            else if (user.role === 'delivery') router.push('/delivery/dashboard');
            else router.push('/');
        }
    }, [isAuthenticated, user, router]);

    const onSubmit = async (data: LoginFormData) => {
        try {
            setError(null);
            // Normalize phone before sending to API
            const normalizedData = {
                ...data,
                phone: normalizePhoneNumber(data.phone)
            };
            
            const response = await api.post('/auth/login', normalizedData) as unknown as ApiResponse<AuthResponse>;
            const { user, token } = response.data;

            setAuth(user, token);
            setIsRedirecting(true); // Keep loading state active during Next.js router transition

            if (!user.phone_verified) {
                router.push('/verify');
            } else if (user.role === 'admin') {
                router.push('/admin/dashboard');
            } else if (user.role === 'trader') {
                router.push('/trader/dashboard');
            } else if (user.role === 'resident') {
                router.push('/resident');
            } else if (user.role === 'delivery') {
                router.push('/delivery/dashboard');
            } else {
                router.push('/');
            }
        } catch (err: unknown) {
            setError(handleApiError(err));
            setIsRedirecting(false);
        }
    };


    return (
        <div className="bg-white">
            <div className="min-h-screen w-full flex">
            {/* Left Panel — Cinematic Branding */}
            <AuthCinematicSide />

            {/* Right Panel — Form */}
            <motion.div
                className="w-full lg:w-1/2 flex flex-col justify-center items-center px-6 py-12 lg:px-16 bg-white"
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
                                    {...register('phone', { 
                                        required: 'Phone number is required',
                                        pattern: {
                                            value: /^(?:\+254|254|0)?([17]\d{8})$/,
                                            message: 'Invalid Kenyan phone number format'
                                        }
                                    })}
                                    className="w-full h-[54px] pl-12 pr-4 rounded-xl border border-gray-200 bg-gray-50 text-green-950 placeholder:text-gray-400 text-base font-medium focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent focus:bg-white transition-all"
                                    placeholder="07XXXXXXXX or +254..."
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
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand-600 transition-colors"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
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
