import { useTranslation } from 'react-i18next';
import { RotateCcw } from 'lucide-react';
import type { CarFilters, FuelType, Transmission, VehicleCategory } from '@/types';
import { cities } from '@/data/locations';
import { useLang } from '@/hooks/useLang';
import { useFormat } from '@/hooks/useMoney';
import { PRICE_CEILING, defaultFilters } from '@/utils/filters';

interface Props {
  filters: CarFilters;
  /** Functional update so quick successive edits never build on stale state. */
  onChange: (fn: (f: CarFilters) => CarFilters) => void;
}

const CATEGORIES: VehicleCategory[] = ['economy', 'sedan', 'suv', 'premium', 'minivan'];
const TRANSMISSIONS: Transmission[] = ['automatic', 'manual'];
const FUELS: FuelType[] = ['petrol', 'diesel', 'hybrid'];
const STEP = 50_000;

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((x) => x !== value) : [...list, value];
}

function CheckGroup<T extends string>({ legend, values, selected, label, onToggle }: { legend: string; values: T[]; selected: T[]; label: (v: T) => string; onToggle: (v: T) => void }) {
  return (
    <fieldset>
      <legend className="label">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {values.map((v) => {
          const on = selected.includes(v);
          return (
            <label
              key={v}
              className={`cursor-pointer rounded-full border px-3 py-1.5 text-sm transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent-500 ${
                on ? 'border-accent-500 bg-accent-500/15 font-semibold text-accent-800 dark:text-accent-300' : 'border-ink-200 hover:bg-ink-100 dark:border-ink-700 dark:hover:bg-ink-800'
              }`}
            >
              <input type="checkbox" className="sr-only" checked={on} onChange={() => onToggle(v)} />
              {label(v)}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

export function FiltersPanel({ filters, onChange }: Props) {
  const { t } = useTranslation();
  const { l } = useLang();
  const f = useFormat();
  const set = (patch: Partial<CarFilters>) => onChange((prev) => ({ ...prev, ...patch }));

  return (
    <div className="space-y-6" data-testid="filters">
      <div>
        <label className="label" htmlFor="f-city">{t('filters.city')}</label>
        <select id="f-city" className="field" value={filters.city} onChange={(e) => set({ city: e.target.value as CarFilters['city'] })}>
          <option value="all">{t('search.allCities')}</option>
          {(Object.keys(cities) as (keyof typeof cities)[]).map((c) => (
            <option key={c} value={c}>{l(cities[c].name)}</option>
          ))}
        </select>
      </div>

      <fieldset>
        <legend className="label">{t('filters.priceRange')}</legend>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-xs">
              <label htmlFor="f-pmin">{t('filters.priceMin')}</label>
              <span className="font-semibold">{f.uzs(filters.priceMin)}</span>
            </div>
            <input
              id="f-pmin"
              type="range"
              min={0}
              max={PRICE_CEILING}
              step={STEP}
              value={filters.priceMin}
              onChange={(e) => {
                const v = Number(e.target.value);
                onChange((prev) => ({ ...prev, priceMin: v, priceMax: Math.max(v, prev.priceMax) }));
              }}
              className="w-full accent-accent-500"
              data-testid="price-min"
            />
          </div>
          <div>
            <div className="flex justify-between text-xs">
              <label htmlFor="f-pmax">{t('filters.priceMax')}</label>
              <span className="font-semibold">{filters.priceMax >= PRICE_CEILING ? `${f.uzs(PRICE_CEILING)}+` : f.uzs(filters.priceMax)}</span>
            </div>
            <input
              id="f-pmax"
              type="range"
              min={0}
              max={PRICE_CEILING}
              step={STEP}
              value={filters.priceMax}
              onChange={(e) => {
                const v = Number(e.target.value);
                onChange((prev) => ({ ...prev, priceMax: v, priceMin: Math.min(v, prev.priceMin) }));
              }}
              className="w-full accent-accent-500"
              data-testid="price-max"
            />
          </div>
        </div>
      </fieldset>

      <CheckGroup legend={t('filters.category')} values={CATEGORIES} selected={filters.categories} label={(v) => t(`categories.${v}`)} onToggle={(v) => onChange((prev) => ({ ...prev, categories: toggle(prev.categories, v) }))} />
      <CheckGroup legend={t('filters.transmission')} values={TRANSMISSIONS} selected={filters.transmissions} label={(v) => t(`specs.${v}`)} onToggle={(v) => onChange((prev) => ({ ...prev, transmissions: toggle(prev.transmissions, v) }))} />
      <CheckGroup legend={t('filters.fuel')} values={FUELS} selected={filters.fuels} label={(v) => t(`specs.${v}`)} onToggle={(v) => onChange((prev) => ({ ...prev, fuels: toggle(prev.fuels, v) }))} />

      <div>
        <label className="label" htmlFor="f-seats">{t('filters.seats')}</label>
        <select id="f-seats" className="field" value={filters.minSeats} onChange={(e) => set({ minSeats: Number(e.target.value) })}>
          <option value={0}>{t('common.any')}</option>
          <option value={5}>{t('filters.minSeats', { n: 5 })}</option>
          <option value={7}>{t('filters.minSeats', { n: 7 })}</option>
        </select>
      </div>

      <fieldset>
        <legend className="label">{t('filters.availability')}</legend>
        <div className="space-y-2 text-sm">
          {(['any', 'bookableForDates', 'confirmedOnly'] as const).map((a) => (
            <label key={a} className="flex cursor-pointer items-start gap-2">
              <input type="radio" name="availability" className="mt-0.5 accent-accent-500" checked={filters.availability === a} onChange={() => set({ availability: a })} />
              <span>{t(a === 'any' ? 'filters.availabilityAny' : a === 'bookableForDates' ? 'filters.availabilityBookable' : 'filters.availabilityConfirmed')}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <button type="button" className="btn-ghost w-full" onClick={() => onChange((prev) => ({ ...defaultFilters(), sort: prev.sort }))}>
        <RotateCcw className="h-4 w-4" aria-hidden />
        {t('filters.reset')}
      </button>
    </div>
  );
}
