import React from 'react';
import { FlaskConical, MapPin, Signal } from 'lucide-react';

const NOTES = [
  { Icon: FlaskConical, title: 'Curiosity, not false certainty.', text: 'A photo-based match is a starting point. Check the evidence and use appropriate tests before relying on an identification.' },
  { Icon: MapPin, title: 'Explore responsibly.', text: 'Access information is guidance. Verify current rules, permits, and claimholder permission before visiting or collecting.' },
  { Icon: Signal, title: 'Know what needs a connection.', text: 'AI identification needs internet access. Previously saved information may be available offline; prepare before heading out.' },
];

export default function ShowcaseTrust() {
  return (
    <section className="showcase-trust" aria-label="Field kit principles">
      {NOTES.map(({ Icon, title, text }) => <article key={title}><Icon size={23} strokeWidth={1.5} className="text-showcase-amber" aria-hidden="true" /><h2 className="text-lg font-heading font-semibold mt-5">{title}</h2><p className="mt-3 text-sm leading-relaxed text-showcase-muted">{text}</p></article>)}
    </section>
  );
}