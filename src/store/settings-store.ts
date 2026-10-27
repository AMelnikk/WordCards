import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { detectLanguage, nextLanguage, type Language } from '@/i18n/languages';

type SettingsState = {
  language: Language;
  cycleLanguage: () => void;
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      language: detectLanguage(),
      cycleLanguage: () => set((state) => ({ language: nextLanguage(state.language) })),
    }),
    {
      name: 'wordcards-settings',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ language: state.language }),
    }
  )
);
