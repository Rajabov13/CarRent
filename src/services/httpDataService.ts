import type { RentalDataService } from './types';

/**
 * Client for a future backend that holds provider credentials and talks to
 * authorised provider APIs. Expected endpoints (JSON):
 *
 *   GET  /vehicles               → Vehicle[]
 *   GET  /vehicles/:slug         → Vehicle | 404
 *   GET  /offers?vehicleId=      → PriceOffer[]
 *   GET  /providers              → Provider[]
 *   GET  /locations              → PickupLocation[]
 *   POST /availability           { offerIds, pickupAt, returnAt } → AvailabilityResult[]
 *   POST /booking-requests       { reference, selection, customer, quote } → BookingRequestResult
 *
 * Secrets never live in the frontend; this client only sends public request data.
 */
export function createHttpDataService(baseUrl: string): RentalDataService {
  const root = baseUrl.replace(/\/$/, '');
  async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${root}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    });
    if (res.status === 404) return null as T;
    if (!res.ok) throw new Error(`API ${res.status}: ${path}`);
    return (await res.json()) as T;
  }
  return {
    listVehicles: () => request('/vehicles'),
    getVehicleBySlug: (slug) => request(`/vehicles/${encodeURIComponent(slug)}`),
    listOffers: (vehicleId) => request(`/offers${vehicleId ? `?vehicleId=${encodeURIComponent(vehicleId)}` : ''}`),
    listProviders: () => request('/providers'),
    listLocations: () => request('/locations'),
    checkAvailability: (offerIds, pickupAt, returnAt) =>
      request('/availability', { method: 'POST', body: JSON.stringify({ offerIds, pickupAt, returnAt }) }),
    submitBookingRequest: (input) => request('/booking-requests', { method: 'POST', body: JSON.stringify(input) }),
  };
}
