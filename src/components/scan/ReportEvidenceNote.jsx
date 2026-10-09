import React from 'react';
import { FlaskConical } from 'lucide-react';

export default function ReportEvidenceNote({ result }) {
  const nextTest = result.verification_tests?.[0];
  return (
    <aside className="mb-4 rounded-xl border border-showcase-line bg-showcase-panel p-4 text-showcase-frost" aria-label="Identification limits and next check">
      <p className="text-xs leading-relaxed text-showcase-muted">AI confidence is not independent verification. Use the observations and alternatives to decide what to check next.</p>
      {(nextTest?.test || result.field_next_test) && <div className="mt-3 flex gap-2"><FlaskConical size={17} className="text-showcase-amber shrink-0 mt-0.5" aria-hidden="true" /><div><h3 className="text-sm font-semibold">Next check: {nextTest?.test || result.field_next_test}</h3>{nextTest?.expected && <p className="text-xs text-showcase-muted leading-relaxed mt-1">{nextTest.expected}</p>}</div></div>}
    </aside>
  );
}