'use client';

import React from 'react';
import { motion, Variants } from 'framer-motion';

const STEPS = [
  {
    num: "01",
    title: "Discover",
    desc: "Find fresh produce and local traders in your neighborhood market.",
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
  },
  {
    num: "02",
    title: "Reserve",
    desc: "Compare prices and secure items with a quick M-Pesa reservation.",
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/></svg>
  },
  {
    num: "03",
    title: "Collect",
    desc: "Show your code at the stall and pick up your items. No queues.",
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
  }
];

export const HowItWorks = () => {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } }
  };

  return (
    <section id="how-it-works" className="py-24 px-6 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <p className="text-brand-600 font-black uppercase tracking-[0.3em] text-[10px] mb-4">The Process</p>
          <h2 className="font-display text-4xl md:text-5xl font-[1000] text-green-950 tracking-tighter">
            Market shopping, <span className="text-brand-600 italic">reimagined</span>
          </h2>
        </div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          {STEPS.map((step) => (
            <motion.div variants={itemVariants} key={step.num} className="group relative text-center">
              <div className="inline-flex w-16 h-16 bg-surface-base rounded-2xl items-center justify-center text-brand-600 mb-8 group-hover:scale-110 group-hover:bg-brand-50 transition-all duration-300">
                {step.icon}
              </div>
              <h3 className="font-black text-2xl text-green-950 mb-3 tracking-tight">
                {step.title}
              </h3>
              <p className="text-gray-500 text-sm font-medium leading-relaxed max-w-xs mx-auto">
                {step.desc}
              </p>
              
              {/* Step Number Badge */}
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-white border border-gray-100 rounded-full flex items-center justify-center text-[10px] font-black text-brand-600 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                {step.num}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
