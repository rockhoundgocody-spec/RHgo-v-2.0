import { describe, it, expect } from 'vitest';
import FacebookIcon from './FacebookIcon';

describe('FacebookIcon', () => {
  it('renders an svg element with correct viewBox and fill attributes', () => {
    const element = FacebookIcon({ className: 'w-4 h-4' });
    expect(element).toBeDefined();
    expect(element.type).toBe('svg');
    expect(element.props.className).toBe('w-4 h-4');
    expect(element.props.viewBox).toBe('0 0 24 24');
    expect(element.props.fill).toBe('#1877F2');
  });
});
