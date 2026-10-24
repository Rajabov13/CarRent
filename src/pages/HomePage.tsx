import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  BadgeCheck,
  Calculator,
  CarFront,
  ChevronDown,
  ClipboardCheck,
  Crown,
  Languages,
  Receipt,
  Scale,
  Search,
  ShieldCheck,
  Star,
  Truck,
  Users,
} from 'lucide-react';
import { vehicles } from '@/data/vehicles';
import { PRICE_CHECK_DATE, exchangeRates } from '@/data/exchangeRates';
import { sampleReviews } from '@/data/sampleReviews';
import { providerById } from '@/data/providers';
import { vehicleById } from '@/data/vehicles';
import { CarCard } from '@/components/CarCard';
import { CarImage } from '@/components/CarImage';
import { SearchForm } from '@/components/SearchForm';
import { Badge, SectionHeading } from '@/components/ui';
import { useLang } from '@/hooks/useLang';
import { useFormat } from '@/hooks/useMoney';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { longTermDeals } from '@/utils/offerStats';
import { toUZS } from '@/utils/currency';
import { commonsPageUrl } from '@/utils/images';
import type { VehicleCategory } from '@/types';

const HERO_FILE = 'BMW_G30_530i_xDrive_M_Sport_Carbon_Black_(10).jpg';

const categoryIcons: Record<VehicleCategory, typeof CarFront> = {
  economy: CarFront,
  sedan: CarFront,
  suv: Truck,
  premium: Crown,
  minivan: Users,
};

export default function HomePage() {
  const { t } = useTranslation();
  const { l } = useLang();
  const f = useFormat();
  useDocumentTitle('');

  const popular = vehicles.filter((v) => v.popular).sort((a, b) => a.recommendedRank - b.recommendedRank);
  const deals = longTermDeals();
  const categories: VehicleCategory[] = ['economy', 'sedan', 'suv', 'premium', 'minivan'];

  return (
    <>
      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-ink-950">
        <div className="absolute inset-0 -z-10">
          <CarImage file={HERO_FILE} alt="BMW 5 Series (G30)" width={1920} eager decorative className="h-full w-full !bg-ink-950" />
        </div>
        <div className="absolute inset-0 -z-10 bg-ink-950/60" aria-hidden />
        <div className="container-page pb-40 pt-20 sm:pb-44 sm:pt-28">
          <Badge tone="accent" className="!bg-accent-500/20 !text-accent-300">
            <BadgeCheck className="h-3.5 w-3.5" aria-hidden />
            {t('hero.badge', { date: f.date(PRICE_CHECK_DATE) })}
          </Badge>
          <h1 className="mt-5 max-w-3xl text-4xl font-extrabold tracking-tight text-white sm:text-6xl">{t('hero.title')}</h1>
          <p className="mt-5 max-w-2xl text-base text-ink-200 sm:text-lg">{t('hero.subtitle')}</p>
          <a href={commonsPageUrl(HERO_FILE)} target="_blank" rel="noopener noreferrer" className="mt-6 inline-block text-[11px] text-ink-300 underline-offset-2 hover:underline">
            {t('hero.photoCredit')}
          </a>
        </div>
      </section>

      {/* Search */}
      <section className="container-page relative z-10 -mt-28" aria-labelledby="search-title">
        <div className="card p-5 shadow-xl sm:p-6">
          <h2 id="search-title" className="mb-4 flex items-center gap-2 text-lg font-bold">
            <Search className="h-5 w-5 text-accent-600" aria-hidden />
            {t('search.title')}
          </h2>
          <SearchForm />
        </div>
      </section>

      {/* Popular */}
      <section className="container-page mt-20" aria-labelledby="popular">
        <SectionHeading
          id="popular"
          title={t('home.popularTitle')}
          subtitle={t('home.popularSubtitle')}
          action={<Link to="/cars" className="btn-ghost">{t('common.viewAll')}</Link>}
        />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {popular.map((v) => (
            <CarCard key={v.id} vehicle={v} />
          ))}
        </div>
      </section>

      {/* Deals */}
      {deals.length > 0 && (
        <section className="container-page mt-20" aria-labelledby="deals">
          <SectionHeading id="deals" title={t('home.dealsTitle')} subtitle={t('home.dealsSubtitle')} />
          <div className="grid gap-4 md:grid-cols-3">
            {deals.map(({ offer, tier, savingPct }) => {
              const v = vehicleById.get(offer.vehicleId)!;
              return (
                <Link key={offer.id} to={`/cars/${v.slug}?offer=${offer.id}`} className="card flex items-center gap-4 p-4 transition-shadow hover:shadow-md" data-testid="deal-card">
                  <CarImage file={v.images[0].file} alt="" width={320} className="h-20 w-28 shrink-0 rounded-xl" />
                  <div className="min-w-0">
                    <p className="font-bold">{v.make} {v.model}</p>
                    <p className="text-xs muted">{providerById.get(offer.providerId)?.name}</p>
                    <p className="mt-1 text-sm">
                      <span className="font-bold">{f.uzs(toUZS(tier.price, offer.currency))}</span>
                      <span className="muted"> / {t('common.perDay')} · </span>
                      <span className="muted">
                        {tier.maxDays ? t('home.dealDays', { min: tier.minDays, max: tier.maxDays }) : t('home.dealFrom', { days: tier.minDays })}
                      </span>
                    </p>
                    <Badge tone="success" className="mt-1">{t('home.dealSave', { pct: savingPct })}</Badge>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Categories */}
      <section className="container-page mt-20" aria-labelledby="categories">
        <SectionHeading id="categories" title={t('home.categoriesTitle')} />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {categories.map((c) => {
            const Icon = categoryIcons[c];
            const count = vehicles.filter((v) => v.category === c).length;
            return (
              <Link key={c} to={`/cars?cat=${c}`} className="card group p-5 transition-shadow hover:shadow-md" data-testid={`category-${c}`}>
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-500/15 text-accent-700 dark:text-accent-300">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <p className="mt-4 font-bold">{t(`categories.${c}`)}</p>
                <p className="text-xs muted">{t(`categories.${c}Desc`)}</p>
                <p className="mt-2 text-xs font-medium text-accent-700 dark:text-accent-400">{t('home.categoryCount', { count })}</p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="container-page mt-20 scroll-mt-24" aria-labelledby="how-title">
        <SectionHeading id="how-title" title={t('home.howTitle')} />
        <ol className="grid gap-4 md:grid-cols-4">
          {[
            { icon: Search, k: 's1' },
            { icon: Scale, k: 's2' },
            { icon: Calculator, k: 's3' },
            { icon: ClipboardCheck, k: 's4' },
          ].map(({ icon: Icon, k }, i) => (
            <li key={k} className="card p-5">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ink-950 text-sm font-bold text-white dark:bg-white dark:text-ink-950">{i + 1}</span>
                <Icon className="h-5 w-5 text-accent-600" aria-hidden />
              </div>
              <p className="mt-4 font-bold">{t(`home.how.${k}t`)}</p>
              <p className="mt-1 text-sm muted">{t(`home.how.${k}d`)}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Why */}
      <section className="mt-20 bg-white py-16 dark:bg-ink-900" aria-labelledby="why">
        <div className="container-page">
          <SectionHeading id="why" title={t('home.whyTitle')} />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: BadgeCheck, k: 'w1' },
              { icon: Receipt, k: 'w2' },
              { icon: ShieldCheck, k: 'w3' },
              { icon: Languages, k: 'w4' },
            ].map(({ icon: Icon, k }) => (
              <div key={k}>
                <Icon className="h-7 w-7 text-accent-600" aria-hidden />
                <p className="mt-3 font-bold">{t(`home.why.${k}t`)}</p>
                <p className="mt-1 text-sm muted">{t(`home.why.${k}d`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews (sample) */}
      <section className="container-page mt-20" aria-labelledby="reviews">
        <SectionHeading id="reviews" title={t('home.reviewsTitle')} subtitle={t('home.reviewsNotice')} />
        <div className="grid gap-4 md:grid-cols-3">
          {sampleReviews.map((r) => (
            <figure key={r.id} className="card relative p-5" data-testid="sample-review">
              <Badge tone="warning" className="absolute right-4 top-4">{t('common.sampleContent')}</Badge>
              <div className="flex gap-0.5" aria-label={`${r.rating}/5`}>
                {Array.from({ length: 5 }, (_, i) => (
                  <Star key={i} className={`h-4 w-4 ${i < r.rating ? 'fill-accent-500 text-accent-500' : 'text-ink-300 dark:text-ink-600'}`} aria-hidden />
                ))}
              </div>
              <blockquote className="mt-3 text-sm">“{l(r.text)}”</blockquote>
              <figcaption className="mt-3 text-xs muted">
                {r.name} · {l(r.city)}
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="container-page mt-20 scroll-mt-24" aria-labelledby="faq-title">
        <SectionHeading id="faq-title" title={t('home.faqTitle')} />
        <div className="mx-auto max-w-3xl divide-y divide-ink-200 rounded-2xl border border-ink-200 bg-white dark:divide-ink-800 dark:border-ink-800 dark:bg-ink-900">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <details key={n} className="group p-5" data-testid="faq-item">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
                {t(`home.faq.q${n}`)}
                <ChevronDown className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180" aria-hidden />
              </summary>
              <p className="mt-3 text-sm muted">
                {t(`home.faq.a${n}`, { date: f.date(n === 6 ? exchangeRates.date : PRICE_CHECK_DATE) })}
              </p>
            </details>
          ))}
        </div>
      </section>
    </>
  );
}
