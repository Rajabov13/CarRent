import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, Download, Pencil, Printer } from 'lucide-react';
import { estimateStore } from '@/services/storage';
import { vehicleById } from '@/data/vehicles';
import { offerById } from '@/data/offers';
import { providerById } from '@/data/providers';
import { ReceiptView } from '@/components/ReceiptView';
import { EmptyState, Notice } from '@/components/ui';
import { useReceiptModel } from '@/hooks/useReceiptModel';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { selectionToParams } from '@/hooks/useBookingSelection';
import { computeQuote } from '@/utils/pricing';
import { downloadReceiptPdf } from '@/utils/pdf';
import type { SavedEstimate } from '@/types';

export default function ReceiptPage() {
  const { reference = '' } = useParams();
  const { t } = useTranslation();
  useDocumentTitle(`${t('receipt.title')} ${reference}`);
  const estimate = estimateStore.get(reference);
  const vehicle = estimate && vehicleById.get(estimate.selection.vehicleId);
  const offer = estimate && offerById.get(estimate.selection.offerId);
  const provider = offer && providerById.get(offer.providerId);

  if (!estimate || !vehicle || !offer || !provider) {
    return (
      <div className="container-page py-16">
        <EmptyState title={t('receipt.notFound')} action={<Link to="/account" className="btn-primary">{t('nav.account')}</Link>} />
      </div>
    );
  }
  return <Receipt estimate={estimate} />;
}

function Receipt({ estimate }: { estimate: SavedEstimate }) {
  const { t } = useTranslation();
  const [pdfBusy, setPdfBusy] = useState(false);
  const [pdfError, setPdfError] = useState(false);
  const vehicle = vehicleById.get(estimate.selection.vehicleId)!;
  const offer = offerById.get(estimate.selection.offerId)!;
  const provider = providerById.get(offer.providerId)!;
  // Recompute from the saved selection (the date check uses the creation time, so a past estimate stays valid).
  const quote = computeQuote({ selection: estimate.selection, offer, provider, now: estimate.createdAt });
  const model = useReceiptModel({
    quote,
    selection: estimate.selection,
    vehicle,
    offer,
    provider,
    reference: estimate.reference,
    issuedAt: estimate.createdAt,
    customer: estimate.customer,
  });

  const editUrl = `/booking/${vehicle.slug}?${selectionToParams(estimate.selection, { ref: estimate.reference })}`;

  const pdf = async () => {
    setPdfBusy(true);
    setPdfError(false);
    try {
      await downloadReceiptPdf(model, `${estimate.reference}.pdf`);
    } catch {
      setPdfError(true);
    } finally {
      setPdfBusy(false);
    }
  };

  return (
    <div className="container-page max-w-4xl py-8">
      <div className="no-print mb-6 space-y-4">
        <Notice>
          <span className="inline-flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4" aria-hidden />
            {t('receipt.savedNotice')}
          </span>
        </Notice>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-dark" onClick={() => window.print()} data-testid="print-receipt">
            <Printer className="h-4 w-4" aria-hidden />
            {t('receipt.print')}
          </button>
          <button type="button" className="btn-primary" onClick={pdf} disabled={pdfBusy} data-testid="download-pdf">
            <Download className="h-4 w-4" aria-hidden />
            {pdfBusy ? t('receipt.generatingPdf') : t('receipt.downloadPdf')}
          </button>
          <Link to={editUrl} className="btn-ghost" data-testid="edit-booking">
            <Pencil className="h-4 w-4" aria-hidden />
            {t('receipt.edit')}
          </Link>
        </div>
        {pdfError && <Notice tone="warning">{t('common.error')}</Notice>}
      </div>
      <ReceiptView model={model} />
    </div>
  );
}
