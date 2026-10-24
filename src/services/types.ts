import type { BookingSelection, CustomerDetails, PickupLocation, PriceOffer, Provider, Quote, Vehicle } from '@/types';

export type AvailabilityStatus =
  /** The provider confirmed the car is free for the dates. Requires a backend integration. */
  | 'available'
  | 'unavailable'
  /** No live data: the provider has no public availability API. */
  | 'unknown';

export interface AvailabilityResult {
  offerId: string;
  status: AvailabilityStatus;
  checkedAt: string | null;
}

export interface BookingRequestResult {
  reference: string;
  /** 'estimate_saved' = stored on this device only; 'submitted' = accepted by a backend, awaiting provider confirmation. */
  status: 'estimate_saved' | 'submitted';
}

/**
 * Everything the UI needs from the data layer. The bundled implementation reads
 * the dated reference data in src/data; a backend implementation can plug in
 * authorised provider APIs without touching components.
 */
export interface RentalDataService {
  listVehicles(): Promise<Vehicle[]>;
  getVehicleBySlug(slug: string): Promise<Vehicle | null>;
  listOffers(vehicleId?: string): Promise<PriceOffer[]>;
  listProviders(): Promise<Provider[]>;
  listLocations(): Promise<PickupLocation[]>;
  checkAvailability(offerIds: string[], pickupAt: string, returnAt: string): Promise<AvailabilityResult[]>;
  submitBookingRequest(input: {
    reference: string;
    selection: BookingSelection;
    customer: CustomerDetails;
    quote: Quote;
  }): Promise<BookingRequestResult>;
}
