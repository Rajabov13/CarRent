import { useLang } from './useLang';
import { formatMoney, formatUZS } from '@/utils/currency';
import { formatDate, formatDateTime } from '@/utils/dates';
import type { Currency } from '@/types';

/** Locale-aware formatters bound to the current language. */
export function useFormat() {
  const { lang } = useLang();
  return {
    uzs: (n: number) => formatUZS(n, lang),
    money: (n: number, c: Currency) => formatMoney(n, c, lang),
    date: (iso: string) => formatDate(iso, lang),
    dateTime: (local: string) => formatDateTime(local, lang),
  };
}
