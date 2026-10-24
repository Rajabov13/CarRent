import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en';
import ru from './locales/ru';
import uz from './locales/uz';
import type { Lang } from '@/types';

export const LANGS: { code: Lang; label: string; short: string }[] = [
  { code: 'uz', label: 'Oʻzbekcha', short: 'UZ' },
  { code: 'ru', label: 'Русский', short: 'RU' },
  { code: 'en', label: 'English', short: 'EN' },
];

const STORAGE_KEY = 'rcu-lang';

function initialLanguage(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'uz' || saved === 'ru' || saved === 'en') return saved;
  } catch {
    /* storage unavailable */
  }
  return 'uz';
}

void i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, ru: { translation: ru }, uz: { translation: uz } },
  lng: initialLanguage(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  returnNull: false,
});

i18n.on('languageChanged', (lng) => {
  try {
    localStorage.setItem(STORAGE_KEY, lng);
  } catch {
    /* ignore */
  }
  document.documentElement.lang = lng;
});
document.documentElement.lang = i18n.language;

export default i18n;
