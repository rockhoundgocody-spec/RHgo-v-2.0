import { describe, it, expect } from 'vitest';
import React from 'react';
import AuthLayout from './AuthLayout';

describe('AuthLayout', () => {
  it('renders title, subtitle, footer, children, and icon', () => {
    const MockIcon = (props) => <svg data-testid="mock-icon" {...props} />;
    const tree = AuthLayout({
      icon: MockIcon,
      title: 'Welcome Back',
      subtitle: 'Log in to your account',
      footer: 'Need help? Contact support',
      children: <div data-testid="test-child">Child Content</div>,
    });

    expect(tree).not.toBeNull();
    expect(tree.type).toBe('div');

    const treeStr = JSON.stringify(tree);
    expect(treeStr).toContain('Welcome Back');
    expect(treeStr).toContain('Log in to your account');
    expect(treeStr).toContain('Need help? Contact support');
    expect(treeStr).toContain('Child Content');
  });

  it('renders correctly without subtitle and footer', () => {
    const MockIcon = (props) => <svg data-testid="mock-icon" {...props} />;
    const tree = AuthLayout({
      icon: MockIcon,
      title: 'Minimal Layout',
      children: <div data-testid="test-child">Content</div>,
    });

    const treeStr = JSON.stringify(tree);
    expect(treeStr).toContain('Minimal Layout');
    expect(treeStr).not.toContain('subtitle');
    expect(treeStr).not.toContain('footer');
  });
});
