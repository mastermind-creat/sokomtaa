import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface LocaleState {
  locale: 'en' | 'sw';
  setLocale: (locale: 'en' | 'sw') => void;
  toggleLocale: () => void;
}

export const useLocaleStore = create<LocaleState>()(
  persist(
    (set) => ({
      locale: 'en',
      setLocale: (locale) => set({ locale }),
      toggleLocale: () =>
        set((state) => ({
          locale: state.locale === 'en' ? 'sw' : 'en',
        })),
    }),
    {
      name: 'sokomtaa-locale',
      version: 2, // bumped: resets any old 'sw' default to 'en'
      migrate: () => ({ locale: 'en' as const }),
    }
  )
);

