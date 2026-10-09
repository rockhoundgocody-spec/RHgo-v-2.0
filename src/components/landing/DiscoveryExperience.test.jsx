// @vitest-environment jsdom
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, renderHook, screen, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ReportGuide from '@/components/landing/ReportGuide';
import GuestSaveInvitation from '@/components/scan/GuestSaveInvitation';
import useSaveFeedback from '@/components/scan/useSaveFeedback';

afterEach(cleanup);
describe('discovery and first-find journey', () => {
  it('changes report features by click and keyboard', () => {
    render(<ReportGuide />);
    fireEvent.click(screen.getByRole('tab', { name: 'Lookalikes' }));
    expect(screen.getByRole('tabpanel').textContent).toContain('Keep other possibilities open.');
    fireEvent.keyDown(screen.getByRole('tab', { name: 'Lookalikes' }), { key: 'ArrowRight' });
    expect(screen.getByRole('tabpanel').textContent).toContain('Know what to check next.');
    expect(document.activeElement.id).toBe('report-tab-2');
  });
  it('offers signup and login returning to the existing report-recovery destination', () => {
    const onContinue = vi.fn();
    render(<MemoryRouter><GuestSaveInvitation mineralName="Quartz" onContinue={onContinue} /></MemoryRouter>);
    expect(screen.getByRole('link', { name: /Create account/ }).getAttribute('href')).toBe('/register?next=%2F');
    expect(screen.getByRole('link', { name: /Already have/ }).getAttribute('href')).toBe('/signin?next=%2F');
    expect(screen.getByText(/Another guest scan replaces/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Continue without an account' }));
    expect(onContinue).toHaveBeenCalledTimes(1);
  });
  it('blocks duplicate saves and exposes a recoverable failure', async () => {
    const { result } = renderHook(() => useSaveFeedback());
    let rejectSave;
    const action = vi.fn(() => new Promise((_, reject) => { rejectSave = reject; }));
    let pending;
    act(() => { pending = result.current.runSave(action); });
    await act(async () => { await result.current.runSave(action); });
    expect(action).toHaveBeenCalledTimes(1);
    expect(result.current.saving).toBe(true);
    await act(async () => { rejectSave(new Error('offline')); await pending; });
    expect(result.current.saving).toBe(false);
    expect(result.current.saveError).toContain('Your report is still open');
    await act(async () => { await result.current.runSave(async () => {}); });
    expect(result.current.saveError).toBe('');
  });
});