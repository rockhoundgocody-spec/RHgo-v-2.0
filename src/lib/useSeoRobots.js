import { useEffect } from 'react';

const ROBOTS_META_ID = 'robots-meta';
const SAFE_DEFAULT = 'noindex, nofollow';

/**
 * Controls the <meta name="robots"> tag for the current route.
 *
 * index.html ships a default `noindex, nofollow` so every authenticated
 * app screen (Hub, Explore, Scan, Collection, Profile, Admin, …) stays
 * out of search results. Call this hook with `true` only on public
 * content pages that SHOULD be crawlable (Landing, Privacy, Terms, Pricing).
 *
 * On unmount it restores the safe default so the next authenticated
 * route is never accidentally left indexable.
 */
export function useSeoRobots(indexable = false) {
  useEffect(() => {
    let tag = document.getElementById(ROBOTS_META_ID);
    if (!tag) {
      tag = document.createElement('meta');
      tag.name = 'robots';
      tag.id = ROBOTS_META_ID;
      document.head.appendChild(tag);
    }
    tag.content = indexable ? 'index, follow' : SAFE_DEFAULT;
    return () => { tag.content = SAFE_DEFAULT; };
  }, [indexable]);
}