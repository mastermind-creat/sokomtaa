'use client';

import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle, CheckCircle, Globe } from 'lucide-react';
import { usePayPal } from '@/hooks/usePayPal';

// ── Helpers ───────────────────────────────────────────────────────────────────

function computeUsd(kes: number, rate?: string | null): string | null {
    const r = rate ?? process.env.NEXT_PUBLIC_PAYPAL_RATE;
    if (!r) return null;
    const parsed = parseFloat(r);
    if (isNaN(parsed) || parsed <= 0) return null;
    return (kes * parsed).toFixed(2);
}

// ── Skeleton loader ────────────────────────────────────────────────────────────

function SkeletonBlock({ className = '' }: { className?: string }) {
    return (
        <div
            className={`animate-pulse bg-gray-200 rounded-xl ${className}`}
            aria-hidden="true"
        />
    );
}

// ── Props ──────────────────────────────────────────────────────────────────────

export interface PayPalPaymentSheetProps {
    /** Whether the sheet is visible */
    isOpen: boolean;
    /** IDs of reservations being paid for */
    reservationIds: number[];
    /** Total in KES */
    totalKes: number;
    /** Called with the first reservationId when payment succeeds */
    onSuccess: (reservationId: number) => void;
    /** Called to dismiss / switch to M-Pesa */
    onCancel: () => void;
    /** Optional exchange rate override (useful for testing) */
    exchangeRate?: string;
}

// ── Summary state ──────────────────────────────────────────────────────────────

interface SummaryStateProps {
    totalKes: number;
    usd: string | null;
    onPay: () => void;
}

function SummaryState({ totalKes, usd, onPay }: SummaryStateProps) {
    return (
        <div className="space-y-6">
            {/* Amount card */}
            <div className="p-5 bg-blue-50 rounded-2xl border border-blue-100 flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white shrink-0">
                    <Globe size={22} />
                </div>
                <div>
                    <p className="text-sm text-blue-800">Kiasi cha Kulipa / Amount to Pay</p>
                    <p className="text-3xl font-bold text-blue-900">
                        KES {totalKes.toLocaleString()}
                    </p>
                    {usd && (
                        <p className="text-sm text-blue-700 mt-0.5">
                            ≈ USD {usd}
                        </p>
                    )}
                </div>
            </div>

            {/* Exchange-rate disclaimer (bilingual, Req 9.5) */}
            <p
                className="text-xs text-text-muted text-center px-2"
                data-testid="exchange-rate-disclaimer"
            >
                Kiwango cha ubadilishaji kinatumika / Exchange rate applies.
                Final amount charged by PayPal may vary slightly.
            </p>

            {/* Pay button — min 48px height per AGENTS.md */}
            <button
                onClick={onPay}
                className="btn btn-primary w-full h-14 text-lg font-semibold"
                aria-label="Lipa kwa PayPal / Pay with PayPal"
            >
                Lipa kwa PayPal / Pay with PayPal
            </button>
        </div>
    );
}

// ── Loading skeleton (creating / capturing / polling) ─────────────────────────

function LoadingState({ label }: { label: string }) {
    return (
        <div className="space-y-4" aria-live="polite" aria-label={label}>
            <SkeletonBlock className="h-20 w-full" />
            <SkeletonBlock className="h-4 w-3/4 mx-auto" />
            <SkeletonBlock className="h-14 w-full" />
        </div>
    );
}

// ── Awaiting-approval state ────────────────────────────────────────────────────

function AwaitingApprovalState() {
    return (
        <div className="space-y-6">
            <SkeletonBlock className="h-16 w-full" />
            <div className="p-5 bg-amber-50 rounded-2xl border border-amber-100 text-center space-y-1">
                <p className="font-semibold text-amber-900">
                    Kichupo cha PayPal kimefunguliwa.
                </p>
                <p className="text-sm text-amber-800">
                    Rudi hapa baada ya kuidhinisha.
                </p>
                <p className="text-xs text-amber-700 mt-2">
                    PayPal tab opened. Return here after approving.
                </p>
            </div>
            <SkeletonBlock className="h-14 w-full" />
        </div>
    );
}

// ── Success state ──────────────────────────────────────────────────────────────

function SuccessState() {
    return (
        <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center py-8 text-center"
        >
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                <CheckCircle size={48} className="text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-green-900 mb-2">
                Malipo Yamefanikiwa! / Payment Confirmed!
            </h3>
            <p className="text-green-800 text-sm px-6">
                Malipo ya PayPal yamefanikiwa. Ukurasa utabadilika.
            </p>
            <p className="text-green-700 text-sm px-6 mt-1">
                PayPal payment confirmed. Redirecting you now.
            </p>
        </motion.div>
    );
}

// ── Failed state ───────────────────────────────────────────────────────────────

interface FailedStateProps {
    error: string | null;
    onRetry: () => void;
    onSwitchToMpesa: () => void;
}

function FailedState({ error, onRetry, onSwitchToMpesa }: FailedStateProps) {
    const message = error
        || 'Malipo ya PayPal hayakufanikiwa. Jaribu tena. / PayPal payment failed. Please try again.';

    return (
        <div className="space-y-5">
            {/* Inline error — never toast/modal (AGENTS.md) */}
            <div
                className="p-4 bg-red-50 rounded-2xl border border-red-100 flex items-start gap-3"
                data-testid="failed-error-inline"
                role="alert"
            >
                <AlertCircle size={20} className="text-red-600 mt-0.5 shrink-0" />
                <p className="text-sm text-red-800">{message}</p>
            </div>

            <button
                onClick={onRetry}
                className="btn btn-primary w-full h-14 text-base font-semibold"
                aria-label="Jaribu tena / Try Again"
            >
                Jaribu tena / Try Again
            </button>

            <button
                onClick={onSwitchToMpesa}
                className="btn btn-ghost w-full h-12 text-base"
                aria-label="Badilisha kwa M-Pesa / Switch to M-Pesa"
                data-testid="switch-to-mpesa"
            >
                Badilisha kwa M-Pesa / Switch to M-Pesa
            </button>
        </div>
    );
}

// ── Timeout state ──────────────────────────────────────────────────────────────

function TimeoutState() {
    return (
        <div className="space-y-5 py-4 text-center">
            <div className="text-4xl">📧</div>
            <p
                className="font-semibold text-text-primary"
                data-testid="timeout-sw"
            >
                Angalia barua pepe yako ya PayPal
            </p>
            <p
                className="text-sm text-text-secondary"
                data-testid="timeout-en"
            >
                Check your PayPal email for confirmation
            </p>
            <p className="text-xs text-text-muted mt-2 px-4">
                Malipo yanaweza kuwa yamefanikiwa. Angalia barua pepe yako kwa uthibitisho.
                / Your payment may have succeeded. Check your email for confirmation.
            </p>
        </div>
    );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function PayPalPaymentSheet({
    isOpen,
    reservationIds,
    totalKes,
    onSuccess,
    onCancel,
    exchangeRate,
}: PayPalPaymentSheetProps) {
    const {
        status,
        error,
        orderId,
        approveUrl,
        createOrder,
        captureOrder,
        reset,
    } = usePayPal();

    const usd = computeUsd(totalKes, exchangeRate);

    // Ref to track whether we have already opened the PayPal tab and listened for return
    const hasOpenedTabRef = useRef(false);
    const visibilityHandlerRef = useRef<(() => void) | null>(null);

    // ── Navigate to success on completion ────────────────────────────────────
    useEffect(() => {
        if (status === 'completed') {
            onSuccess(reservationIds[0]);
        }
    }, [status, onSuccess, reservationIds]);

    // ── Open PayPal tab when approveUrl is available (awaiting_approval) ─────
    useEffect(() => {
        if (status === 'awaiting_approval' && approveUrl && !hasOpenedTabRef.current) {
            hasOpenedTabRef.current = true;
            window.open(approveUrl, '_blank');

            // When the user returns to this tab, trigger capture
            const handleVisibilityChange = () => {
                if (document.visibilityState === 'visible' && orderId) {
                    document.removeEventListener('visibilitychange', handleVisibilityChange);
                    visibilityHandlerRef.current = null;
                    captureOrder(orderId);
                }
            };

            visibilityHandlerRef.current = handleVisibilityChange;
            document.addEventListener('visibilitychange', handleVisibilityChange);
        }

        // Cleanup on unmount
        return () => {
            if (visibilityHandlerRef.current) {
                document.removeEventListener('visibilitychange', visibilityHandlerRef.current);
                visibilityHandlerRef.current = null;
            }
        };
    }, [status, approveUrl, orderId, captureOrder]);

    // ── Reset tab-opened flag when sheet closes or resets to idle ────────────
    useEffect(() => {
        if (!isOpen || status === 'idle') {
            hasOpenedTabRef.current = false;
        }
    }, [isOpen, status]);

    // ── Handlers ─────────────────────────────────────────────────────────────
    function handlePay() {
        createOrder(reservationIds);
    }

    function handleRetry() {
        reset();
    }

    function handleClose() {
        reset();
        onCancel();
    }

    // ── Render current state ─────────────────────────────────────────────────
    function renderBody() {
        switch (status) {
            case 'idle':
                return (
                    <SummaryState
                        totalKes={totalKes}
                        usd={usd}
                        onPay={handlePay}
                    />
                );

            case 'creating':
                return <LoadingState label="Inaunda agizo la PayPal / Creating PayPal order" />;

            case 'awaiting_approval':
                return <AwaitingApprovalState />;

            case 'capturing':
                return <LoadingState label="Inakamilisha malipo / Capturing payment" />;

            case 'polling':
                return <LoadingState label="Inakagua hali ya malipo / Checking payment status" />;

            case 'completed':
                return <SuccessState />;

            case 'failed':
                return (
                    <FailedState
                        error={error}
                        onRetry={handleRetry}
                        onSwitchToMpesa={handleClose}
                    />
                );

            case 'timeout':
                return <TimeoutState />;

            default:
                return null;
        }
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    key="paypal-backdrop"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={handleClose}
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm z-60"
                />
            )}
            {isOpen && (
                <motion.div
                    key="paypal-sheet"
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="fixed bottom-0 left-0 right-0 bg-white rounded-t-4xl p-8 z-70 shadow-2xl safe-bottom"
                >
                    {/* Header */}
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-blue-950">
                            Lipa kwa PayPal / Pay with PayPal
                        </h2>
                        <button
                            onClick={handleClose}
                            className="p-2 bg-slate-100 rounded-full active:scale-90 transition-all"
                            aria-label="Funga / Close"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Body */}
                    {renderBody()}
                </motion.div>
            )}
        </AnimatePresence>
    );
}
