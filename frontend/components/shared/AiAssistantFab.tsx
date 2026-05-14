'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, X, Send, Loader2, Bot, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';

// ── Custom Markdown-to-JSX renderer ─────────────────────────────────────────
function AiMessageRenderer({ text }: { text: string }) {
    const lines = text.split('\n');

    const parseInline = (line: string, key: number) => {
        // Parse **bold** and *italic*
        const parts = line.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
        return (
            <span key={key}>
                {parts.map((part, i) => {
                    if (part.startsWith('**') && part.endsWith('**')) {
                        return <strong key={i} className="font-bold text-green-900">{part.slice(2, -2)}</strong>;
                    }
                    if (part.startsWith('*') && part.endsWith('*')) {
                        return <em key={i} className="italic">{part.slice(1, -1)}</em>;
                    }
                    return <span key={i}>{part}</span>;
                })}
            </span>
        );
    };

    const elements: React.ReactNode[] = [];
    let i = 0;

    while (i < lines.length) {
        const line = lines[i].trim();

        if (!line) {
            // Empty line = spacing
            elements.push(<div key={`gap-${i}`} className="h-1" />);
        } else if (/^#{1,3}\s/.test(line)) {
            // Headings
            const level = line.match(/^(#{1,3})/)?.[1].length ?? 1;
            const content = line.replace(/^#{1,3}\s/, '');
            const cls = level === 1
                ? 'text-sm font-black text-green-900 mt-1'
                : level === 2
                    ? 'text-xs font-black text-green-800 uppercase tracking-wide mt-1'
                    : 'text-xs font-bold text-green-700 mt-1';
            elements.push(<p key={i} className={cls}>{parseInline(content, i)}</p>);
        } else if (/^[-*]\s/.test(line)) {
            // Bullet list — collect consecutive items
            const items: string[] = [];
            while (i < lines.length && /^[-*]\s/.test(lines[i].trim())) {
                items.push(lines[i].trim().replace(/^[-*]\s/, ''));
                i++;
            }
            elements.push(
                <ul key={`ul-${i}`} className="space-y-1 mt-1">
                    {items.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-[13px] leading-relaxed">
                            <span className="mt-[5px] w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                            <span>{parseInline(item, idx)}</span>
                        </li>
                    ))}
                </ul>
            );
            continue;
        } else if (/^\d+\.\s/.test(line)) {
            // Numbered list — collect consecutive items
            const items: string[] = [];
            while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
                items.push(lines[i].trim().replace(/^\d+\.\s/, ''));
                i++;
            }
            elements.push(
                <ol key={`ol-${i}`} className="space-y-1 mt-1">
                    {items.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-[13px] leading-relaxed">
                            <span className="font-black text-green-600 text-[11px] mt-0.5 shrink-0 w-4">{idx + 1}.</span>
                            <span>{parseInline(item, idx)}</span>
                        </li>
                    ))}
                </ol>
            );
            continue;
        } else if (/^---+$/.test(line)) {
            elements.push(<hr key={i} className="border-gray-200 my-2" />);
        } else {
            // Regular paragraph
            elements.push(
                <p key={i} className="text-[13px] leading-relaxed text-green-950">
                    {parseInline(line, i)}
                </p>
            );
        }
        i++;
    }

    return <div className="space-y-1">{elements}</div>;
}
// ─────────────────────────────────────────────────────────────────────────────

export default function AiAssistantFab() {
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [chat, setChat] = useState<{ role: 'user' | 'bot', text: string }[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const { user } = useAuthStore();
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [chat, isLoading]);

    const handleSend = async () => {
        if (!message.trim() || isLoading) return;

        const userMsg = message;
        setMessage('');
        setChat(prev => [...prev, { role: 'user', text: userMsg }]);
        setIsLoading(true);

        try {
            const res = await api.post('/ai/chat', { message: userMsg });
            setChat(prev => [...prev, { role: 'bot', text: res.data.response }]);
        } catch (err: any) {
            toast.error('Soko AI is currently offline.');
            setChat(prev => [...prev, { role: 'bot', text: 'Pole sana! I am having some technical issues. Please try again later.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            {/* FAB Button */}
            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsOpen(true)}
                className="fixed bottom-24 right-6 w-16 h-16 bg-brand-600 text-white rounded-full shadow-2xl flex items-center justify-center z-40 border-4 border-white/20 backdrop-blur-sm"
            >
                <Sparkles size={28} className="animate-pulse" />
            </motion.button>

            {/* Chat Interface */}
            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center md:justify-end md:p-6 pointer-events-none">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="absolute inset-0 bg-black/20 backdrop-blur-sm pointer-events-auto"
                        />

                        <motion.div
                            initial={{ y: '100%', opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: '100%', opacity: 0 }}
                            className="w-full md:w-[400px] bg-white rounded-t-[2.5rem] md:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[80vh] md:max-h-[600px] pointer-events-auto relative z-10"
                        >
                            {/* Header */}
                            <div className="p-6 bg-brand-600 text-white flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                                        <Bot size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-sm uppercase tracking-widest">Soko AI</h3>
                                        <p className="text-[10px] text-white/70 font-bold uppercase tracking-wider">Online Assistant</p>
                                    </div>
                                </div>
                                <button onClick={() => setIsOpen(false)} className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Chat Messages */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar bg-neutral-50/50">
                                {chat.length === 0 && (
                                    <div className="text-center py-12 space-y-4">
                                        <div className="w-16 h-16 bg-brand-50 text-brand-600 rounded-2xl flex items-center justify-center mx-auto">
                                            <MessageSquare size={32} />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="font-black text-green-950">Habari, {user?.name || 'Guest'}!</p>
                                            <p className="text-xs text-text-secondary font-medium">I am your Soko Mtaa assistant. How can I help you today?</p>
                                        </div>
                                        <div className="flex flex-wrap justify-center gap-2 pt-4">
                                            {['Find sukuma wiki', 'Market timings', 'How to sell'].map((tip) => (
                                                <button
                                                    key={tip}
                                                    onClick={() => {
                                                        setMessage(tip);
                                                    }}
                                                    className="px-4 py-2 bg-white border border-gray-100 rounded-full text-[10px] font-black text-brand-600 uppercase tracking-widest shadow-sm hover:border-brand-500 transition-all"
                                                >
                                                    {tip}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {chat.map((msg, i) => (
                                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[85%] p-4 rounded-2xl shadow-sm ${msg.role === 'user'
                                                ? 'bg-brand-600 text-white text-sm font-medium rounded-tr-none'
                                                : 'bg-white rounded-tl-none border border-gray-100'
                                            }`}>
                                            {msg.role === 'bot' ? (
                                                <AiMessageRenderer text={msg.text} />
                                            ) : (
                                                msg.text
                                            )}
                                        </div>
                                    </div>
                                ))}

                                {isLoading && (
                                    <div className="flex justify-start">
                                        <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-gray-100 shadow-sm">
                                            <Loader2 size={16} className="animate-spin text-brand-600" />
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input Area */}
                            <div className="p-6 bg-white border-t border-gray-50">
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                        placeholder="Tuma ujumbe hapa..."
                                        className="w-full h-14 pl-6 pr-14 bg-neutral-50 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-brand-500/5 focus:bg-white outline-none transition-all"
                                    />
                                    <button
                                        onClick={handleSend}
                                        disabled={!message.trim() || isLoading}
                                        className="absolute right-2 top-2 w-10 h-10 bg-brand-600 text-white rounded-xl flex items-center justify-center disabled:opacity-50 active:scale-90 transition-all"
                                    >
                                        <Send size={18} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
