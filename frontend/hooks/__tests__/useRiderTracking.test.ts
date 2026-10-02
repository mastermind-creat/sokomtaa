/**
 * Checkpoint 9 — useRiderTracking tests
 *
 * Verifies:
 *  1. computeBackoffDelay: delay(N) = min(2^(N-1) * 1000ms, 30000ms)
 *  2. Sequence: 1s, 2s, 4s, 8s, 16s, 30s cap
 *  3. isTrackingUnavailable set after 3 consecutive failed attempts
 */

import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { computeBackoffDelay, useRiderTracking } from '../useRiderTracking';

// ── Mock next/navigation ────────────────────────────────────────────────────
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock('@/store/uiStore', () => ({
    useUIStore: { getState: () => ({ setIsGlobalLoading: vi.fn() }) },
}));
vi.mock('@/store/authStore', () => ({
    useAuthStore: { getState: () => ({ logout: vi.fn() }) },
}));

// ─────────────────────────────────────────────────────────────────────────────
// 1. Pure function — computeBackoffDelay
// ─────────────────────────────────────────────────────────────────────────────

describe('computeBackoffDelay — exponential backoff formula', () => {
    it('attempt 1 → 1000 ms', () => expect(computeBackoffDelay(1)).toBe(1000));
    it('attempt 2 → 2000 ms', () => expect(computeBackoffDelay(2)).toBe(2000));
    it('attempt 3 → 4000 ms', () => expect(computeBackoffDelay(3)).toBe(4000));
    it('attempt 4 → 8000 ms', () => expect(computeBackoffDelay(4)).toBe(8000));
    it('attempt 5 → 16000 ms', () => expect(computeBackoffDelay(5)).toBe(16000));
    it('attempt 6 → 30000 ms (cap)', () => expect(computeBackoffDelay(6)).toBe(30000));
    it('attempt 7 → 30000 ms (still capped)', () => expect(computeBackoffDelay(7)).toBe(30000));
    it('attempt 10 → 30000 ms (still capped)', () => expect(computeBackoffDelay(10)).toBe(30000));

    it('delay never exceeds 30000 ms for any attempt 1–20', () => {
        for (let n = 1; n <= 20; n++) {
            expect(computeBackoffDelay(n)).toBeLessThanOrEqual(30000);
        }
    });

    it('delay is monotonically non-decreasing', () => {
        let prev = 0;
        for (let n = 1; n <= 15; n++) {
            const d = computeBackoffDelay(n);
            expect(d).toBeGreaterThanOrEqual(prev);
            prev = d;
        }
    });

    it('first attempt starts at exactly 1000 ms', () => {
        expect(computeBackoffDelay(1)).toBe(1000);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. Hook — isTrackingUnavailable after 3 failed reconnect attempts
// ─────────────────────────────────────────────────────────────────────────────

describe('useRiderTracking — reconnect & unavailability', () => {
    let MockWebSocket: ReturnType<typeof vi.fn>;
    let wsInstances: { onclose: (() => void) | null; onopen: (() => void) | null; close: ReturnType<typeof vi.fn> }[];

    beforeEach(() => {
        vi.useFakeTimers();
        wsInstances = [];

        // Mock token in localStorage
        Object.defineProperty(window, 'localStorage', {
            value: { getItem: vi.fn(() => 'mock-jwt-token'), setItem: vi.fn(), removeItem: vi.fn() },
            writable: true,
        });

        // Mock WebSocket constructor
        MockWebSocket = vi.fn().mockImplementation(() => {
            const instance = {
                onopen: null as (() => void) | null,
                onmessage: null as ((e: MessageEvent) => void) | null,
                onerror: null as (() => void) | null,
                onclose: null as (() => void) | null,
                close: vi.fn(),
                readyState: 0,
            };
            wsInstances.push(instance);
            return instance;
        });

        (global as Record<string, unknown>).WebSocket = MockWebSocket;
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.clearAllMocks();
    });

    it('isTrackingUnavailable is false initially', () => {
        const { result } = renderHook(() => useRiderTracking('rider-1'));
        expect(result.current.isTrackingUnavailable).toBe(false);
    });

    it('sets isTrackingUnavailable=true after 3 failed connections', async () => {
        const { result } = renderHook(() => useRiderTracking('rider-1'));

        // Fail attempt 1
        act(() => { wsInstances[0]?.onclose?.(); });
        // Advance delay(1) = 1s for reconnect
        await act(async () => { vi.advanceTimersByTime(1000); });

        // Fail attempt 2
        act(() => { wsInstances[1]?.onclose?.(); });
        // Advance delay(2) = 2s for reconnect
        await act(async () => { vi.advanceTimersByTime(2000); });

        // Fail attempt 3 — should now mark unavailable
        act(() => { wsInstances[2]?.onclose?.(); });

        expect(result.current.isTrackingUnavailable).toBe(true);
        expect(result.current.isConnected).toBe(false);
    });

    it('resets isTrackingUnavailable and attempt counter for a new riderId', async () => {
        const { result, rerender } = renderHook(
            ({ id }: { id: string }) => useRiderTracking(id),
            { initialProps: { id: 'rider-1' } }
        );

        // Exhaust all 3 attempts for rider-1
        act(() => { wsInstances[0]?.onclose?.(); });
        await act(async () => { vi.advanceTimersByTime(1000); });
        act(() => { wsInstances[1]?.onclose?.(); });
        await act(async () => { vi.advanceTimersByTime(2000); });
        act(() => { wsInstances[2]?.onclose?.(); });
        expect(result.current.isTrackingUnavailable).toBe(true);

        // Switch to a different rider — should reset
        rerender({ id: 'rider-2' });
        expect(result.current.isTrackingUnavailable).toBe(false);
    });

    it('sets isConnected=true on successful WebSocket open', () => {
        const { result } = renderHook(() => useRiderTracking('rider-1'));
        act(() => { wsInstances[0]?.onopen?.(); });
        expect(result.current.isConnected).toBe(true);
        expect(result.current.isTrackingUnavailable).toBe(false);
    });

    it('updates position from incoming message', () => {
        const { result } = renderHook(() => useRiderTracking('rider-1'));
        act(() => { wsInstances[0]?.onopen?.(); });
        act(() => {
            wsInstances[0]?.onmessage?.(
                new MessageEvent('message', { data: JSON.stringify({ lat: -0.09, lon: 34.77 }) })
            );
        });
        expect(result.current.position).toEqual([34.77, -0.09]);
    });

    it('does not reconnect after isTrackingUnavailable is set', async () => {
        renderHook(() => useRiderTracking('rider-1'));

        act(() => { wsInstances[0]?.onclose?.(); });
        await act(async () => { vi.advanceTimersByTime(1000); });
        act(() => { wsInstances[1]?.onclose?.(); });
        await act(async () => { vi.advanceTimersByTime(2000); });
        act(() => { wsInstances[2]?.onclose?.(); });

        const countAtUnavailable = wsInstances.length;

        // Advance a lot — no new WS should be created
        await act(async () => { vi.advanceTimersByTime(60_000); });

        expect(wsInstances.length).toBe(countAtUnavailable);
    });
});
