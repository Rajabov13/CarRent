import { useTranslation } from 'react-i18next';
import { offerById, offersByVehicle } from '@/data/offers';
import { providerById } from '@/data/providers';
import { locationById, cities } from '@/data/locations';
import { useLang } from '@/hooks/useLang';
import { useFormat } from '@/hooks/useMoney';
import { isPriced, offerPriceUZS } from '@/utils/offerStats';
import { MAX_CHILD_SEATS } from '@/utils/pricing';
import type { BookingSelection, Quote, Vehicle } from '@/types';
import { FieldError } from './FieldError';

interface Props {
  vehicle: Vehicle;
  selection: BookingSelection;
  quote: Quote;
  onChange: (patch: Partial<BookingSelection>) => void;
  idPrefix: string;
  showAge?: boolean;
}

/** Offer / location / dates / extras controls shared by the car page and the booking page. */
export function BookingInputs({ vehicle, selection, quote, onChange, idPrefix, showAge = true }: Props) {
  const { t } = useTranslation();
  const { l } = useLang();
  const f = useFormat();
  const offer = offerById.get(selection.offerId)!;
  const provider = providerById.get(offer.providerId)!;
  const priced = offersByVehicle(vehicle.id)
    .filter(isPriced)
    .sort((a, b) => (offerPriceUZS(a) ?? 0) - (offerPriceUZS(b) ?? 0));
  const returnOptions = [...new Set(offersByVehicle(vehicle.id).filter((o) => o.providerId === offer.providerId).map((o) => o.locationId))];

  const dateError = (field: 'pickupAt' | 'returnAt') => {
    if (field === 'pickupAt') return quote.errors.find((e) => e === 'validation.pickupInPast' || e === 'validation.invalidDate');
    return quote.errors.find((e) => e === 'validation.returnBeforePickup' || e === 'validation.minRentalDays');
  };
  const id = (s: string) => `${idPrefix}-${s}`;

  return (
    <div className="@container space-y-4">
      <div>
        <label className="label" htmlFor={id('offer')}>{t('booking.offer')}</label>
        <select id={id('offer')} className="field" value={selection.offerId} onChange={(e) => onChange({ offerId: e.target.value })} data-testid="offer-select">
          {priced.map((o) => {
            const loc = locationById.get(o.locationId);
            return (
              <option key={o.id} value={o.id}>
                {providerById.get(o.providerId)?.name} — {f.uzs(offerPriceUZS(o)!)} · {loc ? l(cities[loc.city].name) : ''}
              </option>
            );
          })}
        </select>
      </div>

      <div className="grid gap-4 @md:grid-cols-2">
        <div>
          <p className="label">{t('booking.pickupLocation')}</p>
          <p className="text-sm font-medium">{l(locationById.get(selection.pickupLocationId)?.name)}</p>
          <p className="text-xs muted">{locationById.get(selection.pickupLocationId)?.address ?? t('map.noAddress')}</p>
        </div>
        <div>
          <label className="label" htmlFor={id('return')}>{t('booking.returnLocation')}</label>
          <select id={id('return')} className="field" value={selection.returnLocationId} onChange={(e) => onChange({ returnLocationId: e.target.value })}>
            {returnOptions.map((locId) => (
              <option key={locId} value={locId}>
                {locId === selection.pickupLocationId ? t('booking.sameLocation') : l(locationById.get(locId)?.name)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 @md:grid-cols-2">
        <div>
          <label className="label" htmlFor={id('from')}>{t('booking.pickupAt')}</label>
          <input
            id={id('from')}
            type="datetime-local"
            className={`field ${dateError('pickupAt') ? 'field-error' : ''}`}
            value={selection.pickupAt}
            onChange={(e) => onChange({ pickupAt: e.target.value })}
            aria-invalid={Boolean(dateError('pickupAt'))}
            aria-describedby={dateError('pickupAt') ? id('from-err') : undefined}
            data-testid="booking-from"
          />
          <FieldError id={id('from-err')} message={dateError('pickupAt')} />
        </div>
        <div>
          <label className="label" htmlFor={id('to')}>{t('booking.returnAt')}</label>
          <input
            id={id('to')}
            type="datetime-local"
            className={`field ${dateError('returnAt') ? 'field-error' : ''}`}
            value={selection.returnAt}
            onChange={(e) => onChange({ returnAt: e.target.value })}
            aria-invalid={Boolean(dateError('returnAt'))}
            aria-describedby={dateError('returnAt') ? id('to-err') : undefined}
            data-testid="booking-to"
          />
          <FieldError id={id('to-err')} message={dateError('returnAt')} />
        </div>
      </div>

      {showAge && (
        <div className="max-w-[10rem]">
          <label className="label" htmlFor={id('age')}>{t('booking.driverAge')}</label>
          <input
            id={id('age')}
            type="number"
            min={18}
            max={99}
            className="field"
            value={selection.driverAge}
            onChange={(e) => {
              const n = Number(e.target.value);
              if (Number.isFinite(n)) onChange({ driverAge: Math.max(18, Math.min(99, Math.round(n))) });
            }}
          />
        </div>
      )}

      <fieldset>
        <legend className="label">{t('booking.extras')}</legend>
        {provider.extras.length === 0 ? (
          <p className="text-sm muted">{t('booking.extrasNone')}</p>
        ) : (
          <ul className="space-y-2">
            {provider.extras.map((x) => {
              const price =
                x.priceUZS === null
                  ? t('extras.priceOnRequest')
                  : t(x.unit === 'perDay' ? 'extras.perDay' : 'extras.perRental', { price: f.uzs(x.priceUZS) });
              const qty = selection.extras[x.id] ?? 0;
              return (
                <li key={x.id} className="flex items-start justify-between gap-3 rounded-xl border border-ink-200 p-3 dark:border-ink-700">
                  <div className="min-w-0 text-sm">
                    {x.id === 'childSeat' ? (
                      <label htmlFor={id('seat')} className="font-medium">{t('extras.childSeat')}</label>
                    ) : (
                      <label className="flex cursor-pointer items-center gap-2 font-medium">
                        <input
                          type="checkbox"
                          className="accent-accent-500"
                          checked={qty > 0}
                          onChange={(e) => onChange({ extras: { ...selection.extras, [x.id]: e.target.checked ? 1 : 0 } })}
                          data-testid={`extra-${x.id}`}
                        />
                        {t(`extras.${x.id}`)}
                      </label>
                    )}
                    <p className={`text-xs ${x.priceUZS === null ? 'text-amber-700 dark:text-amber-300' : 'muted'}`}>{price}</p>
                    {x.note && <p className="text-xs muted">{l(x.note)}</p>}
                  </div>
                  {x.id === 'childSeat' && (
                    <select
                      id={id('seat')}
                      className="field w-20"
                      value={qty}
                      onChange={(e) => onChange({ extras: { ...selection.extras, childSeat: Number(e.target.value) } })}
                      aria-label={t('booking.childSeatsQty')}
                      data-testid="extra-childSeat"
                    >
                      {Array.from({ length: MAX_CHILD_SEATS + 1 }, (_, n) => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </fieldset>
    </div>
  );
}
