'use client';

import React, { useState } from 'react';
import { 
    User, 
    Bell, 
    Shield, 
    Globe, 
    Smartphone, 
    Save, 
    Camera, 
    LogOut,
    CheckCircle2,
    Database,
    Zap,
    CreditCard,
    MessageSquare,
    ChevronRight,
    Activity,
    Layers,
    Warehouse,
    Coins
} from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { useUIStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { ApiResponse, SystemSetting } from '@/types';
import { toast } from 'sonner';

export default function AdminSettingsPage() {
    const { t } = useTranslation();
    const { setPageTitle } = useUIStore();
    const { user, logout } = useAuthStore();

    React.useEffect(() => {
        setPageTitle('System Infrastructure');
    }, [setPageTitle]);

    const queryClient = useQueryClient();
    const [isSaving, setIsSaving] = useState(false);
    const [savedState, setSavedState] = useState(false);

    // Fetch Settings
    const { data: settingsData, isLoading: settingsLoading } = useQuery<Record<string, SystemSetting[]>>({
        queryKey: ['admin-system-settings'],
        queryFn: async () => {
            const res = await api.get('/admin/settings');
            return res.data.data;
        }
    });

    const [localSettings, setLocalSettings] = useState<Record<string, string>>({});

    React.useEffect(() => {
        if (settingsData) {
            const initial: Record<string, string> = {};
            Object.values(settingsData).flat().forEach(s => {
                initial[s.key] = s.value;
            });
            setLocalSettings(initial);
        }
    }, [settingsData]);

    const updateMutation = useMutation({
        mutationFn: async (payload: { key: string; value: string }[]) => {
            return api.post('/admin/settings/bulk-update', { settings: payload });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-system-settings'] });
            setSavedState(true);
            setTimeout(() => setSavedState(false), 3000);
            toast.success('System configuration updated successfully');
        },
        onError: () => {
            toast.error('Failed to update configuration');
        }
    });

    const handleSave = () => {
        const payload = Object.entries(localSettings).map(([key, value]) => ({ key, value }));
        updateMutation.mutate(payload);
    };

    const handleSettingChange = (key: string, value: string) => {
        setLocalSettings(prev => ({ ...prev, [key]: value }));
    };

    const { data: statsData, isLoading: statsLoading } = useQuery<{ markets_count: number; traders_count: number; latency_ms: number; storage_usage: string }>({
        queryKey: ['admin-system-stats'],
        queryFn: async () => {
            const res = await api.get('/admin/settings/stats');
            return res.data;
        },
        refetchInterval: 30000 // Refetch every 30s
    });

    const stats = [
        { label: 'Markets', value: statsLoading ? '...' : (statsData?.markets_count || '0'), color: 'text-brand-600', icon: Warehouse },
        { label: 'Traders', value: statsLoading ? '...' : (statsData?.traders_count || '0'), color: 'text-blue-600', icon: User },
        { label: 'Latency', value: statsLoading ? '...' : `${statsData?.latency_ms || '0'}ms`, color: 'text-orange-600', icon: Zap },
    ];

    return (
        <div className="pb-32 -mx-4 md:-mx-0">
            {/* ── Platform Vitality Matrix ── */}
            <div className="grid grid-cols-3 gap-2 px-4 mb-6">
                {stats.map((s, i) => (
                    <div key={i} className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center">
                        <span className={cn("text-[8px] font-black uppercase tracking-widest mb-1", s.color)}>{s.label}</span>
                        <div className="text-xl font-black text-green-950 tracking-tight">{s.value}</div>
                    </div>
                ))}
            </div>

            <div className="px-4">
                <Tabs defaultValue="infrastructure" className="space-y-6">
                    <TabsList className="bg-white p-1 rounded-2xl border border-gray-100 flex overflow-x-auto no-scrollbar shadow-sm">
                        <TabsTrigger value="infrastructure" className="rounded-xl px-4 py-2 text-[9px] font-black uppercase tracking-widest data-[state=active]:bg-gray-950 data-[state=active]:text-white flex-1 whitespace-nowrap">
                            Infrastructure
                        </TabsTrigger>
                        <TabsTrigger value="fiscal" className="rounded-xl px-4 py-2 text-[9px] font-black uppercase tracking-widest data-[state=active]:bg-gray-950 data-[state=active]:text-white flex-1 whitespace-nowrap">
                            Fiscal Policies
                        </TabsTrigger>
                        <TabsTrigger value="account" className="rounded-xl px-4 py-2 text-[9px] font-black uppercase tracking-widest data-[state=active]:bg-gray-950 data-[state=active]:text-white flex-1 whitespace-nowrap">
                            Account
                        </TabsTrigger>
                        <TabsTrigger value="security" className="rounded-xl px-4 py-2 text-[9px] font-black uppercase tracking-widest data-[state=active]:bg-gray-950 data-[state=active]:text-white flex-1 whitespace-nowrap">
                            Security
                        </TabsTrigger>
                    </TabsList>

                    {/* Infrastructure Modules */}
                    <TabsContent value="infrastructure" className="space-y-4">
                        <div className="bg-white rounded-[2.5rem] p-6 border border-gray-50 shadow-sm">
                            <h3 className="text-sm font-black text-green-950 uppercase tracking-tight mb-6 flex items-center gap-2">
                                <Activity size={16} className="text-brand-600" />
                                Service Control Hub
                            </h3>
                            
                            <div className="space-y-4 mb-8">
                                {[
                                    { label: 'M-Pesa Gateway', desc: 'Real-time settlement processing', icon: CreditCard, active: true },
                                    { label: 'SMS Notification Rail', desc: 'Daily trader broadcast system', icon: MessageSquare, active: true },
                                    { label: 'Swahili UI Defaults', desc: 'Force native localization', icon: Globe, active: false }
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-text-secondary">
                                                <item.icon size={18} />
                                            </div>
                                            <div>
                                                <h4 className="text-[11px] font-black text-green-950 uppercase tracking-tight">{item.label}</h4>
                                                <p className="text-[9px] font-bold text-text-muted tracking-wide">{item.desc}</p>
                                            </div>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" className="sr-only peer" defaultChecked={item.active} />
                                            <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-500"></div>
                                        </label>
                                    </div>
                                ))}
                            </div>

                            <div className="pt-6 border-t border-gray-50">
                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 ml-1">Cloud Capacity</h4>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-end mb-2">
                                        <div>
                                            <p className="text-[10px] font-black text-green-950 uppercase tracking-tight leading-none mb-1">Storage Cluster</p>
                                            <p className="text-[8px] font-bold text-text-muted uppercase tracking-widest">HostAfrica Production</p>
                                        </div>
                                        <span className="text-[10px] font-black text-brand-600">{statsData?.storage_usage || '12%'} Used</span>
                                    </div>
                                    <div className="h-3 w-full bg-gray-50 rounded-full overflow-hidden border border-gray-100">
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: statsData?.storage_usage || '12%' }}
                                            className="h-full bg-brand-500 rounded-full shadow-lg shadow-brand-500/20" 
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    {/* Fiscal Policies Hub */}
                    <TabsContent value="fiscal" className="space-y-4">
                        <div className="bg-white rounded-[2.5rem] p-6 border border-gray-50 shadow-sm">
                            <h3 className="text-sm font-black text-green-950 uppercase tracking-tight mb-6 flex items-center gap-2">
                                <Coins size={16} className="text-amber-600" />
                                Revenue & Fee Logic
                            </h3>

                            {settingsLoading ? (
                                <div className="py-12 flex flex-col items-center justify-center gap-4">
                                    <div className="w-8 h-8 border-4 border-gray-100 border-t-brand-600 rounded-full animate-spin" />
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Loading Fiscal Directives...</p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {settingsData?.fees?.map((setting) => (
                                        <div key={setting.key} className="space-y-2 px-2">
                                            <div className="flex justify-between items-center">
                                                <label className="text-[9px] font-black text-text-muted uppercase tracking-[0.2em]">
                                                    {setting.label}
                                                </label>
                                                <span className="text-[8px] font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full">KES</span>
                                            </div>
                                            <input 
                                                type="number"
                                                step="0.01"
                                                value={localSettings[setting.key] || ''}
                                                onChange={(e) => handleSettingChange(setting.key, e.target.value)}
                                                className="w-full bg-gray-50/50 border border-gray-100 h-14 px-5 rounded-2xl font-black text-lg text-green-950 outline-none focus:border-brand-500 focus:bg-white transition-all"
                                            />
                                            <p className="text-[9px] font-bold text-text-muted/60 tracking-wide px-1">
                                                {setting.description}
                                            </p>
                                        </div>
                                    ))}

                                    <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3">
                                        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm shrink-0">
                                            <Zap size={14} className="text-amber-600" />
                                        </div>
                                        <div className="space-y-1">
                                            <h4 className="text-[10px] font-black text-amber-900 uppercase tracking-tight">Active Policy Notice</h4>
                                            <p className="text-[9px] font-bold text-amber-800/70 leading-relaxed">
                                                Changes to service fees apply immediately to all new reservations. Existing pending reservations will retain their original fee structure to maintain financial integrity.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    {/* Account Hub */}
                    <TabsContent value="account">
                        <div className="bg-white rounded-[2.5rem] p-6 border border-gray-50 shadow-sm space-y-8">
                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    <div className="w-20 h-20 bg-gray-100 rounded-[1.5rem] flex items-center justify-center border-4 border-white shadow-md overflow-hidden">
                                        {user?.avatar_url ? (
                                            <img src={user.avatar_url} alt="Admin" className="w-full h-full object-cover" />
                                        ) : (
                                            <User size={32} className="text-gray-300" />
                                        )}
                                    </div>
                                    <button className="absolute bottom-0 right-0 w-8 h-8 bg-brand-600 text-white rounded-xl flex items-center justify-center border-2 border-white shadow-sm active:scale-90 transition-all">
                                        <Camera size={14} />
                                    </button>
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-green-950 uppercase tracking-tight mb-1">{user?.name || 'County Admin'}</h3>
                                    <div className="px-3 py-1 bg-brand-50 text-brand-700 rounded-full text-[9px] font-black uppercase tracking-widest inline-block border border-brand-100">
                                        Super-Admin Level 4
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-1.5 px-2">
                                    <label className="text-[9px] font-black text-text-muted uppercase tracking-[0.2em]">Contact Email</label>
                                    <input type="email" defaultValue={user?.email || ""} className="w-full bg-gray-50/50 border border-gray-100 h-14 px-5 rounded-2xl font-bold text-sm text-green-950 outline-none focus:border-brand-500 transition-all" />
                                </div>
                                <div className="space-y-1.5 px-2">
                                    <label className="text-[9px] font-black text-text-muted uppercase tracking-[0.2em]">Terminal Linkage</label>
                                    <div className="flex items-center gap-2 bg-gray-50/50 border border-gray-100 h-14 px-5 rounded-2xl text-xs font-black uppercase tracking-widest text-text-secondary">
                                        <Smartphone size={16} />
                                        {user?.phone || "+254 XXX XXX XXX"}
                                    </div>
                                </div>
                            </div>

                            <button 
                                onClick={() => logout()}
                                className="w-full h-14 bg-rose-50 text-rose-600 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 active:bg-rose-100 active:scale-[0.98] transition-all"
                            >
                                <LogOut size={16} /> Disconnect Terminal
                            </button>
                        </div>
                    </TabsContent>

                    {/* Security Hub */}
                    <TabsContent value="security">
                        <div className="bg-white rounded-[2.5rem] p-6 border border-gray-50 shadow-sm space-y-6">
                            <h3 className="text-sm font-black text-green-950 uppercase tracking-tight mb-2 flex items-center gap-2">
                                <Shield size={16} className="text-rose-600" />
                                Fortification Settings
                            </h3>

                            <div className="space-y-4">
                                {[
                                    { label: 'Multi-Factor Auth', desc: 'Secure login via SMS OTP', icon: Smartphone, active: true },
                                    { label: 'Biometric Gateway', desc: 'FaceID/Fingerprint for PWA', icon: User, active: false },
                                    { label: 'Transaction PIN', desc: 'Require PIN for disbursements', icon: CreditCard, active: true }
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-text-secondary">
                                                <item.icon size={18} />
                                            </div>
                                            <div>
                                                <h4 className="text-[11px] font-black text-green-950 uppercase tracking-tight">{item.label}</h4>
                                                <p className="text-[9px] font-bold text-text-muted tracking-wide">{item.desc}</p>
                                            </div>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" className="sr-only peer" defaultChecked={item.active} />
                                            <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-500"></div>
                                        </label>
                                    </div>
                                ))}
                            </div>

                            <div className="pt-4 border-t border-gray-50">
                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 ml-1">Terminal Persistence</h4>
                                <div className="space-y-3">
                                    <div className="p-4 bg-white border border-gray-100 rounded-2xl flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-green-50 text-green-600 rounded-lg flex items-center justify-center">
                                                <Smartphone size={14} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-green-950 uppercase tracking-tight leading-none">Pixel 7 Pro (Active)</p>
                                                <p className="text-[8px] font-bold text-text-muted uppercase tracking-widest">Nairobi, Kenya • Now</p>
                                            </div>
                                        </div>
                                        <span className="text-[8px] font-black text-brand-600 uppercase">Current</span>
                                    </div>
                                    <div className="p-4 bg-white border border-gray-100 rounded-2xl flex items-center justify-between opacity-60">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-gray-50 text-gray-400 rounded-lg flex items-center justify-center">
                                                <Database size={14} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-green-950 uppercase tracking-tight leading-none">Desktop Chrome</p>
                                                <p className="text-[8px] font-bold text-text-muted uppercase tracking-widest">Mombasa, Kenya • 2h ago</p>
                                            </div>
                                        </div>
                                        <button className="text-[8px] font-black text-rose-600 uppercase hover:underline">Revoke</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>

            {/* Global Operational Command Strip */}
            <div className="fixed bottom-24 left-4 right-4 lg:hidden z-40">
                <button 
                    onClick={handleSave}
                    disabled={updateMutation.isPending || savedState}
                    className={cn(
                        "w-full h-16 rounded-[1.5rem] text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl transition-all flex items-center justify-center gap-3",
                        savedState 
                            ? "bg-green-500 text-white shadow-green-500/20" 
                            : "bg-gray-950 text-white shadow-gray-950/20 active:scale-95"
                    )}
                >
                    {updateMutation.isPending ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : savedState ? (
                        <><CheckCircle2 size={20} /> Integrity Verified</>
                    ) : (
                        <><Save size={20} className="text-brand-400" /> Save Configuration</>
                    )}
                </button>
            </div>
        </div>
    );
}
