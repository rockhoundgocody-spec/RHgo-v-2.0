import { describe, it, expect } from 'vitest';
import GoogleIcon from './GoogleIcon';

describe('GoogleIcon', () => {
  it('renders svg element with default className and aria-hidden', () => {
    const element = GoogleIcon({});

    expect(element).not.toBeNull();
    expect(element.type).toBe('svg');
    expect(element.props.className).toBe('w-5 h-5');
    expect(element.props['aria-hidden']).toBe('true');
    expect(element.props.viewBox).toBe('0 0 24 24');
  });

  it('applies custom className passed via props', () => {
    const element = GoogleIcon({ className: 'w-4 h-4 mr-2' });

    expect(element.props.className).toBe('w-4 h-4 mr-2');
  });
});
