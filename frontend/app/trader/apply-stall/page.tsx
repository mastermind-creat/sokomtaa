'use client';

import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MapPin, FileText, CheckCircle2, Clock,
    ArrowLeft, ArrowRight, Building2, LayoutGrid,
    Search, Info, Zap, AlertTriangle, ChevronRight,
    Store, Users, Activity
} from 'lucide-react';
import api from '@/lib/api';
import { ApiResponse } from '@/types';
import { useUIStore } from '@/store/uiStore';
import { useTranslation } from '@/hooks/useTranslation';
import { cn } from '@/lib/utils';
import MarketSchematicMap from '@/components/map/MarketSchematicMap';

// ─── Types ────────────────────────────────────────────────────────────────────

interface StallApplication {
    id: number;
    status: 'pending' | 'approved' | 'rejected' | 'waitlisted';
    preferred_zone: string | null;
    motivation: string;
    admin_notes: string | null;
    created_at: string;
    reviewed_at: string | null;
}

interface Stall {
    id: number;
    stall_number: string;
    zone: 'A' | 'B' | 'C';
    block: string;
    size_sqm: number | null;
    status: 'available' | 'occupied' | 'maintenance';
}

const ZONES = [
    { key: 'A', label: 'Zone A', desc: 'Left Wall — High visibility aisle stalls.', icon: <LayoutGrid size={20} /> },
    { key: 'B', label: 'Zone B', desc: 'Centre — Peak foot traffic corridors.', icon: <Users size={20} /> },
    { key: 'C', label: 'Zone C', desc: 'Right Wall — Strategic entrance access.', icon: <Store size={20} /> },
];

export default function TraderApplyStallPage() {
    const [step, setStep] = useState(0);
    const [selectedZone, setSelectedZone] = useState<string | null>(null);
    const [selectedStall, setSelectedStall] = useState<any>(null);
    const [motivation, setMotivation] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const { setPageTitle } = useUIStore();

    React.useEffect(() => {
        setPageTitle('Stall Acquisition');
    }, [setPageTitle]);

    // Check existing application
    const { data: existingApp, isLoading: checkingApp } = useQuery({
        queryKey: ['stall-application'],
        queryFn: async () => {
            try {
                const res = await api.get<never, ApiResponse<StallApplication>>('/trader/stall-application');
                return res.data;
            } catch {
                return null;
            }
        },
    });

    const { mutate: submitApplication, isPending } = useMutation({
        mutationFn: (data: object) => api.post('/trader/stall-application', data),
        onSuccess: () => setSubmitted(true),
    });

    if (checkingApp) {
        return (
            <div className="pb-20 -mx-4 md:-mx-0 px-4 space-y-4">
                {[1, 2, 3].map(i => <div key={i} className="h-44 bg-gray-50 rounded-[2.5rem] animate-pulse" />)}
            </div>
        );
    }

    if (existingApp && !['rejected'].includes(existingApp.status)) {
        return (
            <div className="pb-20 -mx-4 md:-mx-0 px-4">
                <StatusCard application={existingApp} />
            </div>
        );
    }

    if (submitted) {
        return (
            <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                <div className="w-24 h-24 bg-brand-50 rounded-[2.5rem] flex items-center justify-center text-brand-600 mb-8 shadow-xl shadow-brand-500/10">
                    <CheckCircle2 size={48} />
                </div>
                <h2 className="text-2xl font-black text-green-950 tracking-tight mb-4 uppercase">Identity Submitted</h2>
                <p className="text-sm font-medium text-text-secondary leading-relaxed mb-10 max-w-xs">
                    Your application is now being processed by the County Revenue Office. We'll notify you via SMS once approved.
                </p>
                <button 
                    onClick={() => window.location.href = '/trader/dashboard'}
                    className="w-full h-14 bg-gray-950 text-white rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all shadow-2xl shadow-gray-950/20"
                >
                    Back to Dashboard
                </button>
            </div>
        );
    }

    const stats = [
        { label: 'Available', value: '42', color: 'text-brand-600' },
        { label: 'Zone Traffic', value: 'High', color: 'text-orange-600' },
        { label: 'Wait Time', value: '24h', color: 'text-blue-600' },
    ];

    return (
        <div className="pb-32 -mx-4 md:-mx-0 font-sans">
            {/* ── Selection Vitality Matrix ── */}
            <div className="grid grid-cols-3 gap-2 px-4 mb-8">
                {stats.map((s, i) => (
                    <div key={i} className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center text-center">
                        <span className={cn("text-[8px] font-black uppercase tracking-widest mb-1", s.color)}>{s.label}</span>
                        <div className="text-xs font-black text-green-950 tracking-tight leading-none uppercase">
                            {s.value}
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Enrollment Progress ── */}
            <div className="px-6 mb-10">
                <div className="flex items-center gap-1.5 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                    {[0, 1, 2].map((i) => (
                        <div key={i} className={cn("h-full flex-1 transition-all duration-500", step >= i ? 'bg-brand-600' : 'bg-transparent')} />
                    ))}
                </div>
                <div className="flex justify-between mt-3">
                    <span className="text-[9px] font-black text-brand-600 uppercase tracking-widest">Enrollment Phase {step + 1}</span>
                    <span className="text-[9px] font-black text-text-muted uppercase tracking-widest italic">Confidential</span>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {step === 0 && (
                    <motion.div 
                        key="step0" 
                        initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
                        className="px-4 space-y-6"
                    >
                        <h2 className="text-lg font-black text-green-950 tracking-tight uppercase px-2 leading-tight">Identify Your <br/>Preferred Territory</h2>
                        
                        <div className="space-y-3">
                            {ZONES.map((z) => (
                                <button 
                                    key={z.key}
                                    onClick={() => setSelectedZone(z.key)}
                                    className={cn(
                                        "w-full p-6 rounded-[2rem] border transition-all text-left group active:scale-[0.98]",
                                        selectedZone === z.key ? 'bg-green-950 border-green-950 shadow-2xl' : 'bg-white border-gray-100'
                                    )}
                                >
                                    <div className="flex items-center gap-5">
                                        <div className={cn(
                                            "w-12 h-12 rounded-[1.2rem] flex items-center justify-center transition-all shadow-lg",
                                            selectedZone === z.key ? 'bg-brand-600 text-white' : 'bg-gray-50 text-brand-600'
                                        )}>
                                            {z.icon}
                                        </div>
                                        <div className="flex-1">
                                            <h4 className={cn("text-xs font-black uppercase tracking-tight mb-1", selectedZone === z.key ? 'text-white' : 'text-green-950')}>
                                                {z.label}
                                            </h4>
                                            <p className={cn("text-[10px] font-medium leading-relaxed", selectedZone === z.key ? 'text-green-300' : 'text-text-muted')}>
                                                {z.desc}
                                            </p>
                                        </div>
                                        {selectedZone === z.key && <CheckCircle2 size={24} className="text-brand-400" />}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}

                {step === 1 && (
                    <motion.div 
                        key="step1"
                        initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
                        className="px-4 space-y-6"
                    >
                        <h2 className="text-lg font-black text-green-950 tracking-tight uppercase px-2 leading-tight">Visual Spatial <br/>Acquisition</h2>
                        <div className="bg-white rounded-[2.5rem] border border-gray-100 p-6 shadow-sm overflow-hidden min-h-[400px]">
                            <MarketSchematicMap 
                                onStallClick={(s) => setSelectedStall(s)} 
                                className="scale-90 origin-top"
                            />
                        </div>
                        <div className="bg-brand-50/50 p-5 rounded-2xl border border-brand-100 flex items-start gap-3">
                            <Info size={16} className="text-brand-600 shrink-0 mt-0.5" />
                            <p className="text-[10px] font-bold text-brand-800 uppercase leading-relaxed tracking-wider">
                                {selectedStall ? `Selected: Stall ${selectedStall.stall_number} (${selectedStall.zone})` : 'Tap on the map to select a specific anchor point.'}
                            </p>
                        </div>
                    </motion.div>
                )}

                {step === 2 && (
                    <motion.div 
                        key="step2"
                        initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
                        className="px-4 space-y-6"
                    >
                        <h2 className="text-lg font-black text-green-950 tracking-tight uppercase px-2 leading-tight">Identity & <br/>Business Narrative</h2>
                        
                        <div className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 block">Merchant Motivation</label>
                            <textarea 
                                value={motivation}
                                onChange={(e) => setMotivation(e.target.value)}
                                placeholder="Describe your commercial intent and community impact..."
                                className="w-full min-h-[180px] bg-gray-50/50 border border-transparent rounded-2xl p-5 text-sm font-bold text-green-950 outline-none focus:bg-white focus:border-brand-300 focus:ring-4 focus:ring-brand-50 transition-all resize-none"
                            />
                            <div className="flex justify-between mt-4">
                                <span className={cn("text-[9px] font-black uppercase tracking-widest", motivation.length >= 100 ? 'text-brand-600' : 'text-slate-400')}>
                                    {motivation.length}/100 Required
                                </span>
                                {motivation.length >= 100 && <div className="flex items-center gap-1 text-brand-600 uppercase text-[9px] font-black"><CheckCircle2 size={12}/> Validated</div>}
                            </div>
                        </div>

                        <div className="bg-rose-50/50 p-5 rounded-3xl border border-rose-100 flex items-start gap-4">
                            <AlertTriangle size={20} className="text-rose-600 shrink-0" />
                            <p className="text-[9px] font-bold text-rose-800 uppercase leading-relaxed tracking-wider">
                                By submitting, you confirm that all commercial permits are active and reflect county-level compliance.
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Sticky Progressive Navigation ── */}
            <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-xl border-t border-gray-100 flex gap-3 z-50">
                {step > 0 && (
                    <button 
                        onClick={() => setStep(s => s - 1)}
                        className="h-14 w-20 bg-white border border-gray-100 rounded-2xl text-text-muted flex items-center justify-center active:scale-90 transition-all font-black text-[10px] uppercase tracking-widest"
                    >
                        <ArrowLeft size={20} />
                    </button>
                )}
                
                <button 
                    disabled={isPending || (step === 2 && motivation.length < 100) || (step === 0 && !selectedZone)}
                    onClick={() => {
                        if (step < 2) setStep(s => s + 1);
                        else submitApplication({
                            preferred_zone: selectedZone,
                            preferred_stall_id: selectedStall?.id,
                            motivation
                        });
                    }}
                    className={cn(
                        "flex-1 h-14 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-2xl",
                        isPending || (step === 2 && motivation.length < 100) || (step === 0 && !selectedZone)
                        ? "bg-gray-200 text-gray-400 shadow-none cursor-not-allowed"
                        : "bg-gray-950 text-white shadow-gray-950/20"
                    )}
                >
                    {step === 2 
                        ? (isPending ? 'Propagating...' : 'Finalize Enrollment') 
                        : (<span>Continue Phase <ArrowRight size={16} className="inline ml-2" /></span>)
                    }
                </button>
            </div>
        </div>
    );
}

function StatusCard({ application }: { application: StallApplication }) {
    const STATUS_MAP = {
        pending: { label: 'Triage Review', color: 'text-amber-600', bg: 'bg-amber-50', icon: Clock },
        approved: { label: 'Enrollment Finalized', color: 'text-brand-600', bg: 'bg-brand-50', icon: BadgeCheck },
        waitlisted: { label: 'Strategic Queue', color: 'text-blue-600', bg: 'bg-blue-50', icon: Users },
        rejected: { label: 'Policy Non-Compliance', color: 'text-rose-600', bg: 'bg-rose-50', icon: AlertTriangle },
    };

    const s = STATUS_MAP[application.status] || STATUS_MAP.pending;

    return (
        <div className="bg-white rounded-[2.5rem] border border-gray-50 shadow-sm overflow-hidden">
            <div className={cn("p-8", s.bg)}>
                <div className="flex items-center gap-5 mb-6">
                    <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg", s.color.replace('text-', 'bg-'))}>
                        <s.icon size={28} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-green-950 tracking-tight uppercase leading-none mb-1.5">{s.label}</h3>
                        <p className={cn("text-[10px] font-black uppercase tracking-widest", s.color)}>Application ID: SMC-{application.id}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 bg-white/50 p-4 rounded-xl backdrop-blur-md">
                    <Clock size={16} className="text-text-muted" />
                    <span className="text-[10px] font-bold text-green-950 uppercase tracking-widest italic">Submitted {new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short' }).format(new Date(application.created_at))}</span>
                </div>
            </div>
            <div className="p-8 space-y-6">
                <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Territory Preference</label>
                    <p className="text-sm font-black text-green-950 uppercase tracking-tight">Zone {application.preferred_zone || 'Optimized Allocation'}</p>
                </div>
                <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Narrative Integrity</label>
                    <p className="text-[11px] font-bold text-text-secondary leading-relaxed line-clamp-3">{application.motivation}</p>
                </div>
                {application.admin_notes && (
                    <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
                        <label className="text-[9px] font-black text-green-950 uppercase tracking-widest mb-2 block">County Directive</label>
                        <p className="text-xs font-bold text-text-secondary leading-relaxed">{application.admin_notes}</p>
                    </div>
                )}
                
                <button className="w-full h-14 bg-gray-950 text-white rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all shadow-xl shadow-gray-950/20 flex items-center justify-center gap-3">
                    Contact Registrar <ChevronRight size={18} />
                </button>
            </div>
        </div>
    );
}

function BadgeCheck({ size }: { size: number }) {
    return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/></svg>;
}
