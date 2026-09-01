import { describe, it, expect } from 'vitest';
import {
  deliberateGeologicalSpecimen,
  enrichWithScientificValidation,
} from './agiGeologicalEngine';
import { clearCloverMemoryForTest } from './cloverMemory';

describe('agiGeologicalEngine', () => {
  it('constructs multi-agent deliberation prompt with agents and memory', async () => {
    clearCloverMemoryForTest();
    const result = await deliberateGeologicalSpecimen({
      locality: { lat: 46.7867, lng: -92.1005 },
      scanMode: 'rock',
    });

    expect(result).toBeDefined();
    expect(result.systemPrompt).toContain('VISUAL MORPHOLOGIST');
    expect(result.systemPrompt).toContain('STRATIGRAPHIC PROVENANCE');
    expect(result.systemPrompt).toContain('FORENSIC IMPOSTER HUNTER');
    expect(result.systemPrompt).toContain('SELF-REFLECTION');
  });

  it('enriches identification with OpenMindat scientific properties and kid superpowers', () => {
    clearCloverMemoryForTest();
    const rawResult = {
      top_match: 'Lake Superior Agate',
      confidence: 0.94,
      hardness_mohs: 7.0,
      crystal_system: 'Trigonal',
    };

    const enriched = enrichWithScientificValidation(rawResult);
    expect(enriched.mindat_validated).toBe(true);
    expect(enriched.scientific_properties).toBeDefined();
    expect(enriched.scientific_properties.formula).toContain('SiO₂');
    expect(enriched.junior_explorer).toBeDefined();
    expect(enriched.junior_explorer.superpower).toContain('Armor');
  });

  it('handles unknown specimens gracefully', () => {
    clearCloverMemoryForTest();
    const raw = { top_match: 'Unidentified Fragment' };
    const enriched = enrichWithScientificValidation(raw);
    expect(enriched).toBeDefined();
    expect(enriched.top_match).toBe('Unidentified Fragment');
  });
});
