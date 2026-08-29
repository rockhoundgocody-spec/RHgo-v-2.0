import { describe, it, expect, vi } from 'vitest';
import ChronolithOpening, {
  PointOfLight,
  OpeningText,
  HypothesesList,
  InvestigationSummary,
  EnterTrialButton,
  getSkipButtonProps,
} from './ChronolithOpening.jsx';

describe('ChronolithOpening subcomponents & module exports', () => {
  it('exports ChronolithOpening as default function', () => {
    expect(typeof ChronolithOpening).toBe('function');
  });

  it('exports PointOfLight as function component', () => {
    expect(typeof PointOfLight).toBe('function');
    const element = PointOfLight({ phase: 1, imageUrl: 'https://example.com/stone.jpg' });
    expect(element).toBeDefined();
  });

  it('exports OpeningText as function component', () => {
    expect(typeof OpeningText).toBe('function');
    const element = OpeningText({ phase: 2 });
    expect(element).toBeDefined();
  });

  it('exports HypothesesList as function component', () => {
    expect(typeof HypothesesList).toBe('function');
    const hypotheses = [
      { id: '1', name: 'Meteorite Impact', probability: 0.8, contradictions: [] },
      { id: '2', name: 'Volcanic Eruption', probability: 0.2, contradictions: ['High quartz content'] },
    ];
    const element = HypothesesList({ hypotheses, leadingH: hypotheses[0] });
    expect(element).toBeDefined();
  });

  it('handles empty or missing hypotheses in HypothesesList gracefully', () => {
    expect(HypothesesList({ hypotheses: [] })).toBeNull();
    expect(HypothesesList({ hypotheses: null })).toBeNull();
  });

  it('exports InvestigationSummary as function component', () => {
    expect(typeof InvestigationSummary).toBe('function');
    const caseData = {
      opening_statement: 'A mysterious crystalline formation found in deep crust.',
      estimated_age_range: '120M - 150M Years',
      candidate_environments: ['Hydrothermal Vent', 'Magmatic Chamber'],
      hypotheses: [
        { id: '1', name: 'Deep Magma Cooling', probability: 0.9, contradictions: [] }
      ]
    };
    const element = InvestigationSummary({
      phase: 3,
      caseData,
      imageUrl: 'https://example.com/specimen.png',
      hypotheses: caseData.hypotheses,
      leadingH: caseData.hypotheses[0]
    });
    expect(element).toBeDefined();
  });

  it('exports EnterTrialButton as function component', () => {
    expect(typeof EnterTrialButton).toBe('function');
    const element = EnterTrialButton({ phase: 4, onEnter: () => {} });
    expect(element).toBeDefined();
  });

  it('returns proper skip button accessibility props from getSkipButtonProps', () => {
    const onSkip = vi.fn();
    const props = getSkipButtonProps(onSkip);
    expect(props['aria-label']).toBe('Skip introduction');
    expect(props.className).toContain('focus-visible:ring-amethyst-glow/60');
    expect(props.onClick).toBe(onSkip);
  });
});
