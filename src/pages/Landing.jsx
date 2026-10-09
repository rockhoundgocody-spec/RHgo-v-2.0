import React from 'react';
import { useSeoMeta } from '@/lib/useSeoMeta';
import SeoJsonLd from '@/components/SeoJsonLd';
import ShowcaseHeader from '@/components/showcase/ShowcaseHeader';
import ShowcaseHero from '@/components/showcase/ShowcaseHero';
import FieldJourney from '@/components/showcase/FieldJourney';
import ShowcaseTrust from '@/components/showcase/ShowcaseTrust';
import ShowcaseFooter from '@/components/showcase/ShowcaseFooter';

export default function Landing({ walkthrough = false }) {
  useSeoMeta(
    walkthrough ? 'The field journey | RockHound GO' : 'RockHound GO | Every find has a story',
    'Start with a photo. Explore possible mineral matches, evidence, and field tests. Try a guest scan and discover the RockHound GO field journey.'
  );
  return (
    <div className="showcase-page bg-showcase-ink text-showcase-frost font-body">
      <SeoJsonLd />
      <ShowcaseHeader />
      <main id={walkthrough ? 'main-content' : 'showcase-content'} tabIndex={-1} className="outline-none">
        <ShowcaseHero />
        <FieldJourney />
        <ShowcaseTrust />
      </main>
      <ShowcaseFooter />
    </div>
  );
}