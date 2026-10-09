import React from 'react';
import { useSeoRobots } from '@/lib/useSeoRobots';
import { useSeoMeta } from '@/lib/useSeoMeta';
import SeoJsonLd from '@/components/SeoJsonLd.jsx';
import DiscoveryHero from '@/components/landing/DiscoveryHero.jsx';
import ReportGuide from '@/components/landing/ReportGuide.jsx';
import DiscoveryJourney from '@/components/landing/DiscoveryJourney.jsx';
import DiscoveryClosing from '@/components/landing/DiscoveryClosing.jsx';
import '@/components/landing/landing.css';

export default function Landing() {
  useSeoRobots(true);
  useSeoMeta('RockHound GO | Turn curiosity into discovery', 'Start with 7 free daily AI rock scans. Explore possible mineral matches, visible clues, and suggested field checks, then build your collection.');
  return <div className="discovery-page" data-public-landing>
    <SeoJsonLd />
    <DiscoveryHero />
    <ReportGuide />
    <DiscoveryJourney />
    <DiscoveryClosing />
  </div>;
}