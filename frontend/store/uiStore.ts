import { create } from 'zustand';

interface UIState {
    pageTitle: string;
    setPageTitle: (title: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
    pageTitle: '',
    setPageTitle: (title) => set({ pageTitle: title }),
}));
