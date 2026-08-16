import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import CrystalNav from './CrystalNav.jsx';

// Mock react-dom createPortal to return the children directly
vi.mock('react-dom', () => ({
  createPortal: (node) => node,
}));

// Mock useKidMode hook
vi.mock('@/lib/useKidMode', () => ({
  default: () => false,
}));

describe('CrystalNav', () => {
  beforeAll(() => {
    globalThis.document = { body: {} };
  });

  afterAll(() => {
    delete globalThis.document;
  });

  it('includes focus-visible accessibility classes in tab and hero buttons', () => {
    const handleTabClick = vi.fn();
    const element = CrystalNav({ activeTab: 'home', onTabClick: handleTabClick, pathname: '/' });

    // element is the <nav> JSX object returned when createPortal returns children directly
    expect(element.type).toBe('nav');

    const children = element.props.children;
    expect(Array.isArray(children)).toBe(true);

    // Search children elements for focus-visible ring styles
    const buttonPropsList = children.map((child) => {
      if (!child) return null;
      // Normal tab button
      if (child.props && child.props.className) {
        return child.props.className;
      }
      // HeroScanButton component instance
      if (child.props && child.type) {
        const heroElement = child.type(child.props);
        // HeroScanButton renders a div with motion.button child
        const heroButton = heroElement.props.children[0];
        return heroButton.props.className;
      }
      return null;
    });

    // Verify standard tab buttons contain focus-visible:ring-hud-cyan
    const hasHudCyanRing = buttonPropsList.some(
      (className) => className && className.includes('focus-visible:ring-hud-cyan')
    );
    expect(hasHudCyanRing).toBe(true);

    // Verify hero scan button contains focus-visible:ring-amethyst-glow
    const hasAmethystRing = buttonPropsList.some(
      (className) => className && className.includes('focus-visible:ring-amethyst-glow')
    );
    expect(hasAmethystRing).toBe(true);
  });
});
