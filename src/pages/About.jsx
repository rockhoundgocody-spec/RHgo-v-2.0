import React from 'react';
import GlassPanel from '@/components/visuals/GlassPanel.jsx';
import HudFrame from '@/components/visuals/HudFrame.jsx';
import { useSeoRobots } from '@/lib/useSeoRobots';
import { useSeoMeta } from '@/lib/useSeoMeta';

export default function About() {
  useSeoRobots(true);
  useSeoMeta(
    'About RockHound-GO — Field companion for rockhounds',
    'RockHound-GO helps collectors identify minerals, find legal dig sites, and build a Geo-DEX collection with Clover as your field companion.',
  );
  return (
    <div className="px-4 lg:px-8 pt-6 pb-24 max-w-3xl mx-auto">
      <GlassPanel variant="amethyst">
        <HudFrame label="About">
          <h1 className="text-3xl lg:text-4xl font-bold text-white tracking-wide glow-amethyst">
            About RockHound-GO
          </h1>
          <p className="text-amethyst/70 text-xs uppercase tracking-[0.3em] mt-1 mb-6">
            Field tools for curious minds
          </p>

          <div className="space-y-4 text-white/80 leading-relaxed text-[15px]">
            <p>
              RockHound-GO is a field-first companion app for rockhounds, amateur
              geologists, and curious explorers who love the thrill of finding
              something extraordinary in the dirt. The app helps you discover
              public mineral hotspots near you, identify specimens with on-device
              AI, and build a beautifully organized personal collection that
              grows with every trip.
            </p>
            <p>
              We believe identification shouldn't require a lab. Point your
              phone at a rock, and the app will suggest likely minerals using a
              quantized neural network that runs locally — no signal required.
              When you're back in range, your finds sync to your collection,
              earn badges, and feed into your companion Amethyst, a gentle
              progress guide that learns alongside you.
            </p>
            <p>
              RockHound-GO is for hobbyists planning weekend digs, students
              studying mineralogy, families exploring state parks, and serious
              collectors who want a digital field notebook that respects their
              time. Public-land overlays (BLM, USFS, state parks) and trust
              scores help you stay on the right side of access rules.
            </p>
            <p>
              Built by a small independent team of developers, geologists, and
              outdoor enthusiasts, RockHound-GO is crafted with care and shaped
              by the community of rockhounds who use it. We listen, iterate
              quickly, and keep the app free of dark patterns. Every feature
              earns its place by helping you spend more time outside and less
              time fiddling with software.
            </p>
          </div>
        </HudFrame>
      </GlassPanel>
    </div>
  );
}