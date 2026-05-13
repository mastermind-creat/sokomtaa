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
    EyeOff
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { motion } from 'framer-motion';
import { ApiResponse, AuthResponse } from '@/types';
import { AuthCinematicSide } from '@/components/auth/AuthCinematicSide';
import { normalizePhoneNumber, handleApiError } from '@/lib/utils';

interface RegisterFormData {
    name: string;
    phone: string;
    role: 'resident' | 'trader';
    password: string;
    password_confirmation: string;
    preferred_language: string;
}
import { Logo } from '@/components/shared/Logo';

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
            // Normalize phone before sending to API
            const normalizedData = {
                ...data,
                phone: normalizePhoneNumber(data.phone)
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
                            <div className="grid grid-cols-2 gap-3">
                                <label className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                                    selectedRole === 'resident'
                                        ? 'border-brand-500 bg-brand-50'
                                        : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                                }`}>
                                    <input {...register('role')} type="radio" value="resident" className="sr-only" />
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedRole === 'resident' ? 'bg-brand-100' : 'bg-gray-100'}`}>
                                        <Home size={20} className={selectedRole === 'resident' ? 'text-brand-600' : 'text-gray-400'} />
                                    </div>
                                    <span className={`font-black text-sm ${selectedRole === 'resident' ? 'text-brand-700' : 'text-gray-600'}`}>Resident</span>
                                    <span className="text-[10px] text-gray-400 font-medium text-center">Buy & reserve products</span>
                                    {selectedRole === 'resident' && (
                                        <div className="absolute top-2 right-2 w-4 h-4 bg-brand-600 rounded-full flex items-center justify-center">
                                            <span className="text-white text-[8px]">✓</span>
                                        </div>
                                    )}
                                </label>
                                <label className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                                    selectedRole === 'trader'
                                        ? 'border-brand-500 bg-brand-50'
                                        : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                                }`}>
                                    <input {...register('role')} type="radio" value="trader" className="sr-only" />
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedRole === 'trader' ? 'bg-brand-100' : 'bg-gray-100'}`}>
                                        <Store size={20} className={selectedRole === 'trader' ? 'text-brand-600' : 'text-gray-400'} />
                                    </div>
                                    <span className={`font-black text-sm ${selectedRole === 'trader' ? 'text-brand-700' : 'text-gray-600'}`}>Trader</span>
                                    <span className="text-[10px] text-gray-400 font-medium text-center">Sell at the market</span>
                                    {selectedRole === 'trader' && (
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
                                                    className={`flex-1 rounded-full transition-all duration-500 ${
                                                        level <= strength ? colors[strength-1] : 'bg-gray-100'
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
                            disabled={isSubmitting || isRedirecting || !isPasswordStrong}
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
