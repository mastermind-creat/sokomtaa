'use client';

import React from 'react';
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
    Users as UsersIcon
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function TrafficAnalyticsPage() {
    const { setPageTitle } = useUIStore();

    React.useEffect(() => {
        setPageTitle('Traffic Analytics');
    }, [setPageTitle]);

    const { data: activityDataRaw, isLoading: isLoadingActivity, refetch, isRefetching } = useQuery({
        queryKey: ['admin-activity-traffic'],
        queryFn: () => api.get('/admin/activity'),
        refetchInterval: 30000 
    });

    const { data: trafficStatsRaw, isLoading: isLoadingStats } = useQuery({
        queryKey: ['admin-traffic-stats'],
        queryFn: () => api.get('/admin/traffic-stats'),
        refetchInterval: 15000 // Poll every 15s for live active users
    });

    const activities = (activityDataRaw as any)?.data || [];
    const stats = (trafficStatsRaw as any)?.data || {
        active_users: 0,
        page_views_today: 0,
        unique_visitors_today: 0,
        top_pages: []
    };

    // Helper to map icon names from backend to Lucide components
    const getIcon = (iconName: string) => {
        switch (iconName) {
            case 'UserPlus': return <UserPlus size={16} />;
            case 'User': return <User size={16} />;
            case 'AlertCircle': return <AlertCircle size={16} />;
            case 'CheckCircle': return <CheckCircle size={16} />;
            default: return <Activity size={16} />;
        }
    };

    // Helper to determine color schemes based on activity type
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
        <div className="pb-32 -mx-4 md:-mx-0">
            {/* Header controls */}
            <div className="px-4 mb-8 flex justify-between items-center">
                <div>
                    <h2 className="text-sm font-black text-green-950 uppercase tracking-tight">System Interactivity</h2>
                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Live Event Feed</p>
                </div>
                <button 
                    onClick={() => refetch()}
                    className={cn(
                        "w-10 h-10 rounded-2xl bg-white border border-gray-100 flex items-center justify-center shadow-sm transition-all active:scale-95 text-green-950",
                        isRefetching && "animate-spin text-brand-500"
                    )}
                >
                    <RefreshCw size={16} />
                </button>
            </div>

            {/* Traffic Stats Dashboard */}
            <div className="px-4 mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-1">Live Active Users</p>
                        <h3 className="text-3xl font-black text-green-950 flex items-center gap-3">
                            {stats.active_users}
                            <span className="relative flex h-3 w-3">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-500"></span>
                            </span>
                        </h3>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center">
                        <Activity size={20} />
                    </div>
                </div>

                <div className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-1">Page Views (Today)</p>
                        <h3 className="text-3xl font-black text-green-950">{stats.page_views_today}</h3>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                        <Eye size={20} />
                    </div>
                </div>

                <div className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-1">Unique Visitors (Today)</p>
                        <h3 className="text-3xl font-black text-green-950">{stats.unique_visitors_today}</h3>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
                        <UsersIcon size={20} />
                    </div>
                </div>
            </div>

            <div className="px-4 mb-8">
                <h3 className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-4 pl-4">Top Viewed Pages</h3>
                <div className="bg-white border border-gray-100 rounded-[2rem] overflow-hidden">
                    {stats.top_pages.length === 0 ? (
                        <div className="p-8 text-center text-xs font-bold text-gray-400 uppercase tracking-widest">No traffic yet today</div>
                    ) : (
                        <div className="divide-y divide-gray-50">
                            {stats.top_pages.map((page: any, i: number) => (
                                <div key={i} className="flex items-center justify-between p-4 px-6 hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <MousePointerClick size={14} className="text-gray-400" />
                                        <span className="text-xs font-bold text-gray-700">{page.path}</span>
                                    </div>
                                    <div className="px-3 py-1 rounded-full bg-gray-100 text-[10px] font-black text-gray-600">
                                        {page.views} views
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Timeline */}
            <div className="px-4">
                <h3 className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-6 pl-4">System Event Log</h3>
                {activities.length === 0 ? (
                    <div className="bg-neutral-50 p-10 rounded-[2.5rem] border-2 border-dashed border-gray-200 text-center">
                        <Activity className="mx-auto mb-3 text-neutral-300" size={24} />
                        <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">No recent traffic recorded</p>
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
                                {/* Icon Node */}
                                <div className={cn(
                                    "flex items-center justify-center w-10 h-10 rounded-full border-4 border-white shadow-sm shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10",
                                    getColorScheme(activity.type)
                                )}>
                                    {getIcon(activity.icon)}
                                </div>
                                
                                {/* Content Card */}
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
                                            {activity.user.substring(0, 1)}
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
