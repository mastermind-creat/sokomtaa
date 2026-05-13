'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus,
    ArrowUpRight,
    ArrowDownLeft,
    History,
    Calendar,
    Info,
    Wallet as WalletIcon,
    RefreshCcw,
    CheckCircle2,
    AlertCircle,
    Banknote,
    TrendingUp,
    TrendingDown,
    Clock,
    X,
    Phone,
    Loader2,
    ShieldCheck,
} from 'lucide-react';
import { useWallet, WalletTransaction } from '@/hooks/useWallet';
import { useTranslation } from '@/hooks/useTranslation';
import { useUIStore } from '@/store/uiStore';
import MpesaPaymentSheet from '@/components/shared/MpesaPaymentSheet';
import { Skeleton } from '../../../components/ui/skeleton';

export default function TraderWalletPage() {
    const { t } = useTranslation();
    const { setPageTitle } = useUIStore();

    React.useEffect(() => {
        setPageTitle('My Wallet');
    }, [setPageTitle]);

    const { wallet, transactions, walletLoading, transactionsLoading, updateFrequency, requestWithdrawal } = useWallet();
    const [isTopUpOpen, setIsTopUpOpen] = useState(false);
    const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [withdrawPhone, setWithdrawPhone] = useState(wallet?.mpesa_number || '');
    const [withdrawError, setWithdrawError] = useState('');
    const [withdrawSuccess, setWithdrawSuccess] = useState(false);
    const [selectedFrequency, setSelectedFrequency] = useState(wallet?.frequency || 'daily');
    const [txFilter, setTxFilter] = useState<'all' | 'credit' | 'debit'>('all');

    React.useEffect(() => {
        if (wallet?.mpesa_number && !withdrawPhone) {
            setWithdrawPhone(wallet.mpesa_number);
        }
    }, [wallet]);

    const formatDate = (date: Date) => {
        try {
            return new Intl.DateTimeFormat('en-KE', {
                month: 'short', day: 'numeric',
                hour: 'numeric', minute: 'numeric', hour12: true
            }).format(date);
        } catch (_e) {
            return date.toLocaleDateString();
        }
    };

    const handleFrequencyChange = (freq: 'daily' | 'weekly' | 'monthly') => {
        setSelectedFrequency(freq);
        updateFrequency.mutate(freq);
    };

    const handleWithdraw = () => {
        setWithdrawError('');
        const amount = parseFloat(withdrawAmount);
        if (isNaN(amount) || amount < 100) {
            setWithdrawError('Minimum withdrawal is KES 100.');
            return;
        }
        if (amount > (wallet?.balance ?? 0)) {
            setWithdrawError('Amount exceeds your available balance.');
            return;
        }
        if (!withdrawPhone.match(/^(?:254|\+254|0)?(7|1)[0-9]{8}$/)) {
            setWithdrawError('Please enter a valid Safaricom phone number.');
            return;
        }

        requestWithdrawal.mutate(
            { amount, mpesa_number: withdrawPhone },
            {
                onSuccess: () => {
                    setWithdrawSuccess(true);
                    setTimeout(() => {
                        setIsWithdrawOpen(false);
                        setWithdrawSuccess(false);
                        setWithdrawAmount('');
                    }, 2500);
                },
                onError: (err: { message?: string }) => {
                    setWithdrawError(err.message || 'Withdrawal failed. Please try again.');
                }
            }
        );
    };

    const filteredTx = txFilter === 'all'
        ? transactions
        : transactions.filter((tx: WalletTransaction) => tx.type === txFilter);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
    };
    const itemVariants = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } };

    return (
        <div className="bg-transparent pb-32">
            <motion.div
                className="max-w-4xl mx-auto space-y-6"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {/* ── Balance Card ── */}
                <motion.div variants={itemVariants} className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-brand-700 via-brand-600 to-brand-800 p-8 shadow-2xl shadow-brand-900/30 text-white">
                    {/* Background blobs */}
                    <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -mr-36 -mt-36 blur-3xl pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-56 h-56 bg-brand-400/20 rounded-full -ml-28 -mb-28 blur-2xl pointer-events-none" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/3 rounded-full blur-3xl pointer-events-none" />

                    <div className="relative z-10">
                        {/* Header row */}
                        <div className="flex items-start justify-between gap-4 mb-8">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-brand-200/80 mb-2">Available Balance</p>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-2xl font-bold opacity-60">KES</span>
                                    <span className="text-6xl font-black tracking-tighter tabular-nums">
                                        {walletLoading ? '···' : Number(wallet?.balance ?? 0).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                </div>
                                {(wallet?.pending_withdrawals ?? 0) > 0 && (
                                    <p className="mt-2 text-xs font-bold text-amber-300 flex items-center gap-1.5">
                                        <Clock size={12} />
                                        KES {Number(wallet?.pending_withdrawals).toLocaleString()} pending withdrawal
                                    </p>
                                )}
                            </div>
                            <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center">
                                <WalletIcon size={26} className="text-brand-200" />
                            </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-3">
                            <button
                                onClick={() => setIsTopUpOpen(true)}
                                className="flex-1 flex items-center justify-center gap-2 bg-white text-brand-700 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all hover:bg-brand-50"
                            >
                                <Plus size={16} strokeWidth={3} />
                                Top Up
                            </button>
                            <button
                                onClick={() => setIsWithdrawOpen(true)}
                                disabled={!wallet?.is_active || (wallet?.balance ?? 0) < 100}
                                className="flex-1 flex items-center justify-center gap-2 bg-white/10 border border-white/20 text-white py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest backdrop-blur-sm active:scale-95 transition-all hover:bg-white/20 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                <Banknote size={16} strokeWidth={2.5} />
                                Withdraw
                            </button>
                        </div>

                        {/* Summary row */}
                        <div className="mt-6 pt-6 border-t border-white/10 grid grid-cols-3 gap-4">
                            <div className="text-center">
                                <p className="text-[9px] font-black uppercase tracking-widest text-brand-200/60 mb-1">Total Earned</p>
                                <p className="text-sm font-black text-brand-100">
                                    {walletLoading ? '···' : `KES ${Number(wallet?.total_credits ?? 0).toLocaleString()}`}
                                </p>
                            </div>
                            <div className="text-center border-x border-white/10">
                                <p className="text-[9px] font-black uppercase tracking-widest text-brand-200/60 mb-1">Total Debited</p>
                                <p className="text-sm font-black text-brand-100">
                                    {walletLoading ? '···' : `KES ${Number(wallet?.total_debits ?? 0).toLocaleString()}`}
                                </p>
                            </div>
                            <div className="text-center">
                                <p className="text-[9px] font-black uppercase tracking-widest text-brand-200/60 mb-1">Last Deduction</p>
                                <p className="text-sm font-black text-brand-100">
                                    {wallet?.last_deduction ? formatDate(new Date(wallet.last_deduction)) : 'None'}
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* ── Stats Row ── */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <motion.div variants={itemVariants} className="bg-white rounded-[2rem] border border-gray-100 p-5 shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center text-green-600 shrink-0">
                            <TrendingUp size={22} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">From Sales</p>
                            <p className="text-lg font-black text-green-950 tabular-nums">
                                {walletLoading ? '···' : `KES ${Number(wallet?.total_credits ?? 0).toLocaleString()}`}
                            </p>
                        </div>
                    </motion.div>

                    <motion.div variants={itemVariants} className="bg-white rounded-[2rem] border border-gray-100 p-5 shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center text-red-500 shrink-0">
                            <TrendingDown size={22} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Withdrawn</p>
                            <p className="text-lg font-black text-green-950 tabular-nums">
                                {walletLoading ? '···' : `KES ${Number(wallet?.total_debits ?? 0).toLocaleString()}`}
                            </p>
                        </div>
                    </motion.div>

                    <motion.div variants={itemVariants} className="col-span-2 md:col-span-1 bg-white rounded-[2rem] border border-gray-100 p-5 shadow-sm flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${wallet?.is_active ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                            {wallet?.is_active ? <ShieldCheck size={22} /> : <AlertCircle size={22} />}
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Wallet Status</p>
                            <p className={`text-sm font-black ${wallet?.is_active ? 'text-green-700' : 'text-red-600'}`}>
                                {walletLoading ? '···' : wallet?.is_active ? 'Active & Ready' : 'Suspended'}
                            </p>
                        </div>
                    </motion.div>
                </div>

                {/* ── Fee Frequency ── */}
                <motion.div variants={itemVariants} className="bg-white rounded-[2rem] border border-gray-100 p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="p-2.5 bg-brand-50 rounded-xl text-brand-600"><Calendar size={18} /></div>
                        <div>
                            <h3 className="font-black text-green-950 text-sm">Fee Deduction Schedule</h3>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Choose how market fees are deducted</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        {(['daily', 'weekly', 'monthly'] as const).map(freq => (
                            <button
                                key={freq}
                                onClick={() => handleFrequencyChange(freq)}
                                className={`p-4 rounded-2xl border-2 text-left transition-all ${selectedFrequency === freq ? 'border-brand-600 bg-brand-50/60 shadow-inner' : 'border-gray-100 hover:bg-gray-50'}`}
                            >
                                <span className="block text-sm font-black text-green-950 capitalize">{freq}</span>
                                <span className="block text-[10px] font-medium text-gray-400 mt-1 leading-tight">
                                    {freq === 'daily' ? 'Deducted every morning' : freq === 'weekly' ? 'Deducted end of week' : 'Deducted end of month'}
                                </span>
                            </button>
                        ))}
                    </div>
                    <div className="mt-4 flex items-start gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-100">
                        <Info size={14} className="text-amber-600 shrink-0 mt-0.5" />
                        <p className="text-[11px] font-medium text-amber-900/80 leading-relaxed">
                            Ensure your wallet has sufficient balance to avoid service interruptions and late penalties.
                        </p>
                    </div>
                </motion.div>

                {/* ── Transaction History ── */}
                <motion.div variants={itemVariants} className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-2">
                            <History size={20} className="text-brand-600" />
                            <h3 className="text-lg font-black text-green-950">Transaction History</h3>
                        </div>
                        {/* Filter tabs */}
                        <div className="flex bg-gray-100 rounded-2xl p-1 gap-1">
                            {(['all', 'credit', 'debit'] as const).map(f => (
                                <button
                                    key={f}
                                    onClick={() => setTxFilter(f)}
                                    className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${txFilter === f ? 'bg-white text-green-950 shadow-sm' : 'text-gray-400'}`}
                                >
                                    {f === 'all' ? 'All' : f === 'credit' ? 'In' : 'Out'}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        {transactionsLoading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <Skeleton key={i} className="w-full h-20 rounded-3xl" />
                            ))
                        ) : filteredTx.length > 0 ? (
                            filteredTx.map((tx: WalletTransaction) => (
                                <div
                                    key={tx.id}
                                    className="bg-white p-4 rounded-[1.5rem] border border-gray-50 flex items-center justify-between group hover:border-brand-100 hover:shadow-sm transition-all"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${tx.type === 'credit' ? 'bg-green-50 text-green-600' : tx.status === 'pending' ? 'bg-amber-50 text-amber-600' : tx.status === 'failed' ? 'bg-red-50 text-red-500' : 'bg-red-50 text-red-500'}`}>
                                            {tx.type === 'credit'
                                                ? <ArrowDownLeft size={20} />
                                                : tx.status === 'pending'
                                                    ? <Clock size={20} />
                                                    : <ArrowUpRight size={20} />}
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-green-950 leading-tight max-w-[220px] md:max-w-sm truncate">{tx.description}</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-[10px] font-bold text-gray-400">{formatDate(new Date(tx.created_at))}</span>
                                                <span className="text-gray-200">·</span>
                                                <span className="text-[10px] font-black text-gray-400 uppercase">{tx.reference_type || 'SYSTEM'}</span>
                                                {tx.status === 'pending' && (
                                                    <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[9px] font-black uppercase rounded-full tracking-widest">Pending</span>
                                                )}
                                                {tx.status === 'failed' && (
                                                    <span className="px-1.5 py-0.5 bg-red-100 text-red-600 text-[9px] font-black uppercase rounded-full tracking-widest">Failed</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className={`text-right shrink-0 ${tx.type === 'credit' ? 'text-green-600' : tx.status === 'pending' ? 'text-amber-600' : 'text-red-500'}`}>
                                        <p className="text-base font-black tabular-nums">
                                            {tx.type === 'credit' ? '+' : '-'} {Number(tx.amount).toLocaleString('en-KE', { minimumFractionDigits: 2 })}
                                        </p>
                                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-50">KES</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="bg-gray-50 rounded-[2rem] p-16 text-center border-2 border-dashed border-gray-200">
                                <WalletIcon size={44} className="mx-auto text-gray-300 mb-3" />
                                <p className="text-sm font-bold text-gray-400">No transactions yet.</p>
                                <p className="text-xs text-gray-300 mt-1">Earnings from sales will appear here.</p>
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>

            {/* ── Top Up Sheet ── */}
            <MpesaPaymentSheet
                isOpen={isTopUpOpen}
                onClose={() => setIsTopUpOpen(false)}
                type="wallet_topup"
                title="Top Up with M-Pesa"
                description="Funds will be added to your wallet immediately after M-Pesa confirmation."
                onSuccess={() => setIsTopUpOpen(false)}
            />

            {/* ── Withdraw Bottom Sheet ── */}
            <AnimatePresence>
                {isWithdrawOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
                            onClick={() => !requestWithdrawal.isPending && setIsWithdrawOpen(false)}
                        />
                        <motion.div
                            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-[2.5rem] shadow-2xl max-w-lg mx-auto"
                        >
                            <div className="p-6 space-y-5">
                                {/* Handle */}
                                <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto" />

                                {/* Header */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-brand-50 rounded-2xl flex items-center justify-center text-brand-600">
                                            <Banknote size={20} />
                                        </div>
                                        <div>
                                            <h3 className="font-black text-green-950">Withdraw to M-Pesa</h3>
                                            <p className="text-xs text-gray-400 font-medium">Available: <span className="font-black text-green-700">KES {Number(wallet?.balance ?? 0).toLocaleString('en-KE', { minimumFractionDigits: 2 })}</span></p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => !requestWithdrawal.isPending && setIsWithdrawOpen(false)}
                                        className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-all"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>

                                {withdrawSuccess ? (
                                    <div className="py-10 text-center space-y-3">
                                        <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto">
                                            <CheckCircle2 size={32} className="text-green-600" />
                                        </div>
                                        <p className="font-black text-green-950">Withdrawal Initiated! 🎉</p>
                                        <p className="text-sm text-gray-400">Your M-Pesa will receive the funds within minutes.</p>
                                    </div>
                                ) : (
                                    <>
                                        {/* Amount input */}
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block">Amount (KES)</label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-black text-gray-400">KES</span>
                                                <input
                                                    type="number"
                                                    min="10"
                                                    max={wallet?.balance}
                                                    value={withdrawAmount}
                                                    onChange={e => { setWithdrawAmount(e.target.value); setWithdrawError(''); }}
                                                    className="w-full h-14 pl-14 pr-4 bg-gray-50 border border-gray-100 rounded-2xl text-xl font-black text-green-950 focus:outline-none focus:border-brand-600 focus:bg-white transition-all"
                                                    placeholder="0.00"
                                                />
                                            </div>
                                            {/* Quick amount chips */}
                                            <div className="flex gap-2 flex-wrap">
                                                {[500, 1000, 2000, 5000].filter(v => v <= (wallet?.balance ?? 0)).map(v => (
                                                    <button
                                                        key={v}
                                                        onClick={() => setWithdrawAmount(v.toString())}
                                                        className="px-3 py-1.5 bg-brand-50 text-brand-700 rounded-xl text-xs font-black border border-brand-100 hover:bg-brand-100 transition-all"
                                                    >
                                                        {v.toLocaleString()}
                                                    </button>
                                                ))}
                                                {(wallet?.balance ?? 0) >= 10 && (
                                                    <button
                                                        onClick={() => setWithdrawAmount((wallet?.balance ?? 0).toString())}
                                                        className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-xl text-xs font-black hover:bg-gray-200 transition-all"
                                                    >
                                                        All
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Phone input */}
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block">M-Pesa Number</label>
                                            <div className="relative">
                                                <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                                <input
                                                    type="tel"
                                                    value={withdrawPhone}
                                                    onChange={e => { setWithdrawPhone(e.target.value); setWithdrawError(''); }}
                                                    className="w-full h-12 pl-10 pr-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-green-950 focus:outline-none focus:border-brand-600 focus:bg-white transition-all"
                                                    placeholder="e.g. 0712 345 678"
                                                />
                                            </div>
                                        </div>

                                        {/* Error */}
                                        {withdrawError && (
                                            <div className="flex items-center gap-2 p-3 bg-red-50 rounded-2xl border border-red-100">
                                                <AlertCircle size={14} className="text-red-500 shrink-0" />
                                                <p className="text-xs font-bold text-red-700">{withdrawError}</p>
                                            </div>
                                        )}

                                        {/* Notice */}
                                        <div className="flex items-start gap-2 p-3 bg-green-50 rounded-2xl border border-green-100">
                                            <CheckCircle2 size={14} className="text-green-600 shrink-0 mt-0.5" />
                                            <p className="text-[11px] text-green-900/80 font-medium leading-relaxed">
                                                Withdrawals are instant via M-Pesa B2C. A KES 5 processing fee applies. Funds arrive within minutes.
                                            </p>
                                        </div>

                                        {/* Submit */}
                                        <button
                                            onClick={handleWithdraw}
                                            disabled={requestWithdrawal.isPending || !withdrawAmount || !withdrawPhone}
                                            className="w-full h-14 bg-brand-600 text-white rounded-2xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 hover:bg-brand-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-brand-600/30"
                                        >
                                            {requestWithdrawal.isPending
                                                ? <><Loader2 size={18} className="animate-spin" /> Processing...</>
                                                : <><Banknote size={18} /> Withdraw to M-Pesa</>
                                            }
                                        </button>
                                    </>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
