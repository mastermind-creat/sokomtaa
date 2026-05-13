import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type PermissionStatus = 'granted' | 'denied' | 'prompt' | 'unknown';

interface Coords {
    lat: number;
    lng: number;
    accuracy?: number;
}

interface LocationState {
    coords: Coords | null;
    permissionStatus: PermissionStatus;
    radius: number; // km, user-adjustable
    isLocating: boolean;
    error: string | null;
    // Actions
    setCoords: (coords: Coords | null) => void;
    setPermissionStatus: (status: PermissionStatus) => void;
    setRadius: (radius: number) => void;
    setIsLocating: (v: boolean) => void;
    setError: (err: string | null) => void;
    clearLocation: () => void;
}

export const useLocationStore = create<LocationState>()(
    persist(
        (set) => ({
            coords: null,
            permissionStatus: 'unknown',
            radius: 5, // Default 5 km
            isLocating: false,
            error: null,

            setCoords:           (coords)          => set({ coords, error: null }),
            setPermissionStatus: (permissionStatus) => set({ permissionStatus }),
            setRadius:           (radius)           => set({ radius }),
            setIsLocating:       (isLocating)       => set({ isLocating }),
            setError:            (error)            => set({ error }),
            clearLocation:       ()                 => set({ coords: null, permissionStatus: 'unknown' }),
        }),
        {
            name: 'sokomtaa-location',
            // Only persist these fields across page reloads
            partialize: (state) => ({
                coords:           state.coords,
                permissionStatus: state.permissionStatus,
                radius:           state.radius,
            }),
        }
    )
);
