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
import TurnstileWidget from '@/components/shared/TurnstileWidget';

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
    const [turnstileToken, setTurnstileToken] = React.useState<string | null>(null);

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
            if (!turnstileToken) {
                setError('Please complete the security check.');
                return;
            }
            const normalizedData = {
                ...data,
                phone: normalizePhoneNumber(data.phone),
                cf_turnstile_token: turnstileToken,
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

                            {/* Cloudflare Turnstile */}
                            <TurnstileWidget
                                onVerify={setTurnstileToken}
                                onExpire={() => setTurnstileToken(null)}
                                onError={() => setError('Security check failed. Please refresh and try again.')}
                            />

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
                                disabled={isSubmitting || isRedirecting || !turnstileToken}
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

                        <div className="flex items-center my-6">
                            <div className="flex-grow border-t border-gray-200"></div>
                            <span className="px-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Or continue with</span>
                            <div className="flex-grow border-t border-gray-200"></div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <button
                                type="button"
                                className="flex items-center justify-center gap-2 h-[50px] rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-green-950 font-bold transition-all shadow-sm"
                                onClick={() => alert("Google sign-in is currently pending setup.")}
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                </svg>
                                Google
                            </button>
                            <button
                                type="button"
                                className="flex items-center justify-center gap-2 h-[50px] rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-green-950 font-bold transition-all shadow-sm"
                                onClick={() => alert("Apple sign-in is currently pending setup.")}
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.04 2.26-.82 3.55-.86 1.54-.03 2.82.5 3.65 1.6-3.11 1.68-2.52 5.92.51 7.15-.71 1.83-1.57 3.35-2.79 4.28zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.35 2.37-2.07 4.29-3.74 4.25z" />
                                </svg>
                                Apple
                            </button>
                        </div>

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
