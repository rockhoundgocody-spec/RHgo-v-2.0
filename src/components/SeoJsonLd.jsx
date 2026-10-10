import { useEffect } from 'react';

const SCRIPT_ID = 'rhgo-jsonld';

const DEFAULT_GRAPH = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': 'https://rhgo.me/#organization',
      name: 'RockHound GO',
      url: 'https://rhgo.me',
      logo: 'https://rhgo.me/icons/icon-512.png',
      sameAs: [],
    },
    {
      '@type': 'WebSite',
      '@id': 'https://rhgo.me/#website',
      url: 'https://rhgo.me',
      name: 'RockHound GO',
      publisher: { '@id': 'https://rhgo.me/#organization' },
    },
    {
      '@type': 'WebApplication',
      '@id': 'https://rhgo.me/#app',
      name: 'RockHound GO',
      url: 'https://rhgo.me',
      applicationCategory: 'LifestyleApplication',
      operatingSystem: 'iOS, Android, Web',
      description:
        'AI field companion for rockhounds: explore possible mineral matches, check access guidance, and build a personal collection.',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
      publisher: { '@id': 'https://rhgo.me/#organization' },
    },
  ],
};

/**
 * Injects Organization / WebSite / WebApplication JSON-LD once.
 * Mount on public Landing (and optionally other marketing pages).
 */
export default function SeoJsonLd({ data = DEFAULT_GRAPH } = {}) {
  useEffect(() => {
    let el = /** @type {HTMLScriptElement | null} */ (document.getElementById(SCRIPT_ID));
    if (!el) {
      el = document.createElement('script');
      el.id = SCRIPT_ID;
      el.type = 'application/ld+json';
      document.head.appendChild(el);
    }
    el.textContent = JSON.stringify(data);
    return () => el.remove();
  }, [data]);

  return null;
}