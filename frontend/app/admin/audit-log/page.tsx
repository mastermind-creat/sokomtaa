'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    History, 
    Search, 
    Filter, 
    Download, 
    Terminal, 
    User, 
    ShieldAlert, 
    Globe,
    ExternalLink,
    ChevronRight,
    SearchCode,
    Cpu,
    ArrowRight,
    Activity,
    Shield
} from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { cn } from '@/lib/utils';

export default function AdminAuditLogPage() {
    const { setPageTitle } = useUIStore();
    const [searchQuery, setSearchQuery] = useState('');

    React.useEffect(() => {
        setPageTitle('Platform Governance');
    }, [setPageTitle]);

    const { data: auditDataRaw, isLoading } = useQuery({
        queryKey: ['admin-audit-logs'],
        queryFn: () => api.get('/admin/audit-logs').catch(() => ({ data: [] })),
    });

    const logs = (auditDataRaw as any)?.data || [
        { id: 100, timestamp: '2025-01-27T08:30:00Z', admin: 'John Maina', action: 'Trader Verified', resource: 'Mama Wanjiru', before: 'pending', after: 'verified', ip: '192.168.1.45', severity: 'low' },
        { id: 99, timestamp: '2025-01-27T07:15:00Z', admin: 'Sarah Kamau', action: 'Stall Allocated', resource: 'Stall B4 → Tech Safi', before: 'vacant', after: 'occupied', ip: '192.168.1.12', severity: 'medium' },
        { id: 98, timestamp: '2025-01-26T16:45:00Z', admin: 'John Maina', action: 'Fee Waived', resource: 'Ochieng Fish (Dec 2024)', before: 'unpaid', after: 'waived', ip: '192.168.1.45', severity: 'high' },
        { id: 97, timestamp: '2025-01-26T14:20:00Z', admin: 'System', action: 'Notice Expired', resource: 'Market Maint.', before: 'active', after: 'expired', ip: '127.0.0.1', severity: 'info' },
    ];

    const stats = [
        { label: 'Actions (24h)', value: '142', color: 'text-brand-600', icon: Activity },
        { label: 'Critical', value: '3', color: 'text-rose-600', icon: ShieldAlert },
        { label: 'Integrity', value: '99.9%', color: 'text-blue-600', icon: Shield },
    ];

    const getSeverityStyles = (severity: string) => {
        switch (severity) {
            case 'high': return 'bg-rose-50 text-rose-700 border-rose-100';
            case 'medium': return 'bg-amber-50 text-amber-700 border-amber-100';
            case 'low': return 'bg-green-50 text-green-700 border-green-100';
            default: return 'bg-gray-50 text-gray-500 border-gray-100';
        }
    };

    return (
        <div className="pb-32 -mx-4 md:-mx-0">
            {/* ── Integrity Matrix (3-col Mobile) ── */}
            <div className="grid grid-cols-3 gap-2 px-4 mb-6">
                {stats.map((s, i) => (
                    <div key={i} className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center text-center">
                        <span className={cn("text-[8px] font-black uppercase tracking-widest mb-1", s.color)}>{s.label}</span>
                        <div className="text-sm font-black text-green-950 tracking-tight">
                            {isLoading ? '...' : s.value}
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Forensic Triage Search ── */}
            <div className="px-4 mb-8">
                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-brand-600" size={18} />
                    <input 
                        type="text"
                        placeholder="Search action or resource..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-12 pl-12 pr-4 bg-white border border-gray-100 rounded-2xl text-sm font-bold shadow-sm outline-none focus:border-brand-300 focus:ring-4 focus:ring-brand-50"
                    />
                </div>
            </div>

            {/* ── Audit Hub Cards ── */}
            <div className="space-y-4 px-4">
                {isLoading ? (
                    [1, 2, 3].map(i => <div key={i} className="h-40 bg-gray-100 rounded-[2.5rem] animate-pulse" />)
                ) : (
                    <AnimatePresence mode="wait">
                        {logs.filter((log: any) => 
                            log.action.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            log.resource.toLowerCase().includes(searchQuery.toLowerCase())
                        ).map((log: any) => (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                key={log.id}
                                className="bg-white rounded-[2.5rem] border border-gray-50 shadow-sm overflow-hidden"
                            >
                                <div className="p-6">
                                    <div className="flex items-start justify-between mb-5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-gray-950 text-white rounded-2xl flex items-center justify-center">
                                                <Terminal size={24} className="text-brand-400" />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-black text-green-950 uppercase tracking-tight leading-none mb-1.5">
                                                    {log.action}
                                                </h4>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">
                                                        By {log.admin}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className={cn(
                                            "px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border",
                                            getSeverityStyles(log.severity)
                                        )}>
                                            {log.severity}
                                        </div>
                                    </div>

                                    {/* Action Resource Peek */}
                                    <div className="bg-gray-50/80 p-4 rounded-3xl border border-gray-100 mb-6">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Cpu size={12} className="text-brand-600" />
                                            <span className="text-[10px] font-black text-green-950 uppercase tracking-widest truncate">{log.resource}</span>
                                        </div>
                                        <div className="flex items-center justify-between font-mono text-[9px] bg-white p-2 rounded-xl border border-gray-50">
                                            <span className="text-rose-400 line-through truncate max-w-[80px]">{log.before}</span>
                                            <ArrowRight size={10} className="text-gray-300 mx-2 flex-shrink-0" />
                                            <span className="text-brand-600 font-black truncate max-w-[80px]">{log.after}</span>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <button className="flex-1 h-11 bg-gray-50 text-text-secondary rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all">
                                            <History size={14} /> Full Log
                                        </button>
                                        <button className="h-11 w-11 bg-gray-50 text-text-muted rounded-2xl flex items-center justify-center active:scale-95 transition-all">
                                            <Globe size={16} />
                                        </button>
                                    </div>
                                </div>
                                <div className="bg-gray-50/50 px-6 py-3 flex justify-between items-center border-t border-gray-100">
                                    <span className="text-[9px] font-black text-text-muted uppercase tracking-widest italic">
                                        IP: {log.ip}
                                    </span>
                                    <span className="text-[9px] font-black text-text-muted uppercase tracking-widest">
                                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                )}
            </div>

            {/* ── Global Governance Actions ── */}
            <div className="fixed bottom-24 right-4 z-40 flex flex-col gap-3">
                <button className="w-14 h-14 bg-gray-950 text-white rounded-full shadow-2xl flex items-center justify-center active:scale-90 transition-all border-4 border-white">
                    <Download size={24} />
                </button>
            </div>
        </div>
    );
}
