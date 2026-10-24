import { useEffect, useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CalendarClock, MapPin, Search, UserRound } from 'lucide-react';
import { searchSchema, type SearchFormValues } from '@/utils/schemas';
import { pickupOptions } from '@/utils/locationOptions';
import { criteriaToParams, rememberCriteria, useSearchCriteria } from '@/hooks/useSearchCriteria';
import { cities } from '@/data/locations';
import { useLang } from '@/hooks/useLang';
import { isValidLocal, minutesBetween } from '@/utils/dates';
import { billableDays } from '@/utils/pricing';
import { FieldError } from './FieldError';
import type { SearchCriteria } from '@/types';

export function SearchForm({ compact = false }: { compact?: boolean }) {
  const { t } = useTranslation();
  const { l } = useLang();
  const navigate = useNavigate();
  const initial = useSearchCriteria();

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<SearchFormValues>({
    resolver: zodResolver(searchSchema),
    defaultValues: initial,
    mode: 'onChange',
  });

  const [city, pickupLocationId, pickupAt, returnAt] = useWatch({ control, name: ['city', 'pickupLocationId', 'pickupAt', 'returnAt'] });
  const options = useMemo(() => pickupOptions(city as SearchCriteria['city']), [city]);

  // Keep the selected pickup point consistent with the city.
  useEffect(() => {
    if (pickupLocationId !== 'any' && !options.some((o) => o.id === pickupLocationId)) {
      setValue('pickupLocationId', 'any');
      setValue('returnLocationId', 'same');
    }
  }, [options, pickupLocationId, setValue]);

  const days =
    isValidLocal(pickupAt) && isValidLocal(returnAt) && minutesBetween(pickupAt, returnAt) > 0
      ? billableDays(minutesBetween(pickupAt, returnAt), 24, 0)
      : null;

  const onSubmit = (raw: SearchFormValues) => {
    const values = searchSchema.parse(raw);
    const c: SearchCriteria = { ...values, city: values.city as SearchCriteria['city'] };
    rememberCriteria(c);
    navigate(`/cars?${criteriaToParams(c)}`);
  };

  const grid = compact ? 'grid gap-3 sm:grid-cols-2' : 'grid gap-3 sm:grid-cols-2 lg:grid-cols-12';

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate aria-label={t('search.title')} data-testid="search-form">
      <div className={grid}>
        <div className={compact ? '' : 'lg:col-span-2'}>
          <label className="label" htmlFor="s-city">{t('search.city')}</label>
          <select id="s-city" className="field" {...register('city')}>
            <option value="all">{t('search.allCities')}</option>
            {(Object.keys(cities) as (keyof typeof cities)[]).map((c) => (
              <option key={c} value={c}>{l(cities[c].name)}</option>
            ))}
          </select>
        </div>
        <div className={compact ? '' : 'lg:col-span-3'}>
          <label className="label" htmlFor="s-pickup">
            <MapPin className="mr-1 inline h-3.5 w-3.5" aria-hidden />
            {t('search.pickupLocation')}
          </label>
          <select id="s-pickup" className="field" {...register('pickupLocationId')}>
            <option value="any">{t('search.anyLocation')}</option>
            {options.map((o) => (
              <option key={o.id} value={o.id}>{l(o.name)}</option>
            ))}
          </select>
        </div>
        <div className={compact ? '' : 'lg:col-span-3'}>
          <label className="label" htmlFor="s-return">{t('search.returnLocation')}</label>
          <select id="s-return" className="field" {...register('returnLocationId')}>
            <option value="same">{t('search.sameAsPickup')}</option>
            {options.map((o) => (
              <option key={o.id} value={o.id}>{l(o.name)}</option>
            ))}
          </select>
        </div>
        <div className={compact ? '' : 'lg:col-span-2'}>
          <label className="label" htmlFor="s-from">
            <CalendarClock className="mr-1 inline h-3.5 w-3.5" aria-hidden />
            {t('search.pickupAt')}
          </label>
          <input
            id="s-from"
            type="datetime-local"
            className={`field ${errors.pickupAt ? 'field-error' : ''}`}
            aria-invalid={Boolean(errors.pickupAt)}
            aria-describedby={errors.pickupAt ? 's-from-err' : undefined}
            {...register('pickupAt', { deps: ['returnAt'] })}
          />
          <FieldError id="s-from-err" message={errors.pickupAt?.message} />
        </div>
        <div className={compact ? '' : 'lg:col-span-2'}>
          <label className="label" htmlFor="s-to">{t('search.returnAt')}</label>
          <input
            id="s-to"
            type="datetime-local"
            className={`field ${errors.returnAt ? 'field-error' : ''}`}
            aria-invalid={Boolean(errors.returnAt)}
            aria-describedby={errors.returnAt ? 's-to-err' : undefined}
            {...register('returnAt', { deps: ['pickupAt'] })}
          />
          <FieldError id="s-to-err" message={errors.returnAt?.message} />
        </div>
        <div className={compact ? '' : 'lg:col-span-2'}>
          <label className="label" htmlFor="s-age">
            <UserRound className="mr-1 inline h-3.5 w-3.5" aria-hidden />
            {t('search.driverAge')}
          </label>
          <input
            id="s-age"
            type="number"
            inputMode="numeric"
            min={18}
            max={99}
            className={`field ${errors.driverAge ? 'field-error' : ''}`}
            aria-invalid={Boolean(errors.driverAge)}
            aria-describedby={errors.driverAge ? 's-age-err' : undefined}
            {...register('driverAge')}
          />
          <FieldError id="s-age-err" message={errors.driverAge?.message} />
        </div>
        <div className={`flex flex-col justify-end ${compact ? 'sm:col-span-2' : 'lg:col-span-7'}`}>
          {days !== null && (
            <p className="text-sm muted" aria-live="polite">
              {t('search.duration', { text: t('common.day', { count: days }) })}
            </p>
          )}
        </div>
        <div className={`flex items-end ${compact ? 'sm:col-span-2' : 'sm:col-span-2 lg:col-span-3'}`}>
          <button type="submit" className="btn-primary h-[42px] w-full" data-testid="search-submit">
            <Search className="h-4 w-4" aria-hidden />
            {t('search.submit')}
          </button>
        </div>
      </div>
    </form>
  );
}
