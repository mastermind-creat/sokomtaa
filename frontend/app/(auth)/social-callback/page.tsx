'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { ApiResponse } from '@/types';
import { Loader2, AlertTriangle } from 'lucide-react';
import { Logo } from '@/components/shared/Logo';

// Force dynamic rendering — this page reads URL search params set by OAuth redirect
// v2 — Suspense boundary added for Next.js 15 SSG compatibility
export const dynamic = 'force-dynamic';

function SocialCallbackInner() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { setAuth } = useAuthStore();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const token = searchParams.get('token');
        const requiresCompletion = searchParams.get('requires_completion') === '1';
        const err = searchParams.get('error');

        if (err) {
            const messages: Record<string, string> = {
                auth_failed: 'Authentication failed. Please try again.',
                unsupported_provider: 'This sign-in method is not supported.',
            };
            setError(messages[err] ?? 'Something went wrong. Please try again.');
            return;
        }

        if (!token) {
            setError('No authentication token received. Please try again.');
            return;
        }

        localStorage.setItem('sokomtaa_token', token);

        api.get<never, ApiResponse<unknown>>('/auth/me')
            .then((res) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const user = (res as any).data as { id: number; name: string; phone: string | null; role: 'trader' | 'resident' | 'admin' | 'delivery' | null; preferred_language: string; phone_verified: boolean; avatar_url?: string };
                setAuth(user as Parameters<typeof setAuth>[0], token);

                if (requiresCompletion || !user.phone || !user.role) {
                    router.replace('/complete-profile');
                } else if (!user.phone_verified) {
                    router.replace('/verify');
                } else if (user.role === 'admin') {
                    router.replace('/admin/dashboard');
                } else if (user.role === 'trader') {
                    router.replace('/trader/dashboard');
                } else if (user.role === 'resident') {
                    router.replace('/resident');
                } else if (user.role === 'delivery') {
                    router.replace('/delivery/dashboard');
                } else {
                    router.replace('/');
                }
            })
            .catch(() => {
                localStorage.removeItem('sokomtaa_token');
                setError('Failed to load your profile. Please try signing in again.');
            });
    }, [searchParams, setAuth, router]);

    if (error) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
                <Logo variant="icon" width={56} height={56} className="mb-6" />
                <div className="w-full max-w-sm text-center">
                    <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <AlertTriangle className="w-7 h-7 text-red-500" />
                    </div>
                    <h2 className="text-xl font-black text-green-950 mb-2">Sign-in failed</h2>
                    <p className="text-sm text-gray-500 mb-6">{error}</p>
                    <button
                        onClick={() => router.replace('/login')}
                        className="w-full h-12 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl transition-colors"
                    >
                        Back to Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4">
            <Logo variant="icon" width={56} height={56} />
            <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
            <p className="text-sm font-medium text-gray-500">Signing you in...</p>
        </div>
    );
}

export default function SocialCallbackPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
            </div>
        }>
            <SocialCallbackInner />
        </Suspense>
    );
}
