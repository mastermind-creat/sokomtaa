import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * Normalizes Kenyan phone numbers to the format 254XXXXXXXXX
 */
export function normalizePhoneNumber(phone: string): string {
    // Remove all non-numeric characters except +
    const cleaned = phone.replace(/[^0-9+]/g, '');

    // Handle +254...
    if (cleaned.startsWith('+254')) {
        return cleaned.substring(1);
    }

    // Handle 07... or 01...
    if (cleaned.startsWith('0')) {
        return '254' + cleaned.substring(1);
    }

    // Handle 254... (already normalized)
    if (cleaned.startsWith('254') && cleaned.length >= 12) {
        return cleaned;
    }

    // Handle 7... or 1...
    if (cleaned.length === 9 && (cleaned.startsWith('7') || cleaned.startsWith('1'))) {
        return '254' + cleaned;
    }

    return cleaned;
}

/**
 * Extracts a user-friendly error message from a backend error response
 */
export function handleApiError(err: unknown): string {
    if (typeof err === 'string') return err;

    const e = err as Record<string, unknown>;

    // Already-unwrapped backend JSON: { message, errors }
    if (e?.errors && typeof e.errors === 'object') {
        const errors = e.errors as Record<string, string | string[]>;
        const firstField = Object.keys(errors)[0];
        const firstErr = errors[firstField];
        return Array.isArray(firstErr) ? firstErr[0] : String(firstErr);
    }

    if (typeof e?.message === 'string' && e.message) return e.message;

    return 'An unexpected error occurred.';
}

