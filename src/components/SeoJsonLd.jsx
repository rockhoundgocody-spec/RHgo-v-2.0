import { useEffect } from 'react';

const SCRIPT_ID = 'rhgo-jsonld';

const DEFAULT_GRAPH = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': 'https://rhgo.me/#organization',
      name: 'RockHound-GO',
      url: 'https://rhgo.me',
      logo: 'https://media.base44.com/images/public/69f35dd14650b54681c835ec/ef9cbe044_generated_image.png',
      sameAs: [],
    },
    {
      '@type': 'WebSite',
      '@id': 'https://rhgo.me/#website',
      url: 'https://rhgo.me',
      name: 'RockHound-GO',
      publisher: { '@id': 'https://rhgo.me/#organization' },
      potentialAction: {
        '@type': 'SearchAction',
        target: 'https://rhgo.me/explore',
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@type': 'WebApplication',
      '@id': 'https://rhgo.me/#app',
      name: 'RockHound-GO',
      url: 'https://rhgo.me',
      applicationCategory: 'LifestyleApplication',
      operatingSystem: 'iOS, Android, Web',
      description:
        'AI field companion for rockhounds — identify minerals, find legal dig sites, and build your Geo-DEX collection.',
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
    let el = document.getElementById(SCRIPT_ID);
    if (!el) {
      el = document.createElement('script');
      el.id = SCRIPT_ID;
      el.type = 'application/ld+json';
      document.head.appendChild(el);
    }
    el.textContent = JSON.stringify(data);
  }, [data]);

  return null;
}
