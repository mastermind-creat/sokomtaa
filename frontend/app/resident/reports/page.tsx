'use client';

import React from 'react';
import DashboardLayout from '@/components/shared/DashboardLayout';
import ReportList from '@/components/shared/ReportList';
import { 
    FileText, 
    ArrowLeft, 
    Download, 
    ShoppingBag, 
    History,
    ShieldCheck
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

export default function ResidentReportsPage() {
    const router = useRouter();

    return (
        <DashboardLayout title="Reports & Archive">
            <div className="max-w-4xl mx-auto space-y-10 pb-32">
                
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
                                My Documents
                            </span>
                        </div>
                        <h1 className="text-4xl lg:text-5xl font-black text-green-950 tracking-tight">Reports & Receipts</h1>
                        <p className="text-sm text-text-secondary font-medium max-w-md">
                            Access your transaction history, downloadable receipts, and monthly activity summaries.
                        </p>
                    </div>

                    <div className="flex items-center gap-4 bg-brand-50/50 p-4 rounded-3xl border border-brand-100/50">
                        <div className="w-12 h-12 bg-brand-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-brand-200">
                            <ShieldCheck size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-brand-700 uppercase tracking-widest">Verified Vault</p>
                            <p className="text-[9px] font-bold text-text-muted uppercase tracking-tight">Encrypted Storage</p>
                        </div>
                    </div>
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    {/* Sidebar / Quick Actions */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-brand-sm space-y-6 sticky top-24">
                            <h3 className="text-xs font-black text-green-950 uppercase tracking-[0.2em] border-b border-gray-50 pb-4">Quick Links</h3>
                            
                            <div className="space-y-3">
                                <button 
                                    onClick={() => router.push('/reservations')}
                                    className="w-full p-4 bg-neutral-50 rounded-2xl flex items-center gap-4 hover:bg-brand-50 hover:text-brand-700 transition-all group"
                                >
                                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                                        <ShoppingBag size={18} />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-[10px] font-black uppercase tracking-widest leading-none">View Orders</p>
                                        <p className="text-[9px] font-bold text-text-muted uppercase tracking-tight mt-1">Generate Receipts</p>
                                    </div>
                                </button>

                                <button 
                                    onClick={() => router.push('/resident/payments')}
                                    className="w-full p-4 bg-neutral-50 rounded-2xl flex items-center gap-4 hover:bg-brand-50 hover:text-brand-700 transition-all group"
                                >
                                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                                        <History size={18} />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-[10px] font-black uppercase tracking-widest leading-none">Payments History</p>
                                        <p className="text-[9px] font-bold text-text-muted uppercase tracking-tight mt-1">Transaction Logs</p>
                                    </div>
                                </button>
                            </div>

                            <div className="p-6 bg-green-950 rounded-3xl text-white relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-10">
                                    <FileText size={48} />
                                </div>
                                <h4 className="text-sm font-black uppercase tracking-widest mb-1">Need Help?</h4>
                                <p className="text-[10px] text-brand-300 font-bold uppercase tracking-tight leading-relaxed">
                                    Missing a receipt? Contact support for manual reconciliation.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Main Content / Report List */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xs font-black text-green-950 uppercase tracking-[0.2em]">Saved Documents</h3>
                            <div className="h-0.5 flex-1 bg-gray-50 mx-4" />
                        </div>

                        <ReportList />
                    </div>
                </div>

            </div>
        </DashboardLayout>
    );
}
