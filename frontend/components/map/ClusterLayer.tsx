'use client';

/**
 * ClusterLayer — renders cluster circles and individual stall markers
 * onto the MapLibre GL canvas using GeoJSON sources + symbol layers.
 *
 * Because MapLibre GL manages its own canvas, this component is a
 * controller — it adds/updates/removes sources and layers imperatively
 * via the map instance rather than returning DOM nodes.
 */

import { useEffect } from 'react';
import type { Map as MapLibreMap } from 'maplibre-gl';
import type { AnyClusterFeature } from '@/hooks/useMapClusters';
import type { StallFeature } from '@/lib/mapUtils';

const SOURCE_ID = 'stall-clusters';
const CLUSTER_LAYER_ID = 'cluster-circles';
const CLUSTER_COUNT_LAYER_ID = 'cluster-count';
const UNCLUSTERED_LAYER_ID = 'unclustered-stalls';

interface ClusterLayerProps {
    map: MapLibreMap | null;
    clusters: AnyClusterFeature[];
    onStallClick: (stall: StallFeature) => void;
    onClusterClick: (clusterId: number, lng: number, lat: number) => void;
}

export default function ClusterLayer({
    map,
    clusters,
    onStallClick,
    onClusterClick,
}: ClusterLayerProps) {
    // Add layers on mount, remove on unmount
    useEffect(() => {
        if (!map) return;

        // Wait until map style is loaded
        const addLayers = () => {
            if (map.getSource(SOURCE_ID)) return;

            map.addSource(SOURCE_ID, {
                type: 'geojson',
                data: { type: 'FeatureCollection', features: [] },
            });

            // Cluster circle layer
            map.addLayer({
                id: CLUSTER_LAYER_ID,
                type: 'circle',
                source: SOURCE_ID,
                filter: ['==', ['get', 'cluster'], true],
                paint: {
                    'circle-color': '#1B6B3A',
                    'circle-radius': [
                        'step',
                        ['get', 'point_count'],
                        20,  // < 10 items
                        10, 28,  // 10-49 items
                        50, 36,  // 50+ items
                    ],
                    'circle-stroke-width': 3,
                    'circle-stroke-color': '#ffffff',
                    'circle-opacity': 0.9,
                },
            });

            // Cluster count label
            map.addLayer({
                id: CLUSTER_COUNT_LAYER_ID,
                type: 'symbol',
                source: SOURCE_ID,
                filter: ['==', ['get', 'cluster'], true],
                layout: {
                    'text-field': '{point_count_abbreviated}',
                    'text-size': 13,
                    'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
                },
                paint: {
                    'text-color': '#ffffff',
                },
            });

            // Individual stall markers
            map.addLayer({
                id: UNCLUSTERED_LAYER_ID,
                type: 'circle',
                source: SOURCE_ID,
                filter: ['!=', ['get', 'cluster'], true],
                paint: {
                    'circle-color': [
                        'match',
                        ['get', 'status'],
                        'occupied', '#1B6B3A',
                        'available', '#2563EB',
                        /* maintenance */ '#D97706',
                    ],
                    'circle-radius': 10,
                    'circle-stroke-width': 2,
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
            // Remove layers/source on unmount
            if (map.getLayer(CLUSTER_COUNT_LAYER_ID)) map.removeLayer(CLUSTER_COUNT_LAYER_ID);
            if (map.getLayer(CLUSTER_LAYER_ID)) map.removeLayer(CLUSTER_LAYER_ID);
            if (map.getLayer(UNCLUSTERED_LAYER_ID)) map.removeLayer(UNCLUSTERED_LAYER_ID);
            if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID);
        };
    }, [map]);

    // Update source data whenever clusters change
    useEffect(() => {
        if (!map) return;
        const source = map.getSource(SOURCE_ID) as maplibregl.GeoJSONSource | undefined;
        if (!source) return;

        source.setData({
            type: 'FeatureCollection',
            features: clusters as GeoJSON.Feature[],
        });
    }, [map, clusters]);

    // Cluster click → zoom in to expand
    useEffect(() => {
        if (!map) return;

        const handleClusterClick = (e: maplibregl.MapMouseEvent) => {
            const features = map.queryRenderedFeatures(e.point, {
                layers: [CLUSTER_LAYER_ID],
            });
            if (!features.length) return;
            const feature = features[0];
            const clusterId = feature.properties?.cluster_id as number | undefined;
            if (clusterId === undefined) return;
            const geom = feature.geometry as GeoJSON.Point;
            onClusterClick(clusterId, geom.coordinates[0], geom.coordinates[1]);
        };

        const handleStallClick = (e: maplibregl.MapMouseEvent) => {
            const features = map.queryRenderedFeatures(e.point, {
                layers: [UNCLUSTERED_LAYER_ID],
            });
            if (!features.length) return;
            const feature = features[0];
            const props = feature.properties as StallFeature['trader'] & { id: number; status: StallFeature['status'] };
            if (!props?.id) return;
            const geom = feature.geometry as GeoJSON.Point;

            const stallFeature: StallFeature = {
                id: props.id,
                lon: geom.coordinates[0],
                lat: geom.coordinates[1],
                status: props.status,
                trader: feature.properties?.trader
                    ? JSON.parse(feature.properties.trader as string)
                    : undefined,
            };
            onStallClick(stallFeature);
        };

        // Change cursor on hover
        const setCursor = () => { map.getCanvas().style.cursor = 'pointer'; };
        const resetCursor = () => { map.getCanvas().style.cursor = ''; };

        map.on('click', CLUSTER_LAYER_ID, handleClusterClick);
        map.on('click', UNCLUSTERED_LAYER_ID, handleStallClick);
        map.on('mouseenter', CLUSTER_LAYER_ID, setCursor);
        map.on('mouseleave', CLUSTER_LAYER_ID, resetCursor);
        map.on('mouseenter', UNCLUSTERED_LAYER_ID, setCursor);
        map.on('mouseleave', UNCLUSTERED_LAYER_ID, resetCursor);

        return () => {
            map.off('click', CLUSTER_LAYER_ID, handleClusterClick);
            map.off('click', UNCLUSTERED_LAYER_ID, handleStallClick);
            map.off('mouseenter', CLUSTER_LAYER_ID, setCursor);
            map.off('mouseleave', CLUSTER_LAYER_ID, resetCursor);
            map.off('mouseenter', UNCLUSTERED_LAYER_ID, setCursor);
            map.off('mouseleave', UNCLUSTERED_LAYER_ID, resetCursor);
        };
    }, [map, onStallClick, onClusterClick]);

    // This is a controller component — no DOM output
    return null;
}
