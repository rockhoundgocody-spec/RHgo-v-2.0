// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
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

describe('Connect Page', () => {
  it('renders valid HTTPS documentation links in client cards', () => {
    const html = renderToStaticMarkup(<Connect />);
    expect(html).toContain('href="https://modelcontextprotocol.io/quickstart/user"');
    expect(html).toContain('href="https://help.openai.com/en/articles/10237198"');
    expect(html).toContain('href="https://docs.cursor.com/context/model-context-protocol"');
  });

  it('safely omits links if an invalid or javascript scheme is provided', () => {
    const html = renderToStaticMarkup(<Connect />);
    expect(html).not.toContain('href="javascript:');
  });
});
