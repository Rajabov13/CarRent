import type { CityId, LocalizedText, PickupLocation, SourceRef } from '@/types';
import geocoded from './geocoded.json';

/*
 * Pickup locations.
 *
 * Addresses are copied from the providers' own pages or business directories.
 * Only the airport has coordinates from a citable source. Every other point is a
 * district- or city-level reference marker with a radius, flagged "approximate",
 * because the street address has not been geocoded against a verifiable source.
 * Run `npm run geocode` (scripts/geocode-locations.mjs) where Nominatim is
 * reachable to replace them with geocoded coordinates.
 */

export const cities: Record<CityId, { name: LocalizedText; center: [number, number]; zoom: number }> = {
  tashkent: {
    name: { uz: 'Toshkent', ru: 'Ташкент', en: 'Tashkent' },
    center: [41.3111, 69.2797],
    zoom: 12,
  },
  samarkand: {
    name: { uz: 'Samarqand', ru: 'Самарканд', en: 'Samarkand' },
    center: [39.6547, 66.9758],
    zoom: 13,
  },
};

const district = (uz: string, ru: string, en: string): LocalizedText => ({
  uz: `Taxminiy hudud: ${uz}. Manzil geokodlanmagan.`,
  ru: `Приблизительная зона: ${ru}. Адрес не геокодирован.`,
  en: `Approximate area: ${en}. The address has not been geocoded.`,
});

const cityWide = (cityUz: string, cityRu: string, cityEn: string): LocalizedText => ({
  uz: `Provayder manzil eʼlon qilmagan — ${cityUz} boʻylab xizmat koʻrsatish hududi koʻrsatilgan.`,
  ru: `Провайдер не публикует адрес — показана зона обслуживания: ${cityRu}.`,
  en: `The provider does not publish an address — the ${cityEn} service area is shown.`,
});

const airportSource: SourceRef = {
  label: 'Wikipedia — Tashkent International Airport',
  url: 'https://en.wikipedia.org/wiki/Tashkent_International_Airport',
};

const airport = (id: string, providerId: string, sources: SourceRef[]): PickupLocation => ({
  id,
  providerId,
  city: 'tashkent',
  name: {
    uz: 'Toshkent xalqaro aeroporti (TAS)',
    ru: 'Международный аэропорт Ташкент (TAS)',
    en: 'Tashkent International Airport (TAS)',
  },
  address: 'Islam Karimov Tashkent International Airport',
  lat: 41.2579,
  lng: 69.2812,
  precision: 'exact',
  coordinateSource: {
    uz: 'Aeroport koordinatalari: Wikipedia (41°15′28″N 69°16′52″E).',
    ru: 'Координаты аэропорта: Wikipedia (41°15′28″N 69°16′52″E).',
    en: 'Airport coordinates: Wikipedia (41°15′28″N 69°16′52″E).',
  },
  sources: [...sources, airportSource],
});

const tashkentArea = (id: string, providerId: string, sources: SourceRef[]): PickupLocation => ({
  id,
  providerId,
  city: 'tashkent',
  name: { uz: 'Toshkent (xizmat hududi)', ru: 'Ташкент (зона обслуживания)', en: 'Tashkent (service area)' },
  address: null,
  lat: 41.3111,
  lng: 69.2797,
  precision: 'approximate',
  radiusM: 7000,
  coordinateSource: cityWide('Toshkent', 'Ташкент', 'Tashkent'),
  sources,
});

export const locations: PickupLocation[] = [
  {
    id: 'inrent-tashkent',
    providerId: 'inrent',
    city: 'tashkent',
    name: { uz: 'Inrent — bosh ofis', ru: 'Inrent — главный офис', en: 'Inrent — main office' },
    address: 'Tashkent, Fidokor st. (formerly Chekhova), 10',
    lat: 41.3,
    lng: 69.275,
    precision: 'approximate',
    radiusM: 2500,
    coordinateSource: district('Toshkent markazi', 'центр Ташкента', 'central Tashkent'),
    notes: {
      uz: 'Toshkent boʻylab yetkazib berish: 300 000 soʻm (ish vaqtida).',
      ru: 'Доставка по Ташкенту: 300 000 сум (в рабочее время).',
      en: 'Delivery within Tashkent: 300,000 UZS (business hours).',
    },
    sources: [{ label: 'inrent.uz', url: 'https://inrent.uz/en/' }],
  },
  {
    id: 'rentcar-amir-temur',
    providerId: 'rentcar',
    city: 'tashkent',
    name: { uz: 'Rentcar.uz — ofis', ru: 'Rentcar.uz — офис', en: 'Rentcar.uz — office' },
    address: 'Amir Temur Avenue, 15, Yunusabad district, Tashkent 100000 (near City Palace hotel)',
    lat: 41.322,
    lng: 69.282,
    precision: 'approximate',
    radiusM: 1000,
    coordinateSource: district(
      'Amir Temur shoh koʻchasi, City Palace mehmonxonasi yaqini',
      'проспект Амира Темура, рядом с отелем City Palace',
      'Amir Temur Avenue near the City Palace hotel',
    ),
    hours: '09:00–22:00 (directories disagree)',
    sources: [
      { label: 'Golden Pages — RENTCAR.UZ', url: 'https://www.goldenpages.uz/en/company/?Id=53950' },
      { label: 'Yandex Maps — Rentcar.uz', url: 'https://yandex.com/maps/org/rentcar_uz/117358521245/' },
    ],
  },
  {
    id: 'avtouzbegim-amir-temur',
    providerId: 'avtouzbegim',
    city: 'tashkent',
    name: { uz: 'Avtouzbegim — olish nuqtasi', ru: 'Avtouzbegim — точка выдачи', en: 'Avtouzbegim — pickup point' },
    address: 'Tashkent, Amir Temur St., 99',
    lat: 41.345,
    lng: 69.285,
    precision: 'approximate',
    radiusM: 2000,
    coordinateSource: district('Amir Temur koʻchasi, Yunusobod', 'улица Амира Темура, Юнусабад', 'Amir Temur St., Yunusabad'),
    hours: '24/7 support (per provider)',
    sources: [{ label: 'autoprokat.uz', url: 'https://autoprokat.uz/en/' }],
  },
  {
    id: 'crc-sayhun',
    providerId: 'crc',
    city: 'tashkent',
    name: { uz: 'CRC.uz — ofis', ru: 'CRC.uz — офис', en: 'CRC.uz — office' },
    address: '100105, Tashkent, Mirabad district, Sayhun st., 170A',
    lat: 41.285,
    lng: 69.29,
    precision: 'approximate',
    radiusM: 2000,
    coordinateSource: district('Mirobod tumani', 'Мирабадский район', 'Mirabad district'),
    sources: [{ label: 'crc.uz', url: 'https://crc.uz/en/' }],
  },
  {
    id: 'egar-mirabad',
    providerId: 'egar',
    city: 'tashkent',
    name: { uz: 'Egar.uz — ofis', ru: 'Egar.uz — офис', en: 'Egar.uz — office' },
    address: 'Tashkent, Mirabad street, 41/6',
    lat: 41.293,
    lng: 69.283,
    precision: 'approximate',
    radiusM: 1500,
    coordinateSource: district('Mirobod koʻchasi', 'улица Мирабад', 'Mirabad street'),
    sources: [{ label: 'egar.uz', url: 'https://www.egar.uz/eng/' }],
  },
  {
    id: 'orient-afrosiab',
    providerId: 'orient',
    city: 'tashkent',
    name: { uz: 'Orient Rent Car — bosh ofis', ru: 'Orient Rent Car — главный офис', en: 'Orient Rent Car — main office' },
    address: 'Tashkent, Mirabad district, Afrosiab Street, 39',
    lat: 41.296,
    lng: 69.279,
    precision: 'approximate',
    radiusM: 1500,
    coordinateSource: district('Afrosiyob koʻchasi, Mirobod', 'улица Афросиаб, Мирабад', 'Afrosiab Street, Mirabad'),
    notes: {
      uz: 'Ikkinchi ofis: Yunusobod tumani, Iftixor koʻchasi, 1.',
      ru: 'Второй офис: Юнусабадский район, улица Ифтихор, 1.',
      en: 'Second office: Yunusabad district, Iftikhor Street, 1.',
    },
    sources: [{ label: 'orientrentcar.uz — About', url: 'https://orientrentcar.uz/about-en/' }],
  },
  {
    id: 'sixt-downtown',
    providerId: 'sixt',
    city: 'tashkent',
    name: { uz: 'SIXT — shahar filiali', ru: 'SIXT — городской филиал', en: 'SIXT — downtown branch' },
    address: 'Kichik Beshagach Street 104A, Tashkent 100015',
    lat: 41.3,
    lng: 69.25,
    precision: 'approximate',
    radiusM: 2500,
    coordinateSource: district('Kichik Beshyogʻoch koʻchasi', 'улица Кичик Бешагач', 'Kichik Beshagach Street'),
    hours: 'Mon–Fri 09:00–18:00',
    sources: [
      { label: 'sixt.com — Tashkent', url: 'https://www.sixt.com/car-rental/uzbekistan/tashkent/tashkent' },
    ],
  },
  {
    id: 'europcar-kumarik',
    providerId: 'europcar',
    city: 'tashkent',
    name: { uz: 'Europcar — Kumarik koʻchasi', ru: 'Europcar — улица Кумарик', en: 'Europcar — Kumarik Street' },
    address: '13 Kumarik Street, 100167, Tashkent',
    lat: 41.3111,
    lng: 69.2797,
    precision: 'approximate',
    radiusM: 6000,
    coordinateSource: district('Toshkent (koʻcha joylashuvi tasdiqlanmagan)', 'Ташкент (расположение улицы не проверено)', 'Tashkent (street position not verified)'),
    sources: [
      {
        label: 'Expedia — Europcar, 13 Kumarik Street',
        url: 'https://www.expedia.com/cn/Europcar-at-13-Kumarik-Street-Tashkent-UZB.v146500.Car-Rental-Guide-Location',
      },
    ],
  },
  airport('vipcars-tas', 'vipcars', [{ label: 'VIP Cars', url: 'https://www.vipcars.com/car-rental/uzbekistan/tashkent' }]),
  airport('economybookings-tas', 'economybookings', [
    { label: 'EconomyBookings — TAS', url: 'https://www.economybookings.com/sv/biluthyrning/asien/uzbekistan/tashkent/tas' },
  ]),
  {
    ...tashkentArea('discovercars-downtown', 'discovercars', [
      { label: 'DiscoverCars — Tashkent Downtown', url: 'https://www.discovercars.com/uzbekistan/tashkent/tashkent-downtown' },
    ]),
    name: { uz: 'DiscoverCars — shahar markazi', ru: 'DiscoverCars — центр города', en: 'DiscoverCars — Tashkent Downtown' },
  },
  { ...tashkentArea('vipcars-downtown', 'vipcars', [{ label: 'VIP Cars', url: 'https://www.vipcars.com/car-rental/uzbekistan/tashkent' }]), name: { uz: 'VIP Cars — shahar markazi', ru: 'VIP Cars — центр города', en: 'VIP Cars — Tashkent Downtown' } },
  tashkentArea('rentacartashkent-area', 'rentacartashkent', [{ label: 'rentacartashkent.uz', url: 'https://www.rentacartashkent.uz/' }]),
  tashkentArea('car24-area', 'car24', [{ label: 'car24.uz', url: 'https://car24.uz/en/car-rental-in-tashkent/' }]),
  tashkentArea('getrentacar-area', 'getrentacar', [{ label: 'GetRentACar', url: 'https://getrentacar.com/en-US/car-rental/5060078' }]),
  tashkentArea('bookingauto-area', 'bookingauto', [
    { label: 'BookingAuto', url: 'https://bookingauto.net/en/uzbekistan/tashkent-uzbekistan-rental-car' },
  ]),
  tashkentArea('tutu-area', 'tutu', [{ label: 'Tutu.ru', url: 'https://avto.tutu.ru/uzbekistan/tashkent/' }]),
  tashkentArea('rentmotors-area', 'rentmotors', [{ label: 'RentMotors', url: 'https://rentmotors.ru/en/catalog/uzbekistan/taskent' }]),
  {
    id: 'inrent-samarkand',
    providerId: 'inrent',
    city: 'samarkand',
    name: { uz: 'Inrent — Samarqand', ru: 'Inrent — Самарканд', en: 'Inrent — Samarkand' },
    address: null,
    lat: 39.6547,
    lng: 66.9758,
    precision: 'approximate',
    radiusM: 5000,
    coordinateSource: cityWide('Samarqand', 'Самарканд', 'Samarkand'),
    sources: [{ label: 'inrent.uz — Samarkand', url: 'https://inrent.uz/en/samarkand/' }],
  },
  {
    id: 'gtrentcar-samarkand',
    providerId: 'gtrentcar',
    city: 'samarkand',
    name: { uz: 'GT Rent a car — Samarqand', ru: 'GT Rent a car — Самарканд', en: 'GT Rent a car — Samarkand' },
    address: 'Samarkand, Rudaki St. 134 / 140 (sources disagree on the number)',
    lat: 39.6547,
    lng: 66.9758,
    precision: 'approximate',
    radiusM: 4000,
    coordinateSource: district('Rudakiy koʻchasi, Samarqand', 'улица Рудаки, Самарканд', 'Rudaki Street, Samarkand'),
    sources: [
      { label: 'gtrentcar.com', url: 'https://www.gtrentcar.com/' },
      { label: '2GIS — Samarkand car rental', url: 'https://2gis.uz/samarkand/search/%D0%A1%D0%B0%D0%BC%D0%B0%D1%80%D0%BA%D0%B0%D0%BD%D0%B4%20%D0%BF%D1%80%D0%BE%D0%BA%D0%B0%D1%82%20%D0%B0%D0%B2%D1%82%D0%BE%D0%BC%D0%BE%D0%B1%D0%B8%D0%BB%D0%B5%D0%B9' },
    ],
  },
  {
    id: 'samcr-samarkand',
    providerId: 'samcr',
    city: 'samarkand',
    name: { uz: 'Sam Car Renta — Samarqand', ru: 'Sam Car Renta — Самарканд', en: 'Sam Car Renta — Samarkand' },
    address: 'Samarkand, Al-Biruni street, 65',
    lat: 39.6547,
    lng: 66.9758,
    precision: 'approximate',
    radiusM: 4000,
    coordinateSource: district('Al-Beruniy koʻchasi, Samarqand', 'улица Аль-Беруни, Самарканд', 'Al-Biruni Street, Samarkand'),
    sources: [
      { label: 'samcr.uz', url: 'https://www.samcr.uz/index.php/ru/' },
      { label: 'Yandex Maps', url: 'https://yandex.com/maps/org/prokat_avtomobiley/156206791739/' },
    ],
  },
];

/**
 * Coordinates produced by `npm run geocode` (OpenStreetMap Nominatim) replace the
 * approximate reference points. Each entry records the matched OSM object and date.
 */
type Geocoded = Record<string, { lat: number; lng: number; osm: string; displayName: string; date: string }>;
for (const loc of locations) {
  const g = (geocoded as Geocoded)[loc.id];
  if (!g || loc.precision === 'exact') continue;
  loc.lat = g.lat;
  loc.lng = g.lng;
  loc.precision = 'exact';
  loc.radiusM = undefined;
  loc.coordinateSource = {
    uz: `OpenStreetMap Nominatim orqali geokodlangan (${g.date}): ${g.displayName}`,
    ru: `Геокодировано через OpenStreetMap Nominatim (${g.date}): ${g.displayName}`,
    en: `Geocoded with OpenStreetMap Nominatim (${g.date}): ${g.displayName}`,
  };
  loc.sources = [...loc.sources, { label: 'OpenStreetMap', url: g.osm }];
}

export const locationById = new Map(locations.map((l) => [l.id, l]));
