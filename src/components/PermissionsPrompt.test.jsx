import { describe, it, expect, vi } from 'vitest';
import PermissionsPrompt from './PermissionsPrompt';

vi.mock('react', async () => {
  const actual = await vi.importActual('react');
  return {
    ...actual,
    useState: (initial) => [typeof initial === 'function' ? initial() : initial, vi.fn()],
  };
});

vi.mock('@/hooks/usePermissionState', () => ({
  usePermissionState: (type) => (type === 'notifications' ? 'prompt' : 'prompt'),
}));

vi.mock('@/hooks/useServiceWorkerUpdate', () => ({
  useServiceWorkerUpdate: () => ({
    updateAvailable: false,
    applyUpdate: vi.fn(),
  }),
}));

vi.mock('./PermissionItem', () => ({
  default: () => <div data-testid="permission-item" />,
}));

vi.mock('./permissionActions', () => ({
  requestCurrentPosition: vi.fn(),
  requestNotificationPermission: vi.fn(),
}));

describe('PermissionsPrompt', () => {
  it('is a valid React component function', () => {
    expect(typeof PermissionsPrompt).toBe('function');
  });

  it('returns JSX element structure when permissions are not all granted/denied', () => {
    const element = PermissionsPrompt({ onDismiss: vi.fn() });
    expect(element).not.toBeNull();
    expect(element.props['role']).toBe('region');
    expect(element.props['aria-label']).toBe('Feature permissions');
  });
});
