import { z } from 'zod';
import { isValidLocal, minutesBetween, nowLocal } from './dates';

/** Messages are i18n keys; components translate them. */
export const dateRangeSchema = z
  .object({
    pickupAt: z.string().min(1, 'validation.required').refine(isValidLocal, 'validation.invalidDate'),
    returnAt: z.string().min(1, 'validation.required').refine(isValidLocal, 'validation.invalidDate'),
  })
  .superRefine((v, ctx) => {
    if (!isValidLocal(v.pickupAt) || !isValidLocal(v.returnAt)) return;
    if (minutesBetween(nowLocal(), v.pickupAt) < 0) {
      ctx.addIssue({ code: 'custom', path: ['pickupAt'], message: 'validation.pickupInPast' });
    }
    if (minutesBetween(v.pickupAt, v.returnAt) <= 0) {
      ctx.addIssue({ code: 'custom', path: ['returnAt'], message: 'validation.returnBeforePickup' });
    }
  });

export const driverAgeSchema = z.coerce
  .number({ error: 'validation.age' })
  .int('validation.age')
  .min(18, 'validation.age')
  .max(99, 'validation.age');

export const searchSchema = z
  .object({
    city: z.enum(['all', 'tashkent', 'samarkand']),
    pickupLocationId: z.string(),
    returnLocationId: z.string(),
    pickupAt: z.string(),
    returnAt: z.string(),
    driverAge: driverAgeSchema,
  })
  .and(dateRangeSchema);

export type SearchFormValues = z.input<typeof searchSchema>;

export const customerSchema = z.object({
  fullName: z.string().trim().min(3, 'validation.nameMin').max(100, 'validation.nameMin'),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9\s()-]{9,20}$/, 'validation.phone'),
  email: z.string().trim().email('validation.email'),
  licenseYears: z.coerce
    .number({ error: 'validation.licenseYears' })
    .int('validation.licenseYears')
    .min(0, 'validation.licenseYears')
    .max(80, 'validation.licenseYears'),
  notes: z.string().max(500).optional(),
});

export type CustomerFormValues = z.input<typeof customerSchema>;
