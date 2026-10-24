import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, ExternalLink as ExternalIcon, TrendingDown } from 'lucide-react';
import { offersByVehicle } from '@/data/offers';
import { providerById } from '@/data/providers';
import { locationById, cities } from '@/data/locations';
import { useLang } from '@/hooks/useLang';
import { useFormat } from '@/hooks/useMoney';
import { offerCity, offerPriceUZS, summarizeOffers } from '@/utils/offerStats';
import type { CityId, PriceOffer } from '@/types';
import { Badge } from './ui';

interface Props {
  vehicleId: string;
  city?: CityId | 'all';
  selectedOfferId?: string;
  onSelect?: (offer: PriceOffer) => void;
  /** Rows shown before "show all". */
  initialRows?: number;
}

export function CompareSummary({ vehicleId, city = 'all' }: { vehicleId: string; city?: CityId | 'all' }) {
  const { t } = useTranslation();
  const f = useFormat();
  const s = summarizeOffers(vehicleId, city);
  const stats = [
    { label: t('compare.lowest'), value: s.lowest ? f.uzs(s.lowest.uzs) : '—', sub: s.lowest ? providerById.get(s.lowest.offer.providerId)?.name : undefined },
    { label: t('compare.typical'), value: s.typicalRange ? `${f.uzs(s.typicalRange[0])} – ${f.uzs(s.typicalRange[1])}` : '—' },
    { label: t('compare.median'), value: s.median ? f.uzs(s.median) : '—' },
    { label: t('compare.observed'), value: `${s.pricedCount} / ${s.totalCount}` },
  ];
  return (
    <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4" data-testid="compare-summary">
      {stats.map((x) => (
        <div key={x.label} className="rounded-xl bg-ink-100/70 p-3 dark:bg-ink-800/60">
          <dt className="text-xs font-medium muted">{x.label}</dt>
          <dd className="mt-1 text-sm font-bold text-ink-950 dark:text-white">{x.value}</dd>
          {x.sub && <dd className="text-xs muted">{x.sub}</dd>}
        </div>
      ))}
    </dl>
  );
}

export function CompareTable({ vehicleId, city = 'all', selectedOfferId, onSelect, initialRows = 6 }: Props) {
  const { t } = useTranslation();
  const { l } = useLang();
  const f = useFormat();
  const [expanded, setExpanded] = useState(false);

  const rows = offersByVehicle(vehicleId)
    .filter((o) => city === 'all' || offerCity(o) === city)
    .sort((a, b) => {
      const pa = offerPriceUZS(a);
      const pb = offerPriceUZS(b);
      if (pa === null) return 1;
      if (pb === null) return -1;
      return pa - pb;
    });
  const lowestId = rows.find((r) => offerPriceUZS(r) !== null)?.id;
  const visible = expanded ? rows : rows.slice(0, initialRows);

  if (!rows.length) return <p className="text-sm muted">{t('compare.noData')}</p>;

  return (
    <div>
      <div className="relative -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <table className="w-full min-w-[760px] border-separate border-spacing-0 text-left text-sm" data-testid="compare-table">
          <thead>
            <tr className="text-xs uppercase tracking-wide text-ink-500 dark:text-ink-400">
              <th scope="col" className="border-b border-ink-200 py-2 pr-3 font-semibold dark:border-ink-800">{t('compare.provider')}</th>
              <th scope="col" className="border-b border-ink-200 py-2 pr-3 font-semibold dark:border-ink-800">{t('compare.priceUZS')}</th>
              <th scope="col" className="border-b border-ink-200 py-2 pr-3 font-semibold dark:border-ink-800">{t('compare.price')}</th>
              <th scope="col" className="border-b border-ink-200 py-2 pr-3 font-semibold dark:border-ink-800">{t('compare.deposit')}</th>
              <th scope="col" className="border-b border-ink-200 py-2 pr-3 font-semibold dark:border-ink-800">{t('compare.location')}</th>
              <th scope="col" className="border-b border-ink-200 py-2 pr-3 font-semibold dark:border-ink-800">{t('compare.source')}</th>
              {onSelect && <th scope="col" className="border-b border-ink-200 py-2 font-semibold dark:border-ink-800"><span className="sr-only">{t('compare.pickForBooking')}</span></th>}
            </tr>
          </thead>
          <tbody>
            {visible.map((o) => {
              const provider = providerById.get(o.providerId);
              const loc = locationById.get(o.locationId);
              const uzs = offerPriceUZS(o);
              const isSelected = o.id === selectedOfferId;
              return (
                <tr key={o.id} className={isSelected ? 'bg-accent-500/10' : ''} data-testid="compare-row">
                  <td className="border-b border-ink-100 py-3 pr-3 align-top dark:border-ink-800/70">
                    <p className="font-semibold">{provider?.name}</p>
                    <p className="text-xs muted">{o.listedAs}{o.modelYear ? ` · ${o.modelYear}` : ''}</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {provider && <Badge>{t(`sources.kind.${provider.kind}`)}</Badge>}
                      {o.comparableOnly && <Badge tone="warning">{t('compare.comparableOnly')}</Badge>}
                    </div>
                    {o.includes && <p className="mt-1 text-xs muted">{t('compare.includes')}: {l(o.includes)}</p>}
                    {o.notes && <p className="mt-1 max-w-xs text-xs muted">{l(o.notes)}</p>}
                  </td>
                  <td className="border-b border-ink-100 py-3 pr-3 align-top dark:border-ink-800/70">
                    {uzs !== null ? (
                      <>
                        <p className="font-bold text-ink-950 dark:text-white">{o.rateType === 'dailyFrom' ? t('common.fromAmount', { price: f.uzs(uzs) }) : f.uzs(uzs)}</p>
                        {o.id === lowestId && (
                          <Badge tone="success" className="mt-1">
                            <TrendingDown className="h-3 w-3" aria-hidden />
                            {t('compare.bestBadge')}
                          </Badge>
                        )}
                        {o.tiers && o.tiers.length > 0 && (
                          <ul className="mt-1 space-y-0.5 text-xs muted">
                            <li className="font-medium">{t('compare.tiers')}:</li>
                            {o.tiers.map((tier) => (
                              <li key={tier.minDays}>
                                {t('compare.tierRow', {
                                  range: tier.maxDays === null ? t('compare.tierOpen', { min: tier.minDays }) : t('home.dealDays', { min: tier.minDays, max: tier.maxDays }),
                                  price: f.money(tier.price, o.currency),
                                })}
                              </li>
                            ))}
                          </ul>
                        )}
                      </>
                    ) : (
                      <Badge tone="warning">{t('common.requiresConfirmation')}</Badge>
                    )}
                  </td>
                  <td className="border-b border-ink-100 py-3 pr-3 align-top dark:border-ink-800/70">
                    <p>{o.price !== null ? f.money(o.price, o.currency) : '—'}</p>
                    <p className="text-xs muted">{t(`compare.rate.${o.rateType}`)}</p>
                    {o.mileage && <p className="text-xs muted">{t('compare.mileage')}: {l(o.mileage)}</p>}
                  </td>
                  <td className="border-b border-ink-100 py-3 pr-3 align-top dark:border-ink-800/70">
                    {o.depositUZS !== undefined && o.depositUZS !== null
                      ? o.depositUZS === 0
                        ? '0'
                        : f.uzs(o.depositUZS)
                      : o.depositOriginal
                        ? f.money(o.depositOriginal.amount, o.depositOriginal.currency)
                        : <span className="muted">{t('common.notPublished')}</span>}
                  </td>
                  <td className="border-b border-ink-100 py-3 pr-3 align-top dark:border-ink-800/70">
                    <p>{loc ? l(cities[loc.city].name) : '—'}</p>
                    <p className="text-xs muted">{loc ? l(loc.name) : ''}</p>
                  </td>
                  <td className="border-b border-ink-100 py-3 pr-3 align-top dark:border-ink-800/70">
                    <a href={o.sourceUrl} target="_blank" rel="noopener noreferrer" className="link inline-flex items-center gap-1 break-all">
                      {o.sourceName}
                      <ExternalIcon className="h-3 w-3 shrink-0" aria-hidden />
                    </a>
                    <p className="text-xs muted">{t('common.checkedOn', { date: f.date(o.dateChecked) })}</p>
                  </td>
                  {onSelect && (
                    <td className="border-b border-ink-100 py-3 align-top dark:border-ink-800/70">
                      {o.price !== null ? (
                        <button
                          type="button"
                          className={isSelected ? 'btn-primary px-3 py-1.5 text-xs' : 'btn-ghost px-3 py-1.5 text-xs'}
                          onClick={() => onSelect(o)}
                          aria-pressed={isSelected}
                        >
                          {isSelected && <Check className="h-3.5 w-3.5" aria-hidden />}
                          {isSelected ? t('compare.selected') : t('compare.pickForBooking')}
                        </button>
                      ) : (
                        <span className="text-xs muted">{t('compare.unavailableForBooking')}</span>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {rows.length > initialRows && (
        <button type="button" className="btn-ghost mt-3" onClick={() => setExpanded((e) => !e)} aria-expanded={expanded}>
          {expanded ? t('compare.showLess') : t('compare.showAll', { count: rows.length })}
        </button>
      )}
    </div>
  );
}
