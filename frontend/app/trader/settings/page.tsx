'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Bell, Eye, Globe, Lock, LogOut, Key,
    Zap, ShieldCheck, ShieldAlert, ChevronDown, ChevronUp,
    Trash2, CheckCircle2, AlertTriangle, Info, Loader2, Eye as EyeIcon, EyeOff,
} from 'lucide-react';
import api from '@/lib/api';
import { ApiResponse } from '@/types';
import { useUIStore } from '@/store/uiStore';

// ─── Types ────────────────────────────────────────────────────────────────────

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

interface CustomMpesaState {
    enabled: boolean;
    shortcode: string | null;
    transaction_type: 'CustomerPayBillOnline' | 'CustomerBuyGoodsOnline' | null;
    environment: 'sandbox' | 'production' | null;
    verified_at: string | null;
    has_credentials: boolean;
    consumer_key_hint: string | null;
}

interface MpesaFormData {
    consumer_key: string;
    consumer_secret: string;
    passkey: string;
    shortcode: string;
    transaction_type: 'CustomerPayBillOnline' | 'CustomerBuyGoodsOnline';
    environment: 'sandbox' | 'production';
}

// ─── Sub-components ───────────────────────────────────────────────────────────

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
                className={`relative w-12 h-6 rounded-full transition-colors shrink-0 ${checked ? 'bg-brand-600' : 'bg-gray-300'}`}
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
                <div className="w-8 h-8 bg-brand-600/10 rounded-xl flex items-center justify-center text-brand-600">{icon}</div>
                <h2 className="font-black text-text-primary text-sm uppercase tracking-wider">{title}</h2>
            </div>
            <div className="px-5">{children}</div>
        </div>
    );
}

function PasswordField({ id, label, value, onChange, placeholder }: {
    id: string; label: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
    const [show, setShow] = useState(false);
    return (
        <div className="flex flex-col gap-1.5">
            <label htmlFor={id} className="text-xs font-bold text-text-secondary uppercase tracking-wide">{label}</label>
            <div className="relative">
                <input
                    id={id}
                    type={show ? 'text' : 'password'}
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    placeholder={placeholder}
                    className="w-full h-12 px-4 pr-12 rounded-xl border-2 border-gray-200 text-sm font-medium focus:outline-none focus:border-brand-600 transition-colors bg-gray-50"
                />
                <button
                    type="button"
                    onClick={() => setShow(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                    aria-label={show ? 'Hide' : 'Show'}
                >
                    {show ? <EyeOff className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                </button>
            </div>
        </div>
    );
}

// ─── Custom M-Pesa Section ────────────────────────────────────────────────────

function CustomMpesaSection() {
    const queryClient = useQueryClient();

    const { data: mpesa, isLoading } = useQuery({
        queryKey: ['trader-mpesa-integration'],
        queryFn: async () => {
            const res = await api.get<never, ApiResponse<CustomMpesaState>>('/trader/mpesa-integration');
            return res.data;
        },
    });

    const [formOpen, setFormOpen] = useState(false);
    const [form, setForm] = useState<MpesaFormData>({
        consumer_key:     '',
        consumer_secret:  '',
        passkey:          '',
        shortcode:        '',
        transaction_type: 'CustomerPayBillOnline',
        environment:      'sandbox',
    });
    const [error, setError] = useState<string | null>(null);

    const { mutate: save, isPending: saving } = useMutation({
        mutationFn: (data: MpesaFormData & { enabled: boolean }) =>
            api.post('/trader/mpesa-integration', data),
        onSuccess: () => {
            setError(null);
            setFormOpen(false);
            queryClient.invalidateQueries({ queryKey: ['trader-mpesa-integration'] });
        },
        onError: (err: { response?: { data?: { message?: string } } }) => {
            setError(err?.response?.data?.message ?? 'Failed to save. Please try again.');
        },
    });

    const { mutate: disable, isPending: disabling } = useMutation({
        mutationFn: () => api.post('/trader/mpesa-integration', { enabled: false }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['trader-mpesa-integration'] }),
    });

    const { mutate: remove, isPending: removing } = useMutation({
        mutationFn: () => api.delete('/trader/mpesa-integration'),
        onSuccess: () => {
            setFormOpen(false);
            queryClient.invalidateQueries({ queryKey: ['trader-mpesa-integration'] });
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        save({ ...form, enabled: true });
    };

    const isVerified = !!mpesa?.verified_at;
    const isActive   = !!mpesa?.enabled && !!mpesa?.has_credentials;

    if (isLoading) {
        return <div className="h-16 bg-gray-100 animate-pulse rounded-xl mx-5 my-4" />;
    }

    return (
        <div className="px-0">
            {/* Status Row */}
            <div className="flex items-center justify-between py-4 px-5 border-b border-gray-50">
                <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isActive
                            ? isVerified ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'
                            : 'bg-gray-100 text-gray-400'
                    }`}>
                        {isActive
                            ? isVerified ? <ShieldCheck className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />
                            : <Zap className="w-4 h-4" />
                        }
                    </div>
                    <div>
                        <p className="font-bold text-sm text-text-primary">
                            {isActive
                                ? `Custom M-Pesa${mpesa.shortcode ? ` · ${mpesa.shortcode}` : ''}`
                                : 'Use My Own M-Pesa API'
                            }
                        </p>
                        <p className="text-xs text-text-muted">
                            {isActive
                                ? isVerified
                                    ? `Verified · ${mpesa.transaction_type === 'CustomerBuyGoodsOnline' ? 'Buy Goods Till' : 'Paybill'} · ${mpesa.environment}`
                                    : 'Credentials saved but not yet verified'
                                : 'Route reservation payments directly to your M-Pesa'
                            }
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 ml-3">
                    {isActive && (
                        <button
                            onClick={() => disable(undefined)}
                            disabled={disabling}
                            className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-text-secondary hover:bg-gray-50 transition-colors font-semibold"
                        >
                            {disabling ? 'Disabling…' : 'Disable'}
                        </button>
                    )}
                    <button
                        onClick={() => setFormOpen(v => !v)}
                        className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-bold transition-all ${
                            formOpen
                                ? 'bg-gray-100 text-text-secondary'
                                : isActive
                                    ? 'bg-brand-600/10 text-brand-600 hover:bg-brand-600/20'
                                    : 'bg-brand-600 text-white hover:bg-brand-500 shadow-sm'
                        }`}
                    >
                        {formOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        {isActive ? 'Edit' : 'Setup'}
                    </button>
                </div>
            </div>

            {/* Info Banner */}
            <div className="mx-5 mt-4 mb-2 p-3 bg-blue-50 rounded-xl flex gap-2.5">
                <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                <p className="text-xs text-blue-700 leading-relaxed">
                    When enabled, <strong>reservation payments</strong> go directly to your M-Pesa shortcode. 
                    Market fees &amp; platform service charges are always collected by Soko Mtaa separately.
                </p>
            </div>

            {/* Credential Form */}
            <AnimatePresence>
                {formOpen && (
                    <motion.form
                        key="mpesa-form"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                        onSubmit={handleSubmit}
                        className="overflow-hidden"
                    >
                        <div className="px-5 pb-5 space-y-4 pt-3">
                            {/* Existing credentials hint */}
                            {mpesa?.consumer_key_hint && (
                                <div className="p-3 bg-green-50 rounded-xl flex items-center gap-2.5">
                                    <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                                    <p className="text-xs text-green-700 font-medium">
                                        Credentials on file ending in <code className="font-mono bg-green-100 px-1 rounded">{mpesa.consumer_key_hint.slice(-4)}</code>.
                                        Leave fields blank to keep existing values.
                                    </p>
                                </div>
                            )}

                            {/* Environment toggle */}
                            <div>
                                <p className="text-xs font-bold text-text-secondary uppercase tracking-wide mb-2">Environment</p>
                                <div className="flex gap-2">
                                    {(['sandbox', 'production'] as const).map(env => (
                                        <button
                                            key={env}
                                            type="button"
                                            onClick={() => setForm(f => ({ ...f, environment: env }))}
                                            className={`flex-1 py-3 rounded-xl font-bold text-sm border-2 transition-all capitalize ${
                                                form.environment === env
                                                    ? env === 'production'
                                                        ? 'border-amber-500 bg-amber-50 text-amber-700'
                                                        : 'border-brand-600 bg-brand-600/5 text-brand-600'
                                                    : 'border-gray-200 text-text-secondary hover:border-gray-300'
                                            }`}
                                        >
                                            {env}
                                        </button>
                                    ))}
                                </div>
                                {form.environment === 'production' && (
                                    <div className="flex items-center gap-2 mt-2 p-2.5 bg-amber-50 rounded-lg">
                                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                        <p className="text-xs text-amber-700">Production credentials process real money. Ensure your Safaricom portal is fully configured.</p>
                                    </div>
                                )}
                            </div>

                            {/* Transaction type */}
                            <div>
                                <p className="text-xs font-bold text-text-secondary uppercase tracking-wide mb-2">Payment Type</p>
                                <div className="flex gap-2">
                                    {[
                                        { value: 'CustomerPayBillOnline', label: 'Paybill' },
                                        { value: 'CustomerBuyGoodsOnline', label: 'Buy Goods / Till' },
                                    ].map(opt => (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => setForm(f => ({ ...f, transaction_type: opt.value as MpesaFormData['transaction_type'] }))}
                                            className={`flex-1 py-3 rounded-xl font-bold text-sm border-2 transition-all ${
                                                form.transaction_type === opt.value
                                                    ? 'border-brand-600 bg-brand-600/5 text-brand-600'
                                                    : 'border-gray-200 text-text-secondary hover:border-gray-300'
                                            }`}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Shortcode */}
                            <div className="flex flex-col gap-1.5">
                                <label htmlFor="mpesa-shortcode" className="text-xs font-bold text-text-secondary uppercase tracking-wide">
                                    {form.transaction_type === 'CustomerBuyGoodsOnline' ? 'Till Number' : 'Paybill Shortcode'}
                                </label>
                                <input
                                    id="mpesa-shortcode"
                                    type="text"
                                    inputMode="numeric"
                                    value={form.shortcode}
                                    onChange={e => setForm(f => ({ ...f, shortcode: e.target.value }))}
                                    placeholder={form.transaction_type === 'CustomerBuyGoodsOnline' ? 'e.g. 5678901' : 'e.g. 174379'}
                                    className="w-full h-12 px-4 rounded-xl border-2 border-gray-200 text-sm font-medium focus:outline-none focus:border-brand-600 transition-colors bg-gray-50 font-mono"
                                />
                            </div>

                            {/* Credentials */}
                            <PasswordField
                                id="mpesa-consumer-key"
                                label="Consumer Key"
                                value={form.consumer_key}
                                onChange={v => setForm(f => ({ ...f, consumer_key: v }))}
                                placeholder="From Safaricom Daraja portal"
                            />
                            <PasswordField
                                id="mpesa-consumer-secret"
                                label="Consumer Secret"
                                value={form.consumer_secret}
                                onChange={v => setForm(f => ({ ...f, consumer_secret: v }))}
                                placeholder="From Safaricom Daraja portal"
                            />
                            <PasswordField
                                id="mpesa-passkey"
                                label="Lipa Na M-Pesa Passkey"
                                value={form.passkey}
                                onChange={v => setForm(f => ({ ...f, passkey: v }))}
                                placeholder="Long passkey from Daraja portal"
                            />

                            {/* Error */}
                            {error && (
                                <div className="p-3 bg-red-50 rounded-xl flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                                    <p className="text-xs text-red-700 font-medium">{error}</p>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-3 pt-1">
                                <button
                                    type="submit"
                                    disabled={saving || (!form.consumer_key && !mpesa?.has_credentials)}
                                    className="flex-1 h-12 rounded-xl bg-brand-600 text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-brand-500 transition-colors disabled:opacity-50 shadow-sm shadow-brand-600/20"
                                >
                                    {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                                    {saving ? 'Verifying with Safaricom…' : 'Verify & Save'}
                                </button>
                                {mpesa?.has_credentials && (
                                    <button
                                        type="button"
                                        onClick={() => remove(undefined)}
                                        disabled={removing}
                                        className="h-12 w-12 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition-colors flex items-center justify-center shrink-0"
                                        aria-label="Remove credentials"
                                    >
                                        {removing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                    </button>
                                )}
                            </div>
                        </div>
                    </motion.form>
                )}
            </AnimatePresence>

            <div className="h-4" />
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

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
        setLocal({ ...current, [section]: { ...(current as Record<string, unknown>)[section] as Record<string, unknown>, [key]: value } } as TraderSettings);
    };

    if (isLoading || !current) {
        return (
            <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
                {[1, 2, 3, 4].map(i => <div key={i} className="h-48 bg-gray-100 rounded-2xl animate-pulse" />)}
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto px-4 lg:px-8 py-6 lg:py-8 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-green-950 tracking-tight">Settings</h1>
                    <p className="text-sm text-text-muted mt-1">Manage your store preferences and integrations</p>
                </div>
                {local && (
                    <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={() => save(current)}
                        disabled={isPending}
                        className="px-6 py-3 bg-brand-600 text-white rounded-xl font-bold text-sm hover:bg-brand-500 transition-colors disabled:opacity-60 shadow-lg shadow-brand-600/20 flex items-center gap-2"
                    >
                        {saved ? <CheckCircle2 className="w-4 h-4" /> : null}
                        {saved ? 'Saved' : isPending ? 'Saving...' : 'Save Changes'}
                    </motion.button>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                {/* Column 1 */}
                <div className="space-y-6">
                    {/* Notifications */}
                    <Section title="Notifications" icon={<Bell className="w-4 h-4" />}>
                        <ToggleRow label="New Orders (SMS)" description="Get an SMS when a new order is placed" checked={current.notifications.new_order_sms} onChange={v => update('notifications.new_order_sms', v)} />
                        <ToggleRow label="New Orders (In-App)" checked={current.notifications.new_order_app} onChange={v => update('notifications.new_order_app', v)} />
                        <ToggleRow label="Market Fee Reminder (SMS)" checked={current.notifications.fee_reminder_sms} onChange={v => update('notifications.fee_reminder_sms', v)} />
                        <ToggleRow label="New Reviews (In-App)" checked={current.notifications.new_review_app} onChange={v => update('notifications.new_review_app', v)} />
                        <ToggleRow label="Daily Summary (In-App)" description="Evening summary of today's orders" checked={current.notifications.daily_summary_app} onChange={v => update('notifications.daily_summary_app', v)} />
                        <ToggleRow label="Market Updates (SMS)" checked={current.notifications.market_updates_sms} onChange={v => update('notifications.market_updates_sms', v)} />
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
                                                ? 'border-brand-600 bg-brand-600/5 text-brand-600'
                                                : 'border-gray-200 text-text-secondary hover:border-gray-300'
                                        }`}
                                    >
                                        {l.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </Section>
                </div>

                {/* Column 2 */}
                <div className="space-y-6">
                    {/* Custom M-Pesa Integration */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
                            <div className="w-8 h-8 bg-brand-600/10 rounded-xl flex items-center justify-center text-brand-600">
                                <Zap className="w-4 h-4" />
                            </div>
                            <h2 className="font-black text-text-primary text-sm uppercase tracking-wider">M-Pesa Integration</h2>
                        </div>
                        <CustomMpesaSection />
                    </div>

                    {/* Privacy */}
                    <Section title="Privacy" icon={<Eye className="w-4 h-4" />}>
                        <ToggleRow label="Show Phone Number to Customers" description="Customers can see your M-Pesa number on your profile" checked={current.privacy.show_phone_to_customers} onChange={v => update('privacy.show_phone_to_customers', v)} />
                        <ToggleRow label="Show Order Count on Profile" checked={current.privacy.show_order_count_on_profile} onChange={v => update('privacy.show_order_count_on_profile', v)} />
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
        </div>
    );
}
