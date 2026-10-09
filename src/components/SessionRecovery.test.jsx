// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
const retry = vi.hoisted(() => vi.fn());
vi.mock('@/lib/AuthContext', () => ({ useAuth: () => ({ checkUserAuth: retry }) }));
import SessionRecovery from '@/components/SessionRecovery';
afterEach(cleanup);
describe('Session recovery controls', () => {
  it('offers a real retry and a public route without falsely claiming sign-out', () => {
    render(<MemoryRouter><SessionRecovery /></MemoryRouter>);
    fireEvent.click(screen.getByRole('button', { name: 'Retry session check' }));
    expect(retry).toHaveBeenCalledOnce();
    expect(screen.getByRole('link').getAttribute('href')).toBe('/demo');
    expect(screen.getByText(/You have not been signed out/)).toBeTruthy();
  });
});