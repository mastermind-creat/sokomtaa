'use client';

import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useWebPush } from '@/hooks/useWebPush';
import { toast } from 'sonner';

export default function PushNotificationManager() {
    const { user } = useAuthStore();
    const { isSupported, permission, subscribe, isSubscribed } = useWebPush();
    const hasPrompted = useRef(false);

    useEffect(() => {
        // Only run once, and only if user is logged in
        if (!user || !isSupported || hasPrompted.current || isSubscribed) return;
        
        // Wait a few seconds after login so we don't bombard them immediately
        const timer = setTimeout(() => {
            if (permission === 'default') {
                toast.custom((t) => (
                    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4 w-[350px] pointer-events-auto">
                        <div className="flex gap-3">
                            <div className="w-10 h-10 rounded-full bg-brand-50 flex items-center justify-center shrink-0">
                                <svg className="w-5 h-5 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-gray-900 text-sm">Stay Updated</h3>
                                <p className="text-xs text-gray-500 mt-1">Get real-time alerts for your orders, reviews, and market updates.</p>
                                <div className="flex gap-2 mt-3">
                                    <button 
                                        onClick={async () => {
                                            toast.dismiss(t);
                                            const success = await subscribe();
                                            if (success) {
                                                toast.success('Push notifications enabled!');
                                            }
                                        }}
                                        className="flex-1 bg-brand-600 text-white text-xs font-bold py-2 rounded-lg hover:bg-brand-500 transition-colors"
                                    >
                                        Enable
                                    </button>
                                    <button 
                                        onClick={() => toast.dismiss(t)}
                                        className="flex-1 bg-gray-100 text-gray-700 text-xs font-bold py-2 rounded-lg hover:bg-gray-200 transition-colors"
                                    >
                                        Later
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ), { duration: 15000 });
                hasPrompted.current = true;
            } else if (permission === 'granted' && !isSubscribed) {
                // If they already granted permission in the past but aren't subscribed on backend, auto-subscribe
                subscribe();
                hasPrompted.current = true;
            }
        }, 3000);

        return () => clearTimeout(timer);
    }, [user, isSupported, permission, isSubscribed, subscribe]);

    return null; // This is a logic-only component
}
