import { describe, it, expect } from 'vitest';
import { getKidFriendlyMineral, KID_MINERAL_DATA } from './kidFriendlyData';

describe('kidFriendlyData', () => {
  it('returns custom kid-friendly data for known minerals', () => {
    const agate = getKidFriendlyMineral('Lake Superior Agate');
    expect(agate).toBeDefined();
    expect(agate.superpower).toContain('Armor');
    expect(agate.age_badge).toContain('Billion');

    const yooper = getKidFriendlyMineral('Yooperlite');
    expect(yooper).toBeDefined();
    expect(yooper.superpower).toContain('Dark-Glow');
  });

  it('provides a fun fallback for unknown minerals', () => {
    const unknown = getKidFriendlyMineral('Mysterious Rock');
    expect(unknown).toBeDefined();
    expect(unknown.superpower).toContain('Earth Wonder');
    expect(unknown.fun_name).toContain('Mysterious Rock');
  });

  it('handles null safely', () => {
    expect(getKidFriendlyMineral(null)).toBeNull();
  });
});
