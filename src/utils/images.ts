/** Direct (redirecting) URL for a Wikimedia Commons file, scaled to `width` px. */
export function commonsImageUrl(file: string, width = 1280): string {
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}?width=${width}`;
}

/** File description page with author and licence information. */
export function commonsPageUrl(file: string): string {
  return `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(file.replace(/ /g, '_'))}`;
}
