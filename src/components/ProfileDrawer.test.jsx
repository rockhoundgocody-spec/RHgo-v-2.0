import { vi, describe, it, expect, beforeEach } from 'vitest';

globalThis.window = {
  location: {
    search: '',
    href: '',
    pathname: '',
  }
};

const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

const mockMe = vi.fn();
const mockLogout = vi.fn();
vi.mock('@/api/base44Client', () => ({
  base44: {
    auth: {
      me: () => mockMe(),
      logout: (...args) => mockLogout(...args),
    },
  },
}));

let stateStore = {};
let effectStore = [];

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useState: (initial) => {
      const id = stateStore.currentId++;
      if (!(id in stateStore.values)) {
        stateStore.values[id] = typeof initial === 'function' ? initial() : initial;
      }
      const setState = (val) => {
        stateStore.values[id] = typeof val === 'function' ? val(stateStore.values[id]) : val;
      };
      return [stateStore.values[id], setState];
    },
    useEffect: (fn) => {
      effectStore.push(fn);
    },
  };
});

import React from 'react';
import ProfileDrawer from './ProfileDrawer.jsx';

describe('ProfileDrawer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    stateStore = { currentId: 0, values: {} };
    effectStore = [];
    mockMe.mockResolvedValue({
      full_name: 'Jane Doe',
      email: 'jane@example.com',
      role: 'Explorer',
    });
    mockLogout.mockResolvedValue({});
  });

  function renderComponent() {
    stateStore.currentId = 0;
    const tree = ProfileDrawer();
    // Run any registered effects
    const effectsToRun = [...effectStore];
    effectStore = [];
    effectsToRun.forEach(effect => effect());
    return tree;
  }

  it('renders closed by default with a trigger button', () => {
    const tree = renderComponent();
    expect(tree).toBeDefined();
    expect(tree.type).toBe(React.Fragment);
    const triggerBtn = tree.props.children[0];
    expect(triggerBtn.type).toBe('button');
    expect(triggerBtn.props.type).toBe('button');
    expect(triggerBtn.props['aria-label']).toBe('Open account menu');
    expect(triggerBtn.props['aria-haspopup']).toBe('dialog');
    expect(triggerBtn.props['aria-expanded']).toBe(false);
  });

  it('opens drawer on trigger click and renders user header and menu', async () => {
    // Initial render
    let tree = renderComponent();
    const triggerBtn = tree.props.children[0];

    // Simulate clicking trigger button to set isOpen = true
    triggerBtn.props.onClick();

    // Re-render component with new state
    tree = renderComponent();
    expect(tree.props.children[1]).toBeTruthy(); // isOpen && (<>...</>)

    // Verify sub-components inside drawer panel
    const drawerFragment = tree.props.children[1].props.children;
    const drawerOverlay = drawerFragment[0];
    const drawerPanel = drawerFragment[1];

    expect(drawerOverlay.props.className).toContain('fixed inset-0');
    expect(drawerOverlay.props['aria-hidden']).toBe('true');
    expect(drawerPanel.props.role).toBe('dialog');
    expect(drawerPanel.props['aria-modal']).toBe('true');
    expect(drawerPanel.props['aria-labelledby']).toBe('profile-drawer-title');
    expect(drawerPanel.props.children.length).toBe(4); // Header, UserInfo, MenuList, LogoutButton
  });

  it('handles menu actions correctly', () => {
    let tree = renderComponent();
    const triggerBtn = tree.props.children[0];
    triggerBtn.props.onClick();
    tree = renderComponent();

    const drawerPanel = tree.props.children[1].props.children[1];
    const menuList = drawerPanel.props.children[2]; // MenuList component
    const menuItems = menuList.props.menuItems;

    expect(menuItems.length).toBe(2);
    expect(menuItems[0].label).toBe('Profile');
    expect(menuItems[1].label).toBe('Settings');

    // Trigger profile navigation
    menuItems[0].action();
    expect(mockNavigate).toHaveBeenCalledWith('/profile');

    // Trigger settings navigation
    menuItems[1].action();
    expect(mockNavigate).toHaveBeenCalledWith('/settings');
  });

  it('handles logout action correctly', async () => {
    let tree = renderComponent();
    const triggerBtn = tree.props.children[0];
    triggerBtn.props.onClick();
    tree = renderComponent();

    const drawerPanel = tree.props.children[1].props.children[1];
    const logoutBtn = drawerPanel.props.children[3]; // LogoutButton component

    await logoutBtn.props.onLogout();
    expect(mockLogout).toHaveBeenCalledWith('/');
  });
});
