import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Trash2 } from 'lucide-react';
import { estimateStore } from '@/services/storage';
import { vehicleById } from '@/data/vehicles';
import { offerById } from '@/data/offers';
import { providerById } from '@/data/providers';
import { CarImage } from '@/components/CarImage';
import { EmptyState, Notice } from '@/components/ui';
import { useFormat } from '@/hooks/useMoney';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

export default function AccountPage() {
  const { t } = useTranslation();
  const f = useFormat();
  useDocumentTitle(t('account.title'));
  const [items, setItems] = useState(() => estimateStore.list());

  return (
    <div className="container-page max-w-4xl py-8">
      <h1 className="text-3xl font-extrabold tracking-tight">{t('account.title')}</h1>
      <div className="mt-4">
        <Notice>{t('account.subtitle')}</Notice>
      </div>
      <div className="mt-6">
        {items.length === 0 ? (
          <EmptyState title={t('account.empty')} action={<Link to="/cars" className="btn-primary">{t('account.browse')}</Link>} />
        ) : (
          <ul className="space-y-3" data-testid="saved-estimates">
            {items.map((e) => {
              const v = vehicleById.get(e.selection.vehicleId);
              const o = offerById.get(e.selection.offerId);
              return (
                <li key={e.reference} className="card flex flex-wrap items-center gap-4 p-4">
                  {v && <CarImage file={v.images[0].file} alt="" width={240} className="h-16 w-24 shrink-0 rounded-lg" />}
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-sm font-semibold">{e.reference}</p>
                    <p className="font-bold">{v ? `${v.make} ${v.model}` : '—'}</p>
                    <p className="text-xs muted">
                      {o && providerById.get(o.providerId)?.name} · {f.dateTime(e.selection.pickupAt)} → {f.dateTime(e.selection.returnAt)}
                    </p>
                    <p className="text-xs muted">{t('account.created', { date: f.dateTime(e.createdAt) })}</p>
                  </div>
                  <p className="font-bold tabular-nums">{f.uzs(e.quote.totalRentalCostUZS)}</p>
                  <div className="flex gap-2">
                    <Link to={`/receipt/${e.reference}`} className="btn-dark">{t('account.open')}</Link>
                    <button
                      type="button"
                      className="btn-ghost"
                      aria-label={`${t('account.delete')} ${e.reference}`}
                      onClick={() => {
                        estimateStore.remove(e.reference);
                        setItems(estimateStore.list());
                      }}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
