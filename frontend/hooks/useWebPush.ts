import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';

/**
 * Base64 to Uint8Array converter required by VAPID
 */
function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export function useWebPush() {
    const [isSupported, setIsSupported] = useState(false);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [permission, setPermission] = useState<NotificationPermission>('default');

    useEffect(() => {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            setIsSupported(true);
            setPermission(Notification.permission);
            checkSubscription();
        }
    }, []);

    const checkSubscription = async () => {
        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();
            setIsSubscribed(!!subscription);
        } catch (err) {
            console.error('Error checking push subscription:', err);
        }
    };

    const subscribe = useCallback(async () => {
        if (!isSupported) return false;

        try {
            // Ask for permission if not granted
            if (Notification.permission !== 'granted') {
                const result = await Notification.requestPermission();
                setPermission(result);
                if (result !== 'granted') {
                    console.warn('Notification permission was not granted by the user.');
                    return false;
                }
            }

            const registration = await navigator.serviceWorker.ready;
            
            // Fetch VAPID key from backend
            const vapidRes = await api.get('/push-subscriptions/vapid-key');
            const vapidPublicKey = vapidRes.data.public_key;

            if (!vapidPublicKey) {
                throw new Error('No VAPID key returned from server.');
            }

            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
            });

            // Send subscription to backend
            await api.post('/push-subscriptions', subscription.toJSON());
            
            setIsSubscribed(true);
            return true;
        } catch (error) {
            console.warn('Failed to subscribe the user to push notifications: ', error);
            return false;
        }
    }, [isSupported]);

    const unsubscribe = useCallback(async () => {
        if (!isSupported) return false;

        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();

            if (subscription) {
                // Remove from backend
                await api.delete('/push-subscriptions', {
                    data: { endpoint: subscription.endpoint }
                });

                // Remove from browser
                await subscription.unsubscribe();
                setIsSubscribed(false);
            }
            return true;
        } catch (error) {
            console.warn('Error unsubscribing from push notifications: ', error);
            return false;
        }
    }, [isSupported]);

    return {
        isSupported,
        isSubscribed,
        permission,
        subscribe,
        unsubscribe
    };
}
