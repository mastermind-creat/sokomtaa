'use client';

/**
 * RiderMarker — renders the Boda Boda rider icon on the MapLibre canvas.
 * Uses a GeoJSON source + circle layer in orange/amber to visually distinguish
 * riders from stall markers (which are green/blue).
 */

import { useEffect } from 'react';
import type { Map as MapLibreMap } from 'maplibre-gl';

const RIDER_SOURCE_ID = 'rider-position';
const RIDER_LAYER_ID = 'rider-marker';
const RIDER_HALO_LAYER_ID = 'rider-marker-halo';

interface RiderMarkerProps {
    map: MapLibreMap | null;
    /** [lon, lat] from useRiderTracking */
    position: [number, number] | null;
}

export default function RiderMarker({ map, position }: RiderMarkerProps) {
    // Add layers once
    useEffect(() => {
        if (!map) return;

        const addLayers = () => {
            if (map.getSource(RIDER_SOURCE_ID)) return;

            map.addSource(RIDER_SOURCE_ID, {
                type: 'geojson',
                data: {
                    type: 'FeatureCollection',
                    features: [],
                },
            });

            // Animated halo
            map.addLayer({
                id: RIDER_HALO_LAYER_ID,
                type: 'circle',
                source: RIDER_SOURCE_ID,
                paint: {
                    'circle-color': '#F5A623',
                    'circle-radius': 18,
                    'circle-opacity': 0.3,
                    'circle-stroke-width': 0,
                },
            });

            // Rider icon dot (amber/orange — distinct from green stall markers)
            map.addLayer({
                id: RIDER_LAYER_ID,
                type: 'circle',
                source: RIDER_SOURCE_ID,
                paint: {
                    'circle-color': '#F5A623',
                    'circle-radius': 11,
                    'circle-stroke-width': 3,
                    'circle-stroke-color': '#ffffff',
                },
            });
        };

        if (map.isStyleLoaded()) {
            addLayers();
        } else {
            map.once('load', addLayers);
        }

        return () => {
            if (map.getLayer(RIDER_LAYER_ID)) map.removeLayer(RIDER_LAYER_ID);
            if (map.getLayer(RIDER_HALO_LAYER_ID)) map.removeLayer(RIDER_HALO_LAYER_ID);
            if (map.getSource(RIDER_SOURCE_ID)) map.removeSource(RIDER_SOURCE_ID);
        };
    }, [map]);

    // Update position whenever it changes (within 500ms of receipt — synchronous setState update)
    useEffect(() => {
        if (!map) return;
        const source = map.getSource(RIDER_SOURCE_ID) as maplibregl.GeoJSONSource | undefined;
        if (!source) return;

        if (!position) {
            source.setData({ type: 'FeatureCollection', features: [] });
            return;
        }

        source.setData({
            type: 'FeatureCollection',
            features: [
                {
                    type: 'Feature',
                    geometry: {
                        type: 'Point',
                        coordinates: position, // [lon, lat]
                    },
                    properties: { type: 'rider' },
                },
            ],
        });
    }, [map, position]);

    // Controller component — no DOM output
    return null;
}
