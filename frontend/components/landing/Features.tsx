'use client';

import React from 'react';

const FEATURES = [
  {
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>,
    title: "Live Market Map",
    desc: "Interactive floor plan of the market. See which stalls are open, busy, or closed in real-time.",
    tag: "Pro Feature"
  },
  {
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
    title: "M-PesaSTK Push",
    desc: "Seamless payments. Just enter your PIN when the prompt appears. Instant confirmation.",
    tag: "Native"
  },
  {
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
    title: "Daily Stock Alerts",
    desc: "Get notified as soon as your favorite items are restocked. Never miss fresh supplies.",
    tag: "Alerts"
  },
  {
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>,
    title: "Trader Analytics",
    desc: "Traders get detailed insights into sales and customer trends to grow their small business.",
    tag: "For Traders"
  },
  {
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/></svg>,
    title: "Offline Support",
    desc: "Slow connection? Browse traders and your pickup codes even when the internet drops.",
    tag: "PWA"
  },
  {
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
    title: "Secure Verification",
    desc: "All traders and items are verified by county market administrators for your safety.",
    tag: "Verified"
  }
];

export const Features = () => {
  return (
    <section id="features" className="py-24 px-6 bg-green-950 relative overflow-hidden">
      {/* Decorative Gradient */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/20 blur-[120px] rounded-full translate-x-1/2 -translate-y-1/2" />
      
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-20">
          <p className="text-brand-400 font-black uppercase tracking-[0.3em] text-xs mb-4">Powerful Features</p>
          <h2 className="font-display text-4xl md:text-5xl font-[1000] text-white tracking-tighter leading-none">
            Everything a local market needs,<br/>
            <span className="text-brand-400 italic">one platform</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feat) => (
            <div key={feat.title} className="p-10 bg-white/5 border border-white/10 rounded-[40px] hover:bg-white/[0.08] hover:border-white/20 transition-all duration-300 group">
              <div className="w-14 h-14 bg-brand-500/10 rounded-2xl flex items-center justify-center text-brand-400 mb-8 group-hover:scale-110 transition-transform">
                {feat.icon}
              </div>
              <h3 className="font-black text-2xl text-white mb-4 tracking-tight">
                {feat.title}
              </h3>
              <p className="text-green-100/50 text-sm font-medium leading-relaxed mb-10">
                {feat.desc}
              </p>
              <span className="px-3 py-1 bg-brand-500/10 text-brand-400 text-[10px] font-black uppercase tracking-[0.2em] rounded-full">
                {feat.tag}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
