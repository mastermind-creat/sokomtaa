'use client';

import React, { useState, useMemo } from 'react';
import { Store, MessageCircle, ArrowRight, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Stall {
    id: number;
    stall_number: string;
    zone: 'A' | 'B' | 'C';
    sub_zone?: 'BL' | 'BR';
    block?: string;
    status: 'occupied' | 'available' | 'maintenance';
    rent?: number;
    trader?: {
        business_name: string;
        is_open: boolean;
        category?: string;
        average_rating?: number;
    };
}

interface MarketSchematicMapProps {
    stalls?: Stall[];
    onStallClick?: (stall: Stall) => void;
    className?: string;
}

// ─── Colour Helpers ───────────────────────────────────────────────────────────

const getStatusColor = (stall: Stall) => {
    if (stall.status === 'maintenance') return 'bg-amber-400';
    if (stall.status === 'available') return 'bg-[#7C3AED]'; // Vacant Purple
    if (stall.trader) {
        return stall.trader.is_open ? 'bg-success' : 'bg-amber-500';
    }
    return 'bg-[#7C3AED]'; 
};

// ─── Demo Fallback ────────────────────────────────────────────────────────────

function buildDemoStalls(): Stall[] {
    const stalls: Stall[] = [];
    for (let i = 0; i < 6; i++) {
        stalls.push({ id: i, stall_number: `A${i + 1}`, zone: 'A', status: 'occupied', trader: { business_name: 'Joy Fruits', is_open: true, category: 'Groceries' }, rent: 2500 });
    }
    for (let i = 0; i < 6; i++) {
        stalls.push({ id: 100+i, stall_number: `BL${i + 1}`, zone: 'B', sub_zone: 'BL', status: 'occupied', trader: { business_name: 'Hardware Pro', is_open: i !== 1 && i !== 2, category: 'Hardware' }, rent: 3000 });
        stalls.push({ id: 200+i, stall_number: `BR${i + 1}`, zone: 'B', sub_zone: 'BR', status: 'occupied', trader: { business_name: 'Mama Ngina', is_open: i !== 2, category: 'Electronics' }, rent: 3000 });
    }
    for (let i = 0; i < 6; i++) {
        stalls.push({ id: 300+i, stall_number: `C${i + 1}`, zone: 'C', status: i === 4 ? 'available' : 'occupied', trader: i === 4 ? undefined : { business_name: 'Boutique X', is_open: i !== 2, category: 'Fashion' }, rent: 2500 });
    }
    return stalls;
}

// ─── Legend ───────────────────────────────────────────────────────────

const LEGEND = [
    { color: 'bg-success', label: 'Open' },
    { color: 'bg-amber-500', label: 'Closed' },
    { color: 'bg-[#7C3AED]', label: 'Vacant' },
    { color: 'bg-amber-400', label: 'Maintenance' },
];

export default function MarketSchematicMap({ stalls = [], onStallClick, className }: MarketSchematicMapProps) {
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const data = stalls.length > 0 ? stalls : buildDemoStalls();

    const zones = useMemo(() => {
        return {
            A: data.filter(s => s.zone === 'A'),
            BL: data.filter(s => s.sub_zone === 'BL'),
            BR: data.filter(s => s.sub_zone === 'BR'),
            C: data.filter(s => s.zone === 'C'),
        };
    }, [data]);

    const selectedStall = data.find(s => s.id === selectedId);

    const handleStallClick = (s: Stall) => {
        setSelectedId(s.id === selectedId ? null : s.id);
        onStallClick?.(s);
    };

    return (
        <div className={cn("w-full flex flex-col", className)}>
            
            {/* The Grid Header (Block Labels) */}
            <div className="grid grid-cols-[1fr_1fr_2px_1fr_1fr] gap-4 px-8 mb-4 text-center">
                <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">A</span>
                <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">BL</span>
                <div /> {/* Divider Gap */}
                <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">BR</span>
                <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">C</span>
            </div>

            {/* The Grid Container */}
            <div className="px-8 grid grid-cols-[1fr_1fr_2px_1fr_1fr] gap-y-2 gap-x-4 items-center">
                {Array.from({ length: 6 }).map((_, rowIndex) => (
                    <React.Fragment key={rowIndex}>
                        <MapStall stall={zones.A[rowIndex]} selected={selectedId === zones.A[rowIndex]?.id} onClick={handleStallClick} />
                        <MapStall stall={zones.BL[rowIndex]} selected={selectedId === zones.BL[rowIndex]?.id} onClick={handleStallClick} />
                        <div className="w-[2px] h-full bg-neutral-100 self-stretch" />
                        <MapStall stall={zones.BR[rowIndex]} selected={selectedId === zones.BR[rowIndex]?.id} onClick={handleStallClick} />
                        <MapStall stall={zones.C[rowIndex]} selected={selectedId === zones.C[rowIndex]?.id} onClick={handleStallClick} />
                    </React.Fragment>
                ))}
            </div>

            {/* Compact Legend */}
            <div className="mt-10 flex justify-center gap-4 px-6 py-4 border-t border-neutral-100">
                {LEGEND.map((l) => (
                    <div key={l.label} className="flex items-center gap-2">
                        <div className={cn("w-2 h-2 rounded-full", l.color)} />
                        <span className="text-[10px] font-bold text-text-secondary">{l.label}</span>
                    </div>
                ))}
            </div>

            {/* Tap-to-Detail Panel */}
            <AnimatePresence>
                {selectedStall && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="p-6 bg-gray-50 border-t border-neutral-100">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg", getStatusColor(selectedStall))}>
                                        <Store size={24} />
                                    </div>
                                    <div>
                                        <h4 className="text-base font-black text-green-950 uppercase tracking-tight">
                                            {selectedStall.trader?.business_name || 'Vacant Stall'}
                                        </h4>
                                        <p className="text-[10px] font-black text-brand-600 uppercase tracking-widest">
                                            {selectedStall.trader?.category || 'Ready for Allocation'} • Stall {selectedStall.stall_number}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-0.5">Rent</p>
                                    <p className="text-sm font-black text-green-950">KES {selectedStall.rent?.toLocaleString() || '0'}</p>
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                {selectedStall.trader ? (
                                    <button className="flex-1 h-12 bg-green-950 text-white rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xl shadow-green-950/20">
                                        <MessageCircle size={16} /> Message
                                    </button>
                                ) : (
                                    <button className="flex-1 h-12 bg-brand-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xl shadow-brand-900/20">
                                        <Zap size={16} /> Allocate
                                    </button>
                                )}
                                <button className="h-12 px-5 bg-white border border-neutral-200 text-text-secondary rounded-xl active:scale-95 transition-all">
                                    <ArrowRight size={18} />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function MapStall({ stall, selected, onClick }: { stall?: Stall, selected: boolean, onClick: (s: Stall) => void }) {
    if (!stall) return <div className="h-12" />; // Empty placeholder
    
    return (
        <button
            onClick={() => onClick(stall)}
            className={cn(
                "h-12 rounded-lg flex flex-col items-center justify-center transition-all relative active:scale-90",
                getStatusColor(stall),
                selected ? "ring-4 ring-brand-500 ring-offset-2 scale-105 z-10" : "shadow-sm border border-black/5"
            )}
        >
            <span className="text-[8px] font-black text-white px-1 leading-none uppercase">
                {stall.stall_number}
            </span>
        </button>
    );
}
