// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, fireEvent, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import GuestReportContinuation from '@/components/scan/GuestReportContinuation';
import ReportEvidenceNote from '@/components/scan/ReportEvidenceNote';

afterEach(cleanup);
describe('Guest report follow-through', () => {
  it('offers optional registration and an explicit stay-a-guest action', () => {
    const onContinue = vi.fn();
    render(<MemoryRouter><GuestReportContinuation saved onContinue={onContinue} /></MemoryRouter>);
    expect(screen.getByText(/kept on this device/)).toBeTruthy();
    expect(screen.getByRole('link', { name: /Create a free account/ }).getAttribute('href')).toBe('/register');
    fireEvent.click(screen.getByRole('button', { name: /Stay a guest/ }));
    expect(onContinue).toHaveBeenCalledTimes(1);
  });
  it('shows the supplied next test without inventing evidence', () => {
    render(<ReportEvidenceNote result={{ verification_tests: [{ test: 'Test fixture', expected: 'Fixture outcome' }] }} />);
    expect(screen.getByText(/not independent verification/)).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Next check: Test fixture' })).toBeTruthy();
    expect(screen.getByText('Fixture outcome')).toBeTruthy();
    cleanup();
    render(<ReportEvidenceNote result={{}} />);
    expect(screen.queryByRole('heading')).toBeNull();
  });
});