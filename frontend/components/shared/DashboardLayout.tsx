'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import BottomNav from './BottomNav';
import TopBar from './TopBar';
import { useAuthStore } from '@/store/authStore';
import { motion } from 'framer-motion';

// Dynamic imports to prevent SSR issues with client-only sidebars
const AdminSidebar = dynamic(() => import('@/components/admin/AdminSidebar').then(m => m.default));
const TraderSidebar = dynamic(() => import('@/components/trader/TraderSidebar').then(m => m.default));
const ResidentSidebar = dynamic(() => import('@/components/resident/ResidentSidebar').then(m => m.default));
const MobileSidebar = dynamic(() => import('@/components/admin/MobileSidebar').then(m => m.default));
const TraderMobileSidebar = dynamic(() => import('@/components/trader/TraderMobileSidebar').then(m => m.default));
const ResidentMobileSidebar = dynamic(() => import('@/components/resident/ResidentMobileSidebar').then(m => m.default));

interface DashboardLayoutProps {
    children: React.ReactNode;
    title?: string;
}

export default function DashboardLayout({ children, title }: DashboardLayoutProps) {
    const { user } = useAuthStore();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const renderSidebar = () => {
        if (!user) return <ResidentSidebar />;
        
        switch (user.role) {
            case 'admin':
                return <AdminSidebar />;
            case 'trader':
                return <TraderSidebar />;
            default:
                return <ResidentSidebar />;
        }
    };

    return (
        <div className="flex flex-col lg:flex-row min-h-screen bg-[#FAFAF8] w-full max-w-full overflow-hidden">
            {/* Mobile Drawer */}
            {user?.role === 'admin' && (
                <MobileSidebar 
                    isOpen={isMobileMenuOpen} 
                    onClose={() => setIsMobileMenuOpen(false)} 
                />
            )}
            {user?.role === 'trader' && (
                <TraderMobileSidebar 
                    isOpen={isMobileMenuOpen} 
                    onClose={() => setIsMobileMenuOpen(false)} 
                />
            )}
            {(!user || user.role === 'resident') && (
                <ResidentMobileSidebar 
                    isOpen={isMobileMenuOpen} 
                    onClose={() => setIsMobileMenuOpen(false)} 
                />
            )}

            {/* Sidebar (Desktop Only) */}
            {renderSidebar()}

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
                {/* Navbar */}
                <TopBar 
                    title={title} 
                    onMenuToggle={() => setIsMobileMenuOpen(true)}
                />

                {/* Content */}
                <main className="flex-1 overflow-y-auto w-full no-scrollbar pb-36 lg:pb-0">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                        className="w-full max-w-[1600px] mx-auto px-4 md:px-8 py-6"
                    >
                        {children}
                    </motion.div>
                </main>
            </div>

            {/* Bottom Nav (Mobile Only) */}
            <div className="lg:hidden">
                <BottomNav />
            </div>
        </div>
    );
}
