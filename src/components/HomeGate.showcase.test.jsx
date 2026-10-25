// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
const auth = vi.hoisted(() => ({ isAuthenticated: false }));
vi.mock('@/lib/AuthContext', () => ({ useAuth: () => auth }));
vi.mock('@/pages/Landing', () => ({ default: () => <h1>Public showcase</h1> }));
vi.mock('@/pages/Hub', () => ({ default: () => <h1>Member hub</h1> }));
import HomeGate from '@/components/HomeGate';

afterEach(cleanup);
describe('Home entry', () => {
  it('shows the public page on repeat visits without forcing registration', async () => {
    auth.isAuthenticated = false;
    localStorage.setItem('rhgo_gate_choice', 'returning');
    render(<HomeGate />);
    expect(await screen.findByText('Public showcase')).toBeTruthy();
    cleanup();
    render(<HomeGate />);
    expect(await screen.findByText('Public showcase')).toBeTruthy();
    localStorage.removeItem('rhgo_gate_choice');
  });
  it('keeps the existing member hub', async () => {
    auth.isAuthenticated = true;
    render(<HomeGate />);
    expect(await screen.findByText('Member hub')).toBeTruthy();
  });
});