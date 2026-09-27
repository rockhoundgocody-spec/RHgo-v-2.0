// @vitest-environment jsdom
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Auth from './Auth';
import Login from './Login';

vi.mock('@/api/base44Client', () => ({ base44: { auth: {} } }));
vi.mock('@/lib/AuthContext', () => ({
  useAuth: () => ({ isAuthenticated: false, isLoadingAuth: false }),
}));
vi.mock('@/components/AuthLayout', () => ({ default: ({ children }) => <div>{children}</div> }));

let root;
let router;

afterEach(async () => {
  if (root) await act(async () => root.unmount());
  router?.dispose();
  document.head.innerHTML = '';
  document.body.innerHTML = '';
  vi.unstubAllGlobals();
});

describe('Login robots directive', () => {
  it.each([true, false])('keeps Auth → Login noindex and restores the public default (existing meta: %s)', async (existingMeta) => {
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    if (existingMeta) {
      document.head.innerHTML = '<meta name="robots" id="robots-meta" content="index, follow">';
    }
    const container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    router = createMemoryRouter([
      { path: '/auth', element: <Auth /> },
      { path: '/login', element: <Login /> },
      { path: '/about', element: <p>Public page</p> },
    ], { initialEntries: ['/auth?next=%2Fcollection#signin'] });

    await act(async () => root.render(<RouterProvider router={router} />));
    expect(router.state.location.pathname).toBe('/login');
    expect(router.state.location.search).toBe('?next=%2Fcollection');
    expect(router.state.location.hash).toBe('#signin');
    expect(document.querySelectorAll('meta[name="robots"]')).toHaveLength(1);
    expect(document.getElementById('robots-meta').content).toBe('noindex, nofollow');

    await act(async () => router.navigate('/about'));
    expect(document.getElementById('robots-meta').content).toBe('index, follow');
  });
});
