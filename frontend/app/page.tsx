'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

export default function PublicLandingPage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeChip, setActiveChip] = useState('all');

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
    
    return () => observer.disconnect();
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
    <div className="w-full block relative bg-surface-base text-text-primary z-0 min-h-screen overflow-x-hidden flex-1">
      <style dangerouslySetInnerHTML={{ __html: `
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        :root{
          --green-950:#052E16;--green-900:#0A3D1F;--green-800:#0F5C2E;
          --green-700:#166534;--green-600:#1B6B3A;--green-500:#22A34A;
          --green-400:#34C75E;--green-300:#6EE08A;--green-200:#A7F3C0;
          --green-100:#DCFCE7;--green-50:#F0FDF4;
          --amber-600:#D97706;--amber-500:#F59E0B;--amber-400:#FBBF24;--amber-100:#FEF3C7;
          --earth-700:#44301A;--earth-300:#C4956A;--earth-100:#F5EBD8;
          --surface:#FAFAF5;--card:#FFFFFF;--text:#1A1A1A;--muted:#6B7280;--border:#E5E7EB;
          --radius-sm:8px;--radius-md:14px;--radius-lg:20px;--radius-xl:28px;--radius-full:9999px;
        }
        html{scroll-behavior:smooth;-webkit-text-size-adjust:100%}
        body{
          font-family:'DM Sans',sans-serif;
          background:var(--surface);
          color:var(--text);
          line-height:1.6;
          overflow-x:hidden;
          -webkit-font-smoothing:antialiased;
        }

        /* ── NAVBAR ── */
        .landing-nav{
          position:fixed;top:0;left:0;right:0;z-index:100;
          display:flex;align-items:center;justify-content:space-between;
          padding:0 24px;height:64px;
          background:rgba(250,250,245,0.88);
          backdrop-filter:blur(20px) saturate(180%);
          -webkit-backdrop-filter:blur(20px) saturate(180%);
          border-bottom:1px solid rgba(27,107,58,0.1);
          transition:box-shadow 0.3s;
        }
        .landing-nav.scrolled{box-shadow:0 2px 20px rgba(0,0,0,0.08)}
        .nav-brand{display:flex;align-items:center;gap:10px;text-decoration:none}
        .nav-logo{
          width:36px;height:36px;background:var(--green-600);
          border-radius:10px;display:flex;align-items:center;justify-content:center;
          flex-shrink:0;
        }
        .nav-wordmark{
          font-family:'Plus Jakarta Sans',sans-serif;
          font-weight:800;font-size:18px;letter-spacing:-0.4px;color:var(--green-700);
        }
        .nav-links{display:flex;align-items:center;gap:8px}
        .nav-link{
          font-size:14px;font-weight:500;color:var(--muted);
          text-decoration:none;padding:8px 14px;border-radius:var(--radius-full);
          transition:all 0.2s;
        }
        .nav-link:hover{color:var(--green-700);background:var(--green-50)}
        .nav-cta{
          font-family:'Plus Jakarta Sans',sans-serif;
          font-weight:700;font-size:14px;
          background:linear-gradient(135deg,var(--green-700),var(--green-500));
          color:#fff;padding:9px 20px;border-radius:var(--radius-full);
          text-decoration:none;border:none;cursor:pointer;
          box-shadow:0 4px 14px rgba(27,107,58,0.3);
          transition:all 0.2s;
        }
        .nav-cta:hover{transform:translateY(-1px);box-shadow:0 6px 20px rgba(27,107,58,0.4)}
        .nav-cta:active{transform:scale(0.97)}
        .hamburger{display:none;flex-direction:column;gap:5px;cursor:pointer;padding:8px;background:none;border:none}
        .hamburger span{display:block;width:22px;height:2px;background:var(--green-700);border-radius:2px;transition:all 0.3s}
        .mobile-menu{
          display:none;position:fixed;top:64px;left:0;right:0;z-index:99;
          background:rgba(250,250,245,0.98);backdrop-filter:blur(20px);
          padding:16px 24px 24px;border-bottom:1px solid var(--border);
          flex-direction:column;gap:8px;
        }
        .mobile-menu.open{display:flex}
        .mobile-link{
          font-size:16px;font-weight:500;color:var(--text);
          text-decoration:none;padding:12px 16px;border-radius:var(--radius-md);
          transition:background 0.2s;
        }
        .mobile-link:hover{background:var(--green-50);color:var(--green-700)}
        .mobile-cta-row{display:flex;gap:10px;margin-top:8px}
        .mobile-login{
          flex:1;text-align:center;padding:13px;border-radius:var(--radius-md);
          border:1.5px solid var(--green-400);color:var(--green-700);
          font-weight:600;font-size:15px;text-decoration:none;
        }
        .mobile-signup{
          flex:1;text-align:center;padding:13px;border-radius:var(--radius-md);
          background:var(--green-600);color:#fff;
          font-weight:700;font-size:15px;text-decoration:none;
        }

        /* ── HERO ── */
        .hero{
          min-height:100vh;padding:100px 24px 60px;
          display:flex;flex-direction:column;align-items:center;justify-content:center;
          position:relative;overflow:hidden;
          background:
            radial-gradient(ellipse 80% 60% at 50% -10%,rgba(34,163,74,0.12) 0%,transparent 60%),
            radial-gradient(ellipse 60% 40% at 80% 60%,rgba(245,158,11,0.06) 0%,transparent 50%),
            var(--surface);
        }
        .hero-blob{
          position:absolute;pointer-events:none;opacity:0.07;
          border-radius:60% 40% 30% 70% / 60% 30% 70% 40%;
          background:var(--green-500);
          animation:morph 10s ease-in-out infinite;
        }
        .hero-blob-1{width:500px;height:500px;top:-100px;right:-150px}
        .hero-blob-2{
          width:350px;height:350px;bottom:-80px;left:-100px;
          animation-delay:-4s;opacity:0.05;
          background:var(--amber-500);
        }
        @keyframes morph{
          0%,100%{border-radius:60% 40% 30% 70%/60% 30% 70% 40%}
          25%{border-radius:30% 60% 70% 40%/50% 60% 30% 60%}
          50%{border-radius:50% 60% 30% 60%/40% 30% 60% 50%}
          75%{border-radius:40% 30% 60% 50%/70% 40% 60% 30%}
        }
        .hero-content{
          max-width:760px;text-align:center;position:relative;z-index:1;
        }
        .hero-badge{
          display:inline-flex;align-items:center;gap:8px;
          background:var(--green-100);border:1px solid var(--green-300);
          color:var(--green-700);border-radius:var(--radius-full);
          padding:7px 16px;font-size:13px;font-weight:600;
          margin-bottom:28px;
          animation:fadeUp 0.6s ease-out both;
        }
        .hero-badge-dot{
          width:7px;height:7px;border-radius:50%;background:var(--green-500);
          animation:pulseDot 2s infinite;
        }
        @keyframes pulseDot{
          0%,100%{box-shadow:0 0 0 0 rgba(34,163,74,0.5)}
          50%{box-shadow:0 0 0 5px rgba(34,163,74,0)}
        }
        .hero-title{
          font-family:'Plus Jakarta Sans',sans-serif;
          font-size:clamp(2.4rem,6vw,4.2rem);
          font-weight:900;
          line-height:1.08;
          letter-spacing:-0.03em;
          color:var(--green-950);
          margin-bottom:22px;
          animation:fadeUp 0.6s 0.1s ease-out both;
        }
        .hero-title .accent{
          color:var(--green-600);
          position:relative;display:inline-block;
        }
        .hero-title .accent::after{
          content:'';position:absolute;bottom:-4px;left:0;right:0;
          height:4px;background:linear-gradient(90deg,var(--green-400),var(--amber-400));
          border-radius:2px;
        }
        .hero-title .gold{color:var(--amber-600)}
        .hero-sub{
          font-size:clamp(1rem,2.5vw,1.2rem);color:var(--muted);
          max-width:560px;margin:0 auto 36px;line-height:1.7;
          animation:fadeUp 0.6s 0.2s ease-out both;
        }
        .hero-actions{
          display:flex;align-items:center;justify-content:center;
          gap:14px;flex-wrap:wrap;margin-bottom:48px;
          animation:fadeUp 0.6s 0.3s ease-out both;
        }
        .btn-primary{
          display:inline-flex;align-items:center;gap:8px;
          font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:16px;
          background:linear-gradient(135deg,var(--green-700) 0%,var(--green-500) 100%);
          color:#fff;padding:16px 32px;border-radius:var(--radius-md);
          text-decoration:none;border:none;cursor:pointer;
          box-shadow:0 6px 24px rgba(27,107,58,0.35),inset 0 1px 0 rgba(255,255,255,0.15);
          transition:all 0.2s;
        }
        .btn-primary:hover{transform:translateY(-2px);box-shadow:0 10px 32px rgba(27,107,58,0.45)}
        .btn-primary:active{transform:scale(0.97)}
        .btn-secondary{
          display:inline-flex;align-items:center;gap:8px;
          font-weight:600;font-size:15px;
          color:var(--green-700);padding:15px 28px;border-radius:var(--radius-md);
          text-decoration:none;border:1.5px solid var(--green-300);
          background:transparent;cursor:pointer;
          transition:all 0.2s;
        }
        .btn-secondary:hover{background:var(--green-50);border-color:var(--green-500)}
        .hero-trust{
          display:flex;align-items:center;justify-content:center;
          gap:24px;flex-wrap:wrap;
          animation:fadeUp 0.6s 0.4s ease-out both;
        }
        .trust-item{display:flex;align-items:center;gap:7px;font-size:13px;color:var(--muted)}
        .trust-icon{
          width:18px;height:18px;border-radius:50%;background:var(--green-100);
          display:flex;align-items:center;justify-content:center;flex-shrink:0;
        }

        /* ── LIVE MARKET PREVIEW ── */
        .market-preview{
          max-width:1100px;margin:0 auto;padding:0 24px 80px;
          animation:fadeUp 0.7s 0.5s ease-out both;
        }
        .preview-label{
          text-align:center;font-size:12px;font-weight:600;
          letter-spacing:0.08em;text-transform:uppercase;color:var(--muted);
          margin-bottom:20px;
        }
        .preview-card{
          background:var(--card);border-radius:var(--radius-xl);
          border:1px solid var(--border);
          box-shadow:0 4px 6px rgba(0,0,0,0.04),0 20px 60px rgba(0,0,0,0.07);
          overflow:hidden;
        }
        .preview-bar{
          background:var(--green-950);padding:14px 20px;
          display:flex;align-items:center;gap:10px;
        }
        .preview-dots{display:flex;gap:6px}
        .preview-dot{width:10px;height:10px;border-radius:50%}
        .preview-url{
          flex:1;background:rgba(255,255,255,0.1);border-radius:var(--radius-full);
          padding:6px 14px;font-family:'JetBrains Mono',monospace;
          font-size:12px;color:rgba(255,255,255,0.6);
        }
        .preview-body{padding:24px}
        .market-header{
          display:flex;align-items:center;justify-content:space-between;
          margin-bottom:20px;flex-wrap:wrap;gap:12px;
        }
        .market-title{
          font-family:'Plus Jakarta Sans',sans-serif;
          font-size:20px;font-weight:800;color:var(--green-900);
        }
        .market-meta{font-size:13px;color:var(--muted);margin-top:2px}
        .market-stats{display:flex;gap:10px;flex-wrap:wrap}
        .stat-chip{
          background:var(--green-50);border:1px solid var(--green-100);
          border-radius:var(--radius-full);padding:6px 14px;
          font-size:13px;font-weight:600;color:var(--green-700);
          display:flex;align-items:center;gap:5px;
        }

        /* Category filter */
        .cat-row{
          display:flex;gap:8px;overflow-x:auto;padding-bottom:8px;margin-bottom:20px;
          scrollbar-width:none;
        }
        .cat-row::-webkit-scrollbar{display:none}
        .cat-chip{
          flex-shrink:0;display:flex;align-items:center;gap:6px;
          background:var(--card);border:1.5px solid var(--border);
          border-radius:var(--radius-full);padding:8px 16px;
          font-size:13px;font-weight:500;color:var(--text);cursor:pointer;
          transition:all 0.2s;white-space:nowrap;
        }
        .cat-chip:hover,.cat-chip.active{
          background:var(--green-600);border-color:var(--green-600);color:#fff;
        }

        /* Trader cards grid */
        .traders-grid{
          display:grid;
          grid-template-columns:repeat(auto-fill,minmax(min(280px,100%),1fr));
          gap:14px;margin-bottom:20px;
        }
        .trader-card{
          background:var(--card);border:1px solid var(--border);
          border-radius:var(--radius-lg);overflow:hidden;
          transition:all 0.25s;cursor:pointer;
          position:relative;
        }
        .trader-card:hover{
          transform:translateY(-3px);
          box-shadow:0 8px 32px rgba(27,107,58,0.12);
          border-color:var(--green-200);
        }
        .trader-banner{
          height:80px;position:relative;overflow:hidden;
        }
        .trader-avatar{
          position:absolute;bottom:-20px;left:14px;
          width:44px;height:44px;border-radius:12px;
          border:3px solid var(--card);
          display:flex;align-items:center;justify-content:center;
          font-family:'Plus Jakarta Sans',sans-serif;
          font-weight:800;font-size:16px;color:#fff;
          box-shadow:0 2px 8px rgba(0,0,0,0.15);
        }
        .open-badge{
          position:absolute;top:10px;right:10px;
          display:flex;align-items:center;gap:4px;
          background:rgba(255,255,255,0.95);
          border-radius:var(--radius-full);padding:4px 10px;
          font-size:11px;font-weight:700;
        }
        .open-dot{width:6px;height:6px;border-radius:50%;background:#16a34a;animation:pulseDot 2s infinite}
        .closed-dot{width:6px;height:6px;border-radius:50%;background:#9ca3af}
        .trader-info{padding:28px 14px 14px}
        .trader-name{
          font-family:'Plus Jakarta Sans',sans-serif;
          font-weight:700;font-size:15px;color:var(--green-900);margin-bottom:3px;
        }
        .trader-tags{
          display:flex;gap:5px;flex-wrap:wrap;margin-bottom:10px;
        }
        .trader-tag{
          font-size:11px;color:var(--muted);background:var(--green-50);
          border-radius:var(--radius-full);padding:3px 8px;
        }
        .trader-meta{
          display:flex;align-items:center;justify-content:space-between;
          font-size:12px;color:var(--muted);
        }
        .trader-rating{display:flex;align-items:center;gap:3px;font-weight:600;color:var(--amber-600)}
        .trader-stall{display:flex;align-items:center;gap:4px}

        /* Lock overlay */
        .lock-overlay{
          background:linear-gradient(to bottom,rgba(250,250,245,0) 0%,rgba(250,250,245,0.97) 45%,rgba(250,250,245,1) 100%);
          margin-top:-100px;padding:100px 0 32px;
          display:flex;flex-direction:column;align-items:center;
          text-align:center;position:relative;z-index:2;
        }
        .lock-card{
          background:var(--card);border:1px solid var(--border);
          border-radius:var(--radius-xl);padding:28px 32px;
          max-width:420px;width:100%;
          box-shadow:0 4px 24px rgba(0,0,0,0.08);
        }
        .lock-icon{
          width:48px;height:48px;border-radius:14px;
          background:var(--green-50);border:1.5px solid var(--green-200);
          display:flex;align-items:center;justify-content:center;
          margin:0 auto 16px;
        }
        .lock-title{
          font-family:'Plus Jakarta Sans',sans-serif;
          font-weight:800;font-size:20px;color:var(--green-900);margin-bottom:8px;
        }
        .lock-sub{font-size:14px;color:var(--muted);margin-bottom:20px;line-height:1.6}
        .lock-features{
          display:flex;flex-direction:column;gap:8px;margin-bottom:22px;text-align:left;
        }
        .lock-feature{
          display:flex;align-items:center;gap:10px;
          font-size:13px;color:var(--text);
        }
        .lock-check{
          width:20px;height:20px;border-radius:6px;background:var(--green-100);
          display:flex;align-items:center;justify-content:center;flex-shrink:0;
        }
        .lock-btn-primary{
          display:block;width:100%;
          font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:15px;
          background:linear-gradient(135deg,var(--green-700),var(--green-500));
          color:#fff;padding:14px;border-radius:var(--radius-md);
          text-decoration:none;text-align:center;
          box-shadow:0 4px 16px rgba(27,107,58,0.3);
          transition:all 0.2s;margin-bottom:10px;border:none;cursor:pointer;
        }
        .lock-btn-primary:hover{transform:translateY(-1px);box-shadow:0 6px 24px rgba(27,107,58,0.4)}
        .lock-btn-secondary{
          display:block;width:100%;
          font-weight:600;font-size:14px;
          color:var(--green-700);padding:13px;border-radius:var(--radius-md);
          text-decoration:none;text-align:center;
          border:1.5px solid var(--green-200);background:transparent;
          transition:all 0.2s;cursor:pointer;
        }
        .lock-btn-secondary:hover{background:var(--green-50);border-color:var(--green-400)}
        .lock-divider{
          display:flex;align-items:center;gap:10px;
          font-size:12px;color:var(--muted);margin:10px 0;
        }
        .lock-divider::before,.lock-divider::after{
          content:'';flex:1;height:1px;background:var(--border);
        }

        /* ── HOW IT WORKS ── */
        .section{padding:80px 24px;max-width:1100px;margin:0 auto}
        .section-label{
          font-size:12px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;
          color:var(--green-500);margin-bottom:12px;
        }
        .section-title{
          font-family:'Plus Jakarta Sans',sans-serif;
          font-size:clamp(1.8rem,4vw,2.8rem);
          font-weight:800;letter-spacing:-0.025em;color:var(--green-950);
          margin-bottom:14px;line-height:1.15;
        }
        .section-sub{font-size:1.05rem;color:var(--muted);max-width:520px;line-height:1.7}
        .steps-grid{
          display:grid;
          grid-template-columns:repeat(auto-fit,minmax(min(260px,100%),1fr));
          gap:20px;margin-top:48px;
        }
        .step-card{
          background:var(--card);border:1px solid var(--border);
          border-radius:var(--radius-lg);padding:28px;
          position:relative;overflow:hidden;
          transition:all 0.3s;
        }
        .step-card:hover{
          transform:translateY(-4px);
          box-shadow:0 12px 40px rgba(27,107,58,0.1);
          border-color:var(--green-200);
        }
        .step-card::before{
          content:'';position:absolute;top:0;left:0;right:0;height:3px;
          background:linear-gradient(90deg,var(--green-500),var(--green-300));
        }
        .step-num{
          font-family:'JetBrains Mono',monospace;
          font-size:11px;font-weight:700;color:var(--green-400);
          letter-spacing:0.06em;margin-bottom:16px;
        }
        .step-icon{
          width:48px;height:48px;border-radius:14px;
          background:var(--green-50);border:1.5px solid var(--green-100);
          display:flex;align-items:center;justify-content:center;
          margin-bottom:18px;
        }
        .step-title{
          font-family:'Plus Jakarta Sans',sans-serif;
          font-weight:700;font-size:17px;color:var(--green-900);margin-bottom:8px;
        }
        .step-desc{font-size:14px;color:var(--muted);line-height:1.7}

        /* ── FEATURES ── */
        .features-section{
          background:linear-gradient(160deg,var(--green-950) 0%,var(--green-800) 60%,var(--green-700) 100%);
          padding:80px 24px;position:relative;overflow:hidden;
        }
        .features-section::before{
          content:'';position:absolute;inset:0;
          background-image:url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none'%3E%3Ccircle cx='30' cy='30' r='1.5' fill='rgba(255,255,255,0.04)'/%3E%3C/g%3E%3C/svg%3E");
        }
        .features-inner{max-width:1100px;margin:0 auto;position:relative;z-index:1}
        .features-label{
          font-size:12px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;
          color:var(--green-300);margin-bottom:12px;
        }
        .features-title{
          font-family:'Plus Jakarta Sans',sans-serif;
          font-size:clamp(1.8rem,4vw,2.8rem);
          font-weight:800;letter-spacing:-0.025em;color:#fff;
          margin-bottom:14px;line-height:1.15;
        }
        .features-sub{font-size:1.05rem;color:rgba(255,255,255,0.6);max-width:520px;line-height:1.7;margin-bottom:48px}
        .features-grid{
          display:grid;
          grid-template-columns:repeat(auto-fit,minmax(min(280px,100%),1fr));
          gap:16px;
        }
        .feature-card{
          background:rgba(255,255,255,0.06);
          border:1px solid rgba(255,255,255,0.1);
          border-radius:var(--radius-lg);padding:24px;
          transition:all 0.3s;
        }
        .feature-card:hover{
          background:rgba(255,255,255,0.1);
          border-color:rgba(255,255,255,0.2);
          transform:translateY(-2px);
        }
        .feature-icon{
          width:44px;height:44px;border-radius:12px;
          background:rgba(34,163,74,0.25);border:1px solid rgba(34,163,74,0.3);
          display:flex;align-items:center;justify-content:center;margin-bottom:16px;
        }
        .feature-title{
          font-family:'Plus Jakarta Sans',sans-serif;
          font-weight:700;font-size:16px;color:#fff;margin-bottom:8px;
        }
        .feature-desc{font-size:13px;color:rgba(255,255,255,0.6);line-height:1.7}
        .feature-tag{
          display:inline-block;margin-top:12px;
          font-size:11px;font-weight:600;
          background:rgba(34,163,74,0.2);color:var(--green-300);
          border-radius:var(--radius-full);padding:3px 10px;
        }
        .feature-tag.amber{background:rgba(245,158,11,0.2);color:var(--amber-400)}

        /* ── ROLES ── */
        .roles-section{padding:80px 24px;max-width:1100px;margin:0 auto}
        .roles-grid{
          display:grid;
          grid-template-columns:repeat(auto-fit,minmax(min(300px,100%),1fr));
          gap:20px;margin-top:48px;
        }
        .role-card{
          border-radius:var(--radius-xl);padding:32px;
          position:relative;overflow:hidden;
          border:1.5px solid transparent;
          transition:all 0.3s;cursor:default;
        }
        .role-card:hover{transform:translateY(-4px)}
        .role-card.resident{background:linear-gradient(145deg,#f0fdf4,#dcfce7);border-color:#a7f3c0}
        .role-card.resident:hover{box-shadow:0 12px 40px rgba(27,107,58,0.15)}
        .role-card.trader{background:linear-gradient(145deg,#fefce8,#fef9c3);border-color:#fde68a}
        .role-card.trader:hover{box-shadow:0 12px 40px rgba(245,158,11,0.15)}
        .role-card.admin{background:linear-gradient(145deg,#eff6ff,#dbeafe);border-color:#bfdbfe}
        .role-card.admin:hover{box-shadow:0 12px 40px rgba(59,130,246,0.15)}
        .role-icon{
          width:52px;height:52px;border-radius:16px;
          display:flex;align-items:center;justify-content:center;margin-bottom:20px;
        }
        .role-card.resident .role-icon{background:rgba(27,107,58,0.12)}
        .role-card.trader .role-icon{background:rgba(245,158,11,0.12)}
        .role-card.admin .role-icon{background:rgba(59,130,246,0.12)}
        .role-title{
          font-family:'Plus Jakarta Sans',sans-serif;
          font-weight:800;font-size:20px;margin-bottom:8px;
        }
        .role-card.resident .role-title{color:var(--green-900)}
        .role-card.trader .role-title{color:#92400e}
        .role-card.admin .role-title{color:#1e40af}
        .role-desc{font-size:14px;line-height:1.7;margin-bottom:20px}
        .role-card.resident .role-desc{color:var(--green-700)}
        .role-card.trader .role-desc{color:#78350f}
        .role-card.admin .role-desc{color:#1e40af}
        .role-perks{display:flex;flex-direction:column;gap:8px}
        .role-perk{display:flex;align-items:center;gap:8px;font-size:13px}
        .role-card.resident .role-perk{color:var(--green-800)}
        .role-card.trader .role-perk{color:#92400e}
        .role-card.admin .role-perk{color:#1d4ed8}
        .perk-check{
          width:18px;height:18px;border-radius:5px;flex-shrink:0;
          display:flex;align-items:center;justify-content:center;
        }
        .role-card.resident .perk-check{background:rgba(27,107,58,0.15)}
        .role-card.trader .perk-check{background:rgba(245,158,11,0.15)}
        .role-card.admin .perk-check{background:rgba(59,130,246,0.15)}
        .role-cta{
          display:inline-flex;align-items:center;gap:6px;
          margin-top:24px;font-weight:600;font-size:14px;
          text-decoration:none;padding:10px 18px;border-radius:var(--radius-md);
          transition:all 0.2s;
        }
        .role-card.resident .role-cta{background:var(--green-600);color:#fff}
        .role-card.resident .role-cta:hover{background:var(--green-700)}
        .role-card.trader .role-cta{background:#d97706;color:#fff}
        .role-card.trader .role-cta:hover{background:#b45309}
        .role-card.admin .role-cta{background:#2563eb;color:#fff}
        .role-card.admin .role-cta:hover{background:#1d4ed8}

        /* ── CTA BANNER ── */
        .cta-section{
          background:linear-gradient(135deg,var(--green-900) 0%,var(--green-700) 100%);
          padding:80px 24px;text-align:center;
          position:relative;overflow:hidden;
        }
        .cta-section::before{
          content:'';position:absolute;
          width:600px;height:600px;border-radius:50%;
          background:rgba(255,255,255,0.03);
          top:-200px;left:50%;transform:translateX(-50%);
        }
        .cta-inner{max-width:580px;margin:0 auto;position:relative;z-index:1}
        .cta-title{
          font-family:'Plus Jakarta Sans',sans-serif;
          font-size:clamp(1.8rem,4vw,2.6rem);
          font-weight:900;color:#fff;letter-spacing:-0.025em;margin-bottom:14px;
        }
        .cta-sub{font-size:1rem;color:rgba(255,255,255,0.65);margin-bottom:32px;line-height:1.7}
        .cta-actions{display:flex;gap:12px;justify-content:center;flex-wrap:wrap}
        .cta-btn-white{
          font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:16px;
          background:#fff;color:var(--green-700);
          padding:16px 32px;border-radius:var(--radius-md);
          text-decoration:none;border:none;cursor:pointer;
          box-shadow:0 4px 16px rgba(0,0,0,0.15);
          transition:all 0.2s;
        }
        .cta-btn-white:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,0.2)}
        .cta-btn-outline{
          font-weight:600;font-size:15px;
          color:#fff;padding:15px 28px;border-radius:var(--radius-md);
          text-decoration:none;border:1.5px solid rgba(255,255,255,0.35);
          background:transparent;cursor:pointer;
          transition:all 0.2s;
        }
        .cta-btn-outline:hover{background:rgba(255,255,255,0.1);border-color:rgba(255,255,255,0.6)}

        /* ── FOOTER ── */
        footer{
          background:var(--green-950);padding:48px 24px 32px;
          color:rgba(255,255,255,0.5);font-size:14px;
        }
        .footer-inner{max-width:1100px;margin:0 auto}
        .footer-top{
          display:flex;flex-wrap:wrap;gap:40px;
          justify-content:space-between;padding-bottom:40px;
          border-bottom:1px solid rgba(255,255,255,0.07);margin-bottom:32px;
        }
        .footer-brand{max-width:280px}
        .footer-logo{display:flex;align-items:center;gap:10px;margin-bottom:14px}
        .footer-logo-box{
          width:36px;height:36px;border-radius:10px;
          background:var(--green-700);
          display:flex;align-items:center;justify-content:center;
        }
        .footer-wordmark{
          font-family:'Plus Jakarta Sans',sans-serif;
          font-weight:800;font-size:18px;color:#fff;letter-spacing:-0.3px;
        }
        .footer-desc{font-size:13px;color:rgba(255,255,255,0.45);line-height:1.7}
        .footer-col h4{
          font-family:'Plus Jakarta Sans',sans-serif;
          font-weight:700;font-size:13px;color:rgba(255,255,255,0.8);
          letter-spacing:0.05em;text-transform:uppercase;margin-bottom:14px;
        }
        .footer-links{display:flex;flex-direction:column;gap:8px}
        .footer-link{color:rgba(255,255,255,0.45);text-decoration:none;font-size:13px;transition:color 0.2s}
        .footer-link:hover{color:var(--green-300)}
        .footer-bottom{
          display:flex;align-items:center;justify-content:space-between;
          flex-wrap:wrap;gap:12px;font-size:12px;
        }
        .footer-copy{color:rgba(255,255,255,0.3)}
        .footer-badges{display:flex;gap:8px}
        .footer-badge{
          background:rgba(255,255,255,0.06);
          border:1px solid rgba(255,255,255,0.1);
          border-radius:var(--radius-full);padding:4px 12px;
          font-size:11px;font-weight:600;color:rgba(255,255,255,0.4);
        }

        /* ── ANIMATIONS ── */
        @keyframes fadeUp{
          from{opacity:0;transform:translateY(24px)}
          to{opacity:1;transform:translateY(0)}
        }
        .reveal{
          opacity:0;transform:translateY(30px);
          transition:opacity 0.6s ease-out,transform 0.6s ease-out;
        }
        .reveal.visible{opacity:1;transform:translateY(0)}

        /* ── RESPONSIVE ── */
        @media(max-width:768px){
          .nav-links{display:none}
          .hamburger{display:flex}
          .hero{padding:88px 20px 40px}
          .hero-actions{flex-direction:column;align-items:stretch}
          .btn-primary,.btn-secondary{justify-content:center}
          .market-header{flex-direction:column;align-items:flex-start}
          .traders-grid{grid-template-columns:1fr 1fr}
          .preview-body{padding:16px}
        }
        @media(max-width:480px){
          .traders-grid{grid-template-columns:1fr}
          .trust-item:nth-child(3){display:none}
        }
      `}} />

      {/* NAVBAR */}
      <nav className={`landing-nav ${isScrolled ? 'scrolled' : ''}`} id="navbar">
        <Link href="#" className="nav-brand">
          <div className="nav-logo">
            <svg width="20" height="20" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 34 Q12 22 22 22 L42 22 Q52 22 52 34 L52 38 L12 38 Z" fill="rgba(255,255,255,0.95)"/>
              <path d="M12 38 Q16.5 44 21 38 Q25.5 44 30 38 Q34.5 44 39 38 Q43.5 44 48 38 L52 38 L12 38 Z" fill="rgba(255,255,255,0.65)"/>
              <rect x="16" y="38" width="32" height="14" rx="2" fill="rgba(255,255,255,0.1)"/>
              <rect x="13" y="33" width="4" height="20" rx="2" fill="rgba(255,255,255,0.55)"/>
              <rect x="47" y="33" width="4" height="20" rx="2" fill="rgba(255,255,255,0.55)"/>
              <circle cx="32" cy="14" r="3" fill="#F59E0B"/>
            </svg>
          </div>
          <span className="nav-wordmark">Soko Mtaa</span>
        </Link>
        <div className="nav-links">
          <a href="#how-it-works" onClick={(e) => handleScrollTo(e, '#how-it-works')} className="nav-link">How it works</a>
          <a href="#features" onClick={(e) => handleScrollTo(e, '#features')} className="nav-link">Features</a>
          <a href="#roles" onClick={(e) => handleScrollTo(e, '#roles')} className="nav-link">For traders</a>
          <Link href="/login" className="nav-link">Sign in</Link>
          <Link href="/register" className="nav-cta">Get started free</Link>
        </div>
        <button className="hamburger" aria-label="Menu" onClick={() => setMenuOpen(!menuOpen)}>
          <span></span><span></span><span></span>
        </button>
      </nav>
      
      <div className={`mobile-menu ${menuOpen ? 'open' : ''}`} id="mobileMenu">
        <a href="#how-it-works" onClick={(e) => handleScrollTo(e, '#how-it-works')} className="mobile-link">How it works</a>
        <a href="#features" onClick={(e) => handleScrollTo(e, '#features')} className="mobile-link">Features</a>
        <a href="#roles" onClick={(e) => handleScrollTo(e, '#roles')} className="mobile-link">For traders</a>
        <div className="mobile-cta-row">
          <Link href="/login" className="mobile-login" onClick={() => setMenuOpen(false)}>Sign in</Link>
          <Link href="/register" className="mobile-signup" onClick={() => setMenuOpen(false)}>Register free</Link>
        </div>
      </div>

      {/* HERO */}
      <section className="hero">
        <div className="hero-blob hero-blob-1"></div>
        <div className="hero-blob hero-blob-2"></div>
        <div className="hero-content">
          <div className="hero-badge">
            <span className="hero-badge-dot"></span>
            Kolenyo Market is live right now
          </div>
          <h1 className="hero-title">
            Your <span className="accent">neighbourhood</span><br/>market, <span className="gold">digitized</span>
          </h1>
          <p className="hero-sub">
            Discover local traders, browse fresh produce, reserve items, and pay via M-Pesa — all without leaving your estate.
          </p>
          <div className="hero-actions">
            <Link href="/register" className="btn-primary">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
              Create free account
            </Link>
            <a href="#market-preview" onClick={(e) => handleScrollTo(e, '#market-preview')} className="btn-secondary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              Browse the market
            </a>
          </div>
          <div className="hero-trust">
            <div className="trust-item">
              <div className="trust-icon">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              Free to browse
            </div>
            <div className="trust-item">
              <div className="trust-icon">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              M-Pesa payments
            </div>
            <div className="trust-item">
              <div className="trust-icon">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              No delivery needed
            </div>
          </div>
        </div>
      </section>

      {/* LIVE MARKET PREVIEW */}
      <div className="market-preview" id="market-preview">
        <p className="preview-label">Live market · Kolenyo Estate, Kisumu</p>
        <div className="preview-card">
          <div className="preview-bar">
            <div className="preview-dots">
              <div className="preview-dot" style={{background:'#ff5f57'}}></div>
              <div className="preview-dot" style={{background:'#febc2e'}}></div>
              <div className="preview-dot" style={{background:'#28c840'}}></div>
            </div>
            <div className="preview-url">sokomtaa.co.ke/market/kolenyo</div>
          </div>
          <div className="preview-body">
            <div className="market-header">
              <div>
                <div className="market-title">Kolenyo Market</div>
                <div className="market-meta">Kolenyo Estate · Open Mon–Sat · 6:00 AM – 7:00 PM</div>
              </div>
              <div className="market-stats">
                <div className="stat-chip">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                  34 traders
                </div>
                <div className="stat-chip" style={{background:'#fef9c3', borderColor:'#fde68a', color:'#92400e'}}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  22 open now
                </div>
              </div>
            </div>

            {/* Category filter */}
            <div className="cat-row" id="catRow">
              <div className={`cat-chip ${activeChip === 'all' ? 'active' : ''}`} onClick={() => setActiveChip('all')}>All</div>
              <div className={`cat-chip ${activeChip === 'veg' ? 'active' : ''}`} onClick={() => setActiveChip('veg')}>🥬 Vegetables</div>
              <div className={`cat-chip ${activeChip === 'fruit' ? 'active' : ''}`} onClick={() => setActiveChip('fruit')}>🍎 Fruits</div>
              <div className={`cat-chip ${activeChip === 'fish' ? 'active' : ''}`} onClick={() => setActiveChip('fish')}>🐟 Fish</div>
              <div className={`cat-chip ${activeChip === 'grain' ? 'active' : ''}`} onClick={() => setActiveChip('grain')}>🌾 Grains</div>
              <div className={`cat-chip ${activeChip === 'dairy' ? 'active' : ''}`} onClick={() => setActiveChip('dairy')}>🥚 Dairy</div>
              <div className={`cat-chip ${activeChip === 'street' ? 'active' : ''}`} onClick={() => setActiveChip('street')}>🍽️ Street Food</div>
              <div className={`cat-chip ${activeChip === 'clothes' ? 'active' : ''}`} onClick={() => setActiveChip('clothes')}>👗 Clothing</div>
            </div>

            {/* Trader cards */}
            <div className="traders-grid">
              {[
                { name: "Mama Wanjiru's Mboga", bg: "#0a3d1f", bgTo: "#1b6b3a", avBg: "#166534", avText: "MW", tags: ["Vegetables", "Fruits"], rating: 4.9, count: 127, stall: "Stall A1", open: true, badgeColor: "#166534" },
                { name: "Ochieng Fish Stall", bg: "#1e3a5f", bgTo: "#2563eb", avBg: "#1d4ed8", avText: "OF", tags: ["Fish", "Seafood"], rating: 4.7, count: 89, stall: "Stall C2", open: true, badgeColor: "#166534" },
                { name: "Kamau Cereals & Grains", bg: "#78350f", bgTo: "#d97706", avBg: "#b45309", avText: "KC", tags: ["Grains", "Flour"], rating: 4.8, count: 203, stall: "Stall B5", open: false, badgeColor: "#92400e" }
              ].map((trader, i) => (
                <div className="trader-card" key={i}>
                  <div className="trader-banner" style={{background:`linear-gradient(135deg, ${trader.bg}, ${trader.bgTo})`}}>
                    <div className="trader-avatar" style={{background: trader.avBg}}>{trader.avText}</div>
                    <div className="open-badge" style={{color: trader.badgeColor}}>
                      <span className={trader.open ? "open-dot" : "closed-dot"}></span> {trader.open ? "Open" : "Closed"}
                    </div>
                  </div>
                  <div className="trader-info">
                    <div className="trader-name">{trader.name}</div>
                    <div className="trader-tags">
                      {trader.tags.map(tag => <span className="trader-tag" key={tag}>{tag}</span>)}
                    </div>
                    <div className="trader-meta">
                      <div className="trader-rating">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="#d97706" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                        {trader.rating}
                        <span style={{fontWeight:400, color:'var(--muted)'}}>({trader.count})</span>
                      </div>
                      <div className="trader-stall">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
                        <span>{trader.stall}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <div className="trader-card" style={{opacity:0.55, filter:'blur(1px)', pointerEvents:'none'}}>
                <div className="trader-banner" style={{background:"linear-gradient(135deg,#4a1528,#be185d)"}}>
                  <div className="trader-avatar" style={{background:"#9d174d"}}>AA</div>
                  <div className="open-badge" style={{color:"#166534"}}><span className="open-dot"></span> Open</div>
                </div>
                <div className="trader-info">
                  <div className="trader-name">Mama Atieno Spices</div>
                  <div className="trader-tags">
                    <span className="trader-tag">Spices</span>
                    <span className="trader-tag">Herbs</span>
                  </div>
                  <div className="trader-meta">
                    <div className="trader-rating">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="#d97706" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                      4.9
                      <span style={{fontWeight:400, color:'var(--muted)'}}>(56)</span>
                    </div>
                    <div className="trader-stall">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
                      <span>Stall B9</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Lock overlay */}
            <div className="lock-overlay">
              <div className="lock-card">
                <div className="lock-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1b6b3a" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                </div>
                <div className="lock-title">See the full market</div>
                <div className="lock-sub">Create a free account to compare prices, reserve items, and get notified when your favourite products are available.</div>
                <div className="lock-features">
                  <div className="lock-feature">
                    <div className="lock-check">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#1b6b3a" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                    Compare prices across all traders
                  </div>
                  <div className="lock-feature">
                    <div className="lock-check">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#1b6b3a" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                    Reserve items for pickup with M-Pesa
                  </div>
                  <div className="lock-feature">
                    <div className="lock-check">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#1b6b3a" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                    Get notified when out-of-stock items return
                  </div>
                  <div className="lock-feature">
                    <div className="lock-check">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#1b6b3a" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                    Interactive market map with live stall status
                  </div>
                </div>
                <Link href="/register" className="lock-btn-primary">Create free account</Link>
                <div className="lock-divider">or</div>
                <Link href="/login" className="lock-btn-secondary">Sign in to your account</Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* HOW IT WORKS */}
      <section className="section" id="how-it-works">
        <div className="reveal">
          <div className="section-label">Simple process</div>
          <h2 className="section-title">Market shopping,<br/>reimagined</h2>
          <p className="section-sub">From discovery to pickup in minutes — no delivery fees, no waiting.</p>
        </div>
        <div className="steps-grid">
          <div className="step-card reveal">
            <div className="step-num">01 / DISCOVER</div>
            <div className="step-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1b6b3a" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            </div>
            <div className="step-title">Find what you need</div>
            <div className="step-desc">Browse traders and products in your local market. Search by name, category, or price. See who's open right now.</div>
          </div>
          <div className="step-card reveal" style={{transitionDelay:'0.1s'}}>
            <div className="step-num">02 / COMPARE</div>
            <div className="step-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1b6b3a" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
            </div>
            <div className="step-title">Compare prices instantly</div>
            <div className="step-desc">See prices across multiple traders for the same product side by side. Smart badges tell you when a price is below market average.</div>
          </div>
          <div className="step-card reveal" style={{transitionDelay:'0.2s'}}>
            <div className="step-num">03 / RESERVE</div>
            <div className="step-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1b6b3a" strokeWidth="2" strokeLinecap="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
            </div>
            <div className="step-title">Reserve your items</div>
            <div className="step-desc">Tap to reserve and pay via M-Pesa in seconds. Your item is held for you for 24 hours — no haggling, no queue.</div>
          </div>
          <div className="step-card reveal" style={{transitionDelay:'0.3s'}}>
            <div className="step-num">04 / COLLECT</div>
            <div className="step-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1b6b3a" strokeWidth="2" strokeLinecap="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
            </div>
            <div className="step-title">Pick up at your convenience</div>
            <div className="step-desc">Show your unique pickup code at the stall. Grab your items and go — paid, confirmed, and ready for you.</div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="features-section" id="features">
        <div className="features-inner">
          <div className="reveal">
            <div className="features-label">Built for real markets</div>
            <h2 className="features-title">Everything a market needs,<br/>in one platform</h2>
            <p className="features-sub">Designed specifically for informal urban markets in Kenya — not adapted from an e-commerce template.</p>
          </div>
          <div className="features-grid">
            <div className="feature-card reveal">
              <div className="feature-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#34c75e" strokeWidth="2" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              </div>
              <div className="feature-title">Live stall map</div>
              <div className="feature-desc">Interactive floor plan of the market building. See which stalls are open, occupied, or available — updated every 60 seconds.</div>
              <span className="feature-tag">For everyone</span>
            </div>
            <div className="feature-card reveal" style={{transitionDelay:'0.1s'}}>
              <div className="feature-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#34c75e" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
              </div>
              <div className="feature-title">M-Pesa payments</div>
              <div className="feature-desc">STK push directly to your phone. Pay for reservations and market fees without cash. Instant confirmation, no data entry.</div>
              <span className="feature-tag amber">Seamless</span>
            </div>
            <div className="feature-card reveal" style={{transitionDelay:'0.2s'}}>
              <div className="feature-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#34c75e" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
              </div>
              <div className="feature-title">Price comparison</div>
              <div className="feature-desc">Smart badges show when a price is a great deal or above the market average. Compare across all traders instantly.</div>
              <span className="feature-tag">Members only</span>
            </div>
            <div className="feature-card reveal" style={{transitionDelay:'0.3s'}}>
              <div className="feature-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#34c75e" strokeWidth="2" strokeLinecap="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>
              </div>
              <div className="feature-title">Stock alerts</div>
              <div className="feature-desc">Watchlist your favourite products. Get notified the moment they're back in stock. Never miss Mama Wanjiru's tomatoes again.</div>
              <span className="feature-tag">Members only</span>
            </div>
            <div className="feature-card reveal" style={{transitionDelay:'0.4s'}}>
              <div className="feature-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#34c75e" strokeWidth="2" strokeLinecap="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
              </div>
              <div className="feature-title">Works offline</div>
              <div className="feature-desc">Slow connection? The app caches trader profiles and your reservations locally. Pickup codes always accessible, even without data.</div>
              <span className="feature-tag">PWA</span>
            </div>
            <div className="feature-card reveal" style={{transitionDelay:'0.5s'}}>
              <div className="feature-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#34c75e" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              </div>
              <div className="feature-title">County dashboard</div>
              <div className="feature-desc">Market administrators get real-time occupancy, fee collection tracking, complaint resolution, and trader verification tools.</div>
              <span className="feature-tag amber">Admin</span>
            </div>
          </div>
        </div>
      </section>

      {/* ROLES */}
      <section className="roles-section" id="roles">
        <div className="reveal">
          <div className="section-label">Who is it for?</div>
          <h2 className="section-title">Built for everyone<br/>in the market</h2>
          <p className="section-sub">Three distinct experiences, one unified platform connecting the whole market ecosystem.</p>
        </div>
        <div className="roles-grid">
          <div className="role-card resident reveal">
            <div className="role-icon">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#166534" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </div>
            <div className="role-title">Residents</div>
            <div className="role-desc">Discover local traders, compare prices, and reserve your groceries before heading to the market.</div>
            <div className="role-perks">
              <div className="role-perk"><div className="perk-check"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#166534" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg></div> Browse all traders for free</div>
              <div className="role-perk"><div className="perk-check"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#166534" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg></div> Reserve & pay via M-Pesa</div>
              <div className="role-perk"><div className="perk-check"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#166534" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg></div> Compare prices across stalls</div>
              <div className="role-perk"><div className="perk-check"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#166534" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg></div> Watchlist & stock alerts</div>
            </div>
            <Link href="/register?role=resident" className="role-cta">
              Start shopping
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </Link>
          </div>

          <div className="role-card trader reveal" style={{transitionDelay:'0.15s'}}>
            <div className="role-icon">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#92400e" strokeWidth="2" strokeLinecap="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
            </div>
            <div className="role-title">Traders</div>
            <div className="role-desc">Put your stall on the digital map. Reach more customers, manage your products, and accept M-Pesa orders.</div>
            <div className="role-perks">
              <div className="role-perk"><div className="perk-check"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#92400e" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg></div> Digital storefront & profile</div>
              <div className="role-perk"><div className="perk-check"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#92400e" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg></div> Order management dashboard</div>
              <div className="role-perk"><div className="perk-check"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#92400e" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg></div> Sales analytics & insights</div>
              <div className="role-perk"><div className="perk-check"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#92400e" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg></div> Pay market fees via M-Pesa</div>
            </div>
            <Link href="/register?role=trader" className="role-cta">
              Register your stall
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </Link>
          </div>

          <div className="role-card admin reveal" style={{transitionDelay:'0.3s'}}>
            <div className="role-icon">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#1e40af" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
            </div>
            <div className="role-title">County Admins</div>
            <div className="role-desc">Manage stall allocations, track market fee collections, and get data-driven insights to plan infrastructure.</div>
            <div className="role-perks">
              <div className="role-perk"><div className="perk-check"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg></div> Stall allocation workflow</div>
              <div className="role-perk"><div className="perk-check"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg></div> Market levy collection</div>
              <div className="role-perk"><div className="perk-check"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg></div> Complaint resolution</div>
              <div className="role-perk"><div className="perk-check"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg></div> Exportable PDF reports</div>
            </div>
            <Link href="/login" className="role-cta">
              Admin login
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA BANNER */}
      <section className="cta-section">
        <div className="cta-inner reveal">
          <h2 className="cta-title">Ready to join your market?</h2>
          <p className="cta-sub">It's free to browse. Create an account to unlock reservations, price comparisons, and a whole lot more.</p>
          <div className="cta-actions">
            <Link href="/register" className="cta-btn-white">Create free account</Link>
            <a href="#market-preview" onClick={(e) => handleScrollTo(e, '#market-preview')} className="cta-btn-outline">Browse first</a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="footer-inner">
          <div className="footer-top">
            <div className="footer-brand">
              <div className="footer-logo">
                <div className="footer-logo-box">
                  <svg width="18" height="18" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 34 Q12 22 22 22 L42 22 Q52 22 52 34 L52 38 L12 38 Z" fill="rgba(255,255,255,0.9)"/>
                    <path d="M12 38 Q16.5 44 21 38 Q25.5 44 30 38 Q34.5 44 39 38 Q43.5 44 48 38 L52 38 L12 38 Z" fill="rgba(255,255,255,0.6)"/>
                    <rect x="16" y="38" width="32" height="14" rx="2" fill="rgba(255,255,255,0.1)"/>
                    <rect x="13" y="33" width="4" height="20" rx="2" fill="rgba(255,255,255,0.5)"/>
                    <rect x="47" y="33" width="4" height="20" rx="2" fill="rgba(255,255,255,0.5)"/>
                    <circle cx="32" cy="14" r="3" fill="#F59E0B"/>
                  </svg>
                </div>
                <span className="footer-wordmark">Soko Mtaa</span>
              </div>
              <p className="footer-desc">Connecting traders, residents, and county administrators in Kenya's urban markets. Your neighbourhood market, digitized.</p>
            </div>
            <div className="footer-col">
              <h4>Platform</h4>
              <div className="footer-links">
                <Link href="/register" className="footer-link">Create account</Link>
                <Link href="/login" className="footer-link">Sign in</Link>
                <a href="#how-it-works" onClick={(e) => handleScrollTo(e, '#how-it-works')} className="footer-link">How it works</a>
                <a href="#features" onClick={(e) => handleScrollTo(e, '#features')} className="footer-link">Features</a>
              </div>
            </div>
            <div className="footer-col">
              <h4>For traders</h4>
              <div className="footer-links">
                <Link href="/register?role=trader" className="footer-link">Register stall</Link>
                <a href="#roles" onClick={(e) => handleScrollTo(e, '#roles')} className="footer-link">Trader features</a>
                <Link href="/login" className="footer-link">Trader login</Link>
              </div>
            </div>
            <div className="footer-col">
              <h4>Markets</h4>
              <div className="footer-links">
                <Link href="#" className="footer-link">Kolenyo Market</Link>
                <Link href="#" className="footer-link">Kombewa Market</Link>
                <Link href="#" className="footer-link">Akala Market</Link>
                <Link href="#" className="footer-link">Holo Market</Link>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <span className="footer-copy">© 2026 Soko Mtaa. Built for Kenya.</span>
            <div className="footer-badges">
              <span className="footer-badge">M-Pesa enabled</span>
              <span className="footer-badge">PWA ready</span>
              <span className="footer-badge">Offline support</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
