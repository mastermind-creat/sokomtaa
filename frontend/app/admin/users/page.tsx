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
    UserPlus
} from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminUsersPage() {
    const { setPageTitle } = useUIStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [activeRole, setActiveRole] = useState('all');

    React.useEffect(() => {
        setPageTitle('Community Registry');
    }, [setPageTitle]);

    React.useEffect(() => {
        const handler = setTimeout(() => setDebouncedSearch(searchQuery), 300);
        return () => clearTimeout(handler);
    }, [searchQuery]);

    const { data: usersRaw, isLoading } = useQuery({
        queryKey: ['admin-users', activeRole, debouncedSearch],
        queryFn: () => {
            const params: Record<string, string> = {};
            if (activeRole !== 'all') params.role = activeRole;
            if (debouncedSearch) params.search = debouncedSearch;
            return api.get('/admin/users', { params }).then(res => res.data);
        },
    });

    const users = (usersRaw as any)?.data || [];

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

            {/* ── User Registry Cards ── */}
            <div className="space-y-4 px-4">
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
                                <div className="p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-4">
                                            <div className={cn(
                                                "w-14 h-14 rounded-2xl flex items-center justify-center border-2",
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
                                            <div>
                                                <h3 className="text-base font-black text-green-950 uppercase tracking-tight">{u.name}</h3>
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
                                        <button className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-text-muted">
                                            <MoreHorizontal size={20} />
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 mt-6">
                                        <a href={`tel:${u.phone}`} className="h-11 bg-gray-950 text-white rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all">
                                            <Phone size={14} /> Call
                                        </a>
                                        <button className="h-11 bg-brand-50 text-brand-700 rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all">
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
        </div>
    );
}
