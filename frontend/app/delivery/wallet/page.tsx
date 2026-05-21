'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Banknote,
    History,
    ArrowUpRight,
    ArrowDownLeft,
    Clock,
    X,
    Phone,
    Loader2,
    CheckCircle2,
    AlertCircle,
    Wallet as WalletIcon,
    ShieldCheck,
    Info,
} from 'lucide-react';
import { useRiderWallet, RiderWalletTransaction } from '@/hooks/useRiderWallet';
import { useUIStore } from '@/store/uiStore';
import { Skeleton } from '../../../components/ui/skeleton';

export default function RiderWalletPage() {
    const { setPageTitle } = useUIStore();

    React.useEffect(() => {
        setPageTitle('My Earnings');
    }, [setPageTitle]);

    const { profile, withdrawals, isLoading, requestWithdrawal } = useRiderWallet();
    const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [withdrawPhone, setWithdrawPhone] = useState('');
    const [withdrawError, setWithdrawError] = useState('');
    const [withdrawSuccess, setWithdrawSuccess] = useState(false);

    const balance = profile?.earnings_balance || 0;
    const isVerified = profile?.verification_status === 'verified';

    const formatDate = (dateString: string) => {
        try {
            return new Intl.DateTimeFormat('en-KE', {
                month: 'short', day: 'numeric',
                hour: 'numeric', minute: 'numeric', hour12: true
            }).format(new Date(dateString));
        } catch (_e) {
            return new Date(dateString).toLocaleDateString();
        }
    };

    const handleWithdraw = () => {
        setWithdrawError('');
        const amount = parseFloat(withdrawAmount);
        if (isNaN(amount) || amount < 100) {
            setWithdrawError('Minimum withdrawal is KES 100.');
            return;
        }
        if (amount > balance) {
            setWithdrawError('Amount exceeds your available balance.');
            return;
        }
        if (withdrawPhone && !withdrawPhone.match(/^(?:254|\+254|0)?(7|1)[0-9]{8}$/)) {
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
                onError: (err: any) => {
                    setWithdrawError(err.message || 'Withdrawal failed. Please try again.');
                }
            }
        );
    };

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
                    
                    <div className="relative z-10">
                        <div className="flex items-start justify-between gap-4 mb-8">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-brand-200/80 mb-2">Available Earnings</p>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-2xl font-bold opacity-60">KES</span>
                                    <span className="text-6xl font-black tracking-tighter tabular-nums">
                                        {isLoading ? '···' : Number(balance).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                </div>
                            </div>
                            <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center">
                                <WalletIcon size={26} className="text-brand-200" />
                            </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-3">
                            <button
                                onClick={() => setIsWithdrawOpen(true)}
                                disabled={!isVerified || balance < 100}
                                className="w-full flex items-center justify-center gap-2 bg-white text-brand-700 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all hover:bg-brand-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Banknote size={16} strokeWidth={2.5} />
                                Withdraw to M-Pesa
                            </button>
                        </div>
                        
                        {!isVerified && (
                            <p className="text-amber-200 text-xs mt-3 flex items-center gap-1.5 justify-center font-bold">
                                <AlertCircle size={14} /> Account verification required to withdraw
                            </p>
                        )}
                    </div>
                </motion.div>

                {/* ── Transaction History ── */}
                <motion.div variants={itemVariants} className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-2">
                            <History size={20} className="text-brand-600" />
                            <h3 className="text-lg font-black text-green-950">Recent Withdrawals</h3>
                        </div>
                    </div>

                    <div className="space-y-2">
                        {isLoading ? (
                            Array.from({ length: 3 }).map((_, i) => (
                                <Skeleton key={i} className="w-full h-20 rounded-3xl" />
                            ))
                        ) : withdrawals.length > 0 ? (
                            withdrawals.map((tx: RiderWalletTransaction) => (
                                <div
                                    key={tx.id}
                                    className="bg-white p-4 rounded-[1.5rem] border border-gray-50 flex items-center justify-between group hover:border-brand-100 hover:shadow-sm transition-all"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${tx.status === 'completed' ? 'bg-green-50 text-green-600' : tx.status === 'processing' ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-500'}`}>
                                            {tx.status === 'completed'
                                                ? <ArrowUpRight size={20} />
                                                : tx.status === 'processing'
                                                    ? <Clock size={20} />
                                                    : <X size={20} />}
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-green-950 leading-tight">M-Pesa Withdrawal</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-[10px] font-bold text-gray-400">{formatDate(tx.created_at)}</span>
                                                <span className="text-gray-200">·</span>
                                                {tx.status === 'processing' && (
                                                    <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[9px] font-black uppercase rounded-full tracking-widest">Processing</span>
                                                )}
                                                {tx.status === 'completed' && (
                                                    <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-[9px] font-black uppercase rounded-full tracking-widest">Completed</span>
                                                )}
                                                {tx.status === 'failed' && (
                                                    <span className="px-1.5 py-0.5 bg-red-100 text-red-600 text-[9px] font-black uppercase rounded-full tracking-widest">Failed</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className={`text-right shrink-0 ${tx.status === 'completed' ? 'text-green-600' : tx.status === 'processing' ? 'text-amber-600' : 'text-red-500'}`}>
                                        <p className="text-base font-black tabular-nums">
                                            - {Number(tx.amount).toLocaleString('en-KE', { minimumFractionDigits: 2 })}
                                        </p>
                                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-50">KES</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="bg-gray-50 rounded-[2rem] p-16 text-center border-2 border-dashed border-gray-200">
                                <WalletIcon size={44} className="mx-auto text-gray-300 mb-3" />
                                <p className="text-sm font-bold text-gray-400">No withdrawals yet.</p>
                                <p className="text-xs text-gray-300 mt-1">Earnings will appear in your balance when deliveries are completed.</p>
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>

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
                                            <p className="text-xs text-gray-400 font-medium">Available: <span className="font-black text-green-700">KES {Number(balance).toLocaleString('en-KE', { minimumFractionDigits: 2 })}</span></p>
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
                                                    min="100"
                                                    max={balance}
                                                    value={withdrawAmount}
                                                    onChange={e => { setWithdrawAmount(e.target.value); setWithdrawError(''); }}
                                                    className="w-full h-14 pl-14 pr-4 bg-gray-50 border border-gray-100 rounded-2xl text-xl font-black text-green-950 focus:outline-none focus:border-brand-600 focus:bg-white transition-all"
                                                    placeholder="0.00"
                                                />
                                            </div>
                                            {/* Quick amount chips */}
                                            <div className="flex gap-2 flex-wrap">
                                                {[500, 1000, 2000, 5000].filter(v => v <= balance).map(v => (
                                                    <button
                                                        key={v}
                                                        onClick={() => setWithdrawAmount(v.toString())}
                                                        className="px-3 py-1.5 bg-brand-50 text-brand-700 rounded-xl text-xs font-black border border-brand-100 hover:bg-brand-100 transition-all"
                                                    >
                                                        {v.toLocaleString()}
                                                    </button>
                                                ))}
                                                {balance >= 100 && (
                                                    <button
                                                        onClick={() => setWithdrawAmount(balance.toString())}
                                                        className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-xl text-xs font-black hover:bg-gray-200 transition-all"
                                                    >
                                                        All
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Phone input */}
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block">M-Pesa Number (Leave empty to use profile number)</label>
                                            <div className="relative">
                                                <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                                <input
                                                    type="tel"
                                                    value={withdrawPhone}
                                                    onChange={e => { setWithdrawPhone(e.target.value); setWithdrawError(''); }}
                                                    className="w-full h-12 pl-10 pr-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-green-950 focus:outline-none focus:border-brand-600 focus:bg-white transition-all"
                                                    placeholder="07XXXXXXXX or +254..."
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
                                            disabled={requestWithdrawal.isPending || !withdrawAmount}
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
