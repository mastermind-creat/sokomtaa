'use client';

import React, { useEffect, useState } from 'react';
import { Smartphone, Globe } from 'lucide-react';

// ── Constants ─────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'soko_payment_method';
type PaymentMethod = 'mpesa' | 'paypal';

// ── Props ─────────────────────────────────────────────────────────────────────

interface PaymentMethodSelectorProps {
    onSelect: (method: PaymentMethod) => void;
    defaultMethod?: PaymentMethod;
    reservationTotal: number; // KES amount
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function readStoredMethod(): PaymentMethod {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored === 'mpesa' || stored === 'paypal') return stored;
    } catch {
        // Private browsing or storage unavailable — fall through to default
    }
    return 'mpesa';
}

function writeStoredMethod(method: PaymentMethod): void {
    try {
        localStorage.setItem(STORAGE_KEY, method);
    } catch {
        // Private browsing — silent failure is correct behaviour
    }
}

function computeUsd(kes: number): string | null {
    const rate = process.env.NEXT_PUBLIC_PAYPAL_RATE;
    if (!rate) return null;
    const parsed = parseFloat(rate);
    if (isNaN(parsed) || parsed <= 0) return null;
    return (kes * parsed).toFixed(2);
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function PaymentMethodSelector({
    onSelect,
    defaultMethod,
    reservationTotal,
}: PaymentMethodSelectorProps) {
    // Initialise from prop, then localStorage, then 'mpesa'
    const [selected, setSelected] = useState<PaymentMethod>(() => {
        if (defaultMethod) return defaultMethod;
        return readStoredMethod();
    });

    // Re-read from localStorage on mount (handles SSR / hydration)
    useEffect(() => {
        if (!defaultMethod) {
            setSelected(readStoredMethod());
        }
    }, [defaultMethod]);

    const usd = computeUsd(reservationTotal);

    function handleSelect(method: PaymentMethod) {
        setSelected(method);
        writeStoredMethod(method);
        onSelect(method);
    }

    return (
        <div className="w-full space-y-3">
            {/* Amount summary */}
            <div className="text-sm text-text-secondary mb-1">
                <span className="font-semibold text-text-primary">
                    KES {reservationTotal.toLocaleString()}
                </span>
                {usd && (
                    <span className="ml-2 text-text-muted">
                        ≈ USD {usd}
                    </span>
                )}
            </div>

            {/* Method cards */}
            <div className="grid grid-cols-2 gap-3">
                {/* M-Pesa card */}
                <button
                    type="button"
                    onClick={() => handleSelect('mpesa')}
                    aria-pressed={selected === 'mpesa'}
                    aria-label="Lipa kwa M-Pesa / Pay with M-Pesa"
                    className={[
                        'flex flex-col items-center justify-center gap-2',
                        'min-h-12 p-4 rounded-2xl border-2 transition-all',
                        'active:scale-95 focus-visible:outline-none focus-visible:ring-2',
                        'focus-visible:ring-(--color-primary)',
                        selected === 'mpesa'
                            ? 'border-(--color-primary) bg-green-50'
                            : 'border-(--color-border) bg-white',
                    ].join(' ')}
                >
                    <div
                        className={[
                            'w-12 h-12 rounded-xl flex items-center justify-center shrink-0',
                            selected === 'mpesa'
                                ? 'bg-(--color-primary) text-white'
                                : 'bg-gray-100 text-gray-500',
                        ].join(' ')}
                    >
                        <Smartphone size={22} />
                    </div>
                    <div className="text-center">
                        <p
                            className={[
                                'font-bold text-sm leading-tight',
                                selected === 'mpesa'
                                    ? 'text-(--color-primary)'
                                    : 'text-text-primary',
                            ].join(' ')}
                        >
                            M-Pesa
                        </p>
                        <p className="text-[10px] text-text-muted leading-tight mt-0.5">
                            Lipa kwa simu yako
                        </p>
                        <p className="text-[10px] text-text-muted leading-tight">
                            Pay with your phone
                        </p>
                    </div>
                </button>

                {/* PayPal card */}
                <button
                    type="button"
                    onClick={() => handleSelect('paypal')}
                    aria-pressed={selected === 'paypal'}
                    aria-label="Lipa kwa PayPal / Pay with PayPal"
                    className={[
                        'flex flex-col items-center justify-center gap-2',
                        'min-h-12 p-4 rounded-2xl border-2 transition-all',
                        'active:scale-95 focus-visible:outline-none focus-visible:ring-2',
                        'focus-visible:ring-(--color-primary)',
                        selected === 'paypal'
                            ? 'border-(--color-primary) bg-green-50'
                            : 'border-(--color-border) bg-white',
                    ].join(' ')}
                >
                    <div
                        className={[
                            'w-12 h-12 rounded-xl flex items-center justify-center shrink-0',
                            selected === 'paypal'
                                ? 'bg-(--color-primary) text-white'
                                : 'bg-gray-100 text-gray-500',
                        ].join(' ')}
                    >
                        <Globe size={22} />
                    </div>
                    <div className="text-center">
                        <p
                            className={[
                                'font-bold text-sm leading-tight',
                                selected === 'paypal'
                                    ? 'text-(--color-primary)'
                                    : 'text-text-primary',
                            ].join(' ')}
                        >
                            PayPal
                        </p>
                        <p className="text-[10px] text-text-muted leading-tight mt-0.5">
                            Lipa kwa kadi/PayPal
                        </p>
                        <p className="text-[10px] text-text-muted leading-tight">
                            Pay with card/PayPal
                        </p>
                    </div>
                </button>
            </div>
        </div>
    );
}
