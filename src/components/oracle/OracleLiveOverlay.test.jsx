// @vitest-environment jsdom
import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import OracleLiveOverlay from '@/components/oracle/OracleLiveOverlay';
const m = vi.hoisted(() => ({ phase: 'idle', start: vi.fn(), end: vi.fn(), pause: vi.fn(), nudge: vi.fn(), closeOracle: vi.fn(), open: true, voiceError: '', messages: [] }));
vi.mock('@/components/oracle/OracleContext', () => ({ useOracle: () => ({ open: m.open, closeOracle: m.closeOracle }) }));
vi.mock('@/components/hub/useCloverConversation', () => ({ default: () => ({ ...m, voiceSupported: true }) }));
vi.mock('@/components/visuals/AmethystOrb.jsx', () => ({ default: () => <div>Orb</div> }));
beforeEach(() => { vi.clearAllMocks(); m.phase = 'idle'; m.open = true; m.voiceError = ''; m.messages = []; });
afterEach(cleanup);
it('requests listening only after an explicit user gesture', () => {
  render(<OracleLiveOverlay />); expect(m.start).not.toHaveBeenCalled(); fireEvent.click(screen.getByRole('button', { name: 'Start microphone' })); expect(m.start).toHaveBeenCalledWith(expect.any(String), { listenFirst: true });
});
it('pauses and resumes through the shared conversation lifecycle', () => {
  m.phase = 'listening'; const view = render(<OracleLiveOverlay />); fireEvent.click(screen.getByRole('button', { name: 'Pause microphone' })); expect(m.pause).toHaveBeenCalled();
  m.phase = 'resting'; view.rerender(<OracleLiveOverlay />); fireEvent.click(screen.getByRole('button', { name: 'Resume microphone' })); expect(m.nudge).toHaveBeenCalled();
});
it('cleans up the live conversation when closed', () => {
  render(<OracleLiveOverlay />); fireEvent.click(screen.getByRole('button', { name: 'End live' })); expect(m.end).toHaveBeenCalled(); expect(m.closeOracle).toHaveBeenCalled();
});
it('displays permission failures and the last reply without a stalled spinner', () => {
  m.phase = 'resting'; m.voiceError = 'Microphone access denied'; m.messages = [{ role: 'assistant', content: 'Use a hand lens.' }]; render(<OracleLiveOverlay />);
  expect(screen.getByRole('alert').textContent).toContain('denied'); expect(screen.getByText('Use a hand lens.')).toBeTruthy();
});