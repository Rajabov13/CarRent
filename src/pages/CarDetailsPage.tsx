import { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, ChevronRight } from 'lucide-react';
import type { CityId, Vehicle } from '@/types';
import { dataService } from '@/services/api';
import { cities } from '@/data/locations';
import { Gallery } from '@/components/Gallery';
import { VideoEmbed } from '@/components/VideoEmbed';
import { CompareSummary, CompareTable } from '@/components/CompareTable';
import { BookingInputs } from '@/components/BookingInputs';
import { QuoteSummary } from '@/components/QuoteSummary';
import { ProviderTerms } from '@/components/ProviderTerms';
import { Badge, EmptyState, ExternalLink, Notice, Spinner } from '@/components/ui';
import { useLang } from '@/hooks/useLang';
import { useFormat } from '@/hooks/useMoney';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { selectionToParams, useBookingSelection } from '@/hooks/useBookingSelection';
import { useQuote } from '@/hooks/useQuote';
import { buildMapPoints } from '@/utils/mapPoints';
import { summarizeOffers } from '@/utils/offerStats';
import { exchangeRates, PRICE_CHECK_DATE } from '@/data/exchangeRates';
import { formatNumber } from '@/utils/currency';

const LocationsMap = lazy(() => import('@/components/LocationsMap'));

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section className="card p-5 sm:p-6" aria-labelledby={id}>
      <h2 id={id} className="mb-4 text-xl font-bold">{title}</h2>
      {children}
    </section>
  );
}

export default function CarDetailsPage() {
  const { slug = '' } = useParams();
  const { t } = useTranslation();
  const { l, lang } = useLang();
  const f = useFormat();
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState<Vehicle | null | undefined>(undefined);
  const [compareCity, setCompareCity] = useState<CityId | 'all'>('all');

  useEffect(() => {
    setVehicle(undefined);
    dataService.getVehicleBySlug(slug).then(setVehicle).catch(() => setVehicle(null));
  }, [slug]);

  const { selection, update } = useBookingSelection(vehicle ?? null);
  const result = useQuote(selection);
  const mapPoints = useMemo(() => (vehicle ? buildMapPoints([vehicle.id]) : []), [vehicle]);
  useDocumentTitle(vehicle ? `${vehicle.make} ${vehicle.model}` : '');

  if (vehicle === undefined) return <Spinner label={t('common.loading')} />;
  if (vehicle === null) {
    return (
      <div className="container-page py-16">
        <EmptyState title={t('details.notFound')} action={<Link to="/cars" className="btn-primary">{t('common.viewAll')}</Link>} />
      </div>
    );
  }

  const summary = summarizeOffers(vehicle.id);
  const name = `${vehicle.make} ${vehicle.model}`;

  const specs = [
    { label: t('specs.generation'), value: vehicle.generation },
    { label: t('specs.transmission'), value: vehicle.transmissions.map((x) => t(`specs.${x}`)).join(' / ') },
    { label: t('specs.fuel'), value: t(`specs.${vehicle.fuel}`) },
    { label: t('specs.engine'), value: vehicle.engine === '—' ? t('common.notPublished') : vehicle.engine },
    { label: t('specs.seats'), value: String(vehicle.seats) },
    { label: t('specs.doors'), value: String(vehicle.doors) },
    { label: t('specs.luggage'), value: vehicle.luggageLiters ? t('specs.liters', { n: vehicle.luggageLiters }) : t('common.notPublished') },
    { label: t('specs.modelYear'), value: result?.offer.modelYear ?? t('specs.yearNotVerified') },
  ];

  const goBook = () => {
    if (!selection) return;
    navigate(`/booking/${vehicle.slug}?${selectionToParams(selection)}`);
  };

  return (
    <div className="container-page py-8">
      <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1 text-sm muted">
        <Link to="/" className="hover:underline">{t('nav.home')}</Link>
        <ChevronRight className="h-3.5 w-3.5" aria-hidden />
        <Link to="/cars" className="hover:underline">{t('details.breadcrumbCars')}</Link>
        <ChevronRight className="h-3.5 w-3.5" aria-hidden />
        <span aria-current="page" className="text-ink-900 dark:text-ink-100">{name}</span>
      </nav>

      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex flex-wrap gap-2">
            <Badge tone="accent">{t(`categories.${vehicle.category}`)}</Badge>
            <Badge tone="warning">{t('car.availabilityOnRequest')}</Badge>
            {summary.cities.map((c) => <Badge key={c} tone="info">{l(cities[c].name)}</Badge>)}
          </div>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">{name}</h1>
          <p className="mt-1 muted">{vehicle.generation}</p>
        </div>
        {summary.lowest && (
          <div className="text-right">
            <p className="text-xs muted">{t('car.lowestObserved')}</p>
            <p className="text-2xl font-bold">{t('common.fromAmount', { price: f.uzs(summary.lowest.uzs) })}</p>
            <p className="text-xs muted">{t('common.perDay')} · {t('common.checkedOn', { date: f.date(PRICE_CHECK_DATE) })}</p>
          </div>
        )}
      </header>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_380px]">
        <div className="min-w-0 space-y-8">
          <Gallery vehicle={vehicle} />

          <Section id="about" title={t('details.about')}>
            <p>{l(vehicle.description)}</p>
            <h3 className="mb-3 mt-6 font-semibold">{t('specs.title')}</h3>
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4" data-testid="specs">
              {specs.map((s) => (
                <div key={s.label} className="rounded-xl bg-ink-100/70 p-3 dark:bg-ink-800/60">
                  <dt className="text-xs muted">{s.label}</dt>
                  <dd className="mt-0.5 text-sm font-semibold">{s.value}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-3 text-xs muted">{l(vehicle.specNote)}</p>
            <p className="mt-1 flex flex-wrap gap-x-3 text-xs">
              <span className="muted">{t('specs.sources')}:</span>
              {vehicle.specSources.map((s) => <ExternalLink key={s.url} href={s.url}>{s.label}</ExternalLink>)}
            </p>
          </Section>

          <Section id="video" title={t('details.video')}>
            <VideoEmbed vehicle={vehicle} />
          </Section>

          <Section id="prices" title={t('details.priceComparison')}>
            <div className="mb-4 flex flex-wrap items-center gap-2" role="group" aria-label={t('compare.cityFilter')}>
              {(['all', ...summary.cities] as const).map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-pressed={compareCity === c}
                  onClick={() => setCompareCity(c)}
                  className={`rounded-full border px-3 py-1 text-sm ${compareCity === c ? 'border-accent-500 bg-accent-500/15 font-semibold' : 'border-ink-200 dark:border-ink-700'}`}
                >
                  {c === 'all' ? t('search.allCities') : l(cities[c].name)}
                </button>
              ))}
            </div>
            <CompareSummary vehicleId={vehicle.id} city={compareCity} />
            <div className="mt-5">
              <CompareTable vehicleId={vehicle.id} city={compareCity} selectedOfferId={selection?.offerId} onSelect={(o) => update({ offerId: o.id })} />
            </div>
            <div className="mt-4">
              <Notice>
                {t('compare.method1', { date: f.date(PRICE_CHECK_DATE) })}{' '}
                {t('compare.method2', {
                  rateDate: f.date(exchangeRates.date),
                  usd: formatNumber(exchangeRates.rates.USD, lang, 2),
                  eur: formatNumber(exchangeRates.rates.EUR, lang, 2),
                  rub: formatNumber(exchangeRates.rates.RUB, lang, 2),
                })}{' '}
                <Link to="/sources" className="link">{t('nav.sources')}</Link>
              </Notice>
            </div>
          </Section>

          <Section id="map" title={t('details.pickupMap')}>
            <Suspense fallback={<Spinner label={t('common.loading')} />}>
              <LocationsMap points={mapPoints} className="h-[420px]" />
            </Suspense>
            <p className="mt-3 text-xs muted">{t('map.approximateNote')}</p>
          </Section>

          {result && (
            <Section id="terms" title={t('details.rentalTerms')}>
              <ProviderTerms provider={result.provider} offer={result.offer} />
            </Section>
          )}
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start" aria-label={t('details.bookingPanel')}>
          <div className="card p-5">
            <h2 className="mb-4 text-lg font-bold">{t('details.bookingPanel')}</h2>
            {selection && result ? (
              <div className="space-y-4">
                <BookingInputs vehicle={vehicle} selection={selection} quote={result.quote} onChange={update} idPrefix="d" showAge={false} />
                <QuoteSummary quote={result.quote} />
                <button type="button" className="btn-primary w-full py-3 text-base" onClick={goBook} disabled={!result.quote.valid} data-testid="book-this-car">
                  {t('details.bookThisCar')}
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </button>
                <p className="text-center text-xs muted">{t('details.estimateNote')}</p>
              </div>
            ) : (
              <Notice tone="warning">{t('booking.errors.noPrice')}</Notice>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
