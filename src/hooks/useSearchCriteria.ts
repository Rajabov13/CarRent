import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { defaultRange, isValidLocal } from '@/utils/dates';
import type { CityId, SearchCriteria } from '@/types';

const KEY = 'rcu-search';

function stored(): Partial<SearchCriteria> {
  try {
    return JSON.parse(sessionStorage.getItem(KEY) ?? '{}');
  } catch {
    return {};
  }
}

export function rememberCriteria(c: SearchCriteria) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(c));
  } catch {
    /* ignore */
  }
}

export function criteriaToParams(c: SearchCriteria): URLSearchParams {
  const p = new URLSearchParams();
  if (c.city !== 'all') p.set('city', c.city);
  if (c.pickupLocationId !== 'any') p.set('pickup', c.pickupLocationId);
  if (c.returnLocationId !== 'same') p.set('return', c.returnLocationId);
  p.set('from', c.pickupAt);
  p.set('to', c.returnAt);
  p.set('age', String(c.driverAge));
  return p;
}

/** Search criteria from URL params, falling back to the last search in this tab, then to defaults. */
export function criteriaFromParams(params: URLSearchParams): SearchCriteria {
  {
    const last = stored();
    const def = defaultRange();
    const city = (params.get('city') ?? last.city ?? 'all') as CityId | 'all';
    const from = params.get('from') ?? last.pickupAt;
    const to = params.get('to') ?? last.returnAt;
    const age = Number(params.get('age') ?? last.driverAge ?? 30);
    return {
      city: ['tashkent', 'samarkand', 'all'].includes(city) ? city : 'all',
      pickupLocationId: params.get('pickup') ?? last.pickupLocationId ?? 'any',
      returnLocationId: params.get('return') ?? last.returnLocationId ?? 'same',
      pickupAt: from && isValidLocal(from) ? from : def.pickupAt,
      returnAt: to && isValidLocal(to) ? to : def.returnAt,
      driverAge: Number.isFinite(age) && age >= 18 && age <= 99 ? age : 30,
    };
  }
}

export function useSearchCriteria(): SearchCriteria {
  const [params] = useSearchParams();
  return useMemo(() => criteriaFromParams(params), [params]);
}
