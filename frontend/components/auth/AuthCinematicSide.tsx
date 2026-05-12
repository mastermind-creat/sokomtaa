'use client';

import React, { useState, useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Logo } from '@/components/shared/Logo';
import { useRouter } from 'next/navigation';
import { CheckCircle2, TrendingUp, Users, ShoppingBag, Store } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

interface AuthCinematicSideProps {
    title: string | React.ReactNode;
    subtitle: string;
    stats?: Array<{ label: string; value: string; icon?: React.ReactNode }>;
    features?: string[];
}

export const AuthCinematicSide: React.FC<AuthCinematicSideProps> = ({ 
    title, 
    subtitle, 
    stats: initialStats, 
    features 
}) => {
    const router = useRouter();

    // Fetch dynamic stats from the backend
    const { data: dynamicStats } = useQuery({
        queryKey: ['global-stats'],
        queryFn: async () => {
            const response = await api.get('/stats');
            return response.data;
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    // Map dynamic stats to the component's format
    const stats = initialStats || (dynamicStats ? [
        { 
            label: 'Active Markets', 
            value: `${dynamicStats.total_markets}+`, 
            icon: <ShoppingBag size={20} /> 
        },
        { 
            label: 'Registered Traders', 
            value: `${dynamicStats.total_traders}+`, 
            icon: <Store size={20} /> 
        },
        { 
            label: 'Daily Transactions', 
            value: `${dynamicStats.total_reservations.toLocaleString()}+`, 
            icon: <TrendingUp size={20} /> 
        },
        { 
            label: 'Counties Covered', 
            value: dynamicStats.active_locations.toString(), 
            icon: <Users size={20} /> 
        },
    ] : null);
    
    // Mouse movement for parallax
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    // Smooth springs for the parallax
    const springConfig = { damping: 25, stiffness: 150 };
    const rotateX = useSpring(useTransform(mouseY, [-300, 300], [5, -5]), springConfig);
    const rotateY = useSpring(useTransform(mouseX, [-300, 300], [-5, 5]), springConfig);
    
    // Background movement
    const bgX = useSpring(useTransform(mouseX, [-300, 300], [20, -20]), springConfig);
    const bgY = useSpring(useTransform(mouseY, [-300, 300], [20, -20]), springConfig);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            const { clientX, clientY } = e;
            const x = clientX - window.innerWidth / 4; // Center relative to the side panel
            const y = clientY - window.innerHeight / 2;
            mouseX.set(x);
            mouseY.set(y);
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, [mouseX, mouseY]);

    return (
        <div className="hidden lg:flex flex-col justify-between w-[45%] bg-[#0A2E1A] p-14 relative overflow-hidden">
            {/* Cinematic Background Layers */}
            <motion.div 
                style={{ x: bgX, y: bgY }}
                className="absolute inset-0 z-0"
            >
                {/* Main Gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-green-950 via-brand-900 to-[#0A2E1A]" />
                
                {/* Animated Light Blobs */}
                <motion.div 
                    animate={{ 
                        scale: [1, 1.2, 1],
                        opacity: [0.1, 0.2, 0.1],
                        rotate: [0, 90, 0]
                    }}
                    transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                    className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] rounded-full bg-brand-500/20 blur-[120px]"
                />
                <motion.div 
                    animate={{ 
                        scale: [1.2, 1, 1.2],
                        opacity: [0.05, 0.15, 0.05],
                        rotate: [0, -90, 0]
                    }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-amber-500/10 blur-[100px]"
                />
                
                {/* Noise Texture Overlay */}
                <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
            </motion.div>

            {/* Header / Logo */}
            <div className="relative z-20">
                <motion.div 
                    className="mb-16 cursor-pointer inline-block" 
                    onClick={() => router.push('/')}
                    whileHover={{ scale: 1.05, filter: "brightness(1.2)" }}
                    whileTap={{ scale: 0.95 }}
                >
                    <Logo variant="green" width={180} />
                </motion.div>

                <div className="max-w-md">
                    <motion.h2 
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                        className="text-5xl font-[1000] text-white leading-[1.1] mb-6 tracking-tighter"
                    >
                        {title}
                    </motion.h2>
                    <motion.p 
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                        className="text-green-100/70 text-xl font-medium leading-relaxed"
                    >
                        {subtitle}
                    </motion.p>
                </div>
            </div>

            {/* Dynamic Content (Stats or Features) */}
            <motion.div 
                style={{ rotateX, rotateY, perspective: 1000 }}
                className="relative z-20"
            >
                {stats && (
                    <div className="grid grid-cols-2 gap-4">
                        {stats.map((stat, idx) => (
                            <motion.div 
                                key={stat.label}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.4 + (idx * 0.1) }}
                                whileHover={{ 
                                    y: -5, 
                                    backgroundColor: "rgba(255,255,255,0.08)",
                                    borderColor: "rgba(255,255,255,0.2)"
                                }}
                                className="bg-white/[0.04] backdrop-blur-md rounded-[24px] p-5 border border-white/10 shadow-2xl transition-all duration-300 group"
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <div className="w-10 h-10 rounded-xl bg-brand-500/20 flex items-center justify-center text-brand-400 group-hover:scale-110 transition-transform">
                                        {stat.icon || <TrendingUp size={20} />}
                                    </div>
                                    <div className="h-1 w-8 bg-white/10 rounded-full" />
                                </div>
                                <p className="text-3xl font-[1000] text-white tracking-tighter">{stat.value}</p>
                                <p className="text-xs text-green-200/50 font-black uppercase tracking-widest mt-1">{stat.label}</p>
                            </motion.div>
                        ))}
                    </div>
                )}

                {features && (
                    <div className="space-y-4">
                        {features.map((feature, idx) => (
                            <motion.div 
                                key={feature}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.5, delay: 0.4 + (idx * 0.1) }}
                                whileHover={{ x: 10, backgroundColor: "rgba(255,255,255,0.05)" }}
                                className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-sm transition-all group cursor-pointer"
                            >
                                <div className="w-8 h-8 rounded-full bg-brand-500/20 flex items-center justify-center group-hover:bg-brand-500 transition-colors">
                                    <CheckCircle2 size={16} className="text-brand-400 group-hover:text-white transition-colors" />
                                </div>
                                <span className="text-white font-bold text-sm tracking-tight">{feature}</span>
                            </motion.div>
                        ))}
                    </div>
                )}
            </motion.div>

            {/* Bottom Footer Decor */}
            <div className="relative z-20 pt-8 flex items-center justify-between border-t border-white/5">
                <div className="flex -space-x-3">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="w-8 h-8 rounded-full border-2 border-[#0A2E1A] bg-gray-300 overflow-hidden shadow-xl">
                            <img src={`https://i.pravatar.cc/100?u=${i}`} alt="User" className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all" />
                        </div>
                    ))}
                    <div className="w-8 h-8 rounded-full border-2 border-[#0A2E1A] bg-brand-600 flex items-center justify-center text-[10px] font-black text-white shadow-xl">
                        +2k
                    </div>
                </div>
                <p className="text-[10px] font-black text-green-200/40 uppercase tracking-[0.2em]">
                    Trusted by local communities
                </p>
            </div>
        </div>
    );
};
