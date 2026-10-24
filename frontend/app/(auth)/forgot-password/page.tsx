'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Phone, Lock, ArrowRight, ShieldCheck, KeyRound, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Logo } from '@/components/shared/Logo';
import { AuthCinematicSide } from '@/components/auth/AuthCinematicSide';
import TurnstileWidget from '@/components/shared/TurnstileWidget';

interface ForgotPasswordForm {
    phone: string;
}

interface ResetPasswordForm {
    otp: string;
    password: string;
    password_confirmation: string;
}

const PasswordRequirement = ({ item, met }: { item: string; met: boolean }) => (
    <div className="flex items-center gap-2">
        <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center transition-colors ${met ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
            {met ? <CheckCircle2 size={10} /> : <div className="w-1 h-1 rounded-full bg-current" />}
        </div>
        <span className={`text-[10px] font-bold tracking-tight transition-colors ${met ? 'text-green-700' : 'text-gray-400'}`}>
            {item}
        </span>
    </div>
);

export default function ForgotPasswordPage() {
    const [step, setStep] = useState<1 | 2 | 3>(1); // 1: phone, 2: otp+password, 3: success
    const [phone, setPhone] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

    const router = useRouter();

    const {
        register: registerForgot,
        handleSubmit: handleForgotSubmit,
        formState: { errors: forgotErrors }
    } = useForm<ForgotPasswordForm>();

    const {
        register: registerReset,
        handleSubmit: handleResetSubmit,
        formState: { errors: resetErrors },
        watch
    } = useForm<ResetPasswordForm>();

    const password = watch('password');

    const getStrength = (pwd: string) => {
        let s = 0;
        if (pwd.length >= 8) s++;
        if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) s++;
        if (/\d/.test(pwd)) s++;
        if (/[@$!%*?&]/.test(pwd)) s++;
        return s;
    };

    const onForgotSubmit = async (data: ForgotPasswordForm) => {
        try {
            setIsLoading(true);
            setError(null);
            if (!turnstileToken) {
                setError('Please complete the security check.');
                setIsLoading(false);
                return;
            }
            await api.post('/auth/forgot-password', { ...data, cf_turnstile_token: turnstileToken });
            setPhone(data.phone);
            setStep(2);
            setTurnstileToken(null); // reset for step 2
        } catch (err: unknown) {
            const errObj = err as { message?: string } | string;
            setError(typeof errObj === 'string' ? errObj : errObj?.message ?? 'Failed to send reset code.');
        } finally {
            setIsLoading(false);
        }
    };

    const onResetSubmit = async (data: ResetPasswordForm) => {
        try {
            setIsLoading(true);
            setError(null);
            await api.post('/auth/reset-password', {
                ...data,
                phone
            });
            setStep(3);
        } catch (err: unknown) {
            const errObj = err as { message?: string } | string;
            setError(typeof errObj === 'string' ? errObj : errObj?.message ?? 'Failed to reset password.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white min-h-screen w-full flex">
            {/* Left Panel — Cinematic Branding */}
            <AuthCinematicSide />

            {/* Right Panel — Form */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center items-center px-6 py-12 lg:px-16 bg-white">
                <div className="w-full max-w-md">
                    {/* Mobile logo */}
                    <div className="lg:hidden flex flex-col items-center mb-10">
                        <Logo variant="icon" width={64} height={64} className="mb-4" />
                        <h1 className="text-2xl font-black text-green-950">Soko Mtaa</h1>
                    </div>

                    <AnimatePresence mode="wait">
                        {step === 1 && (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3 }}
                            >
                                <div className="mb-10">
                                    <div className="flex items-center gap-2 mb-2">
                                        <KeyRound size={16} className="text-brand-600" />
                                        <span className="text-xs font-bold text-brand-600 uppercase tracking-widest">Recovery</span>
                                    </div>
                                    <h2 className="text-3xl font-black text-green-950 mb-2">Forgot Password</h2>
                                    <p className="text-text-secondary">Enter your registered phone number and we&apos;ll send you a reset code via SMS.</p>
                                </div>

                                <form onSubmit={handleForgotSubmit(onForgotSubmit)} className="space-y-5">
                                    <div>
                                        <label className="block text-sm font-bold text-green-900 mb-2">
                                            Phone Number
                                        </label>
                                        <div className="relative">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center w-5 h-5 text-brand-500">
                                                <Phone size={18} />
                                            </div>
                                            <input
                                                {...registerForgot('phone', {
                                                    required: 'Phone number is required',
                                                    pattern: {
                                                        value: /^(?:\+254|254|0)?([17]\d{8})$/,
                                                        message: 'Invalid Kenyan phone number format'
                                                    }
                                                })}
                                                className="w-full h-[54px] pl-12 pr-4 rounded-xl border border-gray-200 bg-gray-50 text-green-950 placeholder:text-gray-400 text-base font-medium focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent focus:bg-white transition-all"
                                                placeholder="07XXXXXXXX or +254..."
                                                type="tel"
                                            />
                                        </div>
                                        {forgotErrors.phone && <p className="text-red-500 text-xs font-medium mt-1.5">{forgotErrors.phone.message}</p>}
                                    </div>

                                    {error && (
                                        <div className="flex items-start gap-3 bg-red-50 text-red-700 p-4 rounded-xl text-sm border border-red-100">
                                            <span className="text-red-400 mt-0.5">⚠</span>
                                            <span className="font-medium">{error}</span>
                                        </div>
                                    )}

                                    <TurnstileWidget
                                        onVerify={setTurnstileToken}
                                        onExpire={() => setTurnstileToken(null)}
                                        action="forgot-password"
                                    />

                                    <button
                                        disabled={isLoading || !turnstileToken}
                                        className="w-full h-[54px] bg-brand-600 hover:bg-brand-700 active:scale-[0.98] text-white font-black text-base rounded-xl shadow-md transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
                                        type="submit"
                                    >
                                        {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Send Reset Code'}
                                    </button>
                                </form>

                                <div className="mt-8 text-center">
                                    <Link href="/login" className="text-brand-600 font-black hover:underline text-sm flex items-center justify-center gap-2">
                                        <ArrowRight size={16} className="rotate-180" /> Back to Login
                                    </Link>
                                </div>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3 }}
                            >
                                <div className="mb-10">
                                    <div className="flex items-center gap-2 mb-2">
                                        <ShieldCheck size={16} className="text-brand-600" />
                                        <span className="text-xs font-bold text-brand-600 uppercase tracking-widest">Verification</span>
                                    </div>
                                    <h2 className="text-3xl font-black text-green-950 mb-2">Reset Password</h2>
                                    <p className="text-text-secondary">We sent a 6-digit code to <span className="font-bold text-green-900">{phone}</span>.</p>
                                </div>

                                <form onSubmit={handleResetSubmit(onResetSubmit)} className="space-y-5">
                                    <div>
                                        <label className="block text-sm font-bold text-green-900 mb-2">Reset Code (OTP)</label>
                                        <input
                                            {...registerReset('otp', {
                                                required: 'Code is required',
                                                minLength: { value: 6, message: 'Code must be 6 digits' }
                                            })}
                                            className="w-full h-[54px] px-4 rounded-xl border border-gray-200 bg-gray-50 text-green-950 placeholder:text-gray-400 text-center tracking-[0.5em] text-xl font-bold focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent focus:bg-white transition-all"
                                            placeholder="••••••"
                                            maxLength={6}
                                        />
                                        {resetErrors.otp && <p className="text-red-500 text-xs font-medium mt-1.5 text-center">{resetErrors.otp.message}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-green-900 mb-2">New Password</label>
                                        <div className="relative">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center w-5 h-5 text-brand-500">
                                                <Lock size={18} />
                                            </div>
                                            <input
                                                {...registerReset('password', {
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
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                            >
                                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>

                                        {/* Password strength checker */}
                                        {password && (
                                            <div className="mt-3 space-y-2">
                                                <div className="flex gap-1 h-1">
                                                    {[1, 2, 3, 4].map((level) => {
                                                        const strength = getStrength(password);
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
                                                    <PasswordRequirement item="8+ characters" met={password.length >= 8} />
                                                    <PasswordRequirement item="Upper & lowercase" met={/[a-z]/.test(password) && /[A-Z]/.test(password)} />
                                                    <PasswordRequirement item="At least one number" met={/\d/.test(password)} />
                                                    <PasswordRequirement item="Special character" met={/[@$!%*?&]/.test(password)} />
                                                </div>
                                            </div>
                                        )}

                                        {resetErrors.password && <p className="text-red-500 text-xs font-medium mt-1.5">{resetErrors.password.message}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-green-900 mb-2">Confirm Password</label>
                                        <div className="relative">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center w-5 h-5 text-brand-500">
                                                <Lock size={18} />
                                            </div>
                                            <input
                                                {...registerReset('password_confirmation', {
                                                    required: 'Please confirm your password',
                                                    validate: value => value === password || 'Passwords do not match'
                                                })}
                                                className="w-full h-[54px] pl-12 pr-4 rounded-xl border border-gray-200 bg-gray-50 text-green-950 placeholder:text-gray-400 text-base font-medium focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent focus:bg-white transition-all"
                                                placeholder="••••••••"
                                                type={showPassword ? 'text' : 'password'}
                                            />
                                        </div>
                                        {resetErrors.password_confirmation && <p className="text-red-500 text-xs font-medium mt-1.5">{resetErrors.password_confirmation.message}</p>}
                                    </div>

                                    {error && (
                                        <div className="flex items-start gap-3 bg-red-50 text-red-700 p-4 rounded-xl text-sm border border-red-100">
                                            <span className="text-red-400 mt-0.5">⚠</span>
                                            <span className="font-medium">{error}</span>
                                        </div>
                                    )}

                                    <button
                                        disabled={isLoading || getStrength(password ?? '') < 4}
                                        className="w-full h-[54px] bg-brand-600 hover:bg-brand-700 active:scale-[0.98] text-white font-black text-base rounded-xl shadow-md transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-60 disabled:cursor-not-allowed"
                                        type="submit"
                                    >
                                        {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Save New Password'}
                                    </button>
                                </form>

                                <div className="mt-6 text-center">
                                    <button
                                        onClick={() => setStep(1)}
                                        className="text-text-secondary text-sm font-bold hover:text-brand-600 transition-colors"
                                    >
                                        Didn&apos;t receive the code? Try again
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {step === 3 && (
                            <motion.div
                                key="step3"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center"
                            >
                                <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <CheckCircle2 size={40} className="text-brand-600" />
                                </div>
                                <h2 className="text-3xl font-black text-green-950 mb-3">Password Reset!</h2>
                                <p className="text-text-secondary mb-8 leading-relaxed">
                                    Your password has been successfully reset. You can now use your new password to log in to your account.
                                </p>

                                <Link
                                    href="/login"
                                    className="w-full h-[54px] bg-brand-600 hover:bg-brand-700 active:scale-[0.98] text-white font-black text-base rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                                >
                                    Proceed to Login <ArrowRight size={18} />
                                </Link>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
