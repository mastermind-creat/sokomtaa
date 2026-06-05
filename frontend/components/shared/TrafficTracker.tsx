'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import api from '@/lib/api';

export function TrafficTracker() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const isMounted = useRef(false);

    useEffect(() => {
        if (!isMounted.current) {
            isMounted.current = true;
        }

        const url = `${pathname}${searchParams?.toString() ? '?' + searchParams.toString() : ''}`;

        // Send tracking request silently
        api.post('/track-visit', {
            url,
            path: pathname
        }).catch(() => {
            // Silently fail if tracking block or network error
        });

    }, [pathname, searchParams]);

    return null;
}
