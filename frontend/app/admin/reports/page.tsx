'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/shared/DashboardLayout';
import ReportList from '@/components/shared/ReportList';
import { 
    FileText, 
    ArrowLeft, 
    Download, 
    TrendingUp, 
    Calendar,
    Filter,
    BarChart3,
    FileSpreadsheet,
    Loader2,
    CheckCircle2,
    GanttChartSquare,
    PieChart,
    Search
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';

export default function AdminReportsPage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [isGenerating, setIsGenerating] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    
    // Form State
    const [reportType, setReportType] = useState<'revenue' | 'activity' | 'audit'>('revenue');
    const [format, setFormat] = useState<'pdf' | 'xlsx'>('pdf');
    const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

    const handleGenerate = async () => {
        setIsGenerating(true);
        try {
            await api.post('/reports/activity', {
                type: reportType,
                format,
                start_date: startDate,
                end_date: endDate
            });
            
            setShowSuccess(true);
            queryClient.invalidateQueries({ queryKey: ['reports'] });
            
            setTimeout(() => {
                setShowSuccess(false);
            }, 3000);
        } catch (error) {
            console.error('Failed to generate report:', error);
            alert('Failed to generate report. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <DashboardLayout title="County Intelligence">
            <div className="max-w-[1400px] mx-auto space-y-10 pb-32 px-4 md:px-8">
                
                {/* Header Section */}
                <section className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <button 
                                onClick={() => router.back()}
                                className="w-12 h-12 bg-white rounded-2xl border border-gray-100 flex items-center justify-center text-text-muted hover:text-brand-600 hover:border-brand-100 transition-all shadow-sm"
                            >
                                <ArrowLeft size={20} />
                            </button>
                            <div>
                                <span className="bg-brand-100 text-brand-700 text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full border border-brand-200">
                                    Administrative Oversight
                                </span>
                                <h1 className="text-4xl lg:text-6xl font-black text-green-950 tracking-tight mt-2 italic">System Reports</h1>
                            </div>
                        </div>
                        <p className="text-lg text-text-secondary font-medium max-w-2xl leading-relaxed">
                            Monitor county-wide revenue, market occupancy, and system audit logs through comprehensive, verifiable reports.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-green-950 p-6 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
                             <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:rotate-12 transition-transform">
                                <TrendingUp size={64} />
                            </div>
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-300">Revenue Logs</h4>
                            <p className="text-2xl font-black mt-1 font-mono">KES 1.2M+</p>
                        </div>
                        <div className="bg-brand-50 p-6 rounded-[2.5rem] border border-brand-100 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:-rotate-12 transition-transform">
                                <PieChart size={64} className="text-brand-600" />
                            </div>
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-700">Audit Status</h4>
                            <p className="text-2xl font-black mt-1 font-mono text-green-950">Active</p>
                        </div>
                    </div>
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    {/* Control Panel */}
                    <div className="lg:col-span-5 xl:col-span-4 space-y-8">
                        <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-2xl space-y-10">
                            <div>
                                <h3 className="text-lg font-black text-green-950 uppercase tracking-tight flex items-center gap-3">
                                    <GanttChartSquare size={24} className="text-brand-600" />
                                    Report Studio
                                </h3>
                                <p className="text-xs text-text-muted font-bold mt-1 uppercase tracking-widest">Configure generation parameters</p>
                            </div>

                            <div className="space-y-8">
                                {/* Report Type */}
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Data Perspective</label>
                                    <div className="grid grid-cols-1 gap-2">
                                        {[
                                            { id: 'revenue', label: 'Financial Revenue', icon: <TrendingUp size={16} /> },
                                            { id: 'activity', label: 'Market Activity', icon: <BarChart3 size={16} /> },
                                            { id: 'audit', label: 'Security Audit', icon: <ShieldCheck size={16} /> }
                                        ].map((t) => (
                                            <button
                                                key={t.id}
                                                onClick={() => setReportType(t.id as any)}
                                                className={`p-4 rounded-2xl border-2 flex items-center gap-4 transition-all ${
                                                    reportType === t.id 
                                                    ? 'border-brand-600 bg-brand-50/50 text-brand-700 shadow-sm' 
                                                    : 'border-transparent bg-neutral-50 text-text-muted hover:bg-neutral-100'
                                                }`}
                                            >
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${reportType === t.id ? 'bg-brand-600 text-white' : 'bg-white text-text-muted'}`}>
                                                    {t.icon}
                                                </div>
                                                <span className="text-[10px] font-black uppercase tracking-widest">{t.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Date Controls */}
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Timeline</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="relative group">
                                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-brand-600 transition-colors" size={16} />
                                            <input 
                                                type="date"
                                                value={startDate}
                                                onChange={(e) => setStartDate(e.target.value)}
                                                className="w-full h-14 pl-12 pr-4 bg-neutral-50 rounded-2xl border-2 border-transparent focus:border-brand-200 focus:bg-white outline-none font-bold text-xs transition-all shadow-inner"
                                            />
                                        </div>
                                        <div className="relative group">
                                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-brand-600 transition-colors" size={16} />
                                            <input 
                                                type="date"
                                                value={endDate}
                                                onChange={(e) => setEndDate(e.target.value)}
                                                className="w-full h-14 pl-12 pr-4 bg-neutral-50 rounded-2xl border-2 border-transparent focus:border-brand-200 focus:bg-white outline-none font-bold text-xs transition-all shadow-inner"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Format */}
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Output Format</label>
                                    <div className="flex bg-neutral-100 p-2 rounded-[1.5rem]">
                                        <button 
                                            onClick={() => setFormat('pdf')}
                                            className={`flex-1 py-4 rounded-xl flex items-center justify-center gap-3 transition-all ${format === 'pdf' ? 'bg-white shadow-lg text-brand-700 scale-[1.02]' : 'text-text-muted hover:text-text-primary'}`}
                                        >
                                            <FileText size={18} />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Pro PDF</span>
                                        </button>
                                        <button 
                                            onClick={() => setFormat('xlsx')}
                                            className={`flex-1 py-4 rounded-xl flex items-center justify-center gap-3 transition-all ${format === 'xlsx' ? 'bg-white shadow-lg text-green-700 scale-[1.02]' : 'text-text-muted hover:text-text-primary'}`}
                                        >
                                            <FileSpreadsheet size={18} />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Excel XL</span>
                                        </button>
                                    </div>
                                </div>

                                <button 
                                    onClick={handleGenerate}
                                    disabled={isGenerating}
                                    className={`w-full h-16 rounded-[1.5rem] text-[11px] font-black uppercase tracking-[0.25em] shadow-2xl transition-all flex items-center justify-center gap-4 active:scale-[0.98] disabled:opacity-70 ${
                                        showSuccess ? 'bg-green-600 text-white shadow-green-200 animate-pulse' : 'bg-green-950 text-white shadow-gray-300'
                                    }`}
                                >
                                    {isGenerating ? (
                                        <>
                                            <Loader2 className="animate-spin" size={20} />
                                            Architecting Data...
                                        </>
                                    ) : showSuccess ? (
                                        <>
                                            <CheckCircle2 size={20} />
                                            Saved to Vault
                                        </>
                                    ) : (
                                        <>
                                            <Download size={20} className="text-brand-400" />
                                            Initialize Report
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Report Explorer */}
                    <div className="lg:col-span-7 xl:col-span-8 space-y-8">
                        <div className="flex items-center justify-between gap-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-white rounded-2xl border border-gray-100 flex items-center justify-center shadow-sm">
                                    <Search size={20} className="text-text-muted" />
                                </div>
                                <h3 className="text-xl font-black text-green-950 uppercase tracking-tight">Report Explorer</h3>
                            </div>
                            <div className="h-px flex-1 bg-gray-100" />
                            <p className="text-[10px] font-black text-brand-600 bg-brand-50 px-4 py-2 rounded-full uppercase tracking-widest">
                                {reportType} logs
                            </p>
                        </div>

                        <div className="bg-white/50 backdrop-blur-xl rounded-[3rem] border border-white p-2 shadow-inner">
                            <ReportList />
                        </div>
                    </div>
                </div>

            </div>
        </DashboardLayout>
    );
}

// Re-import missing icon
function ShieldCheck({ size = 18, className = "" }) {
    return (
        <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width={size} 
            height={size} 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className={className}
        >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
            <path d="m9 12 2 2 4-4" />
        </svg>
    );
}
