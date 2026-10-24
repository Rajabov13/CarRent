import { describe, expect, it } from 'vitest';
import { billableDays, computeQuote } from './pricing';
import { offers } from '@/data/offers';
import { providerById } from '@/data/providers';
import { summarizeOffers, rateForDays, defaultBookingOffer } from './offerStats';
import { toUZS, formatUZS } from './currency';
import type { BookingSelection } from '@/types';

const inrentCobalt = offers.find((o) => o.vehicleId === 'cobalt' && o.providerId === 'inrent' && o.locationId === 'inrent-tashkent')!;
const inrentSpark = offers.find((o) => o.vehicleId === 'spark' && o.providerId === 'inrent')!;
const inrent = providerById.get('inrent')!;
const rentcar = providerById.get('rentcar')!;

const base: BookingSelection = {
  vehicleId: 'cobalt',
  offerId: inrentCobalt.id,
  pickupLocationId: 'inrent-tashkent',
  returnLocationId: 'inrent-tashkent',
  pickupAt: '2026-11-01T10:00',
  returnAt: '2026-11-04T10:00',
  extras: {},
  driverAge: 30,
};
const NOW = '2026-10-24T12:00';

describe('billableDays', () => {
  it('bills the minimum for short rentals', () => {
    expect(billableDays(60, 24, 0)).toBe(1);
    expect(billableDays(24 * 60, 24, 0)).toBe(1);
  });
  it('rounds every started 24h period up', () => {
    expect(billableDays(24 * 60 + 1, 24, 0)).toBe(2);
    expect(billableDays(72 * 60, 24, 0)).toBe(3);
  });
  it('applies the grace period before adding a day', () => {
    expect(billableDays(72 * 60 + 60, 24, 60)).toBe(3);
    expect(billableDays(72 * 60 + 61, 24, 60)).toBe(4);
  });
  it('returns 0 for non-positive durations', () => {
    expect(billableDays(0, 24, 0)).toBe(0);
    expect(billableDays(-10, 24, 0)).toBe(0);
  });
});

describe('computeQuote', () => {
  it('computes a simple 3-day Inrent Cobalt rental', () => {
    const q = computeQuote({ selection: base, offer: inrentCobalt, provider: inrent, now: NOW });
    expect(q.valid).toBe(true);
    expect(q.billableDays).toBe(3);
    expect(q.rentalSubtotalUZS).toBe(1_200_000);
    expect(q.totalRentalCostUZS).toBe(1_200_000);
    expect(q.depositUZS).toBe(2_000_000);
    expect(q.dueAtPickupUZS).toBe(3_200_000);
    expect(q.dueOnlineUZS).toBe(0);
  });

  it('honours the 1-hour grace and bills an extra day after it', () => {
    const within = computeQuote({ selection: { ...base, returnAt: '2026-11-04T11:00' }, offer: inrentCobalt, provider: inrent, now: NOW });
    expect(within.billableDays).toBe(3);
    const after = computeQuote({ selection: { ...base, returnAt: '2026-11-04T11:01' }, offer: inrentCobalt, provider: inrent, now: NOW });
    expect(after.billableDays).toBe(4);
  });

  it('adds per-day child seats and delivery', () => {
    const q = computeQuote({
      selection: { ...base, extras: { childSeat: 2, delivery: 1 } },
      offer: inrentCobalt,
      provider: inrent,
      now: NOW,
    });
    expect(q.extrasTotalUZS).toBe(100_000 * 2 * 3);
    expect(q.deliveryUZS).toBe(300_000);
    expect(q.totalRentalCostUZS).toBe(1_200_000 + 600_000 + 300_000);
    expect(q.dueAtPickupUZS).toBe(q.totalRentalCostUZS + 2_000_000);
  });

  it('applies long-term tiers as a discount line', () => {
    const q = computeQuote({
      selection: { ...base, returnAt: '2026-12-01T10:00' }, // 30 days
      offer: inrentCobalt,
      provider: inrent,
      now: NOW,
    });
    expect(q.billableDays).toBe(30);
    expect(q.rentalSubtotalUZS).toBe(12_000_000);
    expect(q.discountUZS).toBe(3_000_000);
    expect(q.totalRentalCostUZS).toBe(9_000_000);
  });

  it('uses the Spark 14–30 day tier', () => {
    expect(rateForDays(inrentSpark, 13).price).toBe(280_000);
    expect(rateForDays(inrentSpark, 14).price).toBe(260_000);
    const beyond = rateForDays(inrentSpark, 45);
    expect(beyond.price).toBe(260_000);
    expect(beyond.beyondPublishedTiers).toBe(true);
  });

  it('rejects invalid ranges', () => {
    const q = computeQuote({ selection: { ...base, returnAt: '2026-11-01T09:00' }, offer: inrentCobalt, provider: inrent, now: NOW });
    expect(q.valid).toBe(false);
    expect(q.errors).toContain('validation.returnBeforePickup');
    const past = computeQuote({ selection: { ...base, pickupAt: '2026-10-01T10:00' }, offer: inrentCobalt, provider: inrent, now: NOW });
    expect(past.errors).toContain('validation.pickupInPast');
    const bad = computeQuote({ selection: { ...base, pickupAt: 'nope' }, offer: inrentCobalt, provider: inrent, now: NOW });
    expect(bad.errors).toContain('validation.invalidDate');
  });

  it('bills a 2-hour rental as one full day with a warning', () => {
    const q = computeQuote({ selection: { ...base, returnAt: '2026-11-01T12:00' }, offer: inrentCobalt, provider: inrent, now: NOW });
    expect(q.billableDays).toBe(1);
    expect(q.warnings.map((w) => w.key)).toContain('booking.warnings.minimumBilled');
  });

  it('lists unpriced extras without adding them to totals', () => {
    const rcOffer = offers.find((o) => o.vehicleId === 'cobalt' && o.providerId === 'rentcar')!;
    const q = computeQuote({
      selection: { ...base, offerId: rcOffer.id, extras: { childSeat: 1, additionalDriver: 1 } },
      offer: rcOffer,
      provider: rentcar,
      now: NOW,
    });
    expect(q.extrasTotalUZS).toBe(0);
    expect(q.unpricedItems).toEqual(expect.arrayContaining(['extras.childSeat', 'extras.additionalDriver']));
    expect(q.totalRentalCostUZS).toBe(1_200_000);
  });

  it('converts USD offers at the CBU rate', () => {
    const egar = offers.find((o) => o.vehicleId === 'cobalt' && o.providerId === 'egar')!;
    const q = computeQuote({ selection: { ...base, offerId: egar.id }, offer: egar, provider: providerById.get('egar')!, now: NOW });
    expect(q.baseDailyRateUZS).toBe(toUZS(30, 'USD'));
    expect(q.baseDailyRateUZS).toBe(357_095);
    expect(q.depositUZS).toBeNull();
    expect(q.warnings.map((w) => w.key)).toContain('booking.warnings.foreignCurrency');
  });

  it('warns about driver age below the provider minimum', () => {
    const q = computeQuote({ selection: { ...base, driverAge: 19 }, offer: inrentCobalt, provider: inrent, now: NOW });
    expect(q.warnings.map((w) => w.key)).toContain('booking.warnings.driverAge');
  });
});

describe('offer summaries', () => {
  it('finds the lowest observed Cobalt offer and a typical range', () => {
    const s = summarizeOffers('cobalt');
    expect(s.lowest?.offer.providerId).toBe('rentacartashkent');
    expect(s.lowest?.uzs).toBe(225_000);
    expect(s.typicalRange?.[0]).toBeLessThanOrEqual(s.typicalRange![1]);
  });
  it('filters by city', () => {
    const s = summarizeOffers('cobalt', 'samarkand');
    expect(s.pricedCount).toBe(2);
    expect(s.lowest?.uzs).toBe(300_000);
  });
  it('prefers a provider with published terms as the default booking offer', () => {
    expect(defaultBookingOffer('cobalt')?.providerId).toBe('inrent');
    expect(defaultBookingOffer('bmw5')?.providerId).toBe('orient');
  });
  it('excludes unpriced offers from summaries', () => {
    const s = summarizeOffers('eclass');
    expect(s.totalCount).toBe(3);
    expect(s.pricedCount).toBe(1);
  });
});

describe('formatting', () => {
  it('formats UZS per language', () => {
    expect(formatUZS(1200000, 'en')).toBe('UZS 1,200,000');
    expect(formatUZS(1200000, 'ru')).toBe('1 200 000 сум');
    expect(formatUZS(1200000, 'uz')).toBe('1 200 000 soʻm');
  });
});
