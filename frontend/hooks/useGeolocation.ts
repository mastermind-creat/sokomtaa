'use client';

import { useCallback, useEffect } from 'react';
import { useLocationStore, PermissionStatus } from '@/store/locationStore';

export function useGeolocation() {
    const {
        coords,
        permissionStatus,
        radius,
        isLocating,
        error,
        setCoords,
        setPermissionStatus,
        setIsLocating,
        setError,
    } = useLocationStore();

    const requestLocation = useCallback(() => {
        if (typeof window === 'undefined' || !navigator.geolocation) {
            setPermissionStatus('denied');
            setError('Geolocation is not supported by your browser.');
            return;
        }

        setIsLocating(true);
        setError(null);

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setCoords({
                    lat:      position.coords.latitude,
                    lng:      position.coords.longitude,
                    accuracy: position.coords.accuracy,
                });
                setPermissionStatus('granted');
                setIsLocating(false);
            },
            (err) => {
                setIsLocating(false);
                if (err.code === err.PERMISSION_DENIED) {
                    setPermissionStatus('denied');
                    setError('Location access denied. Showing all markets.');
                } else {
                    setError('Could not determine your location. Showing all markets.');
                }
            },
            {
                enableHighAccuracy: false,
                timeout:            8000,
                maximumAge:         5 * 60 * 1000, // Cache position for 5 min
            }
        );
    }, [setCoords, setPermissionStatus, setIsLocating, setError]);

    // Check existing permission on mount (no prompt shown)
    useEffect(() => {
        if (typeof window === 'undefined') return;

        if (navigator.permissions) {
            navigator.permissions.query({ name: 'geolocation' }).then((result) => {
                const status = result.state as PermissionStatus;
                setPermissionStatus(status);

                // If already granted, silently get position
                if (status === 'granted' && !coords) {
                    requestLocation();
                }

                // Listen for changes (user revokes permission)
                result.onchange = () => {
                    setPermissionStatus(result.state as PermissionStatus);
                    if (result.state === 'denied') setCoords(null);
                };
            });
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return {
        coords,
        permissionStatus,
        radius,
        isLocating,
        error,
        requestLocation,
        hasLocation: coords !== null,
        // Convenience: returns query params string for API calls
        locationParams: coords
            ? { lat: coords.lat, lng: coords.lng, radius }
            : {},
    };
}
