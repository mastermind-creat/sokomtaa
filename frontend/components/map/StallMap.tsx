'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useStallMap } from '@/hooks/useStallMap';
import { useMapClusters } from '@/hooks/useMapClusters';
import ClusterLayer from './ClusterLayer';
import StallBottomSheet from './StallBottomSheet';
import RiderMarker from './RiderMarker';
import type { StallFeature } from '@/lib/mapUtils';

// Kolenyo Market, Kisumu — default center
const DEFAULT_CENTER: [number, number] = [34.7679, -0.0917];
const DEFAULT_ZOOM = 15;

interface StallMapProps {
    /** Optional: rider position [lon, lat] from useRiderTracking */
    riderPosition?: [number, number] | null;
    className?: string;
}

export default function StallMap({ riderPosition = null, className = '' }: StallMapProps) {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const [map, setMap] = useState<maplibregl.Map | null>(null);
    const [zoom, setZoom] = useState(DEFAULT_ZOOM);
    const [bounds, setBounds] = useState<[number, number, number, number] | null>(null);
    const [selectedStall, setSelectedStall] = useState<StallFeature | null>(null);

    // Data hooks
    const { stalls, isLoading, isOffline } = useStallMap(map);
    const { clusters, supercluster } = useMapClusters(stalls, zoom, bounds);

    // Initialise MapLibre GL
    useEffect(() => {
        if (!mapContainerRef.current) return;

        const instance = new maplibregl.Map({
            container: mapContainerRef.current,
            style: 'https://demotiles.maplibre.org/style.json',
            center: DEFAULT_CENTER,
            zoom: DEFAULT_ZOOM,
        });

        instance.addControl(new maplibregl.NavigationControl(), 'top-right');

        const updateViewState = () => {
            setZoom(instance.getZoom());
            const b = instance.getBounds();
            setBounds([b.getWest(), b.getSouth(), b.getEast(), b.getNorth()]);
        };

        instance.on('load', updateViewState);
        instance.on('moveend', updateViewState);
        instance.on('zoomend', updateViewState);

        setMap(instance);

        return () => {
            instance.remove();
        };
    }, []);

    // Cluster click: zoom to expand
    const handleClusterClick = useCallback(
        (clusterId: number, lng: number, lat: number) => {
            if (!map || !supercluster) return;
            const expansionZoom = Math.min(
                supercluster.getClusterExpansionZoom(clusterId),
                20
            );
            map.easeTo({ center: [lng, lat], zoom: expansionZoom });
        },
        [map, supercluster]
    );

    return (
        <div className={`relative w-full h-full ${className}`}>
            {/* MapLibre GL canvas */}
            <div
                ref={mapContainerRef}
                className="w-full h-full"
                aria-label="Live market map"
                role="application"
            />

            {/* Loading overlay */}
            {isLoading && (
                <div
                    className="absolute inset-0 flex items-center justify-center bg-white/40 backdrop-blur-sm z-10 pointer-events-none"
                    aria-live="polite"
                    aria-label="Loading stall data"
                >
                    <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
                </div>
            )}

            {/* Offline indicator badge */}
            {isOffline && (
                <div
                    role="status"
                    className="absolute top-4 left-1/2 -translate-x-1/2 bg-amber-500 text-white px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest shadow-lg z-10"
                >
                    Cached data
                </div>
            )}

            {/* Canvas layers (controller components) */}
            <ClusterLayer
                map={map}
                clusters={clusters}
                onStallClick={setSelectedStall}
                onClusterClick={handleClusterClick}
            />

            <RiderMarker map={map} position={riderPosition} />

            {/* Stall bottom sheet */}
            <StallBottomSheet
                stall={selectedStall}
                isOffline={isOffline}
                onClose={() => setSelectedStall(null)}
            />
        </div>
    );
}
