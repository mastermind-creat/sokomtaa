/**
 * Feature: polyglot-architecture-upgrade, Property 24: Supercluster Applied at Zoom Below 15
 *
 * For any set of stall GeoJSON features:
 * - At zoom < 15: nearby features must be grouped into cluster objects with properties.cluster === true.
 * - At zoom >= 15: individual markers must be rendered without clustering (properties.cluster === false).
 * - Total points invariant: sum of point_count for clusters + count of single points equals total stalls.
 *
 * Validates: Requirements 10.3
 *
 * Run with:
 *   npx vitest run hooks/__tests__/useMapClusters.property.test.ts
 */

import { renderHook } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useMapClusters, type PointFeature, type ClusterFeature } from '../useMapClusters';
import type { StallFeature } from '@/lib/mapUtils';

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Generate N random stalls within the given bounding box */
function generateStalls(
    count: number,
    bbox: [number, number, number, number] = [34.7, -0.15, 34.85, -0.05]
): StallFeature[] {
    const [minLon, minLat, maxLon, maxLat] = bbox;
    const stalls: StallFeature[] = [];

    for (let i = 1; i <= count; i++) {
        stalls.push({
            id: i,
            lon: minLon + Math.random() * (maxLon - minLon),
            lat: minLat + Math.random() * (maxLat - minLat),
            status: i % 3 === 0 ? 'available' : i % 3 === 1 ? 'occupied' : 'maintenance',
            trader: {
                id: 100 + i,
                business_name: `Trader ${i}`,
                is_open: i % 2 === 0,
                average_rating: 4.5,
            },
        });
    }

    return stalls;
}

const GLOBAL_BBOX: [number, number, number, number] = [34.0, -1.0, 36.0, 1.0];

describe('Feature: polyglot-architecture-upgrade, Property 24: Supercluster Applied at Zoom Below 15', () => {
    it('returns empty array when stalls array is empty or bounds is null', () => {
        const { result: r1 } = renderHook(() => useMapClusters([], 12, GLOBAL_BBOX));
        expect(r1.current.clusters).toEqual([]);

        const stalls = generateStalls(10);
        const { result: r2 } = renderHook(() => useMapClusters(stalls, 12, null));
        expect(r2.current.clusters).toEqual([]);
    });

    it('renders ONLY individual stall markers at zoom >= 15 across 50 random test cases', () => {
        for (let iteration = 0; iteration < 50; iteration++) {
            const count = Math.floor(Math.random() * 30) + 5; // 5 to 35 stalls
            const stalls = generateStalls(count);
            const zoom = 15 + Math.random() * 5; // zoom 15.0 to 20.0

            const { result } = renderHook(() => useMapClusters(stalls, zoom, GLOBAL_BBOX));
            const clusters = result.current.clusters;

            // Invariant 1: Exactly N individual items returned
            expect(clusters.length).toBe(count);

            // Invariant 2: None of them should be a cluster
            for (const item of clusters) {
                const pt = item as PointFeature;
                expect((pt.properties as any).cluster).toBe(false);
                expect((pt.properties as any).point_count).toBeUndefined();
                expect(typeof pt.properties.id).toBe('number');
            }
        }
    });

    it('groups tightly clustered stalls into cluster objects at zoom < 15 across 50 random test cases', () => {
        for (let iteration = 0; iteration < 50; iteration++) {
            // Place 15 stalls very close together in Kolenyo Market
            const centerLon = 34.7679;
            const centerLat = -0.0917;
            const stalls: StallFeature[] = [];

            for (let i = 1; i <= 20; i++) {
                stalls.push({
                    id: i,
                    // tight radius (within ~50 meters)
                    lon: centerLon + (Math.random() - 0.5) * 0.0005,
                    lat: centerLat + (Math.random() - 0.5) * 0.0005,
                    status: 'occupied',
                    trader: {
                        id: i,
                        business_name: `Trader ${i}`,
                        is_open: true,
                    },
                });
            }

            const lowZoom = Math.floor(Math.random() * 12) + 2; // zoom 2 to 13
            const { result } = renderHook(() => useMapClusters(stalls, lowZoom, GLOBAL_BBOX));
            const clusters = result.current.clusters;

            // Tightly spaced points must be clustered together at low zoom
            expect(clusters.length).toBeLessThan(stalls.length);

            // Invariant: Total accounted points must equal total input stalls
            let totalPoints = 0;
            let clusterCount = 0;

            for (const item of clusters) {
                if (item.properties && 'cluster' in item.properties && item.properties.cluster) {
                    const c = item as ClusterFeature;
                    expect(c.properties.point_count).toBeGreaterThanOrEqual(2);
                    totalPoints += c.properties.point_count;
                    clusterCount++;
                } else {
                    totalPoints += 1;
                }
            }

            expect(clusterCount).toBeGreaterThan(0);
            expect(totalPoints).toBe(stalls.length);
        }
    });

    it('preserves total points conservation invariant across arbitrary distributions and zooms', () => {
        // Test metamorphic property: total points = sum(point_count) + sum(single points)
        for (let iteration = 0; iteration < 50; iteration++) {
            const count = Math.floor(Math.random() * 40) + 1;
            const stalls = generateStalls(count, [34.75, -0.12, 34.78, -0.08]);
            const zoom = Math.random() * 14.5; // any zoom strictly < 15

            const { result } = renderHook(() => useMapClusters(stalls, zoom, GLOBAL_BBOX));
            const clusters = result.current.clusters;

            let totalPoints = 0;
            for (const item of clusters) {
                if (item.properties && 'cluster' in item.properties && item.properties.cluster) {
                    totalPoints += (item as ClusterFeature).properties.point_count;
                } else {
                    totalPoints += 1;
                }
            }

            expect(totalPoints).toBe(stalls.length);
        }
    });
});
