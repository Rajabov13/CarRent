import { locationById } from '@/data/locations';
import { offers } from '@/data/offers';
import { vehicleById } from '@/data/vehicles';
import type { MapPoint } from '@/components/LocationsMap';
import type { CityId } from '@/types';
import { offerPriceUZS } from './offerStats';

/** One map point per pickup location, listing the cars offered there with their price. */
export function buildMapPoints(vehicleIds: string[], city: CityId | 'all' = 'all'): MapPoint[] {
  const wanted = new Set(vehicleIds);
  const byLocation = new Map<string, MapPoint>();
  for (const o of offers) {
    if (!wanted.has(o.vehicleId)) continue;
    const location = locationById.get(o.locationId);
    const vehicle = vehicleById.get(o.vehicleId);
    if (!location || !vehicle || (city !== 'all' && location.city !== city)) continue;
    const point = byLocation.get(location.id) ?? { location, cars: [] };
    const price = offerPriceUZS(o);
    const existing = point.cars.find((c) => c.vehicle.id === vehicle.id);
    if (existing) {
      if (price !== null && (existing.priceUZS === null || price < existing.priceUZS)) existing.priceUZS = price;
    } else {
      point.cars.push({ vehicle, priceUZS: price });
    }
    byLocation.set(location.id, point);
  }
  return [...byLocation.values()];
}
