'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, User, Shield, ShoppingBag, Home, Ban, CheckCircle2,
    Phone, MessageCircle, SearchX, UserPlus, Send, Truck,
    Clock, XCircle, ShieldCheck, FileText, Eye, ChevronRight
} from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const ROLES = ['all', 'admin', 'trader', 'resident', 'delivery'] as const;

export default function AdminUsersPage() {
    const { setPageTitle } = useUIStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [activeRole, setActiveRole] = useState('all');
    const [activeTab, setActiveTab] = useState<'registry' | 'riders'>('registry');
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [smsUser, setSmsUser] = useState<any>(null);
    const [smsMessage, setSmsMessage] = useState('');
    const [rejectRider, setRejectRider] = useState<any>(null);
    const [rejectReason, setRejectReason] = useState('');
    const [riderStatusFilter, setRiderStatusFilter] = useState('all');
    const queryClient = useQueryClient();

    React.useEffect(() => { setPageTitle('Community Registry'); }, [setPageTitle]);
    React.useEffect(() => {
        const h = setTimeout(() => setDebouncedSearch(searchQuery), 300);
        return () => clearTimeout(h);
    }, [searchQuery]);

    /* ── Users query ── */
    const { data: usersRaw, isLoading } = useQuery({
        queryKey: ['admin-users', activeRole, debouncedSearch],
        queryFn: async () => {
            const params: Record<string, string> = {};
            if (activeRole !== 'all') params.role = activeRole;
            if (debouncedSearch) params.search = debouncedSearch;
            return api.get('/admin/users', { params }).then(r => r.data);
        },
    });
    const users: any[] = Array.isArray(usersRaw) ? usersRaw : (usersRaw as any)?.data || [];

    /* ── Delivery Riders KYC query ── */
    const { data: ridersRaw, isLoading: ridersLoading } = useQuery({
        queryKey: ['admin-delivery-riders', riderStatusFilter],
        queryFn: async () => {
            const params: Record<string, string> = {};
            if (riderStatusFilter !== 'all') params.status = riderStatusFilter;
            return api.get('/admin/delivery-riders', { params }).then(r => r.data);
        },
        enabled: activeTab === 'riders',
    });
    const riders: any[] = Array.isArray(ridersRaw) ? ridersRaw : (ridersRaw as any)?.data || [];
    const riderCounts = (ridersRaw as any)?.counts || {};

    /* ── Mutations ── */
    const smsMutation = useMutation({
        mutationFn: ({ userId, message }: { userId: number; message: string }) =>
            api.post(`/admin/users/${userId}/sms`, { message }),
        onSuccess: () => { toast.success('SMS sent!'); setSmsUser(null); setSmsMessage(''); },
        onError: (e: any) => toast.error(e.response?.data?.message || 'SMS failed'),
    });

    const verifyMutation = useMutation({
        mutationFn: (profileId: number) => api.patch(`/admin/delivery-riders/${profileId}/verify`),
        onSuccess: () => { toast.success('Rider KYC approved!'); queryClient.invalidateQueries({ queryKey: ['admin-delivery-riders'] }); },
        onError: (e: any) => toast.error(e.response?.data?.message || 'Failed'),
    });

    const rejectMutation = useMutation({
        mutationFn: ({ id, reason }: { id: number; reason: string }) =>
            api.patch(`/admin/delivery-riders/${id}/reject`, { reason }),
        onSuccess: () => {
            toast.success('Rider KYC rejected. They have been notified.');
            queryClient.invalidateQueries({ queryKey: ['admin-delivery-riders'] });
            setRejectRider(null); setRejectReason('');
        },
        onError: (e: any) => toast.error(e.response?.data?.message || 'Failed'),
    });

    const getRoleStyles = (role: string) => ({
        admin: 'bg-purple-50 text-purple-700 border-purple-100',
        trader: 'bg-brand-50 text-brand-700 border-brand-100',
        resident: 'bg-blue-50 text-blue-700 border-blue-100',
        delivery: 'bg-orange-50 text-orange-700 border-orange-100',
    }[role] || 'bg-gray-50 text-gray-600 border-gray-100');

    const kycBadge = (status: string) => ({
        not_submitted: { label: 'Not Submitted', cls: 'bg-gray-100 text-gray-600' },
        pending: { label: 'Under Review', cls: 'bg-amber-100 text-amber-700' },
        verified: { label: 'Verified', cls: 'bg-green-100 text-green-700' },
        rejected: { label: 'Rejected', cls: 'bg-red-100 text-red-700' },
    }[status] || { label: status, cls: 'bg-gray-100 text-gray-600' });

    const stats = [
        { label: 'Admins', count: users.filter(u => u.role === 'admin').length, color: 'text-purple-600', icon: Shield },
        { label: 'Traders', count: users.filter(u => u.role === 'trader').length, color: 'text-brand-600', icon: ShoppingBag },
        { label: 'Residents', count: users.filter(u => u.role === 'resident').length, color: 'text-blue-600', icon: Home },
        { label: 'Riders', count: users.filter(u => u.role === 'delivery').length, color: 'text-orange-600', icon: Truck },
    ];

    return (
        <div className="pb-32 -mx-4 md:-mx-0">
            {/* Stats */}
            <div className="grid grid-cols-4 gap-2 px-4 mb-6">
                {stats.map((s, i) => (
                    <div key={i} className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center">
                        <s.icon size={12} className={cn('mb-1', s.color)} />
                        <span className={cn('text-[8px] font-black uppercase tracking-widest mb-1', s.color)}>{s.label}</span>
                        <div className="text-xl font-black text-green-950">{isLoading ? '…' : s.count}</div>
                    </div>
                ))}
            </div>

            {/* Tab switch */}
            <div className="px-4 mb-6">
                <div className="flex gap-2 p-1 bg-gray-100 rounded-2xl">
                    <button
                        onClick={() => setActiveTab('registry')}
                        className={cn('flex-1 h-10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all',
                            activeTab === 'registry' ? 'bg-white shadow text-green-950' : 'text-text-muted')}
                    >
                        User Registry
                    </button>
                    <button
                        onClick={() => setActiveTab('riders')}
                        className={cn('flex-1 h-10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2',
                            activeTab === 'riders' ? 'bg-white shadow text-green-950' : 'text-text-muted')}
                    >
                        Rider KYC
                        {riderCounts.pending > 0 && (
                            <span className="px-1.5 py-0.5 bg-amber-500 text-white text-[8px] font-black rounded-full">{riderCounts.pending}</span>
                        )}
                    </button>
                </div>
            </div>

            {/* ── USER REGISTRY TAB ── */}
            {activeTab === 'registry' && (
                <>
                    {/* Role Filter */}
                    <div className="px-4 mb-4">
                        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                            {ROLES.map(role => (
                                <button key={role} onClick={() => setActiveRole(role)}
                                    className={cn('flex-shrink-0 px-5 h-10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all',
                                        activeRole === role ? 'bg-gray-900 text-white shadow-xl' : 'bg-white text-text-muted border border-gray-100'
                                    )}>
                                    {role}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Search */}
                    <div className="px-4 mb-8">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                            <input type="text" placeholder="Search name, phone or email…"
                                value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                                className="w-full h-12 pl-12 pr-4 bg-white border border-gray-100 rounded-2xl text-sm font-bold shadow-sm outline-none focus:border-brand-300" />
                        </div>
                    </div>

                    {/* Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-4">
                        {isLoading ? [1, 2, 3].map(i => <div key={i} className="h-40 bg-gray-100 rounded-[2.5rem] animate-pulse" />) :
                            users.length === 0 ? (
                                <div className="py-20 text-center opacity-40 col-span-3">
                                    <SearchX size={48} className="mx-auto mb-4" />
                                    <p className="text-xs font-black uppercase tracking-widest">No matching users</p>
                                </div>
                            ) : (
                                <AnimatePresence>
                                    {users.map((u: any) => (
                                        <motion.div key={u.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                            className="bg-white rounded-[2.5rem] border border-gray-50 shadow-sm overflow-hidden">
                                            <div className="p-6 cursor-pointer hover:bg-gray-50/50 transition-colors" onClick={() => setSelectedUser(u)}>
                                                <div className="flex items-start justify-between mb-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className={cn('w-14 h-14 rounded-2xl flex items-center justify-center border-2 shrink-0',
                                                            u.role === 'trader' ? 'bg-green-50 border-brand-200 text-brand-600' :
                                                                u.role === 'admin' ? 'bg-purple-50 border-purple-200 text-purple-600' :
                                                                    u.role === 'delivery' ? 'bg-orange-50 border-orange-200 text-orange-600' :
                                                                        'bg-blue-50 border-blue-200 text-blue-600')}>
                                                            {u.avatar_url ? <img src={u.avatar_url} className="w-full h-full object-cover rounded-xl" alt="" /> :
                                                                u.role === 'delivery' ? <Truck size={24} /> : <User size={28} />}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <h3 className="text-base font-black text-green-950 uppercase tracking-tight truncate">{u.name}</h3>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <span className={cn('px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border', getRoleStyles(u.role))}>{u.role}</span>
                                                                {u.phone_verified && <span className="bg-green-100 text-green-700 p-0.5 rounded-full"><CheckCircle2 size={10} /></span>}
                                                                {/* KYC badge for riders */}
                                                                {u.role === 'delivery' && u.rider_profile && (
                                                                    <span className={cn('px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest', kycBadge(u.rider_profile.verification_status).cls)}>
                                                                        {kycBadge(u.rider_profile.verification_status).label}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-3 mt-4">
                                                    <a href={`tel:${u.phone}`} onClick={e => e.stopPropagation()}
                                                        className="h-11 bg-gray-950 text-white rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest">
                                                        <Phone size={14} /> Call
                                                    </a>
                                                    <button onClick={e => { e.stopPropagation(); setSmsUser(u); }}
                                                        className="h-11 bg-brand-50 text-brand-700 rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest">
                                                        <MessageCircle size={14} /> SMS
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="bg-gray-50 px-6 py-3 flex justify-between items-center border-t border-gray-100">
                                                <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Joined {new Date(u.created_at).toLocaleDateString()}</span>
                                                <ChevronRight size={14} className="text-text-muted" />
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            )}
                    </div>
                </>
            )}

            {/* ── RIDER KYC TAB ── */}
            {activeTab === 'riders' && (
                <>
                    {/* KYC Status Filter */}
                    <div className="px-4 mb-6">
                        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                            {['all', 'not_submitted', 'pending', 'verified', 'rejected'].map(s => (
                                <button key={s} onClick={() => setRiderStatusFilter(s)}
                                    className={cn('flex-shrink-0 px-4 h-10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2',
                                        riderStatusFilter === s ? 'bg-gray-900 text-white shadow-xl' : 'bg-white text-text-muted border border-gray-100')}>
                                    {s.replace('_', ' ')}
                                    {s !== 'all' && riderCounts[s] > 0 && (
                                        <span className={cn('px-1.5 py-0.5 rounded-full text-[8px] font-black',
                                            riderStatusFilter === s ? 'bg-white/20' : 'bg-gray-100')}>
                                            {riderCounts[s]}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Rider Cards */}
                    <div className="px-4 space-y-4">
                        {ridersLoading ? [1, 2, 3].map(i => <div key={i} className="h-48 bg-gray-100 rounded-[2.5rem] animate-pulse" />) :
                            riders.length === 0 ? (
                                <div className="py-20 text-center opacity-40">
                                    <Truck size={48} className="mx-auto mb-4" />
                                    <p className="text-xs font-black uppercase tracking-widest">No riders found</p>
                                </div>
                            ) : riders.map((r: any) => {
                                const badge = kycBadge(r.verification_status);
                                return (
                                    <motion.div key={r.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                        className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                                        <div className="p-6">
                                            <div className="flex items-start gap-4 mb-5">
                                                <div className="w-14 h-14 bg-orange-50 border-2 border-orange-200 rounded-2xl flex items-center justify-center text-orange-600 shrink-0">
                                                    {r.avatar_url ? <img src={r.avatar_url} className="w-full h-full object-cover rounded-xl" alt="" /> : <Truck size={24} />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="text-base font-black text-green-950 uppercase tracking-tight truncate">{r.name}</h3>
                                                    <p className="text-xs font-bold text-text-muted">{r.phone}</p>
                                                    <div className="flex items-center gap-2 mt-1.5">
                                                        <span className={cn('px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest', badge.cls)}>{badge.label}</span>
                                                        <span className="text-[8px] font-bold text-text-muted uppercase">{r.vehicle_type}</span>
                                                        {r.license_plate && <span className="text-[8px] font-black text-green-950 bg-gray-100 px-2 py-0.5 rounded">{r.license_plate}</span>}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Document Previews */}
                                            {(r.id_document_url || r.license_image_url) && (
                                                <div className="grid grid-cols-2 gap-3 mb-5">
                                                    {r.id_document_url && (
                                                        <a href={r.id_document_url} target="_blank" rel="noreferrer"
                                                            className="h-24 bg-gray-50 border border-gray-100 rounded-2xl overflow-hidden flex items-center justify-center group">
                                                            <img src={r.id_document_url} alt="National ID" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                                        </a>
                                                    )}
                                                    {r.license_image_url && (
                                                        <a href={r.license_image_url} target="_blank" rel="noreferrer"
                                                            className="h-24 bg-gray-50 border border-gray-100 rounded-2xl overflow-hidden flex items-center justify-center group">
                                                            <img src={r.license_image_url} alt="Licence" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                                        </a>
                                                    )}
                                                </div>
                                            )}

                                            {!r.id_document_url && !r.license_image_url && (
                                                <div className="mb-5 p-4 bg-gray-50 rounded-2xl flex items-center gap-3 border border-dashed border-gray-200">
                                                    <FileText size={16} className="text-text-muted shrink-0" />
                                                    <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">No documents uploaded yet</p>
                                                </div>
                                            )}

                                            {/* KYC Actions */}
                                            {r.verification_status === 'pending' && (
                                                <div className="grid grid-cols-2 gap-3">
                                                    <button
                                                        onClick={() => verifyMutation.mutate(r.id)}
                                                        disabled={verifyMutation.isPending}
                                                        className="h-12 bg-green-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50">
                                                        <ShieldCheck size={14} /> Approve KYC
                                                    </button>
                                                    <button
                                                        onClick={() => setRejectRider(r)}
                                                        className="h-12 bg-red-50 text-red-600 border border-red-100 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all">
                                                        <XCircle size={14} /> Reject
                                                    </button>
                                                </div>
                                            )}
                                            {r.verification_status === 'verified' && (
                                                <div className="flex items-center justify-between p-3 bg-green-50 rounded-2xl">
                                                    <span className="flex items-center gap-2 text-[10px] font-black text-green-700 uppercase tracking-widest">
                                                        <ShieldCheck size={14} /> KYC Approved
                                                    </span>
                                                    <button onClick={() => setRejectRider(r)}
                                                        className="text-[9px] font-black text-red-500 uppercase tracking-widest">
                                                        Revoke
                                                    </button>
                                                </div>
                                            )}
                                            {r.kyc_submitted_at && (
                                                <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest mt-3">
                                                    Submitted: {new Date(r.kyc_submitted_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                                                </p>
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            })}
                    </div>
                </>
            )}

            {/* ── SMS Modal ── */}
            <Dialog open={!!smsUser} onOpenChange={o => !o && setSmsUser(null)}>
                <DialogContent className="sm:max-w-md bg-white p-0 overflow-hidden rounded-[2rem] border-none shadow-2xl">
                    <DialogHeader className="p-8 pb-4">
                        <DialogTitle className="text-xl font-black text-green-950 uppercase tracking-tight flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600">
                                <MessageCircle size={20} />
                            </div>
                            SMS to {smsUser?.name?.split(' ')[0]}
                        </DialogTitle>
                        <DialogDescription className="text-xs font-bold text-text-muted uppercase tracking-widest mt-1">
                            Direct message via Africa&apos;s Talking
                        </DialogDescription>
                    </DialogHeader>
                    <div className="p-8 pt-2 space-y-4">
                        <Textarea placeholder="Write your message…" value={smsMessage}
                            onChange={e => setSmsMessage(e.target.value)} maxLength={160}
                            className="min-h-[120px] rounded-2xl border-gray-100 bg-gray-50 font-bold resize-none" />
                        <div className="grid grid-cols-2 gap-4">
                            <Button variant="outline" onClick={() => setSmsUser(null)} className="h-12 rounded-2xl">Cancel</Button>
                            <Button onClick={() => smsMutation.mutate({ userId: smsUser.id, message: smsMessage })}
                                disabled={smsMutation.isPending || !smsMessage.trim()}
                                className="h-12 rounded-2xl bg-green-950 text-white gap-2">
                                <Send size={14} /> {smsMutation.isPending ? 'Sending…' : 'Send SMS'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* ── Reject Rider Modal ── */}
            <Dialog open={!!rejectRider} onOpenChange={o => !o && setRejectRider(null)}>
                <DialogContent className="sm:max-w-md bg-white p-0 overflow-hidden rounded-[2rem] border-none shadow-2xl">
                    <DialogHeader className="p-8 pb-4">
                        <DialogTitle className="text-xl font-black text-green-950 uppercase tracking-tight flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-600">
                                <XCircle size={20} />
                            </div>
                            Reject KYC — {rejectRider?.name?.split(' ')[0]}
                        </DialogTitle>
                        <DialogDescription className="text-xs font-bold text-text-muted uppercase tracking-widest mt-1">
                            The rider will be notified with the reason below
                        </DialogDescription>
                    </DialogHeader>
                    <div className="p-8 pt-2 space-y-4">
                        <Textarea placeholder="State the rejection reason clearly…" value={rejectReason}
                            onChange={e => setRejectReason(e.target.value)} maxLength={500}
                            className="min-h-[100px] rounded-2xl border-gray-100 bg-gray-50 font-bold resize-none" />
                        <div className="grid grid-cols-2 gap-4">
                            <Button variant="outline" onClick={() => setRejectRider(null)} className="h-12 rounded-2xl">Cancel</Button>
                            <Button onClick={() => rejectMutation.mutate({ id: rejectRider.id, reason: rejectReason })}
                                disabled={rejectMutation.isPending || !rejectReason.trim()}
                                className="h-12 rounded-2xl bg-red-600 hover:bg-red-700 text-white gap-2">
                                {rejectMutation.isPending ? 'Rejecting…' : 'Confirm Reject'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
