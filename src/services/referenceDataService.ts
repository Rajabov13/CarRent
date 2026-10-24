import { vehicles, vehicleBySlug } from '@/data/vehicles';
import { offers } from '@/data/offers';
import { providers } from '@/data/providers';
import { locations } from '@/data/locations';
import type { RentalDataService } from './types';

/**
 * Serves the bundled reference data. There is no live availability: none of the
 * providers publishes an availability API, so every check returns "unknown".
 */
export const referenceDataService: RentalDataService = {
  async listVehicles() {
    return vehicles;
  },
  async getVehicleBySlug(slug) {
    return vehicleBySlug.get(slug) ?? null;
  },
  async listOffers(vehicleId) {
    return vehicleId ? offers.filter((o) => o.vehicleId === vehicleId) : offers;
  },
  async listProviders() {
    return providers;
  },
  async listLocations() {
    return locations;
  },
  async checkAvailability(offerIds) {
    return offerIds.map((offerId) => ({ offerId, status: 'unknown' as const, checkedAt: null }));
  },
  async submitBookingRequest({ reference }) {
    // No backend: the estimate is stored locally by the caller (see services/storage.ts).
    return { reference, status: 'estimate_saved' };
  },
};
