import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import FacebookIcon from './FacebookIcon.jsx';

describe('FacebookIcon', () => {
  it('renders svg with expected attributes and className', () => {
    const markup = renderToStaticMarkup(<FacebookIcon className="w-4 h-4 mr-2" />);
    expect(markup).toContain('<svg');
    expect(markup).toContain('class="w-4 h-4 mr-2"');
    expect(markup).toContain('viewBox="0 0 24 24"');
    expect(markup).toContain('fill="#1877F2"');
  });
});
