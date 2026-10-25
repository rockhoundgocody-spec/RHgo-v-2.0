// @vitest-environment jsdom
import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import ScanCloverVoice from '@/components/scan/ScanCloverVoice';
const m = vi.hoisted(() => ({ start: vi.fn(), end: vi.fn(), pause: vi.fn(), send: vi.fn(), nudge: vi.fn(), unlock: vi.fn(), phase: 'idle', error: '', options: null }));
vi.mock('@/components/hub/useCloverConversation', () => ({ default: options => { m.options = options; return { ...m, voiceError: m.error, voiceSupported: true, messages: [{ role: 'assistant', content: 'Scan guidance' }] }; } }));
beforeEach(() => { vi.clearAllMocks(); m.phase = 'idle'; m.error = ''; });
afterEach(cleanup);
it('starts recognition directly from the scan microphone tap', () => {
  render(<ScanCloverVoice />); fireEvent.click(screen.getByRole('button', { name: 'Talk to Clover during scan' }));
  expect(m.start).toHaveBeenCalledWith(expect.any(String), { listenFirst: true }); expect(screen.getByRole('region', { name: 'Clover scan conversation' })).toBeTruthy();
});
it('passes the current tentative scan, not an invented camera observation', () => {
  render(<ScanCloverVoice result={{ top_match: 'Quartz', confidence: 0.7, observed_features: [{ feature: 'luster', value: 'glassy' }] }} />);
  expect(m.options.scanContext.label).toBe('Quartz'); expect(m.options.scanContext.preview).toBe(false); expect(m.options.scanContext.evidence).toContain('glassy');
});
it('does not pass stale live labels as current evidence', () => {
  render(<ScanCloverVoice eyes={{ stale: true, candidates: [{ name: 'Quartz' }] }} />); expect(m.options.scanContext).toBeNull();
});
it('pauses the microphone during image identification', () => {
  render(<ScanCloverVoice paused />); expect(m.pause).toHaveBeenCalled(); expect(screen.queryByRole('button')).toBeNull();
});
it('keeps typing available when microphone permission fails', () => {
  m.phase = 'resting'; m.error = 'Microphone denied'; render(<ScanCloverVoice />); fireEvent.click(screen.getByRole('button', { name: 'Talk to Clover during scan' }));
  expect(screen.getByRole('alert').textContent).toBe('Microphone denied'); fireEvent.change(screen.getByLabelText('Message Clover during scan'), { target: { value: 'What next?' } }); fireEvent.click(screen.getByRole('button', { name: 'Send' })); expect(m.send).toHaveBeenCalledWith('What next?');
});
it('ends the conversation without leaving the scan screen', () => {
  render(<ScanCloverVoice />); fireEvent.click(screen.getByRole('button', { name: 'Talk to Clover during scan' })); fireEvent.click(screen.getByRole('button', { name: 'End scan conversation' })); expect(m.end).toHaveBeenCalled();
});
it('opens scan questions from the report Ask action', () => {
  const ref = React.createRef(); render(<ScanCloverVoice ref={ref} />); act(() => ref.current.open()); expect(m.start).toHaveBeenCalledWith(expect.any(String), { listenFirst: true });
});