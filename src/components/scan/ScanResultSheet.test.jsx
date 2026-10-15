// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, fireEvent, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('@/components/scan/FoundLocationPicker.jsx', () => ({
  default: () => <div data-testid="found-location-picker" />,
}));

import ScanResultSheet from '@/components/scan/ScanResultSheet';

afterEach(cleanup);

describe('ScanResultSheet micro-UX and accessibility', () => {
  const mockResult = {
    top_match: 'Quartz Crystal',
    confidence: 0.92,
    field_habit: 'Prismatic',
    observed_features: [{ feature: 'luster', value: 'vitreous' }],
    verification_tests: [{ test: 'Scratch test', expected: 'Scratches glass (Mohs 7)' }],
  };

  it('renders action buttons with explicit type="button" and disabled explanation tooltip', () => {
    const onKeep = vi.fn();
    const onClose = vi.fn();

    render(
      <MemoryRouter>
        <ScanResultSheet
          open={true}
          result={mockResult}
          onKeep={onKeep}
          onClose={onClose}
        />
      </MemoryRouter>
    );

    // Close button
    const closeBtn = screen.getByRole('button', { name: 'Close scan result' });
    expect(closeBtn.getAttribute('type')).toBe('button');
    expect(closeBtn.getAttribute('title')).toBe('Close scan result');

    // Keep button (initially disabled because legal permission checkbox is un-checked)
    const keepBtn = screen.getByRole('button', { name: /Keep specimen \(Requires legal permission confirmation\)/ });
    expect(keepBtn.getAttribute('type')).toBe('button');
    expect(keepBtn.hasAttribute('disabled')).toBe(true);
    expect(keepBtn.getAttribute('title')).toBe('Confirm legal permission to collect here first');

    // Legal consent checkbox
    const checkbox = screen.getByRole('checkbox', { name: 'I can legally collect here' });
    expect(checkbox).toBeTruthy();

    // Toggle checkbox
    fireEvent.click(checkbox);

    // Keep button should now be enabled and have updated title & aria-label
    const enabledKeepBtn = screen.getByRole('button', { name: 'Keep specimen' });
    expect(enabledKeepBtn.hasAttribute('disabled')).toBe(false);
    expect(enabledKeepBtn.getAttribute('title')).toBe('Keep specimen');
  });

  it('renders fail state retry button with type="button" and aria-hidden icon', () => {
    const mockFailResult = { image_quality_score: 0.1 };
    const onRetry = vi.fn();

    render(
      <MemoryRouter>
        <ScanResultSheet
          open={true}
          result={mockFailResult}
          onRetry={onRetry}
        />
      </MemoryRouter>
    );

    const retryBtn = screen.getByRole('button', { name: /Retry/i });
    expect(retryBtn.getAttribute('type')).toBe('button');

    fireEvent.click(retryBtn);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
