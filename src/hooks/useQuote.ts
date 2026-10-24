import { useMemo } from 'react';
import { offerById } from '@/data/offers';
import { providerById } from '@/data/providers';
import { computeQuote } from '@/utils/pricing';
import type { BookingSelection } from '@/types';

/** Recomputes the itemised estimate whenever any booking input changes. */
export function useQuote(selection: BookingSelection | null) {
  return useMemo(() => {
    if (!selection) return null;
    const offer = offerById.get(selection.offerId);
    const provider = offer && providerById.get(offer.providerId);
    if (!offer || !provider) return null;
    return { offer, provider, quote: computeQuote({ selection, offer, provider }) };
  }, [selection]);
}
