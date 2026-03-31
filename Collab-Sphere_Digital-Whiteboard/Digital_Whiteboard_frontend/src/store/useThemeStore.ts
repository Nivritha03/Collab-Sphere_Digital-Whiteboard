import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'light' | 'dark' | 'midnight' | 'cyber';

interface ThemeState {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const themeCycle: Theme[] = ['dark', 'light', 'midnight', 'cyber'];

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'dark',
      toggleTheme: () => set((state) => {
        const currentIndex = themeCycle.indexOf(state.theme);
        const nextIndex = (currentIndex + 1) % themeCycle.length;
        return { theme: themeCycle[nextIndex] };
      }),
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'theme-storage',
    }
  )
);
