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

        // Send tracking request silently using api to automatically resolve baseURL
        api.post('/ping-session', {
            url,
            path: pathname
        }, { silent: true } as any).catch(() => {
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
