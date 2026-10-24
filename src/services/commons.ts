/**
 * Loads additional photos from a Wikimedia Commons category through the public
 * MediaWiki API (CORS-enabled with origin=*). Results include author and licence
 * so every photo can be attributed.
 */
export interface CommonsPhoto {
  title: string;
  thumbUrl: string;
  pageUrl: string;
  artist: string | null;
  license: string | null;
}

const cache = new Map<string, Promise<CommonsPhoto[]>>();

function stripHtml(html: string | undefined): string | null {
  if (!html) return null;
  const div = document.createElement('div');
  div.innerHTML = html;
  return (div.textContent ?? '').trim() || null;
}

interface ApiPage {
  title: string;
  imageinfo?: {
    thumburl?: string;
    descriptionurl?: string;
    mime?: string;
    extmetadata?: Record<string, { value?: string }>;
  }[];
}

export function fetchCommonsCategory(category: string, limit = 12): Promise<CommonsPhoto[]> {
  const key = `${category}|${limit}`;
  if (!cache.has(key)) {
    const params = new URLSearchParams({
      action: 'query',
      format: 'json',
      origin: '*',
      generator: 'categorymembers',
      gcmtitle: category,
      gcmtype: 'file',
      gcmlimit: String(limit),
      prop: 'imageinfo',
      iiprop: 'url|mime|extmetadata',
      iiurlwidth: '640',
      iiextmetadatafilter: 'Artist|LicenseShortName',
    });
    const p = fetch(`https://commons.wikimedia.org/w/api.php?${params}`)
      .then((r) => {
        if (!r.ok) throw new Error(`Commons API ${r.status}`);
        return r.json();
      })
      .then((json: { query?: { pages?: Record<string, ApiPage> } }) =>
        Object.values(json.query?.pages ?? {})
          .map((page) => {
            const info = page.imageinfo?.[0];
            if (!info?.thumburl || !info.descriptionurl || !/^image\/(jpeg|png|webp)$/.test(info.mime ?? '')) return null;
            return {
              title: page.title.replace(/^File:/, '').replace(/\.[a-z]+$/i, ''),
              thumbUrl: info.thumburl,
              pageUrl: info.descriptionurl,
              artist: stripHtml(info.extmetadata?.Artist?.value),
              license: info.extmetadata?.LicenseShortName?.value ?? null,
            } satisfies CommonsPhoto;
          })
          .filter((x): x is CommonsPhoto => x !== null),
      );
    p.catch(() => cache.delete(key));
    cache.set(key, p);
  }
  return cache.get(key)!;
}
