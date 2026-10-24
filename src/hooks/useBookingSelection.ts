import { useCallback } from 'react';
import { offerById, offersByVehicle } from '@/data/offers';
import { providerById } from '@/data/providers';
import { defaultBookingOffer, isPriced, offerPriceUZS } from '@/utils/offerStats';
import { criteriaFromParams } from './useSearchCriteria';
import { useUrlState } from './useUrlState';
import type { BookingSelection, ExtraOption, PriceOffer, Vehicle } from '@/types';

const EXTRA_IDS: ExtraOption['id'][] = ['childSeat', 'additionalDriver', 'gps', 'delivery'];

function parseExtras(raw: string | null): BookingSelection['extras'] {
  const out: BookingSelection['extras'] = {};
  for (const part of raw?.split(',') ?? []) {
    const [id, qty] = part.split(':');
    const n = Number(qty);
    if (EXTRA_IDS.includes(id as ExtraOption['id']) && Number.isFinite(n) && n > 0) out[id as ExtraOption['id']] = Math.min(Math.floor(n), 3);
  }
  return out;
}

function serializeExtras(extras: BookingSelection['extras']): string {
  return Object.entries(extras)
    .filter(([, n]) => (n ?? 0) > 0)
    .map(([id, n]) => `${id}:${n}`)
    .join(',');
}

export function selectionToParams(sel: BookingSelection, extra?: Record<string, string>): URLSearchParams {
  const p = new URLSearchParams();
  p.set('offer', sel.offerId);
  p.set('pickup', sel.pickupLocationId);
  if (sel.returnLocationId !== sel.pickupLocationId) p.set('return', sel.returnLocationId);
  p.set('from', sel.pickupAt);
  p.set('to', sel.returnAt);
  p.set('age', String(sel.driverAge));
  const x = serializeExtras(sel.extras);
  if (x) p.set('x', x);
  for (const [k, v] of Object.entries(extra ?? {})) p.set(k, v);
  return p;
}

/** Locations where this vehicle has an offer — the booking "rental location" choices. */
export function vehicleLocations(vehicleId: string) {
  return [...new Set(offersByVehicle(vehicleId).map((o) => o.locationId))];
}

/** Cheapest priced offer at a location (preferring providers with published terms). */
export function bestOfferAt(vehicleId: string, locationId: string): PriceOffer | undefined {
  const list = offersByVehicle(vehicleId)
    .filter((o) => o.locationId === locationId && isPriced(o))
    .sort((a, b) => (offerPriceUZS(a) ?? 0) - (offerPriceUZS(b) ?? 0));
  return list.find((o) => providerById.get(o.providerId)?.termsKnown) ?? list[0];
}

/** Rebuilds a booking selection from URL params (offer, locations, dates, age, extras). */
function selectionFromParams(vehicle: Vehicle, params: URLSearchParams): BookingSelection | null {
  const criteria = criteriaFromParams(params);
  const fromParam = offerById.get(params.get('offer') ?? '');
  let offer = fromParam && fromParam.vehicleId === vehicle.id ? fromParam : undefined;
  const wantedPickup = params.get('pickup');
  if (!offer && wantedPickup && wantedPickup !== 'any') offer = bestOfferAt(vehicle.id, wantedPickup);
  offer ??= defaultBookingOffer(vehicle.id, criteria.city) ?? defaultBookingOffer(vehicle.id) ?? undefined;
  if (!offer) return null;
  const ret = params.get('return');
  return {
    vehicleId: vehicle.id,
    offerId: offer.id,
    pickupLocationId: offer.locationId,
    returnLocationId: ret && ret !== 'same' && providerLocationIds(vehicle.id, offer.providerId).has(ret) ? ret : offer.locationId,
    pickupAt: criteria.pickupAt,
    returnAt: criteria.returnAt,
    driverAge: criteria.driverAge,
    extras: parseExtras(params.get('x')),
  };
}

function providerLocationIds(vehicleId: string, providerId: string) {
  return new Set(offersByVehicle(vehicleId).filter((o) => o.providerId === providerId).map((o) => o.locationId));
}

/**
 * Booking selection mirrored into the URL so it survives reloads and carries
 * over between the car page, booking page and receipt.
 */
export function useBookingSelection(vehicle: Vehicle | null) {
  const read = useCallback((p: URLSearchParams) => (vehicle ? selectionFromParams(vehicle, p) : null), [vehicle]);
  const write = useCallback((sel: BookingSelection | null, base: URLSearchParams) => {
    if (!sel) return base;
    const keep: Record<string, string> = {};
    for (const k of ['ref', 'city']) {
      const v = base.get(k);
      if (v) keep[k] = v;
    }
    return selectionToParams(sel, keep);
  }, []);
  const [selection, setSelection] = useUrlState(read, write, [vehicle?.id]);

  const update = useCallback(
    (patch: Partial<BookingSelection>) =>
      setSelection((prev) => {
        if (!prev) return prev;
        const next = { ...prev, ...patch };
        // Changing the offer moves pickup to that offer's location; keep a valid return point.
        if (patch.offerId && patch.offerId !== prev.offerId) {
          const o = offerById.get(patch.offerId);
          if (o) {
            next.pickupLocationId = o.locationId;
            if (!patch.returnLocationId || !providerLocationIds(prev.vehicleId, o.providerId).has(patch.returnLocationId)) {
              next.returnLocationId = o.locationId;
            }
          }
        }
        return next;
      }),
    [setSelection],
  );

  return { selection, update };
}
