/**
 * Route-level search-engine controls for rhgo.me.
 *
 * Base44 hosting can't send per-route X-Robots-Tag headers or real 404
 * statuses, so every URL is served the same index.html. Google renders the
 * app, so we set the robots meta and canonical link from the router instead:
 *   - only the public pages in public/sitemap.xml are indexable;
 *   - everything else (sign-in, private app screens, unknown URLs) is
 *     "noindex, nofollow";
 *   - the canonical always points at https://rhgo.me + the clean path.
 *
 * Keep PUBLIC_INDEXABLE_PATHS in sync with public/sitemap.xml (a test checks).
 */
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const SITE_ORIGIN = 'https://rhgo.me';

export const PUBLIC_INDEXABLE_PATHS = [
  '/',
  '/scan',
  '/demo',
  '/pricing',
  '/agate-guide',
  '/find-of-the-week',
  '/clubs',
  '/live',
  '/about',
  '/contact',
  '/privacy-policy',
  '/terms',
  '/docs',
];

const INDEXABLE = new Set(PUBLIC_INDEXABLE_PATHS);

// App screens that need an account. A signed-out visitor who opens one is
// sent to sign-in (and back afterwards) instead of seeing a stray page.
export const SIGNED_IN_PATHS = [
  '/collection',
  '/collections',
  '/community',
  '/expeditions',
  '/expedition/:expeditionId',
  '/market',
  '/specimen/:id',
  '/compare',
  '/chronolith',
  '/quests',
  '/dashboard',
  '/leaderboard',
  '/badges',
  '/companion',
  '/private-log',
  '/vault',
  '/profile',
  '/settings',
  '/paywall',
  '/admin',
  '/dev/architecture',
  '/dev/design-system',
];

export function normalizePath(pathname = '/') {
  const clean = String(pathname || '/').split(/[?#]/)[0].toLowerCase().replace(/\/+$/, '');
  return clean || '/';
}

export function isIndexablePath(pathname) {
  return INDEXABLE.has(normalizePath(pathname));
}

export function canonicalFor(pathname) {
  const p = normalizePath(pathname);
  return p === '/' ? `${SITE_ORIGIN}/` : `${SITE_ORIGIN}${p}`;
}

function upsertRobots(content) {
  let tag = document.getElementById('robots-meta') || document.head.querySelector('meta[name="robots"]');
  if (!tag) {
    tag = document.createElement('meta');
    tag.name = 'robots';
    tag.id = 'robots-meta';
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
}

function upsertCanonical(href) {
  let link = document.head.querySelector('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.rel = 'canonical';
    document.head.appendChild(link);
  }
  link.setAttribute('href', href);
  const og = document.head.querySelector('meta[property="og:url"]');
  if (og) og.setAttribute('content', href);
}

/** Mount once inside the router. Runs after page-level SEO hooks on each navigation. */
export function RouteSeo() {
  const { pathname } = useLocation();
  useEffect(() => {
    upsertRobots(isIndexablePath(pathname) ? 'index, follow' : 'noindex, nofollow');
    upsertCanonical(canonicalFor(pathname));
  }, [pathname]);
  return null;
}
