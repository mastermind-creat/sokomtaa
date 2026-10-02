'use client';

/**
 * useServiceHealth
 *
 * Polls all three health endpoints every 30 seconds.
 * Returns `isDegraded = true` only after a service has been unhealthy
 * for more than 30 consecutive seconds (i.e. two failed polls in a row).
 *
 * Endpoints polled:
 *   - Laravel:   GET /api/health          (proxied via Next.js rewrite or direct)
 *   - FastAPI:   GET /ai/health
 *   - Go Gateway: GET /go/health
 *
 * Requirements: 13.4
 */

import { useState, useEffect, useRef } from 'react';

const POLL_INTERVAL_MS = 30_000;

const HEALTH_ENDPOINTS: Record<string, string> = {
    laravel:
        (typeof process !== 'undefined'
            ? process.env.NEXT_PUBLIC_API_URL ?? ''
            : '') + '/health',
    fastapi:
        (typeof process !== 'undefined'
            ? process.env.NEXT_PUBLIC_AI_URL ?? ''
            : '') + '/ai/health',
    go:
        (typeof process !== 'undefined'
            ? process.env.NEXT_PUBLIC_GO_GATEWAY_HTTP_URL ?? ''
            : '') + '/go/health',
};

interface ServiceHealthState {
    /** True if any service has been non-200 for more than one consecutive poll */
    isDegraded: boolean;
    /** Per-service status map */
    statuses: Record<string, 'ok' | 'degraded' | 'unknown'>;
}

async function checkEndpoint(url: string): Promise<boolean> {
    try {
        const res = await fetch(url, { method: 'GET', cache: 'no-store' });
        return res.ok;
    } catch {
        return false;
    }
}

export function useServiceHealth(): ServiceHealthState {
    const [statuses, setStatuses] = useState<Record<string, 'ok' | 'degraded' | 'unknown'>>({
        laravel: 'unknown',
        fastapi: 'unknown',
        go: 'unknown',
    });

    // Track how many consecutive failed polls per service
    const failCountRef = useRef<Record<string, number>>({
        laravel: 0,
        fastapi: 0,
        go: 0,
    });

    const poll = async () => {
        const results = await Promise.allSettled(
            Object.entries(HEALTH_ENDPOINTS).map(async ([key, url]) => ({
                key,
                ok: await checkEndpoint(url),
            }))
        );

        const next: Record<string, 'ok' | 'degraded' | 'unknown'> = { ...statuses };

        for (const result of results) {
            if (result.status !== 'fulfilled') continue;
            const { key, ok } = result.value;

            if (ok) {
                failCountRef.current[key] = 0;
                next[key] = 'ok';
            } else {
                failCountRef.current[key] = (failCountRef.current[key] ?? 0) + 1;
                // Degrade only after 2+ consecutive failures (≥ 30s unhealthy)
                next[key] =
                    failCountRef.current[key] >= 2 ? 'degraded' : next[key];
            }
        }

        setStatuses(next);
    };

    useEffect(() => {
        // Initial poll
        poll();

        const timer = setInterval(poll, POLL_INTERVAL_MS);
        return () => clearInterval(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const isDegraded = Object.values(statuses).some((s) => s === 'degraded');

    return { isDegraded, statuses };
}
