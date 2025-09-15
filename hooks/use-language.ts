"use client";

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { translations, Language, TranslationKey } from '@/lib/i18n/translations';

interface LanguageStore {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey) => string;
}

export const useLanguage = create<LanguageStore>()(
  persist(
    (set, get) => ({
      language: 'en' as Language,
      setLanguage: (language: Language) => set({ language }),
      t: (key: TranslationKey) => {
        const { language } = get();
        return translations[language][key] || translations.en[key] || key;
      },
    }),
    {
      name: 'language-storage',
    }
  )
);
