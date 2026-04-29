'use client';

import { useCallback } from 'react';
import { useLocaleStore } from '@/store/localeStore';
import en from '@/locales/en.json';
import sw from '@/locales/sw.json';

export function useTranslation() {
  const { locale, toggleLocale, setLocale } = useLocaleStore();

  const translations = locale === 'en' ? en : sw;

  /**
   * Translate a key string (e.g., "common.search")
   */
  const t = useCallback((key: string): string => {
    const keys = key.split('.');
    let result: unknown = translations;

    for (const k of keys) {
      const current = result as Record<string, unknown>;
      if (current && current[k]) {
        result = current[k];
      } else {
        // Fallback to English if key missing in Swahili
        let fallback: unknown = en;
        for (const fk of keys) {
            const currentFallback = fallback as Record<string, unknown>;
            if (currentFallback && currentFallback[fk]) {
                fallback = currentFallback[fk];
            } else {
                return key; // Final fallback: return the key itself
            }
        }
        return fallback as string;
      }
    }

    return result as string;
  }, [translations]);

  return { t, locale, toggleLocale, setLocale };
}
