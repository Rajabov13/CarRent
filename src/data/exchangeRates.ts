import type { ExchangeRates } from '@/types';

/**
 * Official Central Bank of Uzbekistan rates effective 23.10.2026
 * (cbu.uz; cross-checked on norma.uz and spot.uz).
 * Used only to convert prices that providers quote in foreign currency.
 */
export const exchangeRates: ExchangeRates = {
  rates: { UZS: 1, USD: 11903.15, EUR: 13329.15, RUB: 146.75 },
  date: '2026-10-23',
  source: { label: 'Central Bank of the Republic of Uzbekistan', url: 'https://cbu.uz/en/' },
};

/** Date on which every reference price in src/data/offers.ts was checked. */
export const PRICE_CHECK_DATE = '2026-10-24';
