'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/shared/DashboardLayout';
import {
    HelpCircle,
    Search,
    ChevronRight,
    MessageSquare,
    ShoppingBag,
    CreditCard,
    ShieldCheck,
    ChevronDown,
    MapPin,
    Smartphone
} from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { motion, AnimatePresence } from 'framer-motion';

interface FAQ {
    question: string;
    answer: string;
    category: string;
}

export default function HelpCenterPage() {
    const router = useRouter();
    const { t } = useTranslation();
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

    const categories = [
        { id: 'All', label: t('help.categories.all') || 'All', icon: HelpCircle, color: 'text-brand-600 bg-brand-50' },
        { id: 'Getting Started', label: t('help.categories.getting_started') || 'Getting Started', icon: Smartphone, color: 'text-blue-600 bg-blue-50' },
        { id: 'Orders', label: t('help.categories.orders') || 'Orders', icon: ShoppingBag, color: 'text-amber-600 bg-amber-50' },
        { id: 'Payments', label: t('help.categories.payments') || 'Payments', icon: CreditCard, color: 'text-green-600 bg-green-50' },
        { id: 'Market Rules', label: t('help.categories.rules') || 'Market Rules', icon: ShieldCheck, color: 'text-purple-600 bg-purple-50' },
    ];

    const faqs: FAQ[] = [
        {
            category: 'Getting Started',
            question: 'What is Soko Mtaa?',
            answer: 'Soko Mtaa is a digital platform connecting local market traders with their customers, allowing seamless product reservations and easy payments via M-Pesa.'
        },
        {
            category: 'Orders',
            question: 'How do I reserve a product?',
            answer: 'Find a trader you like nearby, select a product, and click "Reserve". You can pay via M-Pesa and pick up your item at the market within 24 hours.'
        },
        {
            category: 'Payments',
            question: 'Are M-Pesa payments secure?',
            answer: 'Yes, all payments are processed through the official M-Pesa Daraja system. Your funds are held securely until you pick up your item.'
        },
        {
            category: 'Market Rules',
            question: 'What should I do if I have a complaint?',
            answer: 'You can submit a complaint through the "Complaints" section in your profile. The market admin will review it and help resolve the issue.'
        },
        {
            category: 'Orders',
            question: 'Can I cancel my reservation?',
            answer: 'Yes, you can cancel a reservation through the "Reservations" page before the pickup time expires.'
        },
        {
            category: 'Getting Started',
            question: 'How do I verify my account?',
            answer: 'Go to your profile settings and click "Verification". You will be asked for your phone number and National ID if you are a trader.'
        }
    ];

    const filteredFaqs = faqs.filter(faq => {
        const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
            faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = activeCategory === 'All' || faq.category === activeCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <DashboardLayout title={t('help.title')}>
            <div className="max-w-3xl mx-auto space-y-8 pb-12 animate-fade-up">

                {/* Search Header */}
                <div className="text-center space-y-4 pt-4">
                    <h1 className="text-3xl font-black text-green-950 tracking-tight">{t('help.how_can_we_help')}</h1>
                    <p className="text-text-secondary font-medium">{t('help.search_placeholder')}</p>

                    <div className="relative max-w-xl mx-auto mt-8">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-text-muted" size={20} />
                        <input
                            type="text"
                            placeholder={t('help.search_placeholder')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-16 pl-14 pr-6 bg-white border-2 border-border-default rounded-[2rem] shadow-brand-sm focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all outline-none font-medium"
                        />
                    </div>
                </div>

                {/* Categories */}
                <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar -mx-4 px-4 lg:mx-0 lg:px-0 lg:justify-center">
                    {categories.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id)}
                            className={`flex flex-col items-center gap-2 p-4 rounded-[2rem] min-w-[100px] transition-all border-2 ${activeCategory === cat.id
                                    ? 'bg-white border-brand-500 shadow-brand-md scale-105'
                                    : 'bg-white border-transparent shadow-brand-sm opacity-60'
                                }`}
                        >
                            <div className={`w-12 h-12 rounded-2xl ${cat.color} flex items-center justify-center`}>
                                <cat.icon size={24} />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-green-950">
                                {cat.label}
                            </span>
                        </button>
                    ))}
                </div>

                {/* FAQ List */}
                <div className="space-y-4">
                    <h2 className="text-xs font-black text-text-muted uppercase tracking-[0.2em] ml-4">{t('help.faqs_title')}</h2>

                    <div className="bg-white border border-border-default rounded-[2.5rem] overflow-hidden shadow-brand-sm">
                        {filteredFaqs.length > 0 ? filteredFaqs.map((faq, index) => {
                            const isExpanded = expandedIndex === index;
                            return (
                                <div key={index} className={index !== filteredFaqs.length - 1 ? 'border-b border-gray-50' : ''}>
                                    <button
                                        onClick={() => setExpandedIndex(isExpanded ? null : index)}
                                        className="w-full text-left p-6 flex items-center justify-between group transition-colors hover:bg-neutral-50"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                                                <HelpCircle size={18} />
                                            </div>
                                            <span className="font-bold text-green-950 text-sm leading-tight pr-4">{faq.question}</span>
                                        </div>
                                        <ChevronDown
                                            size={20}
                                            className={`text-text-muted transition-transform duration-300 ${isExpanded ? 'rotate-180 text-brand-600' : ''}`}
                                        />
                                    </button>

                                    <AnimatePresence>
                                        {isExpanded && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.3, ease: 'easeOut' }}
                                                className="overflow-hidden"
                                            >
                                                <div className="px-12 pb-6 pt-0 text-text-secondary text-sm leading-relaxed antialiased">
                                                    <div className="h-px w-full bg-gray-100 mb-4" />
                                                    {faq.answer}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            );
                        }) : (
                            <div className="p-12 text-center space-y-4">
                                <div className="w-16 h-16 bg-brand-50 rounded-full flex items-center justify-center mx-auto text-brand-600">
                                    <Search size={32} />
                                </div>
                                <p className="text-text-secondary font-bold">{t('help.no_results')}</p>
                                <button
                                    onClick={() => { setSearchQuery(''); setActiveCategory('All'); }}
                                    className="text-brand-600 font-bold text-sm underline underline-offset-4"
                                >
                                    {t('help.show_all')}
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Contact Support */}
                <div className="bg-green-950 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
                    <div className="relative z-10 space-y-4">
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
                            <MessageSquare size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold">{t('help.contact_title')}</h3>
                            <p className="text-green-100/70 text-sm font-medium max-w-md">
                                {t('help.contact_subtitle')}
                            </p>
                        </div>
                        <button
                            onClick={() => router.push('/complaints')}
                            className="bg-amber-500 hover:bg-amber-400 text-green-950 px-8 py-4 rounded-2xl font-black text-sm transition-all shadow-lg active:scale-95"
                        >
                            {t('help.contact_button')}
                        </button>
                    </div>

                    {/* Decorative blobs */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-green-900 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl opacity-50" />
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-brand-600 rounded-full translate-x-1/2 translate-y-1/2 blur-2xl opacity-20" />
                </div>

                {/* Quick Info Grid */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-6 rounded-[2rem] border border-border-default shadow-brand-sm flex flex-col items-center text-center gap-3">
                        <MapPin className="text-brand-600" size={24} />
                        <span className="text-xs font-black text-green-950 uppercase tracking-widest">Market Offices</span>
                        <p className="text-[11px] text-text-secondary leading-snug">Kolenyo Market, 2nd Floor, Room 12</p>
                    </div>
                    <div className="bg-white p-6 rounded-[2rem] border border-border-default shadow-brand-sm flex flex-col items-center text-center gap-3">
                        <Smartphone className="text-brand-600" size={24} />
                        <span className="text-xs font-black text-green-950 uppercase tracking-widest">Call Us</span>
                        <p className="text-[11px] text-text-secondary leading-snug">+254 700 000 000 (Working Hours)</p>
                    </div>
                </div>

            </div>
        </DashboardLayout>
    );
}
