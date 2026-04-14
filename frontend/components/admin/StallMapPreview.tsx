'use client';

import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { ApiResponse } from '@/types';
import { Store, User, Phone, BadgeCheck, AlertTriangle } from 'lucide-react';

// Fix for default Leaflet icons in Next.js
const defaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

const createStallIcon = (status: string) => L.divIcon({
    html: `<div class="w-8 h-8 rounded-full flex items-center justify-center text-white shadow-lg border-2 border-white transition-transform hover:scale-125 ${
        status === 'occupied' ? 'bg-brand-600' : 
        status === 'maintenance' ? 'bg-red-500' : 
        'bg-amber-400'
    }">
             <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
           </div>`,
    className: 'custom-div-icon',
    iconSize: [32, 32],
    iconAnchor: [16, 32]
});

interface Stall {
    id: number;
    stall_number: string;
    status: string;
    zone: string;
    map_x: number;
    map_y: number;
    current_trader?: {
        business_name: string;
        user?: { name: string; phone: string };
    };
}

export default function StallMapPreview() {
    const [center, setCenter] = useState<[number, number]>([-1.286389, 36.817223]); // Default Nairobi
    const [mapReady, setMapReady] = useState(false);

    useEffect(() => {
        setMapReady(true);
    }, []);

    const { data: stalls } = useQuery({
        queryKey: ['admin-stalls'],
        queryFn: async () => {
            const res = await api.get<never, ApiResponse<Stall[]>>('/admin/stalls');
            return res.data;
        }
    });

    if (!mapReady) return null;

    return (
        <div className="h-[500px] w-full relative group">
            <MapContainer 
                center={center} 
                zoom={18} 
                scrollWheelZoom={false} 
                className="w-full h-full z-0"
                zoomControl={false}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                />
                
                <ZoomControl position="bottomright" />

                {stalls?.map((stall) => {
                    // If map_x/map_y are defined, use them as offsets from center for demo, 
                    // or treat them as lat/long if they look like it.
                    // For now, we'll scatter them slightly around center if they are 0.
                    const lat = stall.map_x ? Number(stall.map_x) : center[0] + (Math.random() - 0.5) * 0.001;
                    const lng = stall.map_y ? Number(stall.map_y) : center[1] + (Math.random() - 0.5) * 0.001;

                    return (
                        <Marker 
                            key={stall.id} 
                            position={[lat, lng]} 
                            icon={createStallIcon(stall.status)}
                        >
                            <Popup className="custom-popup" minWidth={200}>
                                <div className="p-3">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="px-2 py-0.5 bg-gray-100 rounded text-[10px] font-black text-text-muted uppercase tracking-widest">
                                            #{stall.stall_number}
                                        </div>
                                        <div className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${
                                            stall.status === 'occupied' ? 'bg-brand-50 text-brand-700' : 'bg-amber-50 text-amber-700'
                                        }`}>
                                            {stall.status}
                                        </div>
                                    </div>

                                    {stall.current_trader ? (
                                        <div className="space-y-3">
                                            <div>
                                                <h4 className="text-sm font-black text-green-950 flex items-center gap-2">
                                                    {stall.current_trader.business_name}
                                                    <BadgeCheck size={14} className="text-brand-600" />
                                                </h4>
                                                <p className="text-xs text-text-secondary font-medium">{stall.current_trader.user?.name}</p>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <button className="h-8 bg-brand-600 text-white rounded-lg flex items-center justify-center gap-2 text-[10px] font-black uppercase transition-all active:scale-95">
                                                    <Phone size={12} /> Call
                                                </button>
                                                <button className="h-8 bg-gray-50 text-green-950 rounded-lg flex items-center justify-center gap-2 text-[10px] font-black uppercase transition-all active:scale-95">
                                                    Profile
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-2">
                                            <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-2">
                                                <AlertTriangle size={20} />
                                            </div>
                                            <p className="text-xs font-black text-green-950">Stall Unoccupied</p>
                                            <button className="mt-3 w-full h-8 bg-brand-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest">
                                                Assign Trader
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}
            </MapContainer>

            {/* Map Overlay Info */}
            <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-white/20">
                <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-3">Map Legend</p>
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-brand-600" />
                        <span className="text-[10px] font-bold text-green-950">Occupied</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-amber-400" />
                        <span className="text-[10px] font-bold text-green-950">Available</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-red-500" />
                        <span className="text-[10px] font-bold text-green-950">Maintenance</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
