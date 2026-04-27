'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useUIStore } from '@/store/uiStore';
import { 
    AlertCircle, 
    MessageCircle, 
    CheckCircle2, 
    Clock, 
    Filter, 
    Search, 
    ChevronRight,
    Gavel,
    ShieldAlert,
    MoreHorizontal,
    Store,
    UserCheck,
    ArrowRightCircle,
    Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '@/hooks/useTranslation';

export default function AdminComplaintsPage() {
    const { setPageTitle } = useUIStore();
    const { t } = useTranslation();

    React.useEffect(() => {
        setPageTitle('Crisis Intelligence (Malalamiko)');
    }, [setPageTitle]);

    const { data: complaintsRaw, isLoading } = useQuery({
        queryKey: ['admin-complaints'],
        queryFn: () => api.get('/admin/complaints').catch(() => ({ data: [] })),
    });

    const complaints = (complaintsRaw as any)?.data || [
        { id: 1, category: 'Payment Dispute', subject: 'Double Charging on M-Pesa', status: 'open', priority: 'high', trader: { business_name: 'Mama Mboga' }, created_at: '2025-04-20 10:30' },
        { id: 2, category: 'Sanitation', subject: 'Water leakage in Block B', status: 'in_review', priority: 'medium', market: { name: 'Gikomba Sector A' }, created_at: '2025-04-21 08:15' },
    ];

    const vitalityStats = [
        { label: 'Unresolved', value: '14', color: 'text-rose-600', bg: 'bg-rose-50' },
        { label: 'Efficiency', value: '92%', color: 'text-brand-600', bg: 'bg-brand-50' },
        { label: 'Sentiment', value: 'Critical', color: 'text-amber-600', bg: 'bg-amber-50' },
    ];

    return (
        <div className="pb-40 -mx-4 md:-mx-0 font-sans">
            {/* ── Sentiment Vitality Matrix ── */}
            <div className="grid grid-cols-3 gap-2 px-4 mb-8">
                {vitalityStats.map((s, i) => (
                    <div key={i} className="bg-white p-4 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col items-center text-center">
                        <div className={`w-2 h-2 rounded-full mb-2 animate-pulse ${s.color.replace('text', 'bg')}`} />
                        <span className={`text-[8px] font-black uppercase tracking-widest mb-1 ${s.color}`}>{s.label}</span>
                        <div className="text-xs font-black text-green-950 tracking-tight leading-none uppercase">
                            {s.value}
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Active Incident Ledger ── */}
            <div className="px-4">
                <div className="flex items-center justify-between mb-6 px-2">
                    <h3 className="text-xs font-black text-green-950 uppercase tracking-[0.15em]">High Intensity Incidents</h3>
                    <button className="text-[10px] font-black text-brand-600 uppercase tracking-widest flex items-center gap-1.5">
                        Historical Archives <ChevronRight size={14} />
                    </button>
                </div>

                {isLoading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-48 bg-gray-50 rounded-[2.5rem] animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <AnimatePresence>
                        {complaints.map((complaint: any) => (
                            <motion.div
                                key={complaint.id}
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-white rounded-[2.5rem] border border-gray-50 shadow-sm overflow-hidden mb-4"
                            >
                                <div className="p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner ${
                                                complaint.priority === 'high' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'
                                            }`}>
                                                <ShieldAlert size={28} />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest border ${
                                                        complaint.priority === 'high' ? 'bg-rose-50 text-rose-700 border-rose-100' : 'bg-amber-50 text-amber-700 border-amber-100'
                                                    }`}>
                                                        {complaint.priority} priority
                                                    </span>
                                                    <span className="text-[8px] font-black text-text-muted uppercase tracking-widest">
                                                        {complaint.category}
                                                    </span>
                                                </div>
                                                <h4 className="text-base font-black text-green-950 uppercase tracking-tight truncate max-w-[180px]">
                                                    {complaint.subject}
                                                </h4>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Incident Detail Grid */}
                                    <div className="grid grid-cols-2 gap-3 mb-6">
                                        <div className="bg-gray-50 rounded-2xl p-3 flex items-center gap-3">
                                            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-text-muted shadow-sm">
                                                <Clock size={16} />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[8px] font-black text-text-muted uppercase tracking-widest leading-none mb-1">Wait Time</span>
                                                <span className="text-[10px] font-black text-green-950 uppercase">4h 12m</span>
                                            </div>
                                        </div>
                                        
                                        {complaint.trader && (
                                            <div className="bg-orange-50/50 rounded-2xl p-3 border border-orange-50 flex items-center gap-3">
                                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-orange-600 shadow-sm">
                                                    <Store size={18} />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[8px] font-black text-text-muted uppercase tracking-widest leading-none mb-1">Subject Entity</span>
                                                    <span className="text-[10px] font-black text-green-950 truncate max-w-[80px]">
                                                        {complaint.trader.business_name}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Resolution Countdown Bar */}
                                    <div className="space-y-1.5 mt-6">
                                        <div className="flex justify-between text-[8px] font-black text-text-muted uppercase tracking-widest">
                                            <span>Resolution Velocity</span>
                                            <span className="text-rose-600">SLA Triggered (82%)</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden border border-gray-50">
                                            <div className="h-full w-[82%] bg-rose-500 rounded-full shadow-lg shadow-rose-500/20" />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex bg-white h-14 border-t border-gray-50">
                                    <button className="flex-1 flex items-center justify-center gap-3 bg-rose-950 text-white font-black text-[10px] uppercase tracking-widest active:bg-black transition-all">
                                        <Gavel size={16} className="text-brand-400" /> Mediate Incident
                                    </button>
                                    <button className="w-14 border-l border-gray-100 flex items-center justify-center text-text-muted hover:text-green-950 active:bg-gray-50 transition-all">
                                        <MoreHorizontal size={20} />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                )}
            </div>

            {/* ── Sticky Crisis Command Strip ── */}
            <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-xl border-t border-gray-100 flex gap-3 z-50">
                <button className="flex-1 h-14 bg-gray-950 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-all shadow-2xl shadow-gray-950/20">
                    Dispatch Enforcement Team <ArrowRightCircle size={18} className="text-rose-400" />
                </button>
                <button className="h-14 w-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center active:scale-95 transition-all shadow-lg shadow-rose-500/10">
                    <UserCheck size={24} />
                </button>
            </div>
        </div>
    );
}
