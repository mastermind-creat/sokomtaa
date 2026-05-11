'use client';

import React from 'react';
import Link from 'next/link';
import { Logo } from '@/components/shared/Logo';

export const Footer = () => {
  const handleScrollTo = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    const target = document.querySelector(targetId);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <footer className="pt-24 pb-12 px-6 bg-white border-t border-gray-100">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-y-16 gap-x-8 mb-20">
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-3 mb-8">
              <Logo variant="icon" width={24} height={24} />
              <span className="font-display font-black text-2xl tracking-tighter text-green-950 shrink-0">
                Soko Mtaa
              </span>
            </Link>
            <p className="max-w-xs text-gray-500 font-medium leading-relaxed mb-8">
              Connecting traders, residents, and administrators in Kenya&apos;s urban markets. Built with ❤️ for Kisumu County.
            </p>
            <div className="flex gap-4">
              <span className="px-3 py-1 bg-brand-50 text-brand-700 text-[10px] font-black uppercase tracking-widest rounded-md border border-brand-100/50">M-Pesa API</span>
              <span className="px-3 py-1 bg-gray-50 text-gray-400 text-[10px] font-black uppercase tracking-widest rounded-md border border-gray-100">PWA 2.0</span>
            </div>
          </div>

          {[
            { 
              title: "Product", 
              links: [
                { label: "How it works", id: "#how-it-works" },
                { label: "Features", id: "#features" },
                { label: "Market Preview", id: "#market-preview" }
              ] 
            },
            { 
              title: "For Traders", 
              links: [
                { label: "Register Stall", id: "/register?role=trader" },
                { label: "Trader Portal", id: "/login" },
                { label: "Stall Map", id: "#" }
              ] 
            },
            { 
              title: "County", 
              links: [
                { label: "Kolenyo", id: "#" },
                { label: "Kombewa", id: "#" },
                { label: "Akala", id: "#" }
              ] 
            }
          ].map((col) => (
            <div key={col.title} className="col-span-1">
              <h4 className="font-black text-[10px] uppercase tracking-[0.2em] text-gray-400 mb-6">{col.title}</h4>
              <ul className="space-y-4">
                {col.links.map(link => (
                  <li key={link.label}>
                    {link.id.startsWith('#') ? (
                      <a href={link.id} onClick={(e) => handleScrollTo(e, link.id)} className="text-sm font-bold text-gray-600 hover:text-brand-600 transition-colors">
                        {link.label}
                      </a>
                    ) : (
                      <Link href={link.id} className="text-sm font-bold text-gray-600 hover:text-brand-600 transition-colors">
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-12 border-t border-gray-50 flex flex-col md:flex-row justify-between items-center gap-8">
          <p className="text-xs font-bold text-gray-400 tracking-widest uppercase">
            © 2026 Soko Mtaa Platform.
          </p>
          <p className="text-xs font-black text-gray-200 uppercase tracking-[0.5em] italic">
            Africa&apos;s Market Hub
          </p>
        </div>
      </div>
    </footer>
  );
};
