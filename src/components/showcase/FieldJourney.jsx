import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import JourneyPanel from '@/components/showcase/JourneyPanel';

const STEPS = [{ title: 'Start with a find', label: 'Photograph' }, { title: 'Look at the evidence', label: 'Understand' }, { title: 'Ask a better question', label: 'Explore' }, { title: 'Keep its story', label: 'Collect' }];

export default function FieldJourney() {
  const [step, setStep] = useState(0);
  return (
    <section id="field-journey" className="showcase-journey" aria-labelledby="journey-title">
      <div className="showcase-section-heading"><div><p className="showcase-eyebrow">More than a name</p><h2 id="journey-title">One find.<br className="sm:hidden" /> A whole journey.</h2></div><p>Follow the workflow. No scan is performed here and no specimen results are simulated.</p></div>
      <div className="showcase-journey-layout">
        <div className="showcase-step-list" role="group" aria-label="Field journey steps">
          {STEPS.map((item, i) => <button type="button" key={item.label} onClick={() => setStep(i)} aria-pressed={step === i} aria-controls="journey-panel" className={`showcase-step ${step === i ? 'is-selected' : ''}`}><span className="showcase-step-number">0{i + 1}</span><span><span className="showcase-step-label">{item.label}</span><span className="showcase-step-title">{item.title}</span></span><ArrowRight size={18} aria-hidden="true" /></button>)}
        </div>
        <JourneyPanel step={step} />
      </div>
      <div className="showcase-journey-actions"><p>Ready to investigate your own find?</p><div className="flex flex-wrap gap-3">{step < 3 && <button className="showcase-secondary" type="button" onClick={() => setStep(step + 1)}>Next: {STEPS[step + 1].label}<ArrowRight size={16} aria-hidden="true" /></button>}<Link to="/scan" className="showcase-primary">Try a real scan<ArrowRight size={18} aria-hidden="true" /></Link></div></div>
    </section>
  );
}