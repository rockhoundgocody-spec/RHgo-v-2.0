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

/**
 * Branded meta descriptions per public route. Non-indexable routes fall back
 * to the default description from index.html (they're noindex anyway, but a
 * matching description still helps social scrapers that ignore robots).
 */
export const ROUTE_DESCRIPTIONS = {
  '/': 'RockHound-GO is the AI field companion for rockhounds. Scan a photo to identify any mineral, check land access before you collect, and build your Geo-DEX collection.',
  '/scan': 'Scan a rock or mineral from your phone camera and get an instant AI identification with confidence, rarity, and field properties. Free to try on RockHound-GO.',
  '/demo': 'Watch RockHound-GO in action. See the AI mineral scanner, hotspot map, and Geo-DEX collection in a live demo before you sign up.',
  '/pricing': 'RockHound-GO plans from free to Pro. AI mineral identification, offline hotspot maps, and unlimited collection logging. Compare tiers and start free.',
  '/agate-guide': 'The complete Lake Superior agate guide on RockHound-GO. How to identify, where to find, and what makes each variety special. A free field reference.',
  '/find-of-the-week': 'Vote for Find of the Week in the RockHound-GO community. See the best specimens rockhounds found this week and cast your ballot.',
  '/clubs': 'Find and join gem and mineral clubs near you on RockHound-GO. Chapter meetings, field trips, and events for rockhound communities.',
  '/live': 'Watch live field broadcasts from rockhounds scanning minerals in real time on RockHound-GO. See AI identifications happen live and chat with the community.',
  '/about': 'RockHound-GO is built by collectors, for collectors. An honest AI field kit for serious rockhounds. Learn about our mission, team, and values.',
  '/contact': 'Get in touch with the RockHound-GO team. Support, partnerships, feedback, and press inquiries. We are here to help fellow rockhounds.',
  '/docs': 'RockHound-GO documentation and field guides. How to use the AI scanner, hotspot map, collection tools, and every feature in the app.',
  '/privacy-policy': 'RockHound-GO privacy policy. How we handle specimen photos, location data, AI identification, child accounts, and your deletion rights.',
  '/terms': 'RockHound-GO terms of service. Collection ethics, land access rules, community guidelines, and subscription terms for the AI field kit.',
};

const DEFAULT_DESCRIPTION = 'Identify rocks and minerals from a photo, check land status before you collect, and log every find in your Geo-DEX. The AI field kit for rockhounds.';

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

function upsertDescription(content) {
  let tag = document.head.querySelector('meta[name="description"]');
  if (!tag) {
    tag = document.createElement('meta');
    tag.name = 'description';
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
    const p = normalizePath(pathname);
    upsertRobots(isIndexablePath(pathname) ? 'index, follow' : 'noindex, nofollow');
    upsertCanonical(canonicalFor(pathname));
    upsertDescription(ROUTE_DESCRIPTIONS[p] || DEFAULT_DESCRIPTION);
  }, [pathname]);
  return null;
}