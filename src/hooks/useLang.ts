import { useTranslation } from 'react-i18next';
import type { Lang, LocalizedText } from '@/types';

/** Current language plus a helper to pick a LocalizedText value from the data layer. */
export function useLang() {
  const { i18n } = useTranslation();
  const lang = (['uz', 'ru', 'en'].includes(i18n.language) ? i18n.language : 'uz') as Lang;
  const l = (text: LocalizedText | null | undefined) => (text ? text[lang] : '');
  return { lang, l };
}
