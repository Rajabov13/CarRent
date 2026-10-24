import { exchangeRates } from '@/data/exchangeRates';
import type { Currency, Lang } from '@/types';

/** Convert an amount in `currency` to UZS at the stored CBU rate, rounded to the nearest 1 000 soʻm only for display. */
export function toUZS(amount: number, currency: Currency): number {
  return Math.round(amount * exchangeRates.rates[currency]);
}

const localeFor: Record<Lang, string> = { uz: 'uz-Latn-UZ', ru: 'ru-RU', en: 'en-US' };

export function formatNumber(n: number, lang: Lang, fractionDigits = 0): string {
  // Uzbek and Russian group thousands with a space; use a plain non-breaking space consistently.
  const s = new Intl.NumberFormat(localeFor[lang] === 'en-US' ? 'en-US' : 'ru-RU', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(n);
  return s.replace(/ /g, ' ');
}

/** "1 200 000 soʻm" / "1 200 000 сум" / "UZS 1,200,000". */
export function formatUZS(amount: number, lang: Lang): string {
  const n = formatNumber(Math.round(amount), lang);
  if (lang === 'uz') return `${n} soʻm`;
  if (lang === 'ru') return `${n} сум`;
  return `UZS ${n}`;
}

const symbols: Record<Exclude<Currency, 'UZS'>, string> = { USD: '$', EUR: '€', RUB: '₽' };

export function formatMoney(amount: number, currency: Currency, lang: Lang): string {
  if (currency === 'UZS') return formatUZS(amount, lang);
  const digits = Number.isInteger(amount) ? 0 : 2;
  const n = formatNumber(amount, lang, digits);
  return currency === 'RUB' ? `${n} ${symbols.RUB}` : `${symbols[currency]}${n}`;
}
