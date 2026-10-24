import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { FileCheck2 } from 'lucide-react';
import type { CustomerDetails, Vehicle } from '@/types';
import { dataService } from '@/services/api';
import { estimateStore } from '@/services/storage';
import { exchangeRates } from '@/data/exchangeRates';
import { BookingInputs } from '@/components/BookingInputs';
import { ReceiptView } from '@/components/ReceiptView';
import { CarImage } from '@/components/CarImage';
import { FieldError } from '@/components/FieldError';
import { EmptyState, Notice, Spinner } from '@/components/ui';
import { useBookingSelection } from '@/hooks/useBookingSelection';
import { useQuote } from '@/hooks/useQuote';
import { useReceiptModel } from '@/hooks/useReceiptModel';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { customerSchema, type CustomerFormValues } from '@/utils/schemas';
import { generateReference } from '@/utils/reference';
import { nowLocal } from '@/utils/dates';

export default function BookingPage() {
  const { slug = '' } = useParams();
  const { t } = useTranslation();
  useDocumentTitle(t('booking.title'));
  const [vehicle, setVehicle] = useState<Vehicle | null | undefined>(undefined);
  useEffect(() => {
    dataService.getVehicleBySlug(slug).then(setVehicle).catch(() => setVehicle(null));
  }, [slug]);

  if (vehicle === undefined) return <Spinner label={t('common.loading')} />;
  if (vehicle === null)
    return (
      <div className="container-page py-16">
        <EmptyState title={t('details.notFound')} action={<Link to="/cars" className="btn-primary">{t('common.viewAll')}</Link>} />
      </div>
    );
  return <BookingForm vehicle={vehicle} />;
}

function BookingForm({ vehicle }: { vehicle: Vehicle }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const editRef = params.get('ref');
  const existing = editRef ? estimateStore.get(editRef) : undefined;
  const { selection, update } = useBookingSelection(vehicle);
  const result = useQuote(selection);
  const [submitError, setSubmitError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: existing?.customer ?? { fullName: '', phone: '+998 ', email: '', licenseYears: 3, notes: '' },
    mode: 'onTouched',
  });

  if (!selection || !result) {
    return (
      <div className="container-page py-16">
        <Notice tone="warning">{t('booking.errors.noPrice')}</Notice>
      </div>
    );
  }

  const onSubmit = async (raw: CustomerFormValues) => {
    if (!result.quote.valid) {
      setSubmitError(true);
      return;
    }
    setSubmitting(true);
    const customer = customerSchema.parse(raw) as CustomerDetails;
    const reference = editRef ?? generateReference();
    try {
      await dataService.submitBookingRequest({ reference, selection, customer, quote: result.quote });
      estimateStore.save({
        reference,
        createdAt: existing?.createdAt ?? nowLocal(),
        selection,
        customer,
        quote: result.quote,
        rateDate: exchangeRates.date,
      });
      navigate(`/receipt/${reference}`);
    } catch {
      setSubmitError(true);
      setSubmitting(false);
    }
  };

  const field = (name: keyof CustomerFormValues, label: string, type = 'text', extra: Record<string, unknown> = {}) => (
    <div>
      <label className="label" htmlFor={`c-${name}`}>{label}</label>
      <input
        id={`c-${name}`}
        type={type}
        className={`field ${errors[name] ? 'field-error' : ''}`}
        aria-invalid={Boolean(errors[name])}
        aria-describedby={errors[name] ? `c-${name}-err` : undefined}
        {...register(name)}
        {...extra}
      />
      <FieldError id={`c-${name}-err`} message={errors[name]?.message} />
    </div>
  );

  return (
    <div className="container-page py-8">
      <h1 className="text-3xl font-extrabold tracking-tight">{t('booking.title')}</h1>
      <p className="mt-1 muted">{t('booking.subtitle')}</p>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1fr]">
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6" data-testid="booking-form">
          <section className="card flex items-center gap-4 p-4" aria-label={t('booking.vehicle')}>
            <CarImage file={vehicle.images[0].file} alt="" width={320} className="h-20 w-28 shrink-0 rounded-xl" />
            <div className="min-w-0 flex-1">
              <p className="label !mb-0">{t('booking.vehicle')}</p>
              <p className="font-bold">{vehicle.make} {vehicle.model}</p>
              <p className="text-xs muted">{vehicle.generation}</p>
            </div>
            <Link to={`/cars/${vehicle.slug}?${params}`} className="btn-ghost shrink-0">{t('booking.changeCar')}</Link>
          </section>

          <section className="card p-5">
            <BookingInputs vehicle={vehicle} selection={selection} quote={result.quote} onChange={update} idPrefix="b" />
          </section>

          <section className="card space-y-4 p-5" aria-labelledby="cust">
            <h2 id="cust" className="text-lg font-bold">{t('booking.customer')}</h2>
            {field('fullName', t('booking.fullName'), 'text', { autoComplete: 'name' })}
            <div className="grid gap-4 sm:grid-cols-2">
              {field('phone', t('booking.phone'), 'tel', { autoComplete: 'tel' })}
              {field('email', t('booking.email'), 'email', { autoComplete: 'email' })}
            </div>
            {field('licenseYears', t('booking.licenseYears'), 'number', { min: 0, max: 80 })}
            <div>
              <label className="label" htmlFor="c-notes">{t('booking.notes')}</label>
              <textarea id="c-notes" rows={3} className="field" {...register('notes')} />
            </div>
          </section>

          <Notice tone="warning">{t('booking.notConfirmedNotice')}</Notice>
          {submitError && !result.quote.valid && <Notice tone="warning">{t('booking.errors.fixBeforeConfirm')}</Notice>}
          <button type="submit" className="btn-primary w-full py-3 text-base" disabled={submitting} data-testid="confirm-booking">
            <FileCheck2 className="h-5 w-5" aria-hidden />
            {t('booking.confirm')}
          </button>
        </form>

        <div className="lg:sticky lg:top-24 lg:self-start">
          <p className="mb-2 text-sm font-semibold">{t('booking.liveSummary')}</p>
          <LiveReceipt input={{ quote: result.quote, selection, vehicle, offer: result.offer, provider: result.provider, reference: editRef ?? undefined }} />
        </div>
      </div>
    </div>
  );
}

function LiveReceipt({ input }: { input: Parameters<typeof useReceiptModel>[0] }) {
  const model = useReceiptModel(input);
  return <ReceiptView model={model} compact />;
}
