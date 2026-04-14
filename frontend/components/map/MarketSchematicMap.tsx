'use client';

import React, { useEffect, useState } from 'react';
import { MapContainer, Marker, useMap, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Store, ShoppingBag, Fish, Wheat, Coffee, Zap, Wrench, AlertTriangle } from 'lucide-react';
import { renderToStaticMarkup } from 'react-dom/server';

interface Stall {
    id: number;
    stall_number: string;
    zone: 'A' | 'B' | 'C';
    status: 'occupied' | 'available' | 'maintenance';
    map_x: number;
    map_y: number;
    trader?: {
        business_name: string;
        is_open: boolean;
        primary_category?: string;
        average_rating?: number;
    };
}

interface MarketSchematicMapProps {
    stalls: Stall[];
    onStallClick: (stall: Stall) => void;
}

// Custom Icons mapping
const getCategoryIcon = (category?: string, status?: string) => {
    if (status === 'maintenance') return <Wrench size={24} />;
    
    switch (category?.toLowerCase()) {
        case 'vegetables':
        case 'fruits':
        case 'groceries': return <ShoppingBag size={24} />;
        case 'fish':
        case 'seafood': return <Fish size={24} />;
        case 'cereals':
        case 'grains': return <Wheat size={24} />;
        case 'electronics': return <Zap size={24} />;
        case 'food':
        case 'cafe': return <Coffee size={24} />;
        default: return <Store size={24} />;
    }
};

const createStallDivIcon = (stall: Stall) => {
    const isOccupied = stall.status === 'occupied';
    const isOpen = stall.trader?.is_open;
    const isMaint = stall.status === 'maintenance';
    
    let colorClass = 'bg-blue-50 border-blue-200 text-blue-600 border-dashed'; // Vacant
    if (isMaint) colorClass = 'bg-amber-50 border-amber-300 text-amber-700'; // Maintenance
    if (isOccupied) {
        colorClass = isOpen 
            ? 'bg-green-50 border-brand-600 text-brand-700 shadow-sm' // Open
            : 'bg-amber-50 border-amber-500 text-amber-700'; // Closed
    }

    const iconHtml = renderToStaticMarkup(
        <div className={`w-full h-full rounded-xl border-2 flex flex-col items-center justify-center p-1 transition-all ${colorClass}`}>
            <div className="shrink-0 scale-75 lg:scale-100">
                {getCategoryIcon(stall.trader?.primary_category, stall.status)}
            </div>
            <span className="text-[10px] font-black uppercase tracking-tighter mt-0.5">{stall.stall_number}</span>
        </div>
    );

    return L.divIcon({
        className: 'custom-stall-icon',
        html: iconHtml,
        iconSize: [64, 72],
        iconAnchor: [32, 36]
    });
};

const MapResizer = () => {
    const map = useMap();
    useEffect(() => {
        setTimeout(() => map.invalidateSize(), 100);
    }, [map]);
    return null;
};

export default function MarketSchematicMap({ stalls, onStallClick }: MarketSchematicMapProps) {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) return <div className="w-full h-full bg-neutral-50 animate-pulse rounded-3xl" />;

    // Bounds for L.CRS.Simple (coordinate space)
    // Assuming map_x 0-500, map_y 0-800 based on DASHBOARDS.md
    const bounds: L.LatLngBoundsExpression = [[0, 0], [800, 500]];

    return (
        <div className="w-full h-full relative bg-neutral-100 rounded-[2.5rem] overflow-hidden border-4 border-white shadow-inner">
            <MapContainer
                crs={L.CRS.Simple}
                bounds={bounds}
                maxBounds={bounds}
                minZoom={-1}
                maxZoom={2}
                zoomControl={false}
                className="w-full h-full z-0"
                attributionControl={false}
            >
                <MapResizer />
                <ZoomControl position="bottomright" />

                {/* Building Structure Mock (Visual decorative elements) */}
                {/* To be replaced with actual SVG overlay if needed */}

                {stalls.map((stall) => (
                    <Marker
                        key={stall.id}
                        position={[stall.map_y, stall.map_x]}
                        icon={createStallDivIcon(stall)}
                        eventHandlers={{
                            click: () => onStallClick(stall)
                        }}
                    />
                ))}

                {/* Entrance Indicators (Hardcoded positions as per building spec) */}
                <Marker 
                    position={[795, 100]} 
                    icon={L.divIcon({ html: '<div class="bg-red-500 text-white p-1 rounded-t-lg text-[8px] font-black">ENTRANCE</div>', className: '', iconSize: [60, 20]})} 
                    interactive={false}
                />
                <Marker 
                    position={[795, 400]} 
                    icon={L.divIcon({ html: '<div class="bg-red-500 text-white p-1 rounded-t-lg text-[8px] font-black">ENTRANCE</div>', className: '', iconSize: [60, 20]})} 
                    interactive={false}
                />
            </MapContainer>
        </div>
    );
}
