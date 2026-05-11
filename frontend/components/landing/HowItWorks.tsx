'use client';

import React from 'react';
import { motion, Variants } from 'framer-motion';

const STEPS = [
  {
    num: "01",
    title: "Discover Traders",
    desc: "Search by product, category, or stall number. See who's open right now in your estate.",
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
  },
  {
    num: "02",
    title: "Instant Compare",
    desc: "Compare prices across multiple traders instantly. Find the freshest items at the best price.",
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/></svg>
  },
  {
    num: "03",
    title: "Pay via M-Pesa",
    desc: "Reserve your items with a secure M-Pesa push. No cash needed, your item is held for 24h.",
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
  },
  {
    num: "04",
    title: "Fast Pickup",
    desc: "Show your code at the stall and collect your items. No queues, no haggling, just grab and go.",
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
  }
];

export const HowItWorks = () => {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
  };

  const itemVariants: Variants = {
    hidden: { y: 30, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 80, damping: 20 } }
  };

  return (
    <section id="how-it-works" className="py-24 px-6 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <div className="max-w-xl">
            <p className="text-brand-600 font-black uppercase tracking-widest text-sm mb-4">Simple Workflow</p>
            <h2 className="font-display text-4xl md:text-5xl font-[1000] text-green-950 tracking-tighter leading-none">
              Market shopping, <br className="hidden sm:block" />
              <span className="text-brand-600 italic">perfectly timed</span>
            </h2>
          </div>
          <p className="max-w-sm text-gray-500 font-medium text-lg leading-relaxed">
            From discovery to collection in minutes. No delivery fees, no waiting for couriers.
          </p>
        </div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {STEPS.map((step) => (
            <motion.div variants={itemVariants} key={step.num} className="group relative p-10 bg-white border border-gray-100 rounded-[40px] hover:shadow-2xl hover:shadow-green-900/5 transition-all duration-500 overflow-hidden">
              {/* Massive Number Watermark */}
              <div className="absolute -top-4 -right-2 text-9xl font-black text-gray-50 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                {step.num}
              </div>
              
              <div className="w-14 h-14 bg-brand-50 rounded-2xl flex items-center justify-center text-brand-700 mb-8 shadow-sm group-hover:scale-110 group-hover:rotate-3 transition-transform">
                {step.icon}
              </div>
              
              <h3 className="font-black text-2xl text-green-950 mb-4 tracking-tight">
                {step.title}
              </h3>
              <p className="text-gray-500 text-sm font-medium leading-relaxed">
                {step.desc}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
