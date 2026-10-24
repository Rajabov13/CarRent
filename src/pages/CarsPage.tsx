import { Suspense, lazy, useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { List, Map as MapIcon, SlidersHorizontal } from 'lucide-react';
import type { CarFilters, Vehicle } from '@/types';
import { dataService } from '@/services/api';
import { CarCard } from '@/components/CarCard';
import { FiltersPanel } from '@/components/FiltersPanel';
import { SearchForm } from '@/components/SearchForm';
import { EmptyState, Notice, Spinner } from '@/components/ui';
import { useSearchCriteria, criteriaToParams } from '@/hooks/useSearchCriteria';
import { useUrlState } from '@/hooks/useUrlState';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { defaultFilters, filterCars, filtersFromParams, filtersToParams } from '@/utils/filters';
import { buildMapPoints } from '@/utils/mapPoints';

const LocationsMap = lazy(() => import('@/components/LocationsMap'));

export default function CarsPage() {
  const { t } = useTranslation();
  useDocumentTitle(t('nav.cars'));
  const [params, setParams] = useSearchParams();
  const criteria = useSearchCriteria();
  const [vehicles, setVehicles] = useState<Vehicle[] | null>(null);
  const [error, setError] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const load = useCallback(() => {
    setError(false);
    setVehicles(null);
    dataService
      .listVehicles()
      .then(setVehicles)
      .catch(() => setError(true));
  }, []);
  useEffect(load, [load]);

  const [filters, updateFilters] = useUrlState(filtersFromParams, filtersToParams);
  const setFilters = (f: CarFilters) => updateFilters(() => f);
  const view = params.get('view') === 'map' ? 'map' : 'list';
  const setView = (v: 'list' | 'map') => {
    const p = new URLSearchParams(window.location.search);
    if (v === 'map') p.set('view', 'map');
    else p.delete('view');
    setParams(p, { replace: true });
  };

  const results = useMemo(() => (vehicles ? filterCars(vehicles, filters, criteria) : []), [vehicles, filters, criteria]);
  const carSearch = `?${criteriaToParams({ ...criteria, city: filters.city }).toString()}`;
  const mapPoints = useMemo(() => buildMapPoints(results.map((r) => r.vehicle.id), filters.city), [results, filters.city]);

  return (
    <div className="container-page py-8">
      <div className="card p-5">
        <SearchForm key={params.get('from') + '|' + params.get('to')} />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[280px_1fr]">
        <aside className={`${showFilters ? 'block' : 'hidden'} lg:block`} aria-label={t('filters.title')}>
          <div className="card p-5 lg:sticky lg:top-24">
            <h2 className="mb-4 text-lg font-bold">{t('filters.title')}</h2>
            <FiltersPanel filters={filters} onChange={updateFilters} />
          </div>
        </aside>

        <section aria-labelledby="results-title">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h1 id="results-title" className="text-xl font-bold" aria-live="polite" data-testid="results-count">
              {vehicles ? t('filters.results', { count: results.length }) : t('common.loading')}
            </h1>
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" className="btn-ghost lg:hidden" onClick={() => setShowFilters((s) => !s)} aria-expanded={showFilters}>
                <SlidersHorizontal className="h-4 w-4" aria-hidden />
                {showFilters ? t('filters.hide') : t('filters.show')}
              </button>
              <label className="sr-only" htmlFor="sort">{t('filters.sort')}</label>
              <select id="sort" className="field w-auto" value={filters.sort} onChange={(e) => {
                  const sort = e.target.value as CarFilters['sort'];
                  updateFilters((f) => ({ ...f, sort }));
                }} data-testid="sort">
                <option value="recommended">{t('filters.sortRecommended')}</option>
                <option value="priceAsc">{t('filters.sortPriceAsc')}</option>
                <option value="priceDesc">{t('filters.sortPriceDesc')}</option>
              </select>
              <div className="inline-flex rounded-xl border border-ink-200 p-1 dark:border-ink-700" role="group" aria-label={`${t('filters.viewList')} / ${t('filters.viewMap')}`}>
                {(['list', 'map'] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setView(v)}
                    aria-pressed={view === v}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium ${view === v ? 'bg-ink-900 text-white dark:bg-white dark:text-ink-950' : 'muted'}`}
                    data-testid={`view-${v}`}
                  >
                    {v === 'list' ? <List className="h-4 w-4" aria-hidden /> : <MapIcon className="h-4 w-4" aria-hidden />}
                    {v === 'list' ? t('filters.viewList') : t('filters.viewMap')}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {filters.availability === 'confirmedOnly' && (
            <div className="mb-5">
              <Notice tone="warning">{t('filters.confirmedNotice')}</Notice>
            </div>
          )}

          {error ? (
            <EmptyState title={t('common.error')} action={<button type="button" className="btn-primary" onClick={load}>{t('common.retry')}</button>} />
          ) : !vehicles ? (
            <Spinner label={t('common.loading')} />
          ) : results.length === 0 ? (
            <EmptyState
              title={t('filters.noResults')}
              hint={t('filters.noResultsHint')}
              action={<button type="button" className="btn-primary" onClick={() => setFilters({ ...defaultFilters(), sort: filters.sort })}>{t('filters.reset')}</button>}
            />
          ) : view === 'map' ? (
            <>
              <Suspense fallback={<Spinner label={t('common.loading')} />}>
                <LocationsMap points={mapPoints} className="h-[560px]" search={carSearch} />
              </Suspense>
              <p className="mt-3 text-xs muted">{t('map.approximateNote')}</p>
            </>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3" data-testid="results-grid">
              {results.map((r) => (
                <CarCard key={r.vehicle.id} vehicle={r.vehicle} city={filters.city} lowestUZS={r.lowestUZS} search={carSearch} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
