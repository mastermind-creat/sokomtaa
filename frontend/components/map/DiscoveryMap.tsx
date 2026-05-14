'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Market, Trader, ApiResponse } from '@/types';
import { useRouter } from 'next/navigation';
import { Store, User, ArrowRight, Loader2, Navigation, MapPin } from 'lucide-react';
import { renderToString } from 'react-dom/server';

// Override default marker icons just in case
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom Icons
const createMarkerIcon = (type: 'market' | 'trader') => {
    const bgColor = type === 'market' ? 'bg-brand-600' : 'bg-amber-500';
    const iconHtml = renderToString(
        <div className={`w-10 h-10 ${bgColor} rounded-xl border-2 border-white shadow-lg flex items-center justify-center text-white transform -translate-y-2`}>
            {type === 'market' ? <Store size={20} /> : <User size={20} />}
            <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-${type === 'market' ? 'brand-600' : 'amber-500'}`} />
        </div>
    );

    return L.divIcon({
        html: iconHtml,
        className: 'bg-transparent border-none',
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        popupAnchor: [0, -45]
    });
};

// Sub-component to handle map bounds listening
function MapEventHandler({ setBounds }: { setBounds: (b: {n: number, s: number, e: number, w: number}) => void }) {
    const map = useMapEvents({
        moveend: () => {
            const bounds = map.getBounds();
            setBounds({
                n: bounds.getNorth(),
                s: bounds.getSouth(),
                e: bounds.getEast(),
                w: bounds.getWest(),
            });
        },
        zoomend: () => {
            const bounds = map.getBounds();
            setBounds({
                n: bounds.getNorth(),
                s: bounds.getSouth(),
                e: bounds.getEast(),
                w: bounds.getWest(),
            });
        }
    });

    // Initial bounds
    useEffect(() => {
        const bounds = map.getBounds();
        setBounds({
            n: bounds.getNorth(),
            s: bounds.getSouth(),
            e: bounds.getEast(),
            w: bounds.getWest(),
        });
    }, [map, setBounds]);

    return null;
}

// Sub-component to handle automatic flying to user location
function LocationController({ onLocationFound }: { onLocationFound: (pos: [number, number]) => void }) {
    const map = useMap();
    
    useEffect(() => {
        map.locate().on("locationfound", function (e) {
            map.flyTo(e.latlng, 14);
            onLocationFound([e.latlng.lat, e.latlng.lng]);
        });
    }, [map, onLocationFound]);
    
    return null;
}

export default function DiscoveryMap() {
    const router = useRouter();
    const [bounds, setBounds] = useState<{n: number, s: number, e: number, w: number} | null>(null);
    const [userLoc, setUserLoc] = useState<[number, number] | null>(null);
    const [mapCenter, setMapCenter] = useState<[number, number]>([-1.286389, 36.817223]); // Default Nairobi CBD
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    const marketIcon = useMemo(() => createMarkerIcon('market'), []);
    const traderIcon = useMemo(() => createMarkerIcon('trader'), []);

    // Fetch markers within bounds or fallback
    const { data: mapData, isLoading, isFetching } = useQuery({
        queryKey: ['map-discovery', bounds?.n, bounds?.s, bounds?.e, bounds?.w],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (bounds) {
                params.append('n', bounds.n.toString());
                params.append('s', bounds.s.toString());
                params.append('e', bounds.e.toString());
                params.append('w', bounds.w.toString());
            }
            if (isInitialLoad) {
                params.append('needs_fallback', 'true');
            }
            const res = await api.get(`/map/discover?${params.toString()}`);
            return res.data;
        },
        staleTime: 1000 * 60 * 5, // 5 mins
    });

    const markets = mapData?.data?.markets || [];
    const traders = mapData?.data?.traders || [];
    const fallbackLocation = mapData?.data?.fallback_location;

    useEffect(() => {
        if (isInitialLoad && fallbackLocation && !userLoc) {
            setMapCenter([fallbackLocation.latitude, fallbackLocation.longitude]);
            setIsInitialLoad(false);
        }
    }, [isInitialLoad, fallbackLocation, userLoc]);

    return (
        <div className="relative w-full h-[calc(100vh-200px)] bg-gray-100 rounded-[2.5rem] overflow-hidden border border-gray-100 shadow-sm flex flex-col z-0">
            {/* Loading Indicator Overlay */}
            {isFetching && (
                <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[1000] bg-white/90 backdrop-blur-md px-6 py-3 rounded-full shadow-lg flex items-center gap-3 border border-gray-100">
                    <Loader2 size={16} className="animate-spin text-brand-600" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-green-950">Scanning Area...</span>
                </div>
            )}

            <MapContainer 
                center={mapCenter} 
                zoom={13} 
                className="w-full h-full z-0"
                zoomControl={false}
            >
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    maxZoom={19}
                />
                
                <LocationController onLocationFound={(pos) => setUserLoc(pos)} />
                <MapEventHandler setBounds={setBounds} />

                {/* User Location Marker */}
                {userLoc && (
                    <Marker 
                        position={userLoc} 
                        icon={L.divIcon({
                            html: '<div class="w-4 h-4 bg-blue-500 border-2 border-white rounded-full shadow-md animate-pulse"></div>',
                            className: 'bg-transparent border-none'
                        })} 
                    />
                )}

                {/* Markets */}
                {markets.map((market: Market) => (
                    <Marker 
                        key={`m-${market.id}`} 
                        position={[market.latitude!, market.longitude!]}
                        icon={marketIcon}
                    >
                        <Popup className="custom-popup" closeButton={false}>
                            <div className="p-1 w-[220px]">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center text-brand-600 shrink-0">
                                        <Store size={20} />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-black text-green-950 uppercase leading-tight">{market.name}</h4>
                                        <p className="text-[9px] font-bold text-brand-600 uppercase tracking-widest mt-0.5">{market.active_stalls_count || 0} Traders</p>
                                    </div>
                                </div>
                                <p className="text-xs text-gray-500 mb-4 flex items-center gap-1.5 line-clamp-1">
                                    <MapPin size={12} /> {market.location}
                                </p>
                                <button 
                                    onClick={() => router.push(`/resident/markets/${market.id}`)}
                                    className="w-full h-10 bg-green-950 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-brand-600 transition-colors"
                                >
                                    Enter Market <ArrowRight size={14} />
                                </button>
                            </div>
                        </Popup>
                    </Marker>
                ))}

                {/* Independent Traders */}
                {traders.map((trader: Trader) => (
                    <Marker 
                        key={`t-${trader.id}`} 
                        position={[trader.latitude!, trader.longitude!]}
                        icon={traderIcon}
                    >
                        <Popup className="custom-popup" closeButton={false}>
                            <div className="p-1 w-[220px]">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 shrink-0">
                                        {trader.avatar_url ? (
                                            <img src={trader.avatar_url} alt="" className="w-full h-full object-cover rounded-xl" />
                                        ) : (
                                            <User size={20} />
                                        )}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-1.5 mb-0.5">
                                            <span className={`w-1.5 h-1.5 rounded-full ${trader.is_currently_open ? 'bg-green-500' : 'bg-gray-300'}`} />
                                            <span className="text-[8px] font-black text-text-muted uppercase tracking-widest">{trader.is_currently_open ? 'Open' : 'Closed'}</span>
                                        </div>
                                        <h4 className="text-sm font-black text-green-950 uppercase leading-tight truncate">{trader.business_name}</h4>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 mb-4">
                                    <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-md">★ {trader.average_rating || 'New'}</span>
                                    <span className="text-[10px] font-bold text-gray-500 bg-gray-50 px-2 py-1 rounded-md border border-gray-100">{trader.products_count || 0} Items</span>
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
                ))}
            </MapContainer>

            {/* Custom Styles for Leaflet Popup to match our design system */}
            <style jsx global>{`
                .custom-popup .leaflet-popup-content-wrapper {
                    border-radius: 1.5rem;
                    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
                    padding: 4px;
                }
                .custom-popup .leaflet-popup-tip {
                    background: white;
                }
                .custom-popup .leaflet-popup-content {
                    margin: 8px;
                }
            `}</style>
        </div>
    );
}
