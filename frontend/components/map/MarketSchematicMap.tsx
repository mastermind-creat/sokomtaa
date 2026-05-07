'use client';

import React, { useState, useMemo } from 'react';
import { 
    Store, 
    MessageCircle, 
    ArrowRight, 
    Zap, 
    Plus, 
    User, 
    Construction, 
    DoorOpen,
    Info
} from 'lucide-react';
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

// ─── Visual Helpers ──────────────────────────────────────────────────────────

const STALL_THEMES = {
    available: {
        bg: 'bg-blue-50',
        border: 'border-blue-100',
        text: 'text-blue-600',
        icon: DoorOpen,
        label: 'Available'
    },
    occupied: {
        bg: 'bg-white',
        border: 'border-gray-100',
        text: 'text-brand-600',
        icon: Store,
        label: 'Occupied'
    },
    maintenance: {
        bg: 'bg-rose-50',
        border: 'border-rose-100',
        text: 'text-rose-600',
        icon: Construction,
        label: 'Maintenance'
    }
};

const getStallTheme = (stall: Stall) => {
    return STALL_THEMES[stall.status] || STALL_THEMES.available;
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
        stalls.push({ id: 300+i, stall_number: `C${i + 1}`, zone: 'C', status: i === 4 ? 'available' : i === 2 ? 'maintenance' : 'occupied', trader: i === 4 || i === 2 ? undefined : { business_name: 'Boutique X', is_open: i !== 2, category: 'Fashion' }, rent: 2500 });
    }
    return stalls;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function MarketSchematicMap({ stalls = [], onStallClick, className }: MarketSchematicMapProps) {
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const data = stalls.length > 0 ? stalls : buildDemoStalls();

    // Group stalls by Block
    const blocks = useMemo(() => {
        const uniqueBlocks = [...new Set(data.map(s => s.block || 'A'))].sort();
        
        return uniqueBlocks.map(blockName => {
            const blockStalls = data.filter(s => (s.block || 'A') === blockName);
            
            // Split Zone B into BL and BR
            const zoneB = blockStalls.filter(s => s.zone === 'B');
            const bl = zoneB.filter((_, i) => i % 2 === 0);
            const br = zoneB.filter((_, i) => i % 2 !== 0);

            const zones = {
                A: blockStalls.filter(s => s.zone === 'A'),
                BL: bl,
                BR: br,
                C: blockStalls.filter(s => s.zone === 'C'),
            };

            const maxRows = Math.max(zones.A.length, zones.BL.length, zones.BR.length, zones.C.length, 1);

            return {
                name: blockName,
                zones,
                maxRows
            };
        });
    }, [data]);

    const selectedStall = data.find(s => s.id === selectedId);

    const handleStallClick = (s: Stall) => {
        setSelectedId(s.id === selectedId ? null : s.id);
        onStallClick?.(s);
    };

    return (
        <div className={cn("w-full flex flex-col gap-16", className)}>
            
            {blocks.map((block) => (
                <div key={block.name} className="flex flex-col">
                    {/* Block Header */}
                    <div className="flex items-center gap-6 mb-10 px-8">
                        <div className="h-[2px] flex-1 bg-gradient-to-r from-transparent via-neutral-100 to-neutral-200" />
                        <h3 className="text-[12px] font-black text-green-950 uppercase tracking-[0.4em] bg-white px-6 py-3 rounded-2xl border border-neutral-100 shadow-sm">
                            Building {block.name}
                        </h3>
                        <div className="h-[2px] flex-1 bg-gradient-to-l from-transparent via-neutral-100 to-neutral-200" />
                    </div>

                    {/* Zone Labels */}
                    <div className="grid grid-cols-[1fr_1fr_20px_1fr_1fr] gap-6 px-8 mb-6 text-center">
                        {['Left Wall', 'Mid Left', '', 'Mid Right', 'Right Wall'].map((label, i) => (
                            <span key={i} className="text-[9px] font-black text-text-muted uppercase tracking-widest opacity-60">
                                {label}
                            </span>
                        ))}
                    </div>

                    {/* The Grid Container */}
                    <div className="px-8 grid grid-cols-[1fr_1fr_20px_1fr_1fr] gap-y-4 gap-x-6 items-center">
                        {Array.from({ length: block.maxRows }).map((_, rowIndex) => (
                            <React.Fragment key={rowIndex}>
                                <MapStall stall={block.zones.A[rowIndex]} selected={selectedId === block.zones.A[rowIndex]?.id} onClick={handleStallClick} />
                                <MapStall stall={block.zones.BL[rowIndex]} selected={selectedId === block.zones.BL[rowIndex]?.id} onClick={handleStallClick} />
                                <div className="w-[1px] h-12 bg-neutral-100 self-center" />
                                <MapStall stall={block.zones.BR[rowIndex]} selected={selectedId === block.zones.BR[rowIndex]?.id} onClick={handleStallClick} />
                                <MapStall stall={block.zones.C[rowIndex]} selected={selectedId === block.zones.C[rowIndex]?.id} onClick={handleStallClick} />
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            ))}

            {/* Legend */}
            <div className="mt-12 flex justify-center gap-8 px-8 py-6 bg-gray-50/50 rounded-[2rem] border border-neutral-100 mx-8">
                {Object.values(STALL_THEMES).map((theme) => (
                    <div key={theme.label} className="flex items-center gap-3">
                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shadow-sm", theme.bg, theme.border, "border")}>
                            <theme.icon size={18} className={theme.text} />
                        </div>
                        <span className="text-[11px] font-black text-green-950 uppercase tracking-widest">{theme.label}</span>
                    </div>
                ))}
            </div>

            {/* Detail Panel */}
            <AnimatePresence>
                {selectedStall && (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="mx-8 mb-8 overflow-hidden rounded-[2.5rem] border border-brand-100 shadow-2xl shadow-brand-900/10 bg-white"
                    >
                        <div className="p-8">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                                <div className="flex items-center gap-5">
                                    <div className={cn(
                                        "w-20 h-20 rounded-[2rem] flex items-center justify-center text-white shadow-xl transition-all duration-500", 
                                        getStallTheme(selectedStall).bg,
                                        getStallTheme(selectedStall).border,
                                        "border-2"
                                    )}>
                                        {React.createElement(getStallTheme(selectedStall).icon, { 
                                            size: 36, 
                                            className: getStallTheme(selectedStall).text 
                                        })}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3 mb-2">
                                            <h4 className="text-2xl font-black text-green-950 uppercase tracking-tight leading-none">
                                                Stall {selectedStall.stall_number}
                                            </h4>
                                            <div className={cn(
                                                "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border",
                                                getStallTheme(selectedStall).bg,
                                                getStallTheme(selectedStall).text,
                                                getStallTheme(selectedStall).border
                                            )}>
                                                {selectedStall.status}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-[10px] font-black text-text-muted uppercase tracking-widest bg-gray-50 px-3 py-1 rounded-lg border border-gray-100">
                                                Block {selectedStall.block || 'A'}
                                            </span>
                                            <span className="text-[10px] font-black text-text-muted uppercase tracking-widest bg-gray-50 px-3 py-1 rounded-lg border border-gray-100">
                                                Zone {selectedStall.zone}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-brand-50/50 p-4 rounded-2xl border border-brand-100/50 text-center min-w-[140px]">
                                    <p className="text-[10px] font-black text-brand-600 uppercase tracking-widest mb-1">Monthly Levy</p>
                                    <p className="text-xl font-black text-green-950">KES {selectedStall.rent?.toLocaleString() || '0'}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="p-6 bg-gray-50/50 rounded-3xl border border-gray-100">
                                    <h5 className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <User size={14} /> Occupant Details
                                    </h5>
                                    {selectedStall.trader ? (
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center border border-gray-100 shadow-sm">
                                                <Store size={20} className="text-brand-600" />
                                            </div>
                                            <div>
                                                <h6 className="font-black text-green-950 text-sm uppercase">{selectedStall.trader.business_name}</h6>
                                                <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mt-0.5">
                                                    {selectedStall.trader.category || 'Verified Trader'}
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-3 text-text-muted italic">
                                            <Info size={16} />
                                            <p className="text-xs font-bold uppercase tracking-widest">Available for Allocation</p>
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-3">
                                    {selectedStall.status === 'available' ? (
                                        <button className="flex-1 bg-brand-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl shadow-brand-600/20">
                                            <Plus size={20} /> Start Allocation
                                        </button>
                                    ) : (
                                        <button className="flex-1 bg-green-950 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-all">
                                            <MessageCircle size={20} /> View Ledger
                                        </button>
                                    )}
                                    <button className="w-16 h-full bg-white border-2 border-neutral-100 text-text-secondary rounded-2xl active:scale-95 transition-all hover:bg-neutral-50 flex items-center justify-center">
                                        <ArrowRight size={24} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function MapStall({ stall, selected, onClick }: { stall?: Stall, selected: boolean, onClick: (s: Stall) => void }) {
    if (!stall) return <div className="h-16 opacity-10 border-2 border-dashed border-neutral-200 rounded-2xl" />; 
    
    const theme = getStallTheme(stall);
    const Icon = theme.icon;

    return (
        <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onClick(stall)}
            className={cn(
                "h-20 w-full rounded-[1.5rem] flex flex-col items-center justify-center transition-all relative border-2 group shadow-sm",
                theme.bg,
                selected ? "border-brand-500 ring-4 ring-brand-500/10 z-10 shadow-xl" : theme.border,
                "hover:shadow-lg hover:border-brand-200"
            )}
        >
            <div className="flex flex-col items-center gap-2">
                <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110",
                    selected ? "bg-brand-500 text-white" : cn(theme.bg, theme.text, "border border-black/5")
                )}>
                    <Icon size={28} />
                </div>
                <span className={cn(
                    "text-[10px] font-black uppercase tracking-tighter transition-colors",
                    selected ? "text-brand-600" : "text-green-950"
                )}>
                    {stall.stall_number}
                </span>
            </div>

            {/* Status Dot for Occupied Stalls */}
            {stall.status === 'occupied' && (
                <div className="absolute top-3 right-3 w-2 h-2 bg-brand-500 rounded-full shadow-[0_0_8px_rgba(27,107,58,0.5)]" />
            )}
        </motion.button>
    );
}

