'use client';

import React, { useEffect, useRef, useCallback } from 'react';

interface TurnstileWidgetProps {
    onVerify: (token: string) => void;
    onError?: () => void;
    onExpire?: () => void;
}

declare global {
    interface Window {
        turnstile: {
            render: (container: string | HTMLElement, options: object) => string;
            reset: (widgetId: string) => void;
            remove: (widgetId: string) => void;
        };
        onTurnstileLoad?: () => void;
    }
}

export default function TurnstileWidget({ onVerify, onError, onExpire }: TurnstileWidgetProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef<string | null>(null);

    const renderWidget = useCallback(() => {
        if (!containerRef.current || !window.turnstile) return;
        // Remove previous widget if re-rendering
        if (widgetIdRef.current) {
            try { window.turnstile.remove(widgetIdRef.current); } catch { }
        }
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
            sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '0x4AAAAAAFjtM3qAwJWMGAhT',
            theme: 'light',
            callback: onVerify,
            'error-callback': onError,
            'expired-callback': onExpire,
        });
    }, [onVerify, onError, onExpire]);

    useEffect(() => {
        // If Turnstile script is already loaded, render immediately
        if (window.turnstile) {
            renderWidget();
            return;
        }

        // Otherwise inject the script once and render on load
        if (!document.getElementById('cf-turnstile-script')) {
            window.onTurnstileLoad = renderWidget;
            const script = document.createElement('script');
            script.id = 'cf-turnstile-script';
            script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad';
            script.async = true;
            script.defer = true;
            document.head.appendChild(script);
        } else {
            // Script injected but not loaded yet — wait
            const existing = window.onTurnstileLoad;
            window.onTurnstileLoad = () => {
                existing?.();
                renderWidget();
            };
        }

        return () => {
            if (widgetIdRef.current && window.turnstile) {
                try { window.turnstile.remove(widgetIdRef.current); } catch { }
            }
        };
    }, [renderWidget]);

    return (
        <div ref={containerRef} className="flex justify-center" />
    );
}
