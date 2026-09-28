/**
 * Kept for compatibility: pages still call useSeoRobots(true/false), but the
 * robots meta is now decided per URL by <RouteSeo /> (src/lib/routeSeo.js),
 * which indexes exactly the public sitemap pages.
 *
 * Page-level control caused bugs: components rendered inside another page
 * could flip the whole URL (the sign-in card shown on "/" made the homepage
 * "noindex"), and effect ordering with lazy pages made the result unpredictable.
 */
export function useSeoRobots(_indexable = true) {
  // Intentionally a no-op; see RouteSeo.
}
