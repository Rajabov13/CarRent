const ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

/** Booking estimate reference like "RCU-261024-7KQ4M". Not a provider reservation number. */
export function generateReference(date = new Date(), random: () => number = Math.random): string {
  const y = String(date.getFullYear()).slice(2);
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  let suffix = '';
  for (let i = 0; i < 5; i++) suffix += ALPHABET[Math.floor(random() * ALPHABET.length)];
  return `RCU-${y}${m}${d}-${suffix}`;
}
