'use client';

import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useUIStore } from '@/store/uiStore';
import { 
    Users, 
    Search, 
    ShieldCheck,
    Store,
    MapPin,
    Star,
    ChevronRight,
    User,
    Phone,
    Activity,
    CheckCircle2,
    Clock,
    MoreHorizontal,
    MessageCircle,
    Send,
    ShoppingBag,
    Award,
    Ban,
    Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ApiResponse, Trader } from '@/types';
import { useTranslation } from '@/hooks/useTranslation';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useMutation } from '@tanstack/react-query';
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function AdminTradersPage() {
    const { t } = useTranslation();
    const { setPageTitle } = useUIStore();

    React.useEffect(() => {
        setPageTitle('Merchant Registry');
    }, [setPageTitle]);

    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [selectedMarketId, setSelectedMarketId] = useState<string>('');
    const [reviewTrader, setReviewTrader] = useState<Trader | null>(null);
    const [isReviewing, setIsReviewing] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [smsTrader, setSmsTrader] = useState<Trader | null>(null);
    const [smsMessage, setSmsMessage] = useState('');

    const queryClient = useQueryClient();

    React.useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(searchQuery);
        }, 300);
        return () => clearTimeout(handler);
    }, [searchQuery]);

    const { data: marketsData } = useQuery<any>({
        queryKey: ['admin-markets'],
        queryFn: () => api.get('/admin/markets'),
    });
    const markets: any[] = Array.isArray(marketsData) ? marketsData : (marketsData as any)?.data || [];

    const { data: tradersData, isLoading, isError, error } = useQuery<any>({
        queryKey: ['admin-traders', filterStatus, selectedMarketId, debouncedSearch],
        queryFn: () => {
            const params: Record<string, string> = {};
            if (filterStatus !== 'all') params.verification_status = filterStatus;
            if (selectedMarketId) params.market_id = selectedMarketId;
            if (debouncedSearch) params.search = debouncedSearch;
            return api.get('/admin/traders', { params });
        },
        retry: 1,
    });
    
    const traders: Trader[] = Array.isArray(tradersData) ? tradersData : (tradersData as any)?.data || [];

    const sendSmsMutation = useMutation({
        mutationFn: async ({ userId, message }: { userId: number; message: string }) => {
            return api.post(`/admin/users/${userId}/sms`, { message });
        },
        onSuccess: () => {
            toast.success('SMS sent successfully!');
            setSmsTrader(null);
            setSmsMessage('');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to send SMS');
        }
    });

    const verifyTraderMutation = useMutation({
        mutationFn: async ({ id, status, reason }: { id: number; status: string; reason?: string }) => {
            return api.post(`/admin/traders/${id}/verify`, { status, reason });
        },
        onSuccess: () => {
            toast.success('Merchant status updated');
            queryClient.invalidateQueries({ queryKey: ['admin-traders'] });
            setReviewTrader(null);
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Verification failed');
        }
    });

    const handleSendSms = () => {
        if (!smsMessage.trim() || !smsTrader) return;
        sendSmsMutation.mutate({ userId: smsTrader.user_id, message: smsMessage });
    };

    const stats = [
        { label: 'Active', value: traders.filter(t => t.verification_status === 'verified').length, icon: CheckCircle2, color: 'text-brand-600' },
        { label: 'Pending', value: traders.filter(t => t.verification_status === 'pending').length, icon: Clock, color: 'text-amber-600' },
        { label: 'Integrity', value: '4.8', icon: Star, color: 'text-blue-600' },
    ];

    return (
        <div className="pb-32 -mx-4 md:-mx-0">
            {/* ── Verification Vitality Matrix ── */}
            <div className="grid grid-cols-3 gap-2 px-4 mb-6">
                {stats.map((s, i) => (
                    <div key={i} className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center">
                        <span className={cn("text-[8px] font-black uppercase tracking-widest mb-1", s.color)}>{s.label}</span>
                        <div className="text-xl font-black text-green-950 tracking-tight">{s.value}</div>
                    </div>
                ))}
            </div>

            {/* ── Governance Controls ── */}
            <div className="px-4 mb-6 space-y-4">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative group flex-1">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-text-muted transition-colors group-focus-within:text-brand-500" size={18} />
                        <input 
                            type="text" 
                            placeholder="Search merchant or phone..." 
                            className="w-full h-14 pl-14 pr-6 bg-white border border-gray-100 rounded-2xl shadow-sm outline-none focus:ring-2 focus:ring-brand-500/10 focus:border-brand-500 transition-all font-medium text-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    
                    <div className="flex-1 md:max-w-xs relative group">
                        <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-text-muted transition-colors group-focus-within:text-brand-500" size={18} />
                        <select
                            value={selectedMarketId}
                            onChange={(e) => setSelectedMarketId(e.target.value)}
                            className="w-full h-14 pl-14 pr-6 bg-white border border-gray-100 rounded-2xl shadow-sm outline-none focus:ring-2 focus:ring-brand-500/10 focus:border-brand-500 transition-all font-medium text-sm appearance-none cursor-pointer"
                        >
                            <option value="">All Markets</option>
                            {markets.map((market: any) => (
                                <option key={market.id} value={market.id}>{market.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
                
                <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                    {['all', 'unverified', 'pending', 'verified', 'rejected'].map((status) => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={cn(
                                "px-5 h-10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border flex items-center justify-center gap-2",
                                filterStatus === status 
                                    ? "bg-gray-950 text-white border-transparent shadow-lg" 
                                    : "bg-white text-text-muted border-gray-100"
                            )}
                        >
                            {status === 'all' && <Activity size={12} />}
                            {status}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Merchant Ecosystem Grid ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-4">
                {isLoading ? (
                    <div className="p-10 text-center opacity-30 font-black uppercase tracking-widest text-[10px]">Auditing Registry...</div>
                ) : isError ? (
                    <div className="p-10 text-center text-rose-500">
                        <p className="font-black uppercase tracking-widest text-[10px]">Failed to load traders. Check API connection.</p>
                        <p className="text-[9px] mt-1 opacity-60">{String((error as any)?.message || '')}</p>
                    </div>
                ) : traders.length === 0 ? (
                    <div className="py-20 text-center opacity-40">
                        <Store size={48} className="mx-auto mb-4" />
                        <p className="text-xs font-black uppercase tracking-widest">No traders found</p>
                    </div>
                ) : (
                    traders.map((trader) => (
                        <motion.div 
                            key={trader.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-[2.5rem] border border-gray-50 shadow-sm overflow-hidden group hover:shadow-md transition-all flex flex-col"
                        >
                            <div 
                                className="p-6 cursor-pointer hover:bg-gray-50/30 transition-colors flex-1"
                                onClick={() => setReviewTrader(trader)}
                            >
                                <div className="flex items-start justify-between mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-brand-50 text-brand-600 rounded-2xl flex items-center justify-center shadow-inner shrink-0 overflow-hidden border border-brand-100">
                                            {trader.avatar_url ? (
                                                <img src={trader.avatar_url} className="w-full h-full object-cover" alt="" />
                                            ) : (
                                                <Store size={24} />
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="text-base font-black text-green-950 uppercase tracking-tight leading-none mb-1.5 truncate">{trader.business_name}</h3>
                                            <p className="text-[10px] font-black text-text-muted uppercase tracking-widest flex items-center gap-1.5 truncate">
                                                <User size={10} className="text-brand-500" /> {trader.user.name}
                                            </p>
                                        </div>
                                    </div>
                                    <div className={cn(
                                        "px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border shrink-0",
                                        trader.verification_status === 'verified' && "bg-green-50 text-green-700 border-green-100",
                                        trader.verification_status === 'pending' && "bg-amber-50 text-amber-700 border-amber-100",
                                        trader.verification_status === 'unverified' && "bg-slate-50 text-slate-700 border-slate-100",
                                        trader.verification_status === 'rejected' && "bg-rose-50 text-rose-700 border-rose-100"
                                    )}>
                                        {trader.verification_status}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 mb-6">
                                    <div className="bg-gray-50/50 p-3 rounded-2xl border border-gray-100">
                                        <span className="text-[8px] font-black text-text-muted uppercase tracking-widest mb-1 block">Location</span>
                                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-green-950">
                                            <MapPin size={10} className="text-brand-500 shrink-0" />
                                            <span className="truncate">{trader.market?.name || 'Unassigned'}</span>
                                        </div>
                                    </div>
                                    <div className="bg-gray-50/50 p-3 rounded-2xl border border-gray-100">
                                        <span className="text-[8px] font-black text-text-muted uppercase tracking-widest mb-1 block">Reviews</span>
                                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-green-950">
                                            <Star size={10} className="text-amber-500 shrink-0 fill-amber-500" />
                                            <span>{trader.average_rating} ({trader.total_reviews})</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* One-Handed Triage Hub */}
                            <div className="p-6 pt-0 flex gap-2">
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSmsTrader(trader);
                                    }}
                                    className="flex-1 h-12 bg-gray-950 text-white rounded-2xl font-black text-[9px] uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all"
                                >
                                    <MessageCircle size={14} /> SMS
                                </button>
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setReviewTrader(trader);
                                    }}
                                    className="flex-[1.5] h-12 bg-brand-50 text-brand-700 rounded-2xl font-black text-[9px] uppercase tracking-widest border border-brand-100 flex items-center justify-center gap-2 active:scale-95 transition-all"
                                >
                                    <ShieldCheck size={14} /> {trader.verification_status === 'pending' ? 'Review' : 'Re-audit'}
                                </button>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>

            {/* Sticky Operational Command */}
            <div className="fixed bottom-24 right-4 left-4 lg:hidden z-40">
                <button className="w-full h-16 bg-green-950 text-white rounded-3xl shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all border-4 border-white">
                    <div className="w-10 h-10 bg-brand-500 text-green-950 rounded-xl flex items-center justify-center">
                        <Users size={20} />
                    </div>
                    <span className="font-black text-xs uppercase tracking-[0.2em]">Onboard Merchant</span>
                </button>
            </div>

            {/* ── SMS Modal ── */}
            <Dialog open={!!smsTrader} onOpenChange={(open) => !open && setSmsTrader(null)}>
                <DialogContent className="sm:max-w-md bg-white p-0 overflow-hidden rounded-[2rem] border-none shadow-2xl">
                    <DialogHeader className="p-8 pb-4">
                        <DialogTitle className="text-xl font-black text-green-950 uppercase tracking-tight flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600">
                                <MessageCircle size={20} />
                            </div>
                            Message {smsTrader?.business_name?.split(' ')[0]}
                        </DialogTitle>
                        <DialogDescription className="text-xs font-bold text-text-muted uppercase tracking-widest mt-1">
                            Direct communication with merchant
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="p-8 pt-2">
                        <div className="mb-6">
                            <label className="block text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-3">Your Message</label>
                            <Textarea 
                                placeholder="Write your message here..."
                                value={smsMessage}
                                onChange={(e) => setSmsMessage(e.target.value)}
                                className="min-h-[120px] rounded-2xl border-gray-100 bg-gray-50 font-bold focus:border-brand-300 focus:ring-0 transition-all resize-none"
                                maxLength={160}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <Button variant="outline" onClick={() => setSmsTrader(null)} className="h-12 rounded-2xl border-gray-100 text-[10px] font-black uppercase tracking-widest">Cancel</Button>
                            <Button onClick={handleSendSms} disabled={sendSmsMutation.isPending || !smsMessage.trim()} className="h-12 rounded-2xl bg-green-950 hover:bg-green-900 text-white text-[10px] font-black uppercase tracking-widest gap-2 shadow-lg">
                                {sendSmsMutation.isPending ? 'Sending...' : <><Send size={14} /> Send SMS</>}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
            {/* ── KYC Review Modal ── */}
            <AnimatePresence>
                {reviewTrader && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setReviewTrader(null)}
                            className="absolute inset-0 bg-green-950/40 backdrop-blur-md"
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-2xl bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            <div className="p-8 border-b border-gray-100 flex items-center justify-between">
                                <div>
                                    <h3 className="text-2xl font-black text-green-950 uppercase tracking-tighter">KYC Audit</h3>
                                    <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mt-1">Reviewing: {reviewTrader.business_name}</p>
                                </div>
                                <div className={cn(
                                    "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border",
                                    reviewTrader.stall_type === 'independent' ? "bg-amber-50 text-amber-700 border-amber-100" : "bg-brand-50 text-brand-700 border-brand-100"
                                )}>
                                    {reviewTrader.stall_type || 'managed'} Stall
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar">
                                {/* Identity Documents */}
                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Identity Documents</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <p className="text-[9px] font-black text-text-muted uppercase tracking-widest text-center">National ID Front</p>
                                            <div className="aspect-[1.6/1] bg-gray-100 rounded-2xl overflow-hidden border border-gray-200 group relative">
                                                {reviewTrader.id_front_url ? (
                                                    <img src={reviewTrader.id_front_url} alt="ID Front" className="w-full h-full object-cover transition-transform group-hover:scale-110 cursor-zoom-in" onClick={() => window.open(reviewTrader.id_front_url, '_blank')} />
                                                ) : (
                                                    <div className="flex items-center justify-center h-full text-text-muted text-[10px] font-black uppercase">Not Uploaded</div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-[9px] font-black text-text-muted uppercase tracking-widest text-center">National ID Back</p>
                                            <div className="aspect-[1.6/1] bg-gray-100 rounded-2xl overflow-hidden border border-gray-200 group relative">
                                                {reviewTrader.id_back_url ? (
                                                    <img src={reviewTrader.id_back_url} alt="ID Back" className="w-full h-full object-cover transition-transform group-hover:scale-110 cursor-zoom-in" onClick={() => window.open(reviewTrader.id_back_url, '_blank')} />
                                                ) : (
                                                    <div className="flex items-center justify-center h-full text-text-muted text-[10px] font-black uppercase">Not Uploaded</div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Rejection Field */}
                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Compliance Notes</h4>
                                    <textarea 
                                        placeholder="Enter reason for rejection if applicable..."
                                        className="w-full h-32 p-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-brand-500/10 focus:border-brand-500 transition-all resize-none"
                                        value={rejectionReason}
                                        onChange={(e) => setRejectionReason(e.target.value)}
                                    />
                                </div>
                            </div>

                                {(!reviewTrader.id_front_url || !reviewTrader.id_back_url) && (
                                    <div className="mx-8 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3">
                                        <div className="w-8 h-8 bg-rose-100 text-rose-600 rounded-lg flex items-center justify-center shrink-0">
                                            <ShieldCheck size={18} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-rose-700 uppercase tracking-widest">Incomplete Profile</p>
                                            <p className="text-[11px] font-medium text-rose-600/80 leading-tight mt-0.5">This merchant has not uploaded their National ID documents. Verification is disabled.</p>
                                        </div>
                                    </div>
                                )}

                                <div className="p-8 bg-gray-50/50 border-t border-gray-100 flex gap-3">
                                    <button 
                                        disabled={isReviewing}
                                        onClick={async () => {
                                            if(!rejectionReason) {
                                                alert('Please provide a reason for rejection');
                                                return;
                                            }
                                            setIsReviewing(true);
                                            try {
                                                await api.post(`/admin/traders/${reviewTrader.id}/verify`, { 
                                                    status: 'rejected',
                                                    reason: rejectionReason 
                                                });
                                                setReviewTrader(null);
                                                window.location.reload();
                                            } catch (e) {
                                                console.error(e);
                                            } finally {
                                                // setIsReviewing(false);
                                            }
                                        }}
                                        className="flex-1 h-14 bg-white text-rose-600 border border-rose-100 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-50 transition-all disabled:opacity-50"
                                    >
                                        Reject Application
                                    </button>
                                    <button 
                                        disabled={verifyTraderMutation.isPending || !reviewTrader.id_front_url || !reviewTrader.id_back_url}
                                        onClick={() => {
                                            verifyTraderMutation.mutate({ id: reviewTrader.id, status: 'verified' });
                                        }}
                                        className="flex-[2] h-14 bg-brand-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-brand-200 hover:bg-brand-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {verifyTraderMutation.isPending ? <Loader2 className="animate-spin" size={16} /> : <ShieldCheck size={16} />}
                                        Approve & Verify
                                    </button>
                                </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
