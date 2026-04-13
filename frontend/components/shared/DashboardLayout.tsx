'use client';

import React from 'react';
import BottomNav from './BottomNav';
import TopBar from './TopBar';
import { motion } from 'framer-motion';

interface DashboardLayoutProps {
    children: React.ReactNode;
    title?: string;
}

export default function DashboardLayout({ children, title }: DashboardLayoutProps) {
    return (
        <div className="flex flex-col lg:flex-row min-h-screen bg-[#FAFAF8] w-full max-w-full overflow-hidden">
            {/* Sidebar (Desktop) / Bottom Nav (Mobile) */}
            <BottomNav />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 h-screen">
                {/* Navbar */}
                <TopBar title={title} />

                {/* Content */}
                <main className="flex-1 overflow-y-auto w-full no-scrollbar pb-24 lg:pb-0">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                        className="w-full max-w-[1600px] mx-auto"
                    >
                        {children}
                    </motion.div>
                </main>
            </div>
        </div>
    );
}
