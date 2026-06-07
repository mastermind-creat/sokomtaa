'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useUIStore } from '@/store/uiStore';
import { 
    Activity, 
    UserPlus, 
    User, 
    AlertCircle, 
    CheckCircle, 
    Clock,
    RefreshCw,
    Eye,
    MousePointerClick,
    Users as UsersIcon,
    Globe,
    BarChart2,
    Calendar,
    ChevronLeft,
    ChevronRight,
    TrendingUp,
    Hash
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function TrafficAnalyticsPage() {
    const { setPageTitle } = useUIStore();
    const [historyPage, setHistoryPage] = useState(1);
    const [activeTab, setActiveTab] = useState<'today' | 'alltime'>('alltime');

    React.useEffect(() => {
        setPageTitle('Traffic Analytics');
    }, [setPageTitle]);

    const { data: activityDataRaw, isLoading: isLoadingActivity, refetch, isRefetching } = useQuery({
        queryKey: ['admin-activity-traffic'],
        queryFn: () => api.get('/admin/activity'),
        refetchInterval: 30000 
    });

    const { data: trafficStatsRaw, isLoading: isLoadingStats } = useQuery({
        queryKey: ['admin-traffic-stats', historyPage],
        queryFn: () => api.get(`/admin/traffic-stats?page=${historyPage}&per_page=30`),
        refetchInterval: 30000
    });

    const activities = (activityDataRaw as any)?.data || [];
    const stats = (trafficStatsRaw as any)?.data || {};

    const activeUsers         = stats.active_users ?? 0;
    const pageViewsToday      = stats.page_views_today ?? 0;
    const uniqueVisitorsToday = stats.unique_visitors_today ?? 0;
    const totalPageViews      = stats.total_page_views ?? 0;
    const totalUniqueSessions = stats.total_unique_sessions ?? 0;
    const totalDaysTracked    = stats.total_days_tracked ?? 0;
    const firstVisitAt        = stats.first_visit_at ? new Date(stats.first_visit_at).toLocaleDateString('en-KE', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';
    const dailyTrend: { date: string; views: number; unique_visitors: number }[] = stats.daily_trend ?? [];
    const topPages: { path: string; views: number }[]         = stats.top_pages ?? [];
    const topPagesToday: { path: string; views: number }[]    = stats.top_pages_today ?? [];
    const visitHistory = stats.visit_history ?? { data: [], last_page: 1, total: 0 };

    // Chart helpers
    const maxViews = Math.max(...dailyTrend.map(d => d.views), 1);

    const getIcon = (iconName: string) => {
        switch (iconName) {
            case 'UserPlus': return <UserPlus size={16} />;
            case 'User': return <User size={16} />;
            case 'AlertCircle': return <AlertCircle size={16} />;
            case 'CheckCircle': return <CheckCircle size={16} />;
            default: return <Activity size={16} />;
        }
    };

    const getColorScheme = (type: string) => {
        if (type.includes('signup') || type.includes('kyc')) return 'bg-blue-50 text-blue-600 border-blue-100';
        if (type.includes('complaint')) return 'bg-rose-50 text-rose-600 border-rose-100';
        if (type.includes('order') || type.includes('fee')) return 'bg-brand-50 text-brand-600 border-brand-100';
        return 'bg-gray-50 text-gray-600 border-gray-100';
    };

    if (isLoadingActivity || isLoadingStats) {
        return (
            <div className="flex flex-col items-center justify-center py-20 opacity-30">
                <Activity className="animate-pulse mb-4" size={32} />
                <span className="font-black uppercase tracking-widest text-[10px]">Gathering Traffic Data...</span>
            </div>
        );
    }

    return (
        <div className="pb-32 -mx-4 md:-mx-0 space-y-8">
            {/* Header */}
            <div className="px-4 flex justify-between items-center">
                <div>
                    <h2 className="text-sm font-black text-green-950 uppercase tracking-tight">Traffic Analytics</h2>
                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Full historical record — since {firstVisitAt}</p>
                </div>
                <button 
                    onClick={() => refetch()}
                    aria-label="Refresh traffic data"
                    title="Refresh traffic data"
                    className={cn(
                        "w-10 h-10 rounded-2xl bg-white border border-gray-100 flex items-center justify-center shadow-sm transition-all active:scale-95 text-green-950",
                        isRefetching && "animate-spin text-brand-500"
                    )}
                >
                    <RefreshCw size={16} />
                </button>
            </div>

            {/* Live Pulse */}
            <div className="px-4">
                <div className="bg-gradient-to-br from-green-950 to-green-800 text-white p-6 rounded-[2rem] flex items-center justify-between shadow-xl">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/60 mb-1">Live Right Now</p>
                        <h3 className="text-5xl font-black flex items-center gap-4">
                            {activeUsers}
                            <span className="relative flex h-4 w-4">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-4 w-4 bg-green-300" />
                            </span>
                        </h3>
                        <p className="text-xs font-bold text-white/70 mt-1">Active users (last 5 min)</p>
                    </div>
                    <Activity size={48} className="text-white/20" />
                </div>
            </div>

            {/* Tab Toggle: Today vs All-Time */}
            <div className="px-4">
                <div className="flex gap-2 bg-neutral-100 p-1 rounded-2xl w-fit">
                    {(['today', 'alltime'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={cn(
                                "px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                activeTab === tab ? "bg-white shadow text-green-950" : "text-text-muted hover:text-green-950"
                            )}
                        >
                            {tab === 'today' ? "Today" : "All-Time"}
                        </button>
                    ))}
                </div>
            </div>

            {/* Stat Cards */}
            <div className="px-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                {activeTab === 'today' ? (<>
                    <StatCard icon={<Eye size={20} />} label="Page Views Today" value={pageViewsToday.toLocaleString()} color="blue" />
                    <StatCard icon={<UsersIcon size={20} />} label="Unique Visitors Today" value={uniqueVisitorsToday.toLocaleString()} color="amber" />
                    <StatCard icon={<Calendar size={20} />} label="Days Tracked" value={totalDaysTracked.toLocaleString()} color="green" />
                </>) : (<>
                    <StatCard icon={<Eye size={20} />} label="Total Page Views" value={totalPageViews.toLocaleString()} color="blue" />
                    <StatCard icon={<Globe size={20} />} label="Unique Sessions" value={totalUniqueSessions.toLocaleString()} color="green" />
                    <StatCard icon={<Calendar size={20} />} label="Days Tracked" value={totalDaysTracked.toLocaleString()} color="amber" />
                </>)}
            </div>

            {/* 30-Day Trend Chart */}
            {dailyTrend.length > 0 && (
                <div className="px-4">
                    <div className="bg-white border border-gray-100 rounded-[2rem] p-6 shadow-sm">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="p-2 bg-brand-50 rounded-xl text-brand-600"><TrendingUp size={16} /></div>
                            <div>
                                <h3 className="text-xs font-black text-green-950 uppercase tracking-tight">30-Day Traffic Trend</h3>
                                <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest">Page views per day</p>
                            </div>
                        </div>
                        <div className="flex items-end gap-1 h-36 overflow-x-auto no-scrollbar">
                            {dailyTrend.map((day, i) => {
                                const height = Math.max(4, Math.round((day.views / maxViews) * 136));
                                const label = new Date(day.date).toLocaleDateString('en-KE', { month: 'short', day: 'numeric' });
                                return (
                                    <div key={i} className="flex flex-col items-center gap-1 flex-1 min-w-[18px] group">
                                        <div className="relative w-full flex justify-center">
                                            {/* tooltip */}
                                            <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center z-10 pointer-events-none">
                                                <div className="bg-green-950 text-white text-[8px] font-black px-2 py-1 rounded-lg whitespace-nowrap">
                                                    {day.views} views<br/>{day.unique_visitors} unique
                                                </div>
                                                <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-green-950" />
                                            </div>
                                            <div
                                                className="w-full rounded-t-lg bg-brand-500 hover:bg-brand-600 transition-colors cursor-pointer"
                                                style={{ height: `${height}px` }}
                                            />
                                        </div>
                                        <span className="text-[7px] font-bold text-text-muted rotate-45 origin-left hidden md:block">{label}</span>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="flex justify-between mt-2">
                            <span className="text-[8px] font-bold text-text-muted">30 days ago</span>
                            <span className="text-[8px] font-bold text-text-muted">Today</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Top Pages */}
            <div className="px-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* All-time top pages */}
                <div>
                    <h3 className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-3 pl-2">Top Pages — All Time</h3>
                    <div className="bg-white border border-gray-100 rounded-[2rem] overflow-hidden">
                        {topPages.length === 0 ? (
                            <div className="p-8 text-center text-xs font-bold text-gray-400 uppercase tracking-widest">No data</div>
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {topPages.map((page, i) => (
                                    <div key={i} className="flex items-center justify-between p-4 px-5 hover:bg-gray-50 transition-colors">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <span className="text-[9px] font-black text-text-muted w-4 shrink-0">#{i + 1}</span>
                                            <MousePointerClick size={12} className="text-gray-400 shrink-0" />
                                            <span className="text-xs font-bold text-gray-700 truncate">{page.path}</span>
                                        </div>
                                        <div className="px-3 py-1 rounded-full bg-brand-50 text-[10px] font-black text-brand-600 shrink-0 ml-2">
                                            {page.views.toLocaleString()}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Today's top pages */}
                <div>
                    <h3 className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-3 pl-2">Top Pages — Today</h3>
                    <div className="bg-white border border-gray-100 rounded-[2rem] overflow-hidden">
                        {topPagesToday.length === 0 ? (
                            <div className="p-8 text-center text-xs font-bold text-gray-400 uppercase tracking-widest">No visits today yet</div>
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {topPagesToday.map((page, i) => (
                                    <div key={i} className="flex items-center justify-between p-4 px-5 hover:bg-gray-50 transition-colors">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <span className="text-[9px] font-black text-text-muted w-4 shrink-0">#{i + 1}</span>
                                            <MousePointerClick size={12} className="text-gray-400 shrink-0" />
                                            <span className="text-xs font-bold text-gray-700 truncate">{page.path}</span>
                                        </div>
                                        <div className="px-3 py-1 rounded-full bg-blue-50 text-[10px] font-black text-blue-600 shrink-0 ml-2">
                                            {page.views}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Raw Visit History */}
            <div className="px-4">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <Hash size={14} className="text-text-muted" />
                        <h3 className="text-[10px] font-black text-text-muted uppercase tracking-widest">
                            Visit History — {visitHistory.total?.toLocaleString() ?? '?'} total records
                        </h3>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setHistoryPage(p => Math.max(1, p - 1))}
                            disabled={historyPage <= 1}
                            aria-label="Previous page"
                            title="Previous page"
                            className="w-8 h-8 rounded-xl bg-white border border-gray-100 flex items-center justify-center shadow-sm disabled:opacity-30 text-green-950 active:scale-95"
                        >
                            <ChevronLeft size={14} />
                        </button>
                        <span className="text-[10px] font-black text-text-muted">{historyPage} / {visitHistory.last_page ?? 1}</span>
                        <button
                            onClick={() => setHistoryPage(p => Math.min(visitHistory.last_page ?? 1, p + 1))}
                            disabled={historyPage >= (visitHistory.last_page ?? 1)}
                            aria-label="Next page"
                            title="Next page"
                            className="w-8 h-8 rounded-xl bg-white border border-gray-100 flex items-center justify-center shadow-sm disabled:opacity-30 text-green-950 active:scale-95"
                        >
                            <ChevronRight size={14} />
                        </button>
                    </div>
                </div>

                <div className="bg-white border border-gray-100 rounded-[2rem] overflow-hidden">
                    {visitHistory.data?.length === 0 ? (
                        <div className="p-10 text-center text-xs font-bold text-gray-400 uppercase tracking-widest">No visits recorded</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="border-b border-gray-50">
                                        <th className="text-left px-5 py-3 text-[9px] font-black uppercase tracking-widest text-text-muted">#</th>
                                        <th className="text-left px-5 py-3 text-[9px] font-black uppercase tracking-widest text-text-muted">Path</th>
                                        <th className="text-left px-5 py-3 text-[9px] font-black uppercase tracking-widest text-text-muted">Session</th>
                                        <th className="text-left px-5 py-3 text-[9px] font-black uppercase tracking-widest text-text-muted">User</th>
                                        <th className="text-left px-5 py-3 text-[9px] font-black uppercase tracking-widest text-text-muted">Time</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {visitHistory.data?.map((visit: any, i: number) => (
                                        <motion.tr
                                            key={visit.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: i * 0.02 }}
                                            className="hover:bg-gray-50 transition-colors"
                                        >
                                            <td className="px-5 py-3 text-[10px] font-black text-text-muted">{visit.id}</td>
                                            <td className="px-5 py-3 font-bold text-green-950 max-w-[180px] truncate">{visit.path}</td>
                                            <td className="px-5 py-3 font-mono text-[9px] text-text-muted">{visit.session_hash?.slice(0, 10)}…</td>
                                            <td className="px-5 py-3">
                                                {visit.user_id ? (
                                                    <span className="px-2 py-0.5 bg-brand-50 text-brand-700 rounded-full text-[9px] font-black">User #{visit.user_id}</span>
                                                ) : (
                                                    <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full text-[9px] font-black">Guest</span>
                                                )}
                                            </td>
                                            <td className="px-5 py-3 text-[9px] font-bold text-text-muted whitespace-nowrap">
                                                {new Date(visit.created_at).toLocaleString('en-KE', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* System Event Log */}
            <div className="px-4">
                <h3 className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-6 pl-2">System Event Log</h3>
                {activities.length === 0 ? (
                    <div className="bg-neutral-50 p-10 rounded-[2.5rem] border-2 border-dashed border-gray-200 text-center">
                        <Activity className="mx-auto mb-3 text-neutral-300" size={24} />
                        <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">No recent activity recorded</p>
                    </div>
                ) : (
                    <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
                        {activities.map((activity: any, idx: number) => (
                            <motion.div 
                                key={activity.id || idx}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active"
                            >
                                <div className={cn(
                                    "flex items-center justify-center w-10 h-10 rounded-full border-4 border-white shadow-sm shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10",
                                    getColorScheme(activity.type)
                                )}>
                                    {getIcon(activity.icon)}
                                </div>
                                <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:border-gray-200 hover:shadow-md transition-all">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-text-muted">
                                            <Clock size={10} />
                                            <span>{activity.time}</span>
                                        </div>
                                        <div className="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest bg-gray-50 text-gray-500">
                                            {activity.status}
                                        </div>
                                    </div>
                                    <h4 className="text-xs font-black text-green-950 uppercase tracking-tight mb-1">{activity.title}</h4>
                                    <p className="text-[11px] font-medium text-text-secondary leading-relaxed">{activity.description}</p>
                                    <div className="mt-3 pt-3 border-t border-gray-50 flex items-center gap-2">
                                        <div className="w-5 h-5 rounded-full bg-brand-50 text-brand-700 flex items-center justify-center text-[8px] font-black uppercase shrink-0">
                                            {activity.user?.substring(0, 1)}
                                        </div>
                                        <span className="text-[10px] font-bold text-text-muted truncate">{activity.user}</span>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: 'blue' | 'green' | 'amber' | 'rose' }) {
    const colorMap = {
        blue:  'bg-blue-50 text-blue-600',
        green: 'bg-brand-50 text-brand-600',
        amber: 'bg-amber-50 text-amber-600',
        rose:  'bg-rose-50 text-rose-600',
    };
    return (
        <div className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm flex items-center justify-between">
            <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-text-muted mb-1">{label}</p>
                <h3 className="text-2xl font-black text-green-950">{value}</h3>
            </div>
            <div className={cn("w-12 h-12 rounded-full flex items-center justify-center shrink-0", colorMap[color])}>
                {icon}
            </div>
        </div>
    );
}
