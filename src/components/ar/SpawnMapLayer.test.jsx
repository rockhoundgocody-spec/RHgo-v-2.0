import React from 'react';
import { describe, it, expect, vi } from 'vitest';

// Mock react's useState so component functions can be invoked cleanly
vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useState: (initial) => {
      let state = initial;
      const setState = (val) => { state = val; };
      return [state, setState];
    },
  };
});

// Mock framer-motion to simplify DOM testing without animation loops
vi.mock('framer-motion', () => ({
  motion: {
    button: ({ children, onClick, onMouseEnter, onMouseLeave, className, style, ...props }) => (
      <button
        data-testid="spawn-pin-button"
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        className={className}
        style={style}
        {...props}
      >
        {children}
      </button>
    ),
    div: ({ children, className, style, ...props }) => (
      <div className={className} style={style} {...props}>
        {children}
      </div>
    ),
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

import SpawnMapLayer from './SpawnMapLayer.jsx';

describe('SpawnMapLayer', () => {
  const sampleSpawns = [
    {
      id: 'spawn-1',
      mineral_name: 'Quartz',
      rarity: 'common',
      emoji: '💎',
      color: '#00ff00',
      glow: '#00ff0033',
      xp: 25,
      is_shiny: false,
    },
    {
      id: 'spawn-2',
      mineral_name: 'Diamond',
      rarity: 'legendary',
      emoji: '✨',
      color: '#ff00ff',
      glow: '#ff00ff33',
      xp: 150,
      is_shiny: true,
    },
  ];

  it('returns null when spawns array is empty', () => {
    const result = SpawnMapLayer({ spawns: [], onSpawnTap: vi.fn(), caughtToday: 0, dailyCap: 10 });
    expect(result).toBeNull();
  });

  it('renders spawns and heat rings when spawns exist', () => {
    const element = SpawnMapLayer({ spawns: sampleSpawns, onSpawnTap: vi.fn(), caughtToday: 0, dailyCap: 10 });
    expect(element).not.toBeNull();
    expect(element.props.className).toContain('absolute inset-0');
  });

  it('renders daily cap banner when caughtToday >= dailyCap', () => {
    const elementCapped = SpawnMapLayer({ spawns: sampleSpawns, onSpawnTap: vi.fn(), caughtToday: 10, dailyCap: 10 });
    const elementNotCapped = SpawnMapLayer({ spawns: sampleSpawns, onSpawnTap: vi.fn(), caughtToday: 5, dailyCap: 10 });

    expect(elementCapped.props.children[0]).not.toBeFalsy();
    expect(elementNotCapped.props.children[0]).toBeFalsy();
  });

  it('calls onSpawnTap when spawn pin is clicked and not capped out', () => {
    const onSpawnTap = vi.fn();
    const element = SpawnMapLayer({ spawns: sampleSpawns, onSpawnTap, caughtToday: 2, dailyCap: 10 });

    const pins = element.props.children[1];
    expect(pins).toHaveLength(2);

    // Evaluate SpawnPin element function with its props
    const spawnPinElement = pins[0].type(pins[0].props);
    spawnPinElement.props.onClick();

    expect(onSpawnTap).toHaveBeenCalledTimes(1);
    expect(onSpawnTap).toHaveBeenCalledWith(sampleSpawns[0]);
  });

  it('does NOT call onSpawnTap when capped out', () => {
    const onSpawnTap = vi.fn();
    const element = SpawnMapLayer({ spawns: sampleSpawns, onSpawnTap, caughtToday: 10, dailyCap: 10 });

    const pins = element.props.children[1];
    const spawnPinElement = pins[0].type(pins[0].props);
    spawnPinElement.props.onClick();

    expect(onSpawnTap).not.toHaveBeenCalled();
  });
});
