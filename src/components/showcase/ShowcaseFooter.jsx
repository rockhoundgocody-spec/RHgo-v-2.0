import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export default function ShowcaseFooter() {
  return (
    <footer className="showcase-footer">
      <div className="showcase-closing"><div><p className="showcase-eyebrow">Your next discovery starts here</p><h2>Bring your curiosity.<br />We’ll bring the field kit.</h2></div><Link to="/scan" className="showcase-primary">Scan one free<ArrowRight size={18} aria-hidden="true" /></Link></div>
      <div className="showcase-footer-links"><Link to="/" className="font-heading font-semibold">RockHound GO</Link><nav aria-label="Public information" className="flex flex-wrap gap-x-6 gap-y-2"><Link to="/pricing">Plans</Link><Link to="/privacy-policy">Privacy</Link><Link to="/terms">Terms</Link></nav><span>Built for the field. Kept for the story.</span></div>
    </footer>
  );
}