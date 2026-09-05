import { useEffect } from 'react';

const DEFAULT_TITLE = 'RockHound-GO — Field Companion for Rockhounds';
const DEFAULT_DESCRIPTION =
  'RockHound-GO — AI-powered field companion for rockhounds. Identify minerals instantly with AR scan, discover hotspots, and build your Geo-DEX collection.';

function setMetaTag(selector, attr, key, value) {
  let tag = document.head.querySelector(selector);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attr, key);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', value);
}

/**
 * Sets a unique <title> and meta description for the current page, overriding
 * the platform's boilerplate default. Restores the app default on unmount so
 * the next route is never left with a stale title.
 *
 * @param {string} title       — full page <title>
 * @param {string} description — meta description (≤160 chars recommended)
 */
export function useSeoMeta(title, description) {
  useEffect(() => {
    const prevTitle = document.title;
    const prevOgTitle = document.head.querySelector('meta[property="og:title"]')?.getAttribute('content') || '';
    if (title) {
      document.title = title;
      setMetaTag('meta[property="og:title"]', 'property', 'og:title', title);
      setMetaTag('meta[name="twitter:title"]', 'name', 'twitter:title', title);
    }
    if (description) {
      setMetaTag('meta[name="description"]', 'name', 'description', description);
      setMetaTag('meta[property="og:description"]', 'property', 'og:description', description);
      setMetaTag('meta[name="twitter:description"]', 'name', 'twitter:description', description);
    }
    return () => {
      document.title = prevTitle;
      setMetaTag('meta[property="og:title"]', 'property', 'og:title', prevOgTitle || DEFAULT_TITLE);
      setMetaTag('meta[name="twitter:title"]', 'name', 'twitter:title', prevOgTitle || DEFAULT_TITLE);
      if (description) {
        setMetaTag('meta[name="description"]', 'name', 'description', DEFAULT_DESCRIPTION);
        setMetaTag('meta[property="og:description"]', 'property', 'og:description', DEFAULT_DESCRIPTION);
        setMetaTag('meta[name="twitter:description"]', 'name', 'twitter:description', DEFAULT_DESCRIPTION);
      }
    };
  }, [title, description]);
}