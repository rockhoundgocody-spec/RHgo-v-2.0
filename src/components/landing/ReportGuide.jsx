import React, { useState } from 'react';
import { Fingerprint, Layers, FlaskConical } from 'lucide-react';

const PANELS = [
  { label: 'Visible clues', Icon: Fingerprint, title: 'More than a name.', text: 'Explore the color, texture, luster, and patterns the AI notices in your photo.', detail: 'A starting point for observation, not a laboratory result.' },
  { label: 'Lookalikes', Icon: Layers, title: 'Keep other possibilities open.', text: 'Compare possible matches and the distinguishing features to look for before settling on an identification.', detail: 'Similar-looking minerals can need very different tests.' },
  { label: 'Next steps', Icon: FlaskConical, title: 'Know what to check next.', text: 'Use suggested field checks to gather more evidence. Start with non-destructive observations and avoid testing an unknown material unsafely.', detail: 'A photo alone cannot establish composition, safety, or value.' },
];
export default function ReportGuide() {
  const [active, setActive] = useState(0);
  const panel = PANELS[active];
  const Icon = panel.Icon;
  const selectWithKeys = (event, index) => {
    const next = event.key === 'ArrowRight' ? (index + 1) % 3 : event.key === 'ArrowLeft' ? (index + 2) % 3 : event.key === 'Home' ? 0 : event.key === 'End' ? 2 : null;
    if (next === null) return;
    event.preventDefault(); setActive(next); document.getElementById(`report-tab-${next}`)?.focus();
  };
  return <section id="report-guide" className="discovery-container discovery-section" aria-labelledby="report-title">
    <div className="discovery-section-heading"><p className="discovery-eyebrow">01 / THE FIELD REPORT</p><h2 id="report-title">Less guessing.<br />More understanding.</h2><p>An identification should open your eyes, not close the case.</p></div>
    <div className="discovery-report">
      <div className="discovery-report-top"><span>INSIDE YOUR REPORT</span><span>Feature guide · not a live scan</span></div>
      <div role="tablist" aria-label="Field report features" className="discovery-tabs">{PANELS.map((item, i) => <button key={item.label} id={`report-tab-${i}`} role="tab" aria-selected={active === i} aria-controls="report-panel" tabIndex={active === i ? 0 : -1} onClick={() => setActive(i)} onKeyDown={event => selectWithKeys(event, i)}>{item.label}</button>)}</div>
      <div id="report-panel" role="tabpanel" aria-labelledby={`report-tab-${active}`} tabIndex={0} className="discovery-report-body"><Icon size={32} strokeWidth={1.4} aria-hidden="true" /><h3>{panel.title}</h3><p>{panel.text}</p><div className="discovery-report-note">{panel.detail}</div></div>
    </div>
  </section>;
}