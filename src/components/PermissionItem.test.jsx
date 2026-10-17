import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import PermissionItem from './PermissionItem.jsx';

const MockIcon = () => <div data-testid="mock-icon" />;

describe('PermissionItem component', () => {
  it('renders status text when granted or denied', () => {
    const itemGranted = {
      key: 'loc',
      icon: MockIcon,
      label: 'Location Access',
      desc: 'Find nearby hotspots',
      granted: true,
      denied: false,
    };

    const treeGranted = PermissionItem({ item: itemGranted, loading: false });
    expect(treeGranted).toBeDefined();

    // The status span should render "Enabled"
    const statusSpan = treeGranted.props.children[2];
    expect(statusSpan.props.children).toBe('Enabled');
    expect(statusSpan.props['aria-live']).toBe('polite');
  });

  it('renders action button with descriptive aria-label, title, and loading state', () => {
    const onRequest = vi.fn();
    const item = {
      key: 'notif',
      icon: MockIcon,
      label: 'Push Notifications',
      desc: 'Hotspot alerts',
      granted: false,
      denied: false,
      onRequest,
    };

    const tree = PermissionItem({ item, loading: false });
    const button = tree.props.children[2];

    expect(button.props.type).toBe('button');
    expect(button.props['aria-label']).toBe('Allow Push Notifications');
    expect(button.props.title).toBe('Allow Push Notifications');
    expect(button.props.children).toBe('Allow');

    const loadingTree = PermissionItem({ item, loading: true });
    const loadingButton = loadingTree.props.children[2];

    expect(loadingButton.props['aria-label']).toBe('Working on Push Notifications');
    expect(loadingButton.props.title).toBe('Working on Push Notifications');
    expect(loadingButton.props.children).toBe('Working…');
    expect(loadingButton.props['aria-busy']).toBe(true);
  });

  it('renders update button text and styling when isUpdate is true', () => {
    const onRequest = vi.fn();
    const item = {
      key: 'update',
      icon: MockIcon,
      label: 'App Update Ready',
      desc: 'A new version is available',
      granted: false,
      denied: false,
      onRequest,
      isUpdate: true,
    };

    const tree = PermissionItem({ item, loading: false });
    const button = tree.props.children[2];

    expect(button.props['aria-label']).toBe('Update App Update Ready');
    expect(button.props.title).toBe('Update App Update Ready');
    expect(button.props.children).toBe('Update');
  });
});
