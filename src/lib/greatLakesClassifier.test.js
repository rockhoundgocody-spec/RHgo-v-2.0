import { describe, it, expect } from 'vitest';
import { buildGreatLakesPromptContext } from './greatLakesClassifier';

describe('buildGreatLakesPromptContext', () => {
  it('should include wet specimen note when wetDry is "wet"', () => {
    const result = buildGreatLakesPromptContext({ wetDry: 'wet' });
    expect(result).toContain('Specimen is WET');
    expect(result).toContain('colors and patterns are more vivid');
  });

  it('should include dry specimen note when wetDry is "dry"', () => {
    const result = buildGreatLakesPromptContext({ wetDry: 'dry' });
    expect(result).toContain('Specimen is DRY');
    expect(result).toContain('surface may appear chalky or muted');
  });

  it('should not include wet/dry note when wetDry is omitted', () => {
    const result = buildGreatLakesPromptContext({});
    expect(result).not.toContain('Specimen is WET');
    expect(result).not.toContain('Specimen is DRY');
  });

  it('should include storm note when postStorm is true', () => {
    const result = buildGreatLakesPromptContext({ postStorm: true });
    expect(result).toContain('Recent storm conditions');
    expect(result).toContain('fresh specimens likely freshly exposed');
  });

  it('should include spring season note when season is "spring"', () => {
    const result = buildGreatLakesPromptContext({ season: 'spring' });
    expect(result).toContain('Spring thaw');
    expect(result).toContain('prime hunting season');
  });

  it('should include winter season note when season is "winter"', () => {
    const result = buildGreatLakesPromptContext({ season: 'winter' });
    expect(result).toContain('Winter conditions');
    expect(result).toContain('Specimen surfaces may be frosted');
  });

  it('should include location priors when beachName and state are provided', () => {
    // Using a known location from the file: Petoskey
    const result = buildGreatLakesPromptContext({ beachName: 'Petoskey', state: 'MI' });
    expect(result).toContain('USER LOCATION: Petoskey, MI');
    expect(result).toContain('Boost probability for:');
    expect(result).toContain('Petoskey Stone');
  });

  it('should combine multiple notes correctly', () => {
    const result = buildGreatLakesPromptContext({
      wetDry: 'wet',
      postStorm: true,
      season: 'spring'
    });
    expect(result).toContain('Specimen is WET');
    expect(result).toContain('Recent storm conditions');
    expect(result).toContain('Spring thaw');
  });

  it('should handle missing parameters gracefully', () => {
    const result = buildGreatLakesPromptContext({});
    expect(result).toContain('GREAT LAKES REGIONAL SPECIALIST MODE');
    expect(result).toContain('WATER-WORN SURFACE NOTE');
  });
});
