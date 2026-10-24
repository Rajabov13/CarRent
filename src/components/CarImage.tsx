import { useState } from 'react';
import { CarFront } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { commonsImageUrl } from '@/utils/images';

interface Props {
  file: string;
  alt: string;
  width?: number;
  className?: string;
  eager?: boolean;
  /** Render nothing (instead of a labelled placeholder) if the photo fails — for decorative backgrounds. */
  decorative?: boolean;
}

/** Wikimedia Commons photo with a skeleton while loading and a labelled fallback if it fails. */
export function CarImage({ file, alt, width = 960, className = '', eager = false, decorative = false }: Props) {
  const { t } = useTranslation();
  const [state, setState] = useState<'loading' | 'loaded' | 'error'>('loading');
  return (
    <div className={`relative overflow-hidden bg-ink-100 dark:bg-ink-800 ${className}`}>
      {state === 'loading' && <div className="absolute inset-0 animate-pulse bg-ink-200/60 dark:bg-ink-700/50" aria-hidden />}
      {state === 'error' ? (
        decorative ? null : <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-ink-400">
          <CarFront className="h-10 w-10" aria-hidden />
          <span className="text-xs">{t('details.photoMissing')}</span>
        </div>
      ) : (
        <img
          src={commonsImageUrl(file, width)}
          alt={alt}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          referrerPolicy="no-referrer"
          onLoad={() => setState('loaded')}
          onError={() => setState('error')}
          className={`h-full w-full object-cover transition-opacity duration-300 ${state === 'loaded' ? 'opacity-100' : 'opacity-0'}`}
        />
      )}
    </div>
  );
}
