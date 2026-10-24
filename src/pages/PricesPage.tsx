import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { vehicles } from '@/data/vehicles';
import { cities } from '@/data/locations';
import { exchangeRates, PRICE_CHECK_DATE } from '@/data/exchangeRates';
import { CompareSummary, CompareTable } from '@/components/CompareTable';
import { CarImage } from '@/components/CarImage';
import { useLang } from '@/hooks/useLang';
import { useFormat } from '@/hooks/useMoney';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { formatNumber } from '@/utils/currency';
import type { CityId } from '@/types';

export default function PricesPage() {
  const { t } = useTranslation();
  const { l, lang } = useLang();
  const f = useFormat();
  useDocumentTitle(t('compare.title'));
  const [city, setCity] = useState<CityId | 'all'>('all');
  const list = [...vehicles].sort((a, b) => a.recommendedRank - b.recommendedRank);

  return (
    <div className="container-page py-8">
      <h1 className="text-3xl font-extrabold tracking-tight">{t('compare.title')}</h1>
      <p className="mt-2 max-w-3xl muted">{t('compare.subtitle')}</p>

      <section className="card mt-6 p-5" aria-labelledby="method">
        <h2 id="method" className="font-bold">{t('compare.methodTitle')}</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm muted">
          <li>{t('compare.method1', { date: f.date(PRICE_CHECK_DATE) })}</li>
          <li>
            {t('compare.method2', {
              rateDate: f.date(exchangeRates.date),
              usd: formatNumber(exchangeRates.rates.USD, lang, 2),
              eur: formatNumber(exchangeRates.rates.EUR, lang, 2),
              rub: formatNumber(exchangeRates.rates.RUB, lang, 2),
            })}
          </li>
          <li>{t('compare.method3')}</li>
          <li>{t('compare.method4')}</li>
        </ul>
      </section>

      <div className="mt-6 flex flex-wrap items-center gap-2" role="group" aria-label={t('compare.cityFilter')}>
        {(['all', 'tashkent', 'samarkand'] as const).map((c) => (
          <button
            key={c}
            type="button"
            aria-pressed={city === c}
            onClick={() => setCity(c)}
            className={`rounded-full border px-3 py-1 text-sm ${city === c ? 'border-accent-500 bg-accent-500/15 font-semibold' : 'border-ink-200 dark:border-ink-700'}`}
            data-testid={`prices-city-${c}`}
          >
            {c === 'all' ? t('search.allCities') : l(cities[c].name)}
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-8">
        {list.map((v) => (
          <section key={v.id} className="card p-5" aria-labelledby={`p-${v.id}`}>
            <div className="mb-4 flex items-center gap-4">
              <CarImage file={v.images[0].file} alt="" width={240} className="h-14 w-20 shrink-0 rounded-lg" />
              <div className="min-w-0 flex-1">
                <h2 id={`p-${v.id}`} className="text-lg font-bold">{v.make} {v.model}</h2>
                <p className="text-xs muted">{t(`categories.${v.category}`)} · {v.generation}</p>
              </div>
              <Link to={`/cars/${v.slug}`} className="btn-ghost shrink-0">{t('car.viewDetails')}</Link>
            </div>
            <CompareSummary vehicleId={v.id} city={city} />
            <div className="mt-4">
              <CompareTable vehicleId={v.id} city={city} initialRows={4} />
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
