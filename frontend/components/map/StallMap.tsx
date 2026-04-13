'use client';

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Store, Navigation, MapPin } from 'lucide-react';
import { useRouter } from 'next/navigation';

// Fix for default Leaflet icons in Next.js
const icon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

// Custom Brand Icon for Stalls
const createStallIcon = (color: string) => L.divIcon({
    html: `<div class="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-brand-md transform active:scale-95 transition-all" style="background: ${color}; border: 3px solid white;">
             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
           </div>`,
    className: 'custom-div-icon',
    iconSize: [40, 40],
    iconAnchor: [20, 40]
});

interface Stall {
    id: number;
    business_name: string;
    latitude: number;
    longitude: number;
    stall_number: string;
    category?: { color?: string };
}

interface StallMapProps {
    center: [number, number];
    stalls: Stall[];
    zoom?: number;
}

const SetViewOnClick = ({ animateRef }: { animateRef: any }) => {
    const map = useMap();
    useEffect(() => {
        if (animateRef) {
            map.flyTo(animateRef, 18, { duration: 1.5 });
        }
    }, [animateRef]);
    return null;
};

export default function StallMap({ center, stalls, zoom = 16 }: StallMapProps) {
    const router = useRouter();
    const [mapReady, setMapReady] = useState(false);

    useEffect(() => {
        setMapReady(true);
    }, []);

    if (!mapReady) return (
        <div className="w-full h-full bg-neutral-100 animate-pulse flex flex-col items-center justify-center gap-2">
            <Loader2 className="animate-spin text-text-muted" />
            <span className="text-xs font-bold text-text-muted uppercase tracking-widest">Inatayarisha Ramani...</span>
        </div>
    );

    return (
        <MapContainer 
            center={center} 
            zoom={zoom} 
            scrollWheelZoom={false} 
            className="w-full h-full z-0"
            zoomControl={false}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {stalls.map((stall) => (
                <Marker 
                    key={stall.id} 
                    position={[stall.latitude, stall.longitude]} 
                    icon={createStallIcon(stall.category?.color || '#1B6B3A')}
                >
                    <Popup className="custom-popup">
                        <div className="p-1 min-w-[120px]">
                            <h4 className="font-bold text-green-950 text-sm leading-tight">{stall.business_name}</h4>
                            <p className="text-[10px] text-text-muted font-black uppercase mt-1">Stall {stall.stall_number}</p>
                            <button 
                                onClick={() => router.push(`/trader/${stall.id}`)}
                                className="mt-2 w-full bg-brand-600 text-white text-[10px] font-black uppercase tracking-widest py-2 rounded-lg"
                            >
                                Tembelea (Visit)
                            </button>
                        </div>
                    </Popup>
                </Marker>
            ))}
        </MapContainer>
    );
}

const Loader2 = ({ className }: { className?: string }) => (
    <svg className={`animate-spin ${className}`} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
);
