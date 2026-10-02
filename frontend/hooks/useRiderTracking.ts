'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface UseRiderTrackingResult {
    position: [number, number] | null;
    isConnected: boolean;
    isTrackingUnavailable: boolean;
}

/** delay(N) = min(2^(N-1) * 1000ms, 30000ms), N is 1-indexed attempt number */
export function computeBackoffDelay(attempt: number): number {
    return Math.min(Math.pow(2, attempt - 1) * 1000, 30000);
}

const MAX_FAILED_ATTEMPTS = 3;
const GO_GATEWAY_URL =
    process.env.NEXT_PUBLIC_GO_GATEWAY_URL ?? 'ws://localhost:8002';

export function useRiderTracking(riderId: string | null): UseRiderTrackingResult {
    const [position, setPosition] = useState<[number, number] | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [isTrackingUnavailable, setIsTrackingUnavailable] = useState(false);

    const wsRef = useRef<WebSocket | null>(null);
    const attemptRef = useRef(0);
    const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isMountedRef = useRef(true);

    const getToken = (): string | null => {
        if (typeof window === 'undefined') return null;
        return localStorage.getItem('sokomtaa_token');
    };

    const cleanup = useCallback(() => {
        if (reconnectTimerRef.current) {
            clearTimeout(reconnectTimerRef.current);
            reconnectTimerRef.current = null;
        }
        if (wsRef.current) {
            wsRef.current.onopen = null;
            wsRef.current.onmessage = null;
            wsRef.current.onerror = null;
            wsRef.current.onclose = null;
            wsRef.current.close();
            wsRef.current = null;
        }
    }, []);

    const connect = useCallback(() => {
        if (!riderId || !isMountedRef.current) return;

        const token = getToken();
        if (!token) return;

        const url = `${GO_GATEWAY_URL}/ws/rider?rider_id=${encodeURIComponent(riderId)}&token=${encodeURIComponent(token)}`;

        try {
            const ws = new WebSocket(url);
            wsRef.current = ws;

            ws.onopen = () => {
                if (!isMountedRef.current) return;
                setIsConnected(true);
                setIsTrackingUnavailable(false);
                attemptRef.current = 0; // reset on successful connect
            };

            ws.onmessage = (event) => {
                if (!isMountedRef.current) return;
                try {
                    const data = JSON.parse(event.data as string) as { lat?: number; lon?: number };
                    if (typeof data.lon === 'number' && typeof data.lat === 'number') {
                        setPosition([data.lon, data.lat]);
                    }
                } catch {
                    // ignore malformed messages
                }
            };

            ws.onerror = () => {
                // handled in onclose
            };

            ws.onclose = () => {
                if (!isMountedRef.current) return;
                setIsConnected(false);

                attemptRef.current += 1;

                if (attemptRef.current >= MAX_FAILED_ATTEMPTS) {
                    setIsTrackingUnavailable(true);
                    return;
                }

                // Exponential backoff reconnect
                const delay = computeBackoffDelay(attemptRef.current);
                reconnectTimerRef.current = setTimeout(() => {
                    if (isMountedRef.current) connect();
                }, delay);
            };
        } catch {
            // WebSocket construction failed
            attemptRef.current += 1;
            if (attemptRef.current >= MAX_FAILED_ATTEMPTS) {
                setIsTrackingUnavailable(true);
                return;
            }
            const delay = computeBackoffDelay(attemptRef.current);
            reconnectTimerRef.current = setTimeout(() => {
                if (isMountedRef.current) connect();
            }, delay);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [riderId]);

    useEffect(() => {
        isMountedRef.current = true;

        if (riderId) {
            attemptRef.current = 0;
            setIsTrackingUnavailable(false);
            connect();
        }

        return () => {
            isMountedRef.current = false;
            cleanup();
        };
    }, [riderId, connect, cleanup]);

    return { position, isConnected, isTrackingUnavailable };
}
