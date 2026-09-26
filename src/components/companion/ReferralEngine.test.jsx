import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockSetCopied = vi.fn();
const mockSetCreating = vi.fn();
const mockSetReferralCode = vi.fn();
const mockSetStats = vi.fn();
let mockCopiedState = false;

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useState: (initial) => {
      if (typeof initial === 'boolean') {
        if (initial === false) return [mockCopiedState, mockSetCopied];
        return [false, mockSetCreating];
      }
      if (initial === null) return ['REF123', mockSetReferralCode];
      return [{ total: 1, completed: 1, pending: 0, totalXpAwarded: 50 }, mockSetStats];
    },
    useCallback: (fn) => fn,
    useEffect: vi.fn(),
  };
});

vi.mock('@/api/base44Client', () => ({
  base44: {
    functions: {
      invoke: vi.fn().mockResolvedValue({
        data: {
          referrals: [{ referral_code: 'REF123' }],
          completed: 1,
          pending: 0,
          totalXpAwarded: 50,
        },
      }),
    },
  },
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, style, 'aria-label': ariaLabel, ...properties }) => (
      <div className={className} style={style} aria-label={ariaLabel} {...properties}>
        {children}
      </div>
    ),
  },
}));

import ReferralEngine from './ReferralEngine.jsx';

describe('ReferralEngine Accessibility and UX', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCopiedState = false;
  });

  it('renders progress bar with correct ARIA attributes', () => {
    const companion = { name: 'Rocky', level: 2 };
    const element = ReferralEngine({ companion });

    // Inspect the JSX tree for progressbar role
    const progressContainer = element.props.children[1];
    const progressBar = progressContainer.props.children[1];

    expect(progressBar.props.role).toBe('progressbar');
    expect(progressBar.props['aria-label']).toBe('Rocky evolution progress');
    expect(progressBar.props['aria-valuemin']).toBe(0);
    expect(progressBar.props['aria-valuemax']).toBe(100);
    expect(typeof progressBar.props['aria-valuenow']).toBe('number');
  });

  it('renders Copy referral link button with accessible attributes and focus-visible styling', () => {
    mockCopiedState = false;
    const element = ReferralEngine({ companion: null });

    const referralSection = element.props.children[3];
    const buttonRow = referralSection.props.children[0];
    const copyButton = buttonRow.props.children[1];

    expect(copyButton.props.type).toBe('button');
    expect(copyButton.props['aria-label']).toBe('Copy referral link');
    expect(copyButton.props['aria-live']).toBe('polite');
    expect(copyButton.props.className).toContain('focus-visible:ring-2');
    expect(copyButton.props.className).toContain('focus-visible:ring-amethyst-glow/50');
  });

  it('renders Copied referral link button with updated aria-label when copied', () => {
    mockCopiedState = true;
    const element = ReferralEngine({ companion: null });

    const referralSection = element.props.children[3];
    const buttonRow = referralSection.props.children[0];
    const copyButton = buttonRow.props.children[1];

    expect(copyButton.props['aria-label']).toBe('Copied referral link');
  });
});
