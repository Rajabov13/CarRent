import { offers } from '@/data/offers';
import type { CarFilters, SearchCriteria, Vehicle } from '@/types';
import { minutesBetween, isValidLocal } from './dates';
import { billableDays } from './pricing';
import { isPriced, offerCity, offerPriceUZS, summarizeOffers } from './offerStats';

export const PRICE_CEILING = 3_000_000;

export const defaultFilters = (city: CarFilters['city'] = 'all'): CarFilters => ({
  city,
  priceMin: 0,
  priceMax: PRICE_CEILING,
  categories: [],
  transmissions: [],
  fuels: [],
  minSeats: 0,
  availability: 'any',
  sort: 'recommended',
});

export interface FilteredCar {
  vehicle: Vehicle;
  lowestUZS: number | null;
  offerCount: number;
  pricedCount: number;
}

/** Applies filters and sorting to the loaded vehicles and their offers. */
export function filterCars(vehicles: Vehicle[], f: CarFilters, criteria: Pick<SearchCriteria, 'pickupAt' | 'returnAt' | 'pickupLocationId'>): FilteredCar[] {
  const duration =
    isValidLocal(criteria.pickupAt) && isValidLocal(criteria.returnAt) ? minutesBetween(criteria.pickupAt, criteria.returnAt) : 0;
  const days = duration > 0 ? billableDays(duration, 24, 0) : 1;

  const result = vehicles
    .map((vehicle) => {
      let vOffers = offers.filter((o) => o.vehicleId === vehicle.id && (f.city === 'all' || offerCity(o) === f.city));
      if (criteria.pickupLocationId !== 'any') vOffers = vOffers.filter((o) => o.locationId === criteria.pickupLocationId);
      // An offer counts toward the price filter only if it is priced and within the range.
      const inRange = vOffers.filter((o) => {
        if (!isPriced(o)) return false;
        const uzs = offerPriceUZS(o)!;
        return uzs >= f.priceMin && (f.priceMax >= PRICE_CEILING || uzs <= f.priceMax);
      });
      const bookable = f.availability === 'bookableForDates' ? inRange.filter((o) => !o.minRentalDays || days >= o.minRentalDays) : inRange;
      const lowest = bookable.length ? Math.min(...bookable.map((o) => offerPriceUZS(o)!)) : null;
      return { vehicle, lowestUZS: lowest, offerCount: vOffers.length, pricedCount: bookable.length };
    })
    .filter(({ vehicle, offerCount, pricedCount }) => {
      if (offerCount === 0) return false;
      // Price filter active (or availability filter) → need a matching priced offer.
      const priceFilterActive = f.priceMin > 0 || f.priceMax < PRICE_CEILING || f.availability !== 'any';
      if (priceFilterActive && pricedCount === 0) return false;
      if (f.availability === 'confirmedOnly') return false; // no provider publishes live availability
      if (f.categories.length && !f.categories.includes(vehicle.category)) return false;
      if (f.transmissions.length && !vehicle.transmissions.some((t) => f.transmissions.includes(t))) return false;
      if (f.fuels.length && !f.fuels.includes(vehicle.fuel)) return false;
      if (f.minSeats && vehicle.seats < f.minSeats) return false;
      return true;
    });

  const price = (c: FilteredCar) => c.lowestUZS ?? summarizeOffers(c.vehicle.id, f.city).lowest?.uzs ?? Number.POSITIVE_INFINITY;
  if (f.sort === 'priceAsc') result.sort((a, b) => price(a) - price(b));
  else if (f.sort === 'priceDesc') result.sort((a, b) => (price(b) === Infinity ? -1 : price(b)) - (price(a) === Infinity ? -1 : price(a)));
  else result.sort((a, b) => a.vehicle.recommendedRank - b.vehicle.recommendedRank);
  return result;
}

/** Serialise filters to URL params (only non-default values). */
export function filtersToParams(f: CarFilters, base: URLSearchParams): URLSearchParams {
  const p = new URLSearchParams(base);
  const d = defaultFilters();
  const set = (k: string, v: string | null) => (v === null ? p.delete(k) : p.set(k, v));
  set('city', f.city === 'all' ? null : f.city);
  set('pmin', f.priceMin === d.priceMin ? null : String(f.priceMin));
  set('pmax', f.priceMax === d.priceMax ? null : String(f.priceMax));
  set('cat', f.categories.length ? f.categories.join(',') : null);
  set('trans', f.transmissions.length ? f.transmissions.join(',') : null);
  set('fuel', f.fuels.length ? f.fuels.join(',') : null);
  set('seats', f.minSeats ? String(f.minSeats) : null);
  set('avail', f.availability === 'any' ? null : f.availability);
  set('sort', f.sort === 'recommended' ? null : f.sort);
  return p;
}

export function filtersFromParams(p: URLSearchParams): CarFilters {
  const d = defaultFilters();
  const list = <T extends string>(k: string, allowed: readonly T[]) =>
    (p.get(k)?.split(',').filter((x): x is T => (allowed as readonly string[]).includes(x)) ?? []) as T[];
  const num = (k: string, def: number) => {
    const n = Number(p.get(k));
    return p.has(k) && Number.isFinite(n) ? n : def;
  };
  const city = p.get('city');
  const avail = p.get('avail');
  const sort = p.get('sort');
  return {
    city: city === 'tashkent' || city === 'samarkand' ? city : 'all',
    priceMin: num('pmin', d.priceMin),
    priceMax: num('pmax', d.priceMax),
    categories: list('cat', ['economy', 'sedan', 'suv', 'premium', 'minivan'] as const),
    transmissions: list('trans', ['manual', 'automatic'] as const),
    fuels: list('fuel', ['petrol', 'diesel', 'hybrid'] as const),
    minSeats: num('seats', 0),
    availability: avail === 'bookableForDates' || avail === 'confirmedOnly' ? avail : 'any',
    sort: sort === 'priceAsc' || sort === 'priceDesc' ? sort : 'recommended',
  };
}
