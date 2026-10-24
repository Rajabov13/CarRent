#!/usr/bin/env node
/**
 * Geocodes the published street addresses in src/data/locations.ts with
 * OpenStreetMap Nominatim and writes src/data/geocoded.json.
 *
 * Follows the Nominatim usage policy: one request per second, an identifying
 * User-Agent, results cached in the JSON file (re-runs skip known ids).
 * Review every match before deploying — a wrong match is worse than an
 * approximate area. Delete an entry from geocoded.json to revert it.
 *
 *   NOMINATIM_EMAIL=you@example.com npm run geocode
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const source = readFileSync(path.join(root, 'src/data/locations.ts'), 'utf8');
const outFile = path.join(root, 'src/data/geocoded.json');
const existing = JSON.parse(readFileSync(outFile, 'utf8'));

// Pull `id: '...'` / `address: '...'` pairs from the data file.
const entries = [];
const re = /id:\s*'([^']+)'[\s\S]*?address:\s*(null|'([^']*)')/g;
for (const m of source.matchAll(re)) {
  if (m[3] && !/sources disagree|International Airport/i.test(m[3])) entries.push({ id: m[1], address: m[3] });
}

const email = process.env.NOMINATIM_EMAIL ?? '';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const today = new Date().toISOString().slice(0, 10);

for (const { id, address } of entries) {
  if (existing[id]) continue;
  const q = address.replace(/\(.*?\)/g, '').replace(/^\d{6},\s*/, '');
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=uz&q=${encodeURIComponent(q)}${email ? `&email=${encodeURIComponent(email)}` : ''}`;
  const res = await fetch(url, { headers: { 'User-Agent': 'RentCarUzbekistan-geocoder/1.0 (data maintenance script)' } });
  if (!res.ok) {
    console.error(`${id}: HTTP ${res.status}`);
  } else {
    const [hit] = await res.json();
    if (hit) {
      existing[id] = {
        lat: Number(hit.lat),
        lng: Number(hit.lon),
        osm: `https://www.openstreetmap.org/${hit.osm_type}/${hit.osm_id}`,
        displayName: hit.display_name,
        date: today,
      };
      console.log(`${id}: ${hit.display_name}`);
    } else {
      console.log(`${id}: no match for "${q}" (left approximate)`);
    }
  }
  await sleep(1100);
}

writeFileSync(outFile, JSON.stringify(existing, null, 2) + '\n');
console.log(`Wrote ${Object.keys(existing).length} entries to src/data/geocoded.json — review them before deploying.`);
