'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { MapPin, Navigation, Store, ChevronRight, Loader2, LocateFixed, ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

// ─── Custom Icons ─────────────────────────────────────────────────────────────

const createMarketIcon = (highlighted = false) =>
    L.divIcon({
        html: `<div class="flex items-center justify-center" style="
            width: 52px; height: 52px;
            background: ${highlighted ? '#16A34A' : '#1B6B3A'};
            border-radius: 16px;
            box-shadow: 0 8px 24px rgba(27,107,58,0.45), 0 0 0 4px #fff;
            border: 3px solid #fff;
            transition: transform 0.15s;
            transform: ${highlighted ? 'scale(1.18)' : 'scale(1)'};
        ">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
        </div>`,
        className: 'custom-market-icon',
        iconSize: [52, 52],
        iconAnchor: [26, 52],
        popupAnchor: [0, -56],
    });

const createUserIcon = () =>
    L.divIcon({
        html: `<div style="
            width: 36px; height: 36px;
            background: #2563EB;
            border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            box-shadow: 0 4px 16px rgba(37,99,235,0.5), 0 0 0 4px rgba(37,99,235,0.2);
            border: 3px solid #fff;
            position: relative;
        ">
            <div style="
                width: 10px; height: 10px;
                background: white;
                border-radius: 50%;
                animation: ping 1.5s cubic-bezier(0,0,0.2,1) infinite;
            "></div>
        </div>`,
        className: 'custom-user-icon',
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        popupAnchor: [0, -22],
    });

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface Market {
    id: number;
    name: string;
    location: string;
    latitude: number;
    longitude: number;
    distance: number;
    traders_count: number;
}

// ─── Map controller: fly to a target position ─────────────────────────────────

function MapController({
    target,
    zoom = 16,
}: {
    target: [number, number] | null;
    zoom?: number;
}) {
    const map = useMap();
    useEffect(() => {
        if (target) {
            map.flyTo(target, zoom, { animate: true, duration: 1.2 });
        }
    }, [target, zoom, map]);
    return null;
}

// ─── Zoom controls ────────────────────────────────────────────────────────────

function MapControls() {
    const map = useMap();
    return (
        <div className="absolute bottom-8 left-8 z-[1000] flex flex-col gap-2">
            <button
                onClick={() => map.zoomIn()}
                className="w-12 h-12 bg-white rounded-xl shadow-lg border border-gray-100 flex items-center justify-center font-black text-xl text-green-950 active:scale-90 transition-all"
            >
                +
            </button>
            <button
                onClick={() => map.zoomOut()}
                className="w-12 h-12 bg-white rounded-xl shadow-lg border border-gray-100 flex items-center justify-center font-black text-xl text-green-950 active:scale-90 transition-all"
            >
                −
            </button>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function NearbyMarketsMap() {
    const router = useRouter();

    const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
    const [flyTarget, setFlyTarget] = useState<[number, number] | null>(null);
    const [flyZoom, setFlyZoom] = useState(14);
    const [selectedMarketId, setSelectedMarketId] = useState<number | null>(null);
    const [locating, setLocating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [mapReady, setMapReady] = useState(false);
    const [isFallback, setIsFallback] = useState(false);
    // We store a pending-open market id; the MarkerOpener sub-component handles it inside the map context
    const [pendingOpenId, setPendingOpenId] = useState<number | null>(null);

    // ── Geolocation helper ──────────────────────────────────────────────────

    const locate = useCallback(() => {
        if (!('geolocation' in navigator)) {
            setError('Geolocation is not supported by your browser.');
            return;
        }
        setLocating(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
                setUserLocation(coords);
                setFlyTarget(coords);
                setFlyZoom(14);
                setLocating(false);
                setError(null);
                setIsFallback(false); // reset fallback on new location
            },
            (err) => {
                setLocating(false);
                setError('Location access denied. Defaulting to city center.');
                console.error(err);
                
                // Fallback to Nairobi city center so they can still see the market list
                const nairobiCoords: [number, number] = [-1.2921, 36.8219];
                setUserLocation(nairobiCoords);
                setFlyTarget(nairobiCoords);
                setFlyZoom(12);
                setIsFallback(true);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
        );
    }, []);

    useEffect(() => {
        setMapReady(true);
        locate();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Fetch nearby markets ────────────────────────────────────────────────

    const { data: nearbyMarketsData, isLoading: marketsLoading } = useQuery({
        queryKey: ['markets-nearby', userLocation],
        queryFn: async () => {
            if (!userLocation) return [];
            // Try nearby first (50 km radius)
            const res = await api.get('/markets/nearby', {
                params: { lat: userLocation[0], lng: userLocation[1], radius: 50 },
            });
            const nearby = (Array.isArray(res.data) ? res.data : (res.data as any)?.data ?? []) as Market[];

            // Fall back: if no markets in range, load all markets so the map is never blank
            if (nearby.length === 0) {
                setIsFallback(true);
                const fallback = await api.get('/markets');
                const all = (Array.isArray(fallback.data) ? fallback.data : (fallback.data as any)?.data ?? []) as Market[];
                // Compute approximate distance for each market from user coords
                return all
                    .filter((m: Market) => m.latitude && m.longitude)
                    .map((m: Market) => {
                        const R = 6371;
                        const dLat = ((m.latitude - userLocation[0]) * Math.PI) / 180;
                        const dLng = ((m.longitude - userLocation[1]) * Math.PI) / 180;
                        const a =
                            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                            Math.cos((userLocation[0] * Math.PI) / 180) *
                                Math.cos((m.latitude * Math.PI) / 180) *
                                Math.sin(dLng / 2) * Math.sin(dLng / 2);
                        const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                        return { ...m, distance: Math.round(dist * 10) / 10 };
                    })
                    .sort((a: Market, b: Market) => a.distance - b.distance);
            }
            return nearby;
        },
        enabled: !!userLocation,
    });

    const markets: Market[] = Array.isArray(nearbyMarketsData)
        ? nearbyMarketsData
        : (nearbyMarketsData as any)?.data || [];

    // ── Handle market card / marker click ──────────────────────────────────

    const handleMarketFocus = (market: Market) => {
        setSelectedMarketId(market.id);
        setFlyTarget([market.latitude, market.longitude]);
        setFlyZoom(17);
        setPendingOpenId(market.id);
    };

    if (!mapReady) return null;

    // ─────────────────────────────────────────────────────────────────────────

    return (
        <div className="relative w-full rounded-[3rem] overflow-hidden border border-gray-100 shadow-2xl bg-gray-50 flex flex-col lg:flex-row" style={{ minHeight: 560 }}>

            {/* ── Map Pane ── */}
            <div className="relative flex-1" style={{ minHeight: 400 }}>

                {/* Locating overlay */}
                {!userLocation && !error && (
                    <div className="absolute inset-0 z-[200] bg-white/85 backdrop-blur-md flex flex-col items-center justify-center gap-5 text-center p-8">
                        <div className="w-20 h-20 bg-brand-50 text-brand-600 rounded-[2rem] flex items-center justify-center animate-bounce">
                            <Navigation size={40} />
                        </div>
                        <h3 className="text-2xl font-black text-green-950 uppercase tracking-tighter">Locating You...</h3>
                        <p className="text-text-secondary font-medium max-w-xs leading-relaxed">
                            Please allow location access to discover markets in your neighbourhood.
                        </p>
                        <Loader2 className="animate-spin text-brand-600 mt-2" size={32} />
                    </div>
                )}

                {/* Error overlay */}
                {error && !userLocation && (
                    <div className="absolute inset-0 z-[200] bg-white/85 backdrop-blur-md flex flex-col items-center justify-center gap-5 text-center p-8">
                        <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-[2rem] flex items-center justify-center">
                            <MapPin size={40} />
                        </div>
                        <h3 className="text-xl font-black text-rose-900 uppercase tracking-tighter">Location Error</h3>
                        <p className="text-rose-700/70 font-medium max-w-xs leading-relaxed">{error}</p>
                        <button
                            onClick={locate}
                            className="mt-2 px-8 h-14 bg-brand-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-brand-200 active:scale-95 transition-all flex items-center gap-2"
                        >
                            <LocateFixed size={18} /> Try Again
                        </button>
                    </div>
                )}

                {userLocation && (
                    <MapContainer
                        center={userLocation}
                        zoom={14}
                        className="w-full h-full"
                        zoomControl={false}
                        style={{ minHeight: 400, height: '100%' }}
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />

                        {/* Fly controller */}
                        <MapController target={flyTarget} zoom={flyZoom} />
                        <MapControls />

                        {/* User location marker */}
                        <Marker position={userLocation} icon={createUserIcon()}>
                            <Popup>
                                <div className="p-2 font-black text-[11px] uppercase tracking-widest text-blue-700 flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping inline-block" />
                                    You are here
                                </div>
                            </Popup>
                        </Marker>

                        {/* Market markers */}
                        {markets.map((market) => (
                            <Marker
                                key={`market-${market.id}`}
                                position={[market.latitude, market.longitude]}
                                icon={createMarketIcon(selectedMarketId === market.id)}
                                eventHandlers={{
                                    click: (e) => {
                                        handleMarketFocus(market);
                                        e.target.openPopup();
                                        setPendingOpenId(null);
                                    },
                                }}
                            >
                                <Popup className="custom-popup" minWidth={220}>
                                    <div className="p-3 min-w-[220px]">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-10 h-10 bg-brand-50 text-brand-600 rounded-xl flex items-center justify-center shrink-0">
                                                <Store size={20} />
                                            </div>
                                            <div className="min-w-0">
                                                <h4 className="font-black text-green-950 text-sm leading-tight uppercase truncate">{market.name}</h4>
                                                <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider flex items-center gap-1 mt-0.5">
                                                    <MapPin size={9} className="text-amber-500 shrink-0" />
                                                    {market.location}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                                            <div className="space-y-0.5">
                                                <p className="text-[10px] font-black text-brand-600 uppercase tracking-widest">{market.traders_count} Traders</p>
                                                <p className="text-[10px] font-bold text-amber-600 uppercase">{market.distance?.toFixed(1) ?? '—'} km away</p>
                                            </div>
                                            <button
                                                onClick={() => router.push(`/market/${market.id}`)}
                                                className="flex items-center gap-1.5 bg-brand-600 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl shadow-md shadow-brand-200 active:scale-95 transition-all"
                                            >
                                                Visit <ExternalLink size={12} />
                                            </button>
                                        </div>
                                    </div>
                                </Popup>
                            </Marker>
                        ))}
                    </MapContainer>
                )}

                {/* ── Locate Me FAB ── */}
                <button
                    onClick={() => {
                        if (userLocation) {
                            setFlyTarget([...userLocation] as [number, number]);
                            setFlyZoom(15);
                        } else {
                            locate();
                        }
                    }}
                    disabled={locating}
                    className={cn(
                        'absolute top-6 right-6 z-[1000] w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl border-2 transition-all active:scale-90',
                        locating
                            ? 'bg-white border-gray-100 text-text-muted cursor-not-allowed'
                            : 'bg-brand-600 border-brand-500 text-white hover:bg-brand-700 shadow-brand-300'
                    )}
                    title="Go to my location"
                >
                    {locating
                        ? <Loader2 size={22} className="animate-spin" />
                        : <LocateFixed size={22} />
                    }
                </button>

                {/* ── Nearby stats badge ── */}
                <AnimatePresence>
                    {userLocation && markets.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="absolute top-6 left-6 z-[1000] hidden md:flex items-center gap-3 bg-white/90 backdrop-blur-xl px-5 py-3 rounded-2xl border border-white shadow-2xl"
                        >
                            <div className="w-9 h-9 bg-brand-600 text-white rounded-xl flex items-center justify-center shadow-md shadow-brand-100">
                                <Store size={18} />
                            </div>
                            <div>
                                <p className="text-base font-black text-green-950 leading-none">{markets.length} Markets</p>
                                <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest mt-0.5">
                                    Closest: {markets[0]?.distance?.toFixed(1) ?? '—'} km
                                </p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* ── Market List Sidebar ── */}
            {userLocation && (
                <div className="w-full lg:w-[280px] xl:w-[320px] bg-white border-t lg:border-t-0 lg:border-l border-gray-100 flex flex-col overflow-hidden">
                    <div className="p-5 border-b border-gray-50">
                        <h4 className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">
                            {isFallback ? 'All Markets' : 'Nearby Markets'}
                        </h4>
                        {isFallback && (
                            <p className="text-[10px] font-medium text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-2 py-1 mt-2">
                                No markets within 50 km — showing all available markets.
                            </p>
                        )}
                        {marketsLoading && (
                            <div className="flex items-center gap-2 mt-2">
                                <Loader2 size={14} className="animate-spin text-brand-600" />
                                <span className="text-[11px] text-text-muted font-bold">Finding markets...</span>
                            </div>
                        )}
                        {!marketsLoading && markets.length === 0 && (
                            <p className="text-[11px] text-text-muted font-medium mt-2">No markets found.</p>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto divide-y divide-gray-50 max-h-[320px] lg:max-h-none">
                        {markets.map((market) => (
                            <motion.button
                                key={market.id}
                                whileTap={{ scale: 0.97 }}
                                onClick={() => handleMarketFocus(market)}
                                className={cn(
                                    'w-full text-left px-5 py-4 flex items-center gap-4 transition-all',
                                    selectedMarketId === market.id
                                        ? 'bg-brand-50 border-l-4 border-brand-600'
                                        : 'hover:bg-gray-50 border-l-4 border-transparent'
                                )}
                            >
                                <div className={cn(
                                    'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all',
                                    selectedMarketId === market.id
                                        ? 'bg-brand-600 text-white shadow-lg shadow-brand-200'
                                        : 'bg-brand-50 text-brand-600'
                                )}>
                                    <Store size={18} />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <p className={cn(
                                        'text-sm font-black uppercase leading-tight truncate transition-colors',
                                        selectedMarketId === market.id ? 'text-brand-700' : 'text-green-950'
                                    )}>
                                        {market.name}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider truncate">
                                            {market.location}
                                        </span>
                                        <span className="text-[9px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100 shrink-0">
                                            {market.distance?.toFixed(1) ?? '—'} km
                                        </span>
                                    </div>
                                </div>

                                <ChevronRight
                                    size={16}
                                    className={cn(
                                        'shrink-0 transition-all',
                                        selectedMarketId === market.id ? 'text-brand-600 translate-x-0.5' : 'text-text-muted'
                                    )}
                                />
                            </motion.button>
                        ))}
                    </div>

                    {/* Go to market CTA */}
                    <AnimatePresence>
                        {selectedMarketId && (() => {
                            const m = markets.find(mk => mk.id === selectedMarketId);
                            if (!m) return null;
                            return (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="p-5 border-t border-gray-100 bg-white"
                                >
                                    <p className="text-[9px] font-black text-text-muted uppercase tracking-[0.2em] mb-3">Selected Market</p>
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 bg-brand-600 text-white rounded-xl flex items-center justify-center shadow-md shadow-brand-200">
                                            <Store size={18} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-green-950 uppercase leading-tight">{m.name}</p>
                                            <p className="text-[9px] text-brand-600 font-black">{m.traders_count} Traders · {m.distance?.toFixed(1)} km</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => router.push(`/market/${m.id}`)}
                                        className="w-full h-12 bg-brand-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-brand-200 active:scale-95 transition-all"
                                    >
                                        Visit Market <ExternalLink size={14} />
                                    </button>
                                    <button
                                        onClick={() => {
                                            const url = `https://www.google.com/maps/dir/?api=1&destination=${m.latitude},${m.longitude}`;
                                            window.open(url, '_blank');
                                        }}
                                        className="w-full h-11 mt-2 bg-white border-2 border-gray-100 text-green-950 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all"
                                    >
                                        <Navigation size={14} /> Get Directions
                                    </button>
                                </motion.div>
                            );
                        })()}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}
