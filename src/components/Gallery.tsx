import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, ExternalLink as ExternalIcon, ImagePlus } from 'lucide-react';
import type { Vehicle } from '@/types';
import { CarImage } from './CarImage';
import { useLang } from '@/hooks/useLang';
import { commonsPageUrl } from '@/utils/images';
import { fetchCommonsCategory, type CommonsPhoto } from '@/services/commons';
import { Spinner } from './ui';

const commonsEnabled = (import.meta.env.VITE_ENABLE_COMMONS_GALLERY ?? 'true') !== 'false';

export function Gallery({ vehicle }: { vehicle: Vehicle }) {
  const { t } = useTranslation();
  const { l } = useLang();
  const [index, setIndex] = useState(0);
  const images = vehicle.images;
  const current = images[index];
  const name = `${vehicle.make} ${vehicle.model}`;

  useEffect(() => setIndex(0), [vehicle.id]);

  const go = (d: number) => setIndex((i) => (i + d + images.length) % images.length);

  return (
    <section aria-label={t('details.gallery')}>
      <div className="relative">
        <CarImage key={current.file} file={current.file} alt={`${name} — ${l(current.caption)}`} width={1600} eager className="aspect-[16/10] rounded-2xl" />
        {images.length > 1 && (
          <>
            <button type="button" onClick={() => go(-1)} className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow hover:bg-white dark:bg-ink-900/90" aria-label="Previous photo">
              <ChevronLeft className="h-5 w-5" aria-hidden />
            </button>
            <button type="button" onClick={() => go(1)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow hover:bg-white dark:bg-ink-900/90" aria-label="Next photo">
              <ChevronRight className="h-5 w-5" aria-hidden />
            </button>
          </>
        )}
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs muted">
        <span>{l(current.caption)} · {index + 1}/{images.length}</span>
        <a href={commonsPageUrl(current.file)} target="_blank" rel="noopener noreferrer" className="link inline-flex items-center gap-1">
          {t('details.photoCredit')}
          <ExternalIcon className="h-3 w-3" aria-hidden />
        </a>
      </div>
      {images.length > 1 && (
        <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6">
          {images.map((img, i) => (
            <button
              key={img.file}
              type="button"
              onClick={() => setIndex(i)}
              className={`overflow-hidden rounded-lg ring-2 ${i === index ? 'ring-accent-500' : 'ring-transparent'}`}
              aria-label={l(img.caption)}
              aria-current={i === index}
            >
              <CarImage file={img.file} alt="" width={240} className="aspect-[4/3]" />
            </button>
          ))}
        </div>
      )}
      {commonsEnabled && vehicle.commonsCategory && <CommonsMore category={vehicle.commonsCategory} />}
    </section>
  );
}

function CommonsMore({ category }: { category: string }) {
  const { t } = useTranslation();
  const [state, setState] = useState<'idle' | 'loading' | 'error' | 'done'>('idle');
  const [photos, setPhotos] = useState<CommonsPhoto[]>([]);

  const load = () => {
    setState('loading');
    fetchCommonsCategory(category)
      .then((p) => {
        setPhotos(p);
        setState('done');
      })
      .catch(() => setState('error'));
  };

  return (
    <div className="mt-4">
      {state === 'idle' && (
        <button type="button" className="btn-ghost" onClick={load}>
          <ImagePlus className="h-4 w-4" aria-hidden />
          {t('details.morePhotosLoad')}
        </button>
      )}
      {state === 'loading' && <Spinner label={t('common.loading')} />}
      {state === 'error' && (
        <div className="flex items-center gap-3 text-sm text-red-700 dark:text-red-300">
          {t('details.morePhotosError')}
          <button type="button" className="btn-ghost" onClick={load}>{t('common.retry')}</button>
        </div>
      )}
      {state === 'done' && (
        <>
          <p className="mb-2 text-sm font-semibold">{t('details.morePhotos')}</p>
          {photos.length === 0 ? (
            <p className="text-sm muted">{t('details.morePhotosEmpty')}</p>
          ) : (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3" data-testid="commons-photos">
              {photos.map((p) => (
                <li key={p.pageUrl}>
                  <a href={p.pageUrl} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-lg">
                    <img src={p.thumbUrl} alt={p.title} loading="lazy" referrerPolicy="no-referrer" className="aspect-[4/3] w-full bg-ink-100 object-cover dark:bg-ink-800" />
                  </a>
                  <p className="mt-1 truncate text-[11px] muted" title={`${p.artist ?? ''} ${p.license ?? ''}`}>
                    {[p.artist, p.license].filter(Boolean).join(' · ') || 'Wikimedia Commons'}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
