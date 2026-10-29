// @vitest-environment jsdom
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Compare from './Compare';

let root;
let container;

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(async () => {
  if (root) await act(async () => root.unmount());
  document.body.innerHTML = '';
  vi.unstubAllGlobals();
});

describe('Compare page component', () => {
  it('renders empty state when no result is available in location state', async () => {
    const router = createMemoryRouter([
      { path: '/compare', element: <Compare /> },
    ], { initialEntries: ['/compare'] });

    await act(async () => root.render(<RouterProvider router={router} />));

    expect(container.textContent).toContain('No specimen to compare');
    const goButton = container.querySelector('button[aria-label="Go to scanner"]');
    expect(goButton).not.toBeNull();
    expect(goButton.className).toContain('focus-visible:ring-2');
  });

  it('renders candidate selector tabs and updates selected candidate details', async () => {
    const mockResult = {
      top_match: 'Quartz',
      confidence: 0.95,
      rarity: 'common',
      observed_features: [{ feature: 'Hardness', value: '7' }],
      candidates: [
        { name: 'Calcite', confidence: 0.60, rationale: 'Soft mineral with rhombohedral cleavage' },
      ],
      lookalikes: [
        { name: 'Halite', differentiator: 'Salty taste and cubical cleavage' },
      ],
    };

    const router = createMemoryRouter([
      { path: '/compare', element: <Compare /> },
    ], {
      initialEntries: [{
        pathname: '/compare',
        state: { result: mockResult, primaryImageUrl: 'https://example.com/quartz.jpg' },
      }],
    });

    await act(async () => root.render(<RouterProvider router={router} />));

    // Check header buttons
    const backBtn = container.querySelector('button[aria-label="Go back to previous page"]');
    const scanBtn = container.querySelector('button[aria-label="Start new rock scan"]');
    expect(backBtn).not.toBeNull();
    expect(scanBtn).not.toBeNull();

    // Check tablist and tabs
    const tablist = container.querySelector('[role="tablist"]');
    expect(tablist).not.toBeNull();
    expect(tablist.getAttribute('aria-label')).toBe('Specimen candidate selection');

    const tabs = container.querySelectorAll('[role="tab"]');
    expect(tabs).toHaveLength(3); // Quartz, Calcite, Halite
    expect(tabs[0].getAttribute('aria-selected')).toBe('true');
    expect(tabs[1].getAttribute('aria-selected')).toBe('false');

    // Check tabpanel
    const panel = container.querySelector('[role="tabpanel"]');
    expect(panel).not.toBeNull();
    expect(panel.id).toBe('candidate-detail-panel');
    expect(panel.textContent).toContain('Quartz');
    expect(panel.textContent).toContain('Your scan result');

    // Click second candidate (Calcite)
    await act(async () => {
      tabs[1].click();
    });

    expect(tabs[0].getAttribute('aria-selected')).toBe('false');
    expect(tabs[1].getAttribute('aria-selected')).toBe('true');
    const updatedPanel = container.querySelector('#candidate-detail-panel');
    expect(updatedPanel.textContent).toContain('Calcite');
    expect(updatedPanel.textContent).toContain('Soft mineral with rhombohedral cleavage');
  });
});
