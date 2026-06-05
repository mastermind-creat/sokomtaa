'use client';

import { useEffect, useRef, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import api from '@/lib/api';

function TrackerInner() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const isMounted = useRef(false);

    useEffect(() => {
        if (!isMounted.current) {
            isMounted.current = true;
        }

        const url = `${pathname}${searchParams?.toString() ? '?' + searchParams.toString() : ''}`;

        // Send tracking request silently using native fetch to bypass Axios interceptors
        // (so it doesn't trigger the global loading spinner) and use a neutral path to avoid adblockers
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
        if (!apiUrl) return;

        let token = null;
        try {
            const authStorage = localStorage.getItem('sokomtaa-auth-storage');
            if (authStorage) {
                token = JSON.parse(authStorage)?.state?.token || null;
            }
        } catch {
            token = localStorage.getItem('sokomtaa_token');
        }

        fetch(`${apiUrl}/ping-session`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` })
            },
            body: JSON.stringify({ url, path: pathname }),
            keepalive: true
        }).catch(() => {
            // Silently fail if network error
        });

    }, [pathname, searchParams]);

    return null;
}

export function TrafficTracker() {
    return (
        <Suspense fallback={null}>
            <TrackerInner />
        </Suspense>
    );
}
