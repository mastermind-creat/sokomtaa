/**
 * Property 8: Payment Method Preference Persistence
 *
 * For both 'mpesa' and 'paypal':
 *   1. Selecting a method writes it to localStorage under 'soko_payment_method'.
 *   2. On re-mount the component pre-selects the stored value.
 *   3. When localStorage throws (private browsing), the component falls back
 *      silently to 'mpesa' without throwing.
 *
 * Validates: Requirements 5.5, 5.6
 *
 * Run with:
 *   npx vitest run components/shared/__tests__/PaymentMethodSelector.property.test.tsx
 */

import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import PaymentMethodSelector from '../PaymentMethodSelector';

// ── Constants ─────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'soko_payment_method';
type PaymentMethod = 'mpesa' | 'paypal';
const BOTH_METHODS: PaymentMethod[] = ['mpesa', 'paypal'];

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Render the component with a fresh onSelect spy, return both. */
function renderSelector(props: Partial<React.ComponentProps<typeof PaymentMethodSelector>> = {}) {
    const onSelect = vi.fn<(method: PaymentMethod) => void>();
    render(
        <PaymentMethodSelector
            onSelect={onSelect}
            reservationTotal={250}
            {...props}
        />
    );
    return { onSelect };
}

/** Click the button whose aria-label includes the given method name (case-insensitive). */
function clickMethod(method: PaymentMethod) {
    const label = method === 'mpesa' ? /m-pesa/i : /paypal/i;
    const btn = screen.getByRole('button', { name: label });
    fireEvent.click(btn);
}

/** Return the aria-pressed value for a method button. */
function isSelected(method: PaymentMethod): boolean {
    const label = method === 'mpesa' ? /m-pesa/i : /paypal/i;
    const btn = screen.getByRole('button', { name: label });
    return btn.getAttribute('aria-pressed') === 'true';
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Property 8: Payment Method Preference Persistence', () => {
    beforeEach(() => {
        // Start with a clean localStorage and no env override
        localStorage.clear();
        vi.unstubAllEnvs();
    });

    afterEach(() => {
        cleanup();
        localStorage.clear();
        vi.unstubAllEnvs();
    });

    // ── Part 1: Selection writes to localStorage ──────────────────────────────

    it.each(BOTH_METHODS)(
        'selecting "%s" writes it to localStorage',
        (method) => {
            renderSelector();
            clickMethod(method);
            expect(localStorage.getItem(STORAGE_KEY)).toBe(method);
        }
    );

    it('onSelect callback is called with the selected method', () => {
        const { onSelect } = renderSelector();
        clickMethod('paypal');
        expect(onSelect).toHaveBeenCalledWith('paypal');
        cleanup();

        const { onSelect: onSelect2 } = renderSelector();
        clickMethod('mpesa');
        expect(onSelect2).toHaveBeenCalledWith('mpesa');
    });

    it('switching between methods always writes the latest selection', () => {
        renderSelector();

        clickMethod('paypal');
        expect(localStorage.getItem(STORAGE_KEY)).toBe('paypal');

        clickMethod('mpesa');
        expect(localStorage.getItem(STORAGE_KEY)).toBe('mpesa');

        clickMethod('paypal');
        expect(localStorage.getItem(STORAGE_KEY)).toBe('paypal');
    });

    // ── Part 2: Re-mount pre-selects stored value ─────────────────────────────

    it.each(BOTH_METHODS)(
        're-mounting pre-selects stored "%s"',
        (method) => {
            // Pre-populate localStorage before mounting
            localStorage.setItem(STORAGE_KEY, method);

            renderSelector();

            expect(isSelected(method)).toBe(true);

            // The other method should NOT be selected
            const other: PaymentMethod = method === 'mpesa' ? 'paypal' : 'mpesa';
            expect(isSelected(other)).toBe(false);
        }
    );

    it('overrides stored value when defaultMethod prop is provided', () => {
        localStorage.setItem(STORAGE_KEY, 'paypal');

        // defaultMethod forces the initial selection regardless of storage
        renderSelector({ defaultMethod: 'mpesa' });

        expect(isSelected('mpesa')).toBe(true);
        expect(isSelected('paypal')).toBe(false);
    });

    // ── Part 3: Graceful fallback when localStorage throws ────────────────────

    it('falls back to "mpesa" without throwing when localStorage.getItem throws', () => {
        const getItemSpy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
            throw new Error('SecurityError: storage access denied');
        });

        let error: unknown;
        try {
            renderSelector();
        } catch (e) {
            error = e;
        }

        expect(error).toBeUndefined();
        // Should default to mpesa
        expect(isSelected('mpesa')).toBe(true);
        expect(isSelected('paypal')).toBe(false);

        getItemSpy.mockRestore();
    });

    it('falls back to "mpesa" without throwing when localStorage.setItem throws', () => {
        const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
            throw new Error('SecurityError: storage access denied');
        });

        let error: unknown;
        try {
            renderSelector();
            // Clicking should not throw even if setItem throws
            clickMethod('paypal');
        } catch (e) {
            error = e;
        }

        expect(error).toBeUndefined();

        setItemSpy.mockRestore();
    });

    it('falls back to "mpesa" when stored value is an unrecognised string', () => {
        localStorage.setItem(STORAGE_KEY, 'bitcoin');

        renderSelector();

        expect(isSelected('mpesa')).toBe(true);
        expect(isSelected('paypal')).toBe(false);
    });

    it('falls back to "mpesa" when localStorage is empty', () => {
        // No value set — clean state
        renderSelector();

        expect(isSelected('mpesa')).toBe(true);
        expect(isSelected('paypal')).toBe(false);
    });

    // ── Part 4: Property holds across representative reservation totals ────────

    it.each([0, 1, 100, 250, 9999, 100_000])(
        'works correctly for reservationTotal = %i',
        (total) => {
            localStorage.setItem(STORAGE_KEY, 'paypal');
            renderSelector({ reservationTotal: total });

            expect(isSelected('paypal')).toBe(true);

            clickMethod('mpesa');
            expect(localStorage.getItem(STORAGE_KEY)).toBe('mpesa');

            cleanup();
        }
    );

    // ── Part 5: USD equivalent display ────────────────────────────────────────

    it('displays USD equivalent when NEXT_PUBLIC_PAYPAL_RATE is set', () => {
        vi.stubEnv('NEXT_PUBLIC_PAYPAL_RATE', '0.00769');

        renderSelector({ reservationTotal: 250 });

        // 250 * 0.00769 = 1.9225 → "1.92"
        expect(screen.getByText(/USD/i)).toBeTruthy();
    });

    it('does not display USD when NEXT_PUBLIC_PAYPAL_RATE is not set', () => {
        // Env var deliberately absent
        renderSelector({ reservationTotal: 250 });

        const usdEl = screen.queryByText(/USD/i);
        expect(usdEl).toBeNull();
    });
});
