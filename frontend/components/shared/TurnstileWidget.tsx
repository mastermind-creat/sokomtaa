'use client';

import React, { useEffect, useRef } from 'react';

const SITE_KEY = '0x4AAAAAAFjtM3qAwJWMGAhT';

interface TurnstileWidgetProps {
    onVerify: (token: string) => void;
    onError?: () => void;
    onExpire?: () => void;
    action?: string;
}

declare global {
    interface Window {
        turnstile: {
            render: (container: HTMLElement, options: object) => string;
            reset: (widgetId: string) => void;
            remove: (widgetId: string) => void;
        };
        _turnstileLoaded?: boolean;
        _turnstileQueue?: Array<() => void>;
    }
}

export default function TurnstileWidget({
    onVerify,
    onError,
    onExpire,
    action = 'login',
}: TurnstileWidgetProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef<string | null>(null);
    // Store callbacks in refs so the render effect never needs to re-run
    const onVerifyRef = useRef(onVerify);
    const onErrorRef = useRef(onError);
    const onExpireRef = useRef(onExpire);

    // Keep refs current without triggering re-renders
    useEffect(() => { onVerifyRef.current = onVerify; }, [onVerify]);
    useEffect(() => { onErrorRef.current = onError; }, [onError]);
    useEffect(() => { onExpireRef.current = onExpire; }, [onExpire]);

    useEffect(() => {
        // Only run once — action is stable per mount
        const renderWidget = () => {
            if (!containerRef.current) return;

            // Clean up any previous widget in this container
            if (widgetIdRef.current) {
                try { window.turnstile.remove(widgetIdRef.current); } catch { }
                widgetIdRef.current = null;
            }

            widgetIdRef.current = window.turnstile.render(containerRef.current, {
                sitekey: SITE_KEY,
                action,
                theme: 'light',
                // Use stable wrapper functions that delegate to the current ref
                callback: (token: string) => onVerifyRef.current(token),
                'error-callback': () => onErrorRef.current?.(),
                'expired-callback': () => {
                    onExpireRef.current?.();
                    // Auto-reset so user doesn't have to refresh
                    if (widgetIdRef.current) {
                        try { window.turnstile.reset(widgetIdRef.current); } catch { }
                    }
                },
            });
        };

        if (window.turnstile) {
            // Script already loaded
            renderWidget();
        } else if (window._turnstileLoaded === false) {
            // Script is loading — queue
            window._turnstileQueue = window._turnstileQueue ?? [];
            window._turnstileQueue.push(renderWidget);
        } else {
            // First load — inject script
            window._turnstileLoaded = false;
            window._turnstileQueue = [renderWidget];

            const script = document.createElement('script');
            script.id = 'cf-turnstile-script';
            script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
            script.async = true;
            script.defer = true;
            script.onload = () => {
                window._turnstileLoaded = true;
                window._turnstileQueue?.forEach((fn) => fn());
                window._turnstileQueue = [];
            };
            document.head.appendChild(script);
        }

        return () => {
            if (widgetIdRef.current && window.turnstile) {
                try { window.turnstile.remove(widgetIdRef.current); } catch { }
                widgetIdRef.current = null;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // intentionally empty — only run on mount/unmount

    return <div ref={containerRef} className="flex justify-center" />;
}
