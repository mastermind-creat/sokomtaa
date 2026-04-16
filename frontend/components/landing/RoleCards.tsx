'use client';

import React from 'react';
import Link from 'next/link';

const ROLES = [
  {
    id: 'resident',
    color: 'emerald',
    title: "For Residents",
    desc: "The convenient way to shop. Compare prices, reserve fresh goods, and collect at your leisure.",
    perks: ["Price comparison module", "M-Pesa reservations", "Pickup code system"],
    cta: "Start Shopping",
    link: "/register?role=resident"
  },
  {
    id: 'trader',
    color: 'amber',
    title: "For Traders",
    desc: "Take your business digital. Manage products, tracking orders, and grow your sales with data.",
    perks: ["Digital storefront", "Sales analytics", "Fee payment portal"],
    cta: "Register Stall",
    link: "/register?role=trader"
  },
  {
    id: 'admin',
    color: 'blue',
    title: "For Admins",
    desc: "Modern tools for county officials to manage stalls, verify traders, and track market health.",
    perks: ["Stall allocation system", "Revenue tracking", "Dispute management"],
    cta: "Council Login",
    link: "/login"
  }
];

export const RoleCards = () => {
  return (
    <section id="roles" className="py-24 px-6 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-brand-600 font-black uppercase tracking-[0.2em] text-xs mb-4">Choose Your Path</p>
          <h2 className="font-display text-4xl md:text-5xl font-[1000] text-green-950 tracking-tighter">
            Platform built for <span className="text-brand-600 italic">all users</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ROLES.map((role) => (
            <div key={role.id} className="p-12 bg-gray-50 border border-gray-100 rounded-[48px] hover:shadow-2xl hover:shadow-gray-200/50 transition-all duration-500 group">
              <h3 className="font-display text-3xl font-black text-green-950 mb-6 tracking-tighter uppercase italic">
                {role.title}
              </h3>
              <p className="text-gray-500 font-medium leading-relaxed mb-10 h-20">
                {role.desc}
              </p>
              
              <div className="space-y-4 mb-12">
                {role.perks.map(perk => (
                  <div key={perk} className="flex items-center gap-3 text-sm font-bold text-green-950">
                    <div className="w-5 h-5 bg-white border border-gray-100 shadow-sm rounded-lg flex items-center justify-center text-brand-600">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                    {perk}
                  </div>
                ))}
              </div>

              <Link 
                href={role.link} 
                className="inline-flex items-center justify-center w-full py-5 bg-white border-2 border-green-100 rounded-2xl font-display font-black text-lg text-green-950 shadow-sm hover:border-brand-600 hover:text-brand-600 hover:-translate-y-1 transition-all duration-300"
              >
                {role.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
