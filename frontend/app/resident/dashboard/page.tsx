'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { 
    Ticket, 
    Bell, 
    ShoppingBag, 
    MapPin, 
    ArrowRight, 
    TrendingUp, 
    Star,
    MessageSquare,
    Clock
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useTranslation } from '@/hooks/useTranslation';
import { motion } from 'framer-motion';
import { ApiResponse, Market, Notice } from '@/types';

interface Reservation {
    id: number;
    reservation_code: string;
    status: string;
    total_amount: string;
    product: {
        name: string;
        image_url: string | null;
    };
    trader: {
        business_name: string;
    };
}

export default function ResidentDashboard() {
    const { user } = useAuthStore();
    const router = useRouter();
    const { t } = useTranslation();

    // Fetch Reservations to aggregate stats
    const { data: resData, isLoading: resLoading } = useQuery<ApiResponse<{data: Reservation[]}>>({
        queryKey: ['my-reservations-dashboard'],
        queryFn: () => api.get('/reservations'),
    });

    // Fetch Unread Notification Count
    const { data: notifData } = useQuery<ApiResponse<{count: number}>>({
        queryKey: ['unread-notifications-count'],
        queryFn: () => api.get('/notifications/unread-count'),
        refetchInterval: 30000, // Refresh every 30s
    });

    // Fetch Markets to get a context for notices
    const { data: marketData } = useQuery<ApiResponse<{data: Market[]}>>({
        queryKey: ['active-markets-notices'],
        queryFn: () => api.get('/markets'),
    });

    const primaryMarket = marketData?.data?.data?.[0];

    // Fetch Notices for the primary market
    const { data: noticeData } = useQuery<ApiResponse<{data: Notice[]}>>({
        queryKey: ['community-notices', primaryMarket?.id],
        queryFn: () => api.get(`/notices?market_id=${primaryMarket?.id}`),
        enabled: !!primaryMarket?.id,
    });

    const reservations = resData?.data?.data || [];
    const activeOrders = reservations.filter(r => ['pending', 'paid', 'ready'].includes(r.status));
    const latestOrder = activeOrders[0] || reservations[0];
    const notices = noticeData?.data?.data || [];
    const currentNotice = notices[0];

    const stats = {
        activeCount: activeOrders.length,
        totalCount: reservations.length,
        points: 125, // Loyalty system pending backend implementation
        unreadNotifs: notifData?.data?.count || 0
    };

    return (
        <DashboardLayout title={t('nav.dawati')}>
            <div className="max-w-5xl mx-auto space-y-8 animate-fade-up">
                
                {/* Greeting & Stats Grid */}
                <section>
                    <div className="mb-6">
                        <h2 className="text-3xl font-black text-green-950 tracking-tight">
                            {t('home.greeting')}, {user?.name.split(' ')[0]}!
                        </h2>
                        <p className="text-text-secondary font-medium">Hapa ni muhtasari wa soko lako leo.</p>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <motion.div 
                            whileHover={{ y: -4 }}
                            className="bg-brand-600 p-5 rounded-[2rem] text-white shadow-brand-lg relative overflow-hidden group cursor-pointer"
                            onClick={() => router.push('/reservations')}
                        >
                            <div className="absolute -right-2 -top-2 opacity-10 group-hover:scale-110 transition-transform">
                                <Ticket size={80} />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest opacity-80">Active Orders</span>
                            <div className="text-3xl font-black mt-1">{stats.activeCount}</div>
                        </motion.div>

                        <motion.div 
                            whileHover={{ y: -4 }}
                            className="bg-white p-5 rounded-[2rem] border border-border-default shadow-brand-sm relative overflow-hidden group cursor-pointer"
                        >
                            <div className="absolute -right-2 -top-2 opacity-5 group-hover:scale-110 transition-transform text-brand-600">
                                <Star size={80} />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">Loyalty Points</span>
                            <div className="text-3xl font-black mt-1 text-brand-600">{stats.points}</div>
                        </motion.div>

                        <motion.div 
                            whileHover={{ y: -4 }}
                            className="bg-amber-500 p-5 rounded-[2rem] text-white shadow-lg relative overflow-hidden group cursor-pointer"
                        >
                            <div className="absolute -right-2 -top-2 opacity-10 group-hover:scale-110 transition-transform">
                                <Bell size={80} />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest opacity-80">Notifications</span>
                            <div className="text-3xl font-black mt-1">{stats.unreadNotifs}</div>
                        </motion.div>

                        <motion.div 
                            whileHover={{ y: -4 }}
                            className="bg-green-100 p-5 rounded-[2rem] border border-brand-200 relative overflow-hidden group cursor-pointer"
                            onClick={() => router.push('/')}
                        >
                            <div className="absolute -right-2 -top-2 opacity-10 group-hover:scale-110 transition-transform text-brand-700">
                                <ShoppingBag size={80} />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-brand-700">Total Orders</span>
                            <div className="text-3xl font-black mt-1 text-brand-800">{stats.totalCount}</div>
                        </motion.div>
                    </div>
                </section>

                {/* Main Content Split */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Left 2/3: Recent Reservation & Discovery */}
                    <div className="lg:col-span-2 space-y-8">
                        
                        {/* Latest Order Spotlight */}
                        <section>
                            <div className="flex items-center justify-between mb-4 px-2">
                                <h3 className="text-lg font-black text-green-950 uppercase tracking-tight">Maagizo ya Karibuni</h3>
                                <button onClick={() => router.push('/reservations')} className="text-brand-600 text-xs font-black uppercase tracking-widest flex items-center gap-1 hover:gap-2 transition-all">
                                    View All <ArrowRight size={14} />
                                </button>
                            </div>

                            {!latestOrder ? (
                                <div className="bg-white border-2 border-dashed border-gray-100 rounded-[2.5rem] p-10 flex flex-col items-center text-center">
                                    <div className="w-16 h-16 bg-neutral-50 rounded-full flex items-center justify-center text-text-muted mb-4 text-brand-600">
                                        <ShoppingBag size={32} />
                                    </div>
                                    <p className="font-bold text-green-950 mb-1">Huna maagizo yoyote kwa sasa</p>
                                    <p className="text-xs text-text-muted mb-5">Anza kufanya ununuzi sokoni leo!</p>
                                    <button 
                                        onClick={() => router.push('/')}
                                        className="h-11 px-6 bg-brand-600 text-white rounded-xl text-xs font-black shadow-brand-md active:scale-95 transition-all"
                                    >
                                        Gundua Soko Sasa
                                    </button>
                                </div>
                            ) : (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    onClick={() => router.push(`/reservations`)}
                                    className="bg-white border border-border-default rounded-[2.5rem] p-6 shadow-brand-sm cursor-pointer hover:shadow-brand-md transition-shadow group flex items-center gap-6"
                                >
                                    <div className="w-24 h-24 bg-neutral-100 rounded-2xl overflow-hidden flex-shrink-0 shadow-inner">
                                        {latestOrder.product?.image_url ? (
                                            <img src={latestOrder.product.image_url} alt="Product" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-text-muted"><ShoppingBag size={32} /></div>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${
                                                latestOrder.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-brand-600 text-white'
                                            }`}>
                                                {latestOrder.status}
                                            </span>
                                            <span className="text-[10px] font-bold text-text-muted">#{latestOrder.reservation_code}</span>
                                        </div>
                                        <h4 className="text-xl font-black text-green-950 group-hover:text-brand-600 transition-colors">{latestOrder.product?.name}</h4>
                                        <p className="text-sm text-text-secondary font-bold">{latestOrder.trader?.business_name}</p>
                                        
                                        <div className="mt-3 flex items-center gap-4 text-[10px] font-black text-brand-700 uppercase tracking-widest">
                                            <span className="flex items-center gap-1"><Clock size={12} /> Pending Pickup</span>
                                            <span className="text-green-900 border-l border-gray-200 pl-4">KES {parseFloat(latestOrder.total_amount).toLocaleString()}</span>
                                        </div>
                                    </div>
                                    <div className="hidden sm:flex w-12 h-12 rounded-full bg-brand-50 items-center justify-center text-brand-600 group-hover:bg-brand-600 group-hover:text-white transition-all">
                                        <ArrowRight size={20} />
                                    </div>
                                </motion.div>
                            )}
                        </section>

                        {/* Market Discovery Shortcut */}
                        <section>
                            <div className="flex items-center justify-between mb-4 px-2">
                                <h3 className="text-lg font-black text-green-950 uppercase tracking-tight">Vumbua Masoko</h3>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div 
                                    onClick={() => router.push('/market/map')}
                                    className="h-32 bg-gradient-to-br from-green-900 to-brand-700 rounded-3xl p-6 relative overflow-hidden cursor-pointer group shadow-lg"
                                >
                                    <MapPin className="absolute -right-4 -bottom-4 text-white opacity-10 group-hover:scale-125 transition-transform" size={100} />
                                    <h4 className="text-white font-black text-xl relative z-10">Market Map</h4>
                                    <p className="text-green-100 text-xs relative z-10 opacity-80 mt-1">Visit your local county market stations.</p>
                                </div>
                                <div 
                                    onClick={() => router.push('/')}
                                    className="h-32 bg-amber-500 rounded-3xl p-6 relative overflow-hidden cursor-pointer group shadow-lg"
                                >
                                    <TrendingUp className="absolute -right-4 -bottom-4 text-white opacity-10 group-hover:scale-125 transition-transform" size={100} />
                                    <h4 className="text-white font-black text-xl relative z-10">Hot Deals</h4>
                                    <p className="text-amber-100 text-xs relative z-10 opacity-80 mt-1">Recommended products just for you.</p>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Right 1/3: Quick Actions & Notices */}
                    <div className="space-y-8">
                        <section className="bg-white border border-border-default rounded-[2.5rem] p-6 shadow-brand-sm">
                            <h3 className="text-sm font-black text-green-950 uppercase tracking-tight mb-4 flex items-center gap-2">
                                <Star size={16} className="text-amber-500" />
                                Njia za mkato
                            </h3>
                            <div className="space-y-3">
                                {[
                                    { icon: ShoppingBag, label: 'Buy More', color: 'text-brand-600', path: '/' },
                                    { icon: MessageSquare, label: 'My Complaints', color: 'text-red-500', path: '/complaints' },
                                    { icon: Bell, label: 'Notifications', color: 'text-amber-600', path: '/notifications' },
                                    { icon: Star, label: 'Saved Traders', color: 'text-brand-600', path: '/profile' }
                                ].map((action) => (
                                    <button 
                                        key={action.label}
                                        onClick={() => router.push(action.path)}
                                        className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-neutral-50 transition-colors group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`${action.color} opacity-80 group-hover:opacity-100 transition-opacity`}>
                                                <action.icon size={20} />
                                            </div>
                                            <span className="text-sm font-bold text-text-secondary group-hover:text-green-950 transition-colors">{action.label}</span>
                                        </div>
                                        <ArrowRight size={14} className="text-text-muted opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                                    </button>
                                ))}
                            </div>
                        </section>

                        <section className="bg-brand-50 rounded-[2.5rem] p-6 border border-brand-100 relative overflow-hidden h-full min-h-[220px] flex flex-col justify-center">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <MessageSquare size={48} className="text-brand-600" />
                            </div>
                            <h3 className="text-xs font-black text-brand-700 uppercase tracking-widest mb-3">Community Notice</h3>
                            
                            {currentNotice ? (
                                <>
                                    <p className="text-sm text-green-900 font-bold leading-relaxed mb-4">
                                        {user?.preferred_language === 'sw' ? (currentNotice.content_sw || currentNotice.content) : currentNotice.content}
                                    </p>
                                    <button 
                                        onClick={() => router.push(`/notices/${currentNotice.id}`)}
                                        className="text-[10px] font-black text-brand-600 uppercase tracking-widest hover:underline flex items-center gap-1 mt-auto"
                                    >
                                        Read More <ArrowRight size={12} />
                                    </button>
                                </>
                            ) : (
                                <p className="text-sm text-text-muted font-medium italic">
                                    Hakuna matangazo yoyote kwa sasa katika soko lako.
                                </p>
                            )}
                        </section>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
