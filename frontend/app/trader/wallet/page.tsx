'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    CreditCard, 
    Plus, 
    ArrowUpRight, 
    ArrowDownLeft, 
    History, 
    Calendar,
    Info,
    ChevronRight,
    Wallet as WalletIcon,
    RefreshCcw,
    CheckCircle2,
    AlertCircle
} from 'lucide-react';
import { useWallet, WalletTransaction } from '@/hooks/useWallet';
import { useTranslation } from '@/hooks/useTranslation';
import { useMpesa } from '@/hooks/useMpesa';
import { useUIStore } from '@/store/uiStore';
import MpesaPaymentSheet from '@/components/shared/MpesaPaymentSheet';
// import { format } from 'date-fns';
import { Skeleton } from '../../../components/ui/skeleton';

export default function TraderWalletPage() {
    const { t } = useTranslation();
    const { setPageTitle } = useUIStore();

    React.useEffect(() => {
        setPageTitle(t('wallet.title') || 'Wallet Yangu');
    }, [setPageTitle, t]);

    const { wallet, transactions, walletLoading, updateFrequency } = useWallet();
    const [isTopUpOpen, setIsTopUpOpen] = useState(false);
    const [selectedFrequency, setSelectedFrequency] = useState(wallet?.frequency || 'daily');

    const formatDate = (date: Date) => {
        try {
            return new Intl.DateTimeFormat('en-US', {
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: 'numeric',
                hour12: true
            }).format(date);
        } catch (e) {
            return date.toLocaleDateString();
        }
    };

    const handleFrequencyChange = (freq: 'daily' | 'weekly') => {
        setSelectedFrequency(freq);
        updateFrequency.mutate(freq);
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { 
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    };

    return (
        <div className="bg-transparent pb-24">
            <motion.div 
                className="max-w-4xl mx-auto space-y-8"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {/* Header Section Removed - Dynamic Title used instead */}

                {/* Balance Card */}
                <motion.div variants={itemVariants} className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-brand-600 to-brand-800 p-8 shadow-2xl shadow-brand-900/20 text-white">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-brand-400/20 rounded-full -ml-24 -mb-24 blur-2xl" />
                    
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                        <div className="space-y-2">
                            <span className="text-xs font-black uppercase tracking-[0.2em] text-brand-100/80">Salio la Sasa (Current Balance)</span>
                            <div className="flex items-baseline gap-2">
                                <span className="text-xl font-bold opacity-70">KES</span>
                                <h2 className="text-5xl font-black tracking-tighter">
                                    {walletLoading ? '---' : Number(wallet?.balance).toLocaleString()}
                                </h2>
                            </div>
                        </div>

                        <button 
                            onClick={() => setIsTopUpOpen(true)}
                            className="bg-white text-brand-700 px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-3 shadow-xl shadow-black/10 active:scale-95 transition-all hover:bg-brand-50"
                        >
                            <Plus size={18} strokeWidth={3} />
                            {t('wallet.top_up') || 'Ongeza Salio'}
                        </button>
                    </div>

                    <div className="mt-8 pt-8 border-t border-white/10 flex flex-wrap gap-6 items-center">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                                <RefreshCcw size={14} className="text-brand-200" />
                            </div>
                            <span className="text-xs font-bold text-brand-100">
                                {t('wallet.last_deduction') || 'Deduction ya mwisho'}: {wallet?.last_deduction ? formatDate(new Date(wallet.last_deduction)) : 'Bado'}
                            </span>
                        </div>
                    </div>
                </motion.div>

                {/* Frequency & Settings Group */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Frequency Selector */}
                    <motion.div variants={itemVariants} className="md:col-span-2 bg-white rounded-[32px] border border-gray-100 p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-brand-50 rounded-2xl text-brand-600">
                                    <Calendar size={20} />
                                </div>
                                <div>
                                    <h3 className="font-black text-green-950 tracking-tight">{t('wallet.frequency') || 'Mfumo wa Malipo'}</h3>
                                    <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider">{t('wallet.deduction_choice') || 'Chagua kila lini ukatwe ada'}</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <button 
                                onClick={() => handleFrequencyChange('daily')}
                                className={`p-4 rounded-2xl border-2 transition-all flex flex-col gap-2 ${
                                    selectedFrequency === 'daily' 
                                        ? 'border-brand-600 bg-brand-50/50 shadow-inner' 
                                        : 'border-gray-50 hover:bg-gray-50'
                                }`}
                            >
                                <span className="text-sm font-black text-green-950">{t('wallet.daily') || 'Daily (Kila Siku)'}</span>
                                <span className="text-[10px] font-medium text-text-secondary leading-tight">Ada itakatwa kila asubuhi kwenye salio lako.</span>
                            </button>

                            <button 
                                onClick={() => handleFrequencyChange('weekly')}
                                className={`p-4 rounded-2xl border-2 transition-all flex flex-col gap-2 ${
                                    selectedFrequency === 'weekly' 
                                        ? 'border-brand-600 bg-brand-50/50 shadow-inner' 
                                        : 'border-gray-50 hover:bg-gray-50'
                                }`}
                            >
                                <span className="text-sm font-black text-green-950">{t('wallet.weekly') || 'Weekly (Kila Wiki)'}</span>
                                <span className="text-[10px] font-medium text-text-secondary leading-tight">Ada itakatwa mara moja kila mwisho wa wiki.</span>
                            </button>
                        </div>

                        <div className="mt-6 flex items-start gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-100">
                            <Info size={16} className="text-amber-600 mt-0.5 shrink-0" />
                            <p className="text-[11px] font-medium text-amber-900/80 leading-relaxed italic">
                                <strong>Kumbuka:</strong> Ada ya mwezi imegawanywa kulingana na chaguo lako. Hakikisha wallet yako ina salio kila wakati kuzuia faini ya ucheleweshaji baada ya siku 14.
                            </p>
                        </div>
                    </motion.div>

                    {/* Quick Stats/Status */}
                    <motion.div variants={itemVariants} className="bg-white rounded-[32px] border border-gray-100 p-6 shadow-sm flex flex-col justify-between">
                         <div>
                            <h3 className="font-black text-green-950 tracking-tight mb-4">{t('wallet.status') || 'Hali ya Wallet'}</h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-text-secondary">Uingizaji (Credits)</span>
                                    <span className="text-xs font-black text-brand-600">+ KES 0</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-text-secondary">Utoaji (Debits)</span>
                                    <span className="text-xs font-black text-red-600">- KES 0</span>
                                </div>
                            </div>
                         </div>

                         <div className="mt-6 pt-6 border-t border-gray-50">
                            <div className={`flex items-center gap-3 p-3 rounded-2xl ${wallet?.is_active ? 'bg-green-50' : 'bg-red-50'}`}>
                                {wallet?.is_active ? <CheckCircle2 size={18} className="text-green-600" /> : <AlertCircle size={18} className="text-red-600" />}
                                <span className={`text-[10px] font-black uppercase tracking-wider ${wallet?.is_active ? 'text-green-700' : 'text-red-700'}`}>
                                    {wallet?.is_active ? 'Wallet Iko Sawa' : 'Wallet Imefungwa'}
                                </span>
                            </div>
                         </div>
                    </motion.div>
                </div>

                {/* Transaction History */}
                <motion.div variants={itemVariants} className="space-y-4">
                    <div className="flex items-center gap-2 px-2">
                        <History size={20} className="text-brand-600" />
                        <h3 className="text-lg font-black text-green-950">{t('wallet.history') || 'Historia ya Wallet'}</h3>
                    </div>

                    <div className="space-y-3">
                        {walletLoading ? (
                            Array.from({ length: 4 }).map((_, i) => (
                                <Skeleton key={i} className="w-full h-24 rounded-3xl" />
                            ))
                        ) : transactions.length > 0 ? (
                            transactions.map((tx: WalletTransaction) => (
                                <div key={tx.id} className="bg-white p-5 rounded-[24px] border border-gray-50 flex items-center justify-between group hover:border-brand-200 transition-all shadow-sm">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${
                                            tx.type === 'credit' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                                        }`}>
                                            {tx.type === 'credit' ? <ArrowDownLeft size={24} /> : <ArrowUpRight size={24} />}
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-green-950 truncate max-w-[200px] md:max-w-md">{tx.description}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">{formatDate(new Date(tx.created_at))}</span>
                                                <span className="text-[10px] font-black text-text-muted opacity-30">•</span>
                                                <span className="text-[10px] font-black text-text-muted uppercase tracking-wider">{tx.reference_type || 'SYSTEM'}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className={`text-right ${tx.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                                        <p className="text-lg font-black tracking-tighter">
                                            {tx.type === 'credit' ? '+' : '-'} {Number(tx.amount).toLocaleString()}
                                        </p>
                                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">KES</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="bg-gray-50 rounded-[32px] p-12 text-center border-2 border-dashed border-gray-200">
                                <WalletIcon size={48} className="mx-auto text-gray-300 mb-4" />
                                <p className="text-sm font-bold text-text-secondary">{t('wallet.no_transactions') || 'Hakuna historia ya malipo bado.'}</p>
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>

            {/* M-Pesa Top-up Sheet */}
            <MpesaPaymentSheet 
                isOpen={isTopUpOpen}
                onClose={() => setIsTopUpOpen(false)}
                type="wallet_topup"
                title={t('wallet.top_up_mpesa') || 'Ongeza Salio na M-Pesa'}
                description={t('wallet.top_up_desc') || 'Salio litaongezwa kwenye wallet yako mara moja baada ya kulipa.'}
                onSuccess={() => {
                   // Refresh wallet data
                   setIsTopUpOpen(false);
                }}
            />
        </div>
    );
}
