import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getContrastRatio, auditHeadingHierarchy } from './accessibilityAudit';

describe('accessibilityAudit', () => {
  describe('getContrastRatio', () => {
    it('should return 21 for black and white', () => {
      const black = [0, 0, 0];
      const white = [255, 255, 255];
      expect(getContrastRatio(black, white)).toBeCloseTo(21, 1);
      expect(getContrastRatio(white, black)).toBeCloseTo(21, 1);
    });

    it('should return 1 for the same colors', () => {
      const color = [128, 128, 128];
      expect(getContrastRatio(color, color)).toBeCloseTo(1, 1);
    });

    it('should return correct ratio for WCAG examples', () => {
      const grey = [118, 118, 118];
      const white = [255, 255, 255];
      expect(getContrastRatio(grey, white)).toBeGreaterThanOrEqual(4.5);
      expect(getContrastRatio(grey, white)).toBeLessThan(4.6);
    });

    it('should handle very dark colors correctly', () => {
      const dark1 = [1, 1, 1];
      const dark2 = [2, 2, 2];
      const ratio = getContrastRatio(dark1, dark2);
      expect(ratio).toBeGreaterThan(1);
      expect(ratio).toBeLessThan(1.1);
    });

    it('should return correct ratio for pure red and pure blue', () => {
      const red = [255, 0, 0];
      const blue = [0, 0, 255];
      expect(getContrastRatio(red, blue)).toBeCloseTo(2.15, 2);
    });
  });

  describe('auditHeadingHierarchy', () => {
    beforeEach(() => {
      document.body.innerHTML = '';
    });

    it('should report missing h1', () => {
      const issues = auditHeadingHierarchy();
      expect(issues.some(i => i.issue === 'Page missing h1 heading')).toBe(true);
    });

    it('should report skipped levels', () => {
      document.body.innerHTML = `
        <h1>Title</h1>
        <h3>Subtitle</h3>
      `;
      const issues = auditHeadingHierarchy();
      expect(issues.some(i => i.issue.includes('Heading hierarchy skipped'))).toBe(true);
    });

    it('should not report issues for correct hierarchy', () => {
      document.body.innerHTML = `
        <h1>Title</h1>
        <h2>Section</h2>
        <h3>Subsection</h3>
      `;
      const issues = auditHeadingHierarchy();
      // Only check for hierarchy issues, not the missing h1 if it's there
      const hierarchyIssues = issues.filter(i => i.issue.includes('Heading hierarchy skipped'));
      expect(hierarchyIssues.length).toBe(0);
    });
  });
});
