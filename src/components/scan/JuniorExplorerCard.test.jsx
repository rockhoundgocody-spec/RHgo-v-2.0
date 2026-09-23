import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/orbAudio', () => ({
  triggerOrbHaptic: vi.fn(),
  playOrbChime: vi.fn(),
}));

import JuniorExplorerCard from './JuniorExplorerCard';

describe('JuniorExplorerCard', () => {
  it('renders mode toggle button with aria-pressed, aria-label, and focus ring styling', () => {
    const tree = JuniorExplorerCard({
      mineralName: 'Amethyst',
      isKidMode: true,
      onToggleMode: vi.fn(),
    });

    expect(tree).toBeDefined();

    // Children of motion.div:
    // 0: stars, 1: dino, 2: header badge, 3: fun nickname, 4: superpower, 5: age badge, 6: detective clue, 7: victory sound button
    const [, , headerContainer] = tree.props.children;
    const [, toggleButton] = headerContainer.props.children;

    expect(toggleButton.props.type).toBe('button');
    expect(toggleButton.props['aria-pressed']).toBe(true);
    expect(toggleButton.props['aria-label']).toBe('Switch to Pro View');
    expect(toggleButton.props.className).toContain('focus-visible:ring-2');
    expect(toggleButton.props.className).toContain('focus-visible:ring-amber-400/80');
  });

  it('renders decorative background and inline emojis with aria-hidden="true"', () => {
    const tree = JuniorExplorerCard({
      mineralName: 'Quartz',
      isKidMode: false,
      onToggleMode: vi.fn(),
    });

    const [starBg, dinoBg] = tree.props.children;
    expect(starBg.props['aria-hidden']).toBe('true');
    expect(dinoBg.props['aria-hidden']).toBe('true');

    const [, , , , , ageBadge, detectiveClue] = tree.props.children;
    const [dinoIcon] = ageBadge.props.children;
    expect(dinoIcon.props['aria-hidden']).toBe('true');

    const [detectiveHeader] = detectiveClue.props.children;
    const [detectiveIcon] = detectiveHeader.props.children;
    expect(detectiveIcon.props['aria-hidden']).toBe('true');
  });

  it('renders discovery chime button with aria-label and focus ring styling', () => {
    const tree = JuniorExplorerCard({
      mineralName: 'Pyrite',
      isKidMode: true,
      onToggleMode: vi.fn(),
    });

    const [, , , , , , , victorySoundWrapper] = tree.props.children;
    const soundButton = victorySoundWrapper.props.children;

    expect(soundButton.props.type).toBe('button');
    expect(soundButton.props['aria-label']).toBe('Play discovery chime');
    expect(soundButton.props.className).toContain('focus-visible:ring-2');
    expect(soundButton.props.className).toContain('focus-visible:ring-amber-400/80');
  });
});
