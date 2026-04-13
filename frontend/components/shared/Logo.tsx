'use client';

import React from 'react';

interface LogoProps {
    variant?: 'light' | 'dark' | 'green' | 'icon';
    className?: string;
    width?: number | string;
    height?: number | string;
    showTagline?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ 
    variant = 'light', 
    className = '', 
    width, 
    height,
    showTagline = false
}) => {
    // If width is provided and variant is wordmark, we should preserve aspect ratio
    // Original wordmark viewbox: 220 75
    // Original icon viewbox: 64 64

    if (variant === 'icon') {
        return (
            <svg 
                width={width || 64} 
                height={height || 64} 
                viewBox="0 0 64 64" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
                className={className}
            >
                <rect width="64" height="64" rx="14" fill="#1B6B3A"/>
                <path d="M12 34 Q12 22 22 22 L42 22 Q52 22 52 34 L52 38 L12 38 Z" fill="rgba(255,255,255,0.95)"/>
                <path d="M12 38 Q16.5 44 21 38 Q25.5 44 30 38 Q34.5 44 39 38 Q43.5 44 48 38 Q50 38 52 38 L12 38 Z" fill="rgba(255,255,255,0.65)"/>
                <rect x="16" y="38" width="32" height="14" rx="2" fill="rgba(255,255,255,0.1)"/>
                <rect x="16" y="48" width="32" height="3" rx="1" fill="rgba(255,255,255,0.5)"/>
                <rect x="13" y="33" width="4" height="20" rx="2" fill="rgba(255,255,255,0.55)"/>
                <rect x="47" y="33" width="4" height="20" rx="2" fill="rgba(255,255,255,0.55)"/>
                <circle cx="24" cy="46" r="3" fill="#F59E0B"/>
                <circle cx="34" cy="46" r="2.5" fill="rgba(255,255,255,0.7)"/>
                <circle cx="44" cy="46" r="2.5" fill="rgba(255,255,255,0.5)"/>
                <circle cx="32" cy="14" r="3" fill="#F59E0B"/>
                <path d="M32 17 L32 21" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
        );
    }

    if (variant === 'dark') {
        return (
            <svg 
                width={width || 200} 
                height={height || 'auto'} 
                viewBox="0 0 220 75" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
                className={className}
            >
                <path d="M8 28 Q8 14 22 14 L58 14 Q72 14 72 28 L72 32 L8 32 Z" fill="#22A34A"/>
                <path d="M8 32 Q14 38 20 32 Q26 38 32 32 Q38 38 44 32 Q50 38 56 32 Q62 38 68 32 L72 32 L8 32 Z" fill="#34C75E"/>
                <rect x="14" y="32" width="52" height="24" rx="2" fill="rgba(255,255,255,0.07)"/>
                <rect x="14" y="48" width="52" height="4" rx="1" fill="#22A34A"/>
                <rect x="11" y="28" width="5" height="30" rx="2" fill="#166534"/>
                <rect x="64" y="28" width="5" height="30" rx="2" fill="#166534"/>
                <circle cx="30" cy="44" r="4" fill="#F59E0B"/>
                <circle cx="30" cy="44" r="2.5" fill="#E8890A"/>
                <rect x="38" y="40" width="7" height="8" rx="1" fill="#C4956A"/>
                <circle cx="50" cy="44" r="3.5" fill="#34C75E"/>
                <line x1="16" y1="14" x2="16" y2="26" stroke="#166534" strokeWidth="1.5" strokeDasharray="2 2"/>
                <line x1="28" y1="14" x2="28" y2="26" stroke="#166534" strokeWidth="1.5" strokeDasharray="2 2"/>
                <line x1="40" y1="14" x2="40" y2="26" stroke="#166534" strokeWidth="1.5" strokeDasharray="2 2"/>
                <line x1="52" y1="14" x2="52" y2="26" stroke="#166534" strokeWidth="1.5" strokeDasharray="2 2"/>
                <line x1="64" y1="14" x2="64" y2="26" stroke="#166534" strokeWidth="1.5" strokeDasharray="2 2"/>
                <circle cx="40" cy="6" r="3" fill="#F59E0B"/>
                <path d="M40 9 L40 12" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round"/>
                <text x="88" y="34" fontFamily="'Plus Jakarta Sans',sans-serif" fontSize="22" fontWeight="800" fill="#34C75E" letterSpacing="-0.5">SOKO</text>
                <text x="88" y="56" fontFamily="'Plus Jakarta Sans',sans-serif" fontSize="22" fontWeight="800" fill="#6EE08A" letterSpacing="-0.5">MTAA</text>
                <circle cx="88" cy="66" r="2" fill="#F59E0B"/>
                {showTagline && <text x="96" y="69" fontFamily="'Plus Jakarta Sans',sans-serif" fontSize="9" fontWeight="500" fill="rgba(255,255,255,0.4)" letterSpacing="0.08em">SOKO YAKO MTAANI</text>}
            </svg>
        );
    }

    if (variant === 'green') {
        return (
            <svg 
                width={width || 200} 
                height={height || 'auto'} 
                viewBox="0 0 220 75" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
                className={className}
            >
                <path d="M8 28 Q8 14 22 14 L58 14 Q72 14 72 28 L72 32 L8 32 Z" fill="rgba(255,255,255,0.95)"/>
                <path d="M8 32 Q14 38 20 32 Q26 38 32 32 Q38 38 44 32 Q50 38 56 32 Q62 38 68 32 L72 32 L8 32 Z" fill="rgba(255,255,255,0.7)"/>
                <rect x="14" y="32" width="52" height="24" rx="2" fill="rgba(255,255,255,0.12)"/>
                <rect x="14" y="48" width="52" height="4" rx="1" fill="rgba(255,255,255,0.5)"/>
                <rect x="11" y="28" width="5" height="30" rx="2" fill="rgba(255,255,255,0.6)"/>
                <rect x="64" y="28" width="5" height="30" rx="2" fill="rgba(255,255,255,0.6)"/>
                <circle cx="30" cy="44" r="4" fill="#F59E0B"/>
                <circle cx="30" cy="44" r="2.5" fill="#E8890A"/>
                <rect x="38" y="40" width="7" height="8" rx="1" fill="rgba(255,255,255,0.6)"/>
                <circle cx="50" cy="44" r="3.5" fill="rgba(255,255,255,0.8)"/>
                <circle cx="40" cy="6" r="3" fill="#F59E0B"/>
                <path d="M40 9 L40 12" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round"/>
                <text x="88" y="34" fontFamily="'Plus Jakarta Sans',sans-serif" fontSize="22" fontWeight="800" fill="#FFFFFF" letterSpacing="-0.5">SOKO</text>
                <text x="88" y="56" fontFamily="'Plus Jakarta Sans',sans-serif" fontSize="22" fontWeight="800" fill="rgba(255,255,255,0.75)" letterSpacing="-0.5">MTAA</text>
                <circle cx="88" cy="66" r="2" fill="#F59E0B"/>
                {showTagline && <text x="96" y="69" fontFamily="'Plus Jakarta Sans',sans-serif" fontSize="9" fontWeight="500" fill="rgba(255,255,255,0.5)" letterSpacing="0.08em">SOKO YAKO MTAANI</text>}
            </svg>
        );
    }

    // Default: light
    return (
        <svg 
            width={width || 200} 
            height={height || 'auto'} 
            viewBox="0 0 220 75" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <path d="M8 28 Q8 14 22 14 L58 14 Q72 14 72 28 L72 32 L8 32 Z" fill="#1B6B3A"/>
            <path d="M8 32 Q14 38 20 32 Q26 38 32 32 Q38 38 44 32 Q50 38 56 32 Q62 38 68 32 L72 32 L8 32 Z" fill="#22A34A"/>
            <rect x="14" y="32" width="52" height="24" rx="2" fill="#E8F5EC"/>
            <rect x="14" y="48" width="52" height="4" rx="1" fill="#1B6B3A"/>
            <rect x="11" y="28" width="5" height="30" rx="2" fill="#0F5C2E"/>
            <rect x="64" y="28" width="5" height="30" rx="2" fill="#0F5C2E"/>
            <circle cx="30" cy="44" r="4" fill="#F59E0B"/>
            <circle cx="30" cy="44" r="2.5" fill="#E8890A"/>
            <rect x="38" y="40" width="7" height="8" rx="1" fill="#78502E"/>
            <circle cx="50" cy="44" r="3.5" fill="#22A34A"/>
            <line x1="16" y1="14" x2="16" y2="26" stroke="#0F5C2E" strokeWidth="1.5" strokeDasharray="2 2"/>
            <line x1="28" y1="14" x2="28" y2="26" stroke="#0F5C2E" strokeWidth="1.5" strokeDasharray="2 2"/>
            <line x1="40" y1="14" x2="40" y2="26" stroke="#0F5C2E" strokeWidth="1.5" strokeDasharray="2 2"/>
            <line x1="52" y1="14" x2="52" y2="26" stroke="#0F5C2E" strokeWidth="1.5" strokeDasharray="2 2"/>
            <line x1="64" y1="14" x2="64" y2="26" stroke="#0F5C2E" strokeWidth="1.5" strokeDasharray="2 2"/>
            <circle cx="40" cy="6" r="3" fill="#F59E0B"/>
            <path d="M40 9 L40 12" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round"/>
            <text x="88" y="34" fontFamily="'Plus Jakarta Sans',sans-serif" fontSize="22" fontWeight="800" fill="#1B6B3A" letterSpacing="-0.5">SOKO</text>
            <text x="88" y="56" fontFamily="'Plus Jakarta Sans',sans-serif" fontSize="22" fontWeight="800" fill="#0F5C2E" letterSpacing="-0.5">MTAA</text>
            <circle cx="88" cy="66" r="2" fill="#F59E0B"/>
            {showTagline && <text x="96" y="69" fontFamily="'DM Sans',sans-serif" fontSize="9" fontWeight="500" fill="#6B7280" letterSpacing="0.08em">SOKO YAKO MTAANI</text>}
        </svg>
    );
};
