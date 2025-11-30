import { create } from 'zustand';

interface AppState {
    userId: string | null;
    setUserId: (id: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
    userId: null,
    setUserId: (id) => set({ userId: id }),
}));
