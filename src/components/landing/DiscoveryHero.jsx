import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Gem, ScanLine, ArrowDown } from 'lucide-react';

export const DISCOVERY_IMAGE = 'https://media.base44.com/images/public/69f35dd14650b54681c835ec/9c82fffec_generated_image.png';
export default function DiscoveryHero() {
  return <>
    <header className="discovery-header discovery-container">
      <Link to="/?welcome=1" className="discovery-brand" aria-label="RockHound GO home"><Gem aria-hidden="true" size={25} /><span>RockHound <b>GO</b></span></Link>
      <Link to="/signin" className="discovery-signin">Sign in <ArrowRight size={15} aria-hidden="true" /></Link>
    </header>
    <section className="discovery-hero discovery-container" aria-labelledby="discovery-title">
      <div className="discovery-hero-copy">
        <p className="discovery-eyebrow"><span /> FOR THE CURIOUS. BUILT FOR THE FIELD.</p>
        <h1 id="discovery-title">Not just a rock.<br /><em>A discovery.</em></h1>
        <p className="discovery-lead">That find in your pocket has a story. Get an AI field report with possible matches, visible clues, and what to check next.</p>
        <Link to="/scan" className="discovery-button"><ScanLine size={20} aria-hidden="true" /> Scan my first rock <ArrowRight size={18} aria-hidden="true" /></Link>
        <p className="discovery-cta-note">7 free scans a day · No account to start</p>
        <button className="discovery-text-button" onClick={() => document.getElementById('report-guide')?.scrollIntoView({ behavior: 'auto', block: 'start' })}>See what you get <ArrowDown size={15} aria-hidden="true" /></button>
      </div>
      <figure className="discovery-specimen">
        <img src={DISCOVERY_IMAGE} alt="Illustrative amber-toned banded agate with light passing through its layers" width="1536" height="1024" fetchpriority="high" />
        <div className="discovery-photo-corners" aria-hidden="true" />
        <figcaption><span>LOOK CLOSER.</span><span>Illustrative specimen</span></figcaption>
      </figure>
    </section>
    <div className="discovery-principles discovery-container"><span>Curiosity first.</span><span>Evidence over certainty.</span><span>Your eye still checks.</span></div>
  </>;
}