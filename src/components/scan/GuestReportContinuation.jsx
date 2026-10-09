import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ScanLine } from 'lucide-react';

export default function GuestReportContinuation({ onContinue, saved = false }) {
  return (
    <section className="rounded-2xl border border-showcase-line bg-showcase-panel p-5 text-showcase-frost font-body" aria-label="Keep exploring as a guest">
      <h2 className="text-lg font-heading font-semibold">{saved ? 'Your find, kept on this device.' : 'A first find is just the beginning.'}</h2>
      <p className="text-sm text-showcase-muted leading-relaxed mt-2">{saved ? 'Create a free account to sync your guest report and start a cloud collection.' : 'Your report is kept on this device. Join when you’re ready to build a cloud collection.'}</p>
      <div className="flex flex-col sm:flex-row gap-3 mt-4">
        <Link to="/register" className="showcase-primary">Create a free account<ArrowRight size={16} aria-hidden="true" /></Link>
        {saved && <button type="button" onClick={onContinue} className="showcase-secondary"><ScanLine size={16} aria-hidden="true" />Stay a guest</button>}
      </div>
      <p className="text-xs leading-relaxed text-showcase-muted mt-3">Existing guest scan limits still apply. Joining is optional.</p>
    </section>
  );
}