'use client';

import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { MapPin, Navigation, Store, ChevronRight, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

// Fix for Leaflet icons in Next.js
const createMarketIcon = () => L.divIcon({
    html: `<div class="w-12 h-12 bg-brand-600 rounded-2xl flex items-center justify-center text-white shadow-xl border-4 border-white transform hover:scale-110 transition-all">
             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
           </div>`,
    className: 'custom-market-icon',
    iconSize: [48, 48],
    iconAnchor: [24, 48]
});

const createUserIcon = () => L.divIcon({
    html: `<div class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white shadow-lg border-2 border-white">
             <div class="w-3 h-3 bg-white rounded-full animate-ping"></div>
           </div>`,
    className: 'custom-user-icon',
    iconSize: [32, 32],
    iconAnchor: [16, 16]
});

const createTraderIcon = () => L.divIcon({
    html: `<div class="w-10 h-10 bg-amber-500 rounded-2xl flex items-center justify-center text-white shadow-xl border-4 border-white transform hover:scale-110 transition-all">
             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
           </div>`,
    className: 'custom-trader-icon',
    iconSize: [40, 40],
    iconAnchor: [20, 40]
});

interface Market {
    id: number;
    name: string;
    location: string;
    latitude: number;
    longitude: number;
    distance: number;
    traders_count: number;
}

interface Trader {
    id: number;
    business_name: string;
    latitude: number;
    longitude: number;
    distance: number;
    stall_type: string;
}

export default function NearbyMarketsMap() {
    const router = useRouter();
    const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [mapReady, setMapReady] = useState(false);

    useEffect(() => {
        setMapReady(true);
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setUserLocation([position.coords.latitude, position.coords.longitude]);
                },
                (err) => {
                    setError("Location permission denied. Please enable location to find nearby markets.");
                    console.error(err);
                }
            );
        } else {
            setError("Geolocation is not supported by your browser.");
        }
    }, []);

    const { data: nearbyMarketsData, isLoading: marketsLoading } = useQuery({
        queryKey: ['markets-nearby', userLocation],
        queryFn: async () => {
            if (!userLocation) return [];
            const res = await api.get('/markets/nearby', {
                params: {
                    lat: userLocation[0],
                    lng: userLocation[1],
                    radius: 20 // 20km radius
                }
            });
            return res.data as Market[];
        },
        enabled: !!userLocation
    });

    const { data: nearbyTradersData, isLoading: tradersLoading } = useQuery({
        queryKey: ['traders-nearby', userLocation],
        queryFn: async () => {
            if (!userLocation) return [];
            const res = await api.get('/traders/nearby', {
                params: {
                    lat: userLocation[0],
                    lng: userLocation[1],
                    radius: 10 // 10km radius for independent traders
                }
            });
            return res.data as Trader[];
        },
        enabled: !!userLocation
    });

    const markets = Array.isArray(nearbyMarketsData) ? nearbyMarketsData : ((nearbyMarketsData as any)?.data || []);
    const traders = Array.isArray(nearbyTradersData) ? nearbyTradersData : ((nearbyTradersData as any)?.data || []);

    if (!mapReady) return null;

    return (
        <div className="relative w-full h-[600px] rounded-[3rem] overflow-hidden border border-gray-100 shadow-2xl bg-gray-50">
            {!userLocation && !error && (
                <div className="absolute inset-0 z-[100] bg-white/80 backdrop-blur-md flex flex-col items-center justify-center gap-4 text-center p-8">
                    <div className="w-20 h-20 bg-brand-50 text-brand-600 rounded-[2rem] flex items-center justify-center animate-bounce">
                        <Navigation size={40} />
                    </div>
                    <h3 className="text-2xl font-black text-green-950 uppercase tracking-tighter">Locating You...</h3>
                    <p className="text-text-secondary font-medium max-w-xs leading-relaxed">
                        Please allow location access to discover markets and traders in your neighborhood.
                    </p>
                    <Loader2 className="animate-spin text-brand-600 mt-4" size={32} />
                </div>
            )}

            {error && (
                <div className="absolute inset-0 z-[100] bg-white/80 backdrop-blur-md flex flex-col items-center justify-center gap-4 text-center p-8">
                    <div className="w-20 h-20 bg-rose-50 text-rose-600 rounded-[2rem] flex items-center justify-center">
                        <MapPin size={40} />
                    </div>
                    <h3 className="text-2xl font-black text-rose-950 uppercase tracking-tighter">Location Error</h3>
                    <p className="text-rose-900/60 font-medium max-w-xs leading-relaxed">{error}</p>
                    <button 
                        onClick={() => window.location.reload()}
                        className="mt-4 px-8 h-14 bg-rose-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-rose-200 active:scale-95 transition-all"
                    >
                        Try Again
                    </button>
                </div>
            )}

            {userLocation && (
                <MapContainer 
                    center={userLocation} 
                    zoom={13} 
                    className="w-full h-full"
                    zoomControl={false}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    
                    {/* User Marker */}
                    <Marker position={userLocation} icon={createUserIcon()}>
                        <Popup>
                            <div className="p-2 font-black text-[10px] uppercase tracking-widest">You are here</div>
                        </Popup>
                    </Marker>

                    {/* Market Markers */}
                    {markets.map((market) => (
                        <Marker 
                            key={`market-${market.id}`} 
                            position={[market.latitude, market.longitude]} 
                            icon={createMarketIcon()}
                        >
                            <Popup className="custom-popup">
                                <div className="p-2 min-w-[200px]">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-8 h-8 bg-brand-50 text-brand-600 rounded-lg flex items-center justify-center">
                                            <Store size={16} />
                                        </div>
                                        <div>
                                            <h4 className="font-black text-green-950 text-sm leading-tight uppercase">{market.name}</h4>
                                            <p className="text-[10px] text-brand-600 font-black uppercase tracking-widest">
                                                {market.distance.toFixed(1)} km away
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50">
                                        <div className="text-[10px] font-black text-text-muted uppercase tracking-widest">
                                            {market.traders_count} Traders
                                        </div>
                                        <button 
                                            onClick={() => router.push(`/market/${market.id}`)}
                                            className="flex items-center gap-1 text-brand-600 font-black text-[10px] uppercase tracking-widest group"
                                        >
                                            Visit <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                        </button>
                                    </div>
                                </div>
                            </Popup>
                        </Marker>
                    ))}

                    {/* Independent Trader Markers */}
                    {traders.map((trader) => (
                        <Marker 
                            key={`trader-${trader.id}`} 
                            position={[trader.latitude, trader.longitude]} 
                            icon={createTraderIcon()}
                        >
                            <Popup className="custom-popup">
                                <div className="p-2 min-w-[200px]">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-8 h-8 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                                        </div>
                                        <div>
                                            <h4 className="font-black text-green-950 text-sm leading-tight uppercase">{trader.business_name}</h4>
                                            <p className="text-[10px] text-amber-600 font-black uppercase tracking-widest">
                                                Independent • {trader.distance.toFixed(1)} km away
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50">
                                        <div className="text-[10px] font-black text-text-muted uppercase tracking-widest">
                                            Open Stall
                                        </div>
                                        <button 
                                            onClick={() => router.push(`/trader/${trader.id}`)}
                                            className="flex items-center gap-1 text-brand-600 font-black text-[10px] uppercase tracking-widest group"
                                        >
                                            View Store <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                        </button>
                                    </div>
                                </div>
                            </Popup>
                        </Marker>
                    ))}

                    <MapControls />
                </MapContainer>
            )}

            {/* Floating Stats Overlay */}
            <AnimatePresence>
                {userLocation && markets.length > 0 && (
                    <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="absolute top-8 right-8 z-[1000] hidden md:block"
                    >
                        <div className="bg-white/90 backdrop-blur-xl p-6 rounded-[2rem] border border-white shadow-2xl shadow-brand-900/10 min-w-[240px]">
                            <h5 className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-4">Nearby Highlights</h5>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-brand-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-brand-100">
                                        <Store size={18} />
                                    </div>
                                    <div>
                                        <p className="text-xl font-black text-green-950 leading-none">{markets.length}</p>
                                        <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest mt-1">Markets Found</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-amber-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-amber-100">
                                        <Navigation size={18} />
                                    </div>
                                    <div>
                                        <p className="text-xl font-black text-green-950 leading-none">
                                            {markets[0].distance.toFixed(1)} <span className="text-xs">KM</span>
                                        </p>
                                        <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest mt-1">Closest Soko</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function MapControls() {
    const map = useMap();

    return (
        <div className="absolute bottom-8 left-8 z-[1000] flex flex-col gap-2">
            <button 
                onClick={() => map.zoomIn()}
                className="w-12 h-12 bg-white rounded-xl shadow-lg border border-gray-100 flex items-center justify-center font-black text-lg text-green-950 active:scale-90 transition-all"
            >
                +
            </button>
            <button 
                onClick={() => map.zoomOut()}
                className="w-12 h-12 bg-white rounded-xl shadow-lg border border-gray-100 flex items-center justify-center font-black text-lg text-green-950 active:scale-90 transition-all"
            >
                -
            </button>
        </div>
    );
}
