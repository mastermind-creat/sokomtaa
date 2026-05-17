'use client';

import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Market, Trader } from '@/types';
import { useRouter } from 'next/navigation';
import {
    Store, User, ArrowRight, Loader2, Navigation,
    MapPin, List, X, SlidersHorizontal, Search
} from 'lucide-react';

import NearbyDiscoveryPanel from './NearbyDiscoveryPanel';

// ─── Leaflet Icon Fix ─────────────────────────────────────────────────────────
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// ─── Custom Icons ─────────────────────────────────────────────────────────────
const createMarkerIcon = (type: 'market' | 'trader') => {
    const bg  = type === 'market' ? '#1B6B3A' : '#F5A623';
    const svg = type === 'market'
        ? `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="white" viewBox="0 0 24 24"><path d="M20 7H4l1-4h14l1 4zm-1 1v9a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V8h14zm-8 2v5h2v-5h-2z"/></svg>`
        : `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="white" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>`;

    const html = `
        <div style="position:relative;display:flex;flex-direction:column;align-items:center;">
            <div style="
                width:42px;height:42px;background:${bg};border-radius:14px;border:3px solid white;
                box-shadow:0 4px 14px rgba(0,0,0,0.25);display:flex;align-items:center;justify-content:center;
            ">${svg}</div>
            <div style="
                width:0;height:0;border-left:7px solid transparent;border-right:7px solid transparent;
                border-top:9px solid ${bg};margin-top:-2px;
            "></div>
        </div>`;

    return L.divIcon({
        html,
        className: 'bg-transparent border-none',
        iconSize: [42, 56],
        iconAnchor: [21, 56],
        popupAnchor: [0, -58],
    });
};

const userIcon = L.divIcon({
    html: `<div style="
        width:18px;height:18px;background:#3B82F6;border:3px solid white;border-radius:50%;
        box-shadow:0 0 0 5px rgba(59,130,246,0.25);
    "></div>`,
    className: 'bg-transparent border-none',
    iconSize: [18, 18],
    iconAnchor: [9, 9],
});

// ─── Helper: fly map to position ─────────────────────────────────────────────
function FlyToController({ target }: { target: [number, number] | null }) {
    const map = useMap();
    useEffect(() => {
        if (target) map.flyTo(target, 13, { duration: 1.4 });
    }, [map, target]);
    return null;
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface NearbyMarket extends Market { distance_km?: number; }
interface NearbyTrader extends Trader { distance_km?: number; }
interface NearbyData {
    markets: NearbyMarket[];
    traders: NearbyTrader[];
    radius_km: number;
    total: number;
}

const RADIUS_OPTIONS = [10, 25, 50, 100] as const;
type RadiusKm = typeof RADIUS_OPTIONS[number];

// ─── Main Component ───────────────────────────────────────────────────────────
export default function DiscoveryMap() {
    const router = useRouter();
    const [userLoc, setUserLoc]         = useState<[number, number] | null>(null);
    const [flyTarget, setFlyTarget]     = useState<[number, number] | null>(null);
    const [radiusKm, setRadiusKm]       = useState<RadiusKm>(50);
    const [showPanel, setShowPanel]     = useState(false);
    const [showSlider, setShowSlider]   = useState(false);
    const [locError, setLocError]       = useState<string | null>(null);
    const [isLocating, setIsLocating]   = useState(false);
    const marketIcon = useMemo(() => createMarkerIcon('market'), []);
    const traderIcon = useMemo(() => createMarkerIcon('trader'), []);
    const sliderRef  = useRef<HTMLDivElement>(null);

    // ── Location Search Overrides (Nominatim) ─────────────────────────────────
    const [searchLocQuery, setSearchLocQuery] = useState('');
    const [locSuggestions, setLocSuggestions] = useState<any[]>([]);
    const [isSearchingLoc, setIsSearchingLoc] = useState(false);

    const handleLocSearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!searchLocQuery.trim()) return;
        setIsSearchingLoc(true);
        setLocError(null);
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
                    searchLocQuery
                )}&countrycodes=ke&limit=5`
            );
            const data = await response.json();
            if (data && data.length > 0) {
                setLocSuggestions(data);
            } else {
                setLocError('No locations found for that search query.');
            }
        } catch (err) {
            console.error('Location search failed', err);
            setLocError('Failed to search location. Please try again.');
        } finally {
            setIsSearchingLoc(false);
        }
    };

    // ── Nearby query — only fires when we have user location ─────────────────
    const { data: nearbyData, isLoading: isLoadingNearby, isFetching } = useQuery<NearbyData>({
        queryKey: ['map-nearby', userLoc?.[0], userLoc?.[1], radiusKm],
        queryFn: async () => {
            const res = await api.get('/map/nearby', {
                params: { lat: userLoc![0], lng: userLoc![1], radius: radiusKm }
            });
            // Interceptor returns response.data → res is { status, data: NearbyData }
            return res.data as NearbyData;
        },
        enabled: !!userLoc,
        staleTime: 1000 * 60 * 5, // 5 min
    });

    // ── Fallback query — used before geolocation ──────────────────────────────
    const { data: fallbackData } = useQuery({
        queryKey: ['map-discover-fallback'],
        queryFn: async () => {
            const res = await api.get('/map/discover', { params: { needs_fallback: 'true' } });
            // Interceptor returns response.data → res is { status, data: { markets, traders, fallback_location } }
            return res.data as {
                markets: NearbyMarket[];
                traders: NearbyTrader[];
                fallback_location?: { latitude: number; longitude: number } | null;
            };
        },
        enabled: !userLoc,
        staleTime: Infinity,
    });

    const markets: NearbyMarket[] = nearbyData?.markets ?? fallbackData?.markets ?? [];
    const traders: NearbyTrader[] = nearbyData?.traders ?? fallbackData?.traders ?? [];
    const total = nearbyData?.total ?? (markets.length + traders.length);

    // ── "Find Near Me" handler ────────────────────────────────────────────────
    const handleLocateMe = useCallback(() => {
        if (!navigator.geolocation) {
            setLocError('Your browser does not support location services.');
            return;
        }
        setIsLocating(true);
        setLocError(null);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
                setUserLoc(coords);
                setFlyTarget(coords);
                setIsLocating(false);
            },
            (err) => {
                setIsLocating(false);
                if (err.code === err.PERMISSION_DENIED) {
                    setLocError('Location access denied. Please allow it in browser settings.');
                } else {
                    setLocError('Could not get your location. Try again.');
                }
            },
            { timeout: 12000, maximumAge: 60000, enableHighAccuracy: true }
        );
    }, []);

    // ── Close slider on outside click ─────────────────────────────────────────
    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (sliderRef.current && !sliderRef.current.contains(e.target as Node)) {
                setShowSlider(false);
            }
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const initialCenter: [number, number] = fallbackData?.fallback_location
        ? [fallbackData.fallback_location.latitude, fallbackData.fallback_location.longitude]
        : [-1.286389, 36.817223]; // Nairobi CBD

    return (
        <div className="relative w-full h-[calc(100vh-200px)] rounded-[2.5rem] overflow-hidden border border-gray-100 shadow-sm z-0 bg-gray-100">

            {/* ── Location Search Bar — top-left ── */}
            <div className="absolute top-5 left-5 z-[1000] w-72 md:w-80">
                <form onSubmit={handleLocSearch} className="relative flex items-center bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-gray-100 p-1">
                    <input
                        type="text"
                        value={searchLocQuery}
                        onChange={(e) => {
                            setSearchLocQuery(e.target.value);
                            if (!e.target.value) setLocSuggestions([]);
                        }}
                        placeholder="Tafuta mahali (e.g. Seme, Kisumu)..."
                        className="flex-1 h-11 pl-4 pr-2 bg-transparent text-xs font-bold text-green-950 placeholder:text-text-muted outline-none"
                    />
                    <button
                        type="submit"
                        disabled={isSearchingLoc}
                        className="w-10 h-10 bg-brand-600 text-white rounded-xl flex items-center justify-center hover:bg-brand-700 active:scale-95 transition-all shrink-0"
                    >
                        {isSearchingLoc ? (
                            <Loader2 size={16} className="animate-spin" />
                        ) : (
                            <Search size={16} />
                        )}
                    </button>
                </form>

                {/* Suggestions Dropdown */}
                {locSuggestions.length > 0 && (
                    <div className="absolute left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden max-h-60 overflow-y-auto z-[1010]">
                        {locSuggestions.map((item, idx) => (
                            <button
                                key={idx}
                                onClick={() => {
                                    const coords: [number, number] = [Number(item.lat), Number(item.lon)];
                                    setUserLoc(coords);
                                    setFlyTarget(coords);
                                    setSearchLocQuery(item.display_name.split(',')[0]);
                                    setLocSuggestions([]);
                                }}
                                className="w-full text-left px-4 py-3 hover:bg-gray-50 active:bg-gray-100 transition-colors border-b border-gray-50 last:border-0 flex items-start gap-2.5"
                            >
                                <MapPin size={14} className="text-brand-600 mt-0.5 shrink-0" />
                                <div className="flex flex-col min-w-0">
                                    <span className="text-xs font-black text-green-950 truncate">
                                        {item.display_name.split(',')[0]}
                                    </span>
                                    <span className="text-[9px] font-bold text-text-muted truncate">
                                        {item.display_name.split(',').slice(1).join(',')}
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* ── Fetching Indicator ── */}
            {isFetching && userLoc && (
                <div className="absolute top-5 left-1/2 -translate-x-1/2 z-[1000] bg-white/95 backdrop-blur-md px-5 py-2.5 rounded-full shadow-lg flex items-center gap-2.5 border border-gray-100 pointer-events-none">
                    <Loader2 size={14} className="animate-spin text-brand-600" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-green-950">
                        Scanning {radiusKm} km…
                    </span>
                </div>
            )}

            {/* ── Map ── */}
            <MapContainer
                center={initialCenter}
                zoom={13}
                className="w-full h-full z-0"
                zoomControl={false}
            >
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    maxZoom={19}
                />

                <FlyToController target={flyTarget} />

                {/* User dot + radius circle */}
                {userLoc && (
                    <>
                        <Marker position={userLoc} icon={userIcon} />
                        <Circle
                            center={userLoc}
                            radius={radiusKm * 1000}
                            pathOptions={{
                                color: '#1B6B3A',
                                fillColor: '#1B6B3A',
                                fillOpacity: 0.05,
                                weight: 1.5,
                                dashArray: '6 4',
                            }}
                        />
                    </>
                )}

                {/* Market markers */}
                {markets.map((market) =>
                    market.latitude && market.longitude ? (
                        <Marker
                            key={`m-${market.id}`}
                            position={[Number(market.latitude), Number(market.longitude)]}
                            icon={marketIcon}
                        >
                            <Popup className="custom-popup" closeButton={false}>
                                <div className="p-1 w-[230px]">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center text-brand-600 shrink-0">
                                            <Store size={20} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-sm font-black text-green-950 uppercase leading-tight truncate">
                                                {market.name}
                                            </h4>
                                            <p className="text-[9px] font-bold text-brand-600 uppercase tracking-widest">
                                                {market.active_stalls_count ?? 0} Traders
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between mb-3">
                                        <p className="text-[10px] text-gray-500 flex items-center gap-1">
                                            <MapPin size={10} /> {market.location}
                                        </p>
                                        {market.distance_km !== undefined && (
                                            <span className="text-[10px] font-black text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                                                {market.distance_km < 1
                                                    ? `${Math.round(market.distance_km * 1000)} m`
                                                    : `${market.distance_km.toFixed(1)} km`}
                                            </span>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => router.push(`/resident/markets/${market.id}`)}
                                        className="w-full h-10 bg-green-950 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-brand-600 transition-colors"
                                    >
                                        Enter Market <ArrowRight size={14} />
                                    </button>
                                </div>
                            </Popup>
                        </Marker>
                    ) : null
                )}

                {/* Independent trader markers */}
                {traders.map((trader) =>
                    trader.latitude && trader.longitude ? (
                        <Marker
                            key={`t-${trader.id}`}
                            position={[Number(trader.latitude), Number(trader.longitude)]}
                            icon={traderIcon}
                        >
                            <Popup className="custom-popup" closeButton={false}>
                                <div className="p-1 w-[230px]">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-10 h-10 bg-amber-50 rounded-xl overflow-hidden flex items-center justify-center">
                                            {trader.avatar_url
                                                ? <img src={trader.avatar_url} alt="" className="w-full h-full object-cover" />
                                                : <User size={20} className="text-amber-500" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5 mb-0.5">
                                                <span className={`w-1.5 h-1.5 rounded-full ${trader.is_currently_open ? 'bg-green-500' : 'bg-gray-300'}`} />
                                                <span className="text-[8px] font-black text-text-muted uppercase tracking-widest">
                                                    {trader.is_currently_open ? 'Open' : 'Closed'}
                                                </span>
                                            </div>
                                            <h4 className="text-sm font-black text-green-950 leading-tight truncate">
                                                {trader.business_name}
                                            </h4>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">
                                            ★ {trader.average_rating || 'New'}
                                        </span>
                                        {trader.distance_km !== undefined && (
                                            <span className="text-[10px] font-black text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                                                {trader.distance_km < 1
                                                    ? `${Math.round(trader.distance_km * 1000)} m`
                                                    : `${trader.distance_km.toFixed(1)} km`}
                                            </span>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => router.push(`/trader/${trader.id}`)}
                                        className="w-full h-10 bg-amber-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-amber-600 transition-colors"
                                    >
                                        Visit Shop <ArrowRight size={14} />
                                    </button>
                                </div>
                            </Popup>
                        </Marker>
                    ) : null
                )}
            </MapContainer>

            {/* ── Control Panel — top-right ── */}
            <div className="absolute top-5 right-5 z-[1000] flex flex-col gap-2 items-end">

                {/* Find Near Me button */}
                <button
                    onClick={handleLocateMe}
                    disabled={isLocating}
                    className={[
                        'flex items-center gap-2.5 px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl transition-all active:scale-95',
                        userLoc
                            ? 'bg-brand-600 text-white hover:bg-brand-700'
                            : 'bg-green-950 text-white hover:bg-green-800',
                    ].join(' ')}
                >
                    {isLocating
                        ? <Loader2 size={16} className="animate-spin" />
                        : <Navigation size={16} />}
                    {isLocating ? 'Locating…' : userLoc ? 'Relocate Me' : 'Find Near Me'}
                </button>

                {/* Radius picker */}
                {userLoc && (
                    <div ref={sliderRef} className="relative">
                        <button
                            onClick={() => setShowSlider(v => !v)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-white/95 backdrop-blur-md rounded-xl text-xs font-black text-green-950 shadow-lg border border-gray-100 hover:bg-white transition-all"
                        >
                            <SlidersHorizontal size={14} className="text-brand-600" />
                            Radius: {radiusKm} km
                        </button>

                        {showSlider && (
                            <div className="absolute right-0 top-full mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 w-48">
                                <p className="text-[9px] font-black text-text-muted uppercase tracking-widest mb-3">
                                    Search Radius
                                </p>
                                <div className="flex flex-col gap-1.5">
                                    {RADIUS_OPTIONS.map(r => (
                                        <button
                                            key={r}
                                            onClick={() => { setRadiusKm(r); setShowSlider(false); }}
                                            className={`w-full py-2.5 rounded-xl text-xs font-black transition-all ${
                                                radiusKm === r
                                                    ? 'bg-brand-600 text-white'
                                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                        >
                                            {r} km
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Results count badge */}
                {userLoc && !isLoadingNearby && (
                    <div className="bg-white/95 backdrop-blur-md px-4 py-2 rounded-xl shadow-md border border-gray-100 text-[10px] font-black text-green-950 flex items-center gap-1.5">
                        <MapPin size={11} className="text-brand-600" />
                        {total} result{total !== 1 ? 's' : ''} found
                    </div>
                )}
            </div>

            {/* ── "View List" FAB — bottom-left ── */}
            {userLoc && (
                <button
                    onClick={() => setShowPanel(true)}
                    className="absolute bottom-8 left-5 z-[1000] flex items-center gap-2.5 px-5 py-3.5 bg-white rounded-2xl shadow-2xl border border-gray-100 text-xs font-black text-green-950 uppercase tracking-widest hover:bg-gray-50 active:scale-95 transition-all"
                >
                    <List size={16} className="text-brand-600" />
                    List View
                    {total > 0 && (
                        <span className="w-5 h-5 bg-brand-600 text-white rounded-full text-[9px] flex items-center justify-center">
                            {total > 99 ? '99+' : total}
                        </span>
                    )}
                </button>
            )}

            {/* ── Error Banner ── */}
            {locError && (
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[1000] bg-red-600 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 text-xs font-bold max-w-[320px] text-center">
                    <span className="flex-1">{locError}</span>
                    <button onClick={() => setLocError(null)} className="shrink-0">
                        <X size={14} />
                    </button>
                </div>
            )}

            {/* ── Legend ── */}
            <div className="absolute bottom-8 right-5 z-[1000] bg-white/90 backdrop-blur-md p-3 rounded-2xl border border-white shadow-xl flex items-center gap-4 text-[9px] font-black uppercase tracking-widest">
                <span className="flex items-center gap-1.5 text-brand-700">
                    <span className="w-3 h-3 rounded bg-brand-600 inline-block" /> Market
                </span>
                <span className="flex items-center gap-1.5 text-amber-700">
                    <span className="w-3 h-3 rounded bg-amber-500 inline-block" /> Trader
                </span>
                <span className="flex items-center gap-1.5 text-blue-600">
                    <span className="w-3 h-3 rounded-full bg-blue-500 inline-block" /> You
                </span>
            </div>

            {/* ── Popup Styles ── */}
            <style jsx global>{`
                .custom-popup .leaflet-popup-content-wrapper {
                    border-radius: 1.25rem;
                    box-shadow: 0 10px 40px -5px rgba(0,0,0,0.15);
                    padding: 4px;
                    border: 1px solid #f3f4f6;
                }
                .custom-popup .leaflet-popup-tip { background: white; }
                .custom-popup .leaflet-popup-content { margin: 8px; }
            `}</style>

            {/* ── Nearby Discovery Panel ── */}
            <NearbyDiscoveryPanel
                markets={markets}
                traders={traders}
                radiusKm={radiusKm}
                isOpen={showPanel}
                onClose={() => setShowPanel(false)}
            />
        </div>
    );
}
