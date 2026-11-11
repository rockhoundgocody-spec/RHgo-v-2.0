// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import DailyCheckIn from './DailyCheckIn.jsx';
import { base44 } from '@/api/base44Client';
import { getLocalDayKey } from '@/lib/dayKey';

vi.mock('@/api/base44Client', () => ({
  base44: {
    functions: {
      invoke: vi.fn(),
    },
  },
}));

describe('DailyCheckIn', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders check-in card with accessible radiogroup when not checked in today', () => {
    render(<DailyCheckIn companion={{ last_check_in_date: '2020-01-01' }} />);

    const group = screen.getByRole('radiogroup', { name: /select your mood today/i });
    expect(group).not.toBeNull();

    const moodRadios = screen.getAllByRole('radio');
    expect(moodRadios).toHaveLength(5);
    moodRadios.forEach((radio) => {
      expect(radio.getAttribute('aria-checked')).toBe('false');
    });

    const submitBtn = screen.getByRole('button', { name: /check in/i });
    expect(submitBtn.hasAttribute('disabled')).toBe(true);
    expect(submitBtn.getAttribute('aria-busy')).toBe('false');
  });

  it('returns null if companion was already checked in today', () => {
    const today = getLocalDayKey();
    const { container } = render(<DailyCheckIn companion={{ last_check_in_date: today }} />);
    expect(container.firstChild).toBeNull();
  });

  it('allows selecting mood, typing intention, and submitting via click', async () => {
    base44.functions.invoke.mockResolvedValueOnce({ data: { ok: true } });
    const onCheckedIn = vi.fn();

    render(<DailyCheckIn companion={null} onCheckedIn={onCheckedIn} />);

    const greatRadio = screen.getAllByRole('radio').find((r) => r.textContent.includes('Great'));
    expect(greatRadio).toBeDefined();
    fireEvent.click(greatRadio);
    expect(greatRadio.getAttribute('aria-checked')).toBe('true');

    const input = screen.getByLabelText(/daily intention/i);
    fireEvent.change(input, { target: { value: 'Find a cool agate' } });

    const submitBtn = screen.getByRole('button', { name: /check in/i });
    expect(submitBtn.hasAttribute('disabled')).toBe(false);

    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(base44.functions.invoke).toHaveBeenCalledWith('dailyCheckIn', expect.objectContaining({
        mood_label: 'great',
        intention: 'Find a cool agate',
      }));
    });

    expect(onCheckedIn).toHaveBeenCalledWith({
      mood_label: 'great',
      intention: 'Find a cool agate',
    });
  });

  it('submits on Enter key from intention input when mood is picked', async () => {
    base44.functions.invoke.mockResolvedValueOnce({ data: { ok: true } });
    const onCheckedIn = vi.fn();

    render(<DailyCheckIn companion={null} onCheckedIn={onCheckedIn} />);

    const okayRadio = screen.getAllByRole('radio').find((r) => r.textContent.includes('Okay'));
    expect(okayRadio).toBeDefined();
    fireEvent.click(okayRadio);

    const input = screen.getByLabelText(/daily intention/i);
    fireEvent.change(input, { target: { value: 'Be calm and observe' } });

    fireEvent.keyDown(input, { key: 'Enter' });

    await waitFor(() => {
      expect(base44.functions.invoke).toHaveBeenCalledWith('dailyCheckIn', expect.objectContaining({
        mood_label: 'okay',
        intention: 'Be calm and observe',
      }));
    });

    expect(onCheckedIn).toHaveBeenCalledWith({
      mood_label: 'okay',
      intention: 'Be calm and observe',
    });
  });
});
