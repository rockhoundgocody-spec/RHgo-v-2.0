import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import ResetPassword from './ResetPassword.jsx';

vi.mock('@/api/base44Client', () => ({ base44: { auth: {} } }));
vi.mock('@/components/AuthLayout', () => ({
  default: ({ title, children }) => <div><h1>{title}</h1>{children}</div>,
}));

const render = (url) => renderToStaticMarkup(
  <MemoryRouter initialEntries={[url]}>
    <ResetPassword />
  </MemoryRouter>,
);

describe('ResetPassword', () => {
  it.each([
    '/reset-password?token=abc123',
    '/reset-password?reset_token=abc123',
    '/new-password?resetToken=abc123',
  ])('shows the new-password form for %s', (url) => {
    const html = render(url);
    expect(html).toContain('Cut a new key.');
    expect(html).toContain('Save new password');
  });

  it('explains a link with no token', () => {
    const html = render('/reset-password');
    expect(html).toContain('Link is dead.');
    expect(html).toContain('Request a new link');
  });
});
