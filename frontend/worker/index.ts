/// <reference lib="webworker" />

export {};

declare const self: ServiceWorkerGlobalScope;

// This will be invoked when the server sends a push notification
self.addEventListener('push', (event: PushEvent) => {
    let payload: { title: string; body: string; data?: any } = { 
        title: 'Soko Mtaa', 
        body: 'You have a new notification.' 
    };
    
    if (event.data) {
        try {
            payload = event.data.json();
        } catch (e) {
            // If it's not JSON, assume it's a plain string
            payload.body = event.data.text();
        }
    }

    const title = payload.title;
    const options: NotificationOptions = {
        body: payload.body,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-192x192.png',
        vibrate: [200, 100, 200],
        data: payload.data, // This can hold a URL to open on click
        requireInteraction: true, // Keep notification open until the user interacts
    } as NotificationOptions & { vibrate?: number[] };

    event.waitUntil(self.registration.showNotification(title, options));
});

// This will be invoked when the user clicks the notification
self.addEventListener('notificationclick', (event: NotificationEvent) => {
    event.notification.close();

    // Default URL to open
    let urlToOpen = '/';

    // If the notification payload included a specific URL, use that
    if (event.notification.data && event.notification.data.url) {
        urlToOpen = event.notification.data.url;
    }

    // Try to focus an existing window/tab, otherwise open a new one
    const promiseChain = self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true
    }).then((windowClients) => {
        let matchingClient = null;
        for (let i = 0; i < windowClients.length; i++) {
            const windowClient = windowClients[i];
            if (windowClient.url.includes(urlToOpen)) {
                matchingClient = windowClient;
                break;
            }
        }
        if (matchingClient) {
            return matchingClient.focus();
        } else {
            return self.clients.openWindow(urlToOpen);
        }
    });

    event.waitUntil(promiseChain);
});
