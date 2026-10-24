import { offers } from '@/data/offers';
import { providerById } from '@/data/providers';
import { locationById } from '@/data/locations';
import type { CityId, PriceOffer, PriceTier } from '@/types';
import { toUZS } from './currency';

export interface PricedOffer extends PriceOffer {
  priceUZS: number;
}

export function isPriced(o: PriceOffer): o is PricedOffer & { price: number } {
  return o.status === 'observed' && o.price !== null;
}

export function offerPriceUZS(o: PriceOffer): number | null {
  return o.price === null ? null : toUZS(o.price, o.currency);
}

export function offerCity(o: PriceOffer): CityId | undefined {
  return locationById.get(o.locationId)?.city;
}

export interface VehiclePriceSummary {
  vehicleId: string;
  pricedCount: number;
  totalCount: number;
  lowest: { offer: PriceOffer; uzs: number } | null;
  highest: { offer: PriceOffer; uzs: number } | null;
  /** Interquartile-ish "typical" range: middle half of observed prices (or full range when < 4 offers). */
  typicalRange: [number, number] | null;
  median: number | null;
  cities: CityId[];
}

function quantile(sorted: number[], q: number): number {
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return Math.round(sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo));
}

export function summarizeOffers(vehicleId: string, city: CityId | 'all' = 'all', source = offers): VehiclePriceSummary {
  const all = source.filter((o) => o.vehicleId === vehicleId && (city === 'all' || offerCity(o) === city));
  const priced = all
    .filter(isPriced)
    .map((o) => ({ offer: o as PriceOffer, uzs: toUZS(o.price, o.currency) }))
    .sort((a, b) => a.uzs - b.uzs);
  const values = priced.map((p) => p.uzs);
  const cities = [...new Set(all.map(offerCity).filter((c): c is CityId => Boolean(c)))];
  return {
    vehicleId,
    pricedCount: priced.length,
    totalCount: all.length,
    lowest: priced[0] ?? null,
    highest: priced[priced.length - 1] ?? null,
    typicalRange: values.length
      ? values.length < 4
        ? [values[0], values[values.length - 1]]
        : [quantile(values, 0.25), quantile(values, 0.75)]
      : null,
    median: values.length ? quantile(values, 0.5) : null,
    cities,
  };
}

/**
 * The offer the booking calculator should start with: the cheapest observed
 * offer from a provider whose terms are published, falling back to the cheapest
 * observed offer of any kind.
 */
export function defaultBookingOffer(vehicleId: string, city: CityId | 'all' = 'all'): PriceOffer | null {
  const candidates = offers
    .filter((o) => o.vehicleId === vehicleId && isPriced(o) && (city === 'all' || offerCity(o) === city))
    .sort((a, b) => (offerPriceUZS(a) ?? 0) - (offerPriceUZS(b) ?? 0));
  return candidates.find((o) => providerById.get(o.providerId)?.termsKnown) ?? candidates[0] ?? null;
}

/** Daily rate for a rental length, honouring published tiers. */
export function rateForDays(o: PriceOffer, days: number): { price: number; beyondPublishedTiers: boolean } {
  const base = o.price ?? 0;
  if (!o.tiers?.length) return { price: base, beyondPublishedTiers: false };
  const tier = o.tiers.find((t) => days >= t.minDays && (t.maxDays === null || days <= t.maxDays));
  if (tier) return { price: tier.price, beyondPublishedTiers: false };
  const last = [...o.tiers].sort((a: PriceTier, b: PriceTier) => b.minDays - a.minDays).find((t) => days >= t.minDays);
  return { price: last?.price ?? base, beyondPublishedTiers: true };
}

/** Offers that carry a long-term discount tier — shown as "deals" on the home page. */
export function longTermDeals() {
  return offers
    .filter((o) => isPriced(o) && o.tiers && o.tiers.some((t) => t.price < (o.price ?? 0)))
    .map((o) => {
      const best = [...o.tiers!].sort((a, b) => a.price - b.price)[0];
      return { offer: o, tier: best, savingPct: Math.round((1 - best.price / (o.price ?? 1)) * 100) };
    })
    .sort((a, b) => b.savingPct - a.savingPct);
}
