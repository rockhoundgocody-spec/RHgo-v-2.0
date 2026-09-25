import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useState: (initial) => [typeof initial === 'function' ? initial() : initial, vi.fn()],
    useRef: (initial) => ({ current: initial }),
    useEffect: vi.fn(),
  };
});

vi.mock('@/components/oracle/useSpeech.jsx', () => ({
  useSpeechSynthesis: vi.fn(() => ({
    speak: vi.fn(),
    speaking: false,
  })),
}));

vi.mock('@/components/visuals/GlassPanel.jsx', () => ({
  default: ({ children, className }) => <div className={className}>{children}</div>,
}));

vi.mock('./SectionHeader.jsx', () => ({
  default: ({ title, subtitle }) => (
    <div>
      <h2>{title}</h2>
      <p>{subtitle}</p>
    </div>
  ),
}));

import CloverVoiceSection from './CloverVoiceSection.jsx';

describe('CloverVoiceSection Accessibility & Functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders section title and voice persona buttons with accessible aria attributes', () => {
    const tree = CloverVoiceSection();
    expect(tree).toBeTruthy();

    const glassPanel = tree.props.children;
    const container = glassPanel.props.children[1];
    const personaSection = container.props.children[0];
    const groupDiv = personaSection.props.children[1];

    expect(groupDiv.props.role).toBe('group');
    expect(groupDiv.props['aria-label']).toBe('Voice persona');

    const personaButtons = groupDiv.props.children;
    expect(personaButtons.length).toBe(5);

    const cloverButton = personaButtons[0];
    expect(cloverButton.props['aria-pressed']).toBe(true);
    expect(cloverButton.props['aria-label']).toBe('Clover voice persona — Irish-American · warm & melodic');

    const riverButton = personaButtons[1];
    expect(riverButton.props['aria-pressed']).toBe(false);
    expect(riverButton.props['aria-label']).toBe('River voice persona — American · calm');
  });

  it('renders speed, pitch, and volume sliders with aria-describedby pointing to hints', () => {
    const tree = CloverVoiceSection();
    const container = tree.props.children.props.children[1];

    const rateSliderElement = container.props.children[1];
    const pitchSliderElement = container.props.children[2];
    const volumeSliderElement = container.props.children[3];

    // Evaluate VoiceSlider component function directly
    const rateSliderTree = rateSliderElement.type(rateSliderElement.props);
    const pitchSliderTree = pitchSliderElement.type(pitchSliderElement.props);
    const volumeSliderTree = volumeSliderElement.type(volumeSliderElement.props);

    // Check rate slider
    const rateInput = rateSliderTree.props.children[1];
    const rateHint = rateSliderTree.props.children[2];
    expect(rateInput.props.id).toBe('clover-voice-rate');
    expect(rateInput.props['aria-describedby']).toBe('clover-voice-rate-hint');
    expect(rateHint.props.id).toBe('clover-voice-rate-hint');

    // Check pitch slider
    const pitchInput = pitchSliderTree.props.children[1];
    const pitchHint = pitchSliderTree.props.children[2];
    expect(pitchInput.props.id).toBe('clover-voice-pitch');
    expect(pitchInput.props['aria-describedby']).toBe('clover-voice-pitch-hint');
    expect(pitchHint.props.id).toBe('clover-voice-pitch-hint');

    // Check volume slider
    const volumeInput = volumeSliderTree.props.children[1];
    const volumeHint = volumeSliderTree.props.children[2];
    expect(volumeInput.props.id).toBe('clover-voice-volume');
    expect(volumeInput.props['aria-describedby']).toBe('clover-voice-volume-hint');
    expect(volumeHint.props.id).toBe('clover-voice-volume-hint');
  });

  it('renders action buttons with focus ring classes and polite aria-live feedback', () => {
    const tree = CloverVoiceSection();
    const container = tree.props.children.props.children[1];
    const buttonGroup = container.props.children[4];

    const previewButton = buttonGroup.props.children[0];
    const resetButton = buttonGroup.props.children[1];

    expect(previewButton.props.className).toContain('focus-visible:ring-amethyst-glow/70');
    expect(resetButton.props.className).toContain('focus-visible:ring-white/60');

    const ariaLiveSpan = previewButton.props.children;
    expect(ariaLiveSpan.props['aria-live']).toBe('polite');
  });
});
