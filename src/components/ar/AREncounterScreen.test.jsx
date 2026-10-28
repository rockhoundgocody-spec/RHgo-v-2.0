// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AREncounterScreen, { EncounterOrb } from './AREncounterScreen.jsx';

vi.mock('@/api/base44Client', () => ({
  base44: {
    auth: { me: vi.fn().mockResolvedValue({ id: 'u1' }) },
    entities: { Specimen: { create: vi.fn().mockResolvedValue({ id: 's1' }) } },
    functions: { invoke: vi.fn().mockResolvedValue({}) },
  },
}));

vi.mock('canvas-confetti', () => ({
  default: vi.fn(),
}));

if (typeof window !== 'undefined' && !window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

const mockSpawn = {
  id: 'spawn-1',
  mineral_name: 'Amethyst Cluster',
  rarity: 'rare',
  catch_chance: 0.8,
  emoji: '💎',
  xp: 150,
  is_shiny: false,
};

const mockTheme = {
  bg: 'hsla(195,80%,18%,0.9)',
  glow: 'hsl(195,100%,68%)',
  ring: '#22d3ee',
  label: 'RARE',
};

describe('AREncounterScreen Accessibility & Keyboard Navigation', () => {
  it('renders modal dialog with accessible ARIA attributes', () => {
    render(
      <AREncounterScreen
        spawn={mockSpawn}
        onCatch={vi.fn()}
        onDismiss={vi.fn()}
      />
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeTruthy();
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(dialog.getAttribute('aria-label')).toBe('Amethyst Cluster AR encounter');

    const catchButtons = screen.getAllByRole('button', { name: /catch amethyst cluster/i });
    expect(catchButtons.length).toBeGreaterThan(0);
    expect(catchButtons[0].className).toContain('focus-visible:ring-4');
  });

  it('triggers handleThrow on Enter or Space key press in EncounterOrb', () => {
    const handleThrow = vi.fn();
    const { container } = render(
      <EncounterOrb
        phase="encounter"
        orbScale={1}
        handleThrow={handleThrow}
        handleSwipe={vi.fn()}
        theme={mockTheme}
        spawn={mockSpawn}
        reduceMotion={false}
      />
    );

    const button = container.querySelector('button[aria-label="Catch Amethyst Cluster"]');
    expect(button).not.toBeNull();
    fireEvent.keyDown(button, { key: 'Enter', code: 'Enter' });
    expect(handleThrow).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(button, { key: ' ', code: 'Space' });
    expect(handleThrow).toHaveBeenCalledTimes(2);
  });
});
