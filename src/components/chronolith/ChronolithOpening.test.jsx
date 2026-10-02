import { describe, it, expect } from 'vitest';
import ChronolithOpening, {
  PointOfLight,
  OpeningText,
  HypothesesList,
  InvestigationSummary,
  EnterTrialButton,
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

  it('exports EnterTrialButton as function component with accessibility attributes', () => {
    expect(typeof EnterTrialButton).toBe('function');
    const element = EnterTrialButton({ phase: 4, onEnter: () => {} });
    expect(element).toBeDefined();
    // Verify props of motion.button rendered in phase 4
    const buttonChild = element.props.children;
    expect(buttonChild.props['type']).toBe('button');
    expect(buttonChild.props['aria-label']).toBe('Enter the Reality Trial');
    expect(buttonChild.props.className).toContain('focus-visible:ring-purple-400');
  });

});
