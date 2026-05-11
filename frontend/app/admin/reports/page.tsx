'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    BarChart3, 
    TrendingUp, 
    Download, 
    Mail, 
    Clock, 
    ChevronRight,
    PieChart,
    Activity,
    ShieldCheck,
    Zap,
    Search,
    RefreshCcw,
    Plus
} from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { cn } from '@/lib/utils';

export default function AdminReportsPage() {
    const { setPageTitle } = useUIStore();
    const [searchQuery, setSearchQuery] = useState('');

    const { data: statsData, isLoading: statsLoading } = useQuery({
        queryKey: ['admin-stats'],
        queryFn: () => api.get('/admin/stats').then(res => res.data.data),
    });

    React.useEffect(() => {
        setPageTitle('Intelligence Factory');
    }, [setPageTitle]);

    const reportCategories = [
        { id: 'fiscal', label: 'Financial Audits', icon: TrendingUp, color: 'bg-emerald-50 text-emerald-700' },
        { id: 'ops', label: 'Market Operations', icon: Activity, color: 'bg-blue-50 text-blue-700' },
        { id: 'compliance', label: 'Compliance & Audit', icon: ShieldCheck, color: 'bg-rose-50 text-rose-700' },
    ];

    const reports = [
        { 
            id: 1, 
            title: 'Monthly Revenue Audit', 
            description: 'Full breakdown of M-Pesa collections vs expected market levies across all blocks.',
            category: 'fiscal',
            lastRun: '2025-01-26',
            status: 'ready',
            kpi: 'KES 4.2M',
            trend: '+12%'
        },
        { 
            id: 2, 
            title: 'Occupancy Velocity', 
            description: 'Real-time analysis of stall rotations, vacancies, and premium zone demand trends.',
            category: 'ops',
            lastRun: '2025-01-27',
            status: 'ready',
            kpi: '94.2%',
            trend: '-2.1%'
        },
        { 
            id: 3, 
            title: 'Compliance Forensic', 
            description: 'Registry analysis of trader permits vs stall activity and payment consistency.',
            category: 'compliance',
            lastRun: '2025-01-25',
            status: 'stale',
            kpi: 'Audit Required',
            trend: 'N/A'
        },
        { 
            id: 4, 
            title: 'Resident Traffic Heatmap', 
            description: 'Spatial analysis of reservation volume per market zone derived from fulfillment data.',
            category: 'ops',
            lastRun: '2025-01-27',
            status: 'processing',
            kpi: '742/hr',
            trend: '+45%'
        }
    ];

    const stats = [
        { label: 'Revenue (MTD)', value: `KES ${Number(statsData?.revenue?.this_month || 0).toLocaleString()}`, color: 'text-brand-600', icon: TrendingUp },
        { label: 'Occupancy', value: `${statsData?.stalls?.occupancy_rate || 0}%`, color: 'text-blue-600', icon: PieChart },
        { label: 'Health', value: statsData?.revenue?.percentage > 80 ? 'A+' : 'A-', color: 'text-emerald-600', icon: ShieldCheck },
    ];

    return (
        <div className="pb-32 -mx-4 md:-mx-0 font-sans">
            {/* ── Analytical Matrix (3-col Mobile) ── */}
            <div className="grid grid-cols-3 gap-2 px-4 mb-6">
                {stats.map((s, i) => (
                    <div key={i} className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center text-center">
                        <span className={cn("text-[8px] font-black uppercase tracking-widest mb-1", s.color)}>{s.label}</span>
                        <div className="text-sm font-black text-green-950 tracking-tight leading-none">
                            {s.value}
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Diagnostic Search ── */}
            <div className="px-4 mb-8">
                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                    <input 
                        type="text"
                        placeholder="Search diagnostics or metrics..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-12 pl-12 pr-4 bg-white border border-gray-100 rounded-2xl text-sm font-bold shadow-sm outline-none focus:border-brand-300 focus:ring-4 focus:ring-brand-50"
                    />
                </div>
            </div>

            {/* ── Report Factory Cards ── */}
            <div className="space-y-6 px-4">
                {reports.filter(r => r.title.toLowerCase().includes(searchQuery.toLowerCase())).map((report, i) => (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        key={report.id}
                        className="bg-white rounded-[2.5rem] border border-gray-50 shadow-sm overflow-hidden"
                    >
                        <div className="p-6">
                            <div className="flex items-start justify-between mb-5">
                                <div className="flex items-center gap-4">
                                    <div className={cn(
                                        "w-12 h-12 rounded-2xl flex items-center justify-center",
                                        reportCategories.find(c => c.id === report.category)?.color
                                    )}>
                                        <BarChart3 size={24} />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-black text-green-950 uppercase tracking-tight leading-none mb-1.5">
                                            {report.title}
                                        </h4>
                                        <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">
                                            {reportCategories.find(c => c.id === report.category)?.label}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs font-black text-green-950">{report.kpi}</div>
                                    <div className={cn(
                                        "text-[8px] font-black uppercase tracking-widest mt-0.5",
                                        report.trend.startsWith('+') ? 'text-brand-600' : 'text-rose-600'
                                    )}>{report.trend}</div>
                                </div>
                            </div>

                            <p className="text-[11px] font-bold text-text-secondary leading-relaxed mb-6 line-clamp-2">
                                {report.description}
                            </p>

                            <div className="flex gap-2">
                                <button className="flex-1 h-11 bg-gray-950 text-white rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-xl shadow-gray-950/20">
                                    <Zap size={14} /> Run Analytics
                                </button>
                                <button className="h-11 w-11 bg-gray-50 text-text-muted rounded-2xl border border-gray-100 flex items-center justify-center active:scale-95 transition-all">
                                    <Download size={16} />
                                </button>
                                <button className="h-11 w-11 bg-gray-50 text-text-muted rounded-2xl border border-gray-100 flex items-center justify-center active:scale-95 transition-all">
                                    <Mail size={16} />
                                </button>
                            </div>
                        </div>
                        <div className="bg-gray-50/50 px-6 py-3 flex justify-between items-center border-t border-gray-100">
                            <div className="flex items-center gap-1.5 text-[9px] font-black text-text-muted uppercase tracking-widest">
                                <Clock size={12} /> Last Generated {new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short' }).format(new Date(report.lastRun))}
                            </div>
                            <div className="flex items-center gap-1 text-brand-600">
                                <span className="text-[9px] font-black uppercase tracking-widest">Configure Schedule</span>
                                <ChevronRight size={14} />
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* ── Global Strategy Actions ── */}
            <div className="fixed bottom-24 right-4 z-40 flex flex-col gap-3">
                <button className="w-14 h-14 bg-white text-gray-950 rounded-full shadow-2xl flex items-center justify-center active:scale-90 transition-all border-4 border-gray-50">
                    <RefreshCcw size={24} />
                </button>
                <button className="w-14 h-14 bg-brand-600 text-white rounded-full shadow-2xl flex items-center justify-center active:scale-90 transition-all border-4 border-white">
                    <Plus size={24} /> 
                </button>
            </div>
        </div>
    );
}
