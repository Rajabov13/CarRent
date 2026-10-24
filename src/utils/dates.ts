import dayjs from 'dayjs';
import 'dayjs/locale/ru';
import 'dayjs/locale/uz-latn';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import type { Lang } from '@/types';

dayjs.extend(customParseFormat);

export const LOCAL_DT_FORMAT = 'YYYY-MM-DDTHH:mm';

const dayjsLocale: Record<Lang, string> = { uz: 'uz-latn', ru: 'ru', en: 'en' };

export function parseLocal(value: string) {
  return dayjs(value, LOCAL_DT_FORMAT, true);
}

export function isValidLocal(value: string): boolean {
  return Boolean(value) && parseLocal(value).isValid();
}

export function formatDateTime(value: string, lang: Lang): string {
  const d = parseLocal(value);
  if (!d.isValid()) return '—';
  return d.locale(dayjsLocale[lang]).format(lang === 'en' ? 'ddd, D MMM YYYY, HH:mm' : 'dd, D MMMM YYYY, HH:mm');
}

export function formatDate(iso: string, lang: Lang): string {
  const d = dayjs(iso);
  if (!d.isValid()) return '—';
  return d.locale(dayjsLocale[lang]).format(lang === 'en' ? 'D MMM YYYY' : 'D MMMM YYYY');
}

/** Default search window: tomorrow 10:00 → three days later 10:00. */
export function defaultRange(now = dayjs()): { pickupAt: string; returnAt: string } {
  const pickup = now.add(1, 'day').hour(10).minute(0).second(0);
  return { pickupAt: pickup.format(LOCAL_DT_FORMAT), returnAt: pickup.add(3, 'day').format(LOCAL_DT_FORMAT) };
}

export function minutesBetween(from: string, to: string): number {
  return parseLocal(to).diff(parseLocal(from), 'minute');
}

export function nowLocal(): string {
  return dayjs().format(LOCAL_DT_FORMAT);
}
