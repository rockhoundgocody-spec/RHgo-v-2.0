import { useEffect } from 'react';

const ROBOTS_META_ID = 'robots-meta';
const PUBLIC_DEFAULT = 'index, follow';
const PRIVATE_DEFAULT = 'noindex, nofollow';

/**
 * Controls the <meta name="robots"> tag for the current route.
 *
 * index.html ships a default `index, follow` so public marketing pages
 * (Landing, Scan, Demo, Pricing, About, Contact, legal) are crawlable
 * without every page having to opt in. Call this hook with `false` on
 * authenticated / private app screens so they stay out of search results.
 *
 * On unmount it restores the public default so the next marketing route
 * is never accidentally left noindex.
 */
export function useSeoRobots(indexable = true) {
  useEffect(() => {
    let tag = document.getElementById(ROBOTS_META_ID);
    if (!tag) {
      tag = document.createElement('meta');
      tag.name = 'robots';
      tag.id = ROBOTS_META_ID;
      document.head.appendChild(tag);
    }
    tag.content = indexable ? PUBLIC_DEFAULT : PRIVATE_DEFAULT;
    return () => { tag.content = PUBLIC_DEFAULT; };
  }, [indexable]);
}
