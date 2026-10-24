import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PlayCircle, Video } from 'lucide-react';
import type { Vehicle } from '@/types';
import { useFormat } from '@/hooks/useMoney';
import { ExternalLink } from './ui';

/**
 * Click-to-load YouTube embed (privacy-enhanced domain). Nothing is requested
 * from YouTube until the visitor presses play.
 */
export function VideoEmbed({ vehicle }: { vehicle: Vehicle }) {
  const { t } = useTranslation();
  const f = useFormat();
  const [play, setPlay] = useState(false);
  const video = vehicle.video;

  if (!video) {
    return (
      <div className="card p-5 text-sm">
        <p className="muted">{t('details.noVideo')}</p>
        <ExternalLink href={vehicle.videoSearchUrl} className="btn-ghost mt-3">
          <Video className="h-4 w-4" aria-hidden />
          {t('details.searchVideos')}
        </ExternalLink>
      </div>
    );
  }

  return (
    <div>
      <div className="relative aspect-video overflow-hidden rounded-2xl bg-ink-950">
        {play ? (
          <iframe
            className="absolute inset-0 h-full w-full"
            src={`https://www.youtube-nocookie.com/embed/${video.youtubeId}?autoplay=1&rel=0`}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        ) : (
          <button type="button" onClick={() => setPlay(true)} className="group absolute inset-0 flex flex-col items-center justify-center gap-3 text-white" data-testid="video-play">
            <img
              src={`https://i.ytimg.com/vi/${video.youtubeId}/hqdefault.jpg`}
              alt=""
              className="absolute inset-0 h-full w-full object-cover opacity-60 transition-opacity group-hover:opacity-75"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
            <PlayCircle className="relative h-16 w-16 drop-shadow" aria-hidden />
            <span className="relative max-w-sm px-4 text-center text-sm font-semibold drop-shadow">{video.title}</span>
          </button>
        )}
      </div>
      <p className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs muted">
        <span>{t('details.videoBy', { channel: video.channel, date: f.date(video.published) })}</span>
        <ExternalLink href={video.sourceUrl}>{t('details.watchOnYoutube')}</ExternalLink>
      </p>
    </div>
  );
}
