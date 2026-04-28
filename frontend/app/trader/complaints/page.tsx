'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
    MessageSquare, Plus, ChevronDown, ChevronUp,
    Clock, CheckCircle2, AlertCircle, XCircle, X
} from 'lucide-react';
import api from '@/lib/api';
import { ApiResponse } from '@/types';

import { useUIStore } from '@/store/uiStore';
import { useTranslation } from '@/hooks/useTranslation';

interface Complaint {
    id: number;
    subject: string;
    description: string;
    category: string;
    status: 'open' | 'in_review' | 'resolved' | 'closed';
    priority: number;
    admin_response: string | null;
    created_at: string;
    resolved_at: string | null;
    user?: { name: string };   // who filed it (for "against me" tab)
}

const STATUS_CFG = {
    open:      { label: 'Open',       color: 'text-amber-700', bg: 'bg-amber-50',  icon: <AlertCircle className="w-3.5 h-3.5" /> },
    in_review: { label: 'In Review',  color: 'text-blue-700',  bg: 'bg-blue-50',   icon: <Clock className="w-3.5 h-3.5" /> },
    resolved:  { label: 'Resolved',   color: 'text-green-700', bg: 'bg-green-50',  icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
    closed:    { label: 'Closed',     color: 'text-gray-600',  bg: 'bg-gray-50',   icon: <XCircle className="w-3.5 h-3.5" /> },
};

const CATEGORIES = [
    { value: 'trader_conduct', label: 'Trader Conduct' },
    { value: 'product_quality', label: 'Product Quality' },
    { value: 'payment_dispute', label: 'Payment Dispute' },
    { value: 'cleanliness', label: 'Cleanliness' },
    { value: 'security', label: 'Security' },
    { value: 'water_sanitation', label: 'Water & Sanitation' },
    { value: 'stall_allocation', label: 'Stall Allocation' },
    { value: 'other', label: 'Other' },
];

function ComplaintCard({ complaint }: { complaint: Complaint }) {
    const [expanded, setExpanded] = useState(false);
    const s = STATUS_CFG[complaint.status];

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <button className="w-full text-left px-5 py-4" onClick={() => setExpanded(!expanded)}>
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${s.bg} ${s.color}`}>
                                {s.icon} {s.label}
                            </span>
                            <span className="text-[10px] text-text-muted font-mono">#{complaint.id.toString().padStart(5, '0')}</span>
                        </div>
                        <p className="font-bold text-sm text-text-primary leading-tight">{complaint.subject}</p>
                        <p className="text-xs text-text-secondary mt-1">
                            {complaint.category.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} ·{' '}
                            {new Date(complaint.created_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })}
                        </p>
                    </div>
                    {expanded ? <ChevronUp className="w-4 h-4 text-text-muted shrink-0 mt-1" /> : <ChevronDown className="w-4 h-4 text-text-muted shrink-0 mt-1" />}
                </div>
            </button>

            {expanded && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="border-t border-gray-50 px-5 pb-5 pt-4 space-y-3"
                >
                    <p className="text-sm text-text-primary">{complaint.description}</p>
                    {complaint.user && (
                        <p className="text-xs text-text-secondary font-medium">Filed by: {complaint.user.name}</p>
                    )}
                    {complaint.admin_response && (
                        <div className="bg-primary/5 rounded-xl p-3">
                            <p className="text-xs font-bold text-primary mb-1">Admin Response</p>
                            <p className="text-sm text-text-primary">{complaint.admin_response}</p>
                        </div>
                    )}
                </motion.div>
            )}
        </div>
    );
}

function NewComplaintSheet({ onClose }: { onClose: () => void }) {
    const queryClient = useQueryClient();
    const [form, setForm] = useState({ subject: '', category: '', description: '' });

    const { mutate, isPending } = useMutation({
        mutationFn: (data: typeof form) => api.post('/complaints', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['trader-complaints-mine'] });
            onClose();
        },
    });

    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 bg-black/40 flex items-end justify-center"
            onClick={e => e.target === e.currentTarget && onClose()}
        >
            <motion.div
                initial={{ y: '100%' }} animate={{ y: 0 }}
                className="w-full max-w-2xl bg-white rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto"
            >
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-black text-text-primary">New Complaint</h2>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-text-primary mb-2">Category *</label>
                        <select
                            id="complaintCategory"
                            title="Complaint category"
                            aria-label="Select complaint category"
                            value={form.category}
                            onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                            className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        >
                            <option value="">Select a category...</option>
                            {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-text-primary mb-2">Subject *</label>
                        <input
                            type="text"
                            value={form.subject}
                            onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                            placeholder="Brief subject of your complaint"
                            className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-text-primary mb-2">Description * <span className="font-normal text-text-muted">(min 50 characters)</span></label>
                        <textarea
                            value={form.description}
                            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                            rows={5}
                            placeholder="Describe your complaint in detail..."
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                        <p className="text-xs text-text-muted mt-1">{form.description.length}/50 characters minimum</p>
                    </div>

                    <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={() => mutate(form)}
                        disabled={isPending || !form.category || !form.subject || form.description.length < 50}
                        className="w-full py-4 bg-primary text-white rounded-2xl font-black text-base min-h-[56px] hover:bg-primary-light transition-colors disabled:opacity-50"
                    >
                        {isPending ? 'Submitting...' : 'Submit Complaint'}
                    </motion.button>
                </div>
            </motion.div>
        </motion.div>
    );
}

export default function TraderComplaintsPage() {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<'against' | 'mine'>('against');
    const [showForm, setShowForm] = useState(false);
    const { setPageTitle } = useUIStore();

    React.useEffect(() => {
        setPageTitle('Complaints');
    }, [setPageTitle]);

    const { data: rawData, isLoading } = useQuery({
        queryKey: ['trader-complaints', activeTab],
        queryFn: async () => {
            const res = await api.get<never, ApiResponse<{ data: Complaint[] }>>(`/trader/complaints?tab=${activeTab}`);
            return res.data;
        },
    });
    const complaints: Complaint[] = Array.isArray(rawData) ? rawData : (rawData as any)?.data ?? [];

    return (
        <div className="max-w-2xl mx-auto px-4 py-6">
                <div className="flex items-center justify-end mb-6">
                    <button
                        onClick={() => setShowForm(true)}
                        className="flex items-center gap-2 px-6 py-2.5 bg-brand-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-brand-700 transition-all shadow-lg shadow-brand-900/10 active:scale-95 min-h-[48px]"
                    >
                        <Plus className="w-4 h-4" /> {t('common.add') || 'New'}
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
                    {[
                        { key: 'against', label: 'Filed Against Me' },
                        { key: 'mine', label: 'Filed By Me' },
                    ].map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key as 'against' | 'mine')}
                            className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${
                                activeTab === tab.key ? 'bg-white text-text-primary shadow-sm' : 'text-text-secondary'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {isLoading ? (
                    <div className="space-y-3">
                        {[1, 2].map(i => <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />)}
                    </div>
                ) : complaints.length === 0 ? (
                    <div className="text-center py-16">
                        <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-200" />
                        <p className="font-bold text-text-primary">No complaints</p>
                        <p className="text-sm text-text-secondary mt-1">
                            {activeTab === 'against' ? "No complaints have been filed against you." : "You haven't filed any complaints yet."}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {complaints.map(c => <ComplaintCard key={c.id} complaint={c} />)}
                    </div>
                )}
            
            {showForm && <NewComplaintSheet onClose={() => setShowForm(false)} />}
        </div>
    );
}
