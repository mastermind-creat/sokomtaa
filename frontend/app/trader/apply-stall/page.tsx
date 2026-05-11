'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MapPin, FileText, CheckCircle2, Clock,
    ArrowLeft, ArrowRight, Building2, LayoutGrid,
    AlertTriangle, ChevronRight, Store, Users,
    Landmark, Navigation, Info, Loader2, Trash2
} from 'lucide-react';
import api from '@/lib/api';
import { ApiResponse } from '@/types';
import { useUIStore } from '@/store/uiStore';
import { cn } from '@/lib/utils';
import MarketSchematicMap from '@/components/map/MarketSchematicMap';

interface StallApplication {
    id: number;
    status: 'pending' | 'approved' | 'rejected' | 'waitlisted';
    preferred_zone: string | null;
    motivation: string;
    admin_notes: string | null;
    created_at: string;
    reviewed_at: string | null;
}

type StallType = 'managed' | 'independent';

const ZONES = [
    { key: 'A', label: 'Zone A', desc: 'Left Wall — High visibility aisle stalls.', icon: LayoutGrid },
    { key: 'B', label: 'Zone B', desc: 'Centre — Peak foot traffic corridors.', icon: Users },
    { key: 'C', label: 'Zone C', desc: 'Right Wall — Strategic entrance access.', icon: Store },
];

const STATUS_MAP = {
    pending:   { label: 'Under Review',      color: 'text-amber-600',  bg: 'bg-amber-50',  border: 'border-amber-200',  icon: Clock },
    approved:  { label: 'Approved',          color: 'text-brand-600',  bg: 'bg-brand-50',  border: 'border-brand-200',  icon: CheckCircle2 },
    waitlisted:{ label: 'Waitlisted',        color: 'text-blue-600',   bg: 'bg-blue-50',   border: 'border-blue-200',   icon: Clock },
    rejected:  { label: 'Not Approved',      color: 'text-rose-600',   bg: 'bg-rose-50',   border: 'border-rose-200',   icon: AlertTriangle },
};

function extractError(err: unknown): string {
    const e = err as { message?: string; errors?: Record<string, string[]> };
    if (e?.errors) {
        const first = Object.values(e.errors)[0];
        if (first?.length) return first[0];
    }
    return e?.message || 'Something went wrong.';
}

export default function TraderApplyStallPage() {
    const [step, setStep] = useState(0);
    const [stallType, setStallType] = useState<StallType | null>(null);
    const [selectedZone, setSelectedZone] = useState<string | null>(null);
    const [selectedStall, setSelectedStall] = useState<{ id: number; stall_number: string; zone: string } | null>(null);
    const [motivation, setMotivation] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const { setPageTitle } = useUIStore();
    const queryClient = useQueryClient();

    React.useEffect(() => { setPageTitle('Stall Application'); }, [setPageTitle]);

    const { data: existingApp, isLoading } = useQuery({
        queryKey: ['stall-application'],
        queryFn: async () => {
            try {
                const res = await api.get<never, ApiResponse<StallApplication>>('/trader/stall-application');
                return res.data;
            } catch { return null; }
        },
    });

    const { mutate: submitApplication, isPending } = useMutation({
        mutationFn: (data: object) => api.post('/trader/stall-application', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['stall-application'] });
            queryClient.invalidateQueries({ queryKey: ['stall-application-sidebar'] });
            setSubmitted(true);
        },
        onError: (err: unknown) => setFormError(extractError(err)),
    });

    const { mutate: withdrawApplication, isPending: isWithdrawing } = useMutation({
        mutationFn: () => api.delete('/trader/stall-application'),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['stall-application'] });
            queryClient.invalidateQueries({ queryKey: ['stall-application-sidebar'] });
        },
        onError: (err: unknown) => setFormError(extractError(err)),
    });

    // TOTAL STEPS: 0=type, 1=zone(managed only), 2=motivation
    const totalSteps = stallType === 'managed' ? 3 : 2;
    const motivationStep = stallType === 'managed' ? 2 : 1;

    const canNext = () => {
        if (step === 0) return stallType !== null;
        if (step === 1 && stallType === 'managed') return selectedZone !== null;
        return motivation.length >= 50;
    };

    const handleNext = () => {
        if (step < totalSteps - 1) { setStep(s => s + 1); return; }
        setFormError(null);
        submitApplication({
            stall_type: stallType,
            preferred_zone: stallType === 'managed' ? selectedZone : null,
            preferred_stall_id: stallType === 'managed' ? selectedStall?.id ?? null : null,
            motivation,
        });
    };

    if (isLoading) return (
        <div className="pb-20 space-y-4">
            {[1,2,3].map(i => <div key={i} className="h-40 bg-gray-50 rounded-[2.5rem] animate-pulse" />)}
        </div>
    );

    // Show status card if active application exists
    if (existingApp && !['rejected'].includes(existingApp.status)) {
        return <StatusCard application={existingApp} onWithdraw={() => withdrawApplication()} isWithdrawing={isWithdrawing} error={formError} />;
    }

    if (submitted) return (
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
            <div className="w-24 h-24 bg-brand-50 rounded-[2.5rem] flex items-center justify-center text-brand-600 mb-8 shadow-xl shadow-brand-500/10">
                <CheckCircle2 size={48} />
            </div>
            <h2 className="text-2xl font-black text-green-950 mb-3">Application Submitted!</h2>
            <p className="text-sm font-medium text-gray-500 leading-relaxed mb-10 max-w-xs">
                Your {stallType === 'managed' ? 'managed stall' : 'independent trader'} application is being reviewed. You will be notified via SMS once processed.
            </p>
            <button onClick={() => window.location.href = '/trader/dashboard'}
                className="w-full h-14 bg-green-950 text-white rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all shadow-xl">
                Back to Dashboard
            </button>
        </div>
    );

    return (
        <div className="pb-36 font-sans">
            {/* Progress bar */}
            <div className="px-4 mb-8">
                <div className="flex gap-1.5 h-1.5 w-full mb-3">
                    {Array.from({ length: totalSteps }).map((_, i) => (
                        <div key={i} className={cn('h-full flex-1 rounded-full transition-all duration-500', step >= i ? 'bg-brand-600' : 'bg-gray-100')} />
                    ))}
                </div>
                <div className="flex justify-between">
                    <span className="text-[10px] font-black text-brand-600 uppercase tracking-widest">Step {step + 1} of {totalSteps}</span>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{stallType ? (stallType === 'managed' ? 'Market Stall' : 'Independent') : 'Application'}</span>
                </div>
            </div>

            {formError && (
                <div className="mx-4 mb-6 flex items-start gap-3 bg-rose-50 border border-rose-200 rounded-2xl px-5 py-4">
                    <AlertTriangle size={16} className="text-rose-500 shrink-0 mt-0.5" />
                    <p className="text-rose-700 text-sm font-bold">{formError}</p>
                </div>
            )}

            <AnimatePresence mode="wait">
                {/* STEP 0 — Stall Type */}
                {step === 0 && (
                    <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="px-4 space-y-5">
                        <div className="mb-2">
                            <h2 className="text-xl font-black text-green-950 tracking-tight leading-tight mb-1">Choose Application Type</h2>
                            <p className="text-xs text-gray-500 font-medium">Select how you want to operate in the market.</p>
                        </div>

                        {/* Managed */}
                        <button onClick={() => setStallType('managed')}
                            className={cn('w-full p-6 rounded-[2rem] border-2 text-left transition-all active:scale-[0.98] group',
                                stallType === 'managed' ? 'border-brand-600 bg-green-950 shadow-2xl' : 'border-gray-100 bg-white')}>
                            <div className="flex items-start gap-5">
                                <div className={cn('w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg shrink-0',
                                    stallType === 'managed' ? 'bg-brand-500 text-white' : 'bg-brand-50 text-brand-600')}>
                                    <Landmark size={24} />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1.5">
                                        <h4 className={cn('text-sm font-black uppercase tracking-tight', stallType === 'managed' ? 'text-white' : 'text-green-950')}>
                                            Managed Stall
                                        </h4>
                                        {stallType === 'managed' && <CheckCircle2 size={20} className="text-brand-400" />}
                                    </div>
                                    <p className={cn('text-[11px] font-medium leading-relaxed', stallType === 'managed' ? 'text-green-300' : 'text-gray-500')}>
                                        Apply for a designated stall inside a county-managed market. Subject to county allocation and approval.
                                    </p>
                                    <div className="flex gap-2 mt-3 flex-wrap">
                                        {['Zone Selection', 'Stall Map', 'County Approval'].map(tag => (
                                            <span key={tag} className={cn('text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider',
                                                stallType === 'managed' ? 'bg-white/10 text-brand-300' : 'bg-brand-50 text-brand-700')}>
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </button>

                        {/* Independent */}
                        <button onClick={() => setStallType('independent')}
                            className={cn('w-full p-6 rounded-[2rem] border-2 text-left transition-all active:scale-[0.98]',
                                stallType === 'independent' ? 'border-amber-500 bg-amber-950 shadow-2xl' : 'border-gray-100 bg-white')}>
                            <div className="flex items-start gap-5">
                                <div className={cn('w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg shrink-0',
                                    stallType === 'independent' ? 'bg-amber-500 text-white' : 'bg-amber-50 text-amber-600')}>
                                    <Navigation size={24} />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1.5">
                                        <h4 className={cn('text-sm font-black uppercase tracking-tight', stallType === 'independent' ? 'text-white' : 'text-green-950')}>
                                            Independent Trader
                                        </h4>
                                        {stallType === 'independent' && <CheckCircle2 size={20} className="text-amber-400" />}
                                    </div>
                                    <p className={cn('text-[11px] font-medium leading-relaxed', stallType === 'independent' ? 'text-amber-200' : 'text-gray-500')}>
                                        Operate as a self-managed trader within the market area. No fixed stall required — location is GPS-based.
                                    </p>
                                    <div className="flex gap-2 mt-3 flex-wrap">
                                        {['GPS Location', 'Flexible', 'Faster Approval'].map(tag => (
                                            <span key={tag} className={cn('text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider',
                                                stallType === 'independent' ? 'bg-white/10 text-amber-300' : 'bg-amber-50 text-amber-700')}>
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </button>

                        {/* Info note */}
                        <div className="flex items-start gap-3 bg-gray-50 rounded-2xl p-4 border border-gray-100">
                            <Info size={15} className="text-gray-400 shrink-0 mt-0.5" />
                            <p className="text-[11px] font-medium text-gray-500 leading-relaxed">
                                You can only have one active application at a time. Managed stalls are allocated by county officials after review.
                            </p>
                        </div>
                    </motion.div>
                )}

                {/* STEP 1 (managed) — Zone + Map */}
                {step === 1 && stallType === 'managed' && (
                    <motion.div key="step1m" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="px-4 space-y-5">
                        <div className="mb-2">
                            <h2 className="text-xl font-black text-green-950 tracking-tight leading-tight mb-1">Choose Preferred Zone</h2>
                            <p className="text-xs text-gray-500 font-medium">Select a zone — then optionally pick a specific stall from the map.</p>
                        </div>

                        <div className="space-y-3">
                            {ZONES.map((z) => (
                                <button key={z.key} onClick={() => setSelectedZone(z.key)}
                                    className={cn('w-full p-4 rounded-2xl border-2 text-left flex items-center gap-4 transition-all active:scale-[0.98]',
                                        selectedZone === z.key ? 'border-brand-600 bg-brand-600' : 'border-gray-100 bg-white')}>
                                    <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center',
                                        selectedZone === z.key ? 'bg-white/20 text-white' : 'bg-brand-50 text-brand-600')}>
                                        <z.icon size={18} />
                                    </div>
                                    <div className="flex-1">
                                        <p className={cn('text-xs font-black uppercase tracking-tight', selectedZone === z.key ? 'text-white' : 'text-green-950')}>{z.label}</p>
                                        <p className={cn('text-[10px] font-medium mt-0.5', selectedZone === z.key ? 'text-brand-200' : 'text-gray-400')}>{z.desc}</p>
                                    </div>
                                    {selectedZone === z.key && <CheckCircle2 size={18} className="text-white shrink-0" />}
                                </button>
                            ))}
                        </div>

                        {selectedZone && (
                            <div className="bg-white rounded-[2rem] border border-gray-100 p-4 shadow-sm overflow-hidden">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Optional: Pick a specific stall</p>
                                <div className="min-h-[320px]">
                                    <MarketSchematicMap onStallClick={(s: { id: number; stall_number: string; zone: string }) => setSelectedStall(s)} className="scale-90 origin-top" />
                                </div>
                                {selectedStall && (
                                    <div className="mt-3 flex items-center gap-2 bg-brand-50 px-4 py-2 rounded-xl">
                                        <MapPin size={14} className="text-brand-600" />
                                        <span className="text-xs font-black text-brand-700">Stall {selectedStall.stall_number} (Zone {selectedStall.zone}) selected</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </motion.div>
                )}

                {/* STEP 1 (independent) OR STEP 2 (managed) — Motivation */}
                {step === motivationStep && (
                    <motion.div key="stepMotive" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="px-4 space-y-5">
                        <div className="mb-2">
                            <h2 className="text-xl font-black text-green-950 tracking-tight leading-tight mb-1">Business Motivation</h2>
                            <p className="text-xs text-gray-500 font-medium">Tell the county administration why you should be allocated a space.</p>
                        </div>

                        <div className="bg-white rounded-[2.5rem] border border-gray-100 p-6 shadow-sm">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block">Your Statement (min. 50 characters)</label>
                            <textarea
                                value={motivation}
                                onChange={(e) => { setFormError(null); setMotivation(e.target.value); }}
                                placeholder="Describe your business, the products you sell, and the positive impact you bring to this community market..."
                                className="w-full min-h-[180px] bg-gray-50 border border-transparent rounded-2xl p-4 text-sm font-medium text-green-950 outline-none focus:bg-white focus:border-brand-300 focus:ring-4 focus:ring-brand-50 transition-all resize-none"
                            />
                            <div className="flex items-center justify-between mt-3">
                                <span className={cn('text-[10px] font-black uppercase tracking-widest', motivation.length >= 50 ? 'text-brand-600' : 'text-gray-400')}>
                                    {motivation.length} / 50 min
                                </span>
                                {motivation.length >= 50 && (
                                    <span className="flex items-center gap-1 text-[10px] font-black text-brand-600 uppercase">
                                        <CheckCircle2 size={12} /> Ready to Submit
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="flex items-start gap-3 bg-rose-50 rounded-2xl p-4 border border-rose-100">
                            <AlertTriangle size={15} className="text-rose-500 shrink-0 mt-0.5" />
                            <p className="text-[11px] font-bold text-rose-700 leading-relaxed">
                                By submitting, you confirm that all details are accurate and that your business complies with county regulations.
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Sticky nav buttons */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-xl border-t border-gray-100 flex gap-3 z-50">
                {step > 0 && (
                    <button onClick={() => setStep(s => s - 1)}
                        className="h-14 w-14 bg-white border border-gray-200 rounded-2xl flex items-center justify-center active:scale-90 transition-all shadow-sm">
                        <ArrowLeft size={20} className="text-gray-500" />
                    </button>
                )}
                <button
                    disabled={!canNext() || isPending}
                    onClick={handleNext}
                    className={cn(
                        'flex-1 h-14 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-xl',
                        canNext() && !isPending ? 'bg-green-950 text-white shadow-green-950/20' : 'bg-gray-100 text-gray-400 shadow-none cursor-not-allowed'
                    )}>
                    {isPending ? (
                        <><Loader2 size={18} className="animate-spin" /> Submitting...</>
                    ) : step < totalSteps - 1 ? (
                        <>Continue <ArrowRight size={16} /></>
                    ) : (
                        <>Submit Application <ChevronRight size={16} /></>
                    )}
                </button>
            </div>
        </div>
    );
}

function StatusCard({ application, onWithdraw, isWithdrawing, error }: {
    application: StallApplication;
    onWithdraw: () => void;
    isWithdrawing: boolean;
    error: string | null;
}) {
    const s = STATUS_MAP[application.status] ?? STATUS_MAP.pending;
    const Icon = s.icon;

    return (
        <div className="pb-24 space-y-4">
            {error && (
                <div className="flex items-start gap-3 bg-rose-50 border border-rose-200 rounded-2xl px-5 py-4">
                    <AlertTriangle size={16} className="text-rose-500 shrink-0" />
                    <p className="text-rose-700 text-sm font-bold">{error}</p>
                </div>
            )}

            {/* Status Header */}
            <div className={cn('rounded-[2.5rem] border-2 p-8', s.bg, s.border)}>
                <div className="flex items-center gap-4 mb-5">
                    <div className={cn('w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg', s.color.replace('text-', 'bg-'), 'text-white')}>
                        <Icon size={26} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Application SMC-{application.id}</p>
                        <h3 className={cn('text-xl font-black tracking-tight', s.color)}>{s.label}</h3>
                    </div>
                </div>
                <div className="flex items-center gap-2 bg-white/60 rounded-xl px-4 py-2.5">
                    <Clock size={13} className="text-gray-400" />
                    <span className="text-[11px] font-bold text-gray-600">
                        Submitted {new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(application.created_at))}
                    </span>
                </div>
            </div>

            {/* Details */}
            <div className="bg-white rounded-[2.5rem] border border-gray-100 p-8 space-y-6">
                {application.preferred_zone && (
                    <div>
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Preferred Zone</label>
                        <p className="text-sm font-black text-green-950 uppercase">Zone {application.preferred_zone}</p>
                    </div>
                )}
                <div>
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Your Statement</label>
                    <p className="text-[12px] font-medium text-gray-600 leading-relaxed line-clamp-4">{application.motivation}</p>
                </div>
                {application.admin_notes && (
                    <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                        <label className="text-[9px] font-black text-green-950 uppercase tracking-widest mb-1.5 block">Admin Response</label>
                        <p className="text-xs font-medium text-gray-600 leading-relaxed">{application.admin_notes}</p>
                    </div>
                )}

                {/* Withdraw — only for pending */}
                {application.status === 'pending' && (
                    <button onClick={onWithdraw} disabled={isWithdrawing}
                        className="w-full h-12 flex items-center justify-center gap-2 rounded-2xl border-2 border-rose-200 text-rose-600 font-black text-xs uppercase tracking-widest active:scale-95 transition-all hover:bg-rose-50 disabled:opacity-50">
                        {isWithdrawing ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={15} />}
                        {isWithdrawing ? 'Withdrawing...' : 'Withdraw Application'}
                    </button>
                )}
            </div>

            {/* Next Steps */}
            {application.status === 'approved' && (
                <div className="bg-brand-600 rounded-[2.5rem] p-8 text-white">
                    <h4 className="font-black text-sm uppercase tracking-tight mb-2">🎉 Congratulations!</h4>
                    <p className="text-[12px] text-brand-100 leading-relaxed font-medium mb-4">
                        Your stall application has been approved. Visit the county market office with your permit to complete the allocation process.
                    </p>
                    <button onClick={() => window.location.href = '/trader/dashboard'}
                        className="w-full h-12 bg-white text-brand-700 rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all">
                        Go to Dashboard
                    </button>
                </div>
            )}
        </div>
    );
}
