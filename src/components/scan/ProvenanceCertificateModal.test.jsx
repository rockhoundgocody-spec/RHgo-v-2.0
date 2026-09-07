import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeAll, describe, expect, it, vi } from 'vitest';

globalThis.window = {
  self: 1,
  top: 1,
  location: { href: 'http://localhost' },
  addEventListener: () => {},
  removeEventListener: () => {},
};

globalThis.SVGElement = class SVGElement {};

let ProvenanceCertificateModal;

describe('ProvenanceCertificateModal', () => {
  beforeAll(async () => {
    ProvenanceCertificateModal = (await import('./ProvenanceCertificateModal')).default;
  });

  const mockResult = {
    top_match: 'Amethyst',
    rarity: 'Uncommon',
    value_estimate: '$50 – $100',
    hardness_mohs: '7.0',
    chemical_formula: 'SiO2',
    crystal_system: 'Trigonal',
  };

  it('renders nothing when open is false or result is null', () => {
    const markupClosed = renderToStaticMarkup(
      <ProvenanceCertificateModal open={false} result={mockResult} onClose={() => {}} />
    );
    expect(markupClosed).toBe('');

    const markupNoResult = renderToStaticMarkup(
      <ProvenanceCertificateModal open={true} result={null} onClose={() => {}} />
    );
    expect(markupNoResult).toBe('');
  });

  it('renders modal dialog with accessible properties when open', () => {
    const onClose = vi.fn();
    const markup = renderToStaticMarkup(
      <ProvenanceCertificateModal
        open={true}
        result={mockResult}
        savedId="spec-123456"
        gpsCoords={{ lat: 37.7749, lng: -122.4194 }}
        onClose={onClose}
      />
    );

    expect(markup).toContain('role="dialog"');
    expect(markup).toContain('aria-modal="true"');
    expect(markup).toContain('aria-labelledby=');
    expect(markup).toContain('aria-label="Close provenance certificate"');
    expect(markup).toContain('focus-visible:ring-amber-400/60');
    expect(markup).toContain('RockHound-GO Codex');
  });
});
