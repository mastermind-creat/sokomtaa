'use client';

import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Bell, Eye, Globe, Lock, LogOut, Key } from 'lucide-react';
import api from '@/lib/api';
import { ApiResponse } from '@/types';

import { useUIStore } from '@/store/uiStore';
import { useTranslation } from '@/hooks/useTranslation';

interface TraderSettings {
    notifications: {
        new_order_sms: boolean;
        new_order_app: boolean;
        fee_reminder_sms: boolean;
        new_review_app: boolean;
        daily_summary_app: boolean;
        market_updates_sms: boolean;
    };
    privacy: {
        show_phone_to_customers: boolean;
        show_order_count_on_profile: boolean;
    };
    language: 'en' | 'sw';
}

function ToggleRow({ label, description, checked, onChange }: {
    label: string; description?: string; checked: boolean; onChange: (v: boolean) => void;
}) {
    return (
        <div className="flex items-center justify-between py-4 border-b border-gray-50 last:border-0">
            <div className="min-w-0 pr-4">
                <p className="font-semibold text-sm text-text-primary">{label}</p>
                {description && <p className="text-xs text-text-muted mt-0.5">{description}</p>}
            </div>
            <button
                onClick={() => onChange(!checked)}
                className={`relative w-12 h-6 rounded-full transition-colors shrink-0 ${checked ? 'bg-primary' : 'bg-gray-200'}`}
                aria-label={label}
                role="switch"
                aria-checked={checked}
            >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
        </div>
    );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
                <div className="w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center text-primary">{icon}</div>
                <h2 className="font-black text-text-primary text-sm uppercase tracking-wider">{title}</h2>
            </div>
            <div className="px-5">{children}</div>
        </div>
    );
}

export default function TraderSettingsPage() {
    const [saved, setSaved] = useState(false);
    const { setPageTitle } = useUIStore();

    React.useEffect(() => {
        setPageTitle('Settings');
    }, [setPageTitle]);

    const { data: settings, isLoading } = useQuery({
        queryKey: ['trader-settings'],
        queryFn: async () => {
            const res = await api.get<never, ApiResponse<TraderSettings>>('/trader/settings');
            return res.data;
        },
    });

    const [local, setLocal] = useState<TraderSettings | null>(null);
    const current = local ?? settings;

    const { mutate: save, isPending } = useMutation({
        mutationFn: (data: TraderSettings) => api.put('/trader/settings', data),
        onSuccess: () => { setSaved(true); setTimeout(() => setSaved(false), 2000); },
    });

    const update = (path: string, value: boolean | string) => {
        if (!current) return;
        const [section, key] = path.split('.');
        setLocal({ ...current, [section]: { ...(current as any)[section], [key]: value } } as TraderSettings);
    };

    if (isLoading || !current) {
        return (
            <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
                {[1, 2, 3].map(i => <div key={i} className="h-48 bg-gray-100 rounded-2xl animate-pulse" />)}
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
                <div className="flex items-center justify-end">
                    {local && (
                        <motion.button
                            whileTap={{ scale: 0.97 }}
                            onClick={() => save(current)}
                            disabled={isPending}
                            className="px-5 py-2.5 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary-light transition-colors disabled:opacity-60 shadow-lg shadow-primary/20"
                        >
                            {saved ? 'Saved ✓' : isPending ? 'Saving...' : 'Save Changes'}
                        </motion.button>
                    )}
                </div>

                {/* Notifications */}
                <Section title="Notifications" icon={<Bell className="w-4 h-4" />}>
                    <ToggleRow label="New Orders (SMS)" description="Get an SMS when a new order is placed" checked={current.notifications.new_order_sms} onChange={v => update('notifications.new_order_sms', v)} />
                    <ToggleRow label="New Orders (In-App)" checked={current.notifications.new_order_app} onChange={v => update('notifications.new_order_app', v)} />
                    <ToggleRow label="Market Fee Reminder (SMS)" checked={current.notifications.fee_reminder_sms} onChange={v => update('notifications.fee_reminder_sms', v)} />
                    <ToggleRow label="New Reviews (In-App)" checked={current.notifications.new_review_app} onChange={v => update('notifications.new_review_app', v)} />
                    <ToggleRow label="Daily Summary (In-App)" description="Evening summary of today's orders" checked={current.notifications.daily_summary_app} onChange={v => update('notifications.daily_summary_app', v)} />
                    <ToggleRow label="Market Updates (SMS)" checked={current.notifications.market_updates_sms} onChange={v => update('notifications.market_updates_sms', v)} />
                </Section>

                {/* Privacy */}
                <Section title="Privacy" icon={<Eye className="w-4 h-4" />}>
                    <ToggleRow label="Show Phone Number to Customers" description="Customers can see your M-Pesa number on your profile" checked={current.privacy.show_phone_to_customers} onChange={v => update('privacy.show_phone_to_customers', v)} />
                    <ToggleRow label="Show Order Count on Profile" checked={current.privacy.show_order_count_on_profile} onChange={v => update('privacy.show_order_count_on_profile', v)} />
                </Section>

                {/* Language */}
                <Section title="Display" icon={<Globe className="w-4 h-4" />}>
                    <div className="py-4">
                        <p className="text-sm font-bold text-text-primary mb-3">Language</p>
                        <div className="flex gap-3">
                            {[{ key: 'en', label: 'English' }, { key: 'sw', label: 'Kiswahili' }].map(l => (
                                <button
                                    key={l.key}
                                    onClick={() => update('language', l.key)}
                                    className={`flex-1 py-3 rounded-xl font-bold text-sm border-2 transition-all ${
                                        current.language === l.key
                                            ? 'border-primary bg-primary/5 text-primary'
                                            : 'border-gray-200 text-text-secondary hover:border-gray-300'
                                    }`}
                                >
                                    {l.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </Section>

                {/* Account */}
                <Section title="Account" icon={<Lock className="w-4 h-4" />}>
                    <button className="flex items-center gap-3 w-full py-4 border-b border-gray-50 hover:bg-gray-50 transition-colors rounded-xl px-1 min-h-[56px]">
                        <Key className="w-4 h-4 text-text-secondary" />
                        <span className="text-sm font-semibold text-text-primary">Change Password</span>
                    </button>
                    <button className="flex items-center gap-3 w-full py-4 hover:bg-red-50 transition-colors rounded-xl px-1 min-h-[56px]">
                        <LogOut className="w-4 h-4 text-red-500" />
                        <span className="text-sm font-semibold text-red-600">Request Account Deletion</span>
                    </button>
                </Section>
            </div>
        </div>
    );
}
