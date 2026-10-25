import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ScanLine, ChevronDown } from 'lucide-react';
import MineralArtwork from '@/components/showcase/MineralArtwork';

export default function ShowcaseHero() {
  return (
    <section className="showcase-hero" aria-labelledby="showcase-title">
      <div className="showcase-hero-copy">
        <p className="showcase-eyebrow"><span aria-hidden="true" /> A field companion for curious people</p>
        <h1 id="showcase-title">That rock<br />has a <span>story.</span></h1>
        <p className="showcase-hero-description">Start with a photo. Get a mineral field report with possible matches, visible clues, and the next thing to check.</p>
        <div className="flex flex-wrap items-center gap-3 mt-8">
          <Link to="/scan" className="showcase-primary"><ScanLine size={20} aria-hidden="true" /> Scan one free <ArrowRight size={18} aria-hidden="true" /></Link>
          <Link to="/demo" className="showcase-secondary">See the field journey</Link>
        </div>
        <p className="mt-4 text-sm text-showcase-muted">No account needed to try. AI guidance, not a verified identification.</p>
        <div className="showcase-hero-notes"><span>Look closer</span><span>Know what to test</span><span>Keep the story</span></div>
      </div>
      <MineralArtwork />
      <a href="#field-journey" className="showcase-scroll-link"><ChevronDown size={16} aria-hidden="true" /> From a question to a collection</a>
    </section>
  );
}