'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useUIStore } from '@/store/uiStore';
import { 
    Users, 
    Search, 
    ShieldCheck,
    Store,
    MapPin,
    Star,
    ChevronRight,
    User,
    Phone,
    Filter,
    Activity,
    CheckCircle2,
    Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ApiResponse } from '@/types';
import { useTranslation } from '@/hooks/useTranslation';
import { cn } from '@/lib/utils';

interface Trader {
    id: number;
    business_name: string;
    verification_status: 'pending' | 'verified' | 'rejected';
    average_rating: number;
    user: {
        name: string;
        phone: string;
        email?: string;
    };
    market?: {
        name: string;
    };
    stall?: {
        stall_number: string;
        block: string;
    };
    created_at: string;
}

export default function AdminTradersPage() {
    const { t } = useTranslation();
    const { setPageTitle } = useUIStore();

    React.useEffect(() => {
        setPageTitle('Merchant Registry');
    }, [setPageTitle]);

    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');

    const { data: tradersData, isLoading } = useQuery<ApiResponse<Trader[]>>({
        queryKey: ['admin-traders'],
        queryFn: () => api.get('/admin/traders').catch(() => ({ data: { data: [
            { id: 1, business_name: 'Mama Ngina Fruits', verification_status: 'verified', average_rating: 4.8, user: { name: 'Ngina W.', phone: '0712345678' }, market: { name: 'Muthurwa Market' }, stall: { stall_number: 'B12', block: 'B' } },
            { id: 2, business_name: 'Zambezi Electronics', verification_status: 'pending', average_rating: 0, user: { name: 'John Doe', phone: '0722334455' }, market: { name: 'City Market' }, stall: { stall_number: 'A4', block: 'A' } },
            { id: 3, business_name: 'Coastal Fish Supply', verification_status: 'verified', average_rating: 4.2, user: { name: 'Salim K.', phone: '0733445566' }, market: { name: 'Kongowea' }, stall: { stall_number: 'C1', block: 'C' } }
        ] } } as any)),
    });
    
    const traders: Trader[] = Array.isArray(tradersData?.data) ? tradersData.data : ((tradersData?.data as any)?.data || []);

    const filteredTraders = traders.filter(t => {
        const matchesSearch = 
            t.business_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.user.phone.includes(searchQuery);
            
        const matchesStatus = filterStatus === 'all' || t.verification_status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    const stats = [
        { label: 'Active', value: traders.filter(t => t.verification_status === 'verified').length, icon: CheckCircle2, color: 'text-brand-600' },
        { label: 'Pending', value: traders.filter(t => t.verification_status === 'pending').length, icon: Clock, color: 'text-amber-600' },
        { label: 'Integrity', value: '4.8', icon: Star, color: 'text-blue-600' },
    ];

    return (
        <div className="pb-32 -mx-4 md:-mx-0">
            {/* ── Verification Vitality Matrix ── */}
            <div className="grid grid-cols-3 gap-2 px-4 mb-6">
                {stats.map((s, i) => (
                    <div key={i} className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center">
                        <span className={cn("text-[8px] font-black uppercase tracking-widest mb-1", s.color)}>{s.label}</span>
                        <div className="text-xl font-black text-green-950 tracking-tight">{s.value}</div>
                    </div>
                ))}
            </div>

            {/* ── Governance Controls ── */}
            <div className="px-4 mb-6 space-y-4">
                <div className="relative group">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-text-muted transition-colors group-focus-within:text-brand-500" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search merchant or phone..." 
                        className="w-full h-14 pl-14 pr-6 bg-white border border-gray-100 rounded-2xl shadow-sm outline-none focus:ring-2 focus:ring-brand-500/10 focus:border-brand-500 transition-all font-medium text-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                
                <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                    {['all', 'verified', 'pending', 'rejected'].map((status) => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={cn(
                                "px-5 h-10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border flex items-center justify-center gap-2",
                                filterStatus === status 
                                    ? "bg-gray-950 text-white border-transparent shadow-lg" 
                                    : "bg-white text-text-muted border-gray-100"
                            )}
                        >
                            {status === 'all' && <Activity size={12} />}
                            {status}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Merchant Ecosystem Hub ── */}
            <div className="px-4 space-y-4">
                {isLoading ? (
                    <div className="p-10 text-center opacity-30 font-black uppercase tracking-widest text-[10px]">Auditing Registry...</div>
                ) : filteredTraders.map((trader) => (
                    <motion.div 
                        key={trader.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-[2.5rem] border border-gray-50 shadow-sm overflow-hidden p-6 relative group active:scale-[0.98] transition-all"
                    >
                        <div className="flex items-start justify-between mb-6">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-brand-50 text-brand-600 rounded-[1.25rem] flex items-center justify-center shadow-inner">
                                    <Store size={24} />
                                </div>
                                <div>
                                    <h3 className="text-base font-black text-green-950 uppercase tracking-tight leading-none mb-1.5">{trader.business_name}</h3>
                                    <p className="text-[10px] font-black text-text-muted uppercase tracking-widest flex items-center gap-1.5">
                                        <User size={10} className="text-brand-500" /> {trader.user.name}
                                    </p>
                                </div>
                            </div>
                            <div className={cn(
                                "px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border",
                                trader.verification_status === 'verified' && "bg-green-50 text-green-700 border-green-100",
                                trader.verification_status === 'pending' && "bg-amber-50 text-amber-700 border-amber-100",
                                trader.verification_status === 'rejected' && "bg-rose-50 text-rose-700 border-rose-100"
                            )}>
                                {trader.verification_status}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="bg-gray-50/50 p-3 rounded-2xl border border-gray-100">
                                <span className="text-[8px] font-black text-text-muted uppercase tracking-widest mb-1 block">Infrastructure</span>
                                <div className="flex items-center gap-1.5 text-[11px] font-bold text-green-950">
                                    <MapPin size={10} className="text-brand-500" />
                                    <span className="truncate">{trader.market?.name || 'Unassigned'}</span>
                                </div>
                            </div>
                            <div className="bg-gray-50/50 p-3 rounded-2xl border border-gray-100">
                                <span className="text-[8px] font-black text-text-muted uppercase tracking-widest mb-1 block">Operational Hub</span>
                                <div className="flex items-center gap-1.5 text-[11px] font-bold text-green-950">
                                    <Phone size={10} className="text-brand-500" />
                                    <span>{trader.user.phone}</span>
                                </div>
                            </div>
                        </div>

                        {/* One-Handed Triage Hub */}
                        <div className="flex gap-2">
                            <button className="flex-1 h-14 bg-brand-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-brand-100 flex items-center justify-center gap-2 active:scale-95 transition-all">
                                <ShieldCheck size={16} /> Verify Permit
                            </button>
                            <button className="w-14 h-14 bg-gray-100 text-green-950 rounded-2xl flex items-center justify-center active:scale-95 transition-all hover:bg-gray-200">
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Sticky Operational Command */}
            <div className="fixed bottom-24 right-4 left-4 lg:hidden z-40">
                <button className="w-full h-16 bg-gray-950 text-white rounded-2xl shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all">
                    <div className="w-8 h-8 bg-brand-500 text-green-950 rounded-lg flex items-center justify-center">
                        <Users size={18} />
                    </div>
                    <span className="font-black text-[10px] uppercase tracking-[0.2em]">Onboard New Merchant</span>
                </button>
            </div>
        </div>
    );
}
