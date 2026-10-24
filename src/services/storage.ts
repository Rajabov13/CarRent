import type { SavedEstimate } from '@/types';

const KEY = 'rcu-estimates';

function read(): SavedEstimate[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as SavedEstimate[]) : [];
  } catch {
    return [];
  }
}

export const estimateStore = {
  list(): SavedEstimate[] {
    return read().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  get(reference: string): SavedEstimate | undefined {
    return read().find((e) => e.reference === reference);
  },
  save(estimate: SavedEstimate) {
    const rest = read().filter((e) => e.reference !== estimate.reference);
    try {
      localStorage.setItem(KEY, JSON.stringify([estimate, ...rest].slice(0, 50)));
    } catch {
      /* storage full or disabled — the receipt still works for this session */
    }
  },
  remove(reference: string) {
    try {
      localStorage.setItem(KEY, JSON.stringify(read().filter((e) => e.reference !== reference)));
    } catch {
      /* ignore */
    }
  },
};
