import { createHttpDataService } from './httpDataService';
import { referenceDataService } from './referenceDataService';
import type { RentalDataService } from './types';

const baseUrl = import.meta.env.VITE_API_BASE_URL as string | undefined;

/** The active data service: a backend when VITE_API_BASE_URL is set, the bundled reference data otherwise. */
export const dataService: RentalDataService = baseUrl ? createHttpDataService(baseUrl) : referenceDataService;

export const usingLiveBackend = Boolean(baseUrl);
