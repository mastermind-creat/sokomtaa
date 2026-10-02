import type { Map as MapLibreMap, LngLatBounds } from 'maplibre-gl';

export interface StallFeature {
    id: number;
    lon: number;
    lat: number;
    status: 'occupied' | 'available' | 'maintenance';
    trader?: {
        id: number;
        business_name: string;
        is_open: boolean;
        average_rating?: number;
        primary_category?: string;
    };
}

export interface BboxParams {
    min_lon: number;
    min_lat: number;
    max_lon: number;
    max_lat: number;
}

export interface MapLibreBounds {
    getNorthEast(): { lng: number; lat: number };
    getSouthWest(): { lng: number; lat: number };
}

/** Convert API stall array to GeoJSON FeatureCollection. */
export function toGeoJSON(stalls: StallFeature[]): GeoJSON.FeatureCollection {
    return {
        type: 'FeatureCollection',
        features: stalls.map((stall) => ({
            type: 'Feature',
            geometry: {
                type: 'Point',
                coordinates: [stall.lon, stall.lat],
            },
            properties: {
                id: stall.id,
                status: stall.status,
                trader: stall.trader ?? null,
            },
        })),
    };
}

/** Extract bbox query params from MapLibre map bounds. */
export function getBboxFromBounds(bounds: LngLatBounds): BboxParams {
    const sw = bounds.getSouthWest();
    const ne = bounds.getNorthEast();
    return {
        min_lon: sw.lng,
        min_lat: sw.lat,
        max_lon: ne.lng,
        max_lat: ne.lat,
    };
}

/** Hash a BboxParams object to a stable string suitable as a cache key. */
export function hashBbox(bbox: BboxParams): string {
    const { min_lon, min_lat, max_lon, max_lat } = bbox;
    // Round to 4 decimal places (~11 m precision) to increase cache hit rate
    const round = (n: number) => Math.round(n * 10000) / 10000;
    return `${round(min_lon)},${round(min_lat)},${round(max_lon)},${round(max_lat)}`;
}
