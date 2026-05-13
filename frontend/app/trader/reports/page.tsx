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
    CheckCircle2
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';

export default function TraderReportsPage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [isGenerating, setIsGenerating] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    
    // Form State
    const [format, setFormat] = useState<'pdf' | 'xlsx'>('pdf');
    const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

    const handleGenerate = async () => {
        setIsGenerating(true);
        try {
            await api.post('/reports/activity', {
                type: 'sales',
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
        <DashboardLayout title="Business Reports">
            <div className="max-w-6xl mx-auto space-y-10 pb-32">
                
                {/* Header Section */}
                <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => router.back()}
                                className="w-10 h-10 bg-white rounded-xl border border-gray-100 flex items-center justify-center text-text-muted hover:text-brand-600 hover:border-brand-100 transition-all shadow-sm"
                            >
                                <ArrowLeft size={18} />
                            </button>
                            <span className="bg-brand-100 text-brand-700 text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full border border-brand-200">
                                Analytics Hub
                            </span>
                        </div>
                        <h1 className="text-4xl lg:text-5xl font-black text-green-950 tracking-tight">Business Intelligence</h1>
                        <p className="text-sm text-text-secondary font-medium max-w-md">
                            Generate detailed sales reports, tax summaries, and performance audits for your stall.
                        </p>
                    </div>

                    <div className="flex items-center gap-4 bg-green-50 p-4 rounded-3xl border border-green-100">
                        <div className="w-12 h-12 bg-green-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-green-200">
                            <TrendingUp size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-green-700 uppercase tracking-widest">Growth Tracking</p>
                            <p className="text-[9px] font-bold text-text-muted uppercase tracking-tight">Active Optimization</p>
                        </div>
                    </div>
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    {/* Report Generator Form */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-brand-sm space-y-8 sticky top-24">
                            <div>
                                <h3 className="text-xs font-black text-green-950 uppercase tracking-[0.2em] border-b border-gray-50 pb-4 flex items-center gap-2">
                                    <BarChart3 size={16} className="text-brand-600" />
                                    Generate New Report
                                </h3>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Date Range</label>
                                    <div className="grid grid-cols-1 gap-3">
                                        <div className="relative">
                                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                                            <input 
                                                type="date"
                                                value={startDate}
                                                onChange={(e) => setStartDate(e.target.value)}
                                                className="w-full h-12 pl-12 pr-4 bg-neutral-50 rounded-xl border-2 border-transparent focus:border-brand-200 focus:bg-white outline-none font-bold text-xs"
                                            />
                                        </div>
                                        <div className="relative">
                                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                                            <input 
                                                type="date"
                                                value={endDate}
                                                onChange={(e) => setEndDate(e.target.value)}
                                                className="w-full h-12 pl-12 pr-4 bg-neutral-50 rounded-xl border-2 border-transparent focus:border-brand-200 focus:bg-white outline-none font-bold text-xs"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Export Format</label>
                                    <div className="flex bg-neutral-100 p-1.5 rounded-2xl">
                                        <button 
                                            onClick={() => setFormat('pdf')}
                                            className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 transition-all ${format === 'pdf' ? 'bg-white shadow-md text-brand-700' : 'text-text-muted hover:text-text-primary'}`}
                                        >
                                            <FileText size={16} />
                                            <span className="text-[10px] font-black uppercase tracking-widest">PDF</span>
                                        </button>
                                        <button 
                                            onClick={() => setFormat('xlsx')}
                                            className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 transition-all ${format === 'xlsx' ? 'bg-white shadow-md text-green-700' : 'text-text-muted hover:text-text-primary'}`}
                                        >
                                            <FileSpreadsheet size={16} />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Excel</span>
                                        </button>
                                    </div>
                                </div>

                                <button 
                                    onClick={handleGenerate}
                                    disabled={isGenerating}
                                    className={`w-full h-14 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-70 ${
                                        showSuccess ? 'bg-green-600 text-white shadow-green-100' : 'bg-green-950 text-white shadow-gray-200'
                                    }`}
                                >
                                    {isGenerating ? (
                                        <>
                                            <Loader2 className="animate-spin" size={18} />
                                            Processing...
                                        </>
                                    ) : showSuccess ? (
                                        <>
                                            <CheckCircle2 size={18} />
                                            Saved to Archive
                                        </>
                                    ) : (
                                        <>
                                            <Download size={18} className="text-brand-400" />
                                            Generate Report
                                        </>
                                    )}
                                </button>
                            </div>

                            <div className="p-6 bg-brand-50 rounded-3xl border border-brand-100">
                                <h4 className="text-[10px] font-black text-brand-700 uppercase tracking-widest mb-2 flex items-center gap-2">
                                    <ShieldCheck size={14} />
                                    Data Privacy
                                </h4>
                                <p className="text-[9px] text-text-secondary font-bold uppercase tracking-tight leading-relaxed">
                                    Reports are only accessible to you and authorized market administrators.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Report Archive List */}
                    <div className="lg:col-span-8 space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <History className="text-brand-600" size={18} />
                                <h3 className="text-xs font-black text-green-950 uppercase tracking-[0.2em]">Report Archive</h3>
                            </div>
                            <div className="h-0.5 flex-1 bg-gray-50 mx-4" />
                            <div className="flex items-center gap-2 bg-neutral-100 px-3 py-1.5 rounded-xl">
                                <Filter size={12} className="text-text-muted" />
                                <span className="text-[9px] font-black text-text-muted uppercase tracking-widest">All Time</span>
                            </div>
                        </div>

                        <ReportList />
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
