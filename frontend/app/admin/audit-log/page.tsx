'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    History, 
    Search, 
    Download, 
    Terminal, 
    ShieldAlert, 
    Globe,
    Cpu,
    ArrowRight,
    Activity,
    Shield,
    X,
    FileJson
} from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { cn } from '@/lib/utils';

export default function AdminAuditLogPage() {
    const { setPageTitle } = useUIStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedLog, setSelectedLog] = useState<any>(null);

    React.useEffect(() => {
        setPageTitle('Platform Governance');
    }, [setPageTitle]);

    const { data: auditDataRaw, isLoading } = useQuery({
        queryKey: ['admin-audit-logs'],
        queryFn: () => api.get('/admin/audit-logs').catch(() => ({ data: [] })),
    });

    const logs = (auditDataRaw as any)?.data || [
        { id: 100, timestamp: '2025-01-27T08:30:00Z', admin: 'John Maina', action: 'Trader Verified', resource: 'Mama Wanjiru', before: 'pending', after: 'verified', ip: '192.168.1.45', severity: 'low', details: { id: 45, verification_status: 'verified', approved_by: 12 } },
        { id: 99, timestamp: '2025-01-27T07:15:00Z', admin: 'Sarah Kamau', action: 'Stall Allocated', resource: 'Stall B4 → Tech Safi', before: 'vacant', after: 'occupied', ip: '192.168.1.12', severity: 'medium', details: { stall_id: 'B4', trader_id: 88, term: '6 months' } },
        { id: 98, timestamp: '2025-01-26T16:45:00Z', admin: 'John Maina', action: 'Fee Waived', resource: 'Ochieng Fish (Dec 2024)', before: 'unpaid', after: 'waived', ip: '192.168.1.45', severity: 'high', details: { fee_id: 1024, reason: 'System downtime compensation', authorized_by: 'John Maina' } },
        { id: 97, timestamp: '2025-01-26T14:20:00Z', admin: 'System', action: 'Notice Expired', resource: 'Market Maint.', before: 'active', after: 'expired', ip: '127.0.0.1', severity: 'info', details: { notice_id: 12, auto_expired: true } },
    ];

    const stats = [
        { label: 'Actions (24h)', value: '142', color: 'text-brand-600', icon: Activity },
        { label: 'Critical', value: '3', color: 'text-rose-600', icon: ShieldAlert },
        { label: 'Integrity', value: '99.9%', color: 'text-blue-600', icon: Shield },
    ];

    const getSeverityStyles = (severity: string) => {
        switch (severity) {
            case 'high': return 'bg-rose-100 text-rose-800 border-rose-200';
            case 'medium': return 'bg-amber-100 text-amber-800 border-amber-200';
            case 'low': return 'bg-green-100 text-green-800 border-green-200';
            default: return 'bg-gray-100 text-gray-600 border-gray-200';
        }
    };

    return (
        <div className="pb-32 -mx-4 md:-mx-0">
            {/* ── Integrity Matrix ── */}
            <div className="grid grid-cols-3 gap-3 px-4 mb-8">
                {stats.map((s, i) => (
                    <div key={i} className="bg-white p-4 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center hover:shadow-md transition-shadow">
                        <span className={cn("text-[10px] font-black uppercase tracking-widest mb-1.5", s.color)}>{s.label}</span>
                        <div className="text-2xl font-black text-green-950 tracking-tight">
                            {isLoading ? '...' : s.value}
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Search ── */}
            <div className="px-4 mb-8">
                <div className="relative group">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-brand-600 transition-colors" size={20} />
                    <input 
                        type="text"
                        placeholder="Search by action, resource, or admin..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-14 pl-14 pr-4 bg-white border-2 border-gray-100 rounded-[2rem] text-sm font-bold shadow-sm outline-none focus:border-brand-300 focus:bg-brand-50/20 transition-all"
                    />
                </div>
            </div>

            {/* ── Audit Hub Cards ── */}
            <div className="space-y-6 px-4">
                {isLoading ? (
                    [1, 2, 3].map(i => <div key={i} className="h-48 bg-white border border-gray-100 rounded-[2.5rem] animate-pulse" />)
                ) : (
                    <AnimatePresence mode="wait">
                        {logs.filter((log: any) => 
                            log.action.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            log.resource.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            log.admin.toLowerCase().includes(searchQuery.toLowerCase())
                        ).map((log: any) => (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                key={log.id}
                                className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden hover:shadow-lg transition-shadow"
                            >
                                <div className="p-6 md:p-8">
                                    <div className="flex items-start justify-between mb-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 bg-green-950 text-white rounded-[1.5rem] flex items-center justify-center shadow-inner">
                                                <Terminal size={24} className="text-brand-400" />
                                            </div>
                                            <div>
                                                <h4 className="text-base font-black text-green-950 uppercase tracking-tight leading-none mb-2">
                                                    {log.action}
                                                </h4>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[11px] font-bold text-text-muted uppercase tracking-widest bg-gray-50 px-3 py-1 rounded-full">
                                                        By {log.admin}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className={cn(
                                            "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm",
                                            getSeverityStyles(log.severity)
                                        )}>
                                            {log.severity}
                                        </div>
                                    </div>

                                    {/* Action Resource Peek */}
                                    <div className="bg-brand-50/30 p-5 rounded-3xl border border-brand-100/50 mb-6">
                                        <div className="flex items-center gap-2 mb-3">
                                            <Cpu size={14} className="text-brand-600" />
                                            <span className="text-xs font-black text-brand-900 uppercase tracking-widest truncate">{log.resource}</span>
                                        </div>
                                        <div className="flex items-center gap-3 font-mono text-xs bg-white p-3 rounded-2xl border border-gray-100 shadow-sm">
                                            <span className="text-rose-500 line-through truncate flex-1 text-center font-semibold">{log.before}</span>
                                            <ArrowRight size={14} className="text-gray-400 flex-shrink-0" />
                                            <span className="text-brand-600 truncate flex-1 text-center font-bold">{log.after}</span>
                                        </div>
                                    </div>

                                    <div className="flex gap-3">
                                        <button 
                                            onClick={() => setSelectedLog(log)}
                                            className="flex-1 h-12 bg-green-950 hover:bg-brand-700 text-white rounded-2xl flex items-center justify-center gap-2 text-[11px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-md"
                                        >
                                            <History size={16} /> View Full Log
                                        </button>
                                        <div className="h-12 w-12 bg-gray-50 text-text-muted rounded-2xl flex items-center justify-center border border-gray-100">
                                            <Globe size={18} />
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-gray-50 px-6 md:px-8 py-4 flex justify-between items-center border-t border-gray-100">
                                    <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">
                                        IP: <span className="font-mono text-gray-500">{log.ip}</span>
                                    </span>
                                    <span className="text-[10px] font-black text-text-muted uppercase tracking-widest flex items-center gap-1.5">
                                        <History size={12} />
                                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                    </span>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                )}
            </div>

            {/* ── Global Governance Actions ── */}
            <div className="fixed bottom-24 right-4 z-40 flex flex-col gap-3">
                <button className="w-14 h-14 bg-brand-600 text-white rounded-full shadow-2xl flex items-center justify-center active:scale-90 transition-all border-4 border-white">
                    <Download size={24} />
                </button>
            </div>

            {/* ── Full Log Modal ── */}
            <AnimatePresence>
                {selectedLog && (
                    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center md:p-6 pointer-events-none">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedLog(null)}
                            className="absolute inset-0 bg-green-950/40 backdrop-blur-sm pointer-events-auto"
                        />
                        <motion.div
                            initial={{ y: '100%', opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: '100%', opacity: 0 }}
                            className="w-full md:w-[600px] bg-white rounded-t-[2.5rem] md:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] pointer-events-auto relative z-10"
                        >
                            <div className="p-6 bg-green-950 text-white flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                                        <FileJson size={24} className="text-brand-400" />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-sm uppercase tracking-widest">Audit Payload</h3>
                                        <p className="text-[10px] text-brand-300 font-bold uppercase tracking-wider">Log ID: #{selectedLog.id}</p>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedLog(null)} className="w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-xl flex items-center justify-center transition-colors">
                                    <X size={20} />
                                </button>
                            </div>
                            
                            <div className="p-6 overflow-y-auto space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-gray-50 p-4 rounded-2xl">
                                        <span className="text-[10px] font-black text-text-muted uppercase tracking-widest block mb-1">Timestamp</span>
                                        <span className="text-sm font-bold text-green-950">{new Date(selectedLog.timestamp).toLocaleString()}</span>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-2xl">
                                        <span className="text-[10px] font-black text-text-muted uppercase tracking-widest block mb-1">Administrator</span>
                                        <span className="text-sm font-bold text-green-950">{selectedLog.admin}</span>
                                    </div>
                                </div>
                                
                                <div className="bg-gray-950 text-green-400 p-6 rounded-3xl font-mono text-xs overflow-x-auto shadow-inner">
                                    <pre>{JSON.stringify(selectedLog.details || selectedLog, null, 2)}</pre>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
