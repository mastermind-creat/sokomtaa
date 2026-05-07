import { create } from 'zustand';

interface UIState {
    pageTitle: string;
    isGlobalLoading: boolean;
    setPageTitle: (title: string) => void;
    setIsGlobalLoading: (loading: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
    pageTitle: '',
    isGlobalLoading: false,
    setPageTitle: (title) => set({ pageTitle: title }),
    setIsGlobalLoading: (loading) => set({ isGlobalLoading: loading }),
}));
