'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { 
    AlertTriangle, 
    MessageSquare, 
    Plus, 
    ChevronRight, 
    Clock, 
    CheckCircle2, 
    AlertCircle, 
    Search,
    Filter,
    Loader2,
    X,
    Info,
    Store,
    ShieldAlert
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { ApiResponse } from '@/types';

interface Complaint {
    id: number;
    category: string;
    subject: string;
    description: string;
    status: 'open' | 'in_review' | 'resolved' | 'closed';
    priority: number;
    trader?: { business_name: string };
    created_at: string;
}

export default function ResidentComplaintsPage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [showForm, setShowForm] = useState(false);
    const [category, setCategory] = useState('other');
    const [subject, setSubject] = useState('');
    const [description, setDescription] = useState('');

    const { data: complaintsData, isLoading } = useQuery<ApiResponse<{ data: Complaint[] }>>({
        queryKey: ['resident-complaints'],
        queryFn: () => api.get('/resident/complaints'),
    });

    const createMutation = useMutation({
        mutationFn: (data: any) => api.post('/resident/complaints', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['resident-complaints'] });
            setShowForm(false);
            setSubject('');
            setDescription('');
        }
    });

    const complaints = complaintsData?.data?.data || [];

    const categories = [
        { id: 'trader_conduct', label: 'Trader Conduct', sw: 'Tabia ya Mfanyibiashara' },
        { id: 'product_quality', label: 'Product Quality', sw: 'Ubora wa Bidhaa' },
        { id: 'payment_dispute', label: 'Payment Dispute', sw: 'Tatizo la Malipo' },
        { id: 'cleanliness', label: 'Cleanliness', sw: 'Usafi wa Soko' },
        { id: 'security', label: 'Security', sw: 'Usalama' },
        { id: 'other', label: 'Other', sw: 'Lingine' }
    ];

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'open': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'in_review': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'resolved': return 'bg-green-100 text-green-700 border-green-200';
            case 'closed': return 'bg-neutral-100 text-neutral-500 border-neutral-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    return (
        <DashboardLayout title="Malilo Yangu (My Complaints)">
            <div className="space-y-6 pb-20">
                
                {/* 1. New Complaint CTA */}
                <div className="bg-green-950 p-8 rounded-[3rem] text-white shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16" />
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <h2 className="text-2xl font-black tracking-tight">Tueleze Matatizo</h2>
                            <p className="text-[10px] font-black uppercase tracking-widest text-brand-200">Submit a new complaint</p>
                        </div>
                        <button 
                            onClick={() => setShowForm(true)}
                            className="w-14 h-14 bg-brand-500 rounded-2xl flex items-center justify-center shadow-lg active:scale-95 transition-all"
                        >
                            <Plus size={32} />
                        </button>
                    </div>
                </div>

                {/* 2. Summary Stats */}
                <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white p-4 rounded-2xl border border-gray-100 text-center">
                        <p className="text-[9px] font-black text-text-muted uppercase tracking-widest mb-1">Total</p>
                        <h4 className="text-xl font-black text-green-950">{complaints.length}</h4>
                    </div>
                    <div className="bg-white p-4 rounded-2xl border border-gray-100 text-center">
                        <p className="text-[9px] font-black text-text-muted uppercase tracking-widest mb-1">Open</p>
                        <h4 className="text-xl font-black text-blue-600">{complaints.filter(c => c.status === 'open').length}</h4>
                    </div>
                    <div className="bg-white p-4 rounded-2xl border border-gray-100 text-center">
                        <p className="text-[9px] font-black text-text-muted uppercase tracking-widest mb-1">Resolved</p>
                        <h4 className="text-xl font-black text-brand-600">{complaints.filter(c => c.status === 'resolved').length}</h4>
                    </div>
                </div>

                {/* 3. Complaints List */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="text-xs font-black uppercase tracking-widest text-green-950">Historia ya Malilo</h3>
                        <Filter size={16} className="text-text-muted" />
                    </div>

                    <div className="space-y-4">
                        {isLoading ? (
                            <div className="py-20 flex justify-center">
                                <Loader2 className="animate-spin text-brand-600" />
                            </div>
                        ) : complaints.length > 0 ? (
                            complaints.map((c) => (
                                <motion.div 
                                    key={c.id}
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-brand-sm space-y-4"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-1">
                                            <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest border ${getStatusStyle(c.status)}`}>
                                                {c.status}
                                            </span>
                                            <h4 className="font-black text-green-950 text-sm leading-tight pt-1">{c.subject}</h4>
                                        </div>
                                        {c.priority > 1 && (
                                            <ShieldAlert size={18} className="text-red-500" />
                                        )}
                                    </div>
                                    <p className="text-xs text-text-secondary line-clamp-2 font-medium">
                                        {c.description}
                                    </p>
                                    <div className="pt-4 border-t border-dashed border-gray-100 flex items-center justify-between">
                                        <div className="flex items-center gap-1.5 text-text-muted">
                                            <Clock size={12} />
                                            <span className="text-[9px] font-black uppercase tracking-tight">
                                                {new Date(c.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-[9px] font-black text-text-muted uppercase tracking-tight">Category:</span>
                                            <span className="text-[9px] font-black text-brand-700 bg-brand-50 px-2 py-1 rounded-lg uppercase">
                                                {c.category.replace('_', ' ')}
                                            </span>
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        ) : (
                            <div className="py-20 text-center space-y-4 opacity-40">
                                <MessageSquare size={48} className="mx-auto" />
                                <p className="text-xs font-black uppercase tracking-widest">Hujawahi kutuma malilio bado</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* 4. New Complaint Bottom Sheet (Form) */}
            <AnimatePresence>
                {showForm && (
                    <>
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowForm(false)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
                        />
                        <motion.div 
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[3.5rem] p-8 pb-12 z-[101] shadow-2xl max-w-[480px] mx-auto w-full max-h-[90vh] overflow-y-auto no-scrollbar"
                        >
                            <div className="w-12 h-1.5 bg-neutral-100 rounded-full mx-auto mb-8" />
                            
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-2xl font-black text-green-950">Malilio Mapya</h3>
                                <button onClick={() => setShowForm(false)} className="w-10 h-10 bg-neutral-50 rounded-2xl flex items-center justify-center text-text-muted">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-text-muted uppercase tracking-widest pl-2">Jamii ya Malilio (Category)</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {categories.map((cat) => (
                                            <button
                                                key={cat.id}
                                                onClick={() => setCategory(cat.id)}
                                                className={`p-4 rounded-2xl border-2 text-left transition-all ${
                                                    category === cat.id 
                                                        ? 'bg-brand-50 border-brand-500 text-brand-700 shadow-brand-inner' 
                                                        : 'bg-white border-gray-100 text-text-muted'
                                                }`}
                                            >
                                                <p className="text-[9px] font-black uppercase tracking-tight block mb-0.5">{cat.label}</p>
                                                <p className="text-[10px] font-bold leading-tight">{cat.sw}</p>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-text-muted uppercase tracking-widest pl-2">Kichwa cha Habari (Subject)</label>
                                    <input 
                                        value={subject}
                                        onChange={(e) => setSubject(e.target.value)}
                                        className="w-full h-14 px-5 bg-neutral-50 rounded-2xl border-2 border-transparent focus:border-brand-500 focus:bg-white outline-none transition-all font-bold text-sm"
                                        placeholder="Mwanzo wa tatizo lako..."
                                    />
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-text-muted uppercase tracking-widest pl-2">Maelezo Kamili (Description)</label>
                                    <textarea 
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        rows={4}
                                        className="w-full p-5 bg-neutral-50 rounded-3xl border-2 border-transparent focus:border-brand-500 focus:bg-white outline-none transition-all font-medium text-sm resize-none"
                                        placeholder="Tueleze zaidi kuhusu tatizo lako (dakika 50+ herufi)..."
                                    />
                                    <p className="text-[9px] text-text-muted px-2">Min. 50 characters required.</p>
                                </div>

                                <div className="flex gap-4 items-start bg-blue-50 p-5 rounded-[2rem] border border-blue-100 mb-4">
                                    <Info className="text-blue-500 shrink-0" size={24} />
                                    <p className="text-[11px] text-blue-900 leading-relaxed font-bold uppercase tracking-tight pt-1">
                                        Malilio yako yataonekana na Market Admin pekee. Utapokea taarifa punde tu hatua ikichukuliwa.
                                    </p>
                                </div>

                                <button 
                                    disabled={createMutation.isPending || !subject || description.length < 50}
                                    onClick={() => createMutation.mutate({ category, subject, description })}
                                    className="w-full h-16 bg-green-950 text-white rounded-2xl flex items-center justify-center gap-3 text-sm font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
                                >
                                    {createMutation.isPending ? <Loader2 className="animate-spin" /> : <ShieldAlert size={20} />}
                                    Tuma Malilio (Submit)
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </DashboardLayout>
    );
}
