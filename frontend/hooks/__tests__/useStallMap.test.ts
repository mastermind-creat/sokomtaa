/**
 * Checkpoint 9 — useStallMap tests
 *
 * Verifies:
 *  1. Debounce: moveend fires multiple times but fetch is called only once after 300ms
 *  2. Offline: when navigator.onLine is false, isOffline is set and cached data is served
 */

import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// ── Mock @/lib/api ──────────────────────────────────────────────────────────
vi.mock('@/lib/api', () => ({
    default: { get: vi.fn() },
}));

// ── Mock @/lib/mapUtils — getBboxFromBounds / hashBbox / toGeoJSON ──────────
vi.mock('@/lib/mapUtils', () => ({
    getBboxFromBounds: vi.fn(() => ({
        min_lon: 34.76,
        min_lat: -0.10,
        max_lon: 34.78,
        max_lat: -0.08,
    })),
    hashBbox: vi.fn(() => 'test-hash'),
    toGeoJSON: vi.fn(),
}));

// ── Mock next/navigation ────────────────────────────────────────────────────
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));

// ── Mock zustand stores consumed transitively ────────────────────────────────
vi.mock('@/store/uiStore', () => ({
    useUIStore: { getState: () => ({ setIsGlobalLoading: vi.fn() }) },
}));
vi.mock('@/store/authStore', () => ({
    useAuthStore: { getState: () => ({ logout: vi.fn() }) },
}));

import api from '@/lib/api';
import { useStallMap } from '../useStallMap';

// ── Fake MapLibre map ────────────────────────────────────────────────────────
function makeMap() {
    const handlers: Record<string, (() => void)[]> = {};
    return {
        on: vi.fn((event: string, cb: () => void) => {
            handlers[event] = handlers[event] ?? [];
            handlers[event].push(cb);
        }),
        off: vi.fn(),
        getBounds: vi.fn(() => ({
            getSouthWest: () => ({ lng: 34.76, lat: -0.10 }),
            getNorthEast: () => ({ lng: 34.78, lat: -0.08 }),
        })),
        _trigger: (event: string) => handlers[event]?.forEach((cb) => cb()),
    };
}

const STALLS = [{ id: 1, lon: 34.77, lat: -0.09, status: 'occupied' }];

describe('useStallMap — debounce (300 ms)', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        (api.get as ReturnType<typeof vi.fn>).mockResolvedValue({ data: { data: STALLS } });
        Object.defineProperty(window, 'localStorage', {
            value: { getItem: vi.fn(() => null), setItem: vi.fn(), removeItem: vi.fn() },
            writable: true,
        });
        Object.defineProperty(navigator, 'onLine', { value: true, writable: true, configurable: true });
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.clearAllMocks();
    });

    it('fires fetch only ONCE after 300 ms even when moveend fires multiple times', async () => {
        const map = makeMap();
        renderHook(() => useStallMap(map as never));

        // Let the initial mount debounce fire and settle
        await act(async () => { vi.advanceTimersByTime(400); });
        const callsAfterMount = (api.get as ReturnType<typeof vi.fn>).mock.calls.length;

        // Simulate 3 rapid moveend events — they should coalesce into 1 debounced call
        act(() => {
            map._trigger('moveend');
            map._trigger('moveend');
            map._trigger('moveend');
        });

        // Before 300 ms: no additional fetch yet
        expect((api.get as ReturnType<typeof vi.fn>).mock.calls.length).toBe(callsAfterMount);

        // Advance past debounce window
        await act(async () => { vi.advanceTimersByTime(300); });

        expect((api.get as ReturnType<typeof vi.fn>).mock.calls.length).toBe(callsAfterMount + 1);
    });

    it('does NOT call fetch before 300 ms elapses since last event', async () => {
        const map = makeMap();
        renderHook(() => useStallMap(map as never));

        await act(async () => { vi.advanceTimersByTime(400); });
        const callsAfterMount = (api.get as ReturnType<typeof vi.fn>).mock.calls.length;

        act(() => { map._trigger('moveend'); });

        await act(async () => { vi.advanceTimersByTime(299); });
        expect((api.get as ReturnType<typeof vi.fn>).mock.calls.length).toBe(callsAfterMount);
    });

    it('resets debounce timer on each new event', async () => {
        const map = makeMap();
        renderHook(() => useStallMap(map as never));

        await act(async () => { vi.advanceTimersByTime(400); });
        const callsAfterMount = (api.get as ReturnType<typeof vi.fn>).mock.calls.length;

        // Fire, wait 200ms, fire again — timer restarts
        act(() => { map._trigger('moveend'); });
        await act(async () => { vi.advanceTimersByTime(200); });
        act(() => { map._trigger('moveend'); });
        await act(async () => { vi.advanceTimersByTime(200); });

        // Only 200ms since last event — still no new fetch
        expect((api.get as ReturnType<typeof vi.fn>).mock.calls.length).toBe(callsAfterMount);

        // Cross the 300ms threshold from the second event
        await act(async () => { vi.advanceTimersByTime(100); });
        expect((api.get as ReturnType<typeof vi.fn>).mock.calls.length).toBe(callsAfterMount + 1);
    });
});

describe('useStallMap — offline behaviour', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.clearAllMocks();
    });

    it('sets isOffline=true and serves cache when navigator.onLine is false', async () => {
        Object.defineProperty(navigator, 'onLine', { value: false, writable: true, configurable: true });

        const cachedStalls = [{ id: 99, lon: 34.77, lat: -0.09, status: 'available' }];
        Object.defineProperty(window, 'localStorage', {
            value: {
                getItem: vi.fn(() => JSON.stringify(cachedStalls)),
                setItem: vi.fn(),
                removeItem: vi.fn(),
            },
            writable: true,
        });

        const map = makeMap();
        const { result } = renderHook(() => useStallMap(map as never));

        await act(async () => { vi.advanceTimersByTime(300); });

        expect(result.current.isOffline).toBe(true);
        expect(api.get).not.toHaveBeenCalled();
    });

    it('transitions isOffline true→false on "online" event', async () => {
        Object.defineProperty(navigator, 'onLine', { value: false, writable: true, configurable: true });

        Object.defineProperty(window, 'localStorage', {
            value: { getItem: vi.fn(() => null), setItem: vi.fn(), removeItem: vi.fn() },
            writable: true,
        });

        const map = makeMap();
        const { result } = renderHook(() => useStallMap(map as never));

        expect(result.current.isOffline).toBe(true);

        // Simulate coming back online
        act(() => {
            Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
            window.dispatchEvent(new Event('online'));
        });

        expect(result.current.isOffline).toBe(false);
    });
});
