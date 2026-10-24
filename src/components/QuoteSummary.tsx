import { useTranslation } from 'react-i18next';
import type { Quote } from '@/types';
import { useFormat } from '@/hooks/useMoney';
import { Badge } from './ui';

/** Compact live estimate shown beside the booking inputs on the car page. */
export function QuoteSummary({ quote }: { quote: Quote }) {
  const { t } = useTranslation();
  const f = useFormat();
  const rows = [
    { label: `${t('receipt.dailyPrice')} × ${t('common.day', { count: quote.billableDays })}`, value: f.uzs(quote.rentalSubtotalUZS) },
    ...(quote.extrasTotalUZS ? [{ label: t('receipt.extrasTotal'), value: f.uzs(quote.extrasTotalUZS) }] : []),
    ...(quote.deliveryUZS ? [{ label: t('receipt.delivery'), value: f.uzs(quote.deliveryUZS) }] : []),
    ...(quote.discountUZS ? [{ label: t('receipt.discount'), value: `− ${f.uzs(quote.discountUZS)}` }] : []),
  ];
  return (
    <div className="rounded-xl bg-ink-100/70 p-4 dark:bg-ink-800/60" aria-live="polite" data-testid="quote-summary">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-semibold">{t('booking.liveSummary')}</p>
        <Badge tone="warning">{t('booking.estimateBadge')}</Badge>
      </div>
      {quote.valid ? (
        <dl className="space-y-1 text-sm">
          {rows.map((r) => (
            <div key={r.label} className="flex justify-between gap-3">
              <dt className="muted">{r.label}</dt>
              <dd className="tabular-nums">{r.value}</dd>
            </div>
          ))}
          <div className="flex justify-between gap-3 border-t border-ink-200 pt-2 font-bold dark:border-ink-700">
            <dt>{t('receipt.totalRentalCost')}</dt>
            <dd className="tabular-nums" data-testid="quote-total">{f.uzs(quote.totalRentalCostUZS)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="muted">{t('receipt.deposit')}</dt>
            <dd className="tabular-nums">{quote.depositUZS === null ? t('receipt.depositUnknown') : f.uzs(quote.depositUZS)}</dd>
          </div>
          <div className="flex justify-between gap-3 font-semibold">
            <dt>{t('receipt.dueAtPickup')}</dt>
            <dd className="tabular-nums">{f.uzs(quote.dueAtPickupUZS)}</dd>
          </div>
        </dl>
      ) : (
        <ul className="space-y-1 text-sm text-red-700 dark:text-red-300" role="alert">
          {quote.errors.map((e) => (
            <li key={e}>{t(e)}</li>
          ))}
        </ul>
      )}
      {quote.warnings.length > 0 && (
        <ul className="mt-3 space-y-1 text-xs text-amber-800 dark:text-amber-300">
          {quote.warnings.map((w) => (
            <li key={w.key}>• {t(w.key, w.params)}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
