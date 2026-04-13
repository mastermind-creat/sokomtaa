# STYLING.md — Soko Mtaa Design Language & Visual System

> This file governs every visual and motion decision across the Soko Mtaa platform.
> Any AI agent or developer building UI must read this file completely before writing
> a single line of CSS or JSX. Reference this alongside AGENTS.md at all times.
> When in doubt: choose the bolder option, not the safer one.

---

## DESIGN PHILOSOPHY

Soko Mtaa sits at the intersection of **vibrant East African market culture** and
**modern mobile-first technology**. The aesthetic is:

- **Grounded** — earthy, warm, rooted in real market life. Not sterile. Not corporate.
- **Energetic** — markets are alive with movement, colour, and sound. The UI reflects this.
- **Trustworthy** — traders handle real money. The interface must feel stable and credible.
- **Cinematic** — transitions should feel like a good film cut, not a page reload.
- **Accessible** — beautiful AND functional on a KES 5,000 Android phone in bright sunlight.

The one thing a user must feel: **"This was made for me."**

---

## 1. COLOR SYSTEM

### Primary Palette

```css
:root {
  /* ── GREENS (Primary Brand) ── */
  --green-950: #052E16;   /* Deepest forest — headers, heavy text on light */
  --green-900: #0A3D1F;   /* Deep forest green — sidebar, footers */
  --green-800: #0F5C2E;   /* Rich canopy — primary buttons hover */
  --green-700: #166534;   /* Standard forest — nav active states */
  --green-600: #1B8040;   /* PRIMARY — main brand color, CTAs */
  --green-500: #22A34A;   /* Bright leaf — secondary buttons, badges */
  --green-400: #34C75E;   /* Fresh mint — success states, checkmarks */
  --green-300: #6EE08A;   /* Light mint — highlights, progress bars */
  --green-200: #A7F3C0;   /* Pale mint — hover backgrounds, tints */
  --green-100: #DCFCE7;   /* Whisper mint — alert backgrounds */
  --green-50:  #F0FDF4;   /* Near white mint — page backgrounds (light mode) */

  /* ── AMBER (Accent — M-Pesa warmth, call-to-action energy) ── */
  --amber-900: #78350F;
  --amber-700: #B45309;
  --amber-600: #D97706;
  --amber-500: #F59E0B;   /* PRIMARY ACCENT — pay buttons, badges, stars */
  --amber-400: #FBBF24;   /* Warm gold — hover on accent */
  --amber-300: #FCD34D;   /* Light gold — decorative highlights */
  --amber-100: #FEF3C7;   /* Amber tint backgrounds */
  --amber-50:  #FFFBEB;

  /* ── EARTH TONES (Supporting — warmth, trust, organic feel) ── */
  --earth-900: #1C1208;   /* Richest soil */
  --earth-700: #44301A;   /* Dark wood */
  --earth-500: #78502E;   /* Mid wood — borders on warm surfaces */
  --earth-300: #C4956A;   /* Warm sand */
  --earth-100: #F5EBD8;   /* Cream — warm card backgrounds */
  --earth-50:  #FAF5EC;   /* Parchment — alternate page background */

  /* ── NEUTRALS ── */
  --neutral-950: #0A0A0A;
  --neutral-900: #171717;
  --neutral-800: #262626;
  --neutral-700: #404040;
  --neutral-600: #525252;
  --neutral-500: #737373;
  --neutral-400: #A3A3A3;
  --neutral-300: #D4D4D4;
  --neutral-200: #E5E5E5;
  --neutral-100: #F5F5F5;
  --neutral-50:  #FAFAFA;
  --white:       #FFFFFF;

  /* ── SEMANTIC COLORS ── */
  --color-success:      var(--green-500);
  --color-success-bg:   var(--green-100);
  --color-warning:      var(--amber-500);
  --color-warning-bg:   var(--amber-100);
  --color-error:        #EF4444;
  --color-error-bg:     #FEF2F2;
  --color-error-dark:   #DC2626;
  --color-info:         #3B82F6;
  --color-info-bg:      #EFF6FF;

  /* ── SURFACE COLORS (Light Mode) ── */
  --surface-base:       #FAFAF7;   /* Warm off-white — never pure white */
  --surface-card:       #FFFFFF;
  --surface-card-warm:  var(--earth-50);
  --surface-overlay:    rgba(5, 46, 22, 0.6);  /* Green-tinted overlay */
  --surface-glass:      rgba(255, 255, 255, 0.85);

  /* ── TEXT COLORS ── */
  --text-primary:       var(--neutral-900);
  --text-secondary:     var(--neutral-600);
  --text-muted:         var(--neutral-400);
  --text-inverse:       var(--white);
  --text-brand:         var(--green-700);
  --text-accent:        var(--amber-600);

  /* ── BORDER COLORS ── */
  --border-default:     var(--neutral-200);
  --border-strong:      var(--neutral-300);
  --border-brand:       var(--green-300);
  --border-accent:      var(--amber-300);
}
```

### Dark Mode Palette

```css
@media (prefers-color-scheme: dark) {
  :root {
    --surface-base:       #0D1510;   /* Very dark green-tinted black */
    --surface-card:       #121C14;   /* Dark forest card */
    --surface-card-warm:  #1A1208;
    --surface-glass:      rgba(18, 28, 20, 0.9);
    --surface-overlay:    rgba(0, 0, 0, 0.75);

    --text-primary:       #F0FDF4;   /* Mint white */
    --text-secondary:     #A7F3C0;   /* Soft mint */
    --text-muted:         var(--green-700);
    --text-brand:         var(--green-400);
    --text-accent:        var(--amber-400);

    --border-default:     rgba(34, 163, 74, 0.15);
    --border-strong:      rgba(34, 163, 74, 0.25);
    --border-brand:       var(--green-800);
  }
}
```

### Tailwind CSS Configuration

Add to `tailwind.config.ts`:
```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  darkMode: 'media',
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#F0FDF4',
          100: '#DCFCE7',
          200: '#A7F3C0',
          300: '#6EE08A',
          400: '#34C75E',
          500: '#22A34A',
          600: '#1B8040',   // PRIMARY
          700: '#166534',
          800: '#0F5C2E',
          900: '#0A3D1F',
          950: '#052E16',
        },
        accent: {
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F59E0B',   // PRIMARY ACCENT
          600: '#D97706',
          700: '#B45309',
        },
        earth: {
          50:  '#FAF5EC',
          100: '#F5EBD8',
          300: '#C4956A',
          500: '#78502E',
          700: '#44301A',
          900: '#1C1208',
        },
      },
      fontFamily: {
        display: ['Plus Jakarta Sans', 'sans-serif'],
        body:    ['DM Sans', 'sans-serif'],
        mono:    ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        'brand-sm':  '0 2px 8px rgba(27, 128, 64, 0.15)',
        'brand-md':  '0 4px 20px rgba(27, 128, 64, 0.2)',
        'brand-lg':  '0 8px 40px rgba(27, 128, 64, 0.25)',
        'brand-glow':'0 0 30px rgba(34, 163, 74, 0.4)',
        'accent-glow':'0 0 20px rgba(245, 158, 11, 0.35)',
        'card':      '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.06)',
        'card-hover':'0 4px 12px rgba(0,0,0,0.08), 0 12px 40px rgba(0,0,0,0.1)',
        'float':     '0 20px 60px rgba(0,0,0,0.15)',
        'inner-brand':'inset 0 1px 0 rgba(34, 163, 74, 0.2)',
      },
      backgroundImage: {
        'gradient-brand':   'linear-gradient(135deg, #0A3D1F 0%, #1B8040 50%, #22A34A 100%)',
        'gradient-hero':    'linear-gradient(160deg, #052E16 0%, #0F5C2E 40%, #166534 70%, #1B8040 100%)',
        'gradient-card':    'linear-gradient(145deg, #FFFFFF 0%, #F0FDF4 100%)',
        'gradient-amber':   'linear-gradient(135deg, #B45309 0%, #F59E0B 100%)',
        'gradient-earth':   'linear-gradient(135deg, #1C1208 0%, #78502E 100%)',
        'gradient-surface': 'linear-gradient(180deg, #FAFAF7 0%, #F0FDF4 100%)',
        'noise':            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E\")",
      },
      animation: {
        'fade-up':        'fadeUp 0.5s ease-out forwards',
        'fade-in':        'fadeIn 0.4s ease-out forwards',
        'slide-up':       'slideUp 0.4s cubic-bezier(0.32, 0.72, 0, 1) forwards',
        'slide-down':     'slideDown 0.3s cubic-bezier(0.32, 0.72, 0, 1) forwards',
        'scale-in':       'scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'pulse-brand':    'pulseBrand 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer':        'shimmer 1.8s infinite linear',
        'float':          'float 3s ease-in-out infinite',
        'glow-pulse':     'glowPulse 2s ease-in-out infinite',
        'bounce-soft':    'bounceSoft 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'spin-slow':      'spin 3s linear infinite',
        'marquee':        'marquee 20s linear infinite',
        'number-count':   'numberCount 1s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
      keyframes: {
        fadeUp: {
          '0%':   { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%':   { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        slideDown: {
          '0%':   { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%':   { opacity: '0', transform: 'scale(0.85)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        pulseBrand: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(27, 128, 64, 0.4)' },
          '50%':      { boxShadow: '0 0 0 12px rgba(27, 128, 64, 0)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-8px)' },
        },
        glowPulse: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.6' },
        },
        bounceSoft: {
          '0%':   { transform: 'scale(1)' },
          '40%':  { transform: 'scale(0.95)' },
          '70%':  { transform: 'scale(1.05)' },
          '100%': { transform: 'scale(1)' },
        },
        marquee: {
          '0%':   { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        numberCount: {
          '0%':   { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      transitionTimingFunction: {
        'spring':        'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'smooth':        'cubic-bezier(0.32, 0.72, 0, 1)',
        'cinematic':     'cubic-bezier(0.16, 1, 0.3, 1)',
        'bounce-out':    'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
    },
  },
  plugins: [],
};

export default config;
```

---

## 2. TYPOGRAPHY SYSTEM

### Font Loading (`app/layout.tsx`)

```typescript
import { Plus_Jakarta_Sans, DM_Sans, JetBrains_Mono } from 'next/font/google';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['300', '400', '500', '600'],
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '500', '700'],
  display: 'swap',
});
```

### Typography Scale

```css
/* globals.css */
:root {
  /* Font families */
  --font-display: 'Plus Jakarta Sans', sans-serif;
  --font-body:    'DM Sans', sans-serif;
  --font-mono:    'JetBrains Mono', monospace;

  /* Type scale — fluid & mobile-first */
  --text-xs:   clamp(0.70rem, 1.8vw, 0.75rem);   /* 11-12px */
  --text-sm:   clamp(0.813rem, 2vw, 0.875rem);    /* 13-14px */
  --text-base: clamp(0.938rem, 2.5vw, 1rem);      /* 15-16px — MINIMUM for body */
  --text-lg:   clamp(1rem, 3vw, 1.125rem);         /* 16-18px */
  --text-xl:   clamp(1.125rem, 3.5vw, 1.25rem);   /* 18-20px */
  --text-2xl:  clamp(1.25rem, 4vw, 1.5rem);        /* 20-24px */
  --text-3xl:  clamp(1.5rem, 5vw, 1.875rem);       /* 24-30px */
  --text-4xl:  clamp(1.875rem, 6vw, 2.25rem);      /* 30-36px */
  --text-5xl:  clamp(2.25rem, 7vw, 3rem);          /* 36-48px */
  --text-6xl:  clamp(2.5rem, 9vw, 4rem);           /* 40-64px — hero only */

  /* Line heights */
  --leading-tight:  1.2;
  --leading-snug:   1.35;
  --leading-normal: 1.5;
  --leading-relaxed:1.65;
  --leading-loose:  1.8;

  /* Letter spacing */
  --tracking-tight:  -0.03em;
  --tracking-snug:   -0.015em;
  --tracking-normal:  0em;
  --tracking-wide:    0.04em;
  --tracking-wider:   0.08em;
  --tracking-widest:  0.12em;
}
```

### Typography Usage Rules

```
DISPLAY (Plus Jakarta Sans):
  - Page titles, hero text, section headings (h1-h3)
  - Weight: 700-800 for h1/h2, 600 for h3
  - Letter-spacing: -0.02em to -0.03em (tight, modern)
  - Always: text-balance (CSS) for wrapping

BODY (DM Sans):
  - All paragraph text, labels, descriptions
  - Weight: 400 for body, 500 for emphasis, 600 for strong
  - Line-height: 1.6 minimum for readability on small screens
  - Never below 16px on mobile (15px minimum)

MONO (JetBrains Mono):
  - Prices (KES 1,200)
  - Pickup codes (SM-K7B2QX91)
  - Stall numbers (A1, B7)
  - Percentages in analytics
  - Always: tabular-nums for numbers that animate

SPECIAL RULES:
  - Prices always use --font-mono with font-variant-numeric: tabular-nums
  - KES currency prefix is slightly smaller (0.85em) than the number
  - Swahili text may need slightly more line-height (+0.1) due to longer words
  - Arabic numerals only — never spell out numbers in UI
```

---

## 3. SPACING & LAYOUT SYSTEM

### Spacing Scale

```css
:root {
  --space-1:  4px;
  --space-2:  8px;
  --space-3:  12px;
  --space-4:  16px;
  --space-5:  20px;
  --space-6:  24px;
  --space-8:  32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;
  --space-20: 80px;
  --space-24: 96px;
}
```

### Layout Grid

```css
/* Page container */
.page-container {
  width: 100%;
  max-width: 480px;        /* Mobile-first max — never wider on phone */
  margin: 0 auto;
  padding: 0 var(--space-4);
}

/* Desktop widens gracefully */
@media (min-width: 768px) {
  .page-container { max-width: 720px; padding: 0 var(--space-8); }
}
@media (min-width: 1024px) {
  .page-container { max-width: 1100px; }
}

/* Safe area for phones with notches */
.safe-top    { padding-top: env(safe-area-inset-top); }
.safe-bottom { padding-bottom: max(env(safe-area-inset-bottom), 16px); }
```

### Border Radius System

```css
:root {
  --radius-sm:   6px;    /* Badges, chips, small elements */
  --radius-md:   10px;   /* Buttons, inputs */
  --radius-lg:   14px;   /* Cards, small sheets */
  --radius-xl:   20px;   /* Feature cards, large cards */
  --radius-2xl:  28px;   /* Bottom sheets, modals */
  --radius-3xl:  40px;   /* Hero sections, large containers */
  --radius-full: 9999px; /* Pills, avatars, circular buttons */
}
```

---

## 4. COMPONENT STYLING GUIDE

### 4A. Buttons

```css
/* Base button — all buttons start here */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  font-family: var(--font-body);
  font-weight: 600;
  font-size: var(--text-base);
  line-height: 1;
  border-radius: var(--radius-md);
  border: none;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.32, 0.72, 0, 1);
  position: relative;
  overflow: hidden;
  -webkit-tap-highlight-color: transparent;
  user-select: none;

  /* Minimum tap target */
  min-height: 48px;
  min-width: 48px;
  padding: 0 var(--space-6);
}

/* Press effect — applies to ALL buttons */
.btn:active {
  transform: scale(0.96);
}

/* Ripple effect on tap */
.btn::after {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle, rgba(255,255,255,0.25) 0%, transparent 70%);
  opacity: 0;
  transform: scale(0);
  transition: opacity 0.3s, transform 0.5s;
}
.btn:active::after {
  opacity: 1;
  transform: scale(2.5);
  transition: 0s;
}

/* ── PRIMARY BUTTON — Main CTAs ── */
.btn-primary {
  background: linear-gradient(135deg, var(--green-700) 0%, var(--green-600) 50%, var(--green-500) 100%);
  color: var(--white);
  box-shadow: 0 4px 15px rgba(27, 128, 64, 0.35), inset 0 1px 0 rgba(255,255,255,0.15);
  text-shadow: 0 1px 2px rgba(0,0,0,0.2);
}
.btn-primary:hover {
  background: linear-gradient(135deg, var(--green-800) 0%, var(--green-700) 50%, var(--green-600) 100%);
  box-shadow: 0 6px 25px rgba(27, 128, 64, 0.45), inset 0 1px 0 rgba(255,255,255,0.2);
  transform: translateY(-1px);
}
.btn-primary:active {
  transform: translateY(0) scale(0.97);
  box-shadow: 0 2px 8px rgba(27, 128, 64, 0.3);
}

/* ── ACCENT BUTTON — Pay / M-Pesa actions ── */
.btn-accent {
  background: linear-gradient(135deg, var(--amber-700) 0%, var(--amber-500) 100%);
  color: var(--white);
  box-shadow: 0 4px 15px rgba(245, 158, 11, 0.35), inset 0 1px 0 rgba(255,255,255,0.2);
  font-weight: 700;
  letter-spacing: 0.01em;
}
.btn-accent:hover {
  box-shadow: 0 6px 25px rgba(245, 158, 11, 0.45);
  transform: translateY(-1px);
}

/* ── SECONDARY BUTTON — Outlined ── */
.btn-secondary {
  background: transparent;
  color: var(--green-700);
  border: 1.5px solid var(--green-400);
  box-shadow: inset 0 0 0 0 var(--green-100);
}
.btn-secondary:hover {
  background: var(--green-50);
  border-color: var(--green-600);
  box-shadow: inset 0 0 0 3px var(--green-100);
}

/* ── GHOST BUTTON — Subtle actions ── */
.btn-ghost {
  background: transparent;
  color: var(--text-secondary);
}
.btn-ghost:hover {
  background: var(--neutral-100);
  color: var(--text-primary);
}

/* ── DANGER BUTTON — Destructive actions ── */
.btn-danger {
  background: linear-gradient(135deg, #B91C1C, #EF4444);
  color: var(--white);
  box-shadow: 0 4px 15px rgba(239, 68, 68, 0.3);
}

/* ── SIZE VARIANTS ── */
.btn-sm  { min-height: 36px; padding: 0 var(--space-4); font-size: var(--text-sm); border-radius: var(--radius-sm); }
.btn-lg  { min-height: 56px; padding: 0 var(--space-8); font-size: var(--text-lg); border-radius: var(--radius-lg); }
.btn-xl  { min-height: 64px; padding: 0 var(--space-10); font-size: var(--text-xl); border-radius: var(--radius-lg); font-weight: 700; }
.btn-full { width: 100%; }

/* ── LOADING STATE ── */
.btn-loading {
  color: transparent;
  pointer-events: none;
}
.btn-loading::before {
  content: '';
  position: absolute;
  width: 20px; height: 20px;
  border: 2.5px solid rgba(255,255,255,0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
```

### 4B. Cards

```css
/* ── BASE CARD ── */
.card {
  background: var(--surface-card);
  border-radius: var(--radius-xl);
  border: 1px solid var(--border-default);
  box-shadow: var(--shadow-card);
  overflow: hidden;
  transition: transform 0.25s cubic-bezier(0.32, 0.72, 0, 1),
              box-shadow 0.25s cubic-bezier(0.32, 0.72, 0, 1);
  -webkit-tap-highlight-color: transparent;
}
.card:active {
  transform: scale(0.985);
}

/* ── TRADER CARD — Main discovery cards ── */
.card-trader {
  background: var(--surface-card);
  border-radius: var(--radius-xl);
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05), 0 4px 20px rgba(0,0,0,0.06);
  border: 1px solid var(--border-default);
  transition: all 0.3s cubic-bezier(0.32, 0.72, 0, 1);
  position: relative;
}
.card-trader::before {
  /* Subtle left border accent */
  content: '';
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 3px;
  background: linear-gradient(180deg, var(--green-500), var(--green-300));
  opacity: 0;
  transition: opacity 0.2s;
  border-radius: 0 0 0 var(--radius-xl);
}
.card-trader:hover::before,
.card-trader:active::before {
  opacity: 1;
}
.card-trader:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.08), 0 16px 48px rgba(27,128,64,0.12);
}

/* ── PRODUCT CARD ── */
.card-product {
  background: var(--surface-card);
  border-radius: var(--radius-lg);
  overflow: hidden;
  border: 1px solid var(--border-default);
  transition: all 0.25s var(--ease-smooth);
}
.card-product:hover {
  border-color: var(--green-300);
  box-shadow: 0 4px 20px rgba(27, 128, 64, 0.15);
}

/* ── FEATURED / HERO CARD — Gradient overlay ── */
.card-featured {
  background: linear-gradient(145deg, var(--green-900) 0%, var(--green-700) 100%);
  color: var(--white);
  border-radius: var(--radius-2xl);
  border: none;
  box-shadow: 0 8px 40px rgba(10, 61, 31, 0.4);
  position: relative;
  overflow: hidden;
}
.card-featured::after {
  /* Organic texture overlay */
  content: '';
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Ccircle cx='30' cy='30' r='20'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
  pointer-events: none;
}

/* ── STAT CARD — Analytics numbers ── */
.card-stat {
  background: linear-gradient(145deg, #FFFFFF 0%, var(--green-50) 100%);
  border: 1px solid var(--green-100);
  border-radius: var(--radius-xl);
  padding: var(--space-6);
  position: relative;
  overflow: hidden;
}
.card-stat::before {
  content: '';
  position: absolute;
  top: -20px; right: -20px;
  width: 100px; height: 100px;
  background: radial-gradient(circle, var(--green-200) 0%, transparent 70%);
  opacity: 0.6;
}
```

### 4C. Input Fields

```css
/* ── BASE INPUT ── */
.input {
  width: 100%;
  min-height: 52px;
  padding: var(--space-4) var(--space-4);
  font-family: var(--font-body);
  font-size: var(--text-base);  /* 16px — prevents iOS zoom */
  font-weight: 400;
  color: var(--text-primary);
  background: var(--surface-card);
  border: 1.5px solid var(--border-default);
  border-radius: var(--radius-md);
  outline: none;
  transition: all 0.2s cubic-bezier(0.32, 0.72, 0, 1);
  -webkit-appearance: none;
  appearance: none;
}
.input::placeholder {
  color: var(--text-muted);
  font-weight: 400;
}
.input:focus {
  border-color: var(--green-500);
  box-shadow: 0 0 0 3px rgba(27, 128, 64, 0.12),
              0 1px 3px rgba(0,0,0,0.05);
  background: var(--white);
}
.input:focus::placeholder {
  opacity: 0.5;
  transform: translateX(4px);
  transition: all 0.2s;
}
.input.input-error {
  border-color: var(--color-error);
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

/* ── LABEL — Always above, never placeholder-only ── */
.input-label {
  display: block;
  font-family: var(--font-body);
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: var(--space-2);
  letter-spacing: 0.01em;
}

/* ── ERROR MESSAGE ── */
.input-error-msg {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  color: var(--color-error);
  font-size: var(--text-sm);
  font-weight: 500;
  margin-top: var(--space-2);
  animation: fadeUp 0.2s ease-out;
}

/* ── OTP INPUT BOXES ── */
.otp-input {
  width: 48px; height: 56px;
  text-align: center;
  font-family: var(--font-mono);
  font-size: var(--text-2xl);
  font-weight: 700;
  border: 2px solid var(--border-default);
  border-radius: var(--radius-md);
  outline: none;
  transition: all 0.2s var(--ease-spring);
  caret-color: var(--green-600);
}
.otp-input:focus {
  border-color: var(--green-500);
  box-shadow: 0 0 0 4px rgba(27, 128, 64, 0.15);
  transform: scale(1.08);
}
.otp-input.filled {
  border-color: var(--green-500);
  background: var(--green-50);
  color: var(--green-800);
}

/* ── SEARCH INPUT ── */
.input-search {
  padding-left: 48px; /* Room for icon */
  background-color: var(--neutral-100);
  border-color: transparent;
  border-radius: var(--radius-full);
  min-height: 48px;
}
.input-search:focus {
  background-color: var(--white);
  border-color: var(--green-400);
  box-shadow: 0 4px 20px rgba(27, 128, 64, 0.12);
}
```

### 4D. Navigation Components

```css
/* ── BOTTOM NAVIGATION BAR ── */
.bottom-nav {
  position: fixed;
  bottom: 0; left: 0; right: 0;
  z-index: 100;
  display: flex;
  align-items: stretch;
  background: var(--surface-glass);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border-top: 1px solid rgba(27, 128, 64, 0.1);
  box-shadow: 0 -4px 30px rgba(0, 0, 0, 0.08);
  padding-bottom: env(safe-area-inset-bottom);
  height: calc(64px + env(safe-area-inset-bottom));
}
.bottom-nav-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  padding: var(--space-2) var(--space-1);
  cursor: pointer;
  position: relative;
  transition: all 0.2s var(--ease-spring);
  -webkit-tap-highlight-color: transparent;
  color: var(--text-muted);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.bottom-nav-item.active {
  color: var(--green-600);
}
.bottom-nav-item.active::before {
  /* Top indicator pill */
  content: '';
  position: absolute;
  top: 0; left: 50%;
  transform: translateX(-50%);
  width: 32px; height: 3px;
  background: var(--green-600);
  border-radius: 0 0 var(--radius-full) var(--radius-full);
}
.bottom-nav-icon-wrap {
  width: 32px; height: 32px;
  display: flex; align-items: center; justify-content: center;
  border-radius: var(--radius-md);
  transition: all 0.2s var(--ease-spring);
}
.bottom-nav-item.active .bottom-nav-icon-wrap {
  background: var(--green-100);
  transform: scale(1.05);
}
.bottom-nav-item:active .bottom-nav-icon-wrap {
  transform: scale(0.9);
}

/* ── TOP APP BAR ── */
.top-bar {
  position: sticky;
  top: 0; z-index: 50;
  display: flex;
  align-items: center;
  height: 60px;
  padding: 0 var(--space-4);
  background: var(--surface-glass);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border-bottom: 1px solid var(--border-default);
  padding-top: env(safe-area-inset-top);
}
```

### 4E. Badges & Status Indicators

```css
/* ── BASE BADGE ── */
.badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 10px;
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  white-space: nowrap;
}

/* Status badges */
.badge-open    { background: var(--green-100); color: var(--green-700); }
.badge-closed  { background: var(--neutral-100); color: var(--neutral-600); }
.badge-verified{ background: var(--green-100); color: var(--green-800); border: 1px solid var(--green-300); }
.badge-pending { background: var(--amber-100); color: var(--amber-700); }
.badge-rejected{ background: var(--color-error-bg); color: var(--color-error-dark); }

/* Stock badges */
.badge-available   { background: var(--green-100); color: var(--green-700); }
.badge-low-stock   { background: var(--amber-100); color: var(--amber-700); }
.badge-out-of-stock{ background: var(--color-error-bg); color: var(--color-error); }

/* Price badges */
.badge-great-deal    { background: var(--green-100); color: var(--green-800); }
.badge-above-average { background: var(--amber-50); color: var(--amber-700); }

/* Trust badges */
.badge-trusted  { background: linear-gradient(135deg, var(--amber-100), var(--amber-50)); color: var(--amber-700); border: 1px solid var(--amber-300); }
.badge-popular  { background: linear-gradient(135deg, #FEE2E2, #FFF7ED); color: #DC2626; border: 1px solid #FECACA; }

/* ── LIVE OPEN INDICATOR ── */
.status-dot {
  width: 8px; height: 8px;
  border-radius: 50%;
  display: inline-block;
  flex-shrink: 0;
}
.status-dot.open {
  background: var(--green-500);
  box-shadow: 0 0 0 2px var(--green-200);
  animation: pulseBrand 2s infinite;
}
.status-dot.closed {
  background: var(--neutral-400);
  box-shadow: none;
}
```

### 4F. Bottom Sheet / Modal

```css
/* ── BOTTOM SHEET OVERLAY ── */
.sheet-overlay {
  position: fixed;
  inset: 0;
  z-index: 200;
  background: rgba(5, 46, 22, 0.5);  /* Green-tinted overlay */
  backdrop-filter: blur(4px);
  animation: fadeIn 0.2s ease-out;
}

/* ── BOTTOM SHEET PANEL ── */
.sheet-panel {
  position: fixed;
  bottom: 0; left: 0; right: 0;
  z-index: 201;
  background: var(--surface-card);
  border-radius: var(--radius-3xl) var(--radius-3xl) 0 0;
  padding: var(--space-6) var(--space-4);
  padding-bottom: max(var(--space-6), env(safe-area-inset-bottom));
  box-shadow: 0 -8px 60px rgba(0, 0, 0, 0.2);
  animation: slideUp 0.35s cubic-bezier(0.32, 0.72, 0, 1);
  max-height: 92vh;
  overflow-y: auto;
}

/* Handle indicator */
.sheet-handle {
  width: 40px; height: 4px;
  background: var(--neutral-300);
  border-radius: var(--radius-full);
  margin: 0 auto var(--space-6);
}

/* Dismissing animation */
.sheet-panel.dismissing {
  animation: slideDown 0.3s cubic-bezier(0.32, 0.72, 0, 1) forwards;
}
```

### 4G. Skeleton Loaders

```css
/* ── SKELETON BASE ── */
.skeleton {
  background: linear-gradient(
    90deg,
    var(--neutral-200) 0%,
    var(--neutral-100) 30%,
    var(--neutral-200) 60%,
    var(--neutral-200) 100%
  );
  background-size: 1000px 100%;
  animation: shimmer 1.8s infinite linear;
  border-radius: var(--radius-sm);
}

/* ── TRADER CARD SKELETON ── */
.skeleton-trader-card {
  border-radius: var(--radius-xl);
  overflow: hidden;
  border: 1px solid var(--border-default);
  padding: var(--space-4);
  display: flex;
  gap: var(--space-4);
}
.skeleton-avatar { width: 56px; height: 56px; border-radius: var(--radius-full); flex-shrink: 0; }
.skeleton-line-full { height: 14px; border-radius: var(--radius-sm); margin-bottom: 8px; }
.skeleton-line-half { height: 12px; width: 60%; border-radius: var(--radius-sm); }

/* ── PRODUCT CARD SKELETON ── */
.skeleton-product-card {
  border-radius: var(--radius-lg);
  overflow: hidden;
  border: 1px solid var(--border-default);
}
.skeleton-product-image { width: 100%; aspect-ratio: 1; }
.skeleton-product-body { padding: var(--space-3); }
```

---

## 5. ANIMATION & CINEMATIC EFFECTS SYSTEM

> Animations must feel purposeful — every motion has a reason.
> Never animate just for the sake of it. Each effect below has a specific trigger.

### 5A. Page Transition System

```typescript
// lib/pageTransitions.ts
export const pageVariants = {
  initial: { opacity: 0, y: 16, scale: 0.99 },
  animate: {
    opacity: 1, y: 0, scale: 1,
    transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] }
  },
  exit: {
    opacity: 0, y: -8, scale: 0.99,
    transition: { duration: 0.2, ease: [0.32, 0.72, 0, 1] }
  },
};

export const listVariants = {
  animate: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
};

export const itemVariants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1, y: 0,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] }
  },
};

export const scaleVariants = {
  initial: { opacity: 0, scale: 0.9 },
  animate: {
    opacity: 1, scale: 1,
    transition: { duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }
  },
};

// Slide from right (for drill-down navigation)
export const slideRightVariants = {
  initial: { opacity: 0, x: 40 },
  animate: {
    opacity: 1, x: 0,
    transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] }
  },
  exit: {
    opacity: 0, x: -20,
    transition: { duration: 0.2 }
  },
};
```

### 5B. Framer Motion Component Patterns

```typescript
// components/shared/AnimatedPage.tsx
import { motion } from 'framer-motion';
import { pageVariants } from '@/lib/pageTransitions';

export function AnimatedPage({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      {children}
    </motion.div>
  );
}

// components/shared/AnimatedList.tsx
export function AnimatedList({ children }: { children: React.ReactNode }) {
  return (
    <motion.ul variants={listVariants} initial="initial" animate="animate">
      {children}
    </motion.ul>
  );
}

export function AnimatedListItem({ children }: { children: React.ReactNode }) {
  return (
    <motion.li variants={itemVariants}>
      {children}
    </motion.li>
  );
}
```

### 5C. Micro-Interaction Patterns

```typescript
// ── BUTTON PRESS FEEDBACK ──
const tapAnimation = {
  whileTap: { scale: 0.96, transition: { duration: 0.1 } },
  whileHover: { scale: 1.02, transition: { duration: 0.15 } },
};

// ── CARD PRESS ──
const cardTap = {
  whileTap: { scale: 0.985, transition: { duration: 0.15 } },
};

// ── SUCCESS CHECKMARK ANIMATION ──
const checkVariants = {
  initial: { pathLength: 0, opacity: 0 },
  animate: {
    pathLength: 1, opacity: 1,
    transition: { delay: 0.2, duration: 0.4, ease: 'easeOut' }
  },
};

// ── COUNTER ANIMATION — for analytics numbers ──
// Use this for any number that should count up on mount
export function useCountUp(target: number, duration = 1000) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return count;
}

// ── NOTIFICATION BOUNCE ──
const notifBadgeVariants = {
  initial: { scale: 0 },
  animate: {
    scale: 1,
    transition: { type: 'spring', stiffness: 500, damping: 20 }
  },
};

// ── STAGGERED HERO REVEAL ──
export const heroStagger = {
  container: {
    animate: { transition: { staggerChildren: 0.1, delayChildren: 0.2 } }
  },
  item: {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }
  }
};
```

### 5D. Cinematic Scroll Effects

```typescript
// hooks/useScrollReveal.ts
import { useInView } from 'framer-motion';
import { useRef } from 'react';

export function useScrollReveal(threshold = 0.15) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: threshold });
  return { ref, isInView };
}

// Usage in component:
// const { ref, isInView } = useScrollReveal();
// <motion.div ref={ref} animate={isInView ? 'visible' : 'hidden'} variants={fadeUpVariants}>

// ── PARALLAX HERO EFFECT ──
export function useParallax(scrollY: MotionValue<number>, speed = 0.3) {
  return useTransform(scrollY, [0, 500], [0, 500 * speed]);
}

// ── HEADER SHRINK ON SCROLL ──
export function useShrinkingHeader() {
  const { scrollY } = useScroll();
  const headerHeight = useTransform(scrollY, [0, 80], [64, 52]);
  const headerShadow = useTransform(scrollY, [0, 80],
    ['0 0 0 0 rgba(0,0,0,0)', '0 2px 20px rgba(0,0,0,0.08)']
  );
  return { headerHeight, headerShadow };
}
```

### 5E. Special Effect Components

```typescript
// ── PARTICLE BURST ON PAYMENT SUCCESS ──
// Trigger confetti-like effect when payment is confirmed
export function PaymentSuccessEffect() {
  // Use canvas-confetti library: npm install canvas-confetti
  const fire = () => {
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#1B8040', '#22A34A', '#F59E0B', '#FBBF24', '#FFFFFF'],
      ticks: 200,
    });
  };
  useEffect(() => { fire(); }, []);
  return null;
}

// ── SHIMMER TEXT EFFECT — for "Popular Today" badge ──
// CSS only:
/*
.shimmer-text {
  background: linear-gradient(
    90deg,
    var(--green-700) 0%,
    var(--green-400) 40%,
    var(--amber-400) 60%,
    var(--green-700) 100%
  );
  background-size: 200% auto;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: shimmer 2.5s linear infinite;
}
*/

// ── MORPHING BLOB BACKGROUND — Hero sections ──
/*
.blob {
  position: absolute;
  border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%;
  animation: morph 8s ease-in-out infinite;
  background: radial-gradient(circle, var(--green-400), var(--green-700));
  opacity: 0.15;
  filter: blur(40px);
}
@keyframes morph {
  0%, 100% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; }
  25%       { border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%; }
  50%       { border-radius: 50% 60% 30% 60% / 40% 30% 60% 50%; }
  75%       { border-radius: 40% 30% 60% 50% / 70% 40% 60% 30%; }
}
*/

// ── RIPPLE ON TAP — touch feedback ──
export function useRipple() {
  const [ripples, setRipples] = useState<Array<{x: number; y: number; id: number}>>([]);
  const addRipple = (e: React.TouchEvent | React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const id = Date.now();
    setRipples(prev => [...prev, { x, y, id }]);
    setTimeout(() => setRipples(prev => prev.filter(r => r.id !== id)), 600);
  };
  return { ripples, addRipple };
}
```

---

## 6. GLOBAL CSS (`app/globals.css`)

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Sans:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500;700&display=swap');

/* ── BASE RESET & FOUNDATION ── */
*, *::before, *::after {
  box-sizing: border-box;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

html {
  scroll-behavior: smooth;
  text-size-adjust: 100%;
  -webkit-text-size-adjust: 100%;
  height: 100%;
  /* Prevent overscroll bounce on iOS */
  overscroll-behavior: none;
}

body {
  font-family: var(--font-body, 'DM Sans', sans-serif);
  font-size: var(--text-base);
  color: var(--text-primary, #171717);
  background-color: var(--surface-base, #FAFAF7);
  line-height: var(--leading-normal);
  min-height: 100%;
  /* Prevent layout shift from scrollbar */
  scrollbar-gutter: stable;
}

/* Remove tap highlight on all interactive elements */
a, button, [role="button"], input, select, textarea {
  -webkit-tap-highlight-color: transparent;
}

/* Smooth image rendering */
img {
  display: block;
  max-width: 100%;
  object-fit: cover;
}

/* Focus visible — only show on keyboard nav */
:focus-visible {
  outline: 2px solid var(--green-500);
  outline-offset: 2px;
  border-radius: var(--radius-sm);
}
:focus:not(:focus-visible) {
  outline: none;
}

/* Prevent text selection on UI elements */
.no-select { user-select: none; }

/* ── PRICE DISPLAY ── */
.price {
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.02em;
}
.price-currency {
  font-size: 0.78em;
  font-weight: 500;
  opacity: 0.75;
  margin-right: 1px;
  vertical-align: 0.1em;
}

/* ── PAGE WRAPPER — accounts for bottom nav ── */
.page-with-bottom-nav {
  padding-bottom: calc(72px + env(safe-area-inset-bottom));
}

/* ── SECTION DIVIDER ── */
.section-divider {
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--border-default), transparent);
  margin: var(--space-8) 0;
}

/* ── STICKY BOTTOM ACTION BAR ── */
.sticky-action-bar {
  position: fixed;
  bottom: calc(64px + env(safe-area-inset-bottom));
  left: 0; right: 0;
  padding: var(--space-3) var(--space-4);
  background: var(--surface-glass);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-top: 1px solid var(--border-default);
  z-index: 90;
}

/* ── OFFLINE BANNER ── */
.offline-banner {
  position: fixed;
  top: 0; left: 0; right: 0;
  z-index: 500;
  background: linear-gradient(135deg, var(--amber-700), var(--amber-600));
  color: white;
  text-align: center;
  padding: var(--space-2) var(--space-4);
  font-size: var(--text-sm);
  font-weight: 600;
  padding-top: max(var(--space-2), env(safe-area-inset-top));
  animation: slideDown 0.3s cubic-bezier(0.32, 0.72, 0, 1);
}

/* ── HERO GRADIENT BACKGROUNDS ── */
.bg-hero-green {
  background:
    radial-gradient(ellipse at top left, rgba(34,163,74,0.3) 0%, transparent 50%),
    radial-gradient(ellipse at bottom right, rgba(245,158,11,0.15) 0%, transparent 50%),
    linear-gradient(160deg, #052E16 0%, #0F5C2E 50%, #1B8040 100%);
}

.bg-market-pattern {
  background-color: var(--surface-base);
  background-image:
    radial-gradient(circle at 25% 25%, rgba(27,128,64,0.06) 0%, transparent 50%),
    radial-gradient(circle at 75% 75%, rgba(245,158,11,0.04) 0%, transparent 50%),
    url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%231B8040' fill-opacity='0.025'%3E%3Cpath d='M20 20.5V18H0v5h20v-.5zm0-8.5V10H0v5h20V12zm0-8.5V2H0v5h20V3.5z'/%3E%3C/g%3E%3C/svg%3E");
}

/* ── GLASS MORPHISM PANELS ── */
.glass-panel {
  background: var(--surface-glass);
  backdrop-filter: blur(20px) saturate(150%);
  -webkit-backdrop-filter: blur(20px) saturate(150%);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
}

.glass-panel-green {
  background: rgba(27, 128, 64, 0.08);
  backdrop-filter: blur(20px) saturate(150%);
  -webkit-backdrop-filter: blur(20px) saturate(150%);
  border: 1px solid rgba(27, 128, 64, 0.15);
}

/* ── CUSTOM SCROLLBAR ── */
::-webkit-scrollbar { width: 4px; height: 4px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb {
  background: var(--green-300);
  border-radius: var(--radius-full);
}
::-webkit-scrollbar-thumb:hover { background: var(--green-500); }

/* ── REDUCE MOTION ACCESSIBILITY ── */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}

/* ── HIGH CONTRAST MODE — outdoor/sunlight readability ── */
@media (prefers-contrast: high) {
  :root {
    --border-default: var(--neutral-400);
    --text-secondary: var(--neutral-800);
    --text-muted: var(--neutral-700);
  }
  .btn-primary { background: var(--green-900); }
  .badge { border-width: 2px; }
}
```

---

## 7. MOBILE RESPONSIVENESS RULES

### Breakpoints

```typescript
// lib/breakpoints.ts
export const breakpoints = {
  xs:  '360px',   // Minimum supported — Tecno Spark, Samsung A series entry
  sm:  '480px',   // Larger phones — iPhone Plus, Samsung A54
  md:  '768px',   /* Tablets */
  lg: '1024px',   /* Desktop */
  xl: '1280px',   /* Wide desktop */
};
```

### Mobile-Specific Patterns

```css
/* ── HORIZONTAL SCROLL ROW — categories, filters ── */
.scroll-row {
  display: flex;
  gap: var(--space-3);
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  padding-bottom: var(--space-2);
  /* Negative margins to allow full-bleed scroll */
  margin-left: calc(-1 * var(--space-4));
  margin-right: calc(-1 * var(--space-4));
  padding-left: var(--space-4);
  padding-right: var(--space-4);
}
.scroll-row::-webkit-scrollbar { display: none; }
.scroll-row > * { scroll-snap-align: start; flex-shrink: 0; }

/* ── GRID LAYOUTS — responsive without media queries ── */
.grid-products {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(160px, 45vw), 1fr));
  gap: var(--space-3);
}
.grid-trader-cards {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-3);
}
@media (min-width: 640px) {
  .grid-trader-cards { grid-template-columns: repeat(2, 1fr); }
}

/* ── TOUCH SCROLL IMPROVEMENTS ── */
.touch-scroll {
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
}

/* ── SAFE AREA UTILITIES ── */
.pb-safe   { padding-bottom: env(safe-area-inset-bottom); }
.pt-safe   { padding-top: env(safe-area-inset-top); }
.mb-nav    { margin-bottom: calc(72px + env(safe-area-inset-bottom)); }

/* ── IMAGE ASPECT RATIOS — prevent layout shift ── */
.aspect-product    { aspect-ratio: 1 / 1; }
.aspect-banner     { aspect-ratio: 16 / 7; }
.aspect-avatar     { aspect-ratio: 1 / 1; }
.aspect-market-map { aspect-ratio: 4 / 3; }
```

---

## 8. ICON SYSTEM

Use **Lucide React** exclusively. Size standards:

```typescript
// Icon size constants — use these, never arbitrary sizes
export const ICON_SIZES = {
  xs:  14,    // Inside badges, chips
  sm:  16,    // Inline with text, input icons
  md:  20,    // Default UI icons
  lg:  24,    // Navigation icons
  xl:  28,    // Feature icons in cards
  '2xl': 36,  // Section header icons
  '3xl': 48,  // Empty state illustrations
  '4xl': 64,  // Success/error state icons
};

// Standard icon with label pattern
<div className="flex items-center gap-2">
  <MapPin size={ICON_SIZES.md} className="text-brand-600 flex-shrink-0" />
  <span className="text-sm font-medium">Stendi A1</span>
</div>
```

### Category Icons Mapping

```typescript
export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  'Vegetables':      Leaf,
  'Fruits':          Apple,
  'Grains & Flour':  Wheat,
  'Meat & Fish':     Fish,
  'Dairy & Eggs':    Egg,
  'Cooking Oil':     Droplets,
  'Spices':          Sparkles,
  'Clothing':        Shirt,
  'Household':       Home,
  'Electronics':     Zap,
  'Beverages':       Coffee,
  'Street Food':     UtensilsCrossed,
};
```

---

## 9. IMAGE HANDLING STANDARDS

### Cloudinary URL Builder

```typescript
// lib/cloudinary.ts
const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

export function getImageUrl(
  publicId: string,
  options: {
    width?: number;
    height?: number;
    quality?: 'auto' | number;
    format?: 'auto' | 'webp' | 'jpg';
    crop?: 'fill' | 'fit' | 'thumb';
    gravity?: 'face' | 'center' | 'auto';
  } = {}
): string {
  const {
    width = 400, quality = 'auto', format = 'auto',
    crop = 'fill', gravity = 'auto', height,
  } = options;

  const transforms = [
    `c_${crop}`,
    `w_${width}`,
    height ? `h_${height}` : null,
    `g_${gravity}`,
    `q_${quality}`,
    `f_${format}`,
    'dpr_auto',
  ].filter(Boolean).join(',');

  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${transforms}/${publicId}`;
}

// Preset image sizes
export const images = {
  avatar:        (id: string) => getImageUrl(id, { width: 120, height: 120, crop: 'thumb', gravity: 'face' }),
  productThumb:  (id: string) => getImageUrl(id, { width: 300, height: 300, crop: 'fill' }),
  productFull:   (id: string) => getImageUrl(id, { width: 800, crop: 'fit', quality: 85 }),
  bannerMobile:  (id: string) => getImageUrl(id, { width: 480, height: 210, crop: 'fill' }),
  bannerDesktop: (id: string) => getImageUrl(id, { width: 1200, height: 525, crop: 'fill' }),
  permit:        (id: string) => getImageUrl(id, { width: 600, crop: 'fit', quality: 90 }),
};
```

### Next.js Image Component Usage

```typescript
// Always use next/image — never raw <img> for content images
import Image from 'next/image';

// Trader Avatar
<Image
  src={images.avatar(trader.avatar_public_id)}
  alt={trader.business_name}
  width={56}
  height={56}
  className="rounded-full object-cover"
  placeholder="blur"
  blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
/>

// Product image with aspect ratio
<div className="aspect-product overflow-hidden rounded-xl bg-neutral-100">
  <Image
    src={images.productThumb(product.image_public_id)}
    alt={product.name}
    fill
    sizes="(max-width: 480px) 45vw, 200px"
    className="object-cover transition-transform duration-300 group-hover:scale-105"
  />
</div>
```

---

## 10. SPECIFIC PAGE STYLING GUIDES

### 10A. Home / Discovery Page

```
LAYOUT:
┌──────────────────────────────────────┐
│ TOP BAR: Logo + Market name + Bell   │ ← sticky, glass blur
│ SEARCH BAR (full width, rounded)     │ ← search opens search page
│ ─────────────────────────────────── │
│ HERO CARD: Market stats + open time  │ ← gradient-hero-green, animated numbers
│ ─────────────────────────────────── │
│ CATEGORIES: horizontal scroll row   │ ← emoji/icon + name chips
│ ─────────────────────────────────── │
│ SECTION: "Wazi Sasa / Open Now"      │ ← only open traders
│   [TraderCard] [TraderCard]          │ ← stagger-animated on load
│   [TraderCard] [TraderCard]          │
│ ─────────────────────────────────── │
│ SECTION: "Maarufu Leo / Popular"     │ ← by reservation count today
│   [ProductCard] [ProductCard]        │ ← horizontal scroll
│   [ProductCard] [ProductCard]        │
│ ─────────────────────────────────── │
│ SECTION: "Wachuuzi Wote / All"       │ ← full paginated list
│   ...                                │
│ BOTTOM NAV                           │
└──────────────────────────────────────┘

ANIMATION SEQUENCE (on mount):
  0ms   — TopBar fades in
  100ms — Hero card slides up + numbers count up
  200ms — Categories scroll row fades in
  350ms — Trader cards stagger in (60ms each)
```

### 10B. Trader Profile Page

```
LAYOUT:
┌──────────────────────────────────────┐
│ HERO BANNER IMAGE (16:7 ratio)       │ ← parallax on scroll, green overlay
│   [← Back]              [Share ...]  │ ← floating over banner
│                                      │
│ AVATAR (overlaps banner bottom)      │ ← -32px margin-top, ring border
│ Business Name (h1, display font)     │
│ ⭐ Rating · 127 reviews · Stendi A1  │
│ 🟢 Wazi / Open · Closes at 6:00 PM  │
│ ─────────────────────────────────── │
│ TRUST BADGES: horizontal scroll      │ ← Verified, Trusted, Fast Fulfiller
│ ─────────────────────────────────── │
│ TABS: Bidhaa | Maelezo | Tathmini   │ ← Products | About | Reviews
│ ─────────────────────────────────── │
│ [TAB CONTENT — Products grid]        │
│ ─────────────────────────────────── │
│ STICKY BOTTOM: "Wasiliana / Contact" │
└──────────────────────────────────────┘
```

### 10C. Payment Flow (M-Pesa Bottom Sheet)

```
BOTTOM SHEET APPEARANCE ANIMATION:
  1. Overlay fades in (200ms)
  2. Sheet slides up with spring physics (350ms)
  3. Content staggers in (50ms each item)

SHEET CONTENT:
┌──────────────────────────────────────┐
│ ████ [handle]                        │
│                                      │
│ Lipa kwa M-Pesa                      │ ← h2, display font
│ Pay with M-Pesa                      │
│                                      │
│ SUMMARY BOX (green-tinted card):     │
│   Nyanya × 2 kg          KES 100     │
│   ──────────────────────────────     │
│   Jumla / Total:         KES 100     │
│                                      │
│ Nambari ya M-Pesa / M-Pesa Number   │
│ [+254] [7XX XXX XXX              ]   │ ← pre-filled from account
│                                      │
│ ████████████████ LIPA SASA          │ ← btn-accent xl, full width
│ KES 100 via M-Pesa                  │ ← subtitle under button
│                                      │
│ 🔒 Salama & Imehakikishwa           │
│    Secure & Verified                 │
└──────────────────────────────────────┘

WAITING STATE (after STK push):
  - Button becomes loading spinner
  - "Angalia simu yako..." text pulses
  - Phone icon animation (gentle float)
  - Countdown timer (2 min timeout)

SUCCESS STATE:
  - Green checkmark draws itself (SVG path animation)
  - Confetti burst (canvas-confetti)
  - Sheet auto-closes after 2 seconds
  - Navigate to reservation detail
```

### 10D. Admin Dashboard

```
LAYOUT (tablet/desktop primary, mobile friendly):
┌──────────────────────────────────────┐
│ TOP BAR: Soko Mtaa Admin · [Market]  │
│ ─────────────────────────────────── │
│ STAT CARDS ROW (2 columns on mobile, 4 on desktop)
│  [Active Traders]  [Occupancy %]     │
│  [Today's Orders]  [Fees Today]      │ ← all numbers count-up on load
│ ─────────────────────────────────── │
│ PENDING ALERTS (if any):             │
│  ⚠️ 3 traders awaiting verification  │ ← amber banner, tap to go to list
│  🔴 2 overdue fee payments           │
│ ─────────────────────────────────── │
│ MARKET MAP (Leaflet — stall heatmap) │ ← live occupancy colors
│ ─────────────────────────────────── │
│ RECENT COMPLAINTS                    │
│ RECENT RESERVATIONS                  │
└──────────────────────────────────────┘

STAT CARD STYLE:
  - Gradient background (white → green-50)
  - Large number in --font-mono (counts up with useCountUp hook)
  - Subtle decorative radial gradient top-right
  - Icon with brand color, 28px
  - Trend indicator (↑ vs last week) in green or red
```

---

## 11. DARK MODE GUIDELINES

Dark mode activates automatically via `prefers-color-scheme: dark`.

```css
/* Dark mode overrides for components */
@media (prefers-color-scheme: dark) {
  .card, .card-trader, .card-product {
    background: var(--surface-card);      /* #121C14 */
    border-color: var(--border-default);  /* rgba(34,163,74,0.15) */
    box-shadow: 0 1px 3px rgba(0,0,0,0.3), 0 4px 20px rgba(0,0,0,0.2);
  }
  .btn-secondary {
    border-color: var(--green-700);
    color: var(--green-400);
  }
  .btn-secondary:hover {
    background: rgba(27, 128, 64, 0.15);
  }
  .input {
    background: #0D1510;
    border-color: var(--border-default);
    color: var(--text-primary);
  }
  .input:focus {
    background: #121C14;
    border-color: var(--green-600);
    box-shadow: 0 0 0 3px rgba(27, 128, 64, 0.2);
  }
  .bottom-nav {
    background: rgba(13, 21, 16, 0.92);
    border-top-color: rgba(34, 163, 74, 0.1);
  }
  .skeleton {
    background: linear-gradient(90deg, #1A2B1D 0%, #0D1510 30%, #1A2B1D 60%, #1A2B1D 100%);
    background-size: 1000px 100%;
  }
  .badge-open {
    background: rgba(34, 163, 74, 0.15);
    color: var(--green-400);
  }
}
```

---

## 12. COMPONENT LIBRARY — SHADCN/UI CUSTOMIZATION

Initialize shadcn with these settings:
```bash
npx shadcn@latest init
# Style: Default
# Base color: Green
# CSS variables: Yes
```

Override the generated `globals.css` shadcn variables:
```css
@layer base {
  :root {
    --background:       0 0% 98%;
    --foreground:       150 50% 8%;
    --card:             0 0% 100%;
    --card-foreground:  150 50% 8%;
    --primary:          145 65% 30%;   /* brand green-600 */
    --primary-foreground: 0 0% 100%;
    --secondary:        145 30% 95%;
    --secondary-foreground: 145 65% 25%;
    --accent:           38 92% 50%;    /* amber-500 */
    --accent-foreground: 0 0% 100%;
    --muted:            145 20% 96%;
    --muted-foreground: 145 10% 45%;
    --destructive:      0 84% 60%;
    --border:           145 20% 90%;
    --input:            145 20% 90%;
    --ring:             145 65% 30%;
    --radius:           0.625rem;
  }
  .dark {
    --background:       150 50% 5%;
    --foreground:       145 50% 95%;
    --card:             150 45% 7%;
    --card-foreground:  145 50% 95%;
    --primary:          145 55% 42%;
    --primary-foreground: 0 0% 100%;
    --muted:            150 30% 12%;
    --muted-foreground: 145 20% 55%;
    --border:           145 30% 14%;
    --input:            145 30% 14%;
  }
}
```

---

## 13. NAMING CONVENTIONS

```
CSS Classes:    kebab-case         .trader-card, .btn-primary
Tailwind:       utility classes    className="flex items-center gap-2"
Components:     PascalCase         TraderCard, ProductGrid, BottomNav
Hooks:          camelCase + use    useAuth, useMpesa, useScrollReveal
CSS Variables:  --kebab-case       --color-primary, --font-display
Animation IDs:  camelCase          fadeUp, slideDown, pulseBrand
Framer Motion:  camelCase variants pageVariants, listVariants, itemVariants
```

---

## 14. STYLING DO'S AND DON'TS

### ✅ DO
- Use CSS custom properties for all colors — never hardcode hex in components
- Use `clamp()` for fluid typography — never fixed px sizes for headings
- Always provide `aria-label` on icon-only buttons
- Use `loading="lazy"` on all below-fold images
- Test every component at 360px width before wider screens
- Use Framer Motion's `layout` prop for smooth list reordering
- Add `will-change: transform` only when actively animating, remove after
- Use `transform` and `opacity` for animations — never `top/left/width/height`
- Provide both Swahili and English text for all status messages

### ❌ DON'T
- Don't use `px` units for font sizes — use `rem` or CSS variables
- Don't animate more than 2 properties simultaneously on low-end devices
- Don't use `box-shadow` animations — use `filter: drop-shadow` or opacity changes
- Don't place important content behind hover-only interactions
- Don't use `position: fixed` for anything except: bottom nav, top bar, sheets, toasts
- Don't use `overflow: hidden` on scroll containers — use `overflow-x: auto`
- Don't hardcode English strings — always use the i18n system
- Don't use `alert()`, `confirm()`, or `prompt()` — always use custom UI
- Don't use gradients with more than 3 color stops (becomes muddy on AMOLED screens)
- Don't disable zoom (`user-scalable=no`) — it breaks accessibility

---

> **Last updated:** 2025 | **Project:** Soko Mtaa | **File:** STYLING.md
> This file pairs with AGENTS.md. Both must be followed simultaneously.
> Any visual decision not covered here should default to: bold, warm, mobile-first, green.
