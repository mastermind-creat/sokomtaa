/**
 * Unit tests for PayPalPaymentSheet
 *
 * Tests cover:
 *   - Summary renders KES and USD amounts
 *   - Exchange-rate disclaimer present
 *   - "Switch to M-Pesa" button calls onCancel
 *   - `failed` state renders inline error (not toast/modal)
 *   - `timeout` message renders in both Swahili and English
 *
 * Validates: Requirements 9.3, 9.5, 6.5, 6.6
 *
 * Run with:
 *   npx vitest run components/shared/__tests__/PayPalPaymentSheet.test.tsx
 */

import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { vi, describe, it, expect, afterEach, beforeEach } from 'vitest';
import PayPalPaymentSheet from '../PayPalPaymentSheet';

// ── Mock usePayPal so we can control the hook state ───────────────────────────

import * as usePayPalModule from '@/hooks/usePayPal';
import type { PayPalStatus, UsePayPalReturn } from '@/hooks/usePayPal';

function mockHook(overrides: Partial<UsePayPalReturn> = {}): UsePayPalReturn {
    return {
        status: 'idle',
        error: null,
        orderId: null,
        approveUrl: null,
        amountKes: null,
        amountUsd: null,
        createOrder: vi.fn(),
        captureOrder: vi.fn(),
        pollStatus: vi.fn(),
        stopPolling: vi.fn(),
        reset: vi.fn(),
        ...overrides,
    };
}

// ── Default props ─────────────────────────────────────────────────────────────

const defaultProps = {
    isOpen: true,
    reservationIds: [42, 43],
    totalKes: 250,
    onSuccess: vi.fn(),
    onCancel: vi.fn(),
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function renderSheet(
    hookOverrides: Partial<UsePayPalReturn> = {},
    propOverrides: Partial<typeof defaultProps> = {},
    envRate?: string
) {
    vi.spyOn(usePayPalModule, 'usePayPal').mockReturnValue(mockHook(hookOverrides));

    render(
        <PayPalPaymentSheet
            {...defaultProps}
            onSuccess={vi.fn()}
            onCancel={vi.fn()}
            {...propOverrides}
            exchangeRate={envRate}
        />
    );
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('PayPalPaymentSheet', () => {
    beforeEach(() => {
        vi.unstubAllEnvs();
        vi.restoreAllMocks();
    });

    afterEach(() => {
        cleanup();
        vi.unstubAllEnvs();
        vi.restoreAllMocks();
    });

    // ── Summary state ─────────────────────────────────────────────────────────

    describe('Summary state (idle)', () => {
        it('renders KES amount', () => {
            renderSheet();
            expect(screen.getByText(/KES/)).toBeTruthy();
            expect(screen.getByText(/250/)).toBeTruthy();
        });

        it('renders USD equivalent when NEXT_PUBLIC_PAYPAL_RATE is set', () => {
            renderSheet({}, {}, '0.00769');
            // 250 * 0.00769 = 1.9225 → "1.92"
            expect(screen.getByText(/USD/i)).toBeTruthy();
            expect(screen.getByText(/1\.92/)).toBeTruthy();
        });

        it('does not render USD when NEXT_PUBLIC_PAYPAL_RATE is absent', () => {
            renderSheet({}, {}, undefined);
            // Re-render without env var
            expect(screen.queryByText(/USD/i)).toBeNull();
        });

        it('renders the exchange-rate disclaimer', () => {
            renderSheet();
            const disclaimer = screen.getByTestId('exchange-rate-disclaimer');
            expect(disclaimer).toBeTruthy();
            expect(disclaimer.textContent).toContain('Exchange rate applies');
            expect(disclaimer.textContent).toContain('Kiwango cha ubadilishaji kinatumika');
        });

        it('renders the "Pay with PayPal" button with min-height class', () => {
            renderSheet();
            const btn = screen.getByRole('button', { name: /pay with paypal/i });
            expect(btn).toBeTruthy();
            // Must have at least h-14 (56px) height class per spec
            expect(btn.className).toContain('h-14');
        });

        it('calls createOrder when Pay button is clicked', () => {
            const createOrder = vi.fn();
            renderSheet({ createOrder });
            fireEvent.click(screen.getByRole('button', { name: /pay with paypal/i }));
            expect(createOrder).toHaveBeenCalledWith([42, 43]);
        });
    });

    // ── Exchange-rate disclaimer ───────────────────────────────────────────────

    describe('Exchange-rate disclaimer', () => {
        it('contains Swahili text', () => {
            renderSheet();
            const disclaimer = screen.getByTestId('exchange-rate-disclaimer');
            expect(disclaimer.textContent).toContain('Kiwango cha ubadilishaji kinatumika');
        });

        it('contains English text', () => {
            renderSheet();
            const disclaimer = screen.getByTestId('exchange-rate-disclaimer');
            expect(disclaimer.textContent).toContain('Exchange rate applies');
        });
    });

    // ── Failed state ──────────────────────────────────────────────────────────

    describe('failed state', () => {
        it('renders inline error element (not a modal/toast)', () => {
            renderSheet({ status: 'failed' as PayPalStatus, error: 'Malipo hayakufanikiwa.' });
            const inlineError = screen.getByTestId('failed-error-inline');
            expect(inlineError).toBeTruthy();
            expect(inlineError.textContent).toContain('Malipo hayakufanikiwa');
        });

        it('inline error has role="alert"', () => {
            renderSheet({ status: 'failed' as PayPalStatus, error: 'Something failed' });
            const alert = screen.getByRole('alert');
            expect(alert).toBeTruthy();
        });

        it('renders bilingual default error when error prop is null', () => {
            renderSheet({ status: 'failed' as PayPalStatus, error: null });
            const inlineError = screen.getByTestId('failed-error-inline');
            expect(inlineError.textContent).toContain('PayPal payment failed');
            expect(inlineError.textContent).toContain('Malipo ya PayPal hayakufanikiwa');
        });

        it('"Try Again" button calls reset()', () => {
            const reset = vi.fn();
            renderSheet({ status: 'failed' as PayPalStatus, error: null, reset });
            fireEvent.click(screen.getByRole('button', { name: /try again/i }));
            expect(reset).toHaveBeenCalled();
        });

        it('"Switch to M-Pesa" button calls onCancel', () => {
            const onCancel = vi.fn();
            renderSheet({ status: 'failed' as PayPalStatus, error: null }, { onCancel });
            fireEvent.click(screen.getByTestId('switch-to-mpesa'));
            expect(onCancel).toHaveBeenCalled();
        });
    });

    // ── Timeout state ─────────────────────────────────────────────────────────

    describe('timeout state', () => {
        it('renders the Swahili timeout message', () => {
            renderSheet({ status: 'timeout' as PayPalStatus });
            const swEl = screen.getByTestId('timeout-sw');
            expect(swEl.textContent).toContain('Angalia barua pepe yako ya PayPal');
        });

        it('renders the English timeout message', () => {
            renderSheet({ status: 'timeout' as PayPalStatus });
            const enEl = screen.getByTestId('timeout-en');
            expect(enEl.textContent).toContain('Check your PayPal email for confirmation');
        });

        it('renders both Swahili and English messages simultaneously', () => {
            renderSheet({ status: 'timeout' as PayPalStatus });
            expect(screen.getByTestId('timeout-sw')).toBeTruthy();
            expect(screen.getByTestId('timeout-en')).toBeTruthy();
        });
    });

    // ── Loading states use skeleton loaders ───────────────────────────────────

    describe('loading states use skeleton loaders (no spinners)', () => {
        it.each(['creating', 'capturing', 'polling'] as PayPalStatus[])(
            '"%s" status renders skeleton blocks',
            (s) => {
                renderSheet({ status: s });
                const skeletons = document.querySelectorAll('[aria-hidden="true"].animate-pulse');
                expect(skeletons.length).toBeGreaterThan(0);
            }
        );
    });

    // ── Close button calls onCancel + reset ───────────────────────────────────

    it('close (X) button calls reset and onCancel', () => {
        const reset = vi.fn();
        const onCancel = vi.fn();
        renderSheet({ reset }, { onCancel });
        fireEvent.click(screen.getByRole('button', { name: /close/i }));
        expect(reset).toHaveBeenCalled();
        expect(onCancel).toHaveBeenCalled();
    });

    // ── isOpen=false hides the sheet ──────────────────────────────────────────

    it('does not render the sheet when isOpen is false', () => {
        renderSheet({}, { isOpen: false });
        expect(screen.queryByText(/Lipa kwa PayPal/i)).toBeNull();
    });
});
