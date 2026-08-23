import { describe, it, expect, vi } from 'vitest';
import CrystalNav from './CrystalNav';

// Mock framer-motion and react-dom createPortal for pure component execution
vi.mock('framer-motion', () => ({
  motion: {
    div: (props) => <div {...props} />,
    button: (props) => <button {...props} />,
  },
}));

vi.mock('react-dom', () => ({
  createPortal: (node) => node,
}));

vi.mock('@/lib/useKidMode', () => ({
  default: () => false,
}));

describe('CrystalNav', () => {
  it('renders navigation landmark with aria-label', () => {
    const handleTabClick = vi.fn();
    const tree = CrystalNav({ activeTab: '/', onTabClick: handleTabClick, pathname: '/' });

    expect(tree).toBeDefined();
    expect(tree.type).toBe('nav');
    expect(tree.props['aria-label']).toBe('Main Navigation');
  });

  it('applies aria-current="page" to active tab button', () => {
    const handleTabClick = vi.fn();
    const tree = CrystalNav({ activeTab: '/explore', onTabClick: handleTabClick, pathname: '/explore' });

    const children = tree.props.children;
    const mapButton = children.find(
      (child) => child && child.props && child.props['aria-label'] === 'Map'
    );

    expect(mapButton).toBeDefined();
    expect(mapButton.props['aria-current']).toBe('page');

    const homeButton = children.find(
      (child) => child && child.props && child.props['aria-label'] === 'Home'
    );
    expect(homeButton).toBeDefined();
    expect(homeButton.props['aria-current']).toBeUndefined();
  });
});
