'use client';

import React, { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2, CheckCircle2, XCircle, MailCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { AuthCinematicSide } from '@/components/auth/AuthCinematicSide';
import { Logo } from '@/components/shared/Logo';
import { useAuthStore } from '@/store/authStore';

type Status = 'loading' | 'success' | 'error' | 'already_verified';

/**
 * Handles the email verification link: /verify-email/confirm?id=XXX&token=YYY
 *
 * The backend sends this URL in the verification email. This page reads the
 * params, calls the backend, shows the result, and then directs the user to
 * sign in — it never auto-redirects to the dashboard.
 *
 * The work lives in a child component because useSearchParams() opts the page
 * out of static prerendering; without a Suspense boundary above it the export
 * fails with "useSearchParams() should be wrapped in a suspense boundary".
 */
function VerifyEmailConfirmContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { logout } = useAuthStore();

    const [status, setStatus] = React.useState<Status>('loading');
    const [message, setMessage] = React.useState('');

    React.useEffect(() => {
        const id = searchParams.get('id');
        const token = searchParams.get('token');

        if (!id || !token) {
            setStatus('error');
            setMessage('Invalid verification link. Please request a new one.');
            return;
        }

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

        fetch(`${apiUrl}/auth/email/verify/${id}/${token}`, {
            method: 'GET',
            headers: { Accept: 'application/json' },
        })
            .then(async (res) => {
                const data = await res.json();
                if (res.ok && data.success) {
                    if (data.message?.toLowerCase().includes('already')) {
                        setStatus('already_verified');
                    } else {
                        setStatus('success');
                    }
                    setMessage(data.message ?? 'Email verified successfully.');
                } else {
                    setStatus('error');
                    setMessage(data.message ?? 'This verification link is invalid or has expired.');
                }
            })
            .catch(() => {
                setStatus('error');
                setMessage('Could not connect to the server. Please try again.');
            });
    }, [searchParams]);

    const handleSignIn = () => {
        // Clear any existing auth state so they go through login fresh
        logout();
        router.push('/login');
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
                    <div className="lg:hidden flex flex-col items-center mb-10">
                        <Logo variant="icon" width={64} height={64} className="mb-4" />
                        <h1 className="text-2xl font-black text-green-950">Soko Mtaa</h1>
                    </div>

                    <div className="text-center space-y-6">
                        {status === 'loading' && (
                            <>
                                <div className="w-20 h-20 bg-brand-50 rounded-full flex items-center justify-center mx-auto">
                                    <Loader2 size={36} className="text-brand-600 animate-spin" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-green-950 mb-2">Verifying your email...</h2>
                                    <p className="text-text-secondary">Please wait a moment.</p>
                                </div>
                            </>
                        )}

                        {(status === 'success' || status === 'already_verified') && (
                            <>
                                <motion.div
                                    initial={{ scale: 0.5, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ type: 'spring', stiffness: 200 }}
                                    className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto"
                                >
                                    <CheckCircle2 size={40} className="text-green-500" />
                                </motion.div>
                                <div>
                                    <h2 className="text-2xl font-black text-green-950 mb-2">
                                        {status === 'already_verified' ? 'Already Verified' : 'Email Verified!'}
                                    </h2>
                                    <p className="text-text-secondary">{message}</p>
                                    <p className="text-text-secondary text-sm mt-2">
                                        Your account is ready. Please sign in to continue.
                                    </p>
                                </div>
                                <button
                                    onClick={handleSignIn}
                                    className="w-full h-[54px] bg-brand-600 hover:bg-brand-700 active:scale-[0.98] text-white font-black text-base rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                                >
                                    <MailCheck size={18} />
                                    Sign In to Your Account
                                </button>
                            </>
                        )}

                        {status === 'error' && (
                            <>
                                <motion.div
                                    initial={{ scale: 0.5, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ type: 'spring', stiffness: 200 }}
                                    className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto"
                                >
                                    <XCircle size={40} className="text-red-500" />
                                </motion.div>
                                <div>
                                    <h2 className="text-2xl font-black text-green-950 mb-2">Verification Failed</h2>
                                    <p className="text-text-secondary">{message}</p>
                                </div>
                                <div className="space-y-3">
                                    <button
                                        onClick={() => router.push('/verify-email')}
                                        className="w-full h-[54px] bg-brand-600 hover:bg-brand-700 active:scale-[0.98] text-white font-black text-base rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                                    >
                                        Request New Verification Email
                                    </button>
                                    <button
                                        onClick={handleSignIn}
                                        className="w-full h-[54px] bg-gray-100 hover:bg-gray-200 active:scale-[0.98] text-gray-700 font-black text-base rounded-xl transition-all"
                                    >
                                        Go to Sign In
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

export default function VerifyEmailConfirmPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen w-full bg-[#FAFAF8] flex flex-col items-center justify-center gap-4">
                    <Loader2 size={36} className="text-brand-600 animate-spin" />
                    <p className="text-text-secondary">Verifying your email...</p>
                </div>
            }
        >
            <VerifyEmailConfirmContent />
        </Suspense>
    );
}
