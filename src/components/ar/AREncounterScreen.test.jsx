import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock react hook primitives for direct function calls
vi.mock('react', async () => {
  const actual = await vi.importActual('react');
  return {
    ...actual,
    useState: (initial) => [typeof initial === 'function' ? initial() : initial, vi.fn()],
    useEffect: vi.fn(),
    useRef: (initial) => ({ current: initial }),
    useCallback: (fn) => fn,
  };
});

// Mock framer-motion to avoid animation overhead or missing context
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, style, onClick, onTouchEnd, ...props }) => (
      <div className={className} style={style} onClick={onClick} onTouchEnd={onTouchEnd} {...props}>
        {children}
      </div>
    ),
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

vi.mock('@/api/base44Client', () => ({
  base44: {
    auth: {
      me: vi.fn().mockResolvedValue({ email: 'test@example.com' }),
    },
    entities: {
      Specimen: {
        create: vi.fn().mockResolvedValue({ id: 'specimen-1' }),
      },
      PlayerProfile: {
        filter: vi.fn().mockResolvedValue([{ id: 'profile-1', total_xp: 100 }]),
        update: vi.fn().mockResolvedValue({}),
      },
    },
  },
}));

vi.mock('@/lib/spawnEngine', () => ({
  RARITY_XP_MAP: {
    common: 50,
    uncommon: 100,
    rare: 250,
    legendary: 1000,
  },
}));

import AREncounterScreen from './AREncounterScreen';

describe('AREncounterScreen component', () => {
  const mockSpawn = {
    mineral_name: 'Quartz Crystal',
    rarity: 'rare',
    emoji: '💎',
    xp: 250,
    catch_chance: 0.6,
    is_shiny: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly as a React component element tree', () => {
    const props = {
      spawn: mockSpawn,
      onCatch: vi.fn(),
      onDismiss: vi.fn(),
    };

    const element = AREncounterScreen(props);
    expect(element).toBeDefined();
    expect(element.type).toBeDefined();
    expect(element.props.className).toContain('fixed inset-0');
  });

  it('handles shiny spawn configuration correctly', () => {
    const shinySpawn = { ...mockSpawn, is_shiny: true };
    const props = {
      spawn: shinySpawn,
      onCatch: vi.fn(),
      onDismiss: vi.fn(),
    };

    const element = AREncounterScreen(props);
    expect(element).toBeDefined();
  });
});
