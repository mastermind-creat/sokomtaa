'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/shared/Logo';
import { useAuthStore } from '@/store/authStore';
import { useLogout } from '@/hooks/useLogout';
import { LogOut } from 'lucide-react';

export const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const { user, isAuthenticated } = useAuthStore();
  const { logout } = useLogout();
  const [hasHydrated, setHasHydrated] = useState(false);

  const getDashboardUrl = (role?: string) => {
    if (role === 'admin') return '/admin/dashboard';
    if (role === 'trader') return '/trader/dashboard';
    if (role === 'delivery') return '/delivery/dashboard';
    return '/resident';
  };

  useEffect(() => {
    setHasHydrated(true);
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleScrollTo = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    const target = document.querySelector(targetId);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setMenuOpen(false);
    }
  };

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 border-b ${isScrolled
          ? 'bg-white/80 backdrop-blur-xl border-gray-100 py-3 shadow-sm'
          : 'bg-transparent border-transparent py-5'
          }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="bg-brand-600 rounded-xl p-1 shadow-lg shadow-brand-600/20 group-hover:scale-110 transition-transform duration-300">
              <Logo variant="icon" width={28} height={28} />
            </div>
            <span className="font-display font-black text-2xl tracking-tighter text-green-950">
              Soko Mtaa
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {['Categories', 'Products', 'Markets', 'How it works'].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(/\s+/g, '-')}`}
                onClick={(e) => handleScrollTo(e, `#${item.toLowerCase().replace(/\s+/g, '-')}`)}
                className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-brand-600 transition-colors duration-200"
              >
                {item}
              </a>
            ))}
            <div className="w-px h-6 bg-gray-200 mx-4" />

            {isAuthenticated && user ? (
              <div className="flex items-center gap-4">
                <Link href={getDashboardUrl(user.role)} className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-white text-xs font-black">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-bold text-green-950">{user.name.split(' ')[0]}</span>
                </Link>
                <button
                  onClick={logout}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  title="Logout"
                >
                  <LogOut size={20} />
                </button>
              </div>
            ) : (
              <>
                <Link href="/login" className="px-4 py-2 text-sm font-bold text-gray-700 hover:text-brand-600 transition-colors duration-200">
                  Sign in
                </Link>
                <Link
                  href="/register"
                  className="ml-4 px-6 py-2.5 bg-brand-600 text-white font-display font-bold text-sm rounded-full shadow-lg shadow-brand-600/25 hover:bg-brand-700 hover:scale-105 transition-all duration-300"
                >
                  Get started free
                </Link>
              </>
            )}
          </div>

          <button
            className="md:hidden p-2 text-green-950"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 12h18M3 6h18M3 18h18" /></svg>
            )}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div className={`fixed inset-0 z-[90] md:hidden transition-all duration-500 ${menuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-white/95 backdrop-blur-xl flex flex-col items-center justify-center p-8 gap-8">
          {['Categories', 'Products', 'Markets', 'How it works'].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase().replace(/\s+/g, '-')}`}
              onClick={(e) => handleScrollTo(e, `#${item.toLowerCase().replace(/\s+/g, '-')}`)}
              className="text-2xl font-black text-green-950 hover:text-brand-600"
            >
              {item}
            </a>
          ))}
          {isAuthenticated && user ? (
            <>
              <div className="flex flex-col items-center gap-2 mb-2">
                <div className="w-16 h-16 rounded-full bg-brand-600 flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-brand-600/30">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-lg font-black text-green-950">{user.name.split(' ')[0]}</span>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest px-3 py-1 bg-gray-100 rounded-full">{user.role}</span>
              </div>
              <Link
                href={getDashboardUrl(user.role)}
                className="w-full text-center py-4 bg-brand-600 text-white font-black text-lg rounded-2xl"
                onClick={() => setMenuOpen(false)}
              >
                Go to Dashboard
              </Link>
              <button onClick={() => { logout(); setMenuOpen(false); }} className="text-xl font-black text-red-500">Logout</button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-2xl font-black text-gray-500" onClick={() => setMenuOpen(false)}>Sign in</Link>
              <Link
                href="/register"
                className="w-full text-center py-5 bg-brand-600 text-white font-black text-xl rounded-2xl"
                onClick={() => setMenuOpen(false)}
              >
                Get started free
              </Link>
            </>
          )}
        </div>
      </div>
    </>
  );
};
