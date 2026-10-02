'use client';

import { useMemo, useRef } from 'react';
import Supercluster from 'supercluster';
import type { StallFeature } from '@/lib/mapUtils';

export type ClusterFeature = Supercluster.ClusterFeature<Supercluster.AnyProps>;
export type PointFeature = Supercluster.PointFeature<{
    id: number;
    status: StallFeature['status'];
    trader: StallFeature['trader'];
}>;
export type AnyClusterFeature = ClusterFeature | PointFeature;

interface UseMapClustersResult {
    clusters: AnyClusterFeature[];
    supercluster: Supercluster | null;
}

const CLUSTER_ZOOM_THRESHOLD = 15;

export function useMapClusters(
    stalls: StallFeature[],
    zoom: number,
    bounds: [number, number, number, number] | null
): UseMapClustersResult {
    const scRef = useRef<Supercluster | null>(null);

    // Build Supercluster instance whenever stalls change
    const superclusterInstance = useMemo(() => {
        const sc = new Supercluster({
            radius: 60,
            maxZoom: 14, // cluster up to zoom 14; at 15+ show individuals
            minZoom: 0,
        });

        const points: PointFeature[] = stalls.map((stall) => ({
            type: 'Feature' as const,
            geometry: {
                type: 'Point' as const,
                coordinates: [stall.lon, stall.lat],
            },
            properties: {
                id: stall.id,
                status: stall.status,
                trader: stall.trader,
            },
        }));

        sc.load(points);
        scRef.current = sc;
        return sc;
    }, [stalls]);

    const clusters = useMemo<AnyClusterFeature[]>(() => {
        if (!bounds || stalls.length === 0) return [];

        if (zoom >= CLUSTER_ZOOM_THRESHOLD) {
            // Individual markers — skip clustering
            return stalls.map((stall) => ({
                type: 'Feature' as const,
                geometry: {
                    type: 'Point' as const,
                    coordinates: [stall.lon, stall.lat],
                },
                properties: {
                    id: stall.id,
                    status: stall.status,
                    trader: stall.trader,
                    cluster: false,
                },
            })) as PointFeature[];
        }

        // Apply Supercluster at zoom < 15
        return superclusterInstance.getClusters(
            bounds,
            Math.floor(zoom)
        ) as AnyClusterFeature[];
    }, [stalls, zoom, bounds, superclusterInstance]);

    return { clusters, supercluster: scRef.current };
}
