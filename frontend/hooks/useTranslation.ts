'use client';

import { useCallback } from 'react';
import { useLocaleStore } from '@/store/localeStore';
import en from '@/locales/en.json';
import sw from '@/locales/sw.json';

type TranslationKeys = typeof en;

export function useTranslation() {
  const { locale, toggleLocale, setLocale } = useLocaleStore();

  const translations = locale === 'en' ? en : sw;

  /**
   * Translate a key string (e.g., "common.search")
   */
  const t = useCallback((key: string): string => {
    const keys = key.split('.');
    let result: any = translations;

    for (const k of keys) {
      if (result && result[k]) {
        result = result[k];
      } else {
        // Fallback to English if key missing in Swahili
        let fallback: any = en;
        for (const fk of keys) {
            if (fallback && fallback[fk]) {
                fallback = fallback[fk];
            } else {
                return key; // Final fallback: return the key itself
            }
        }
        return fallback;
      }
    }

    return result as string;
  }, [translations]);

  return { t, locale, toggleLocale, setLocale };
}
