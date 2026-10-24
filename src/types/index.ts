export type Lang = 'uz' | 'ru' | 'en';

/** Text shown to users that comes from the data layer rather than the UI dictionary. */
export type LocalizedText = Record<Lang, string>;

export type Currency = 'UZS' | 'USD' | 'EUR' | 'RUB';

export type CityId = 'tashkent' | 'samarkand';

export type VehicleCategory = 'economy' | 'sedan' | 'suv' | 'premium' | 'minivan';

export type Transmission = 'manual' | 'automatic';

export type FuelType = 'petrol' | 'diesel' | 'hybrid';

export type ProviderKind = 'local' | 'international' | 'aggregator';

/** A web source that a fact was taken from. */
export interface SourceRef {
  label: string;
  url: string;
}

/**
 * "exact" coordinates were taken from a published, citable source.
 * "approximate" means only the address (or only the city) is known: the marker
 * shows a reference point and the map draws a circle with `radiusM`.
 */
export interface PickupLocation {
  id: string;
  providerId: string;
  city: CityId;
  name: LocalizedText;
  /** The address exactly as published by the provider, or null if none is published. */
  address: string | null;
  lat: number;
  lng: number;
  precision: 'exact' | 'approximate';
  radiusM?: number;
  coordinateSource: LocalizedText;
  hours?: string;
  notes?: LocalizedText;
  sources: SourceRef[];
}

export interface ExtraOption {
  id: 'childSeat' | 'additionalDriver' | 'gps' | 'delivery';
  /** null = offered, but the provider does not publish a price. */
  priceUZS: number | null;
  unit: 'perDay' | 'perRental';
  note?: LocalizedText;
  source: SourceRef;
}

export interface BillingPolicy {
  /** Minimum billable rental length in hours. */
  minHours: number;
  /** Late-return allowance before another day is billed. */
  graceMinutes: number;
  /** True when the provider publishes the grace period/minimum; false = our conservative assumption. */
  published: boolean;
  explanation: LocalizedText;
}

export interface Provider {
  id: string;
  name: string;
  kind: ProviderKind;
  website: string;
  /** Can the booking calculator produce an itemised estimate for this provider? */
  termsKnown: boolean;
  minDriverAge: number | null;
  minLicenseYears: number | null;
  mileageLimitKmPerDay: number | null;
  extraKmFeeUZS: string | null;
  insurance: LocalizedText | null;
  depositPolicy: LocalizedText | null;
  depositRequiredAtPickup: boolean | null;
  billing: BillingPolicy;
  extras: ExtraOption[];
  /** Mandatory fees the provider publishes (none found so far). */
  mandatoryFees: { label: LocalizedText; amountUZS: number }[];
  paymentNote: LocalizedText;
  notes?: LocalizedText;
  sources: SourceRef[];
}

export interface PriceTier {
  minDays: number;
  /** Inclusive upper bound; null = no upper bound. */
  maxDays: number | null;
  price: number;
}

export type RateType = 'daily' | 'dailyFrom' | 'aggregatorDaily';

export type OfferStatus =
  /** A numeric price was published on the source page and recorded. */
  | 'observed'
  /** The provider does not expose a usable price for this model. */
  | 'requiresConfirmation';

/** One provider's published price for a vehicle model — reference data, never a live quote. */
export interface PriceOffer {
  id: string;
  vehicleId: string;
  providerId: string;
  locationId: string;
  status: OfferStatus;
  rateType: RateType;
  /** Price in the source's own currency, per day. null when status is requiresConfirmation. */
  price: number | null;
  currency: Currency;
  /** Long-term or tiered daily prices published by the provider (same currency). */
  tiers?: PriceTier[];
  /** "Chevrolet Cobalt" / "Kia Sportage or similar" — the exact label used by the source. */
  listedAs: string;
  /** True when the source lists a car class ("or similar") rather than this exact model. */
  comparableOnly?: boolean;
  modelYear?: string;
  depositUZS?: number | null;
  depositOriginal?: { amount: number; currency: Currency };
  mileage?: LocalizedText;
  minRentalDays?: number;
  includes?: LocalizedText;
  notes?: LocalizedText;
  sourceName: string;
  sourceUrl: string;
  /** ISO date when this data point was checked. */
  dateChecked: string;
}

export interface VehicleImage {
  /** Wikimedia Commons file name (without the "File:" prefix). */
  file: string;
  caption: LocalizedText;
}

export interface VehicleVideo {
  youtubeId: string;
  title: string;
  channel: string;
  published: string;
  sourceUrl: string;
}

export interface Vehicle {
  id: string;
  slug: string;
  make: string;
  model: string;
  /** Generation / body code, e.g. "G30", "M300". */
  generation: string;
  category: VehicleCategory;
  transmissions: Transmission[];
  fuel: FuelType;
  engine: string;
  seats: number;
  doors: number;
  /** Boot volume in litres (manufacturer data), null when not published. */
  luggageLiters: number | null;
  specNote: LocalizedText;
  description: LocalizedText;
  images: VehicleImage[];
  /** Commons category to browse for more photos at runtime (only categories confirmed to exist). */
  commonsCategory?: string;
  video: VehicleVideo | null;
  /** Where to look for official videos when none is verified. */
  videoSearchUrl: string;
  /** Recommended order on the home page (lower is shown first). */
  recommendedRank: number;
  /** Shown in "Popular cars" on the home page. */
  popular: boolean;
  specSources: SourceRef[];
}

export interface ExchangeRates {
  /** UZS per 1 unit of currency. */
  rates: Record<Currency, number>;
  date: string;
  source: SourceRef;
}

export interface SearchCriteria {
  city: CityId | 'all';
  pickupLocationId: string | 'any';
  returnLocationId: string | 'same';
  pickupAt: string; // ISO local datetime "YYYY-MM-DDTHH:mm"
  returnAt: string;
  driverAge: number;
}

export interface CarFilters {
  city: CityId | 'all';
  priceMin: number;
  priceMax: number;
  categories: VehicleCategory[];
  transmissions: Transmission[];
  fuels: FuelType[];
  minSeats: number;
  /** Only show cars bookable for the selected dates (minimum rental period, provider live availability). */
  availability: 'any' | 'bookableForDates' | 'confirmedOnly';
  sort: 'recommended' | 'priceAsc' | 'priceDesc';
}

export interface BookingSelection {
  vehicleId: string;
  offerId: string;
  pickupLocationId: string;
  returnLocationId: string;
  pickupAt: string;
  returnAt: string;
  extras: Partial<Record<ExtraOption['id'], number>>; // quantity (0/1 for most, count for child seats)
  driverAge: number;
}

export interface CustomerDetails {
  fullName: string;
  phone: string;
  email: string;
  licenseYears: number;
  notes?: string;
}

export type LineKind = 'rental' | 'extra' | 'delivery' | 'fee' | 'discount';

export interface ReceiptLine {
  kind: LineKind;
  labelKey: string;
  labelParams?: Record<string, string | number>;
  quantity?: number;
  unitPriceUZS?: number;
  amountUZS: number | null; // null = price requires confirmation
}

export interface Quote {
  valid: boolean;
  errors: string[]; // i18n keys
  warnings: { key: string; params?: Record<string, string | number> }[];
  durationMinutes: number;
  billableDays: number;
  baseDailyRateUZS: number;
  appliedDailyRateUZS: number;
  rentalSubtotalUZS: number;
  extrasTotalUZS: number;
  deliveryUZS: number;
  feesUZS: number;
  discountUZS: number;
  totalRentalCostUZS: number;
  depositUZS: number | null;
  dueAtPickupUZS: number;
  dueOnlineUZS: number;
  lines: ReceiptLine[];
  unpricedItems: string[]; // i18n keys of items whose price must be confirmed
  sourceCurrency: Currency;
  originalDailyRate: number;
}

export interface SavedEstimate {
  reference: string;
  createdAt: string;
  selection: BookingSelection;
  customer: CustomerDetails;
  quote: Quote;
  rateDate: string;
}
