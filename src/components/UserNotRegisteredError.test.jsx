import { describe, it, expect } from 'vitest';
import UserNotRegisteredError from './UserNotRegisteredError';

describe('UserNotRegisteredError', () => {
  it('renders correctly as a JSX component tree', () => {
    const tree = UserNotRegisteredError();
    expect(tree).not.toBeNull();
    expect(tree.type).toBe('div');
    expect(tree.props.className).toContain('flex flex-col items-center justify-center');
  });
});
