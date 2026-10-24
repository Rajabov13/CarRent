import { useTranslation } from 'react-i18next';
import { locationById } from '@/data/locations';
import { exchangeRates } from '@/data/exchangeRates';
import { useLang } from './useLang';
import { useFormat } from './useMoney';
import { formatNumber } from '@/utils/currency';
import type { BookingSelection, CustomerDetails, PriceOffer, Provider, Quote, Vehicle } from '@/types';

export interface ReceiptModel {
  title: string;
  stamp: string;
  notConfirmed: string;
  platform: string;
  reference?: { label: string; value: string };
  issued?: { label: string; value: string };
  parties: { label: string; lines: string[] }[];
  facts: { label: string; value: string }[];
  itemHeaders: [string, string, string, string];
  items: { label: string; qty: string; unit: string; amount: string; muted?: boolean }[];
  totals: { label: string; value: string; strong?: boolean; note?: string }[];
  notes: string[];
  termsTitle: string;
  terms: { label: string; value: string }[];
  footer: string;
}

interface Input {
  quote: Quote;
  selection: BookingSelection;
  vehicle: Vehicle;
  offer: PriceOffer;
  provider: Provider;
  reference?: string;
  issuedAt?: string;
  customer?: CustomerDetails;
}

/** All receipt text, translated and formatted — rendered on screen and in the PDF. */
export function useReceiptModel({ quote, selection, vehicle, offer, provider, reference, issuedAt, customer }: Input): ReceiptModel {
  const { t } = useTranslation();
  const { l, lang } = useLang();
  const f = useFormat();
  const pickup = locationById.get(selection.pickupLocationId);
  const ret = locationById.get(selection.returnLocationId);
  const onRequest = t('extras.priceOnRequest');

  const parties: ReceiptModel['parties'] = [
    { label: t('receipt.provider'), lines: [provider.name, provider.website] },
  ];
  if (customer) {
    parties.push({
      label: t('receipt.customer'),
      lines: [customer.fullName, customer.phone, customer.email, `${t('booking.driverAge')}: ${selection.driverAge}`, `${t('booking.licenseYears')}: ${customer.licenseYears}`],
    });
  }
  parties.push({
    label: t('receipt.vehicle'),
    lines: [
      `${vehicle.make} ${vehicle.model} (${vehicle.generation})`,
      `${t('compare.listedAs')}: ${offer.listedAs}`,
      `${t('specs.modelYear')}: ${offer.modelYear ?? t('specs.yearNotVerified')}`,
    ],
  });
  parties.push({
    label: t('receipt.pickup'),
    lines: [pickup ? l(pickup.name) : '—', pickup?.address ?? t('map.noAddress'), f.dateTime(selection.pickupAt)],
  });
  parties.push({
    label: t('receipt.return'),
    lines: [ret ? l(ret.name) : '—', ret?.address ?? t('map.noAddress'), f.dateTime(selection.returnAt)],
  });

  const facts: ReceiptModel['facts'] = [
    { label: t('receipt.billableDays'), value: t('common.day', { count: quote.billableDays }) },
    {
      label: t('receipt.dailyPrice'),
      value:
        f.uzs(quote.baseDailyRateUZS) +
        (offer.currency !== 'UZS' ? ` (${t('receipt.originalPrice', { price: f.money(quote.originalDailyRate, offer.currency) })})` : ''),
    },
    { label: t('receipt.currency'), value: t('receipt.currencyValue') },
  ];

  const items: ReceiptModel['items'] = quote.lines.map((line) => ({
    label: t(line.labelKey, { ...line.labelParams, days: line.labelParams?.days !== undefined ? t('common.day', { count: Number(line.labelParams.days) }) : undefined }),
    qty: line.quantity !== undefined ? String(line.quantity) : '',
    unit: line.unitPriceUZS !== undefined ? f.uzs(line.unitPriceUZS) : line.amountUZS === null ? onRequest : '',
    amount: line.amountUZS === null ? onRequest : f.uzs(line.amountUZS),
    muted: line.amountUZS === null,
  }));

  const totals: ReceiptModel['totals'] = [
    { label: t('receipt.rentalSubtotal'), value: f.uzs(quote.rentalSubtotalUZS) },
    { label: t('receipt.extrasTotal'), value: f.uzs(quote.extrasTotalUZS) },
    { label: t('receipt.delivery'), value: f.uzs(quote.deliveryUZS) },
    { label: t('receipt.fees'), value: provider.mandatoryFees.length ? f.uzs(quote.feesUZS) : t('receipt.noFees') },
    { label: t('receipt.discount'), value: quote.discountUZS ? `− ${f.uzs(quote.discountUZS)}` : f.uzs(0) },
    { label: t('receipt.totalRentalCost'), value: f.uzs(quote.totalRentalCostUZS), strong: true },
    {
      label: t('receipt.deposit'),
      value: quote.depositUZS === null ? t('receipt.depositUnknown') : f.uzs(quote.depositUZS),
      note: t('receipt.depositNote'),
    },
    { label: t('receipt.dueAtPickup'), value: f.uzs(quote.dueAtPickupUZS), strong: true, note: t('receipt.dueAtPickupNote') },
    { label: t('receipt.dueOnline'), value: f.uzs(quote.dueOnlineUZS) },
  ];

  const notes: string[] = [];
  if (offer.currency !== 'UZS') {
    notes.push(
      t('receipt.rateNote', {
        date: f.date(exchangeRates.date),
        currency: offer.currency,
        rate: formatNumber(exchangeRates.rates[offer.currency], lang, 2),
      }),
    );
  }
  if (quote.unpricedItems.length) {
    notes.push(`${t('receipt.unpriced')} ${quote.unpricedItems.map((k) => t(k)).join(', ')}.`);
  }
  for (const w of quote.warnings) notes.push(t(w.key, w.params));

  const terms: ReceiptModel['terms'] = [
    { label: t('receipt.billing'), value: l(provider.billing.explanation) },
    { label: t('details.deposit'), value: provider.depositPolicy ? l(provider.depositPolicy) : t('common.notPublished') },
    {
      label: t('details.mileage'),
      value: offer.mileage ? l(offer.mileage) : provider.mileageLimitKmPerDay ? t('details.kmPerDay', { n: provider.mileageLimitKmPerDay }) : t('common.notPublished'),
    },
    { label: t('details.insurance'), value: offer.includes ? l(offer.includes) : provider.insurance ? l(provider.insurance) : t('common.notPublished') },
    { label: t('details.payment'), value: l(provider.paymentNote) },
  ];

  return {
    title: t('receipt.title'),
    stamp: t('receipt.estimate'),
    notConfirmed: t('receipt.notConfirmed'),
    platform: t('common.appName'),
    reference: reference ? { label: t('receipt.reference'), value: reference } : undefined,
    issued: issuedAt ? { label: t('receipt.issued'), value: f.dateTime(issuedAt) } : undefined,
    parties,
    facts,
    itemHeaders: [t('receipt.item'), t('receipt.qty'), t('receipt.unit'), t('receipt.amount')],
    items,
    totals,
    notes,
    termsTitle: t('receipt.terms'),
    terms,
    footer: `${t('receipt.sourcesNote', { source: `${offer.sourceName} (${offer.sourceUrl})`, date: f.date(offer.dateChecked) })} ${t('receipt.contactProvider')}: ${provider.website}`,
  };
}
