'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Search, 
    Filter, 
    Download, 
    MoreHorizontal, 
    User, 
    Shield, 
    ShoppingBag, 
    Home,
    Ban,
    CheckCircle2,
    Mail,
    Phone,
    MessageCircle,
    ChevronRight,
    SearchX,
    UserPlus,
    X,
    Send
} from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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

export default function AdminUsersPage() {
    const { setPageTitle } = useUIStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [activeRole, setActiveRole] = useState('all');
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [smsUser, setSmsUser] = useState<any>(null);
    const [smsMessage, setSmsMessage] = useState('');
    const queryClient = useQueryClient();

    React.useEffect(() => {
        setPageTitle('Community Registry');
    }, [setPageTitle]);

    React.useEffect(() => {
        const handler = setTimeout(() => setDebouncedSearch(searchQuery), 300);
        return () => clearTimeout(handler);
    }, [searchQuery]);

    const { data: usersRaw, isLoading } = useQuery({
        queryKey: ['admin-users', activeRole, debouncedSearch],
        queryFn: async () => {
            const params: Record<string, string> = {};
            if (activeRole !== 'all') params.role = activeRole;
            if (debouncedSearch) params.search = debouncedSearch;
            const response = await api.get('/admin/users', { params });
            return response.data;
        },
    });

    const sendSmsMutation = useMutation({
        mutationFn: async ({ userId, message }: { userId: number; message: string }) => {
            return api.post(`/admin/users/${userId}/sms`, { message });
        },
        onSuccess: () => {
            toast.success('SMS sent successfully!');
            setSmsUser(null);
            setSmsMessage('');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to send SMS');
        }
    });

    const handleSendSms = () => {
        if (!smsMessage.trim()) {
            toast.error('Please enter a message');
            return;
        }
        sendSmsMutation.mutate({ userId: smsUser.id, message: smsMessage });
    };

    const users: any[] = Array.isArray(usersRaw) ? usersRaw : (usersRaw as any)?.data || [];

    const stats = [
        { label: 'Admins', count: users.filter((u: any) => u.role === 'admin').length, color: 'text-purple-600', icon: Shield },
        { label: 'Traders', count: users.filter((u: any) => u.role === 'trader').length, color: 'text-brand-600', icon: ShoppingBag },
        { label: 'Residents', count: users.filter((u: any) => u.role === 'resident').length, color: 'text-blue-600', icon: Home },
    ];

    const getRoleStyles = (role: string) => {
        switch (role) {
            case 'admin': return 'bg-purple-50 text-purple-700 border-purple-100';
            case 'trader': return 'bg-brand-50 text-brand-700 border-brand-100';
            case 'resident': return 'bg-blue-50 text-blue-700 border-blue-100';
            default: return 'bg-gray-50 text-gray-600 border-gray-100';
        }
    };

    return (
        <div className="pb-32 -mx-4 md:-mx-0">
            {/* ── Demographic Matrix ── */}
            <div className="grid grid-cols-3 gap-2 px-4 mb-6">
                {stats.map((s, i) => (
                    <div key={i} className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center">
                        <s.icon size={12} className={cn("mb-1", s.color)} />
                        <span className={cn("text-[8px] font-black uppercase tracking-widest mb-1", s.color)}>{s.label}</span>
                        <div className="text-xl font-black text-green-950 tracking-tight">{isLoading ? '...' : s.count}</div>
                    </div>
                ))}
            </div>

            {/* ── Role Filter (Scrollable) ── */}
            <div className="px-4 mb-6">
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                    {['all', 'admin', 'trader', 'resident'].map((role) => (
                        <button
                            key={role}
                            onClick={() => setActiveRole(role)}
                            className={cn(
                                "flex-shrink-0 px-5 h-10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                activeRole === role 
                                    ? 'bg-gray-900 text-white shadow-xl' 
                                    : 'bg-white text-text-muted border border-gray-100'
                            )}
                        >
                            {role}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Search Bar ── */}
            <div className="px-4 mb-8">
                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                    <input 
                        type="text"
                        placeholder="Search name or ID number..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-12 pl-12 pr-4 bg-white border border-gray-100 rounded-2xl text-sm font-bold shadow-sm outline-none focus:border-brand-300"
                    />
                </div>
            </div>

            {/* ── User Registry Grid ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-4">
                {isLoading ? (
                    [1, 2, 3].map(i => <div key={i} className="h-40 bg-gray-100 rounded-[2.5rem] animate-pulse" />)
                ) : users.length === 0 ? (
                    <div className="py-20 text-center opacity-40">
                        <SearchX size={48} className="mx-auto mb-4" />
                        <p className="text-xs font-black uppercase tracking-widest">No matching users</p>
                    </div>
                ) : (
                    <AnimatePresence>
                        {users.map((u: any) => (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                key={u.id}
                                className="bg-white rounded-[2.5rem] border border-gray-50 shadow-sm overflow-hidden"
                            >
                                <div 
                                    className="p-6 cursor-pointer hover:bg-gray-50/50 transition-colors"
                                    onClick={() => setSelectedUser(u)}
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-4">
                                            <div className={cn(
                                                "w-14 h-14 rounded-2xl flex items-center justify-center border-2 shrink-0",
                                                u.role === 'trader' ? 'bg-green-50 border-brand-200 text-brand-600' : 
                                                u.role === 'admin' ? 'bg-purple-50 border-purple-200 text-purple-600' : 
                                                'bg-blue-50 border-blue-200 text-blue-600'
                                            )}>
                                                {u.avatar_url ? (
                                                    <img src={u.avatar_url} className="w-full h-full object-cover rounded-xl" alt="" />
                                                ) : (
                                                    <User size={28} />
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className="text-base font-black text-green-950 uppercase tracking-tight truncate">{u.name}</h3>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className={cn(
                                                        "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border",
                                                        getRoleStyles(u.role)
                                                    )}>
                                                        {u.role}
                                                    </span>
                                                    {u.phone_verified && (
                                                        <span className="bg-green-100 text-green-700 p-0.5 rounded-full">
                                                            <CheckCircle2 size={10} />
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                // Handle more options
                                            }}
                                            className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-text-muted hover:bg-gray-100"
                                        >
                                            <MoreHorizontal size={20} />
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 mt-6">
                                        <a 
                                            href={`tel:${u.phone}`} 
                                            onClick={(e) => e.stopPropagation()}
                                            className="h-11 bg-gray-950 text-white rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all"
                                        >
                                            <Phone size={14} /> Call
                                        </a>
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSmsUser(u);
                                            }}
                                            className="h-11 bg-brand-50 text-brand-700 rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all"
                                        >
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

            {/* ── Add User Floating Action ── */}
            <button className="fixed bottom-24 right-4 w-14 h-14 bg-green-950 text-white rounded-full shadow-2xl flex items-center justify-center active:scale-90 transition-all z-40 border-4 border-white">
                <UserPlus size={24} />
            </button>

            {/* ── SMS Modal ── */}
            <Dialog open={!!smsUser} onOpenChange={(open) => !open && setSmsUser(null)}>
                <DialogContent className="sm:max-w-md bg-white p-0 overflow-hidden rounded-[2rem] border-none shadow-2xl">
                    <DialogHeader className="p-8 pb-4">
                        <DialogTitle className="text-xl font-black text-green-950 uppercase tracking-tight flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600">
                                <MessageCircle size={20} />
                            </div>
                            Send SMS to {smsUser?.name?.split(' ')[0]}
                        </DialogTitle>
                        <DialogDescription className="text-xs font-bold text-text-muted uppercase tracking-widest mt-1">
                            Direct communication via Africa's Talking
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
                            <div className="flex justify-end mt-2">
                                <span className={cn(
                                    "text-[10px] font-black uppercase tracking-widest",
                                    smsMessage.length > 150 ? "text-red-500" : "text-text-muted"
                                )}>
                                    {smsMessage.length}/160
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <Button 
                                variant="outline" 
                                onClick={() => setSmsUser(null)}
                                className="h-12 rounded-2xl border-gray-100 text-[10px] font-black uppercase tracking-widest"
                            >
                                Cancel
                            </Button>
                            <Button 
                                onClick={handleSendSms}
                                disabled={sendSmsMutation.isPending || !smsMessage.trim()}
                                className="h-12 rounded-2xl bg-green-950 hover:bg-green-900 text-white text-[10px] font-black uppercase tracking-widest gap-2 shadow-lg"
                            >
                                {sendSmsMutation.isPending ? 'Sending...' : (
                                    <>
                                        <Send size={14} /> Send SMS
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* ── User Details Modal ── */}
            <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
                <DialogContent className="sm:max-w-lg bg-white p-0 overflow-hidden rounded-[2.5rem] border-none shadow-2xl">
                    <div className="h-32 bg-[#0A2E1A] relative">
                        <div className="absolute -bottom-10 left-8">
                            <div className="w-24 h-24 rounded-3xl bg-white p-1 shadow-xl">
                                <div className={cn(
                                    "w-full h-full rounded-2xl flex items-center justify-center border-2",
                                    selectedUser?.role === 'trader' ? 'bg-green-50 border-brand-200 text-brand-600' : 
                                    selectedUser?.role === 'admin' ? 'bg-purple-50 border-purple-200 text-purple-600' : 
                                    'bg-blue-50 border-blue-200 text-blue-600'
                                )}>
                                    {selectedUser?.avatar_url ? (
                                        <img src={selectedUser.avatar_url} className="w-full h-full object-cover rounded-xl" alt="" />
                                    ) : (
                                        <User size={40} />
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="p-8 pt-14">
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h2 className="text-2xl font-black text-green-950 uppercase tracking-tight">{selectedUser?.name}</h2>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className={cn(
                                        "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                                        getRoleStyles(selectedUser?.role || '')
                                    )}>
                                        {selectedUser?.role}
                                    </span>
                                    {selectedUser?.phone_verified && (
                                        <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                                            <CheckCircle2 size={10} />
                                            <span className="text-[8px] font-black uppercase tracking-widest">Verified</span>
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">User ID</p>
                                <p className="text-sm font-black text-green-950">#SM-{selectedUser?.id?.toString().padStart(4, '0')}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-8">
                            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                                <div className="flex items-center gap-3 text-text-muted mb-2">
                                    <Phone size={14} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Phone Number</span>
                                </div>
                                <p className="text-sm font-bold text-green-950">{selectedUser?.phone}</p>
                            </div>
                            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                                <div className="flex items-center gap-3 text-text-muted mb-2">
                                    <Mail size={14} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Email Address</span>
                                </div>
                                <p className="text-sm font-bold text-green-950 truncate">{selectedUser?.email || 'N/A'}</p>
                            </div>
                        </div>

                        <div className="space-y-3 mb-10">
                            <div className="flex items-center justify-between p-4 rounded-2xl border border-gray-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-text-muted">
                                        <CheckCircle2 size={16} />
                                    </div>
                                    <span className="text-xs font-black text-green-950 uppercase tracking-tight">Status</span>
                                </div>
                                <span className={cn(
                                    "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                                    selectedUser?.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                                )}>
                                    {selectedUser?.status}
                                </span>
                            </div>
                            <div className="flex items-center justify-between p-4 rounded-2xl border border-gray-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-text-muted">
                                        <ShoppingBag size={16} />
                                    </div>
                                    <span className="text-xs font-black text-green-950 uppercase tracking-tight">Joined Date</span>
                                </div>
                                <span className="text-xs font-bold text-text-muted">{selectedUser?.created_at && new Date(selectedUser.created_at).toLocaleDateString(undefined, { dateStyle: 'long' })}</span>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <Button 
                                className="flex-1 h-14 rounded-2xl bg-green-950 hover:bg-green-900 text-white text-[10px] font-black uppercase tracking-widest gap-2 shadow-lg"
                                onClick={() => {
                                    setSmsUser(selectedUser);
                                    setSelectedUser(null);
                                }}
                            >
                                <MessageCircle size={16} /> Send Message
                            </Button>
                            <Button 
                                variant="outline"
                                className="h-14 w-14 rounded-2xl border-red-100 text-red-600 hover:bg-red-50"
                            >
                                <Ban size={20} />
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
