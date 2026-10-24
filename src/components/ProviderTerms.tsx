import { useTranslation } from 'react-i18next';
import type { PriceOffer, Provider } from '@/types';
import { useLang } from '@/hooks/useLang';
import { useFormat } from '@/hooks/useMoney';
import { ExternalLink } from './ui';

export function ProviderTerms({ provider, offer }: { provider: Provider; offer: PriceOffer }) {
  const { t } = useTranslation();
  const { l } = useLang();
  const f = useFormat();
  const np = t('common.notPublished');

  const deposit =
    offer.depositUZS !== undefined && offer.depositUZS !== null
      ? f.uzs(offer.depositUZS)
      : offer.depositOriginal
        ? f.money(offer.depositOriginal.amount, offer.depositOriginal.currency)
        : null;

  const rows: { label: string; value: string }[] = [
    { label: t('details.deposit'), value: [deposit, provider.depositPolicy ? l(provider.depositPolicy) : null].filter(Boolean).join(' — ') || np },
    {
      label: t('details.mileage'),
      value: offer.mileage ? l(offer.mileage) : provider.mileageLimitKmPerDay ? t('details.kmPerDay', { n: provider.mileageLimitKmPerDay }) : np,
    },
    { label: t('details.extraKm'), value: provider.extraKmFeeUZS ? t('details.uzsPerKm', { v: provider.extraKmFeeUZS }) : np },
    { label: t('details.insurance'), value: offer.includes ? l(offer.includes) : provider.insurance ? l(provider.insurance) : np },
    {
      label: t('details.minRental'),
      value: offer.minRentalDays ? t('common.day', { count: offer.minRentalDays }) : t('details.hours', { n: provider.billing.minHours }),
    },
    { label: t('details.minAge'), value: provider.minDriverAge ? t('details.ageValue', { count: provider.minDriverAge }) : np },
    { label: t('details.minLicense'), value: provider.minLicenseYears ? t('details.expValue', { count: provider.minLicenseYears }) : np },
    { label: t('details.billingRule'), value: l(provider.billing.explanation) },
    { label: t('details.payment'), value: l(provider.paymentNote) },
  ];
  if (provider.notes) rows.push({ label: t('details.providerNotes'), value: l(provider.notes) });

  return (
    <div data-testid="provider-terms">
      <p className="mb-3 text-sm font-semibold">{t('details.termsForProvider', { provider: provider.name })}</p>
      <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
        {rows.map((r) => (
          <div key={r.label}>
            <dt className="text-xs font-semibold uppercase tracking-wide muted">{r.label}</dt>
            <dd className="mt-0.5 text-sm">{r.value}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs">
        {provider.sources.map((s) => (
          <ExternalLink key={s.url} href={s.url}>{s.label}</ExternalLink>
        ))}
      </div>
    </div>
  );
}
