'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import {
    Loader2,
    Phone,
    User as UserIcon,
    Lock,
    ArrowRight,
    Store,
    Home,
    CheckCircle2,
    Eye,
    EyeOff,
    Package
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { motion } from 'framer-motion';
import { ApiResponse, AuthResponse } from '@/types';
import { Logo } from '@/components/shared/Logo';
import { AuthCinematicSide } from '@/components/auth/AuthCinematicSide';
import { normalizePhoneNumber, handleApiError } from '@/lib/utils';
import TurnstileWidget from '@/components/shared/TurnstileWidget';

interface RegisterFormData {
    name: string;
    phone: string;
    role: 'resident' | 'trader' | 'delivery';
    password: string;
    password_confirmation: string;
    preferred_language: string;
}

export default function RegisterPage() {
    const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<RegisterFormData>({
        defaultValues: {
            preferred_language: 'en',
            role: 'resident'
        } as RegisterFormData
    });
    const setAuth = useAuthStore((state) => state.setAuth);
    const router = useRouter();
    const [error, setError] = React.useState<string | null>(null);
    const [showPassword, setShowPassword] = React.useState(false);
    const [isRedirecting, setIsRedirecting] = React.useState(false);
    const [turnstileToken, setTurnstileToken] = React.useState<string | null>(null);

    const selectedRole = watch('role');
    const password = watch('password');

    const isPasswordStrong = (() => {
        if (!password) return false;
        let s = 0;
        if (password.length >= 8) s++;
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) s++;
        if (/\d/.test(password)) s++;
        if (/[@$!%*?&]/.test(password)) s++;
        return s === 4;
    })();

    const onSubmit = async (data: RegisterFormData) => {
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

            const response = await api.post('/auth/register', normalizedData) as unknown as ApiResponse<AuthResponse>;
            setAuth(response.data.user, response.data.token);
            setIsRedirecting(true); // Keep loading state active during Next.js router transition
            router.push('/verify');
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
                    className="w-full lg:w-1/2 flex flex-col justify-center items-center px-6 py-12 lg:px-14 bg-white overflow-y-auto"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4 }}
                >
                    <div className="w-full max-w-md">
                        {/* Mobile logo */}
                        <div className="lg:hidden flex flex-col items-center mb-8">
                            <Logo variant="icon" width={64} height={64} className="mb-4" />
                        </div>

                        <div className="mb-8">
                            <h2 className="text-3xl font-black text-green-950 mb-2">Create your account</h2>
                            <p className="text-text-secondary">Join thousands already using Soko Mtaa.</p>
                        </div>

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                            {/* Full Name */}
                            <div>
                                <label className="block text-sm font-bold text-green-900 mb-2">Full Name</label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-500">
                                        <UserIcon size={18} />
                                    </div>
                                    <input
                                        {...register('name', { required: 'Full name is required' })}
                                        className="w-full h-[54px] pl-12 pr-4 rounded-xl border border-gray-200 bg-gray-50 text-green-950 placeholder:text-gray-400 text-base font-medium focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent focus:bg-white transition-all"
                                        placeholder="e.g. John Kamau"
                                        autoComplete="name"
                                    />
                                </div>
                                {errors.name && <p className="text-red-500 text-xs font-medium mt-1.5">{errors.name.message}</p>}
                            </div>

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

                            {/* Role Selection */}
                            <div>
                                <label className="block text-sm font-bold text-green-900 mb-3">I am a...</label>
                                <div className="grid grid-cols-3 gap-3">
                                    <label className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedRole === 'resident'
                                        ? 'border-brand-500 bg-brand-50'
                                        : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                                        }`}>
                                        <input {...register('role')} type="radio" value="resident" className="sr-only" />
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedRole === 'resident' ? 'bg-brand-100' : 'bg-gray-100'}`}>
                                            <Home size={20} className={selectedRole === 'resident' ? 'text-brand-600' : 'text-gray-400'} />
                                        </div>
                                        <span className={`font-black text-sm ${selectedRole === 'resident' ? 'text-brand-700' : 'text-gray-600'}`}>Resident</span>
                                        <span className="text-[9px] text-gray-400 font-bold text-center leading-tight">Buy produce</span>
                                        {selectedRole === 'resident' && (
                                            <div className="absolute top-2 right-2 w-4 h-4 bg-brand-600 rounded-full flex items-center justify-center">
                                                <span className="text-white text-[8px]">✓</span>
                                            </div>
                                        )}
                                    </label>
                                    <label className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedRole === 'trader'
                                        ? 'border-brand-500 bg-brand-50'
                                        : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                                        }`}>
                                        <input {...register('role')} type="radio" value="trader" className="sr-only" />
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedRole === 'trader' ? 'bg-brand-100' : 'bg-gray-100'}`}>
                                            <Store size={20} className={selectedRole === 'trader' ? 'text-brand-600' : 'text-gray-400'} />
                                        </div>
                                        <span className={`font-black text-sm ${selectedRole === 'trader' ? 'text-brand-700' : 'text-gray-600'}`}>Trader</span>
                                        <span className="text-[9px] text-gray-400 font-bold text-center leading-tight">Sell at market</span>
                                        {selectedRole === 'trader' && (
                                            <div className="absolute top-2 right-2 w-4 h-4 bg-brand-600 rounded-full flex items-center justify-center">
                                                <span className="text-white text-[8px]">✓</span>
                                            </div>
                                        )}
                                    </label>
                                    <label className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedRole === 'delivery'
                                        ? 'border-brand-500 bg-brand-50'
                                        : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                                        }`}>
                                        <input {...register('role')} type="radio" value="delivery" className="sr-only" />
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedRole === 'delivery' ? 'bg-brand-100' : 'bg-gray-100'}`}>
                                            <Package size={20} className={selectedRole === 'delivery' ? 'text-brand-600' : 'text-gray-400'} />
                                        </div>
                                        <span className={`font-black text-sm ${selectedRole === 'delivery' ? 'text-brand-700' : 'text-gray-600'}`}>Rider</span>
                                        <span className="text-[9px] text-gray-400 font-bold text-center leading-tight">Deliver orders</span>
                                        {selectedRole === 'delivery' && (
                                            <div className="absolute top-2 right-2 w-4 h-4 bg-brand-600 rounded-full flex items-center justify-center">
                                                <span className="text-white text-[8px]">✓</span>
                                            </div>
                                        )}
                                    </label>
                                </div>
                            </div>

                            {/* Password */}
                            <div>
                                <label className="block text-sm font-bold text-green-900 mb-2">Password</label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-500">
                                        <Lock size={18} />
                                    </div>
                                    <input
                                        {...register('password', {
                                            required: 'Password is required',
                                            minLength: { value: 8, message: 'Password must be at least 8 characters' },
                                            pattern: {
                                                value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
                                                message: 'Password must include uppercase, lowercase, number and special character'
                                            }
                                        })}
                                        className="w-full h-[54px] pl-12 pr-12 rounded-xl border border-gray-200 bg-gray-50 text-green-950 placeholder:text-gray-400 text-base font-medium focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent focus:bg-white transition-all"
                                        placeholder="••••••••"
                                        type={showPassword ? 'text' : 'password'}
                                        autoComplete="new-password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand-600 transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>

                                {/* Strength Indicator */}
                                {password && (
                                    <div className="mt-3 space-y-2">
                                        <div className="flex gap-1 h-1">
                                            {[1, 2, 3, 4].map((level) => {
                                                const strength = (() => {
                                                    let s = 0;
                                                    if (password.length >= 8) s++;
                                                    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) s++;
                                                    if (/\d/.test(password)) s++;
                                                    if (/[@$!%*?&]/.test(password)) s++;
                                                    return s;
                                                })();

                                                const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500'];
                                                return (
                                                    <div
                                                        key={level}
                                                        className={`flex-1 rounded-full transition-all duration-500 ${level <= strength ? colors[strength - 1] : 'bg-gray-100'
                                                            }`}
                                                    />
                                                );
                                            })}
                                        </div>

                                        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                                            <Requirement item="8+ characters" met={password.length >= 8} />
                                            <Requirement item="Upper & Lowercase" met={/[a-z]/.test(password) && /[A-Z]/.test(password)} />
                                            <Requirement item="At least one number" met={/\d/.test(password)} />
                                            <Requirement item="Special character" met={/[@$!%*?&]/.test(password)} />
                                        </div>
                                    </div>
                                )}

                                {errors.password && <p className="text-red-500 text-xs font-medium mt-1.5">{errors.password.message}</p>}
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <label className="block text-sm font-bold text-green-900 mb-2">Confirm Password</label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-500">
                                        <Lock size={18} />
                                    </div>
                                    <input
                                        {...register('password_confirmation', {
                                            required: 'Please confirm your password',
                                            validate: (val) => val === password || 'Passwords do not match'
                                        })}
                                        className="w-full h-[54px] pl-12 pr-4 rounded-xl border border-gray-200 bg-gray-50 text-green-950 placeholder:text-gray-400 text-base font-medium focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent focus:bg-white transition-all"
                                        placeholder="••••••••"
                                        type="password"
                                        autoComplete="new-password"
                                    />
                                </div>
                                {errors.password_confirmation && <p className="text-red-500 text-xs font-medium mt-1.5">{errors.password_confirmation.message}</p>}
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
                                disabled={isSubmitting || isRedirecting || !isPasswordStrong || !turnstileToken}
                                className="w-full h-[54px] bg-brand-600 hover:bg-brand-700 active:scale-[0.98] text-white font-black text-base rounded-xl shadow-md transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
                                type="submit"
                            >
                                {(isSubmitting || isRedirecting) ? (
                                    <Loader2 className="animate-spin" size={20} />
                                ) : (
                                    <>
                                        Create Account
                                        <ArrowRight size={18} />
                                    </>
                                )}
                            </button>

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

                            <p className="text-center text-sm text-gray-400 mt-2">
                                Already have an account?{' '}
                                <button
                                    type="button"
                                    onClick={() => router.push('/login')}
                                    className="text-brand-600 font-black hover:underline"
                                >
                                    Sign in
                                </button>
                            </p>
                        </form>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}

const Requirement = ({ item, met }: { item: string; met: boolean }) => (
    <div className="flex items-center gap-2">
        <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center transition-colors ${met ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
            {met ? <CheckCircle2 size={10} /> : <div className="w-1 h-1 rounded-full bg-current" />}
        </div>
        <span className={`text-[10px] font-bold tracking-tight transition-colors ${met ? 'text-green-700' : 'text-gray-400'}`}>
            {item}
        </span>
    </div>
);
