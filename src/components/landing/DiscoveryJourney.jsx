import React from 'react';
import { Link } from 'react-router-dom';
import { Camera, Search, Gem, ArrowRight } from 'lucide-react';

const STEPS = [
  { Icon: Camera, title: 'Follow your curiosity.', text: 'Take a clear photo or upload one from your gallery. Natural light helps.' },
  { Icon: Search, title: 'Read the evidence.', text: 'Review possible matches, lookalikes, and suggested checks. Keep uncertainty in view.' },
  { Icon: Gem, title: 'Keep the story.', text: 'Create an account to save your finds in a collection you can return to.' },
];
export default function DiscoveryJourney() {
  return <section className="discovery-container discovery-journey" aria-labelledby="journey-title">
    <p className="discovery-eyebrow">02 / FROM POCKET TO COLLECTION</p><h2 id="journey-title">A little curiosity.<br />A whole new way to explore.</h2>
    <div className="discovery-steps">{STEPS.map(({ Icon, title, text }, i) => <article key={title}><div className="discovery-step-top"><Icon size={25} strokeWidth={1.4} aria-hidden="true" /><span>0{i + 1}</span></div><h3>{title}</h3><p>{text}</p></article>)}</div>
    <Link to="/scan" className="discovery-text-button">Start with the rock you have <ArrowRight size={16} aria-hidden="true" /></Link>
  </section>;
}