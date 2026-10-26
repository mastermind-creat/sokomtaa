'use client';

import React from 'react';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import { Loader2, MailCheck, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { motion } from 'framer-motion';
import { ApiResponse } from '@/types';
import { Logo } from '@/components/shared/Logo';
import { AuthCinematicSide } from '@/components/auth/AuthCinematicSide';

export default function VerifyEmailPage() {
    const { user } = useAuthStore();
    const router = useRouter();
    const [resendLoading, setResendLoading] = React.useState(false);
    const [resendMessage, setResendMessage] = React.useState<string | null>(null);
    const [error, setError] = React.useState<string | null>(null);
    const [cooldown, setCooldown] = React.useState(0);

    React.useEffect(() => {
        if (!user) {
            router.push('/login');
        }
    }, [user, router]);

    // Countdown timer for resend cooldown
    React.useEffect(() => {
        if (cooldown <= 0) return;
        const timer = setInterval(() => setCooldown((prev) => prev - 1), 1000);
        return () => clearInterval(timer);
    }, [cooldown]);

    const handleResend = async () => {
        if (cooldown > 0 || resendLoading) return;
        try {
            setResendLoading(true);
            setError(null);
            setResendMessage(null);
            const response = await api.post<never, ApiResponse<null>>('/auth/email/resend');
            setResendMessage(response.message ?? 'Verification email sent.');
            setCooldown(60);
        } catch (err: unknown) {
            const apiErr = err as { response?: { status?: number; data?: { message?: string } } };
            if (apiErr.response?.status === 429) {
                setError('Too many requests — please wait a moment before trying again.');
            } else {
                setError(apiErr.response?.data?.message ?? 'Failed to resend. Please try again.');
            }
        } finally {
            setResendLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex">
            <AuthCinematicSide />

            <motion.div
                className="w-full lg:w-1/2 flex flex-col justify-center items-center px-6 py-12 lg:px-14 bg-[#FAFAF8]"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4 }}
            >
                <div className="w-full max-w-md">
                    {/* Mobile logo */}
                    <div className="lg:hidden flex flex-col items-center mb-10">
                        <Logo variant="icon" width={64} height={64} className="mb-4" />
                        <h1 className="text-2xl font-black text-green-950">Soko Mtaa</h1>
                    </div>

                    <div className="mb-10 lg:text-left text-center">
                        <div className="flex items-center lg:justify-start justify-center gap-2 mb-2">
                            <MailCheck size={18} className="text-brand-600" />
                            <span className="text-xs font-bold text-brand-600 uppercase tracking-widest">
                                Email Verification
                            </span>
                        </div>
                        <h2 className="text-3xl font-black text-green-950 mb-3">Check your inbox</h2>
                        <p className="text-text-secondary">
                            A verification email has been sent to{' '}
                            <span className="font-bold text-green-900">{user?.email}</span>. Click the link
                            inside to activate your account.
                        </p>
                        <p className="text-text-secondary text-sm mt-2">The link expires in 60 minutes.</p>
                    </div>

                    {/* Error */}
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-6 flex items-start gap-3 bg-red-50 text-red-700 p-4 rounded-xl text-sm border border-red-100"
                        >
                            <span className="text-red-400 mt-0.5">⚠</span>
                            <span className="font-medium">{error}</span>
                        </motion.div>
                    )}

                    {/* Success */}
                    {resendMessage && (
                        <motion.div
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-6 bg-green-50 text-green-700 p-4 rounded-xl text-sm border border-green-100 font-medium flex gap-3"
                        >
                            <CheckCircle2 size={18} className="text-green-500 shrink-0 mt-0.5" />
                            {resendMessage}
                        </motion.div>
                    )}

                    {/* Resend Button */}
                    <button
                        onClick={handleResend}
                        disabled={resendLoading || cooldown > 0}
                        data-testid="resend-button"
                        className="w-full h-[54px] bg-brand-600 hover:bg-brand-700 active:scale-[0.98] text-white font-black text-base rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {resendLoading ? (
                            <Loader2 className="animate-spin" size={20} />
                        ) : cooldown > 0 ? (
                            `Resend in ${cooldown}s`
                        ) : (
                            <>
                                Resend Email
                                <ArrowRight size={18} />
                            </>
                        )}
                    </button>

                    <p className="text-center text-sm text-gray-400 mt-6">
                        Already verified?{' '}
                        <button
                            type="button"
                            onClick={() => router.push('/login')}
                            className="text-brand-600 font-black hover:underline"
                        >
                            Sign in
                        </button>
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
