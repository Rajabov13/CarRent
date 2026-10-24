import { useEffect, useMemo, useState } from 'react';
import { Circle, MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { PickupLocation, Vehicle } from '@/types';
import { useLang } from '@/hooks/useLang';
import { useFormat } from '@/hooks/useMoney';
import { commonsImageUrl } from '@/utils/images';
import { providerById } from '@/data/providers';

export interface MapPoint {
  location: PickupLocation;
  cars: { vehicle: Vehicle; priceUZS: number | null }[];
}

interface Props {
  points: MapPoint[];
  className?: string;
  /** Query string appended to car links (carries dates/age). */
  search?: string;
}

const TILE_URL = (import.meta.env.VITE_MAP_TILE_URL as string | undefined) || 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const ATTRIBUTION =
  (import.meta.env.VITE_MAP_ATTRIBUTION as string | undefined) ||
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

function pinIcon(precision: PickupLocation['precision'], count: number) {
  const exact = precision === 'exact';
  const html = `<div style="position:relative;width:34px;height:42px">
    <svg viewBox="0 0 34 42" width="34" height="42" aria-hidden="true">
      <path d="M17 41s14-13.5 14-24A14 14 0 0 0 3 17c0 10.5 14 24 14 24z" fill="${exact ? '#f59e0b' : '#64748b'}" stroke="#0b0f17" stroke-width="1.5" ${exact ? '' : 'stroke-dasharray="3 2"'}/>
    </svg>
    <span style="position:absolute;top:7px;left:0;width:34px;text-align:center;font:700 12px/16px Inter Variable,system-ui,sans-serif;color:#0b0f17">${count}</span>
  </div>`;
  return L.divIcon({ html, className: '', iconSize: [34, 42], iconAnchor: [17, 41], popupAnchor: [0, -36] });
}

/** Group locations that share coordinates so overlapping pins become one marker. */
function groupByCoords(points: MapPoint[]) {
  const groups = new Map<string, MapPoint[]>();
  for (const p of points) {
    const key = `${p.location.lat.toFixed(4)},${p.location.lng.toFixed(4)}`;
    groups.set(key, [...(groups.get(key) ?? []), p]);
  }
  return [...groups.values()];
}

function FitBounds({ points }: { points: MapPoint[] }) {
  const map = useMap();
  useEffect(() => {
    if (!points.length) return;
    const bounds = L.latLngBounds(points.map((p) => [p.location.lat, p.location.lng] as [number, number]));
    map.fitBounds(bounds.pad(0.25), { maxZoom: 13 });
  }, [map, points]);
  return null;
}

function TileErrorWatcher({ onFail }: { onFail: () => void }) {
  const [errors, setErrors] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const map = useMap();
  useEffect(() => {
    const layerEvents = (e: L.LeafletEvent) => {
      const layer = e.layer as L.Layer;
      if (layer instanceof L.TileLayer) {
        layer.on('tileerror', () => setErrors((n) => n + 1));
        layer.on('tileload', () => setLoaded(true));
      }
    };
    map.on('layeradd', layerEvents);
    map.eachLayer((layer) => layerEvents({ layer } as unknown as L.LeafletEvent));
    return () => {
      map.off('layeradd', layerEvents);
    };
  }, [map]);
  useEffect(() => {
    if (errors >= 6 && !loaded) onFail();
  }, [errors, loaded, onFail]);
  return null;
}

export default function LocationsMap({ points, className = 'h-[480px]', search = '' }: Props) {
  const { t } = useTranslation();
  const { l } = useLang();
  const f = useFormat();
  const [tilesFailed, setTilesFailed] = useState(false);
  const groups = useMemo(() => groupByCoords(points), [points]);
  const center: [number, number] = points[0] ? [points[0].location.lat, points[0].location.lng] : [41.3111, 69.2797];

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-ink-200 dark:border-ink-800 ${className}`} data-testid="locations-map">
      <MapContainer center={center} zoom={12} scrollWheelZoom={false} className="h-full w-full" style={{ background: 'transparent' }}>
        <TileLayer url={TILE_URL} attribution={ATTRIBUTION} />
        <FitBounds points={points} />
        <TileErrorWatcher onFail={() => setTilesFailed(true)} />
        {points
          .filter((p) => p.location.precision === 'approximate' && p.location.radiusM)
          .map((p) => (
            <Circle
              key={`c-${p.location.id}`}
              center={[p.location.lat, p.location.lng]}
              radius={p.location.radiusM!}
              pathOptions={{ color: '#64748b', weight: 1, dashArray: '4 4', fillOpacity: 0.05 }}
            />
          ))}
        {groups.map((group) => {
          const first = group[0].location;
          const anyExact = group.some((g) => g.location.precision === 'exact');
          const carCount = group.reduce((n, g) => n + g.cars.length, 0);
          return (
            <Marker
              key={group.map((g) => g.location.id).join('|')}
              position={[first.lat, first.lng]}
              icon={pinIcon(anyExact ? 'exact' : 'approximate', carCount)}
              title={[...new Set(group.map((g) => l(g.location.name)))].join(', ')}
              alt={[...new Set(group.map((g) => l(g.location.name)))].join(', ')}
            >
              <Popup maxWidth={300} minWidth={240}>
                <div className="max-h-72 space-y-4 overflow-y-auto pr-1" data-testid="map-popup">
                  {group.map(({ location, cars }) => (
                    <div key={location.id}>
                      <p className="text-sm font-bold">{l(location.name)}</p>
                      <p className="text-[11px] text-ink-500">{providerById.get(location.providerId)?.name}</p>
                      <p className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${location.precision === 'exact' ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-700'}`}>
                        {location.precision === 'exact' ? t('map.exact') : t('map.approximate')}
                      </p>
                      <p className="mt-1 text-xs">
                        <span className="font-semibold">{t('map.address')}: </span>
                        {location.address ?? t('map.noAddress')}
                      </p>
                      {location.hours && (
                        <p className="text-xs">
                          <span className="font-semibold">{t('map.hours')}: </span>
                          {location.hours}
                        </p>
                      )}
                      <p className="mt-1 text-[11px] text-ink-500">{l(location.coordinateSource)}</p>
                      {location.address && location.precision === 'approximate' && (
                        <a
                          className="text-[11px] font-medium text-amber-700 underline"
                          href={`https://www.openstreetmap.org/search?query=${encodeURIComponent(location.address)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {t('map.openInOsm')}
                        </a>
                      )}
                      <ul className="mt-2 space-y-2">
                        {cars.map(({ vehicle, priceUZS }) => (
                          <li key={vehicle.id}>
                            <Link to={`/cars/${vehicle.slug}${search}`} className="flex items-center gap-2 rounded-lg p-1 hover:bg-black/5">
                              <img
                                src={commonsImageUrl(vehicle.images[0].file, 160)}
                                alt=""
                                className="h-10 w-14 shrink-0 rounded-md object-cover"
                                loading="lazy"
                                referrerPolicy="no-referrer"
                              />
                              <span className="min-w-0">
                                <span className="block truncate text-xs font-semibold">
                                  {vehicle.make} {vehicle.model}
                                </span>
                                <span className="block text-xs">
                                  {priceUZS !== null ? `${f.uzs(priceUZS)} / ${t('common.perDay')}` : t('common.requiresConfirmation')}
                                </span>
                              </span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
      {tilesFailed && (
        <div className="absolute inset-x-3 top-3 z-[500] rounded-lg bg-white/95 p-2 text-center text-xs font-medium text-red-700 shadow dark:bg-ink-900/95 dark:text-red-300">
          {t('map.loadError')}
        </div>
      )}
      <div className="absolute bottom-3 left-3 z-[500] rounded-lg bg-white/95 px-3 py-2 text-[11px] shadow dark:bg-ink-900/95">
        <p className="font-semibold">{t('map.legend')}</p>
        <p className="mt-1 flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-full bg-amber-500" /> {t('map.exact')}
        </p>
        <p className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-full border border-dashed border-slate-700 bg-slate-500" /> {t('map.approximate')}
        </p>
      </div>
    </div>
  );
}
