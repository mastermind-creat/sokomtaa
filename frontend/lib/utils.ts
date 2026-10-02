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
export function handleApiError(err: any): string {
    if (typeof err === 'string') return err;
    
    // Laravel validation errors
    if (err.errors) {
        const firstField = Object.keys(err.errors)[0];
        const firstErrorArray = err.errors[firstField];
        if (Array.isArray(firstErrorArray) && firstErrorArray.length > 0) {
            return firstErrorArray[0];
        }
        return String(firstErrorArray);
    }
    
    return err.message || 'An unexpected error occurred.';
}

