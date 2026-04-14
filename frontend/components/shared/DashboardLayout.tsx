'use client';

import React from 'react';
import BottomNav from './BottomNav';
import TopBar from './TopBar';
import AdminSidebar from '../admin/AdminSidebar';
import TraderSidebar from '../trader/TraderSidebar';
import ResidentSidebar from '../resident/ResidentSidebar';
import { useAuthStore } from '@/store/authStore';
import { motion, AnimatePresence } from 'framer-motion';

interface DashboardLayoutProps {
    children: React.ReactNode;
    title?: string;
}

export default function DashboardLayout({ children, title }: DashboardLayoutProps) {
    const { user } = useAuthStore();

    const renderSidebar = () => {
        switch (user?.role) {
            case 'admin':
                return <AdminSidebar />;
            case 'trader':
                return <TraderSidebar />;
            case 'resident':
            default:
                return <ResidentSidebar />;
        }
    };

    return (
        <div className="flex flex-col lg:flex-row min-h-screen bg-[#FAFAF8] w-full max-w-full overflow-hidden">
            {/* Sidebar (Desktop Only) */}
            {renderSidebar()}

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
                {/* Navbar */}
                <TopBar title={title} />

                {/* Content */}
                <main className="flex-1 overflow-y-auto w-full no-scrollbar pb-24 lg:pb-0">
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
