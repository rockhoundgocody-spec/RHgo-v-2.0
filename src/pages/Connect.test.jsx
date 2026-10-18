import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import Connect, { ClientCard } from './Connect.jsx';

vi.mock('@/components/AuthLayout', () => ({
  default: ({ title, children }) => <div><h1>{title}</h1>{children}</div>,
}));

describe('Connect page external URL security', () => {
  it('renders valid https external links in ClientCard', () => {
    const html = renderToStaticMarkup(<Connect />);
    expect(html).toContain('href="https://modelcontextprotocol.io/quickstart/user"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
  });

  it('omits anchor tags in ClientCard for malicious javascript: or data: link schemes', () => {
    const jsHtml = renderToStaticMarkup(
      <ClientCard icon="🤖" name="Malicious Client" steps={[]} link="javascript:alert(1)" />
    );
    expect(jsHtml).not.toContain('<a');
    expect(jsHtml).not.toContain('javascript:alert(1)');

    const dataHtml = renderToStaticMarkup(
      <ClientCard icon="🤖" name="Data Client" steps={[]} link="data:text/html,<script>alert(1)</script>" />
    );
    expect(dataHtml).not.toContain('<a');
    expect(dataHtml).not.toContain('data:text/html');
  });
});
