import { describe, it, expect, vi } from 'vitest';
import PermissionItem from './PermissionItem';

describe('PermissionItem', () => {
  const MockIcon = () => null;

  it('renders granted state with Enabled status text', () => {
    const item = {
      key: 'loc',
      icon: MockIcon,
      label: 'Location Access',
      desc: 'Find nearby hotspots',
      granted: true,
      denied: false,
      onRequest: vi.fn(),
    };

    const tree = PermissionItem({ item, loading: false });

    expect(tree).toBeDefined();
    expect(tree.type).toBe('div');

    const [iconContainer, contentContainer, statusOrButton] = tree.props.children;

    // Check label and desc in contentContainer
    const [labelDiv, descDiv] = contentContainer.props.children;
    expect(labelDiv.props.children).toBe('Location Access');
    expect(descDiv.props.children).toBe('Find nearby hotspots');

    // Check status text
    expect(statusOrButton.type).toBe('span');
    expect(statusOrButton.props.children).toBe('Enabled');
    expect(statusOrButton.props['aria-live']).toBe('polite');
  });

  it('renders denied state with Blocked status text', () => {
    const item = {
      key: 'notif',
      icon: MockIcon,
      label: 'Push Notifications',
      desc: 'Hotspot alerts',
      granted: false,
      denied: true,
      onRequest: vi.fn(),
    };

    const tree = PermissionItem({ item, loading: false });
    const [, , statusOrButton] = tree.props.children;

    expect(statusOrButton.type).toBe('span');
    expect(statusOrButton.props.children).toBe('Blocked');
  });

  it('renders request button when permission is not yet granted or denied', () => {
    const onRequest = vi.fn();
    const item = {
      key: 'loc',
      icon: MockIcon,
      label: 'Location Access',
      desc: 'Find nearby hotspots',
      granted: false,
      denied: false,
      onRequest,
    };

    const tree = PermissionItem({ item, loading: false });
    const [, , statusOrButton] = tree.props.children;

    expect(statusOrButton.type).toBe('button');
    expect(statusOrButton.props.children).toBe('Allow');
    expect(statusOrButton.props.disabled).toBe(false);

    statusOrButton.props.onClick();
    expect(onRequest).toHaveBeenCalledTimes(1);
  });

  it('renders loading state and update button label when isUpdate is true', () => {
    const item = {
      key: 'update',
      icon: MockIcon,
      label: 'App Update Ready',
      desc: 'A new version is available',
      granted: false,
      denied: false,
      onRequest: vi.fn(),
      isUpdate: true,
    };

    const loadingTree = PermissionItem({ item, loading: true });
    const [, , loadingButton] = loadingTree.props.children;

    expect(loadingButton.props.children).toBe('Working…');
    expect(loadingButton.props.disabled).toBe(true);
    expect(loadingButton.props['aria-busy']).toBe(true);

    const normalTree = PermissionItem({ item, loading: false });
    const [, , normalButton] = normalTree.props.children;

    expect(normalButton.props.children).toBe('Update');
  });
});
