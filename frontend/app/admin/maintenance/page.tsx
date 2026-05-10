'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import {
    Settings,
    Database,
    RefreshCcw,
    HardDrive,
    Zap,
    ShieldCheck,
    Terminal,
    Activity,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '@/store/uiStore';
import { useTranslation } from '@/hooks/useTranslation';
import { toast } from 'sonner';

interface SystemStatus {
    php_version: string;
    laravel_version: string;
    environment: string;
    db_connection: string;
    cache_driver: string;
    storage_link_exists: boolean;
    last_migration: {
        id: number;
        migration: string;
        batch: number;
    } | null;
}

export default function MaintenancePage() {
    const { t } = useTranslation();
    const { setPageTitle } = useUIStore();
    const queryClient = useQueryClient();
    const [commandOutput, setCommandOutput] = useState<string | null>(null);

    React.useEffect(() => {
        setPageTitle('System Maintenance');
    }, [setPageTitle]);

    // Fetch System Status
    const { data: status, isLoading } = useQuery({
        queryKey: ['system-status'],
        queryFn: async () => {
            const res = await api.get<SystemStatus>('/admin/maintenance/status');
            return res; // api.get already returns response.data
        }
    });

    // Mutations for actions
    const runAction = useMutation({
        mutationFn: async (item: { action: string, method?: string }) => {
            setCommandOutput(null);
            const res = item.method === 'get' 
                ? await api.get<{ message?: string; output?: string; logs?: string }>(`/admin/maintenance/${item.action}`)
                : await api.post<{ message?: string; output?: string; logs?: string }>(`/admin/maintenance/${item.action}`);
            return res;
        },
        onSuccess: (data, variables) => {
            toast.success(data?.message || 'Action completed');
            if (data?.output) setCommandOutput(data.output);
            if (data?.logs) setCommandOutput(data.logs);
            queryClient.invalidateQueries({ queryKey: ['system-status'] });
        },
        onError: (error: any) => {
            // error is response.data because of the interceptor in api.ts
            const message = error?.message || error?.error || 'Action failed';
            toast.error(message);
            setCommandOutput(`ERROR: ${message}`);
        }
    });

    const maintenanceActions = [
        {
            id: 'migrate',
            title: 'Run Migrations',
            description: 'Update database schema with pending migrations.',
            icon: Database,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50',
            action: 'migrate',
            danger: true
        },
        {
            id: 'clear-cache',
            title: 'Clear Cache',
            description: 'Flush all application, config, and route caches.',
            icon: RefreshCcw,
            color: 'text-amber-600',
            bgColor: 'bg-amber-50',
            action: 'clear-cache'
        },
        {
            id: 'optimize',
            title: 'Optimize',
            description: 'Cache configuration and routes for faster performance.',
            icon: Zap,
            color: 'text-purple-600',
            bgColor: 'bg-purple-50',
            action: 'optimize'
        },
        {
            id: 'storage-link',
            title: 'Fix Storage Link',
            description: 'Recreate the symlink for public file access.',
            icon: HardDrive,
            color: 'text-green-600',
            bgColor: 'bg-green-50',
            action: 'storage-link'
        },
        {
            id: 'seed',
            title: 'Seed Database',
            description: 'Run initial data seeders (Markets, Categories).',
            icon: ShieldCheck,
            color: 'text-rose-600',
            bgColor: 'bg-rose-50',
            action: 'seed',
            danger: true
        },
        {
            id: 'logs',
            title: 'System Logs',
            description: 'View the last 100 lines of the production error log.',
            icon: Terminal,
            color: 'text-text-primary',
            bgColor: 'bg-gray-100',
            action: 'logs',
            method: 'get'
        }
    ];

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="w-10 h-10 text-brand-600 animate-spin" />
                <p className="text-text-secondary font-black uppercase tracking-widest text-xs">Inspecting System...</p>
            </div>
        );
    }

    return (
        <div className="p-4 lg:p-8 space-y-8 max-w-7xl mx-auto">
            {/* Status Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Environment', value: status?.environment, icon: Terminal },
                    { label: 'Laravel', value: status?.laravel_version, icon: Settings },
                    { label: 'PHP', value: status?.php_version, icon: Activity },
                    { label: 'Storage Link', value: status?.storage_link_exists ? 'Healthy' : 'Broken', icon: HardDrive, color: status?.storage_link_exists ? 'text-green-600' : 'text-rose-600' },
                ].map((stat, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-4"
                    >
                        <div className="w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center text-text-secondary">
                            <stat.icon size={20} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">{stat.label}</p>
                            <p className={`text-sm font-bold ${stat.color || 'text-green-950'}`}>{stat.value}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Actions List */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {maintenanceActions.map((item, i) => (
                            <motion.button
                                key={item.id}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => {
                                    if (item.danger && !confirm('Are you sure? This action modifies the database.')) return;
                                    runAction.mutate({ action: item.action, method: item.method });
                                }}
                                disabled={runAction.isPending}
                                className="group text-left bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-brand-900/5 transition-all flex flex-col justify-between h-48 relative overflow-hidden"
                            >
                                <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full ${item.bgColor} opacity-20 group-hover:scale-150 transition-transform duration-700`} />

                                <div>
                                    <div className={`w-12 h-12 rounded-2xl ${item.bgColor} ${item.color} flex items-center justify-center mb-4`}>
                                        <item.icon size={24} />
                                    </div>
                                    <h3 className="font-black text-green-950 text-lg">{item.title}</h3>
                                    <p className="text-text-secondary text-xs font-medium leading-relaxed mt-1 line-clamp-2">
                                        {item.description}
                                    </p>
                                </div>

                                <div className="flex items-center justify-between mt-4">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                                        {runAction.isPending && (runAction.variables as any)?.action === item.action ? 'Executing...' : 'Click to execute'}
                                    </span>
                                    {runAction.isPending && (runAction.variables as any)?.action === item.action && (
                                        <Loader2 className="w-4 h-4 text-brand-600 animate-spin" />
                                    )}
                                </div>
                            </motion.button>
                        ))}
                    </div>

                    {/* Warning Card */}
                    <div className="bg-amber-50 border border-amber-100 p-8 rounded-[2.5rem] flex items-start gap-6">
                        <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                            <AlertTriangle size={30} />
                        </div>
                        <div>
                            <h4 className="text-amber-900 font-black text-lg">Caution: Administrative Actions</h4>
                            <p className="text-amber-800/70 text-sm font-medium mt-2 leading-relaxed">
                                These tools directly interact with the server environment and database. Improper use can lead to data loss or downtime. Ensure you have a recent backup before running migrations or seeding.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Console / Output */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-2">
                            <Terminal size={18} className="text-brand-600" />
                            <h3 className="font-black text-green-950 uppercase tracking-widest text-xs">Console Output</h3>
                        </div>
                        {commandOutput && (
                            <button
                                onClick={() => setCommandOutput(null)}
                                className="text-[10px] font-black text-brand-600 uppercase hover:underline"
                            >
                                Clear
                            </button>
                        )}
                    </div>

                    <div className="bg-[#0A0A0A] text-white p-6 rounded-[2.5rem] h-[540px] font-mono text-[11px] overflow-y-auto border-4 border-gray-900 shadow-2xl relative">
                        {!commandOutput && !runAction.isPending && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-800 select-none">
                                <Terminal size={48} className="mb-4 opacity-20" />
                                <p className="font-black uppercase tracking-widest">Waiting for command...</p>
                            </div>
                        )}
 
                        {runAction.isPending && (
                            <div className="flex items-center gap-2 text-green-400 animate-pulse">
                                <span className="w-2 h-2 bg-green-400 rounded-full" />
                                <p>Executing command on server...</p>
                            </div>
                        )}

                        <AnimatePresence>
                            {commandOutput && (
                                <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="whitespace-pre-wrap break-words leading-relaxed text-gray-100"
                                >
                                    <div className="flex items-center gap-2 mb-4 text-green-400 font-bold border-b border-gray-800 pb-2">
                                        <CheckCircle2 size={14} /> Output received at {new Date().toLocaleTimeString()}
                                    </div>
                                    <span className="text-green-500 mr-2">$</span>
                                    {commandOutput}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
}
