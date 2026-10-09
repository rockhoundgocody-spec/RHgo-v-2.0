import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Plus } from 'lucide-react';

const QUESTIONS = [
  ['Can I try it without an account?', 'Yes. Start with up to 7 free scans per day, resetting at midnight UTC. Identification needs an internet connection. Create an account when you want to keep your collection.'],
  ['How certain is a photo identification?', 'It is an AI suggestion, not a verified laboratory identification. Lighting, image quality, and similar-looking minerals affect the result. Review alternatives and gather more evidence before drawing conclusions.'],
  ['Does a map location mean I can collect there?', 'No. Access and collecting rights are different. Check current landowner or land-manager rules, permits, closures, and mining claims before visiting or collecting.'],
];
export default function DiscoveryClosing() {
  return <>
    <section className="discovery-container discovery-faq" aria-labelledby="faq-title"><div><p className="discovery-eyebrow">GOOD QUESTIONS</p><h2 id="faq-title">Wonder freely.<br />Explore thoughtfully.</h2></div><div>{QUESTIONS.map(([question, answer]) => <details key={question}><summary>{question}<Plus size={18} aria-hidden="true" /></summary><p>{answer}</p></details>)}</div></section>
    <section className="discovery-container discovery-closing"><p className="discovery-eyebrow">YOUR NEXT FIND STARTS HERE</p><h2>What’s in your pocket?</h2><p>Bring the curiosity. We’ll help you look closer.</p><Link to="/scan" className="discovery-button">Try a free scan <ArrowRight size={18} aria-hidden="true" /></Link><Link to="/register?next=%2F" className="discovery-text-button">Ready to collect? Create an account</Link></section>
    <footer className="discovery-container discovery-footer"><span>RockHound GO · Stay curious.</span><nav aria-label="Site information"><Link to="/pricing">Plans</Link><Link to="/privacy-policy">Privacy</Link><Link to="/terms">Terms</Link></nav></footer>
  </>;
}