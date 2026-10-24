import type { BookingSelection, PriceOffer, Provider, Quote, ReceiptLine } from '@/types';
import { toUZS } from './currency';
import { isValidLocal, minutesBetween, nowLocal } from './dates';
import { rateForDays } from './offerStats';

export const MAX_CHILD_SEATS = 3;
const DAY_MINUTES = 24 * 60;

/**
 * Billable days under a provider's billing policy:
 * - anything up to the minimum rental length is billed as the minimum;
 * - after that, each started 24-hour period is a full day, except that the
 *   provider's late-return grace period is not billed.
 */
export function billableDays(durationMinutes: number, minHours: number, graceMinutes: number): number {
  const minDays = Math.max(1, Math.ceil(minHours / 24));
  if (durationMinutes <= 0) return 0;
  const days = Math.ceil(Math.max(0, durationMinutes - graceMinutes) / DAY_MINUTES);
  return Math.max(minDays, days);
}

interface QuoteInput {
  selection: BookingSelection;
  offer: PriceOffer;
  provider: Provider;
  /** Injected for tests; defaults to the current local time. */
  now?: string;
}

/**
 * Itemised rental estimate.
 *
 *   rental subtotal = base daily rate × billable days
 *   total rental cost = subtotal + extras + delivery + mandatory fees − discounts
 *   due at pickup = total rental cost + refundable deposit (when the provider takes it at pickup)
 *
 * Items whose price the provider does not publish are listed with a null amount
 * and excluded from totals (and reported in `unpricedItems`).
 */
export function computeQuote({ selection, offer, provider, now = nowLocal() }: QuoteInput): Quote {
  const errors: string[] = [];
  const warnings: Quote['warnings'] = [];
  const lines: ReceiptLine[] = [];
  const unpricedItems: string[] = [];

  const datesValid = isValidLocal(selection.pickupAt) && isValidLocal(selection.returnAt);
  if (!datesValid) errors.push('validation.invalidDate');
  const durationMinutes = datesValid ? minutesBetween(selection.pickupAt, selection.returnAt) : 0;
  if (datesValid && durationMinutes <= 0) errors.push('validation.returnBeforePickup');
  if (datesValid && minutesBetween(now, selection.pickupAt) < 0) errors.push('validation.pickupInPast');
  if (offer.price === null) errors.push('booking.errors.noPrice');

  const { billing } = provider;
  const days = durationMinutes > 0 ? billableDays(durationMinutes, billing.minHours, billing.graceMinutes) : 0;

  if (durationMinutes > 0 && durationMinutes < billing.minHours * 60) {
    warnings.push({ key: 'booking.warnings.minimumBilled', params: { hours: billing.minHours } });
  }
  if (offer.minRentalDays && days > 0 && days < offer.minRentalDays) {
    errors.push('validation.minRentalDays');
  }
  if (!billing.published) warnings.push({ key: 'booking.warnings.billingAssumed' });
  if (provider.minDriverAge && selection.driverAge < provider.minDriverAge) {
    warnings.push({ key: 'booking.warnings.driverAge', params: { age: provider.minDriverAge } });
  }
  if (offer.currency !== 'UZS') warnings.push({ key: 'booking.warnings.foreignCurrency', params: { currency: offer.currency } });
  if (offer.comparableOnly) warnings.push({ key: 'booking.warnings.comparableOnly' });
  if (provider.kind === 'aggregator') warnings.push({ key: 'booking.warnings.aggregator' });
  if (offer.rateType === 'dailyFrom') warnings.push({ key: 'booking.warnings.fromPrice' });
  if (selection.returnLocationId !== selection.pickupLocationId) warnings.push({ key: 'booking.warnings.oneWay' });

  const baseDaily = offer.price === null ? 0 : toUZS(offer.price, offer.currency);
  const tier = rateForDays(offer, Math.max(days, 1));
  const appliedDaily = offer.price === null ? 0 : toUZS(tier.price, offer.currency);
  if (tier.beyondPublishedTiers) warnings.push({ key: 'booking.warnings.beyondTiers' });

  const rentalSubtotal = baseDaily * days;
  lines.push({
    kind: 'rental',
    labelKey: 'receipt.lines.rental',
    labelParams: { days },
    quantity: days,
    unitPriceUZS: baseDaily,
    amountUZS: rentalSubtotal,
  });

  // Optional extras (except delivery, handled separately).
  let extrasTotal = 0;
  for (const extra of provider.extras) {
    if (extra.id === 'delivery') continue;
    const qty = Math.min(selection.extras[extra.id] ?? 0, extra.id === 'childSeat' ? MAX_CHILD_SEATS : 1);
    if (qty <= 0) continue;
    const multiplier = extra.unit === 'perDay' ? days : 1;
    const amount = extra.priceUZS === null ? null : extra.priceUZS * qty * multiplier;
    if (amount === null) unpricedItems.push(`extras.${extra.id}`);
    else extrasTotal += amount;
    lines.push({
      kind: 'extra',
      labelKey: `extras.${extra.id}`,
      quantity: qty * multiplier,
      unitPriceUZS: extra.priceUZS ?? undefined,
      amountUZS: amount,
    });
  }

  let delivery = 0;
  if ((selection.extras.delivery ?? 0) > 0) {
    const d = provider.extras.find((e) => e.id === 'delivery');
    const amount = d?.priceUZS ?? null;
    if (amount === null) unpricedItems.push('extras.delivery');
    else delivery = amount;
    lines.push({ kind: 'delivery', labelKey: 'extras.delivery', quantity: 1, unitPriceUZS: amount ?? undefined, amountUZS: amount });
  }

  let fees = 0;
  for (const fee of provider.mandatoryFees) {
    fees += fee.amountUZS;
    lines.push({ kind: 'fee', labelKey: 'receipt.lines.fee', amountUZS: fee.amountUZS });
  }

  const discount = Math.max(0, (baseDaily - appliedDaily) * days);
  if (discount > 0) {
    lines.push({
      kind: 'discount',
      labelKey: 'receipt.lines.longTermDiscount',
      quantity: days,
      unitPriceUZS: baseDaily - appliedDaily,
      amountUZS: -discount,
    });
  }

  const totalRentalCost = rentalSubtotal + extrasTotal + delivery + fees - discount;

  const deposit =
    offer.depositUZS !== undefined && offer.depositUZS !== null
      ? offer.depositUZS
      : offer.depositOriginal
        ? toUZS(offer.depositOriginal.amount, offer.depositOriginal.currency)
        : null;
  if (deposit === null) unpricedItems.push('receipt.deposit');

  const depositAtPickup = provider.depositRequiredAtPickup !== false && deposit ? deposit : 0;

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    durationMinutes,
    billableDays: days,
    baseDailyRateUZS: baseDaily,
    appliedDailyRateUZS: appliedDaily,
    rentalSubtotalUZS: rentalSubtotal,
    extrasTotalUZS: extrasTotal,
    deliveryUZS: delivery,
    feesUZS: fees,
    discountUZS: discount,
    totalRentalCostUZS: totalRentalCost,
    depositUZS: deposit,
    dueAtPickupUZS: totalRentalCost + depositAtPickup,
    dueOnlineUZS: 0,
    lines,
    unpricedItems,
    sourceCurrency: offer.currency,
    originalDailyRate: offer.price ?? 0,
  };
}
