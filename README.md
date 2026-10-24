# RentCar Uzbekistan

A car rental price-comparison and booking-estimate website for Uzbekistan (Tashkent and Samarkand), built with React, Vite, TypeScript and Tailwind CSS.

**Live site:** https://rajabov13.github.io/CarRent/

The site compares **reference prices** published by real rental providers, explains each provider's terms, and produces an itemised, printable rental estimate in Uzbek som (UZS). It is not a rental company and does not confirm bookings: no provider offers a public availability API, so every price and booking is labelled as an estimate that the provider must confirm.

## Features

- **9 models in 5 categories:** Chevrolet Spark and Cobalt (economy), Gentra/Lacetti and Malibu 2 (sedan), Tracker 2 and Kia Sportage (SUV), BMW 5 Series G30 and Mercedes-Benz E-Class W213 (premium), Chevrolet Orlando (minivan).
- **Price comparison on every car page:** 49 offers (45 with a published price) from 19 providers (local companies, SIXT/Europcar and aggregators). Each one shows the source URL, original currency, UZS conversion, deposit, mileage, location and the date it was checked. The page also shows the lowest observed price, the typical range and the median. Daily, "from", long-term and aggregator prices are labelled separately. Providers without a published price are marked **"Price requires confirmation"**.
- **Search, filters and sorting** on the loaded data: city, pickup point, dates, driver age, price range, category, transmission, fuel, seats and availability; sort by recommended, lowest or highest price.
- **Interactive map** (Leaflet + OpenStreetMap) with list/map switching and popups showing the car, photo, price and address. Only the airport has published coordinates. Other markers are drawn as an **approximate area** with a circle and say so.
- **Booking calculator with a live receipt:** offer, return location, dates, extras (child seats, delivery, additional driver, GPS where offered), refundable deposit shown separately, long-term tier discounts, and each provider's billing rule (minimum rental, late-return grace). Unpublished prices are listed but never added to totals.
- **Receipt** with an estimate reference, *Print*, *Download PDF* (pdfmake, Latin and Cyrillic) and *Edit booking*. It is clearly stamped "PRICE ESTIMATE". Estimates are saved in the browser under *My estimates*.
- **Three languages:** Uzbek (default), Russian and English, using i18next. Language switches instantly and is remembered, with locale-aware dates and prices.
- **Dark mode:** follows the system setting on first visit, is remembered, and doesn't flash white on load. Map tiles, popups and the receipt adapt too.
- **Photos and videos:** real Wikimedia Commons photos of each model with author/licence links, plus more photos loaded from Commons categories on request. A video is embedded only where an official manufacturer upload was verified (Mercedes-Benz E-Class); other cars link to a YouTube search.

## Getting started

Requirements: Node.js 20+ and npm.

```bash
npm install
cp .env.example .env      # optional — defaults work out of the box
npm run dev               # http://localhost:5173
```

| Script | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Type-check and production build to `dist/` |
| `npm run preview` | Serve the production build |
| `npm test` | Unit tests (pricing engine, offer statistics, translation key parity) |
| `npm run geocode` | Geocode provider addresses with OSM Nominatim (see below) |

### Configuration (`.env`)

| Variable | Purpose |
| --- | --- |
| `VITE_API_BASE_URL` | Optional backend for live data/booking requests (see `src/services/httpDataService.ts`). Empty = bundled reference data. |
| `VITE_MAP_TILE_URL`, `VITE_MAP_ATTRIBUTION` | Map tile server (OpenStreetMap by default). |
| `VITE_ENABLE_COMMONS_GALLERY` | `false` disables loading extra photos from the Wikimedia Commons API. |
| `VITE_BASE` | Build-time sub-path, e.g. `/CarRent/` for GitHub Pages. |

Never put API secrets in `VITE_*` variables: they are bundled into public JavaScript. Provider credentials belong on a backend.

## Project structure

```
src/
  components/   UI building blocks (CarCard, CompareTable, LocationsMap, BookingInputs, ReceiptView, …)
  pages/        Home, Cars, CarDetails, Booking, Receipt, Account, Prices, Sources, NotFound
  layouts/      MainLayout (navbar, footer, skip link)
  hooks/        Booking selection & URL state, quote, receipt model, formatting
  services/     RentalDataService interface, reference + HTTP implementations, Commons API, local storage
  data/         Providers, locations, vehicles, offers, exchange rates, sample reviews
  types/        Shared TypeScript types
  utils/        Pricing engine, offer statistics, filters, currency, dates, PDF, validation schemas
  i18n/         i18next setup and uz / ru / en dictionaries
  styles/       Tailwind theme and component utilities
scripts/        geocode-locations.mjs
```

## Data: what is verified and what is not

All reference data lives in `src/data/` and is separate from the UI.

- **Prices** (`offers.ts`) were read from each provider's public page on **24 October 2026**, via web search. The pages carry no update date, so the prices are reference figures, not live quotes. Where a provider's own pages disagree, both values are recorded in the offer's notes.
- **Exchange rates** (`exchangeRates.ts`): official Central Bank of Uzbekistan rates effective 23.10.2026 (1 USD = 11,903.15 UZS; 1 EUR = 13,329.15; 1 RUB = 146.75).
- **Terms** (`providers.ts`): deposits, mileage, insurance, minimum age, late-return grace and extras, only as published. Anything unpublished is `null` and shown as "Not published" or "Price on request".
- **Locations** (`locations.ts`): addresses as published. Only the airport uses published coordinates. Other markers are approximate areas until `npm run geocode` is run and its matches are reviewed.
- **Photos** (`vehicles.ts`): Wikimedia Commons file names confirmed via search. They show the model, not a provider's actual car.
- **Sample content**: the three home-page reviews are placeholders and labelled "Sample content".

### Updating prices

Edit `src/data/offers.ts`: change `price`, `currency`, `sourceUrl` and notes, and bump `PRICE_CHECK_DATE` in `exchangeRates.ts`. Update the CBU rates at the same time. Run `npm test`.

### Geocoding addresses

```bash
NOMINATIM_EMAIL=you@example.com npm run geocode
```

This writes `src/data/geocoded.json`, respecting Nominatim's usage policy (1 request per second, cached). Review every match before deploying, and delete wrong entries.

## Billing rules used by the calculator

```
rental subtotal   = daily rate × billable days
total rental cost = subtotal + extras + delivery + mandatory fees − discounts
due at pickup     = total rental cost + refundable deposit (when the provider takes it at pickup)
```

Billable days: rentals up to the provider's minimum (24 h) count as one day. After that, every started 24-hour period is a full day, minus the provider's published grace period (Inrent: 1 hour). Where a provider publishes no rule, the estimate uses this conservative rule and says so.

## Connecting a real backend

`src/services/types.ts` defines `RentalDataService`. Set `VITE_API_BASE_URL` to switch from the bundled data to `createHttpDataService`, which calls `/vehicles`, `/offers`, `/providers`, `/locations`, `/availability` and `/booking-requests`. Availability can then return `available`/`unavailable` instead of `unknown`, and booking requests reach the provider. Only connect provider APIs you are authorised to use.

## Deployment

`.github/workflows/deploy.yml` tests, builds with `VITE_BASE=/<repo>/` and pushes `dist/` to the `gh-pages` branch on every push to `main`. GitHub Pages serves that branch (Settings → Pages → Source: *Deploy from a branch*, `gh-pages` / root). `404.html` is a copy of `index.html`, so deep links work.

## Credits

Map data © OpenStreetMap contributors. Car photos: Wikimedia Commons contributors (see each photo's link for author and licence). Icons: Lucide.
