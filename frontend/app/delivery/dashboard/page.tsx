'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    MapPin,
    Navigation,
    Package,
    Phone,
    CheckCircle2,
    Clock,
    AlertCircle,
    Power,
    Check,
    Loader2,
    RefreshCw,
    Search,
    Store,
    Upload,
    ShieldCheck,
    XCircle,
    FileText,
    ShoppingBag
} from 'lucide-react';
import api from '@/lib/api';
import { useUIStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import { useTranslation } from '@/hooks/useTranslation';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { toast } from 'sonner';

interface RiderProfile {
    id: number;
    vehicle_type: string;
    vehicle_registration: string;
    is_available: boolean;
    earnings_balance: number;
    verification_status: string;
    latitude?: number;
    longitude?: number;
}

interface RiderStats {
    profile: RiderProfile;
    completed_deliveries: number;
    active_deliveries: number;
    recent_transactions: any[];
    active_orders?: any[];
}

export default function RiderDashboard() {
    const { setPageTitle } = useUIStore();
    const { user, refreshUser } = useAuthStore();
    const queryClient = useQueryClient();
    const [coords, setCoords] = useState<{ lat: number; lng: number }>({ lat: -1.2921, lng: 36.8219 });
    const [otpInputs, setOtpInputs] = useState<{ [key: number]: string }>({});
    const [processingId, setProcessingId] = useState<number | null>(null);
    const [completingId, setCompletingId] = useState<number | null>(null);

    useEffect(() => {
        setPageTitle('Delivery Deck');
        refreshUser();

        // Get rider's current geo coordinates
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const newCoords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                    setCoords(newCoords);
                    // Update location on backend
                    api.post('/delivery/update-location', {
                        latitude: newCoords.lat,
                        longitude: newCoords.lng
                    }).catch(() => {});
                },
                () => {}
            );
        }
    }, [setPageTitle, refreshUser]);

    // Fetch stats, wallet balance, and recent transaction log
    const { data: statsData, isLoading: statsLoading } = useQuery({
        queryKey: ['rider-stats'],
        queryFn: () => api.get<never, { data: RiderStats }>('/delivery/stats').then(res => res.data),
        refetchInterval: 15000 // Auto-refresh wallet/stats every 15s
    });
    const stats = statsData;
    const profile = stats?.profile;

    // Fetch orders pool within 50 km
    const { data: poolData, isLoading: poolLoading, refetch: refetchPool } = useQuery({
        queryKey: ['rider-orders-pool', coords],
        queryFn: () => api.get<never, { data: any[] }>(`/delivery/orders?lat=${coords.lat}&lng=${coords.lng}`).then(res => res.data),
        enabled: !!profile?.is_available // Only fetch nearby pool if online!
    });
    const ordersPool = poolData || [];

    // Fetch currently assigned active/in-transit deliveries
    const { data: activeData, isLoading: activeLoading } = useQuery({
        queryKey: ['rider-active-orders'],
        queryFn: async () => {
            try {
                // We reuse stats data or retrieve active orders
                const res = await api.get<never, { data: RiderStats }>('/delivery/stats');
                return res.data.recent_transactions || [];
            } catch { return []; }
        }
    });

    // Mutations
    const toggleMutation = useMutation({
        mutationFn: () => api.post('/delivery/toggle-availability'),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['rider-stats'] });
            queryClient.invalidateQueries({ queryKey: ['rider-orders-pool'] });
        }
    });

    const acceptMutation = useMutation({
        mutationFn: (id: number) => api.post(`/delivery/orders/${id}/accept`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['rider-stats'] });
            queryClient.invalidateQueries({ queryKey: ['rider-orders-pool'] });
        }
    });

    const pickupMutation = useMutation({
        mutationFn: (id: number) => api.post(`/delivery/orders/${id}/pickup`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['rider-stats'] });
        }
    });

    const arrivalMutation = useMutation({
        mutationFn: (id: number) => api.post(`/delivery/orders/${id}/notify-arrival`),
        onSuccess: () => {
            // Success alert shown inline
        }
    });

    const completeMutation = useMutation({
        mutationFn: ({ id, code }: { id: number; code: string }) => 
            api.post(`/delivery/orders/${id}/complete`, { pickup_code: code }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['rider-stats'] });
            queryClient.invalidateQueries({ queryKey: ['rider-orders-pool'] });
            setOtpInputs({});
        }
    });

    const handleAccept = async (id: number) => {
        setProcessingId(id);
        try {
            await acceptMutation.mutateAsync(id);
        } catch {}
        setProcessingId(null);
    };

    const handlePickup = async (id: number) => {
        setProcessingId(id);
        try {
            await pickupMutation.mutateAsync(id);
        } catch {}
        setProcessingId(null);
    };

    const handleArrival = async (id: number) => {
        setProcessingId(id);
        try {
            await arrivalMutation.mutateAsync(id);
            alert("Customer notified successfully via in-app banner and SMS!");
        } catch {}
        setProcessingId(null);
    };

    const handleComplete = async (id: number) => {
        const code = otpInputs[id];
        if (!code) {
            alert("Please enter the resident's verification code.");
            return;
        }
        setCompletingId(id);
        try {
            await completeMutation.mutateAsync({ id, code });
        } catch (err: any) {
            alert(err.response?.data?.message || "Verification code is incorrect.");
        }
        setCompletingId(null);
    };

    const kycStatus = profile?.verification_status; // not_submitted | pending | verified | rejected
    const isOffline = !profile?.is_available;

    return (
        <div className="pb-40 -mx-4 md:-mx-0 font-sans">
            {/* ── KYC Status Banners (only shown when relevant) ── */}

            {/* 1. Not yet submitted — prompt rider to upload docs */}
            {kycStatus === 'not_submitted' && (
                <div className="px-4 mb-6">
                    <div className="bg-blue-50 border border-blue-100 rounded-[2rem] p-6 flex items-start gap-4 shadow-sm">
                        <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-blue-200">
                            <FileText size={28} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="text-base font-black text-blue-950 uppercase tracking-tight">Complete Your KYC</h3>
                            <p className="text-blue-700 text-xs font-bold leading-relaxed mb-4">Upload your National ID and driving licence to unlock payments and full access.</p>
                            <Link
                                href="/delivery/kyc"
                                className="inline-flex items-center gap-2 h-10 px-5 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-md"
                            >
                                <Upload size={14} /> Upload Documents
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            {/* 2. Submitted — under admin review */}
            {kycStatus === 'pending' && (
                <div className="px-4 mb-6">
                    <div className="bg-amber-50 border border-amber-100 rounded-[2rem] p-6 flex items-center gap-4 shadow-sm">
                        <div className="w-14 h-14 bg-amber-500 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-amber-200">
                            <Clock size={28} />
                        </div>
                        <div>
                            <h3 className="text-base font-black text-amber-950 uppercase tracking-tight">Documents Under Review</h3>
                            <p className="text-amber-700 text-xs font-bold leading-relaxed">Your KYC documents are being reviewed by county administrators. You can explore orders but cannot accept payments yet.</p>
                        </div>
                    </div>
                </div>
            )}

            {/* 3. Rejected — prompt resubmission */}
            {kycStatus === 'rejected' && (
                <div className="px-4 mb-6">
                    <div className="bg-red-50 border border-red-100 rounded-[2rem] p-6 flex items-start gap-4 shadow-sm">
                        <div className="w-14 h-14 bg-red-500 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-red-200">
                            <XCircle size={28} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="text-base font-black text-red-950 uppercase tracking-tight">KYC Not Approved</h3>
                            <p className="text-red-700 text-xs font-bold leading-relaxed mb-4">Your documents were not approved. Please re-upload with the correct documents.</p>
                            <Link
                                href="/delivery/kyc"
                                className="inline-flex items-center gap-2 h-10 px-5 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-md"
                            >
                                <Upload size={14} /> Re-submit Documents
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            {/* 4. Verified — brief success badge */}
            {kycStatus === 'verified' && (
                <div className="px-4 mb-6">
                    <div className="bg-green-50 border border-green-100 rounded-[2rem] p-4 flex items-center gap-3">
                        <ShieldCheck size={20} className="text-green-600 shrink-0" />
                        <p className="text-xs font-black text-green-800 uppercase tracking-widest">KYC Verified — Full access unlocked</p>
                    </div>
                </div>
            )}

            {/* Quick Status and Wallet Card */}
            <div className="px-4 mb-8">
                <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm flex flex-col gap-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={cn(
                                "w-3 h-3 rounded-full animate-pulse",
                                profile?.is_available ? "bg-green-500" : "bg-gray-400"
                            )} />
                            <span className="text-xs font-black uppercase tracking-widest text-green-950">
                                {profile?.is_available ? "Online & Ready" : "Offline"}
                            </span>
                        </div>
                        <button
                            onClick={() => toggleMutation.mutate()}
                            disabled={toggleMutation.isPending}
                            className={cn(
                                "h-14 px-6 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 flex items-center gap-2.5",
                                profile?.is_available 
                                    ? "bg-rose-50 text-rose-600 border border-rose-100" 
                                    : "bg-brand-600 text-white shadow-xl shadow-brand-600/20"
                            )}
                        >
                            <Power size={16} />
                            {profile?.is_available ? "Go Offline" : "Go Online"}
                        </button>
                    </div>

                    <div className="h-[1px] bg-gray-100" />

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <span className="text-[10px] font-black text-text-muted uppercase tracking-widest block mb-1">Rider Balance</span>
                            <span className="text-2xl font-black text-green-950">KES {Number(profile?.earnings_balance || 0).toLocaleString()}</span>
                            <span className="text-[9px] font-bold text-brand-600 block mt-1 tracking-widest uppercase">Instant Wallet Release</span>
                        </div>
                        <div className="text-right border-l border-gray-100 pl-4">
                            <span className="text-[10px] font-black text-text-muted uppercase tracking-widest block mb-1">Deliveries Completed</span>
                            <span className="text-2xl font-black text-green-950">{stats?.completed_deliveries || 0}</span>
                            <span className="text-[9px] font-bold text-gray-400 block mt-1 tracking-widest uppercase">Target Achieved</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Active / In Transit Deliveries */}
            {profile?.is_available && (
                <div className="px-4 mb-8">
                    <div className="flex items-center justify-between mb-4 px-2">
                        <h3 className="text-xs font-black text-green-950 uppercase tracking-[0.15em]">Active Shipments</h3>
                        <span className="text-[9px] font-black px-2.5 py-1 rounded bg-brand-50 text-brand-700 border border-brand-100 uppercase tracking-widest">
                            In-Transit ({stats?.active_deliveries || 0})
                        </span>
                    </div>

                    {/* Active Cards */}
                    {!stats?.active_orders || stats.active_orders.length === 0 ? (
                        <div className="py-8 text-center bg-gray-50/50 rounded-[2.5rem] border border-dashed border-gray-100">
                            <Package className="mx-auto text-gray-300 mb-2" size={36} />
                            <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">No active deliveries. Go to the Pool to accept.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {stats.active_orders.map((res: any) => {
                                if (!res) return null;
                                return (
                                    <div key={res.id} className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden p-6">
                                        <div className="flex items-start justify-between mb-4">
                                            <div>
                                                <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-100 uppercase tracking-widest">
                                                    {res.delivery_status === 'assigned' ? 'Awaiting Pickup' : 'In Transit'}
                                                </span>
                                                <h4 className="text-base font-black text-green-950 uppercase tracking-tight mt-1">{res.product?.name || 'Produce'}</h4>
                                                <p className="text-xs font-bold text-gray-500 mt-0.5">{res.delivery_address}</p>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-[10px] font-black text-brand-600 block">Payout (50%)</span>
                                                <span className="text-sm font-black text-green-950">KES {Number(res.delivery_fee / 2).toLocaleString()}</span>
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-3">
                                            {res.delivery_status === 'assigned' ? (
                                                <button
                                                    onClick={() => handlePickup(res.id)}
                                                    disabled={processingId === res.id}
                                                    className="w-full h-14 bg-gray-950 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2"
                                                >
                                                    {processingId === res.id ? <Loader2 size={16} className="animate-spin text-brand-400" /> : <Package size={16} className="text-brand-400" />}
                                                    Confirm Stall Pickup
                                                </button>
                                            ) : (
                                                <div className="space-y-4">
                                                    <button
                                                        onClick={() => handleArrival(res.id)}
                                                        disabled={processingId === res.id}
                                                        className="w-full h-14 bg-brand-50 text-brand-600 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 border border-brand-100"
                                                    >
                                                        {processingId === res.id ? <Loader2 size={16} className="animate-spin" /> : <Navigation size={16} />}
                                                        Send Arrival Alert (SMS)
                                                    </button>
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="text"
                                                            placeholder="ENTER CUSTOMER CODE"
                                                            value={otpInputs[res.id] || ''}
                                                            onChange={(e) => setOtpInputs({ ...otpInputs, [res.id]: e.target.value })}
                                                            className="flex-1 h-14 px-4 bg-gray-50 border border-gray-100 rounded-2xl text-center text-xs font-black uppercase tracking-widest text-green-950"
                                                        />
                                                        <button
                                                            onClick={() => handleComplete(res.id)}
                                                            disabled={completingId === res.id}
                                                            className="h-14 px-6 bg-green-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2"
                                                        >
                                                            {completingId === res.id ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                                                            Confirm Cashout
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="flex gap-2 mt-2">
                                                <a
                                                    href={`tel:${res.resident?.phone}`}
                                                    className="flex-1 h-12 bg-white border border-gray-100 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-text-muted active:text-green-950"
                                                >
                                                    <Phone size={14} /> Call Resident
                                                </a>
                                                <a
                                                    href={`tel:${res.trader?.mpesa_number || res.trader?.phone}`}
                                                    className="flex-1 h-12 bg-white border border-gray-100 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-text-muted active:text-green-950"
                                                >
                                                    <Store size={14} /> Call Trader
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* Geographical Radius Order Discovery Pool */}
            <div className="px-4">
                <div className="flex items-center justify-between mb-4 px-2">
                    <h3 className="text-xs font-black text-green-950 uppercase tracking-[0.15em]">Rider Order Pool</h3>
                    <button
                        onClick={() => refetchPool()}
                        className="w-10 h-10 bg-white border border-gray-100 rounded-xl flex items-center justify-center text-text-muted active:text-green-950 active:scale-95 transition-all shadow-sm"
                    >
                        <RefreshCw size={14} />
                    </button>
                </div>

                {isOffline ? (
                    <div className="py-20 text-center bg-gray-50/50 rounded-[3rem] border border-dashed border-gray-100">
                        <MapPin className="mx-auto text-gray-300 mb-4 animate-bounce" size={48} />
                        <p className="text-xs font-black text-text-muted uppercase tracking-widest leading-relaxed">
                            Offline Mode Active.<br />Go Online to start looking for deliveries.
                        </p>
                    </div>
                ) : poolLoading ? (
                    [1, 2].map(i => <div key={i} className="h-44 bg-gray-50 rounded-[2.5rem] animate-pulse mb-4" />)
                ) : ordersPool.length === 0 ? (
                    <div className="py-20 text-center bg-gray-50/50 rounded-[3rem] border border-dashed border-gray-100">
                        <Search className="mx-auto text-gray-300 mb-4" size={48} />
                        <p className="text-xs font-black text-text-muted uppercase tracking-widest">No nearby orders found. Keep online to receive alerts.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {ordersPool.map((order) => (
                            <div key={order.id} className="bg-white rounded-[2.5rem] border border-gray-50 shadow-sm p-6 group">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-brand-600">
                                            <Navigation size={22} />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-brand-50 text-brand-700 border border-brand-100 uppercase tracking-widest">
                                                    {order.distance_to_pickup_km} km away
                                                </span>
                                                <span className="text-[8px] font-black text-text-muted uppercase tracking-widest">#{order.reservation_code}</span>
                                            </div>
                                            <h4 className="text-sm font-black text-green-950 uppercase tracking-tight truncate max-w-[150px]">
                                                {order.product?.name || 'Produce'}
                                            </h4>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[8px] font-black text-brand-600 block uppercase tracking-widest mb-0.5">YOUR SHARE</span>
                                        <span className="text-base font-black text-green-950">KES {Number(order.delivery_fee / 2).toLocaleString()}</span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleAccept(order.id)}
                                    disabled={processingId === order.id}
                                    className="w-full h-14 bg-gray-950 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xl shadow-gray-950/15"
                                >
                                    {processingId === order.id ? <Loader2 size={16} className="animate-spin text-brand-400" /> : <CheckCircle2 size={16} className="text-brand-400" />}
                                    Accept Delivery
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
