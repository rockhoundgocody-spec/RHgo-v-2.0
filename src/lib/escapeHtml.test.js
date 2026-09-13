import { describe, it, expect } from 'vitest';
import { escapeHtml } from './escapeHtml.js';
describe('map popup text encoding', () => {
  it('escapes HTML tags, quotes and ampersands', () => {
    expect(escapeHtml('<img src=x onerror="alert(1)"> & \'')).toBe('&lt;img src=x onerror=&quot;alert(1)&quot;&gt; &amp; &#39;');
  });
  it('preserves plain mineral names and safely handles missing data', () => {
    expect(escapeHtml('Lake Superior Agate')).toBe('Lake Superior Agate');
    expect(escapeHtml(null)).toBe(''); expect(escapeHtml(undefined)).toBe('');
  });
});