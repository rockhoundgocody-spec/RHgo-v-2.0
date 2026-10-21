// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Connect, { ClientCard } from './Connect';

vi.mock('@/components/AuthLayout', () => {
  function MockAuthLayout({ children, title, subtitle }) {
    return (
      <div data-testid="auth-layout">
        <h1>{title}</h1>
        <h2>{subtitle}</h2>
        {children}
      </div>
    );
  }
  return { default: MockAuthLayout };
});

describe('Connect Page', () => {
  it('renders valid HTTPS documentation links in client cards', () => {
    render(<Connect />);
    const links = screen.getAllByRole('link');
    expect(links.length).toBeGreaterThan(0);
    links.forEach((link) => {
      expect(link.getAttribute('href')).toMatch(/^https:\/\//);
    });
  });

  it('safely omits links if an invalid or javascript scheme is provided to ClientCard', () => {
    const { container: unsafeContainer } = render(
      <ClientCard icon="🧪" name="Test" steps={['Step 1']} link="javascript:alert(1)" />
    );
    expect(unsafeContainer.querySelector('a')).toBeNull();

    const { container: safeContainer } = render(
      <ClientCard icon="🧪" name="Test" steps={['Step 1']} link="https://example.com/docs" />
    );
    const safeLink = safeContainer.querySelector('a');
    expect(safeLink).not.toBeNull();
    expect(safeLink?.getAttribute('href')).toBe('https://example.com/docs');
  });
});
