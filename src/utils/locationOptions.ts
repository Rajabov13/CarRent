import { locations } from '@/data/locations';
import { offers } from '@/data/offers';
import type { CityId, PickupLocation } from '@/types';

const withOffers = new Set(offers.map((o) => o.locationId));

/** Pickup points that have at least one offer, optionally limited to a city. */
export function pickupOptions(city: CityId | 'all'): PickupLocation[] {
  return locations.filter((l) => withOffers.has(l.id) && (city === 'all' || l.city === city));
}
