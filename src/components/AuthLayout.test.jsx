import { describe, it, expect } from 'vitest';
import AuthLayout from './AuthLayout';

function MockIcon(props) {
  return <svg data-testid="mock-icon" {...props} />;
}

describe('AuthLayout', () => {
  it('renders title, subtitle, footer, icon, and children correctly', () => {
    const tree = AuthLayout({
      icon: MockIcon,
      title: 'Welcome Back',
      subtitle: 'Sign in to continue',
      footer: 'Need help? Contact support',
      children: <div data-testid="test-child">Form Content</div>,
    });

    expect(tree).not.toBeNull();

    // Convert element tree to JSON string to inspect rendered structure and contents
    const jsonStr = JSON.stringify(tree);
    expect(jsonStr).toContain('Welcome Back');
    expect(jsonStr).toContain('Sign in to continue');
    expect(jsonStr).toContain('Need help? Contact support');
    expect(jsonStr).toContain('Form Content');
    expect(jsonStr).toContain('RockHound');
    expect(jsonStr).toContain('GO');
  });

  it('renders cleanly without subtitle or footer if omitted', () => {
    const tree = AuthLayout({
      icon: MockIcon,
      title: 'Simple Layout',
      children: <div>Child</div>,
    });

    expect(tree).not.toBeNull();
    const jsonStr = JSON.stringify(tree);
    expect(jsonStr).toContain('Simple Layout');
    expect(jsonStr).not.toContain('undefined');
  });
});
