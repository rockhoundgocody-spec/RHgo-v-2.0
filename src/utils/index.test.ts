import { describe, it, expect } from 'vitest';
import { createPageUrl } from './index';

describe('createPageUrl', () => {
  it('should prepend a slash to a single-word page name', () => {
    expect(createPageUrl('home')).toBe('/home');
  });

  it('should replace single spaces with hyphens', () => {
    expect(createPageUrl('about us')).toBe('/about-us');
  });

  it('should replace all spaces in multi-word page names', () => {
    expect(createPageUrl('my custom page name')).toBe('/my-custom-page-name');
  });

  it('should replace consecutive spaces with multiple hyphens', () => {
    expect(createPageUrl('hello  world')).toBe('/hello--world');
  });

  it('should handle leading and trailing spaces', () => {
    expect(createPageUrl(' page ')).toBe('/-page-');
  });

  it('should handle an empty string', () => {
    expect(createPageUrl('')).toBe('/');
  });

  it('should handle page names with numbers and special characters', () => {
    expect(createPageUrl('specimen 123 & details')).toBe('/specimen-123-&-details');
  });
});
