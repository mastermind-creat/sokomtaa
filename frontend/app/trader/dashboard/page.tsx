'use client';

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
    TrendingUp, 
    Plus, 
    QrCode,
    Clock,
    Store,
    Package,
    Activity,
    ChevronRight,
    Zap,
    Phone,
    CheckCircle2,
    AlertTriangle,
    BarChart3,
    ShieldCheck,
    Loader2,
    AlertCircle,
    ArrowRight,
    Ticket
} from 'lucide-react';
import api from '@/lib/api';
import { useUIStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import { useTranslation } from '@/hooks/useTranslation';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Reservation, ApiResponse } from '@/types';

interface DashboardStats {
    total_revenue: number;
    pending_reservations: number;
    completed_reservations: number;
    low_stock_items: number;
    out_of_stock_items: number;
    profile_views: number;
    growth: string;
    has_overdue_fees: boolean;
}

const StatCard = ({ title, value, icon: Icon, color, trend, description }: any) => (
    <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-4">
            <div className={cn("p-3 rounded-2xl text-white", color)}>
                <Icon size={20} />
            </div>
            {trend && (
                <span className={cn("text-[10px] font-black px-2 py-1 rounded-lg", trend.isPositive ? "bg-green-50 text-green-600" : "bg-rose-50 text-rose-600")}>
                    {trend.value}
                </span>
            )}
        </div>
        <h4 className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">{title}</h4>
        <div className="text-xl font-black text-green-950">{value}</div>
        <p className="text-[9px] font-bold text-gray-400 mt-1 uppercase tracking-widest">{description}</p>
    </div>
);

export default function TraderDashboard() {
    const { setPageTitle } = useUIStore();
    const { user, refreshUser } = useAuthStore();
    const { t } = useTranslation();
    const router = useRouter();
    const [processingId, setProcessingId] = React.useState<number | null>(null);

    React.useEffect(() => {
        setPageTitle('Commercial Cockpit');
        refreshUser();
    }, [setPageTitle, refreshUser]);

    const { data: statsData } = useQuery<ApiResponse<DashboardStats>>({
        queryKey: ['trader-dashboard-stats'],
        queryFn: () => api.get('/trader/analytics/stats').then(res => res.data),
    });
    const stats = statsData?.data;

    const { data: recentReservationsRaw, isLoading: resLoading } = useQuery<ApiResponse<Reservation[]>>({
        queryKey: ['recent-reservations'],
        queryFn: () => api.get('/trader/reservations/recent').then(res => res.data),
    });
    const reservations = recentReservationsRaw?.data || [];

    const { data: stallApp } = useQuery({
        queryKey: ['stall-application-dashboard'],
        queryFn: async () => {
            try {
                const res = await api.get<never, ApiResponse<{ status: string; stall_type: string }>>('/trader/stall-application');
                return res.data;
            } catch { return null; }
        },
    });

    const isPendingVerification = user?.role === 'trader' && !user?.phone_verified;
    const isMissingProfile = user?.role === 'trader' && !user?.trader;
    
    const currentStallType = stallApp?.data?.stall_type || user?.trader?.stall_type;
    const isIndependent = currentStallType === 'independent';
    const isPendingAllocation = user?.role === 'trader' && user?.trader && !isIndependent && !user?.trader.stall_id && stallApp?.data?.status === 'approved';
    const isApplicationPending = stallApp?.data?.status === 'pending';
    
    const isKycPending = user?.trader?.verification_status === 'pending';
    const isKycRejected = user?.trader?.verification_status === 'rejected';

    return (
        <div className="pb-40 -mx-4 md:-mx-0 font-sans">
            <AnimatePresence>
                {stats?.has_overdue_fees && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="mb-8 px-4"
                    >
                        <div className="bg-rose-50 border border-rose-100 rounded-[2rem] p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-rose-600 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-rose-200">
                                    <AlertCircle size={28} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-rose-950 uppercase tracking-tight">Overdue Market Fees</h3>
                                    <p className="text-rose-700 text-xs font-bold leading-relaxed max-w-md">Your stall fees are overdue. Please settle them to maintain your active status on the market map.</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => router.push('/trader/fees')}
                                className="h-14 px-10 bg-rose-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-rose-900/10 active:scale-95 transition-all flex items-center gap-3"
                            >
                                Pay Now <ArrowRight size={16} />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {(isMissingProfile || isPendingVerification || isPendingAllocation || isApplicationPending || isKycPending || isKycRejected) && (
                    <div className="px-4 mb-6 space-y-3">
                        {isMissingProfile && (
                            <motion.div className="bg-rose-50 border border-rose-100 rounded-3xl p-5 flex items-center gap-4 shadow-sm">
                                <div className="w-10 h-10 bg-rose-600 rounded-xl flex items-center justify-center text-white shrink-0">
                                    <AlertTriangle size={20} />
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-rose-950 font-black text-xs uppercase tracking-tight">{t('dashboard.profile_incomplete')}</h4>
                                    <p className="text-rose-700 text-[10px] font-bold">{t('dashboard.profile_incomplete_desc')}</p>
                                </div>
                                <Link href="/trader/profile" className="px-4 py-2 bg-rose-600 text-white text-[9px] font-black uppercase tracking-widest rounded-lg transition-colors hover:bg-rose-700">{t('dashboard.setup_now')}</Link>
                            </motion.div>
                        )}
                        {isApplicationPending && (
                            <motion.div className="bg-brand-50 border border-brand-100 rounded-3xl p-5 flex items-center gap-4 shadow-sm">
                                <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center text-white shrink-0">
                                    <Clock size={20} />
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-green-950 font-black text-xs uppercase tracking-tight">{t('dashboard.stall_pending')}</h4>
                                    <p className="text-brand-700 text-[10px] font-bold">{t('dashboard.stall_pending_desc')}</p>
                                </div>
                                <Link href="/trader/apply-stall" className="px-4 py-2 bg-brand-600 text-white text-[9px] font-black uppercase tracking-widest rounded-lg transition-colors hover:bg-brand-700">{t('dashboard.view_status')}</Link>
                            </motion.div>
                        )}
                        {isPendingAllocation && (
                            <motion.div className="bg-blue-50 border border-blue-100 rounded-3xl p-5 flex items-center gap-4 shadow-sm">
                                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shrink-0">
                                    <CheckCircle2 size={20} />
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-blue-950 font-black text-xs uppercase tracking-tight">{t('dashboard.awaiting_assignment')}</h4>
                                    <p className="text-blue-700 text-[10px] font-bold">{t('dashboard.awaiting_assignment_desc')}</p>
                                </div>
                            </motion.div>
                        )}
                        {isKycPending && (
                            <motion.div className="bg-amber-50 border border-amber-100 rounded-3xl p-5 flex items-center gap-4 shadow-sm">
                                <div className="w-10 h-10 bg-amber-600 rounded-xl flex items-center justify-center text-white shrink-0">
                                    <ShieldCheck size={20} />
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-amber-950 font-black text-xs uppercase tracking-tight">{t('dashboard.kyc_pending')}</h4>
                                    <p className="text-amber-700 text-[10px] font-bold">{t('dashboard.kyc_pending_desc')}</p>
                                </div>
                                <Link href="/trader/profile" className="px-4 py-2 bg-amber-600 text-white text-[9px] font-black uppercase tracking-widest rounded-lg">Check Docs</Link>
                            </motion.div>
                        )}
                        {isKycRejected && (
                            <motion.div className="bg-rose-50 border border-rose-100 rounded-3xl p-5 flex items-center gap-4 shadow-sm">
                                <div className="w-10 h-10 bg-rose-600 rounded-xl flex items-center justify-center text-white shrink-0">
                                    <AlertTriangle size={20} />
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-rose-950 font-black text-xs uppercase tracking-tight">{t('dashboard.kyc_rejected')}</h4>
                                    <p className="text-rose-700 text-[10px] font-bold">{t('dashboard.kyc_rejected_desc', { reason: user?.trader?.rejection_reason || 'Documents unclear' })}</p>
                                </div>
                                <Link href="/trader/profile" className="px-4 py-2 bg-rose-600 text-white text-[9px] font-black uppercase tracking-widest rounded-lg">Re-upload</Link>
                            </motion.div>
                        )}
                        {isPendingVerification && (
                            <motion.div className="bg-amber-50 border border-amber-100 rounded-3xl p-5 flex items-center gap-4 shadow-sm">
                                <div className="w-10 h-10 bg-amber-600 rounded-xl flex items-center justify-center text-white shrink-0">
                                    <Phone size={20} />
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-amber-950 font-black text-xs uppercase tracking-tight">{t('dashboard.phone_not_verified')}</h4>
                                    <p className="text-amber-700 text-[10px] font-bold">{t('dashboard.phone_not_verified_desc')}</p>
                                </div>
                                <Link href="/verify" className="px-4 py-2 bg-amber-600 text-white text-[9px] font-black uppercase tracking-widest rounded-lg transition-colors hover:bg-amber-700">{t('dashboard.verify_now')}</Link>
                            </motion.div>
                        )}
                    </div>
                )}
            </AnimatePresence>

            <div className="grid grid-cols-2 gap-4 px-4 mb-8">
                <StatCard 
                    title={t('trader.total_revenue')} 
                    value={`KES ${(stats?.total_revenue || 0).toLocaleString()}`} 
                    icon={TrendingUp} 
                    color="bg-brand-600" 
                    trend={{ value: stats?.growth || '+0%', isPositive: !stats?.growth?.startsWith('-') }}
                    description="Net Earnings"
                />
                <StatCard 
                    title={t('trader.active_reservations')} 
                    value={stats?.pending_reservations || '0'} 
                    icon={Ticket} 
                    color="bg-amber-500" 
                    description="Awaiting Pickup"
                />
                <StatCard 
                    title="Stock Alerts" 
                    value={stats?.low_stock_items || '0'} 
                    icon={Package} 
                    color="bg-rose-500" 
                    description="Low Stock Items"
                />
                <StatCard 
                    title="Profile Views" 
                    value={stats?.profile_views || '0'} 
                    icon={Store} 
                    color="bg-blue-500" 
                    description="Discovery Rate"
                />
            </div>

            <div className="px-4">
                <div className="flex items-center justify-between mb-6 px-2">
                    <h3 className="text-xs font-black text-green-950 uppercase tracking-[0.15em]">Pending Fulfillment</h3>
                    <Link href="/trader/reservations" className="text-[10px] font-black text-brand-600 uppercase tracking-widest flex items-center gap-1.5">
                        Audit Ledger <ChevronRight size={14} />
                    </Link>
                </div>

                <div className="space-y-4">
                    {resLoading ? (
                        [1,2].map(i => <div key={i} className="h-44 bg-gray-50 rounded-[2.5rem] animate-pulse" />)
                    ) : reservations.length === 0 ? (
                        <div className="py-20 text-center bg-gray-50/50 rounded-[3rem] border border-dashed border-gray-100">
                            <Package size={48} className="mx-auto text-gray-300 mb-4" />
                            <p className="text-xs font-black text-text-muted uppercase tracking-widest">Inventory is stationary.</p>
                        </div>
                    ) : (
                        reservations.map((res: Reservation) => (
                            <div key={res.id} className="bg-white rounded-[2.5rem] border border-gray-50 shadow-sm overflow-hidden group">
                                <div className="p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-brand-600 shadow-inner">
                                                <Store size={28} />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-100 uppercase tracking-widest">Pending</span>
                                                    <span className="text-[8px] font-black text-text-muted uppercase tracking-widest">#{res.reservation_code}</span>
                                                </div>
                                                <h4 className="text-base font-black text-green-950 uppercase tracking-tight truncate max-w-[140px]">
                                                    {res.product?.name || 'Bulk Produce'}
                                                </h4>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-black text-green-950 leading-none mb-1">x{res.quantity}</p>
                                            <p className="text-[10px] font-black text-brand-600 uppercase">KES {Number(res.total_amount).toLocaleString()}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <button 
                                           onClick={() => setProcessingId(res.id)}
                                           disabled={processingId === res.id}
                                           className="flex-1 h-14 bg-gray-950 text-white rounded-2xl flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-xl shadow-gray-950/20 disabled:opacity-70"
                                        >
                                            {processingId === res.id ? (
                                                <Loader2 size={16} className="animate-spin text-brand-400" />
                                            ) : (
                                                <CheckCircle2 size={16} className="text-brand-400" />
                                            )}
                                            {processingId === res.id ? 'Processing...' : 'Order Ready'}
                                        </button>
                                        <button className="w-14 h-14 bg-white border border-gray-100 rounded-2xl flex items-center justify-center text-text-muted active:text-green-950 active:scale-95 transition-all shadow-sm">
                                            <Phone size={20} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <div className="fixed bottom-[72px] lg:bottom-6 left-0 right-0 p-4 md:p-6 bg-white/80 backdrop-blur-xl border-t lg:border border-gray-100 flex gap-3 z-40 lg:rounded-[2.5rem] lg:left-auto lg:right-10 lg:w-[400px] lg:shadow-2xl">
                <Link 
                    href={(isMissingProfile || isPendingAllocation) ? "#" : "/trader/products/add"} 
                    className={cn(
                        "flex-1 h-16 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all shadow-2xl",
                        (isMissingProfile || isPendingAllocation) 
                            ? "bg-gray-200 text-gray-500 cursor-not-allowed shadow-none" 
                            : "bg-brand-600 text-white shadow-brand-600/30 active:scale-95"
                    )}
                >
                    <Plus size={20} /> 
                    {isMissingProfile ? 'Profile Required' : isPendingAllocation ? 'Stall Required' : 'Deploy Inventory'}
                </Link>
                <button className="h-16 w-16 bg-gray-950 text-white rounded-2xl flex items-center justify-center active:scale-95 transition-all shadow-2xl shadow-gray-950/20">
                    <QrCode size={28} />
                </button>
            </div>
        </div>
    );
}
