import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Briefcase, Fuel, Settings2, Users } from 'lucide-react';
import type { CityId, Vehicle } from '@/types';
import { CarImage } from './CarImage';
import { Badge } from './ui';
import { useLang } from '@/hooks/useLang';
import { useFormat } from '@/hooks/useMoney';
import { summarizeOffers } from '@/utils/offerStats';
import { cities } from '@/data/locations';

interface Props {
  vehicle: Vehicle;
  city?: CityId | 'all';
  /** Overrides the lowest price (e.g. when filters restrict offers). */
  lowestUZS?: number | null;
  search?: string;
}

export function CarCard({ vehicle, city = 'all', lowestUZS, search = '' }: Props) {
  const { t } = useTranslation();
  const { l } = useLang();
  const f = useFormat();
  const summary = summarizeOffers(vehicle.id, city);
  const lowest = lowestUZS !== undefined ? lowestUZS : (summary.lowest?.uzs ?? null);
  const name = `${vehicle.make} ${vehicle.model}`;
  const to = `/cars/${vehicle.slug}${search}`;

  return (
    <article className="card group flex flex-col overflow-hidden transition-shadow hover:shadow-md" data-testid="car-card">
      <Link to={to} className="block" tabIndex={-1} aria-hidden>
        <CarImage file={vehicle.images[0].file} alt="" className="aspect-[16/10]" width={800} />
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold leading-tight">
              <Link to={to} className="hover:underline">{name}</Link>
            </h3>
            <p className="mt-0.5 text-xs muted">{vehicle.generation}</p>
          </div>
          <Badge tone="accent">{t(`categories.${vehicle.category}`)}</Badge>
        </div>

        <ul className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2 text-sm text-ink-600 dark:text-ink-300">
          <li className="flex items-center gap-1.5">
            <Settings2 className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
            {vehicle.transmissions.map((x) => t(`specs.${x}`)).join(' / ')}
          </li>
          <li className="flex items-center gap-1.5">
            <Users className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
            {t('specs.seatsCount', { n: vehicle.seats })}
          </li>
          <li className="flex items-center gap-1.5">
            <Fuel className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
            {t(`specs.${vehicle.fuel}`)}
          </li>
          <li className="flex items-center gap-1.5">
            <Briefcase className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
            {vehicle.luggageLiters ? t('specs.liters', { n: vehicle.luggageLiters }) : t('common.notPublished')}
          </li>
        </ul>

        <div className="mt-4 flex flex-wrap gap-1.5">
          <Badge>{t('car.offers', { count: summary.totalCount })}</Badge>
          {summary.cities.map((c) => (
            <Badge key={c} tone="info">{l(cities[c].name)}</Badge>
          ))}
          <Badge tone="warning">{t('car.availabilityOnRequest')}</Badge>
        </div>

        <div className="mt-auto flex items-end justify-between gap-3 pt-5">
          <div>
            {lowest !== null ? (
              <>
                <p className="text-xs muted">{t('car.lowestObserved')}</p>
                <p className="text-xl font-bold text-ink-950 dark:text-white" data-testid="car-price">
                  {t('common.fromAmount', { price: f.uzs(lowest) })}
                </p>
                <p className="text-xs muted">{t('common.perDay')}</p>
              </>
            ) : (
              <p className="text-sm font-medium text-amber-700 dark:text-amber-300">{t('car.noPrice')}</p>
            )}
          </div>
          <Link to={to} className="btn-dark shrink-0">{t('car.viewDetails')}</Link>
        </div>
      </div>
    </article>
  );
}
