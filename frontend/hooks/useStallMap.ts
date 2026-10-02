'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Map as MapLibreMap, LngLatBounds } from 'maplibre-gl';
import api from '@/lib/api';
import { getBboxFromBounds, hashBbox, toGeoJSON } from '@/lib/mapUtils';
import type { StallFeature, BboxParams } from '@/lib/mapUtils';

interface UseStallMapResult {
    stalls: StallFeature[];
    isLoading: boolean;
    isOffline: boolean;
}

const CACHE_PREFIX = 'stall_bbox_';

function readCache(key: string): StallFeature[] | null {
    try {
        const raw = localStorage.getItem(CACHE_PREFIX + key);
        if (!raw) return null;
        return JSON.parse(raw) as StallFeature[];
    } catch {
        return null;
    }
}

function writeCache(key: string, stalls: StallFeature[]): void {
    try {
        localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(stalls));
    } catch {
        // storage quota exceeded — ignore
    }
}

export function useStallMap(map: MapLibreMap | null): UseStallMapResult {
    const [stalls, setStalls] = useState<StallFeature[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isOffline, setIsOffline] = useState(
        typeof navigator !== 'undefined' ? !navigator.onLine : false
    );

    // Debounce timer ref
    const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Track online/offline status
    useEffect(() => {
        const onOnline = () => setIsOffline(false);
        const onOffline = () => setIsOffline(true);
        window.addEventListener('online', onOnline);
        window.addEventListener('offline', onOffline);
        return () => {
            window.removeEventListener('online', onOnline);
            window.removeEventListener('offline', onOffline);
        };
    }, []);

    const fetchStalls = useCallback(async (bbox: BboxParams) => {
        const bboxHash = hashBbox(bbox);

        if (isOffline || !navigator.onLine) {
            // Serve cached data
            const cached = readCache(bboxHash);
            if (cached) {
                setStalls(cached);
            }
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        try {
            const response = await api.get('/map/stalls', { params: bbox });
            const fetched: StallFeature[] = response.data?.data ?? response.data ?? [];
            setStalls(fetched);
            writeCache(bboxHash, fetched);
        } catch {
            // Network error — fall back to cache
            const cached = readCache(bboxHash);
            if (cached) {
                setStalls(cached);
                setIsOffline(true);
            }
        } finally {
            setIsLoading(false);
        }
    }, [isOffline]);

    // Listen for map bounds changes with 300ms debounce
    useEffect(() => {
        if (!map) return;

        const handleMoveEnd = () => {
            if (debounceTimer.current) {
                clearTimeout(debounceTimer.current);
            }
            debounceTimer.current = setTimeout(() => {
                const bounds = map.getBounds() as unknown as LngLatBounds;
                const bbox = getBboxFromBounds(bounds);
                fetchStalls(bbox);
            }, 300);
        };

        map.on('moveend', handleMoveEnd);
        map.on('zoomend', handleMoveEnd);

        // Initial fetch
        handleMoveEnd();

        return () => {
            map.off('moveend', handleMoveEnd);
            map.off('zoomend', handleMoveEnd);
            if (debounceTimer.current) {
                clearTimeout(debounceTimer.current);
            }
        };
    }, [map, fetchStalls]);

    // When going back online, re-fetch current bounds
    useEffect(() => {
        if (!isOffline && map) {
            const bounds = map.getBounds() as unknown as LngLatBounds;
            const bbox = getBboxFromBounds(bounds);
            fetchStalls(bbox);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOffline]);

    return { stalls, isLoading, isOffline };
}
