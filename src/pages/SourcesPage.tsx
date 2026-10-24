import { useTranslation } from 'react-i18next';
import { providers } from '@/data/providers';
import { exchangeRates } from '@/data/exchangeRates';
import { Badge, ExternalLink } from '@/components/ui';
import { useLang } from '@/hooks/useLang';
import { useFormat } from '@/hooks/useMoney';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { formatNumber } from '@/utils/currency';

export default function SourcesPage() {
  const { t } = useTranslation();
  const { l, lang } = useLang();
  const f = useFormat();
  useDocumentTitle(t('sources.title'));

  return (
    <div className="container-page max-w-5xl py-8">
      <h1 className="text-3xl font-extrabold tracking-tight">{t('sources.title')}</h1>
      <p className="mt-2 muted">{t('sources.intro')}</p>

      <section className="card mt-6 p-5" aria-labelledby="rates">
        <h2 id="rates" className="text-lg font-bold">{t('sources.ratesTitle')}</h2>
        <p className="mt-1 text-sm muted">{t('sources.ratesBody', { date: f.date(exchangeRates.date) })}</p>
        <ul className="mt-3 grid gap-2 sm:grid-cols-3">
          {(['USD', 'EUR', 'RUB'] as const).map((c) => (
            <li key={c} className="rounded-xl bg-ink-100/70 p-3 text-sm dark:bg-ink-800/60">
              1 {c} = <span className="font-semibold">{formatNumber(exchangeRates.rates[c], lang, 2)} UZS</span>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs"><ExternalLink href={exchangeRates.source.url}>{exchangeRates.source.label}</ExternalLink></p>
      </section>

      <section className="card mt-6 p-5" aria-labelledby="prov">
        <h2 id="prov" className="text-lg font-bold">{t('sources.providersTitle')}</h2>
        <ul className="mt-4 divide-y divide-ink-200 dark:divide-ink-800" data-testid="providers-list">
          {providers.map((p) => (
            <li key={p.id} className="py-3">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold">{p.name}</p>
                <Badge>{t(`sources.kind.${p.kind}`)}</Badge>
                <Badge tone={p.termsKnown ? 'success' : 'warning'}>{p.termsKnown ? t('sources.termsKnown') : t('sources.termsUnknown')}</Badge>
              </div>
              {p.notes && <p className="mt-1 text-xs muted">{l(p.notes)}</p>}
              <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                <ExternalLink href={p.website}>{t('sources.website')}</ExternalLink>
                {p.sources
                  .filter((s) => s.url !== p.website)
                  .map((s) => <ExternalLink key={s.url} href={s.url}>{s.label}</ExternalLink>)}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <section className="card p-5" aria-labelledby="photos">
          <h2 id="photos" className="text-lg font-bold">{t('sources.photosTitle')}</h2>
          <p className="mt-2 text-sm muted">{t('sources.photosBody')}</p>
        </section>
        <section className="card p-5" aria-labelledby="mapd">
          <h2 id="mapd" className="text-lg font-bold">{t('sources.mapTitle')}</h2>
          <p className="mt-2 text-sm muted">{t('sources.mapBody')}</p>
        </section>
      </div>

      <section className="card mt-6 p-5" aria-labelledby="limits">
        <h2 id="limits" className="text-lg font-bold">{t('sources.limitsTitle')}</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm muted">
          <li>{t('sources.limits1')}</li>
          <li>{t('sources.limits2')}</li>
          <li>{t('sources.limits3')}</li>
          <li>{t('sources.limits4')}</li>
        </ul>
      </section>
    </div>
  );
}
