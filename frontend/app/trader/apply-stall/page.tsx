'use client';

import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MapPin, FileText, CheckCircle2, Clock,
    ArrowLeft, ArrowRight, Building2, LayoutGrid
} from 'lucide-react';
import api from '@/lib/api';
import { ApiResponse } from '@/types';

import { useUIStore } from '@/store/uiStore';
import { useTranslation } from '@/hooks/useTranslation';

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

// ─── Step Indicator ───────────────────────────────────────────────────────────

function StepIndicator({ step, total }: { step: number; total: number }) {
    return (
        <div className="flex items-center gap-2">
            {Array.from({ length: total }).map((_, i) => (
                <React.Fragment key={i}>
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full font-black text-sm transition-all ${
                        i < step ? 'bg-primary text-white' :
                        i === step ? 'bg-primary/10 text-primary border-2 border-primary' :
                        'bg-gray-100 text-text-muted'
                    }`}>
                        {i < step ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                    </div>
                    {i < total - 1 && (
                        <div className={`flex-1 h-0.5 transition-all ${i < step ? 'bg-primary' : 'bg-gray-200'}`} />
                    )}
                </React.Fragment>
            ))}
        </div>
    );
}

// ─── Pending Status Card ───────────────────────────────────────────────────────

function PendingApplicationCard({ application }: { application: StallApplication }) {
    const STATUS = {
        pending:    { label: 'Under Review',  color: 'text-amber-700',  bg: 'bg-amber-50',  icon: <Clock className="w-5 h-5" /> },
        approved:   { label: 'Approved! 🎉',  color: 'text-green-700',  bg: 'bg-green-50',  icon: <CheckCircle2 className="w-5 h-5" /> },
        waitlisted: { label: 'Waitlisted',    color: 'text-blue-700',   bg: 'bg-blue-50',   icon: <Clock className="w-5 h-5" /> },
        rejected:   { label: 'Not Approved',  color: 'text-red-700',    bg: 'bg-red-50',    icon: <Clock className="w-5 h-5" /> },
    };
    const s = STATUS[application.status];

    return (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className={`${s.bg} px-6 py-5 flex items-center justify-between`}>
                <div className={`flex items-center gap-3 ${s.color}`}>
                    {s.icon}
                    <div>
                        <p className="font-black text-lg">{s.label}</p>
                        <p className="text-sm font-medium opacity-80">
                            Applied {new Date(application.created_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                    </div>
                </div>
                <span className="font-mono text-xs opacity-60">#{application.id.toString().padStart(5, '0')}</span>
            </div>
            <div className="px-6 py-4 space-y-3">
                <div>
                    <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Preferred Zone</p>
                    <p className="font-semibold text-text-primary">Zone {application.preferred_zone ?? 'Any'}</p>
                </div>
                <div>
                    <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Motivation</p>
                    <p className="text-sm text-text-primary leading-relaxed">{application.motivation}</p>
                </div>
                {application.admin_notes && (
                    <div className="bg-primary/5 rounded-xl p-3">
                        <p className="text-xs font-bold text-primary mb-1">Admin Notes</p>
                        <p className="text-sm text-text-primary">{application.admin_notes}</p>
                    </div>
                )}
                {application.reviewed_at && (
                    <p className="text-xs text-text-muted">
                        Reviewed on {new Date(application.reviewed_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                )}
            </div>
        </div>
    );
}

// ─── Zone Card ────────────────────────────────────────────────────────────────

const ZONES = [
    { key: 'A', label: 'Zone A — Left Wall', desc: 'Stalls along the left wall, facing the centre aisle. Good for visibility.' },
    { key: 'B', label: 'Zone B — Centre',    desc: 'Double-row centre stalls. High foot traffic from both aisles.' },
    { key: 'C', label: 'Zone C — Right Wall', desc: 'Stalls along the right wall. Near the main entrance.' },
];

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TraderApplyStallPage() {
    const [step, setStep] = useState(0);
    const [selectedZone, setSelectedZone] = useState<string | null>(null);
    const [selectedStall, setSelectedStall] = useState<number | null>(null);
    const [motivation, setMotivation] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const { setPageTitle } = useUIStore();

    React.useEffect(() => {
        setPageTitle('Apply for a Stall');
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

    // Available stalls in selected zone
    const { data: availableStalls = [] } = useQuery({
        queryKey: ['available-stalls', selectedZone],
        queryFn: async () => {
            const res = await api.get<never, ApiResponse<Stall[]>>(`/trader/stalls/available?zone=${selectedZone}`);
            return res.data as Stall[];
        },
        enabled: !!selectedZone && step === 1,
    });

    const { mutate: submitApplication, isPending } = useMutation({
        mutationFn: (data: object) => api.post('/trader/stall-application', data),
        onSuccess: () => setSubmitted(true),
    });

    if (checkingApp) {
        return (
            <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
                {[1, 2].map(i => <div key={i} className="h-32 bg-gray-100 rounded-2xl animate-pulse" />)}
            </div>
        );
    }

    // Already has an active/pending application
    if (existingApp && !['rejected'].includes(existingApp.status)) {
        return (
            <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
                <h1 className="text-2xl font-black text-text-primary tracking-tight">Stall Application</h1>
                <PendingApplicationCard application={existingApp} />
            </div>
        );
    }

    // Successfully submitted
    if (submitted) {
        return (
            <div className="max-w-2xl mx-auto px-4 py-6">
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    className="text-center py-16">
                    <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 className="w-10 h-10 text-primary" />
                    </div>
                    <h2 className="text-2xl font-black text-text-primary mb-2">Application Submitted!</h2>
                    <p className="text-text-secondary max-w-xs mx-auto">
                        Your stall application has been submitted. The market admin will review it and contact you.
                    </p>
                </motion.div>
            </div>
        );
    }

    const STEPS = ['Choose Zone', 'Pick Stall (optional)', 'Motivation'];

    return (
                <div className="pt-2">
                    <p className="text-sm text-text-secondary">Three quick steps to submit your stall application.</p>
                </div>

                <StepIndicator step={step} total={STEPS.length} />

                <AnimatePresence mode="wait">
                    {/* Step 0: Zone Selection */}
                    {step === 0 && (
                        <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                            className="space-y-3">
                            <h2 className="text-base font-black text-text-primary">Which zone do you prefer?</h2>
                            {ZONES.map(z => (
                                <button key={z.key} onClick={() => setSelectedZone(z.key)}
                                    className={`w-full text-left p-5 rounded-2xl border-2 transition-all ${
                                        selectedZone === z.key
                                            ? 'border-primary bg-primary/5'
                                            : 'border-gray-200 hover:border-gray-300 bg-white'
                                    }`}>
                                    <div className="flex items-start gap-4">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg shrink-0 ${
                                            selectedZone === z.key ? 'bg-primary text-white' : 'bg-gray-100 text-text-secondary'
                                        }`}>{z.key}</div>
                                        <div>
                                            <p className="font-bold text-text-primary mb-0.5">{z.label}</p>
                                            <p className="text-xs text-text-secondary">{z.desc}</p>
                                        </div>
                                    </div>
                                </button>
                            ))}
                            <button onClick={() => setSelectedZone(null)}>
                                <span className="text-sm text-text-secondary underline">No preference — any zone</span>
                            </button>
                        </motion.div>
                    )}

                    {/* Step 1: Specific Stall (optional) */}
                    {step === 1 && (
                        <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                            className="space-y-4">
                            <div>
                                <h2 className="text-base font-black text-text-primary">Choose a specific stall</h2>
                                <p className="text-sm text-text-secondary mt-1">Optional — or we'll assign the best available.</p>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                {availableStalls.length === 0 ? (
                                    <div className="col-span-3 text-center py-8 text-text-muted text-sm">
                                        No available stalls in Zone {selectedZone}. We'll assign one.
                                    </div>
                                ) : availableStalls.map(s => (
                                    <button key={s.id} onClick={() => setSelectedStall(selectedStall === s.id ? null : s.id)}
                                        className={`p-3 rounded-xl border-2 text-center transition-all ${
                                            selectedStall === s.id
                                                ? 'border-primary bg-primary/5'
                                                : 'border-gray-200 hover:border-gray-300 bg-white'
                                        }`}>
                                        <p className="font-black text-text-primary">{s.stall_number}</p>
                                        {s.size_sqm && <p className="text-[10px] text-text-muted">{s.size_sqm}m²</p>}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* Step 2: Motivation */}
                    {step === 2 && (
                        <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                            className="space-y-4">
                            <div>
                                <h2 className="text-base font-black text-text-primary">Why do you want this stall?</h2>
                                <p className="text-sm text-text-secondary mt-1">Tell us about yourself and your business. Minimum 100 characters.</p>
                            </div>
                            <textarea
                                value={motivation}
                                onChange={e => setMotivation(e.target.value)}
                                rows={8}
                                placeholder="Describe your business, what you sell, your experience as a trader, and why you'd be a good fit for this market..."
                                className="w-full px-4 py-4 bg-white border-2 border-gray-200 rounded-2xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary leading-relaxed"
                            />
                            <div className="flex justify-between text-xs text-text-muted">
                                <span>{motivation.length}/100 minimum</span>
                                {motivation.length >= 100 && <span className="text-green-600 font-bold">✓ Good to submit</span>}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Navigation */}
                <div className="flex gap-3 pt-2">
                    {step > 0 && (
                        <button onClick={() => setStep(s => s - 1)}
                            className="flex items-center gap-2 px-5 py-3.5 border border-gray-200 rounded-xl font-bold text-sm hover:bg-gray-50 transition-colors min-h-[48px]">
                            <ArrowLeft className="w-4 h-4" /> Back
                        </button>
                    )}

                    {step < STEPS.length - 1 ? (
                        <button onClick={() => setStep(s => s + 1)}
                            className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary-light transition-colors min-h-[48px]">
                            Next <ArrowRight className="w-4 h-4" />
                        </button>
                    ) : (
                        <motion.button
                            whileTap={{ scale: 0.98 }}
                            onClick={() => submitApplication({
                                preferred_zone: selectedZone,
                                preferred_stall_id: selectedStall,
                                motivation,
                            })}
                            disabled={isPending || motivation.length < 100}
                            className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-primary text-white rounded-xl font-black hover:bg-primary-light transition-colors disabled:opacity-50 min-h-[48px]"
                        >
                            <FileText className="w-4 h-4" />
                            {isPending ? 'Submitting...' : 'Submit Application'}
                        </motion.button>
                    )}
                </div>
            </div>
        </div>
    );
}
