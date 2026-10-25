import React from 'react';
import { ScanLine, FlaskConical, MessageCircle, Gem, Shield } from 'lucide-react';

const CONTENT = [
  { Icon: ScanLine, heading: 'A photograph. A better question.', body: 'Use the camera or choose a photo. Good daylight and a clear view help the report distinguish visible features.', items: ['Photograph the specimen', 'Review possible matches', 'Treat confidence as guidance, not proof'], detail: 'A photo starts the investigation. It does not finish it.' },
  { Icon: FlaskConical, heading: 'Evidence before certainty.', body: 'Your report brings together visible clues, alternatives, and suggested field tests. Add your own observations to strengthen the record.', items: ['Compare the observed features', 'Consider the lookalikes', 'Choose a suitable next test'], detail: 'An uncertain result is a reason to investigate, not a reason to guess.' },
  { Icon: MessageCircle, heading: 'Meet Clover, your field companion.', body: 'Ask a rockhounding question by voice or text. Use the guidance to decide what to investigate next, and verify important conclusions.', items: ['Ask a focused question', 'Read or listen to the guidance', 'Check access before collecting'], detail: 'Unknown land access stays unknown. Public land is not automatic permission.' },
  { Icon: Gem, heading: 'Keep more than a mineral name.', body: 'Members can build a collection with photos, field notes, and location privacy choices. A guest report can be kept on this device before joining.', items: ['Record kept, left, or observed', 'Choose how to record the location', 'Return to your collection as you learn'], detail: 'Cloud collection requires an account. Identification requires a connection.' },
];

export default function JourneyPanel({ step }) {
  const { Icon, heading, body, items, detail } = CONTENT[step];
  return (
    <div id="journey-panel" className="showcase-journey-panel" role="region" aria-label={heading} aria-live="polite">
      <div className="showcase-panel-top"><span className="showcase-panel-icon"><Icon size={28} strokeWidth={1.4} aria-hidden="true" /></span><span className="showcase-eyebrow">Field journey / 0{step + 1}</span></div>
      <h3 className="font-heading text-2xl sm:text-3xl font-semibold tracking-tight mt-7">{heading}</h3>
      <p className="text-showcase-muted leading-relaxed mt-3 max-w-xl">{body}</p>
      <ol className="showcase-evidence-list">{items.map((item, i) => <li key={item}><span>0{i + 1}</span>{item}</li>)}</ol>
      <div className="showcase-panel-foot"><Shield size={17} aria-hidden="true" /><p>{detail}</p></div>
    </div>
  );
}