import { describe, expect, it } from 'vitest';
import en from './locales/en';
import ru from './locales/ru';
import uz from './locales/uz';

const PLURAL = /_(zero|one|two|few|many|other)$/;

function flatten(obj: object, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([k, v]) =>
    v && typeof v === 'object' ? flatten(v, `${prefix}${k}.`) : [`${prefix}${k}`.replace(PLURAL, '')],
  );
}

const keys = (o: object) => [...new Set(flatten(o))].sort();

describe('translations', () => {
  it('Russian has exactly the English keys', () => {
    expect(keys(ru)).toEqual(keys(en));
  });
  it('Uzbek has exactly the English keys', () => {
    expect(keys(uz)).toEqual(keys(en));
  });
  it('Russian plural keys define one/few/many/other', () => {
    const flat = flatten(ru);
    const raw = JSON.stringify(ru);
    for (const k of new Set(flat)) {
      const leaf = k.split('.').pop()!;
      if (raw.includes(`"${leaf}_one"`)) {
        for (const form of ['few', 'many', 'other']) expect(raw).toContain(`"${leaf}_${form}"`);
      }
    }
  });
  it('no empty strings', () => {
    for (const dict of [en, ru, uz]) {
      const walk = (o: object) =>
        Object.values(o).forEach((v) => (typeof v === 'string' ? expect(v.trim()).not.toBe('') : walk(v)));
      walk(dict);
    }
  });
});
