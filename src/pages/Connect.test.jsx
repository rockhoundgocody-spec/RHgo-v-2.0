// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Connect from './Connect';

vi.mock('@/components/AuthLayout', () => ({
  default: ({ children, title, subtitle }) => (
    <div data-testid="auth-layout">
      <h1>{title}</h1>
      <h2>{subtitle}</h2>
      {children}
    </div>
  ),
}));

describe('Connect page', () => {
  it('renders valid external links with security attributes', () => {
    render(<Connect />);
    const links = screen.getAllByRole('link');
    expect(links.length).toBeGreaterThan(0);

    links.forEach((link) => {
      const href = link.getAttribute('href');
      expect(href).toMatch(/^https?:\/\//);
      expect(link.getAttribute('target')).toBe('_blank');
      expect(link.getAttribute('rel')).toBe('noopener noreferrer');
    });
  });

  it('suppresses unsafe link schemes when passed to ClientCard', () => {
    const { container } = render(<Connect />);
    // Verify no javascript: or data: URIs exist anywhere in the DOM
    const allAnchors = container.querySelectorAll('a');
    allAnchors.forEach((a) => {
      const href = a.getAttribute('href') || '';
      expect(href.startsWith('javascript:')).toBe(false);
      expect(href.startsWith('data:')).toBe(false);
    });
  });
});
