/**
 * Property 9: Polling Timeout Termination
 *
 * For any polling session started by usePayPal, if neither 'completed' nor
 * 'failed' status is returned within 300 seconds (5 minutes, 100 × 3-second
 * intervals), polling MUST stop and the hook status MUST transition to
 * 'timeout'. No further API calls must be made after the timeout state is
 * reached.
 *
 * Validates: Requirement 6.6
 *
 * Run with:
 *   npx vitest run hooks/__tests__/usePayPal.property.test.ts
 */

import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// ── Mock @/lib/api ──────────────────────────────────────────────────────────
// We mock the module before importing the hook so the hook always uses the mock.
vi.mock('@/lib/api', () => ({
    default: {
        get: vi.fn(),
        post: vi.fn(),
    },
}));

// ── Mock Zustand stores that api.ts imports at module level ─────────────────
vi.mock('@/store/uiStore', () => ({
    useUIStore: { getState: () => ({ setIsGlobalLoading: vi.fn() }) },
}));
vi.mock('@/store/authStore', () => ({
    useAuthStore: { getState: () => ({ logout: vi.fn() }) },
}));

import api from '@/lib/api';
import { usePayPal } from '../usePayPal';

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Build a mock GET response that always returns the given payment status. */
function mockApiGetAlways(status: 'pending' | 'completed' | 'failed') {
    (api.get as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        message: 'ok',
        data: {
            status,
            paypal_transaction_id: null,
            amount: 100,
            paid_at: null,
        },
        meta: null,
    });
}

/** Advance fake timers by exactly N full 3-second poll intervals. */
async function advancePollingIntervals(n: number) {
    for (let i = 0; i < n; i++) {
        await act(async () => {
            vi.advanceTimersByTime(3000);
        });
    }
}

// ── Constants mirrored from the hook ─────────────────────────────────────────
const MAX_POLL_INTERVALS = 100;   // hook stops after 100 ticks
const POLL_INTERVAL_MS = 3000;    // 3 s per tick

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Property 9: Polling Timeout Termination', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        (api.get as ReturnType<typeof vi.fn>).mockReset();
        (api.post as ReturnType<typeof vi.fn>).mockReset();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    // ── Core property ─────────────────────────────────────────────────────────

    it('transitions to "timeout" after exactly 100 pending responses (300 s)', async () => {
        mockApiGetAlways('pending');

        const { result } = renderHook(() => usePayPal());

        // Start polling
        act(() => {
            result.current.pollStatus('test-order-id');
        });

        expect(result.current.status).toBe('polling');

        // Advance 100 ticks — the 100th tick sets pollCountRef to 100 which is NOT
        // greater than MAX_POLL_INTERVALS, so polling continues.
        // The 101st tick sets it to 101 > 100 → timeout.
        await advancePollingIntervals(MAX_POLL_INTERVALS + 1);

        expect(result.current.status).toBe('timeout');
    });

    it('makes no further API calls after transitioning to "timeout"', async () => {
        mockApiGetAlways('pending');

        const { result } = renderHook(() => usePayPal());

        act(() => {
            result.current.pollStatus('test-order-id');
        });

        // Fast-forward past the timeout boundary
        await advancePollingIntervals(MAX_POLL_INTERVALS + 5);

        const callCountAtTimeout = (api.get as ReturnType<typeof vi.fn>).mock.calls.length;

        // Advance another full minute — no new calls must be made
        await act(async () => {
            vi.advanceTimersByTime(60_000);
        });

        expect((api.get as ReturnType<typeof vi.fn>).mock.calls.length).toBe(callCountAtTimeout);
    });

    it('does NOT time out before 300 s when status is always pending', async () => {
        mockApiGetAlways('pending');

        const { result } = renderHook(() => usePayPal());

        act(() => {
            result.current.pollStatus('test-order-id');
        });

        // Advance exactly MAX_POLL_INTERVALS ticks — should still be polling
        await advancePollingIntervals(MAX_POLL_INTERVALS);

        expect(result.current.status).toBe('polling');
    });

    // ── Property holds across multiple representative order IDs ───────────────

    it.each([
        'order-abc-001',
        'order-xyz-999',
        '4XD76138X7329860L',
        'PAYPAL-TEST-ORDER',
        'a'.repeat(20),
    ])(
        'times out correctly for orderId "%s"',
        async (orderId) => {
            mockApiGetAlways('pending');

            const { result } = renderHook(() => usePayPal());

            act(() => {
                result.current.pollStatus(orderId);
            });

            await advancePollingIntervals(MAX_POLL_INTERVALS + 1);

            expect(result.current.status).toBe('timeout');
        }
    );

    // ── Timeout does NOT fire when payment completes early ────────────────────

    it('does not reach timeout when payment completes before 300 s', async () => {
        // Return pending for the first 10 ticks, then completed
        let callCount = 0;
        (api.get as ReturnType<typeof vi.fn>).mockImplementation(() => {
            callCount++;
            const status = callCount >= 10 ? 'completed' : 'pending';
            return Promise.resolve({
                success: true,
                message: 'ok',
                data: {
                    status,
                    paypal_transaction_id: callCount >= 10 ? 'TXN123' : null,
                    amount: 250,
                    paid_at: callCount >= 10 ? '2025-01-01T12:00:00Z' : null,
                },
                meta: null,
            });
        });

        const { result } = renderHook(() => usePayPal());

        act(() => {
            result.current.pollStatus('early-complete-order');
        });

        // Advance enough for completion (15 ticks)
        await advancePollingIntervals(15);

        expect(result.current.status).toBe('completed');

        // Now advance past would-be timeout — status must remain 'completed'
        await advancePollingIntervals(MAX_POLL_INTERVALS);

        expect(result.current.status).toBe('completed');
    });

    it('does not reach timeout when payment fails before 300 s', async () => {
        let callCount = 0;
        (api.get as ReturnType<typeof vi.fn>).mockImplementation(() => {
            callCount++;
            const status = callCount >= 5 ? 'failed' : 'pending';
            return Promise.resolve({
                success: true,
                message: 'ok',
                data: { status, paypal_transaction_id: null, amount: 100, paid_at: null },
                meta: null,
            });
        });

        const { result } = renderHook(() => usePayPal());

        act(() => {
            result.current.pollStatus('early-fail-order');
        });

        await advancePollingIntervals(10);

        expect(result.current.status).toBe('failed');

        // Advance past timeout — must remain 'failed'
        await advancePollingIntervals(MAX_POLL_INTERVALS);

        expect(result.current.status).toBe('failed');
    });

    // ── Interval math: 100 intervals × 3 s = 300 s ───────────────────────────

    it('stops polling at or after exactly 300 seconds of elapsed time', async () => {
        mockApiGetAlways('pending');

        const { result } = renderHook(() => usePayPal());

        act(() => {
            result.current.pollStatus('timing-order');
        });

        // Advance the exact millisecond budget for 300 s
        await act(async () => {
            vi.advanceTimersByTime(MAX_POLL_INTERVALS * POLL_INTERVAL_MS + POLL_INTERVAL_MS);
        });

        expect(result.current.status).toBe('timeout');
    });

    // ── stopPolling() resets timeout counter so a fresh poll works ────────────

    it('resets timeout counter on a new pollStatus call after manual stopPolling', async () => {
        mockApiGetAlways('pending');

        const { result } = renderHook(() => usePayPal());

        // First session: run close to (but not past) the limit
        act(() => {
            result.current.pollStatus('order-session-1');
        });

        await advancePollingIntervals(MAX_POLL_INTERVALS - 2);
        expect(result.current.status).toBe('polling');

        // Stop manually and start fresh
        act(() => {
            result.current.stopPolling();
        });

        act(() => {
            result.current.pollStatus('order-session-2');
        });

        // Should still be polling — counter was reset, not accumulated
        await advancePollingIntervals(5);
        expect(result.current.status).toBe('polling');

        // Now actually time out the second session
        await advancePollingIntervals(MAX_POLL_INTERVALS);
        expect(result.current.status).toBe('timeout');
    });
});
